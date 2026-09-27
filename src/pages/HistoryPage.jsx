import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import { useBrowser } from '../contexts/BrowserContext';
import api from '../services/api';
import { History, Trash2, Loader, BookOpen, ExternalLink, Clock, X, CheckSquare, Square, Globe, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HistoryPage() {
  const { t, lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const { history: browserHistory = [], clearBrowserHistory, deleteBrowserHistoryItem, openInBrowser } = useBrowser() || {};
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('reading'); // 'reading' | 'web'
  const [webSearchQ, setWebSearchQ] = useState('');

  const [historyGroups, setHistoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    if (authLoading) return; // Chờ xác minh đăng nhập xong mới làm tiếp
    if (!user) {
      setLoading(false);
      return;
    }
    fetchHistory();
  }, [user, authLoading]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/history', { params: searchQ ? { q: searchQ } : {} });
      setHistoryGroups(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    const confirmMsg = lang === 'vi'
      ? "Bạn có chắc muốn xóa tất cả lịch sử đọc?"
      : lang === 'en' ? "Are you sure you want to clear all reading history?"
      : "您确定要清空所有阅读历史记录吗？";
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.post('/api/history/clear');
      setHistoryGroups([]);
    } catch (e) {
      alert(lang === 'vi' ? 'Không xóa được lịch sử.' : lang === 'en' ? 'Failed to clear history.' : '无法清空历史记录。');
    }
  };

  const handleDeleteItem = async (bookId, url, e) => {
    if (e) e.stopPropagation();
    const ident = bookId || url;
    if (!ident) return;
    setDeletingId(ident);
    try {
      await api.post('/api/history/remove', bookId ? { book_id: bookId } : { url: url });
      setHistoryGroups(prev =>
        prev
          .map(g => ({
            ...g,
            books: g.books.filter(b => (b.book_id !== bookId && b.url !== url) && (b.book_id || b.url) !== ident)
          }))
          .filter(g => g.books.length > 0)
      );
    } catch (e) {
      setHistoryGroups(prev =>
        prev
          .map(g => ({
            ...g,
            books: g.books.filter(b => (b.book_id !== bookId && b.url !== url) && (b.book_id || b.url) !== ident)
          }))
          .filter(g => g.books.length > 0)
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectItem = (b) => {
    const ident = b.book_id || b.url;
    if (!ident) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(ident)) {
        next.delete(ident);
      } else {
        next.add(ident);
      }
      return next;
    });
  };

  const getAllItemIds = () => {
    const ids = [];
    historyGroups.forEach(g => {
      g.books.forEach(b => {
        const ident = b.book_id || b.url;
        if (ident) ids.push(ident);
      });
    });
    return ids;
  };

  const handleSelectAll = () => {
    const allIds = getAllItemIds();
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = window.confirm(
      lang === 'vi' 
        ? `Bạn có chắc chắn muốn xóa ${selectedIds.size} truyện khỏi lịch sử không?`
        : `Are you sure you want to clear ${selectedIds.size} selected books from history?`
    );
    if (!confirmed) return;
    setLoading(true);
    try {
      const booksToDel = [];
      historyGroups.forEach(g => {
        g.books.forEach(b => {
          const ident = b.book_id || b.url;
          if (selectedIds.has(ident)) {
            booksToDel.push(b);
          }
        });
      });
      await Promise.all(
        booksToDel.map(b => 
          api.post('/api/history/remove', b.book_id ? { book_id: b.book_id } : { url: b.url })
        )
      );
      setSelectedIds(new Set());
      setIsEditMode(false);
      await fetchHistory();
    } catch (e) {
      alert("Không thể xóa hàng loạt lịch sử.");
    } finally {
      setLoading(false);
    }
  };

  const totalBooks = historyGroups.reduce((sum, g) => sum + g.books.length, 0);
  const allItemIds = getAllItemIds();
  const isAllSelected = selectedIds.size === allItemIds.length && allItemIds.length > 0;

  return (
    <MainLayout>
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <History className="w-6 h-6 text-brand-400" />
            {lang === 'vi' ? 'Trung Tâm Lịch Sử' : lang === 'en' ? 'History Center' : '历史中心'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'vi' ? 'Theo dõi tiến độ đọc truyện và lịch sử duyệt web di động' : 'Track reading progress and mobile browsing history'}
          </p>
        </div>

        {/* Segmented Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('reading')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'reading'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Lịch Sử Đọc' : 'Reading'}</span>
          </button>

          <button
            onClick={() => setActiveTab('web')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'web'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? `Duyệt Web (${browserHistory.length})` : `Web (${browserHistory.length})`}</span>
          </button>
        </div>
      </div>

      {/* ═══ TAB 1: WEB BROWSING HISTORY ═══ */}
      {activeTab === 'web' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
            {/* Search web history */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={webSearchQ}
                onChange={e => setWebSearchQ(e.target.value)}
                placeholder={lang === 'vi' ? "Tìm theo tiêu đề, URL hoặc tên miền..." : "Search by title, URL or domain..."}
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-400"
              />
            </div>

            {/* Clear All Web History */}
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

          {/* List of Web History */}
          {(() => {
            const filtered = browserHistory.filter(item => {
              const q = webSearchQ.toLowerCase();
              return !q || (item.title || '').toLowerCase().includes(q) || (item.url || '').toLowerCase().includes(q) || (item.domain || '').toLowerCase().includes(q);
            });

            if (filtered.length === 0) {
              return (
                <div className="py-20 text-center text-slate-500">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mx-auto mb-3">
                    🌐
                  </div>
                  <p className="text-sm font-semibold text-slate-300">
                    {lang === 'vi' ? 'Không có lịch sử duyệt web nào' : 'No web history found'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    {lang === 'vi'
                      ? 'Khi bạn đọc truyện raw, xem video YouTube hoặc lướt web (không ở tab ẩn danh), lịch sử sẽ tự động được ghi lại tại đây.'
                      : 'When you browse websites (not in incognito mode), visited pages will be saved here.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map(item => (
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
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {item.url}
                      </p>
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
            );
          })()}
        </div>
      )}

      {/* ═══ TAB 2: READING HISTORY ═══ */}
      {activeTab === 'reading' && (
        <div className="space-y-4 animate-fade-in">
          {authLoading ? (
            <div className="py-20 text-center text-slate-500">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
              <span>{lang === 'vi' ? 'Đang tải thông tin...' : lang === 'en' ? 'Loading info...' : '正在加载信息...'}</span>
            </div>
          ) : !user ? (
            <div className="py-20 text-center text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto mb-4">
                🔒
              </div>
              <p className="text-sm">{t.loginToViewHistory}</p>
            </div>
          ) : (
            <>
              {/* Controls bar */}
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
                    {/* Search box */}
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQ}
                        onChange={e => setSearchQ(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetchHistory()}
                        placeholder={lang === 'vi' ? 'Tìm truyện...' : 'Search books...'}
                        className="bg-[#12122b]/80 border border-[#232342] rounded-xl px-3 py-2 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors w-36 sm:w-44"
                      />
                      {searchQ && (
                        <button onClick={() => { setSearchQ(''); fetchHistory(); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
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

              {/* Reading History Content */}
              {loading ? (
                <div className="py-20 text-center text-slate-500">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
                  <span>{lang === 'vi' ? 'Đang tải lịch sử...' : lang === 'en' ? 'Loading history...' : '正在加载历史...'}</span>
                </div>
              ) : historyGroups.length === 0 ? (
                <div className="py-20 text-center text-slate-500">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto mb-4">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="text-sm">{t.noHistory}</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {historyGroups.map(group => (
                    <div key={group.group_name} className="space-y-3">
                      {/* Group Header */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-brand-400" />
                        <h3 className="text-xs font-extrabold text-brand-400 uppercase tracking-wider">
                          {lang === 'en'
                            ? group.group_name === 'Hôm nay' ? 'Today'
                              : group.group_name === 'Hôm qua' ? 'Yesterday'
                              : group.group_name === 'Tháng này' ? 'This Month'
                              : 'Earlier'
                            : lang === 'zh'
                            ? group.group_name === 'Hôm nay' ? '今天'
                              : group.group_name === 'Hôm qua' ? '昨天'
                              : group.group_name === 'Tháng này' ? '本月'
                              : '更早'
                            : group.group_name}
                        </h3>
                        <div className="flex-1 h-px bg-[#1f1f3a]" />
                        <span className="text-[10px] text-slate-600 font-semibold">{group.books.length}</span>
                      </div>

                      {/* Books Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.books.map((b, idx) => {
                          const ident = b.book_id || b.url;
                          const isSelected = selectedIds.has(ident);
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
                              {/* Selection checkbox overlay */}
                              {isEditMode && (
                                <div 
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 self-center transition-all ${
                                    isSelected 
                                      ? 'bg-purple-600 border-purple-500 text-white shadow shadow-purple-500/25' 
                                      : 'bg-[#0b0b14] border-slate-700 text-slate-500'
                                  }`}
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-3.5 h-3.5" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5" />
                                  )}
                                </div>
                              )}

                              {/* Cover */}
                              {b.cover ? (
                                <img
                                  src={b.cover}
                                  alt="cover"
                                  className="w-[48px] h-[66px] object-cover rounded-xl border border-[#1f1f3a] shrink-0"
                                  onError={e => e.target.remove()}
                                />
                              ) : (
                                <div className="w-[48px] h-[66px] rounded-xl bg-[#0b0b14] border border-[#1f1f3a] flex items-center justify-center text-slate-600 shrink-0">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                              )}

                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-slate-200 text-xs truncate leading-relaxed group-hover:text-brand-400 transition-colors">
                                  {b.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                  {lang === 'vi' ? 'Tác giả' : lang === 'en' ? 'Author' : '作者'}: {b.author}
                                </p>

                                {/* Last chapter badge */}
                                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 bg-brand-500/10 border border-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full text-[9px] font-semibold max-w-[150px]">
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate">{b.last_chapter}</span>
                                  </span>
                                </div>

                                {/* Date */}
                                {b.read_date && (
                                  <p className="text-[9px] text-slate-600 mt-1.5">
                                    {b.read_date}
                                  </p>
                                )}
                              </div>

                              {/* Delete button (always visible on mobile, shows on hover on desktop) */}
                              {!isEditMode && (
                                <button
                                  onClick={e => handleDeleteItem(b.book_id, b.url, e)}
                                  disabled={deletingId === ident}
                                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-50"
                                  title={lang === 'vi' ? 'Xóa khỏi lịch sử' : 'Remove from history'}
                                >
                                  {deletingId === ident
                                    ? <Loader className="w-3.5 h-3.5 animate-spin" />
                                    : <X className="w-3.5 h-3.5" />
                                  }
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </MainLayout>
  );
}

