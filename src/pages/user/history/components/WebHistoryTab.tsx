import { Search, Trash2, Clock, ExternalLink, X } from 'lucide-react';
import { BrowserHistoryItem } from '../History.types';

interface WebHistoryTabProps {
  browserHistory: BrowserHistoryItem[];
  webSearchQ: string;
  setWebSearchQ: (q: string) => void;
  clearBrowserHistory: () => void;
  deleteBrowserHistoryItem: (id: string | number) => void;
  openInBrowser?: (url: string) => void;
  lang: string;
}

export function WebHistoryTab({
  browserHistory,
  webSearchQ,
  setWebSearchQ,
  clearBrowserHistory,
  deleteBrowserHistoryItem,
  openInBrowser,
  lang,
}: WebHistoryTabProps) {
  const list = browserHistory || [];
  const filtered = list.filter((item) => {
    const q = webSearchQ.toLowerCase();
    return !q || (item.title || '').toLowerCase().includes(q) || (item.url || '').toLowerCase().includes(q) || (item.domain || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={webSearchQ}
            onChange={(e) => setWebSearchQ(e.target.value)}
            placeholder={lang === 'vi' ? 'Tìm theo tiêu đề, URL hoặc tên miền...' : 'Search by title, URL or domain...'}
            className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-400"
          />
        </div>

        {browserHistory.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử duyệt web không?' : 'Clear all browsing history?')) {
                clearBrowserHistory();
              }
            }}
            className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Xóa lịch sử web' : 'Clear web history'}</span>
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-500">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mx-auto mb-3">
            🌐
          </div>
          <p className="text-sm font-semibold text-slate-300">
            {lang === 'vi' ? 'Không có lịch sử duyệt web nào' : 'No web history found'}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {lang === 'vi'
              ? 'Khi bạn đọc truyện raw, xem video hoặc lướt web, lịch sử sẽ tự động được ghi lại tại đây.'
              : 'When you browse websites (not in incognito mode), visited pages will be saved here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161622] border border-white/10 hover:border-indigo-500/40 transition-all group shadow-md"
            >
              <div
                onClick={() => openInBrowser && openInBrowser(item.url)}
                className="flex-1 min-w-0 pr-3 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 truncate max-w-[140px]">
                    {item.domain || 'Trang web'}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.time} {item.date && `• ${item.date}`}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate transition-colors">
                  {item.title || item.url}
                </h4>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.url}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openInBrowser && openInBrowser(item.url)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all active:scale-95"
                  title={lang === 'vi' ? 'Mở trong trình duyệt' : 'Open in browser'}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteBrowserHistoryItem && deleteBrowserHistoryItem(item.id)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-600 text-slate-400 hover:text-white transition-all active:scale-95"
                  title={lang === 'vi' ? 'Xóa mục này' : 'Delete item'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
