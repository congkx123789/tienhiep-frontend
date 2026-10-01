import MainLayout from '../../../layouts/main';
import { GoogleAd } from '../../../components';
import { Loader } from 'lucide-react';
import { useBookDetail } from './useBookDetail';
import { BookHeroCover } from './components/BookHeroCover';
import { BookSynopsisCard } from './components/BookSynopsisCard';
import { BookChaptersList } from './components/BookChaptersList';
import { BookCommentsSection } from './components/BookCommentsSection';
import { BookSidebarStats } from './components/BookSidebarStats';
import { BookShareModal } from './components/BookShareModal';

export default function BookDetail() {
  const d = useBookDetail();

  if (d.loading) {
    return (
      <MainLayout>
        <div className="py-20 text-center text-slate-500">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
          <span>{d.lang === 'vi' ? 'Đang tải thông tin truyện...' : d.lang === 'en' ? 'Loading book details...' : '正在加载小说信息...'}</span>
        </div>
      </MainLayout>
    );
  }

  if (d.error || !d.book) {
    return (
      <MainLayout>
        <div className="py-20 text-center text-red-500 font-bold">
          {d.error || (d.lang === 'vi' ? 'Không tìm thấy truyện.' : d.lang === 'en' ? 'Book not found.' : '未找到小说。')}
        </div>
      </MainLayout>
    );
  }

  const displayTitle = (() => {
    if (d.lang === 'zh' || d.lang === 'en') {
      return d.book.title || '—';
    }
    const viT = d.book.title_vietphrase || d.book.title_hanviet;
    if (viT && d.book.title && viT !== d.book.title) {
      return `${viT} (${d.book.title})`;
    }
    return viT || d.book.title || '—';
  })();

  const displayAuthor = (() => {
    if (d.lang === 'zh') return d.book.author || '—';
    if (d.lang === 'en') return d.book.author_english || d.book.author || '—';
    return d.book.author_hanviet || d.book.author || '—';
  })();

  const displayDescription = (() => {
    if (d.lang === 'zh') return d.book.description || 'Chưa có tóm tắt.';
    if (d.lang === 'en') return d.book.description_english || d.book.description || 'No synopsis available.';
    return d.book.description_vietphrase || d.book.description || 'Chưa có tóm tắt.';
  })();

  const categoriesSource = (() => {
    if (d.lang === 'zh') return d.book.categories || '';
    if (d.lang === 'en') return d.book.categories_english || d.book.categories || '';
    return d.book.categories_vietphrase || d.book.categories || '';
  })();

  const categoriesList = categoriesSource
    ? categoriesSource.split(/[,，/、\s]+/).map((c) => c.trim()).filter(Boolean)
    : [];

  const urlsList = d.getParsedSources();

  return (
    <MainLayout>
      <BookHeroCover
        book={d.book}
        displayTitle={displayTitle}
        displayAuthor={displayAuthor}
        categoriesList={categoriesList}
        urlsList={urlsList}
        isFav={d.isFav}
        user={d.user}
        lang={d.lang}
        handleToggleFav={d.handleToggleFav}
        setShareOpen={d.setShareOpen}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <BookSynopsisCard
            displayDescription={displayDescription}
            expandedDesc={d.expandedDesc}
            setExpandedDesc={d.setExpandedDesc}
          />

          <BookChaptersList
            bookId={d.book.id}
            chapters={d.chapters}
            chaptersLoading={d.chaptersLoading}
          />

          <GoogleAd slot="book-detail-bottom" />

          <BookCommentsSection
            comments={d.comments}
            likedComments={d.likedComments}
            newCommentText={d.newCommentText}
            setNewCommentText={d.setNewCommentText}
            newCommentRating={d.newCommentRating}
            setNewCommentRating={d.setNewCommentRating}
            handleAddComment={d.handleAddComment}
            handleLikeComment={d.handleLikeComment}
          />
        </div>

        <div className="space-y-6">
          <BookSidebarStats
            book={d.book}
            urlsList={urlsList}
          />
        </div>
      </div>

      <BookShareModal
        shareOpen={d.shareOpen}
        setShareOpen={d.setShareOpen}
        shareMessage={d.shareMessage}
        setShareMessage={d.setShareMessage}
        friends={d.friends}
        sharing={d.sharing}
        handleShareBook={d.handleShareBook}
      />
    </MainLayout>
  );
}
