import React from 'react';
import { BookCard } from '../../../../components';

interface DiscoverBookGridProps {
  books: any[];
  bookshelfIds: Set<number>;
  comparingBookId: number | null;
  comparisonData: any;
  compLoading: boolean;
  lang: string;
  t: any;
  onToggleFav: (id: number) => void;
  onCompare: (id: number) => void;
  onPlayTrailer: (book: any) => void;
  onSearchAuthor: (author: string) => void;
  onSearchCategory: (cat: string) => void;
  onRead: (book: any) => void;
}

export const DiscoverBookGrid: React.FC<DiscoverBookGridProps> = ({
  books,
  bookshelfIds,
  comparingBookId,
  comparisonData,
  compLoading,
  lang,
  t,
  onToggleFav,
  onCompare,
  onPlayTrailer,
  onSearchAuthor,
  onSearchCategory,
  onRead
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {books.map((b: any) => (
        <div key={b.id} className="flex flex-col">
          <BookCard 
            book={b}
            isFav={bookshelfIds.has(b.id)}
            onToggleFav={onToggleFav}
            onCompare={onCompare}
            onPlayTrailer={onPlayTrailer}
            onSearchAuthor={onSearchAuthor}
            onSearchCategory={onSearchCategory}
            onRead={onRead}
          />

          {comparingBookId === b.id && (
            <div className="bg-[#0f101f] border border-[#1f1f3a] rounded-b-2xl p-4 text-xs mt-[-10px] space-y-4 shadow-inner">
              {compLoading ? (
                <div className="text-center text-slate-500 py-3">{t.comparingText}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead>
                      <tr className="border-b border-[#2d2d55] text-slate-400 font-bold">
                        <th className="pb-2">{lang === 'vi' ? 'Bộ máy dịch' : 'Engine'}</th>
                        <th className="pb-2">{lang === 'vi' ? 'Tiêu đề bản dịch' : 'Translated Title'}</th>
                        <th className="pb-2">{lang === 'vi' ? 'Đặc điểm' : 'Characteristics'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f3a]">
                      <tr>
                        <td className="py-2 font-semibold text-purple-400">Vietphrase AI</td>
                        <td className="py-2 text-slate-200 font-bold">{comparisonData?.vietphrase?.title || b.title_vietphrase || b.title}</td>
                        <td className="py-2 text-emerald-400 text-[10px]">Ngữ nghĩa Hán-Việt</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-blue-400">Hán Việt Char</td>
                        <td className="py-2 text-slate-200 font-bold">{comparisonData?.hanviet?.title || b.title_hanviet || b.title}</td>
                        <td className="py-2 text-sky-400 text-[10px]">Âm Hán nguyên bản</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-emerald-400">CMLM Neural</td>
                        <td className="py-2 text-slate-200 font-bold">{comparisonData?.advanced?.title || b.title_vietphrase || b.title}</td>
                        <td className="py-2 text-emerald-300 text-[10px]">Ngữ cảnh mượt mà</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
