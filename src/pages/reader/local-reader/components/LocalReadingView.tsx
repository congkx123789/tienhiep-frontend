import React, { useMemo } from 'react';
import { ArrowLeft, BookOpen, Play, Pause, Target, Eye, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { LocalBook } from '../LocalReader.types';

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
  onBackToShelf: () => void;
  onOpenToc: () => void;
  onOpenSettings: () => void;
  onTTSPlay: () => void;
  onToggleAutoScroll: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onParagraphDoubleClick: (pIdx: number, text: string) => void;
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
  onBackToShelf,
  onOpenToc,
  onOpenSettings,
  onTTSPlay,
  onToggleAutoScroll,
  onPrevChapter,
  onNextChapter,
  onParagraphDoubleClick
}) => {
  const currentChapter = activeBook.chapters[activeChapterIdx] || { title: '', content: '' };
  
  const parsedParagraphs = useMemo(() => {
    const rawParas = currentChapter.content.split(/\n+/);
    let sCounter = currentChapter.title ? 1 : 0;
    return rawParas.map((para, pIdx) => {
      const trimmed = para.trim();
      if (!trimmed) return null;
      const parts = trimmed.split(/([.!?。！？]+["”'’」]?\s*)/);
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
    }).filter(Boolean) as { pIdx: number; trimmed: string; sentences: { text: string; id: number }[] }[];
  }, [currentChapter.title, currentChapter.content]);

  const getFontClass = () => {
    if (fontFamily === 'serif') return 'font-serif';
    if (fontFamily === 'mono') return 'font-mono';
    return 'font-sans';
  };

  const getLineHeightClass = () => {
    if (lineHeight === 'loose') return 'leading-loose';
    if (lineHeight === 'relaxed') return 'leading-relaxed';
    return 'leading-normal';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Top Floating Control Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4 sticky top-14 bg-[#0b0b14]/90 backdrop-blur-md z-20">
        <button
          onClick={onBackToShelf}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121225] border border-white/5 hover:bg-white/5 text-slate-300 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> <span>Tủ sách</span>
        </button>

        <button
          onClick={onOpenToc}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121225] border border-white/5 text-purple-300 text-xs font-bold truncate max-w-[200px]"
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="truncate">{activeBook.title}</span>
        </button>

        <div className="flex items-center gap-1 bg-[#12122b] border border-purple-500/10 p-1 rounded-xl shadow-md">
          <button
            onClick={onTTSPlay}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isCurrentChapterPlaying
                ? 'bg-purple-600 text-white'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            {isCurrentChapterPlaying ? <Pause className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
            <span>{isCurrentChapterPlaying ? 'Dừng' : 'Audio AI'}</span>
          </button>

          <button
            onClick={onToggleAutoScroll}
            className={`p-1.5 rounded-lg transition-all ${
              autoScrollTts ? 'text-purple-400 bg-purple-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
            title={autoScrollTts ? "Tắt tự động cuộn" : "Bật tự động cuộn"}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chapter Title */}
      <h2
        id="s-0"
        data-sid="0"
        className={`text-xl sm:text-2xl font-black text-center mb-4 pb-3 border-b border-white/5 ${
          isCurrentChapterPlaying && currentSpokenSentenceId === 0
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

      {/* Content Rendering */}
      <div
        style={{ fontSize: `${fontSize}px` }}
        className={`whitespace-pre-line break-words text-justify select-text ${getFontClass()} ${getLineHeightClass()}`}
      >
        {parsedParagraphs.map(({ pIdx, trimmed, sentences }) => (
          <p
            key={pIdx}
            className={`mb-6 select-text ${getFontClass()} ${getLineHeightClass()}`}
            onDoubleClick={() => onParagraphDoubleClick(pIdx, trimmed)}
          >
            {sentences.map(({ text: st, id: thisId }) => {
              const isActive = isCurrentChapterPlaying && currentSpokenSentenceId === thisId;
              return (
                <span
                  key={thisId}
                  id={`s-${thisId}`}
                  data-sid={thisId}
                  className={`transition-all duration-150 inline ${
                    isActive
                      ? "bg-amber-400 text-black font-semibold px-1 py-0.5 rounded shadow-md"
                      : ""
                  }`}
                >
                  {st}{" "}
                </span>
              );
            })}
          </p>
        ))}
      </div>

      {/* Prev / Next chapter navigation */}
      <div className="flex justify-between items-center gap-4 pt-10 border-t border-white/5">
        <button
          onClick={onPrevChapter}
          disabled={activeChapterIdx <= 0}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4" /> Chương trước
        </button>

        <span className="text-xs text-slate-500 font-bold">
          {activeChapterIdx + 1} / {activeBook.chapters.length}
        </span>

        <button
          onClick={onNextChapter}
          disabled={activeChapterIdx >= activeBook.chapters.length - 1}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
        >
          Chương sau <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
