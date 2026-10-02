import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../../contexts/LangContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useBrowser } from '../../../contexts/BrowserContext';
import { userFeatureService } from '../../../services';
import { HistoryGroup, HistoryBookItem } from './History.types';

function normalizeHistory(raw: any): HistoryGroup[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  if (raw[0] && Array.isArray(raw[0].books)) {
    return raw.map((g: any) => ({
      group_name: g.group_name || 'Lịch sử đọc',
      books: Array.isArray(g.books) ? g.books : []
    }));
  }

  const groups: Record<string, HistoryBookItem[]> = { 'Hôm nay': [], 'Hôm qua': [], 'Trước đó': [] };
  const now = new Date();
  const todayStr = now.toDateString();
  const ydayStr = new Date(now.getTime() - 86400000).toDateString();

  raw.forEach((item: any) => {
    const book: HistoryBookItem = {
      book_id: item.book_id,
      url: item.chapter_url || item.url,
      title: item.title || 'Không có tiêu đề',
      author: item.author || 'Chưa rõ tác giả',
      cover: item.cover,
      last_chapter: item.chapter_title || item.last_chapter,
      read_date: item.last_read_at || item.created_at,
    };
    const d = item.last_read_at ? new Date(item.last_read_at) : null;
    if (d && !isNaN(d.getTime())) {
      if (d.toDateString() === todayStr) groups['Hôm nay'].push(book);
      else if (d.toDateString() === ydayStr) groups['Hôm qua'].push(book);
      else groups['Trước đó'].push(book);
    } else {
      groups['Trước đó'].push(book);
    }
  });

  const res: HistoryGroup[] = [];
  if (groups['Hôm nay'].length) res.push({ group_name: 'Hôm nay', books: groups['Hôm nay'] });
  if (groups['Hôm qua'].length) res.push({ group_name: 'Hôm qua', books: groups['Hôm qua'] });
  if (groups['Trước đó'].length) res.push({ group_name: 'Trước đó', books: groups['Trước đó'] });
  return res.length ? res : [{ group_name: 'Lịch sử đọc', books: [] }];
}

export function useHistoryPage() {
  const { t, lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const { history: browserHistory = [], clearBrowserHistory, deleteBrowserHistoryItem, openInBrowser } = useBrowser() || {};
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'reading' | 'web'>('reading');
  const [webSearchQ, setWebSearchQ] = useState('');

  const [historyGroups, setHistoryGroups] = useState<HistoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchHistory();
  }, [user, authLoading]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await userFeatureService.getHistory(searchQ ? { q: searchQ } : undefined);
      setHistoryGroups(normalizeHistory(data));
    } catch (e) {
      console.error(e);
      setHistoryGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    const confirmMsg = lang === 'vi'
      ? 'Bạn có chắc muốn xóa tất cả lịch sử đọc?'
      : lang === 'en' ? 'Are you sure you want to clear all reading history?'
      : '您确定要清空所有阅读历史记录吗？';
    if (!window.confirm(confirmMsg)) return;
    try {
      await userFeatureService.clearHistory();
      setHistoryGroups([]);
    } catch {
      alert(lang === 'vi' ? 'Không xóa được lịch sử.' : lang === 'en' ? 'Failed to clear history.' : '无法清空历史记录。');
    }
  };

  const handleDeleteItem = async (bookId?: number, url?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ident = bookId || url;
    if (!ident) return;
    setDeletingId(ident);
    try {
      await userFeatureService.removeFromHistory(bookId ? { book_id: bookId } : { url });
      setHistoryGroups(prev =>
        prev
          .map(g => ({
            ...g,
            books: g.books.filter(b => (b.book_id !== bookId && b.url !== url) && (b.book_id || b.url) !== ident)
          }))
          .filter(g => g.books.length > 0)
      );
    } catch {
      // rollback or silent
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectItem = (b: HistoryBookItem) => {
    const ident = b.book_id || b.url;
    if (!ident) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(ident)) next.delete(ident);
      else next.add(ident);
      return next;
    });
  };

  const getAllItemIds = () => {
    const ids: (number | string)[] = [];
    (historyGroups || []).forEach(g => {
      (g?.books || []).forEach(b => {
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
      const booksToDel: HistoryBookItem[] = [];
      (historyGroups || []).forEach(g => {
        (g?.books || []).forEach(b => {
          const ident = b.book_id || b.url;
          if (ident && selectedIds.has(ident)) {
            booksToDel.push(b);
          }
        });
      });
      await Promise.all(
        booksToDel.map(b =>
          userFeatureService.removeFromHistory(b.book_id ? { book_id: b.book_id } : { url: b.url })
        )
      );
      setSelectedIds(new Set());
      setIsEditMode(false);
      await fetchHistory();
    } catch {
      alert('Không thể xóa hàng loạt lịch sử.');
    } finally {
      setLoading(false);
    }
  };

  const totalBooks = (historyGroups || []).reduce((sum, g) => sum + (Array.isArray(g?.books) ? g.books.length : 0), 0);
  const allItemIds = getAllItemIds();
  const isAllSelected = selectedIds.size === allItemIds.length && allItemIds.length > 0;

  return {
    t,
    lang,
    user,
    authLoading,
    browserHistory,
    clearBrowserHistory,
    deleteBrowserHistoryItem,
    openInBrowser,
    navigate,
    activeTab,
    setActiveTab,
    webSearchQ,
    setWebSearchQ,
    historyGroups,
    loading,
    deletingId,
    searchQ,
    setSearchQ,
    isEditMode,
    setIsEditMode,
    selectedIds,
    setSelectedIds,
    totalBooks,
    isAllSelected,
    fetchHistory,
    handleClearHistory,
    handleDeleteItem,
    handleSelectItem,
    handleSelectAll,
    handleBulkDelete,
  };
}
