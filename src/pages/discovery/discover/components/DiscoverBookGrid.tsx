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
                        <th className="pb-2">{lang === 'vi' ? 'Chỉ số' : lang === 'en' ? 'Metric' : '指标'}</th>
                        <th className="pb-2">{lang === 'vi' ? 'Điểm số' : lang === 'en' ? 'Score' : '评分'}</th>
                        <th className="pb-2">{lang === 'vi' ? 'Nguồn tiêu biểu' : lang === 'en' ? 'Best Source' : '推荐站'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f3a]">
                      <tr>
                        <td className="py-2 font-semibold text-slate-400">{lang === 'vi' ? 'Tốc độ cập nhật' : lang === 'en' ? 'Update Speed' : '更新速度'}</td>
                        <td className="py-2 text-emerald-400 font-bold">4.8</td>
                        <td className="py-2 text-slate-300">Metruyenchu <span className="text-slate-500 text-[10px]">31 votes</span></td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-400">{lang === 'vi' ? 'Quảng cáo & Sạch' : lang === 'en' ? 'Ads & Cleanliness' : '广告与排版'}</td>
                        <td className="py-2 text-emerald-400 font-bold">4.9</td>
                        <td className="py-2 text-slate-300">TruyenFull <span className="text-slate-500 text-[10px]">81 votes</span></td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-400">{lang === 'vi' ? 'Độ chuẩn bản dịch' : lang === 'en' ? 'Translation Standard' : '翻译准确度'}</td>
                        <td className="py-2 text-emerald-400 font-bold">4.7</td>
                        <td className="py-2 text-slate-300">MeDoc <span className="text-slate-500 text-[10px]">63 votes</span></td>
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
