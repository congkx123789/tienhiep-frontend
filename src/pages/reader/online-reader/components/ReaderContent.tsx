import React from 'react';

interface ReaderContentProps {
  content: string;
  chapterTitle: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: string;
  isCurrentChapterPlaying: boolean;
  currentSpokenSentenceId: number;
  onParagraphDoubleClick?: (pIdx: number, text: string) => void;
}

export const ReaderContent: React.FC<ReaderContentProps> = ({
  content,
  chapterTitle,
  fontSize,
  fontFamily,
  lineHeight,
  isCurrentChapterPlaying,
  currentSpokenSentenceId,
  onParagraphDoubleClick
}) => {
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

  const renderParagraphs = () => {
    const paragraphs = content.split(/\n+/);
    let sCounter = chapterTitle ? 1 : 0;

    return paragraphs.map((para, pIdx) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      const parts = trimmed.split(/([.!?。！？]+["”'’」]?\s*)/);
      const sList: string[] = [];
      let cur = "";
      for (let i = 0; i < parts.length; i++) {
        cur += parts[i];
        if (/[.!?。！？]/.test(parts[i]) || cur.length > 250) {
          if (cur.trim()) sList.push(cur.trim());
          cur = "";
        }
      }
      if (cur.trim()) sList.push(cur.trim());

      return (
        <p
          key={pIdx}
          className="mb-6 leading-relaxed select-text"
          data-para-idx={pIdx}
          onDoubleClick={() => onParagraphDoubleClick?.(pIdx, trimmed)}
          style={{ fontSize: `${fontSize}px`, lineHeight: '1.85' }}
        >
          {sList.map((st) => {
            const thisId = sCounter++;
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
      );
    });
  };

  return (
    <div
      style={{ fontSize: `${fontSize}px` }}
      className={`whitespace-pre-line break-words text-justify select-text focus:outline-none ${getFontClass()} ${getLineHeightClass()}`}
    >
      {renderParagraphs()}
    </div>
  );
};
