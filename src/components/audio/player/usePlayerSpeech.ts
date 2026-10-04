import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services';
import { AudioPlayerBook } from './AudioPlayer.types';
import { fetchAudioBlob, splitAndMergeSentences } from './ttsEngineHelper';
import { useSpeechSettings } from './useSpeechSettings';

export function usePlayerSpeech(book: AudioPlayerBook | null, onNextChapter?: () => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const {
    ttsEngine, matchaApiKey, matchaVoice,
    rate, rateRef, volume, volumeRef,
    voices, selectedVoiceName, setSelectedVoiceName,
    handleSaveEngine, handleSaveVoice, handleSaveApiKey,
    handleSaveRate, handleVolumeChange
  } = useSpeechSettings();

  const synthRef = useRef<any>(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sentencesRef = useRef<string[]>([]);
  const currentSentenceIdxRef = useRef(0);
  const audioCacheRef = useRef<Record<number, HTMLAudioElement>>({});
  const prefetchQueueRef = useRef(new Set<number>());
  const playSessionIdRef = useRef(0);
  const triggeredIndicesRef = useRef(new Set<number>());
  const userPausedRef = useRef(false);
  const lastPlaybackProgressTimeRef = useRef(Date.now());
  const lastPlaybackPositionRef = useRef(0);
  const triggerNextRef = useRef<any>(null);
  const errCountRef = useRef(0);

  const cleanupAudio = (aud: HTMLAudioElement | null) => {
    if (!aud) return;
    try {
      aud.onplay = null; aud.onplaying = null; aud.onpause = null; aud.onended = null;
      aud.ontimeupdate = null; aud.onerror = null; aud.pause();
    } catch {}
  };

  const clearAudioAndCache = () => {
    if (audioRef.current) { cleanupAudio(audioRef.current); audioRef.current = null; }
    if (synthRef.current) synthRef.current.cancel();
    if (audioCacheRef.current) {
      Object.values(audioCacheRef.current).forEach(a => {
        try { if (a?.src?.startsWith('blob:')) URL.revokeObjectURL(a.src); } catch {}
      });
      audioCacheRef.current = {};
    }
    prefetchQueueRef.current.clear();
  };

  const emitBoundary = useCallback((currentIdx: number) => {
    if (!sentencesRef.current || !sentencesRef.current[currentIdx]) return;
    let estimatedCharIdx = 0;
    for (let i = 0; i < currentIdx; i++) estimatedCharIdx += (sentencesRef.current[i] || '').length + 1;
    const currentSentence = sentencesRef.current[currentIdx] || '';
    if (typeof book?.onBoundary === 'function') {
      try { book.onBoundary(estimatedCharIdx, currentSentence, currentIdx); } catch {}
    }
    window.dispatchEvent(new CustomEvent('global-tts-boundary', {
      detail: { charIdx: estimatedCharIdx, sentenceText: currentSentence, sentenceId: currentIdx + 1, sentenceIdx: currentIdx }
    }));
  }, [book]);

  useEffect(() => {
    if (!book) return;
    const rawContent = (book as any).currentChapterContent || book.description || (book as any).content || '';
    if (!rawContent || !rawContent.trim()) return;

    clearAudioAndCache();
    errCountRef.current = 0;
    const finalSentences = splitAndMergeSentences(rawContent);
    sentencesRef.current = finalSentences.length > 0 ? finalSentences : [rawContent.trim()];
    userPausedRef.current = false;

    let startIdx = 0;
    const snippet = (book.startSnippet || (book as any).startParagraphSnippet || '').trim();
    if (snippet && snippet.length >= 4) {
      const cleanSnip = snippet.replace(/^[“"'\s«『「]+|[”"'\s»』」]+$/gu, '').slice(0, 30).toLowerCase();
      const foundIdx = sentencesRef.current.findIndex(s => s.toLowerCase().includes(cleanSnip));
      if (foundIdx !== -1) {
        startIdx = foundIdx;
      } else {
        startIdx = Math.max(0, Math.min(book.startSentenceIdx || 0, sentencesRef.current.length - 1));
      }
    } else {
      startIdx = Math.max(0, Math.min(book.startSentenceIdx || 0, sentencesRef.current.length - 1));
    }

    currentSentenceIdxRef.current = startIdx;
    playSessionIdRef.current += 1;
    triggeredIndicesRef.current.clear();
    playSentence(startIdx, playSessionIdRef.current);
    return () => clearAudioAndCache();
  }, [book?.title, (book as any)?.currentChapterTitle, (book as any)?.currentChapterContent, book?.description, book?.startSentenceIdx, book?.startSnippet]);

  const fetchMatchaAudio = async (idx: number, targetSessionId: number | null = null): Promise<HTMLAudioElement | null> => {
    const expectedSession = targetSessionId !== null ? targetSessionId : playSessionIdRef.current;
    if (idx >= sentencesRef.current.length) return null;
    if (audioCacheRef.current[idx]) return audioCacheRef.current[idx];

    const textToSend = (sentencesRef.current[idx] || '').trim();
    if (!textToSend) return null;

    const audioUrl = await fetchAudioBlob(textToSend, ttsEngine, matchaVoice, matchaApiKey, rateRef.current, api);
    if (expectedSession !== playSessionIdRef.current) {
      if (audioUrl?.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
      return null;
    }

    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    audio.load();
    audioCacheRef.current[idx] = audio;
    return audio;
  };

  const prefetchSentence = (idx: number, targetSessionId: number | null = null) => {
    const expectedSession = targetSessionId !== null ? targetSessionId : playSessionIdRef.current;
    if (idx >= sentencesRef.current.length || idx < 0) return;
    if (audioCacheRef.current[idx] || prefetchQueueRef.current.has(idx)) return;
    prefetchQueueRef.current.add(idx);
    fetchMatchaAudio(idx, expectedSession)
      .then(() => prefetchQueueRef.current.delete(idx))
      .catch(() => prefetchQueueRef.current.delete(idx));
  };

  const playSentence = async (idx: number, sessionId: number | null = null) => {
    const mySessionId = sessionId !== null ? sessionId : playSessionIdRef.current;
    if (idx >= sentencesRef.current.length) {
      if (mySessionId !== playSessionIdRef.current) return;
      setIsPlaying(false);
      setProgress(100);
      if (onNextChapter) onNextChapter();
      return;
    }

    currentSentenceIdxRef.current = idx;
    setProgress(Math.round((idx / sentencesRef.current.length) * 100));

    const triggerNext = (currentIdx: number) => {
      if (triggeredIndicesRef.current.has(currentIdx)) return;
      if (mySessionId !== playSessionIdRef.current || currentIdx !== currentSentenceIdxRef.current) return;
      triggeredIndicesRef.current.add(currentIdx);
      const nextIdx = currentIdx + 1;
      if (userPausedRef.current) return;
      playSentence(nextIdx, mySessionId);
    };
    triggerNextRef.current = triggerNext;

    if (audioRef.current) {
      cleanupAudio(audioRef.current);
      audioRef.current = null;
    }

    let audio = audioCacheRef.current[idx];
    if (!audio) {
      setIsLoading(true);
      try {
        audio = (await fetchMatchaAudio(idx)) || (undefined as any);
        errCountRef.current = 0;
      } catch {
        setIsLoading(false);
        errCountRef.current += 1;
        if (errCountRef.current >= 3) {
          setIsPlaying(false);
          return;
        }
        if (idx === currentSentenceIdxRef.current) setTimeout(() => playSentence(idx + 1, mySessionId), 300);
        return;
      }
    }

    if (mySessionId !== playSessionIdRef.current || userPausedRef.current || !audio) {
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    audioRef.current = audio;
    audio.playbackRate = (ttsEngine === 'local') ? 1.0 : rateRef.current;
    audio.volume = Math.max(0, Math.min(1.0, volumeRef.current || 1.0));

    audio.onplay = () => {
      if (mySessionId !== playSessionIdRef.current) return;
      setIsLoading(false);
      setIsPlaying(true);
      emitBoundary(idx);
    };
    audio.onended = () => triggerNext(idx);
    audio.ontimeupdate = () => {
      lastPlaybackPositionRef.current = audio.currentTime;
      lastPlaybackProgressTimeRef.current = Date.now();
      if (audio.duration && audio.duration > 0.3 && (audio.duration - audio.currentTime) <= 0.06) {
        triggerNext(idx);
      }
    };

    audio.play().then(() => {
      setIsPlaying(true);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    prefetchSentence(idx + 1, mySessionId);
    prefetchSentence(idx + 2, mySessionId);
  };

  const stopSpeaking = useCallback(() => {
    userPausedRef.current = true;
    playSessionIdRef.current += 1;
    triggeredIndicesRef.current.clear();
    clearAudioAndCache();
    sentencesRef.current = [];
    currentSentenceIdxRef.current = 0;
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const seekToSentence = (targetIdx: number) => {
    if (!sentencesRef.current || sentencesRef.current.length === 0) return;
    const clamped = Math.max(0, Math.min(targetIdx, sentencesRef.current.length - 1));
    userPausedRef.current = false;
    currentSentenceIdxRef.current = clamped;
    emitBoundary(clamped);
    setProgress(Math.round((clamped / sentencesRef.current.length) * 100));

    if (audioRef.current) {
      cleanupAudio(audioRef.current);
      audioRef.current = null;
    }
    playSessionIdRef.current += 1;
    triggeredIndicesRef.current.clear();
    playSentence(clamped, playSessionIdRef.current);
  };

  const togglePlay = () => {
    if (isPlaying) {
      userPausedRef.current = true;
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      userPausedRef.current = false;
      if (audioRef.current && !audioRef.current.ended) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => playSentence(currentSentenceIdxRef.current));
      } else {
        playSentence(currentSentenceIdxRef.current);
      }
    }
  };

  return {
    isPlaying, isLoading, progress, ttsEngine, matchaApiKey, matchaVoice,
    rate, volume, voices, selectedVoiceName,
    totalSentences: sentencesRef.current?.length || 0,
    currentSentenceDisplay: Math.min(currentSentenceIdxRef.current + 1, sentencesRef.current?.length || 0),
    togglePlay, stopSpeaking, seekToSentence,
    skipForward: () => seekToSentence(currentSentenceIdxRef.current + 1),
    skipBackward: () => seekToSentence(currentSentenceIdxRef.current - 1),
    handleSaveEngine, handleSaveVoice, handleSaveApiKey,
    setSelectedVoiceName, handleSaveRate,
    handleVolumeChange: (vol: number) => handleVolumeChange(vol, audioRef.current),
    handleSeekBarClick: (e: React.MouseEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      seekToSentence(Math.floor(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (sentencesRef.current?.length || 1)));
    },
    handleSeekBarTouch: (e: React.TouchEvent<HTMLDivElement>) => {
      const t = e.touches[0] || e.changedTouches?.[0];
      if (!t) return;
      const r = e.currentTarget.getBoundingClientRect();
      seekToSentence(Math.floor(Math.max(0, Math.min(1, (t.clientX - r.left) / r.width)) * (sentencesRef.current?.length || 1)));
    }
  };
}
