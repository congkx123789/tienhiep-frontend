import React from 'react';
import { useLang } from '../../../contexts/LangContext';
import { BookCardProps } from './BookCard.types';
import { useBookCardDesc } from './useBookCardDesc';
import { BookCardHeader } from './components/BookCardHeader';
import { BookCardSummary } from './components/BookCardSummary';
import { BookCardSources } from './components/BookCardSources';

export default function BookCard({ 
  book, 
  isFav, 
  onToggleFav, 
  onCompare, 
  onRead, 
  onPlayTrailer,
  onSearchCategory
}: BookCardProps) {
  const { t, lang } = useLang();

  const parseUrls = (urlsStr?: string) => {
    if (!urlsStr) return [];
    return urlsStr.split(' | ').map(p => {
      const idx = p.indexOf(': ');
      if (idx < 0) return null;
      return { site: p.slice(0, idx), url: p.slice(idx + 2) };
    }).filter(Boolean) as Array<{ site: string; url: string }>;
  };

  const displayTitle = (() => {
    if (lang === 'zh' || lang === 'en') {
      return book.title || '—';
    }
    const viT = book.title_vietphrase || book.title_hanviet;
    if (viT && book.title && viT !== book.title) {
      return `${viT} (${book.title})`;
    }
    return viT || book.title || '—';
  })();

  const displayAuthor = (() => {
    if (lang === 'zh') return book.author || '—';
    if (lang === 'en') return book.author_english || book.author || '—';
    return book.author_hanviet || book.author || '—';
  })();

  const rawDesc = (() => {
    if (lang === 'zh') return book.description || '';
    if (lang === 'en') return book.description_english || book.description || '';
    return book.description_vietphrase || book.description || '';
  })();

  const categoriesSource = (() => {
    if (lang === 'zh') return book.categories || '';
    if (lang === 'en') return book.categories_english || book.categories || '';
    return book.categories_vietphrase || book.categories || '';
  })();

  const categoriesList = categoriesSource
    ? categoriesSource.split(/[,，/、\s]+/).map(c => c.trim()).filter(Boolean)
    : [];

  const urlsList = parseUrls(book.urls);

  const {
    showDesc,
    setShowDesc,
    translateMode,
    descText,
    translating,
    handleTranslateDesc,
  } = useBookCardDesc(rawDesc);

  return (
    <div className="bg-[#121225]/85 border border-[#1f1f3a] rounded-xl p-3.5 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex flex-col justify-between relative overflow-visible min-h-[300px]">
      <div>
        <BookCardHeader
          book={book}
          displayTitle={displayTitle}
          displayAuthor={displayAuthor}
          rawDesc={rawDesc}
          onRead={onRead}
          onPlayTrailer={onPlayTrailer}
        />

        <BookCardSummary
          book={book}
          categoriesList={categoriesList}
          rawDesc={rawDesc}
          showDesc={showDesc}
          setShowDesc={setShowDesc}
          translateMode={translateMode}
          descText={descText}
          translating={translating}
          handleTranslateDesc={handleTranslateDesc}
          onSearchCategory={onSearchCategory}
        />

        <BookCardSources
          urlsList={urlsList}
          bookId={book.id}
          isFav={isFav}
          t={t}
          onCompare={onCompare}
          onToggleFav={onToggleFav}
        />
      </div>
    </div>
  );
}

export * from './BookCard.types';
