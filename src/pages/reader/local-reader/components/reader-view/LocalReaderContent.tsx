import React from 'react';
import { CircularProgress } from '../../../../../components/common/CircularProgress';

export interface ParsedParagraph {
  pIdx: number;
  trimmed: string;
  sentences: { text: string; id: number }[];
}

interface LocalReaderContentProps {
  fontSize: number;
  fontClass: string;
  lineHeightClass: string;
  isTranslating: boolean;
  translateProgress: number;
  bookTitle: string;
  chapterNumber: number;
  parsedParagraphs: ParsedParagraph[];
  isCurrentChapterPlaying: boolean;
  currentSpokenSentenceId: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onParagraphPointerUp: (e: React.PointerEvent, pIdx: number, text: string) => void;
  onParagraphDoubleClick: (pIdx: number, text: string) => void;
}

export const LocalReaderContent: React.FC<LocalReaderContentProps> = ({
  fontSize,
  fontClass,
  lineHeightClass,
  isTranslating,
  translateProgress,
  bookTitle,
  chapterNumber,
  parsedParagraphs,
  isCurrentChapterPlaying,
  currentSpokenSentenceId,
  onPointerDown,
  onParagraphPointerUp,
  onParagraphDoubleClick,
}) => {
  return (
    <div
      style={{ fontSize: `${fontSize}px` }}
      className={`whitespace-pre-line break-words text-justify select-text ${fontClass} ${lineHeightClass}`}
    >
      {parsedParagraphs.length === 0 ? (
        isTranslating ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="p-8 rounded-3xl bg-[#12122b]/80 border border-purple-500/20 shadow-2xl backdrop-blur-xl flex flex-col items-center max-w-sm w-full">
              <CircularProgress
                progress={translateProgress}
                size={96}
                strokeWidth={7}
                subtitle="Đang dịch nội dung chương..."
                detail={`${bookTitle} • Chương ${chapterNumber}`}
                gradientStart="#818cf8"
                gradientEnd="#c084fc"
              />
              <div className="mt-4 flex items-center gap-2 text-xs text-purple-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>Dịch phân đoạn câu offline AI...</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3.5 bg-white/5 rounded-full animate-pulse" style={{ width: `${75 + (i % 3) * 10}%` }} />
                <div className="h-3.5 bg-white/5 rounded-full animate-pulse" style={{ width: `${60 + (i % 4) * 8}%` }} />
                <div className="h-3.5 bg-white/5 rounded-full animate-pulse" style={{ width: '85%' }} />
              </div>
            ))}
          </div>
        )
      ) : (
        parsedParagraphs.map(({ pIdx, trimmed, sentences }) => (
          <p
            key={pIdx}
            className={`mb-6 select-text cursor-pointer rounded-lg px-1 transition-colors duration-100
              hover:bg-purple-500/5 active:bg-purple-500/10
              ${fontClass} ${lineHeightClass}`}
            onPointerDown={onPointerDown}
            onPointerUp={(e) => onParagraphPointerUp(e, pIdx, trimmed)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onParagraphDoubleClick(pIdx, trimmed);
            }}
            title="Click / Chạm nhả để mở tùy chọn • Double-click để phát TTS"
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
        ))
      )}
    </div>
  );
};
