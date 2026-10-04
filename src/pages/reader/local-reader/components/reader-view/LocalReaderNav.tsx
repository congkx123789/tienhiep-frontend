import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LocalReaderNavProps {
  activeChapterIdx: number;
  totalChapters: number;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

export const LocalReaderNav: React.FC<LocalReaderNavProps> = ({
  activeChapterIdx,
  totalChapters,
  onPrevChapter,
  onNextChapter,
}) => {
  return (
    <div className="flex justify-between items-center gap-4 pt-10 border-t border-white/5">
      <button
        onClick={onPrevChapter}
        disabled={activeChapterIdx <= 0}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
      >
        <ChevronLeft className="w-4 h-4" /> Chương trước
      </button>

      <span className="text-xs text-slate-500 font-bold">
        {activeChapterIdx + 1} / {totalChapters}
      </span>

      <button
        onClick={onNextChapter}
        disabled={activeChapterIdx >= totalChapters - 1}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
      >
        Chương sau <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
