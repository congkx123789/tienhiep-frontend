import MainLayout from '../../../layouts/main';
import { BookCard } from '../../../components';
import { BookMarked, Loader, CheckSquare, Square } from 'lucide-react';
import { useBookshelf } from './useBookshelf';
import { BookshelfToolbar } from './components/BookshelfToolbar';
import { BookshelfComparisonBox } from './components/BookshelfComparisonBox';

export default function Bookshelf() {
  const b = useBookshelf();

  if (b.authLoading) {
    return (
      <MainLayout>
        <div className="py-20 text-center text-slate-500">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
          <span>{b.lang === 'vi' ? 'Đang tải thông tin...' : b.lang === 'en' ? 'Loading info...' : '正在加载信息...'}</span>
        </div>
      </MainLayout>
    );
  }

  if (!b.user) {
    return (
      <MainLayout>
        <div className="py-20 text-center text-slate-500">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto mb-4">
            🔒
          </div>
          <p className="text-sm">{b.t.loginToViewBookshelf || 'Vui lòng đăng nhập để xem tủ sách.'}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <BookshelfToolbar
        books={b.books}
        isEditMode={b.isEditMode}
        setIsEditMode={b.setIsEditMode}
        selectedBookIds={b.selectedBookIds}
        setSelectedBookIds={b.setSelectedBookIds}
        handleSelectAll={b.handleSelectAll}
        handleBulkDelete={b.handleBulkDelete}
        q={b.q}
        setQ={b.setQ}
        lang={b.lang}
      />

      {b.loading ? (
        <div className="py-20 text-center text-slate-500">
          <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
          <span>{b.t.loading || 'Đang tải...'}</span>
        </div>
      ) : b.books.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-[#121225]/40 border border-dashed border-[#1f1f3a] rounded-2xl">
          <BookMarked className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-sm">{b.lang === 'vi' ? 'Tủ sách trống. Hãy thêm truyện từ tab Khám Phá!' : b.lang === 'en' ? 'Bookshelf is empty. Add novels from Discover tab!' : '书架空空如也。请从“发现”选项卡中添加小说！'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {b.books.map((book) => {
            const isSelected = b.selectedBookIds.has(book.id);
            return (
              <div key={book.id || book.url} className="flex flex-col relative group">
                {b.isEditMode && (
                  <div
                    onClick={() => b.handleSelectBook(book.id)}
                    className={`absolute top-3 left-3 z-30 w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-all shadow-md ${
                      isSelected
                        ? 'bg-purple-600 border-purple-500 text-white shadow-purple-500/20'
                        : 'bg-[#0f101f]/95 border-slate-700/80 text-slate-500 hover:bg-purple-950/25 hover:border-purple-500/50'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="w-4.5 h-4.5" /> : <Square className="w-4.5 h-4.5" />}
                  </div>
                )}

                <div className={b.isEditMode ? 'opacity-70 transition-opacity' : ''}>
                  <BookCard
                    book={book}
                    isFav={true}
                    onToggleFav={b.handleToggleFav}
                    onRead={(selected) => selected.id && b.navigate(`/book/${selected.id}`)}
                    onCompare={b.handleCompare}
                    onPlayTrailer={b.handlePlayTrailer}
                    onSearchAuthor={(author) => b.navigate(`/?search_field=author&q=${encodeURIComponent(author)}`)}
                    onSearchCategory={(cat) => b.navigate(`/?category=${encodeURIComponent(cat)}`)}
                  />
                </div>

                {b.comparingBookId === book.id && (
                  <BookshelfComparisonBox
                    compLoading={b.compLoading}
                    comparisonData={b.comparisonData}
                    t={b.t}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}
