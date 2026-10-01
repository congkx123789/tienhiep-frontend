import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GoogleAd } from '../../../../components';

interface ReaderBottomNavProps {
  chapterIdx: number;
  maxChapters?: number;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  t: any;
}

export const ReaderBottomNav: React.FC<ReaderBottomNavProps> = ({
  chapterIdx,
  maxChapters = 50,
  onPrevChapter,
  onNextChapter,
  t
}) => {
  return (
    <>
      <GoogleAd slot="reader-bottom" />

      <div className="flex justify-between items-center gap-4 pt-12 border-t border-slate-500/10 reader-overlay">
        <button
          onClick={onPrevChapter}
          disabled={chapterIdx <= 1}
          className="flex items-center gap-1.5 px-5 py-3 border border-slate-500/20 rounded-xl hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> {t.reader?.prevChapter || "Chương trước"}
        </button>

        <button
          onClick={onNextChapter}
          disabled={chapterIdx >= maxChapters}
          className="flex items-center gap-1.5 px-5 py-3 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-xl hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all"
        >
          {t.reader?.nextChapter || "Chương sau"} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
