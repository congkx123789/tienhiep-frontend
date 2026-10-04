import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../../services';
import { StatsState, LeaderboardItem } from './Discover.types';

export function useDiscoverBooks(user: any, t: any) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [dup, setDup] = useState('');
  const [minChapters, setMinChapters] = useState('');
  const [sortBy, setSortBy] = useState('site_count DESC');
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState<StatsState>({ total: 931427, duplicates: 0 });
  const [comparingBookId, setComparingBookId] = useState<number | null>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [compLoading, setCompLoading] = useState(false);
  const [bookshelfIds, setBookshelfIds] = useState<Set<number>>(new Set());
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/stats');
      setStats({
        total: res.data?.total_books || 931427,
        duplicates: res.data?.duplicates || 0
      });
    } catch (e) {
      console.error(e);
    }
  };

  const loadBookshelf = useCallback(async () => {
    if (!user) {
      setBookshelfIds(new Set());
      return;
    }
    try {
      const res = await api.get('/api/bookshelf');
      setBookshelfIds(new Set(res.data?.map((b: any) => b.book_id)));
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const [recentComments, setRecentComments] = useState<any[]>([]);

  const fetchRecentComments = async () => {
    try {
      const res = await api.get('/api/comments/recent?limit=8');
      if (res.data?.comments) {
        setRecentComments(res.data.comments);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    loadBookshelf();
    fetchRecentComments();
  }, [loadBookshelf]);

  const fetchBooks = useCallback(async (overrideParams: any = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        q: overrideParams.q !== undefined ? overrideParams.q : q,
        category: overrideParams.category !== undefined ? overrideParams.category : category,
        source: overrideParams.source !== undefined ? overrideParams.source : source,
        dup: overrideParams.dup !== undefined ? overrideParams.dup : dup,
        sort: sortBy,
        search_field: overrideParams.search_field !== undefined ? overrideParams.search_field : searchField,
        min_chapters: minChapters,
        page,
        per_page: 30
      };
      const res = await api.get('/api/books', { params });
      setBooks(res.data?.books || []);
      setTotalPages(res.data?.pages || 1);
      setTotal(res.data?.total || 0);

      if (res.data?.books && res.data.books.length > 0 && page === 1 && !category && !source && !q) {
        const topBooks = res.data.books.slice(0, 5).map((b: any, idx: number) => ({
          id: b.id,
          title: b.title_vietphrase || b.title,
          author: b.author_hanviet || b.author,
          trend: idx === 0 ? 'up' : idx === 1 ? 'up' : idx === 2 ? 'down' : 'none',
          diff: idx === 0 ? 1 : idx === 1 ? 2 : idx === 2 ? 1 : 0
        }));
        setLeaderboard(topBooks);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t.connError);
    } finally {
      setLoading(false);
    }
  }, [q, category, source, dup, sortBy, searchField, minChapters, page, t]);

  useEffect(() => {
    const urlQ = searchParams.get('q');
    const urlField = searchParams.get('search_field');
    const urlCat = searchParams.get('category');
    
    let needsFetch = false;
    const initialOverrides: any = {};

    if (urlQ) {
      setQ(urlQ);
      initialOverrides.q = urlQ;
      needsFetch = true;
    }
    if (urlField) {
      setSearchField(urlField);
      initialOverrides.search_field = urlField;
      needsFetch = true;
    }
    if (urlCat) {
      setCategory(urlCat);
      initialOverrides.category = urlCat;
      needsFetch = true;
    }

    if (needsFetch) {
      fetchBooks(initialOverrides);
      setSearchParams({}, { replace: true });
    } else {
      fetchBooks();
    }
  }, [searchParams]);

  useEffect(() => {
    const hasParams = searchParams.get('q') || searchParams.get('search_field') || searchParams.get('category');
    if (!hasParams) {
      fetchBooks();
    }
  }, [page, category, source, dup, minChapters, sortBy]);

  const handleToggleFav = async (bookId: number) => {
    if (!user) {
      alert("Vui lòng đăng nhập để lưu sách.");
      return;
    }
    const inShelf = bookshelfIds.has(bookId);
    const url = inShelf ? '/api/bookshelf/remove' : '/api/bookshelf/add';
    try {
      await api.post(url, { book_id: bookId });
      setBookshelfIds(prev => {
        const next = new Set(prev);
        if (inShelf) next.delete(bookId);
        else next.add(bookId);
        return next;
      });
    } catch (e: any) {
      alert(e.response?.data?.error || 'Lỗi xử lý tủ sách.');
    }
  };

  const handleCompare = async (bookId: number) => {
    if (comparingBookId === bookId) {
      setComparingBookId(null);
      setComparisonData(null);
      return;
    }
    setComparingBookId(bookId);
    setCompLoading(true);
    try {
      const res = await api.get(`/api/book/${bookId}/translations`);
      setComparisonData(res.data);
      await api.post('/api/history/add', { book_id: bookId, last_chapter: 'Đang xem so sánh' });
    } catch (e) {
      console.error(e);
    } finally {
      setCompLoading(false);
    }
  };

  const handleClearFilters = () => {
    setQ('');
    setSearchField('all');
    setCategory('');
    setSource('');
    setDup('');
    setMinChapters('');
    setSortBy('site_count DESC');
    setPage(1);
  };

  return {
    books,
    setBooks,
    loading,
    setLoading,
    error,
    q,
    setQ,
    searchField,
    setSearchField,
    category,
    setCategory,
    source,
    setSource,
    dup,
    setDup,
    minChapters,
    setMinChapters,
    sortBy,
    setSortBy,
    showFilters,
    setShowFilters,
    page,
    setPage,
    totalPages,
    setTotalPages,
    total,
    setTotal,
    stats,
    comparingBookId,
    comparisonData,
    compLoading,
    bookshelfIds,
    leaderboard,
    recentComments,
    fetchBooks,
    handleToggleFav,
    handleCompare,
    handleClearFilters
  };
}
