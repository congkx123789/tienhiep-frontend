import React from 'react';
import { BookOpen, Plus, Trash2, Check, ArrowRight, HardDrive } from 'lucide-react';
import { LocalBook, StorageInfo } from '../LocalReader.types';

interface LocalBookShelfProps {
  localBooks: LocalBook[];
  storageInfo: StorageInfo | null;
  isEditMode: boolean;
  setIsEditMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  selectedBookIds: Set<string>;
  onToggleSelectBook: (id: string) => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onSelectBook: (book: LocalBook) => void;
  onDeleteBook: (id: string) => void;
  onOpenImportModal: () => void;
  onClearAllData: () => void;
}

export const LocalBookShelf: React.FC<LocalBookShelfProps> = ({
  localBooks,
  storageInfo,
  isEditMode,
  setIsEditMode,
  selectedBookIds,
  onToggleSelectBook,
  onSelectAll,
  onDeleteSelected,
  onSelectBook,
  onDeleteBook,
  onOpenImportModal,
  onClearAllData
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-400" /> Tủ Sách Ngoại Tuyến (Offline)
          </h1>
          <p className="text-xs text-slate-400 mt-1">Đọc sách EPUB, TXT không cần internet, lưu trữ vô hạn trên thiết bị.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {storageInfo && (
            <div className="px-3 py-1.5 rounded-xl bg-[#121225] border border-white/5 text-[11px] text-slate-400 flex items-center gap-1.5 font-bold">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              <span>{storageInfo.usage} MB / {storageInfo.quota} MB</span>
            </div>
          )}

          {localBooks.length > 0 && (
            <button
              onClick={() => setIsEditMode(v => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isEditMode
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-[#121225] border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {isEditMode ? 'Xong' : 'Chọn nhiều'}
            </button>
          )}

          <button
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-extrabold text-xs transition-all shadow-md shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" /> Nạp Sách Mới
          </button>
        </div>
      </div>

      {/* Edit Mode actions bar */}
      {isEditMode && localBooks.length > 0 && (
        <div className="p-3 bg-[#171433] border border-purple-500/30 rounded-2xl flex items-center justify-between gap-2 animate-fadeIn">
          <button
            onClick={onSelectAll}
            className="text-xs font-bold text-purple-300 hover:text-white"
          >
            {selectedBookIds.size === localBooks.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300">Đã chọn: <strong>{selectedBookIds.size}</strong></span>
            <button
              onClick={onDeleteSelected}
              disabled={selectedBookIds.size === 0}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs"
            >
              Xóa đã chọn
            </button>
          </div>
        </div>
      )}

      {/* Books Grid */}
      {localBooks.length === 0 ? (
        <div className="py-24 text-center text-slate-500 bg-[#121225]/40 rounded-3xl border border-white/5 space-y-3">
          <BookOpen className="w-12 h-12 mx-auto opacity-30 text-purple-400" />
          <p className="text-sm font-bold text-slate-400">Tủ sách offline của bạn đang trống</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hãy tải hoặc nạp tệp sách EPUB, TXT để bắt đầu thưởng thức offline bất cứ lúc nào!
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenImportModal}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
            >
              Nạp sách đầu tiên
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {localBooks.map((book) => {
            const isSelected = selectedBookIds.has(book.id);
            return (
              <div
                key={book.id}
                onClick={() => {
                  if (isEditMode) onToggleSelectBook(book.id);
                  else onSelectBook(book);
                }}
                className={`group relative p-3 rounded-2xl bg-[#121225]/80 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-500/40'
                    : 'border-[#1f1f3a] hover:border-purple-500/50 hover:bg-[#16162e]'
                }`}
              >
                {isEditMode && (
                  <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-10 ${
                    isSelected ? 'bg-purple-600 text-white' : 'border border-white/30 bg-black/50'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-purple-950/40 relative shadow-md">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                        <BookOpen className="w-8 h-8 text-purple-400 mb-1 opacity-60" />
                        <span className="text-[10px] text-purple-300 font-bold line-clamp-2">{book.title}</span>
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-bold text-white">
                      {book.totalChapters} chương
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      ✍ {book.author || 'Khuyết danh'}
                    </p>
                  </div>
                </div>

                {!isEditMode && (
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      {book.lastReadChapterIdx != null && book.lastReadChapterIdx > 0
                        ? `Đang đọc C.${book.lastReadChapterIdx + 1}`
                        : 'Chưa đọc'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteBook(book.id); }}
                      className="p-1 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Xóa sách"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {localBooks.length > 0 && (
        <div className="flex justify-end pt-4 border-t border-white/5">
          <button
            onClick={onClearAllData}
            className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa sạch toàn bộ tủ sách offline
          </button>
        </div>
      )}
    </div>
  );
};
