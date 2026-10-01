import React, { useState } from 'react';
import { Search, X, BookOpen, Check } from 'lucide-react';
import { LocalBook } from '../LocalReader.types';

interface LocalTocDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeBook: LocalBook;
  activeChapterIdx: number;
  onSelectChapter: (idx: number) => void;
}

export const LocalTocDrawer: React.FC<LocalTocDrawerProps> = ({
  isOpen,
  onClose,
  activeBook,
  activeChapterIdx,
  onSelectChapter
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const chapters = activeBook.chapters || [];
  const filtered = chapters
    .map((c, i) => ({ ...c, originalIdx: i }))
    .filter(c => !search.trim() || c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0c0d1e] border-l border-white/10 h-full flex flex-col p-4 space-y-4 animate-slideLeft shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Mục Lục ({chapters.length} chương)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên chương..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#080814] border border-[#1f1f3a] text-white text-xs outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 divide-y divide-white/[0.03]">
          {filtered.map((chap) => {
            const isActive = chap.originalIdx === activeChapterIdx;
            return (
              <button
                key={chap.originalIdx}
                onClick={() => { onSelectChapter(chap.originalIdx); onClose(); }}
                className={`w-full text-left py-2.5 px-3 rounded-xl text-xs flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 font-bold border border-purple-500/30'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="truncate">{chap.title}</span>
                {isActive && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
