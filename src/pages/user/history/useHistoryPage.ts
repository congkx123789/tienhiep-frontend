import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../../contexts/LangContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useBrowser } from '../../../contexts/BrowserContext';
import { userFeatureService } from '../../../services';
import { HistoryGroup, HistoryBookItem } from './History.types';
import { getAccountItem, setAccountItem, removeAccountItem } from '../../../utils/accountStorage';

function formatDisplayTime(d: Date | null): string {
  if (!d || isNaN(d.getTime()) || d.getFullYear() <= 1) return 'Vừa mới đọc';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes} • ${day}/${month}/${year}`;
}

function parseHistoryDate(val: any): Date | null {
  if (!val) return null;
  if (typeof val === 'number') return new Date(val);
  const s = String(val).trim();
  if (!s || s.startsWith('0001-01-01')) return null;
  // Handle "YYYY-MM-DD HH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    return new Date(s.replace(' ', 'T'));
  }
  const d = new Date(s);
  return isNaN(d.getTime()) || d.getFullYear() <= 1 ? null : d;
}

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
    const rawDate = item.last_read_at || item.read_date || item.created_at || item.timestamp;
    const d = parseHistoryDate(rawDate);

    const book: HistoryBookItem = {
      book_id: item.book_id,
      url: item.chapter_url || item.url,
      title: item.title || 'Không có tiêu đề',
      author: item.author || 'Chưa rõ tác giả',
      cover: item.cover,
      last_chapter: item.chapter_title || item.last_chapter || 'Đang đọc',
      read_date: formatDisplayTime(d),
    };

    if (d) {
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
    fetchHistory();
  }, [user, authLoading, searchQ]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (user) {
        const data = await userFeatureService.getHistory(searchQ ? { q: searchQ } : undefined);
        if (Array.isArray(data) && data.length > 0) {
          setHistoryGroups(normalizeHistory(data));
          return;
        }
      }
      const localData = getAccountItem<any[]>('tienhiep_local_reading_history', []);
      setHistoryGroups(normalizeHistory(localData));
    } catch (e) {
      const localData = getAccountItem<any[]>('tienhiep_local_reading_history', []);
      setHistoryGroups(normalizeHistory(localData));
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
      if (user) await userFeatureService.clearHistory();
      removeAccountItem('tienhiep_local_reading_history');
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
      if (user) await userFeatureService.removeFromHistory(bookId ? { book_id: bookId } : { url });
      const curLocal = getAccountItem<any[]>('tienhiep_local_reading_history', []);
      setAccountItem('tienhiep_local_reading_history', curLocal.filter(b => b.book_id !== bookId && b.url !== url));
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
