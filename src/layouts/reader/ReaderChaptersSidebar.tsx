import React from 'react';

interface Chapter {
  title: string;
  active?: boolean;
}

interface ReaderChaptersSidebarProps {
  sidebarOpen: boolean;
  onClose: () => void;
  chaptersList?: Chapter[];
  onSelectChapter: (chapter: Chapter) => void;
}

export const ReaderChaptersSidebar: React.FC<ReaderChaptersSidebarProps> = ({
  sidebarOpen,
  onClose,
  chaptersList,
  onSelectChapter,
}) => {
  return (
    <>
      <div 
        className={`reader-sidebar fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-[#0f0f1a] border-l border-[#2d2d6b]/50 p-5 flex flex-col gap-4 text-slate-100 transition-transform duration-300 shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#2d2d6b]/50 pb-3">
          <h4 className="font-extrabold text-sm">Mục lục</h4>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            Đóng
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {chaptersList && chaptersList.length > 0 ? (
            chaptersList.map((chap, idx) => (
              <button 
                key={idx}
                onClick={() => { onSelectChapter(chap); onClose(); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs hover:bg-white/5 transition-colors truncate ${
                  chap.active ? 'text-brand-300 bg-brand-500/10 font-bold' : 'text-slate-400'
                }`}
              >
                {chap.title}
              </button>
            ))
          ) : (
            <p className="text-slate-500 text-xs text-center py-6">Mục lục rỗng.</p>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-45 bg-black/50 backdrop-blur-sm"
        />
      )}
    </>
  );
};
