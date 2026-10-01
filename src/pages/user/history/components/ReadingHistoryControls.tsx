import { Trash2, X } from 'lucide-react';

interface ReadingHistoryControlsProps {
  totalBooks: number;
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  selectedIds: Set<number | string>;
  setSelectedIds: (val: Set<number | string>) => void;
  isAllSelected: boolean;
  handleSelectAll: () => void;
  handleBulkDelete: () => void;
  searchQ: string;
  setSearchQ: (q: string) => void;
  fetchHistory: () => void;
  handleClearHistory: () => void;
  lang: string;
}

export function ReadingHistoryControls({
  totalBooks,
  isEditMode,
  setIsEditMode,
  selectedIds,
  setSelectedIds,
  isAllSelected,
  handleSelectAll,
  handleBulkDelete,
  searchQ,
  setSearchQ,
  fetchHistory,
  handleClearHistory,
  lang,
}: ReadingHistoryControlsProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
      <div className="flex flex-wrap items-center gap-2">
        {totalBooks > 0 && (
          <>
            <button
              onClick={() => {
                setIsEditMode(!isEditMode);
                setSelectedIds(new Set());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isEditMode
                  ? 'bg-purple-600/25 border-purple-500/50 text-purple-300 hover:bg-purple-600/35'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {isEditMode
                ? (lang === 'vi' ? 'Thoát quản lý' : 'Exit management')
                : (lang === 'vi' ? 'Quản lý lịch sử' : 'Manage history')}
            </button>

            {isEditMode && (
              <>
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 bg-[#121225] border border-[#1f1f3a] rounded-lg text-xs font-bold text-slate-300 hover:bg-[#1a1a35] transition-all"
                >
                  {isAllSelected
                    ? (lang === 'vi' ? 'Hủy chọn tất cả' : 'Deselect all')
                    : (lang === 'vi' ? 'Chọn tất cả' : 'Select all')}
                </button>

                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-950/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {lang === 'vi' ? `Xóa hàng loạt (${selectedIds.size})` : `Bulk Delete (${selectedIds.size})`}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
        {totalBooks > 0 && (
          <p className="text-xs text-slate-500">
            {lang === 'vi' ? `${totalBooks} truyện` : `${totalBooks} books`}
          </p>
        )}

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
              placeholder={lang === 'vi' ? 'Tìm truyện...' : 'Search books...'}
              className="bg-[#12122b]/80 border border-[#232342] rounded-xl px-3 py-2 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors w-36 sm:w-44"
            />
            {searchQ && (
              <button
                onClick={() => { setSearchQ(''); fetchHistory(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {totalBooks > 0 && !isEditMode && (
            <button
              onClick={handleClearHistory}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/20 shrink-0"
              title={lang === 'vi' ? 'Xóa toàn bộ lịch sử' : 'Clear all history'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
