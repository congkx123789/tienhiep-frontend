import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../layouts/main';
import { useLang } from '../../../contexts/LangContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useBrowser } from '../../../contexts/BrowserContext';
import { AiUpgradeModal, GoogleAd } from '../../../components';
import { RefreshCw, ShieldAlert, Search } from 'lucide-react';
import { useDiscoverHero } from './useDiscoverHero';
import { useDiscoverBooks } from './useDiscoverBooks';
import { DiscoverHero } from './components/DiscoverHero';
import { DiscoverFilterBar } from './components/DiscoverFilterBar';
import { DiscoverRawSources } from './components/DiscoverRawSources';
import { DiscoverBookGrid } from './components/DiscoverBookGrid';
import { DiscoverSidebar } from './components/DiscoverSidebar';

export default function Discover() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openInBrowser, setActiveAudioObj } = useBrowser() || {};
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const getCategoryName = (cat: string) => {
    if (!cat) return t.allCategories;
    const catMap: Record<string, string> = {
      "玄幻": lang === 'vi' ? 'Huyền Huyễn' : lang === 'en' ? 'Fantasy' : '玄幻',
      "都市": lang === 'vi' ? 'Đô Thị' : lang === 'en' ? 'Urban' : '都市',
      "言情": lang === 'vi' ? 'Ngôn Tình' : lang === 'en' ? 'Romance' : '言情',
      "女生": lang === 'vi' ? 'Nữ Sinh' : lang === 'en' ? 'Female Lead' : '女生',
      "科幻": lang === 'vi' ? 'Khoa Huyễn' : lang === 'en' ? 'Sci-Fi' : '科幻',
      "修真": lang === 'vi' ? 'Tu Chân' : lang === 'en' ? 'Cultivation' : '修真',
      "仙侠": lang === 'vi' ? 'Tiên Hiệp' : lang === 'en' ? 'Xianxia' : '仙侠',
      "武侠": lang === 'vi' ? 'Võ Hiệp' : lang === 'en' ? 'Wuxia' : '武侠',
      "历史": lang === 'vi' ? 'Lịch Sử' : lang === 'en' ? 'History' : '历史',
      "网游": lang === 'vi' ? 'Võng Du' : lang === 'en' ? 'Gaming' : '网游',
      "同人": lang === 'vi' ? 'Đồng Nhân' : lang === 'en' ? 'Fanfiction' : '同人',
      "其他": lang === 'vi' ? 'Thể loại khác' : lang === 'en' ? 'Others' : '其他',
    };
    return catMap[cat] || cat;
  };

  const {
    heroIndex,
    setHeroIndex,
    heroBooks,
    activeHero,
    heroDescription,
    heroTranslating,
    translateHeroDescription
  } = useDiscoverHero();

  const {
    books,
    setBooks,
    loading,
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
    total,
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
  } = useDiscoverBooks(user, t);

  const win = typeof window !== 'undefined' ? (window as any) : {};
  const isNative = Boolean(win.electron || win.Capacitor?.isNativePlatform?.());

  return (
    <MainLayout stats={stats}>
      <DiscoverHero
        heroBooks={heroBooks}
        heroIndex={heroIndex}
        activeHero={activeHero}
        heroDescription={heroDescription}
        heroTranslating={heroTranslating}
        lang={lang}
        onSetHeroIndex={setHeroIndex}
        onPlayHeroTrailer={() => setActiveAudioObj?.(activeHero)}
        onTranslateHeroDesc={translateHeroDescription}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <DiscoverFilterBar
            q={q}
            setQ={setQ}
            searchField={searchField}
            setSearchField={setSearchField}
            category={category}
            setCategory={setCategory}
            source={source}
            setSource={setSource}
            dup={dup}
            setDup={setDup}
            minChapters={minChapters}
            setMinChapters={setMinChapters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            total={total}
            lang={lang}
            t={t}
            onSearchSubmit={(e) => { e.preventDefault(); setPage(1); fetchBooks(); }}
            onOpenAiModal={() => setAiModalOpen(true)}
            onRandomGacha={() => fetchBooks({ page: Math.floor(Math.random() * 20) + 1 })}
            onClearFilters={handleClearFilters}
            getCategoryName={getCategoryName}
          />

          {isNative && (
            <DiscoverRawSources lang={lang} openInBrowser={openInBrowser} />
          )}

          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-500" />
              <span>{t.loading}</span>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-500">
              <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-red-400" />
              <span>{error}</span>
            </div>
          ) : books.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <Search className="w-10 h-10 mx-auto mb-3" />
              <span>{t.empty}</span>
            </div>
          ) : (
            <DiscoverBookGrid
              books={books}
              bookshelfIds={bookshelfIds}
              comparingBookId={comparingBookId}
              comparisonData={comparisonData}
              compLoading={compLoading}
              lang={lang}
              t={t}
              onToggleFav={handleToggleFav}
              onCompare={handleCompare}
              onPlayTrailer={(book) => setActiveAudioObj?.(book)}
              onSearchAuthor={(author) => {
                setSearchField('author');
                setQ(author);
                setPage(1);
                fetchBooks({ search_field: 'author', q: author });
              }}
              onSearchCategory={(cat) => {
                setCategory(cat);
                setPage(1);
                fetchBooks({ category: cat });
              }}
              onRead={(book) => book.id && navigate(`/book/${book.id}`)}
            />
          )}

          {totalPages > 1 && (
            <div className="flex flex-wrap justify-center gap-2 pt-6">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-[#121225] border border-[#1f1f3a] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-500 hover:text-white transition-all text-xs font-semibold"
              >
                &laquo; {lang === 'vi' ? 'Trước' : lang === 'en' ? 'Prev' : '上一页'}
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = page;
                if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                if (p < 1 || p > totalPages) return null;

                return (
                  <button 
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg border text-xs font-semibold transition-all ${
                      page === p 
                        ? 'bg-purple-600 border-purple-600 text-white shadow-md' 
                        : 'bg-[#121225] border-[#1f1f3a] hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-[#121225] border border-[#1f1f3a] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-500 hover:text-white transition-all text-xs font-semibold"
              >
                {lang === 'vi' ? 'Sau' : lang === 'en' ? 'Next' : '下一页'} &raquo;
              </button>
            </div>
          )}
        </div>

        <DiscoverSidebar
          leaderboard={leaderboard}
          communityComments={recentComments}
          lang={lang}
        />
      </div>

      <GoogleAd slot="discover-bottom" />

      <AiUpgradeModal 
        isOpen={aiModalOpen} 
        onClose={() => setAiModalOpen(false)} 
        onSelectBook={(selectedBook) => {
          setBooks([selectedBook]);
        }}
      />
    </MainLayout>
  );
}
