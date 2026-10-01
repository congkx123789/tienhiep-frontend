import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BookItem } from '../BookCard.types';

interface BookCardSummaryProps {
  book: BookItem;
  categoriesList: string[];
  rawDesc: string;
  showDesc: boolean;
  setShowDesc: (show: boolean) => void;
  translateMode: 'original' | 'vi' | 'en';
  descText: string;
  translating: boolean;
  handleTranslateDesc: (mode: 'original' | 'vi' | 'en') => void;
  onSearchCategory?: (cat: string) => void;
}

export const BookCardSummary: React.FC<BookCardSummaryProps> = ({
  book,
  categoriesList,
  rawDesc,
  showDesc,
  setShowDesc,
  translateMode,
  descText,
  translating,
  handleTranslateDesc,
  onSearchCategory,
}) => {
  const getEmotionTags = () => {
    const cats = book.categories || '';
    if (cats.includes('玄幻') || cats.includes('修真') || cats.includes('仙侠') || cats.includes('Huyền Huyện') || cats.includes('Tiên Hiệp')) {
      return ['Sát phạt', 'Vô địch'];
    }
    return ['Hài hước', 'Trí tuệ'];
  };

  return (
    <>
      {categoriesList.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5 items-center">
          <span className="text-slate-500 text-[9px]">Thể loại:</span>
          {categoriesList.map((cat, idx) => (
            <span
              key={idx}
              onClick={() => onSearchCategory && onSearchCategory(cat)}
              className="cursor-pointer px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 text-[8px] font-semibold transition-colors"
              title={`Lọc thể loại ${cat}`}
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center text-slate-400 text-[10px] mt-2.5 border-t border-[#1f1f3a]/40 pt-2">
        <span>
          <strong>Chương:</strong> {book.chapters_max || 110} chương | {book.word_count_max ? (book.word_count_max >= 1000000 ? `${(book.word_count_max / 1000000).toFixed(1)}M chữ` : `${Math.round(book.word_count_max / 1000)}k chữ`) : 'Chưa rõ số chữ'}
        </span>
        {rawDesc && (
          <button
            onClick={() => setShowDesc(!showDesc)}
            className="text-slate-500 hover:text-purple-400 text-[9px] flex items-center gap-0.5 font-bold transition-colors"
          >
            {showDesc ? (
              <>Ẩn tóm tắt <ChevronUp className="w-2.5 h-2.5" /></>
            ) : (
              <>Hiện tóm tắt <ChevronDown className="w-2.5 h-2.5" /></>
            )}
          </button>
        )}
      </div>

      {showDesc && rawDesc && (
        <div className="mt-2.5 bg-[#0b0b14]/50 p-2 rounded-lg border border-[#1a1a2e] transition-all duration-300">
          <div className="flex justify-between items-center mb-1 text-[9px] text-slate-500">
            <span>Tóm tắt:</span>
            <div className="flex gap-1">
              <button 
                onClick={() => handleTranslateDesc('original')}
                className={`px-1 py-0.5 rounded text-[8px] font-bold ${translateMode === 'original' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}
              >
                Gốc
              </button>
              <button 
                onClick={() => handleTranslateDesc('vi')}
                className={`px-1 py-0.5 rounded text-[8px] font-bold ${translateMode === 'vi' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}
                disabled={translating}
              >
                🇻🇳
              </button>
              <button 
                onClick={() => handleTranslateDesc('en')}
                className={`px-1 py-0.5 rounded text-[8px] font-bold ${translateMode === 'en' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}
                disabled={translating}
              >
                🇺🇸
              </button>
            </div>
          </div>
          <p className="text-slate-300 text-[10.5px] line-clamp-none max-h-40 overflow-y-auto pr-1 leading-relaxed custom-scrollbar whitespace-pre-line" title={rawDesc}>
            {translating ? "Đang dịch tóm tắt..." : descText}
          </p>
        </div>
      )}

      <div className="flex gap-1.5 items-center mt-2.5 text-[9px]">
        <span className="text-slate-500">Cảm xúc:</span>
        {getEmotionTags().map((tag, idx) => (
          <span key={idx} className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400 font-extrabold text-[8px]">
            {tag}
          </span>
        ))}
      </div>
    </>
  );
};
