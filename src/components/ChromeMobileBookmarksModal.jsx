import React, { useState } from 'react';
import { Star, X, Trash2, ExternalLink, Globe, Search, Plus } from 'lucide-react';

export default function ChromeMobileBookmarksModal({
  isOpen,
  onClose,
  bookmarks = [],
  onSelectBookmark,
  onDeleteBookmark,
  onAddCurrentPage,
  currentUrl,
  currentTitle
}) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = bookmarks.filter(b => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (b.title && b.title.toLowerCase().includes(q)) || (b.url && b.url.toLowerCase().includes(q));
  });

  const isCurrentBookmarked = currentUrl && bookmarks.some(b => b.url === currentUrl);

  return (
    <div className="fixed inset-0 z-[200000] bg-black/70 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-fade-in">
      <div 
        className="w-full sm:max-w-md h-[65vh] max-h-[85vh] bg-[#181822] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Dấu trang (Bookmarks)</h3>
              <p className="text-[11px] text-slate-400">{bookmarks.length} trang đã lưu</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add Current Page Action */}
        {currentUrl && currentUrl !== 'about:newtab' && !isCurrentBookmarked && onAddCurrentPage && (
          <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Star className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-amber-300 block truncate">{currentTitle || 'Trang hiện tại'}</span>
                <span className="text-[10px] text-amber-400/80 block truncate">{currentUrl}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onAddCurrentPage}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shrink-0 transition-transform active:scale-95"
            >
              + Đánh dấu
            </button>
          </div>
        )}

        {/* Search */}
        {bookmarks.length > 3 && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus-within:border-amber-400">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm dấu trang..."
                className="bg-transparent text-xs text-white placeholder-slate-400 outline-none flex-1"
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')}>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-3">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">Chưa có dấu trang nào</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Nhấn biểu tượng ngôi sao ⭐️ trong menu trình duyệt để lưu lại các trang web hay chương truyện ưa thích.
              </p>
            </div>
          ) : (
            filtered.map(bm => (
              <div
                key={bm.id || bm.url}
                className="group flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/30 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => {
                  onSelectBookmark(bm.url);
                  onClose();
                }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 block truncate">
                      {bm.title || bm.url}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                      {bm.url}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onDeleteBookmark(bm.id || bm.url)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Xóa dấu trang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
