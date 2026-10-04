import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import api, { bookService, socialService, userFeatureService } from '../../../services';
import { BookInfo, ChapterItem, CommentItem, ParsedSource } from './BookDetail.types';

export function useBookDetail() {
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuth();
  const { lang } = useLang();

  const [book, setBook] = useState<BookInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [friends, setFriends] = useState<{ id: number | string; username: string }[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  const [sharing, setSharing] = useState(false);

  const [isFav, setIsFav] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentRating, setNewCommentRating] = useState(5);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());

  const fetchComments = async (bId: string | number) => {
    try {
      const res = await api.get(`/api/comments?book_id=${bId}`);
      if (res.data?.comments) {
        const mapped: CommentItem[] = res.data.comments.map((c: any) => ({
          id: c.id,
          user: c.user_name || 'Độc giả',
          avatar: c.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=60',
          rating: c.rating || 5,
          text: c.content,
          time: c.time_ago || 'Vừa xong',
          likes: c.likes || 0
        }));
        setComments(mapped);
      }
    } catch (e) {
      console.error('Failed to load comments:', e);
    }
  };

  useEffect(() => {
    if (shareOpen && user) {
      socialService.getFriends()
        .then(res => {
          if (res.data && res.data.friends) {
            setFriends(res.data.friends);
          }
        })
        .catch(err => console.error('Failed to load friends for sharing', err));
    }
  }, [shareOpen, user]);

  useEffect(() => {
    fetchBookDetails();
    checkIfFavorite();
    if (bookId) fetchComments(bookId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, user]);

  const fetchChapterList = async (bookIdParam: string | number, chapMax?: number) => {

    setChaptersLoading(true);
    try {
      const res = await api.get(`/api/book/${bookIdParam}/chapters`, { params: { lang } });
      if (res.data?.chapters && Array.isArray(res.data.chapters)) {
        setChapters(res.data.chapters);
        return;
      }
    } catch (e) {
      console.warn('[BookDetail] chapters API failed, using fallback:', e);
    }
    // Fallback: sinh danh sách đánh số tối giản nếu API lỗi
    const total = Math.min(Math.max(chapMax || 50, 1), 5000);
    setChapters(Array.from({ length: total }, (_, i) => ({
      id: i + 1,
      title: lang === 'vi' ? `Chương ${i + 1}` : lang === 'en' ? `Chapter ${i + 1}` : `第 ${i + 1} 章`,
      url_idx: i + 1
    })));
  };


  const logReadingHistory = async (loadedBook: BookInfo) => {
    if (!user || !loadedBook) return;
    try {
      await userFeatureService.addToHistory({
        book_id: loadedBook.id,
        last_chapter: lang === 'vi' ? 'Đang xem' : lang === 'en' ? 'Viewing' : '浏览中'
      });
    } catch {
      // silent
    }
  };

  const fetchBookDetails = async () => {
    if (!bookId) return;
    setLoading(true);
    setError('');
    try {
      const res = await bookService.getBookDetail(bookId);
      const bookData = (res as any)?.data || res;
      if (bookData && (bookData.id || bookData.title)) {
        setBook(bookData);
        logReadingHistory(bookData);
        await fetchChapterList(bookId, bookData.chapters_max);
      }
    } catch {
      try {
        const res = await bookService.getBooks({ q: '', page: 1, limit: 100 });
        const list = (res as any)?.books || (res as any)?.data?.books || [];
        const found = list.find((b: any) => b.id === parseInt(bookId));
        if (found) {
          setBook(found);
          logReadingHistory(found);
          await fetchChapterList(bookId, found.chapters_max);
        } else {
          const detailRes = await bookService.getBookTranslations(bookId);
          if (detailRes.data) {
            const fallbackBook: BookInfo = {
              id: parseInt(bookId),
              title_vietphrase: detailRes.data.vietphrase.title,
              title: detailRes.data.hanviet.title,
              description_vietphrase: detailRes.data.vietphrase.desc,
              author_hanviet: lang === 'vi' ? 'Tác giả' : lang === 'en' ? 'Author' : '作者',
              cover: '',
              parsed_sources: []
            };
            setBook(fallbackBook);
            logReadingHistory(fallbackBook);
            await fetchChapterList(bookId, 50);
          }
        }
      } catch {
        setError(lang === 'vi' ? 'Không tải được thông tin truyện.' : lang === 'en' ? 'Failed to load book details.' : '无法加载小说详情。');
      }
    } finally {
      setLoading(false);
    }
  };



  const checkIfFavorite = async () => {
    if (!user || !bookId) return;
    try {
      const res = await userFeatureService.getBookshelf();
      const found = res.data?.some((b: any) => b.book_id === parseInt(bookId));
      setIsFav(!!found);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFav = async () => {
    if (!user) {
      alert(lang === 'vi' ? 'Vui lòng đăng nhập để lưu sách.' : lang === 'en' ? 'Please log in to save books.' : '请先登录以收藏小说。');
      return;
    }
    if (!bookId) return;
    try {
      if (isFav) {
        await userFeatureService.removeFromBookshelf(parseInt(bookId));
      } else {
        await userFeatureService.addToBookshelf({ book_id: parseInt(bookId) });
      }
      setIsFav(!isFav);
    } catch {
      alert(lang === 'vi' ? 'Lỗi cập nhật tủ sách.' : lang === 'en' ? 'Error updating bookshelf.' : '更新书架时出错。');
    }
  };

  const handleShareBook = async (friendId: number | string) => {
    if (!book) return;
    setSharing(true);
    try {
      const res = await bookService.shareBook({
        friend_id: friendId,
        book_id: book.id,
        message: shareMessage
      });
      if (res.data && res.data.success) {
        alert(lang === 'vi' ? 'Đã chia sẻ thành công!' : 'Shared successfully!');
        setShareOpen(false);
        setShareMessage('');
      }
    } catch {
      alert('Chia sẻ thất bại.');
    } finally {
      setSharing(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    setLikedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
        setComments(comments.map(c => c.id === commentId ? { ...c, likes: Math.max(0, c.likes - 1) } : c));
      } else {
        next.add(commentId);
        setComments(comments.map(c => c.id === commentId ? { ...c, likes: c.likes + 1 } : c));
        api.post('/api/comments/like', { comment_id: commentId }).catch(() => {});
      }
      return next;
    });
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    if (!user) {
      alert(lang === 'vi' ? 'Vui lòng đăng nhập để gửi bình luận!' : 'Please log in to submit a comment!');
      return;
    }
    if (!bookId) return;

    try {
      const res = await api.post('/api/comments/add', {
        book_id: parseInt(bookId),
        content: newCommentText.trim(),
        rating: newCommentRating
      });

      if (res.data?.comment) {
        const c = res.data.comment;
        const commentObj: CommentItem = {
          id: c.id,
          user: c.user_name || user.name || user.email?.split('@')[0] || 'Độc giả',
          avatar: c.user_avatar || user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=60',
          rating: c.rating || newCommentRating,
          text: c.content,
          time: c.time_ago || 'Vừa xong',
          likes: 0
        };
        setComments(prev => [commentObj, ...prev]);
        setNewCommentText('');
        setNewCommentRating(5);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lỗi gửi bình luận.');
    }
  };

  const getParsedSources = (): ParsedSource[] => {
    if (!book) return [];
    if (book.parsed_sources?.length) {
      return book.parsed_sources.map(src => ({ site: src.source, url: src.url }));
    }
    return (book.urls || '').split(' | ').filter(p => p.includes(':')).map(p => {
      const idx = p.indexOf(':');
      return { site: p.substring(0, idx).trim(), url: p.substring(idx + 1).trim() };
    });
  };

  return {
    bookId,
    user,
    lang,
    book,
    loading,
    error,
    isFav,
    expandedDesc,
    setExpandedDesc,
    chapters,
    chaptersLoading,
    comments,
    newCommentText,
    setNewCommentText,
    newCommentRating,
    setNewCommentRating,
    likedComments,
    shareOpen,
    setShareOpen,
    friends,
    shareMessage,
    setShareMessage,
    sharing,
    handleToggleFav,
    handleShareBook,
    handleLikeComment,
    handleAddComment,
    getParsedSources,
  };
}
