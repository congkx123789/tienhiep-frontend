import { useState, useEffect, useCallback } from 'react';
import { LocalBook } from './LocalReader.types';

interface UseLocalTtsSyncProps {
  activeBook: LocalBook | null;
  activeChapterIdx: number;
  activeAudioObj: any;
  setActiveAudioObj: (obj: any) => void;
}

export function useLocalTtsSync({
  activeBook,
  activeChapterIdx,
  activeAudioObj,
  setActiveAudioObj
}: UseLocalTtsSyncProps) {
  const [currentSpokenCharIdx, setCurrentSpokenCharIdx] = useState(-1);
  const [currentSpokenSentenceText, setCurrentSpokenSentenceText] = useState('');
  const [currentSpokenSentenceId, setCurrentSpokenSentenceId] = useState(-1);

  const [autoScrollTts, setAutoScrollTts] = useState(() => {
    return localStorage.getItem('tts_auto_scroll') !== 'false';
  });

  const [audioSpeed, setAudioSpeed] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      return stored.audioSpeed || 1.5;
    } catch { return 1.5; }
  });

  useEffect(() => {
    const handleSpeedChange = (e: any) => {
      if (e.detail?.audioSpeed) {
        setAudioSpeed(e.detail.audioSpeed);
      }
    };
    window.addEventListener('translationSettingsUpdated', handleSpeedChange);
    return () => window.removeEventListener('translationSettingsUpdated', handleSpeedChange);
  }, []);

  const handleToggleAutoScroll = () => {
    const newVal = !autoScrollTts;
    setAutoScrollTts(newVal);
    localStorage.setItem('tts_auto_scroll', newVal ? 'true' : 'false');
  };

  const isCurrentChapterPlaying = Boolean(
    activeAudioObj && 
    activeAudioObj.book?.id === activeBook?.id && 
    activeAudioObj.chapterIdx === activeChapterIdx
  );

  const getReadingTime = useCallback(() => {
    const contentText = activeBook?.chapters[activeChapterIdx]?.content || '';
    if (!contentText) return null;
    const wordCount = contentText.split(/\s+/).filter(Boolean).length;
    const totalSeconds = Math.round((wordCount / (150 * audioSpeed)) * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { minutes, seconds, wordCount };
  }, [activeBook, activeChapterIdx, audioSpeed]);

  useEffect(() => {
    const handleBoundary = (e: any) => {
      if (typeof e.detail?.charIdx === 'number') setCurrentSpokenCharIdx(e.detail.charIdx);
      if (e.detail?.sentenceText) setCurrentSpokenSentenceText(e.detail.sentenceText);
      if (typeof e.detail?.sentenceId === 'number') setCurrentSpokenSentenceId(e.detail.sentenceId);
    };
    window.addEventListener('global-tts-boundary', handleBoundary);
    return () => window.removeEventListener('global-tts-boundary', handleBoundary);
  }, []);

  useEffect(() => {
    if (isCurrentChapterPlaying && autoScrollTts) {
      if (currentSpokenSentenceId >= 0) {
        const el = document.getElementById('s-' + currentSpokenSentenceId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      const el = document.getElementById('active-tts-sentence');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSpokenSentenceId, currentSpokenCharIdx, currentSpokenSentenceText, isCurrentChapterPlaying, autoScrollTts]);

  const handleTTSPlay = () => {
    if (!activeBook) return;
    const currentChapter = activeBook.chapters[activeChapterIdx];
    if (!currentChapter) return;

    if (isCurrentChapterPlaying) {
      setActiveAudioObj(null);
      setCurrentSpokenCharIdx(-1);
      setCurrentSpokenSentenceText('');
    } else {
      setActiveAudioObj({
        title_vietphrase: currentChapter.title,
        author_hanviet: activeBook.author,
        description: currentChapter.content,
        isChapter: true,
        startSentenceIdx: 0,
        paragraphs: currentChapter.content.split(/\n+/),
        onBoundary: (charIdx: number, sentenceText: string, sentenceId: number) => {
          if (typeof charIdx === 'number') setCurrentSpokenCharIdx(charIdx);
          if (sentenceText) setCurrentSpokenSentenceText(sentenceText);
          if (typeof sentenceId === 'number') setCurrentSpokenSentenceId(sentenceId);
        },
        book: { id: activeBook.id, title: activeBook.title, title_vietphrase: activeBook.title },
        chapterIdx: activeChapterIdx,
        playType: 'offline'
      });
    }
  };

  const handleParagraphDoubleClick = (pIdx: number, text: string) => {
    if (!activeBook) return;
    const currentChapter = activeBook.chapters[activeChapterIdx];
    if (!currentChapter) return;

    const paragraphs = currentChapter.content.split(/\n+/);
    const validTextRegex = /\p{L}|\p{N}/u;
    let sentenceCountBefore = currentChapter.title ? 1 : 0;
    for (let pi = 0; pi < pIdx && pi < paragraphs.length; pi++) {
      const p = paragraphs[pi].trim();
      if (!p) continue;
      const parts = p.split(/([.!?。！？]+["”'’」]?\s*)/);
      let cur = "";
      for (let i = 0; i < parts.length; i++) {
        cur += parts[i];
        if (/[.!?。！？]/.test(parts[i]) || cur.length > 250) {
          if (cur.trim() && validTextRegex.test(cur.trim())) sentenceCountBefore++;
          cur = "";
        }
      }
      if (cur.trim() && validTextRegex.test(cur.trim())) sentenceCountBefore++;
    }

    setActiveAudioObj({
      title_vietphrase: currentChapter.title,
      author_hanviet: activeBook.author,
      description: currentChapter.content,
      isChapter: true,
      startSentenceIdx: sentenceCountBefore,
      startSnippet: text ? text.trim().slice(0, 40) : '',
      startParaIdx: pIdx,
      paragraphs: paragraphs,
      book: { id: activeBook.id, title: activeBook.title, title_vietphrase: activeBook.title },
      chapterIdx: activeChapterIdx,
      playType: 'offline'
    });
  };

  return {
    autoScrollTts,
    handleToggleAutoScroll,
    isCurrentChapterPlaying,
    currentSpokenCharIdx,
    currentSpokenSentenceText,
    currentSpokenSentenceId,
    audioSpeed,
    getReadingTime,
    handleTTSPlay,
    handleParagraphDoubleClick
  };
}
