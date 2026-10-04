import React, { useRef } from 'react';

interface ReaderContentProps {
  content: string;
  chapterTitle: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: string;
  isCurrentChapterPlaying: boolean;
  currentSpokenSentenceId: number;
  onParagraphClick?: (e: React.MouseEvent | { clientX: number; clientY: number }, pIdx: number, text: string) => void;
  onParagraphDoubleClick?: (pIdx: number, text: string) => void;
  onTextSelect?: (selectedText: string, pIdx: number, x: number, y: number) => void;
}

export const ReaderContent: React.FC<ReaderContentProps> = ({
  content,
  chapterTitle,
  fontSize,
  fontFamily,
  lineHeight,
  isCurrentChapterPlaying,
  currentSpokenSentenceId,
  onParagraphClick,
  onParagraphDoubleClick,
  onTextSelect
}) => {
  const pointerDownPos = useRef<{ x: number; y: number; time: number } | null>(null);

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

  // Hỗ trợ cả ấn chuột / nhả chuột và chạm cảm ứng điện thoại
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent, pIdx: number, trimmed: string) => {
    const sel = window.getSelection();
    const selText = sel ? sel.toString().trim() : '';

    // Nếu người dùng bôi đen văn bản, bắt tọa độ và mở đối chiếu cặp từ ngay tại chỗ
    if (selText.length > 0 && selText.length <= 100 && sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      pointerDownPos.current = null;
      onTextSelect?.(selText, pIdx, rect.left + rect.width / 2, rect.top);
      return;
    }

    if (!pointerDownPos.current) return;
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);
    pointerDownPos.current = null;

    if (dx > 10 || dy > 10) return;

    onParagraphClick?.(e, pIdx, trimmed);
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
          className={`mb-6 select-text cursor-pointer rounded-xl px-2 py-1 transition-colors duration-150 hover:bg-purple-500/10 active:bg-purple-500/20 ${getFontClass()} ${getLineHeightClass()}`}
          data-para-idx={pIdx}
          onPointerDown={handlePointerDown}
          onPointerUp={(e) => handlePointerUp(e, pIdx, trimmed)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onParagraphDoubleClick?.(pIdx, trimmed);
          }}
          style={{ fontSize: `${fontSize}px` }}
          title="Click / Chạm để mở menu chọn đoạn • Double-click để phát Audio ngay"
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

