import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services';
import { AudioPlayerBook } from './AudioPlayer.types';
import { getLocalTtsHost, isSpeechSynthesisAvailable, logTrace, ensureLocalEngineRunning, fetchAudioBlob } from './ttsEngineHelper';

export function usePlayerSpeech(book: AudioPlayerBook | null, onNextChapter?: () => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [ttsEngine, setTtsEngine] = useState(() => {
    const saved = localStorage.getItem('local_tts_engine');
    if (saved === 'browser' && !isSpeechSynthesisAvailable()) return 'local';
    return saved || 'local';
  });

  const [matchaApiKey, setMatchaApiKey] = useState(() => localStorage.getItem('local_tts_api_key') || '');
  const [matchaVoice, setMatchaVoice] = useState(() => localStorage.getItem('local_tts_voice') || 'the_gioi_hoan_my');
  const [rate, setRate] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      return stored.audioSpeed || 1.5;
    } catch { return 1.5; }
  });
  const [pitch] = useState(1.0);
  const [volume, setVolume] = useState(() => {
    try {
      const v = localStorage.getItem('tts_player_volume');
      return v !== null ? parseFloat(v) : 1.0;
    } catch { return 1.0; }
  });

  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');

  const synthRef = useRef<any>(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sentencesRef = useRef<string[]>([]);
  const currentSentenceIdxRef = useRef(0);
  const audioCacheRef = useRef<Record<number, HTMLAudioElement>>({});
  const prefetchQueueRef = useRef(new Set<number>());
  const playSessionIdRef = useRef(0);
  const triggeredIndicesRef = useRef(new Set<number>());
  const rateRef = useRef(rate);
  rateRef.current = rate;
  const userPausedRef = useRef(false);
  const lastPlaybackProgressTimeRef = useRef(Date.now());
  const lastPlaybackPositionRef = useRef(0);
  const triggerNextRef = useRef<any>(null);

  const cleanupAudio = (aud: HTMLAudioElement | null) => {
    if (!aud) return;
    try {
      aud.onplay = null; aud.onplaying = null; aud.onpause = null; aud.onended = null;
      aud.ontimeupdate = null; aud.onerror = null; aud.pause();
    } catch {}
  };

  const emitBoundary = useCallback((currentIdx: number) => {
    if (!sentencesRef.current || !sentencesRef.current[currentIdx]) return;
    let estimatedCharIdx = 0;
    for (let i = 0; i < currentIdx; i++) {
      estimatedCharIdx += (sentencesRef.current[i] || '').length + 1;
    }
    const currentSentence = sentencesRef.current[currentIdx] || '';
    if (typeof book?.onBoundary === 'function') {
      try { book.onBoundary(estimatedCharIdx, currentSentence, currentIdx); } catch {}
    }
    window.dispatchEvent(new CustomEvent('global-tts-boundary', {
      detail: { charIdx: estimatedCharIdx, sentenceText: currentSentence, sentenceId: currentIdx }
    }));
  }, [book]);



  const fetchMatchaAudio = async (idx: number, targetSessionId: number | null = null): Promise<HTMLAudioElement | null> => {
    const expectedSession = targetSessionId !== null ? targetSessionId : playSessionIdRef.current;
    if (idx >= sentencesRef.current.length) return null;
    if (audioCacheRef.current[idx]) return audioCacheRef.current[idx];

    let textToSend = (sentencesRef.current[idx] || '').trim().replace(/^[“"'\s«『「]+|[”"'\s»』」]+$/gu, '').trim();
    if (textToSend && !textToSend.endsWith('...') && !/[!?…:;]$/.test(textToSend)) textToSend += '...';

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
      if (book?.isChapter && onNextChapter) onNextChapter();
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
        audio = (await fetchMatchaAudio(idx)) || undefined as any;
      } catch {
        setIsLoading(false);
        if (idx === currentSentenceIdxRef.current) playSentence(idx + 1, mySessionId);
        return;
      }
    }

    if (mySessionId !== playSessionIdRef.current || userPausedRef.current || !audio) {
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    audioRef.current = audio;
    audio.playbackRate = rateRef.current;
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
    if (audioRef.current) {
      cleanupAudio(audioRef.current);
      audioRef.current = null;
    }
    if (synthRef.current) synthRef.current.cancel();
    if (audioCacheRef.current) {
      Object.values(audioCacheRef.current).forEach(a => {
        try { if (a.src?.startsWith('blob:')) URL.revokeObjectURL(a.src); } catch {}
      });
      audioCacheRef.current = {};
    }
    prefetchQueueRef.current.clear();
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
    handleSaveEngine: (e: string) => { setTtsEngine(e); localStorage.setItem('local_tts_engine', e); },
    handleSaveVoice: (v: string) => { setMatchaVoice(v); localStorage.setItem('local_tts_voice', v); },
    handleSaveApiKey: (k: string) => { setMatchaApiKey(k); localStorage.setItem('local_tts_api_key', k); },
    setSelectedVoiceName,
    handleSaveRate: (r: number) => {
      setRate(r);
      try {
        const stored = JSON.parse(localStorage.getItem('translationSettings') || '{}');
        stored.audioSpeed = r;
        localStorage.setItem('translationSettings', JSON.stringify(stored));
      } catch {}
    },
    handleVolumeChange: (vol: number) => {
      setVolume(vol);
      volumeRef.current = vol;
      localStorage.setItem('tts_player_volume', String(vol));
      if (audioRef.current) audioRef.current.volume = vol;
    },
    handleSeekBarClick: (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seekToSentence(Math.floor(pct * (sentencesRef.current?.length || 1)));
    },
    handleSeekBarTouch: (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0] || e.changedTouches?.[0];
      if (!touch) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      seekToSentence(Math.floor(pct * (sentencesRef.current?.length || 1)));
    }
  };
}
