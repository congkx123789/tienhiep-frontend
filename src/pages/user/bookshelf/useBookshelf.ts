import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import { useBrowser } from '../../../contexts/BrowserContext';
import { userFeatureService, bookService } from '../../../services';
import { BookshelfBook, ComparisonData } from './Bookshelf.types';

export function useBookshelf() {
  const { t, lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { setActiveAudioObj } = useBrowser();

  const [books, setBooks] = useState<BookshelfBook[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  // Bulk Edit States
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<number | string>>(new Set());

  // Translation Comparison States
  const [comparingBookId, setComparingBookId] = useState<number | string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [compLoading, setCompLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchBookshelf();
  }, [user, authLoading, q]);

  const fetchBookshelf = async () => {
    setLoading(true);
    try {
      const data = await userFeatureService.getBookshelf(q ? { q } : undefined);
      const mapped = (data || []).map((b: any) => ({
        ...b,
        id: b.book_id || b.url || b.id,
        title_vietphrase: b.title_vietphrase || b.title,
        author_hanviet: b.author_hanviet || b.author,
        cover: b.cover,
        url: b.url,
        site_count: b.site_count || 1
      }));
      setBooks(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBook = (bookId: number | string) => {
    setSelectedBookIds(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedBookIds.size === books.length) {
      setSelectedBookIds(new Set());
    } else {
      setSelectedBookIds(new Set(books.map(b => b.id).filter(Boolean)));
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = window.confirm(
      lang === 'vi'
        ? `Bạn có chắc chắn muốn xóa ${selectedBookIds.size} truyện đã chọn khỏi tủ sách cá nhân không?`
        : lang === 'en'
          ? `Are you sure you want to remove ${selectedBookIds.size} selected novels from bookshelf?`
          : `您确定要从书架中移出选中的 ${selectedBookIds.size} 部小说吗？`
    );
    if (!confirmed) return;
    setLoading(true);
    try {
      await Promise.all(
        Array.from(selectedBookIds).map(id => userFeatureService.removeFromBookshelf(id))
      );
      setSelectedBookIds(new Set());
      setIsEditMode(false);
      await fetchBookshelf();
    } catch {
      alert(lang === 'vi' ? 'Không xóa được sách hàng loạt.' : 'Failed to perform bulk remove.');
    } finally {
      await fetchBookshelf();
    }
  };

  const handleToggleFav = async (bookId: number | string) => {
    const confirmed = window.confirm(
      lang === 'vi'
        ? 'Bạn có chắc chắn muốn xóa truyện này khỏi tủ sách cá nhân không?'
        : lang === 'en'
          ? 'Are you sure you want to remove this novel from your personal bookshelf?'
          : '您确定要从个人书架中移出这部小说吗？'
    );
    if (!confirmed) return;
    try {
      await userFeatureService.removeFromBookshelf(bookId);
      setBooks(prev => prev.filter(b => b.id !== bookId));
    } catch {
      alert(lang === 'vi' ? 'Không xóa được sách.' : lang === 'en' ? 'Failed to remove novel.' : '无法移出书架。');
    }
  };

  const handleCompare = async (bookId: number | string) => {
    if (comparingBookId === bookId) {
      setComparingBookId(null);
      setComparisonData(null);
      return;
    }
    setComparingBookId(bookId);
    setCompLoading(true);
    try {
      const res = await bookService.getBookTranslations(bookId);
      setComparisonData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCompLoading(false);
    }
  };

  const handlePlayTrailer = async (book: any) => {
    if (!book.description) {
      try {
        const res = await bookService.getBookTranslations(book.id);
        if (res.data) {
          const matchedDesc = res.data.advanced?.desc || res.data.fast?.desc || res.data.vietphrase?.desc || '';
          setActiveAudioObj({ ...book, description: matchedDesc });
        } else {
          setActiveAudioObj(book);
        }
      } catch {
        setActiveAudioObj(book);
      }
    } else {
      setActiveAudioObj(book);
    }
  };

  return {
    t,
    lang,
    user,
    authLoading,
    books,
    q,
    setQ,
    loading,
    isEditMode,
    setIsEditMode,
    selectedBookIds,
    setSelectedBookIds,
    comparingBookId,
    comparisonData,
    compLoading,
    navigate,
    handleSelectBook,
    handleSelectAll,
    handleBulkDelete,
    handleToggleFav,
    handleCompare,
    handlePlayTrailer,
  };
}
