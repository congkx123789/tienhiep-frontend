import { Clock, BookOpen, ExternalLink, X, CheckSquare, Square, Loader } from 'lucide-react';
import { HistoryGroup, HistoryBookItem } from '../History.types';

interface ReadingHistoryListProps {
  historyGroups: HistoryGroup[];
  loading: boolean;
  isEditMode: boolean;
  selectedIds: Set<number | string>;
  deletingId: number | string | null;
  handleSelectItem: (b: HistoryBookItem) => void;
  handleDeleteItem: (bookId?: number, url?: string, e?: React.MouseEvent) => void;
  navigate: (path: string) => void;
  openInBrowser?: (url: string) => void;
  lang: string;
  noHistoryText: string;
}

export function ReadingHistoryList({
  historyGroups,
  loading,
  isEditMode,
  selectedIds,
  deletingId,
  handleSelectItem,
  handleDeleteItem,
  navigate,
  openInBrowser,
  lang,
  noHistoryText,
}: ReadingHistoryListProps) {
  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
        <span>{lang === 'vi' ? 'Đang tải lịch sử...' : lang === 'en' ? 'Loading history...' : '正在加载历史...'}</span>
      </div>
    );
  }

  if (historyGroups.length === 0) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <p className="text-sm">{noHistoryText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {historyGroups.map((group) => (
        <div key={group.group_name} className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <h3 className="text-xs font-extrabold text-brand-400 uppercase tracking-wider">
              {lang === 'en'
                ? group.group_name === 'Hôm nay' ? 'Today'
                  : group.group_name === 'Hôm qua' ? 'Yesterday'
                  : group.group_name === 'Tháng này' ? 'This Month' : 'Earlier'
                : lang === 'zh'
                ? group.group_name === 'Hôm nay' ? '今天'
                  : group.group_name === 'Hôm qua' ? '昨天'
                  : group.group_name === 'Tháng này' ? '本月' : '更早'
                : group.group_name}
            </h3>
            <div className="flex-1 h-px bg-[#1f1f3a]" />
            <span className="text-[10px] text-slate-600 font-semibold">{group.books.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.books.map((b, idx) => {
              const ident = b.book_id || b.url;
              const isSelected = ident ? selectedIds.has(ident) : false;
              return (
                <div
                  key={ident || idx}
                  onClick={() => {
                    if (isEditMode) {
                      handleSelectItem(b);
                    } else if (b.book_id) {
                      navigate(`/book/${b.book_id}`);
                    } else if (b.url) {
                      openInBrowser ? openInBrowser(b.url) : window.open(b.url, '_blank');
                    }
                  }}
                  className={`relative bg-[#121225]/60 border rounded-2xl p-4 flex gap-3 items-start cursor-pointer transition-all hover:scale-[1.01] group ${
                    isEditMode
                      ? 'border-purple-500/30 bg-purple-950/5'
                      : 'border-[#1f1f3a] hover:border-brand-500/35'
                  }`}
                >
                  {isEditMode && (
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 self-center transition-all ${
                        isSelected
                          ? 'bg-purple-600 border-purple-500 text-white shadow shadow-purple-500/25'
                          : 'bg-[#0b0b14] border-slate-700 text-slate-500'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    </div>
                  )}

                  {b.cover ? (
                    <img
                      src={b.cover}
                      alt="cover"
                      className="w-[48px] h-[66px] object-cover rounded-xl border border-[#1f1f3a] shrink-0"
                      onError={(e) => (e.target as HTMLElement).remove()}
                    />
                  ) : (
                    <div className="w-[48px] h-[66px] rounded-xl bg-[#0b0b14] border border-[#1f1f3a] flex items-center justify-center text-slate-600 shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-200 text-xs truncate leading-relaxed group-hover:text-brand-400 transition-colors">
                      {b.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {lang === 'vi' ? 'Tác giả' : lang === 'en' ? 'Author' : '作者'}: {b.author}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 bg-brand-500/10 border border-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full text-[9px] font-semibold max-w-[150px]">
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{b.last_chapter}</span>
                      </span>
                    </div>

                    {b.read_date && (
                      <p className="text-[9px] text-slate-600 mt-1.5">{b.read_date}</p>
                    )}
                  </div>

                  {!isEditMode && (
                    <button
                      onClick={(e) => handleDeleteItem(b.book_id, b.url, e)}
                      disabled={deletingId === ident}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-50"
                      title={lang === 'vi' ? 'Xóa khỏi lịch sử' : 'Remove from history'}
                    >
                      {deletingId === ident ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
