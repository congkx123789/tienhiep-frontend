import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import { bookService, socialService, userFeatureService } from '../../../services';
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

  // Initial comments data
  const [comments, setComments] = useState<CommentItem[]>([
    {
      id: 1,
      user: 'Lê Hoàng Nam',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=60',
      rating: 5,
      text: 'Bản dịch AI của trang này chuẩn thật sự, đọc Hán Việt rất mượt mà. Mong nhóm update chương mới nhanh hơn nữa!',
      time: '2 giờ trước',
      likes: 12
    },
    {
      id: 2,
      user: 'Nguyễn Thu Thảo',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60',
      rating: 4,
      text: 'Truyện hay, cốt truyện sát phạt quyết đoán đúng gu mình. Bản dịch máy thỉnh thoảng có vài từ Hán Việt chưa dịch nghĩa kỹ nhưng tổng thể vẫn rất dễ hiểu.',
      time: '5 giờ trước',
      likes: 8
    },
    {
      id: 3,
      user: 'Trần Minh Đức',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60',
      rating: 5,
      text: 'So sánh bản dịch Metruyenchu với trang này thì bản ở đây sạch QC hơn nhiều. Giao diện đọc truyện tối ưu tốt trên di động.',
      time: '1 ngày trước',
      likes: 19
    }
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentRating, setNewCommentRating] = useState(5);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());

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
    fetchChaptersList();
    checkIfFavorite();
  }, [bookId, user]);

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
      }
    } catch {
      try {
        const res = await bookService.getBooks({ q: '', page: 1, limit: 100 });
        const list = (res as any)?.books || (res as any)?.data?.books || [];
        const found = list.find((b: any) => b.id === parseInt(bookId));
        if (found) {
          setBook(found);
          logReadingHistory(found);
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
          }
        }
      } catch {
        setError(lang === 'vi' ? 'Không tải được thông tin truyện.' : lang === 'en' ? 'Failed to load book details.' : '无法加载小说详情。');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchChaptersList = async () => {
    setChaptersLoading(true);
    try {
      const list: ChapterItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: lang === 'vi' ? `Chương ${i + 1}: Tiết tử và khởi nguyên` : lang === 'en' ? `Chapter ${i + 1}: Prologue` : `第 ${i + 1} 章: 楔子与起源`,
        url_idx: i + 1
      }));
      setChapters(list);
    } catch (e) {
      console.error(e);
    } finally {
      setChaptersLoading(false);
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

  const handleLikeComment = (commentId: number) => {
    setLikedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
        setComments(comments.map(c => c.id === commentId ? { ...c, likes: c.likes - 1 } : c));
      } else {
        next.add(commentId);
        setComments(comments.map(c => c.id === commentId ? { ...c, likes: c.likes + 1 } : c));
      }
      return next;
    });
  };

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const commentObj: CommentItem = {
      id: Date.now(),
      user: user ? (user.name || user.email?.split('@')[0]) : (lang === 'vi' ? 'Khách vãng lai' : lang === 'en' ? 'Guest user' : '访客'),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60',
      rating: newCommentRating,
      text: newCommentText,
      time: lang === 'vi' ? 'Vừa xong' : lang === 'en' ? 'Just now' : '刚刚',
      likes: 0
    };

    setComments([commentObj, ...comments]);
    setNewCommentText('');
    setNewCommentRating(5);
  };

  const getParsedSources = (): ParsedSource[] => {
    if (!book) return [];
    const list: ParsedSource[] = [];
    if (book.parsed_sources && book.parsed_sources.length > 0) {
      book.parsed_sources.forEach(src => {
        list.push({ site: src.source, url: src.url });
      });
    } else if (book.urls) {
      const parts = book.urls.split(' | ');
      for (const p of parts) {
        const idx = p.indexOf(':');
        if (idx > 0) {
          list.push({
            site: p.substring(0, idx).trim(),
            url: p.substring(idx + 1).trim()
          });
        }
      }
    }
    return list;
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
