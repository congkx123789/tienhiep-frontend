import { BookMarked, Search, Trash2 } from 'lucide-react';
import { BookshelfBook } from '../Bookshelf.types';

interface BookshelfToolbarProps {
  books: BookshelfBook[];
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  selectedBookIds: Set<number | string>;
  setSelectedBookIds: (val: Set<number | string>) => void;
  handleSelectAll: () => void;
  handleBulkDelete: () => void;
  q: string;
  setQ: (val: string) => void;
  lang: string;
}

export function BookshelfToolbar({
  books,
  isEditMode,
  setIsEditMode,
  selectedBookIds,
  setSelectedBookIds,
  handleSelectAll,
  handleBulkDelete,
  q,
  setQ,
  lang,
}: BookshelfToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-brand-400" />
          {lang === 'vi' ? 'Tủ Sách Cá Nhân' : lang === 'en' ? 'Personal Bookshelf' : '个人书架'} ({books.length})
        </h2>

        {books.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditMode(!isEditMode);
                setSelectedBookIds(new Set());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isEditMode
                  ? 'bg-purple-600/25 border-purple-500/50 text-purple-300 hover:bg-purple-600/35'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {isEditMode
                ? (lang === 'vi' ? 'Thoát quản lý' : 'Exit management')
                : (lang === 'vi' ? 'Quản lý tủ sách' : 'Manage bookshelf')}
            </button>

            {isEditMode && (
              <>
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 bg-[#121225] border border-[#1f1f3a] rounded-lg text-xs font-bold text-slate-300 hover:bg-[#1a1a35] transition-all"
                >
                  {selectedBookIds.size === books.length
                    ? (lang === 'vi' ? 'Hủy chọn tất cả' : 'Deselect all')
                    : (lang === 'vi' ? 'Chọn tất cả' : 'Select all')}
                </button>

                {selectedBookIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-950/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {lang === 'vi' ? `Xóa hàng loạt (${selectedBookIds.size})` : `Bulk Delete (${selectedBookIds.size})`}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="relative w-full md:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder={lang === 'vi' ? 'Tìm trong tủ sách...' : lang === 'en' ? 'Search bookshelf...' : '在书架中搜索...'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-[#121225] border border-[#1f1f3a] rounded-xl text-white outline-none focus:border-brand-500 transition-colors text-xs"
        />
      </div>
    </div>
  );
}
