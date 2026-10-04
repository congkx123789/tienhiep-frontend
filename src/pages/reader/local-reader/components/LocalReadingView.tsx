import React, { useMemo, useState, useCallback, useRef } from 'react';
import { LocalBook } from '../LocalReader.types';
import { TranslateMode } from '../useLocalTranslate';
import { ParagraphContextMenu, ParagraphMenuState } from './ParagraphContextMenu';
import Footer from '../../../../components/common/Footer';
import { LocalReaderHeader } from './reader-view/LocalReaderHeader';
import { LocalReaderNav } from './reader-view/LocalReaderNav';
import { LocalReaderContent, ParsedParagraph } from './reader-view/LocalReaderContent';

interface LocalReadingViewProps {
  activeBook: LocalBook;
  activeChapterIdx: number;
  fontSize: number;
  fontFamily: string;
  lineHeight: string;
  isCurrentChapterPlaying: boolean;
  currentSpokenSentenceId: number;
  autoScrollTts: boolean;
  audioSpeed: number;
  readingTime: { minutes: number; seconds: number; wordCount: number } | null;
  /** Nội dung đã dịch (hoặc bản gốc nếu mode=raw) */
  translatedContent: string;
  isTranslating: boolean;
  translateMode: TranslateMode;
  /** Tiến độ dịch 0-100 */
  translateProgress: number;
  onChangeTranslateMode: (mode: TranslateMode) => void;
  onBackToShelf: () => void;
  onOpenToc: () => void;
  onOpenSettings: () => void;
  onTTSPlay: () => void;
  onToggleAutoScroll: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onParagraphDoubleClick: (pIdx: number, text: string) => void;
  onSaveParagraphEdit?: (pIdx: number, newText: string) => void;
}

export const LocalReadingView: React.FC<LocalReadingViewProps> = ({
  activeBook,
  activeChapterIdx,
  fontSize,
  fontFamily,
  lineHeight,
  isCurrentChapterPlaying,
  currentSpokenSentenceId,
  autoScrollTts,
  audioSpeed,
  readingTime,
  translatedContent,
  isTranslating,
  translateMode,
  translateProgress,
  onChangeTranslateMode,
  onBackToShelf,
  onOpenToc,
  onTTSPlay,
  onToggleAutoScroll,
  onPrevChapter,
  onNextChapter,
  onParagraphDoubleClick,
  onSaveParagraphEdit
}) => {
  const currentChapter = activeBook.chapters[activeChapterIdx] || { title: '', content: '' };
  const [paragraphMenu, setParagraphMenu] = useState<ParagraphMenuState | null>(null);

  // Build danh sách đoạn đã dịch + ánh xạ sang bản gốc
  const rawParagraphs = useMemo(() =>
    (currentChapter.content || '').split(/\n+/).filter(p => p.trim()),
    [currentChapter.content]
  );

  const parsedParagraphs: ParsedParagraph[] = useMemo(() => {
    const rawParas = translatedContent.split(/\n+/);
    let sCounter = currentChapter.title ? 1 : 0;
    return rawParas.map((para, pIdx) => {
      const trimmed = para.trim();
      if (!trimmed) return null;
      const parts = trimmed.split(/([.!?。！？]+[""''」]?\s*)/);
      const sentences: { text: string; id: number }[] = [];
      let cur = "";
      for (let i = 0; i < parts.length; i++) {
        cur += parts[i];
        if (/[.!?。！？]/.test(parts[i]) || cur.length > 250) {
          if (cur.trim()) sentences.push({ text: cur.trim(), id: sCounter++ });
          cur = "";
        }
      }
      if (cur.trim()) sentences.push({ text: cur.trim(), id: sCounter++ });
      return { pIdx, trimmed, sentences };
    }).filter(Boolean) as ParsedParagraph[];
  }, [currentChapter.title, translatedContent]);

  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const lineHeightClass = lineHeight === 'loose' ? 'leading-loose' : lineHeight === 'relaxed' ? 'leading-relaxed' : 'leading-normal';

  const pointerDownPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  }, []);

  const handleParagraphPointerUp = useCallback((
    e: React.PointerEvent,
    pIdx: number,
    translatedText: string
  ) => {
    if (!pointerDownPosRef.current) return;
    const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
    pointerDownPosRef.current = null;

    if (dx > 10 || dy > 10) return;

    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    const rawText = rawParagraphs[pIdx] || translatedText;
    setParagraphMenu({
      pIdx,
      translatedText,
      rawText,
      x: e.clientX,
      y: e.clientY
    });
  }, [rawParagraphs]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <LocalReaderHeader
        activeBook={activeBook}
        isCurrentChapterPlaying={isCurrentChapterPlaying}
        autoScrollTts={autoScrollTts}
        translateMode={translateMode}
        isTranslating={isTranslating}
        translateProgress={translateProgress}
        onBackToShelf={onBackToShelf}
        onOpenToc={onOpenToc}
        onTTSPlay={onTTSPlay}
        onToggleAutoScroll={onToggleAutoScroll}
        onChangeTranslateMode={onChangeTranslateMode}
      />

      {/* ── Chapter Title ── */}
      <h2
        id="s-0"
        data-sid="0"
        className={`text-xl sm:text-2xl font-black text-center mb-4 pb-3 border-b border-white/5 ${isCurrentChapterPlaying && currentSpokenSentenceId === 0
            ? 'text-amber-400 bg-amber-500/10 py-2 rounded-xl'
            : 'text-white'
          }`}
      >
        {currentChapter.title}
      </h2>

      {readingTime && (
        <div className="text-center text-[10px] text-slate-400 -mt-2">
          <span>⏱️ ~{readingTime.minutes} phút {readingTime.seconds} giây (tốc độ {audioSpeed.toFixed(1)}x)</span>
          <span> • </span>
          <span>📝 {readingTime.wordCount} từ</span>
        </div>
      )}

      {/* ── Content Rendering ── */}
      <LocalReaderContent
        fontSize={fontSize}
        fontClass={fontClass}
        lineHeightClass={lineHeightClass}
        isTranslating={isTranslating}
        translateProgress={translateProgress}
        bookTitle={activeBook.title}
        chapterNumber={activeChapterIdx + 1}
        parsedParagraphs={parsedParagraphs}
        isCurrentChapterPlaying={isCurrentChapterPlaying}
        currentSpokenSentenceId={currentSpokenSentenceId}
        onPointerDown={handlePointerDown}
        onParagraphPointerUp={handleParagraphPointerUp}
        onParagraphDoubleClick={onParagraphDoubleClick}
      />

      {/* ── Prev / Next Chapter Navigation ── */}
      <LocalReaderNav
        activeChapterIdx={activeChapterIdx}
        totalChapters={activeBook.chapters.length}
        onPrevChapter={onPrevChapter}
        onNextChapter={onNextChapter}
      />

      {/* ── Footer chân trang ── */}
      <div className="pt-8 border-t border-white/5">
        <Footer />
      </div>

      {/* ── Paragraph Context Menu ── */}
      <ParagraphContextMenu
        menu={paragraphMenu}
        translateMode={translateMode}
        onClose={() => setParagraphMenu(null)}
        onPlayFromHere={(pIdx, text) => onParagraphDoubleClick(pIdx, text)}
        onSaveParagraphEdit={onSaveParagraphEdit}
      />
    </div>
  );
};
