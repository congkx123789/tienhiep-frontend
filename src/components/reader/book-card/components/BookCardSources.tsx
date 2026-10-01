import React from 'react';
import { Columns, Star } from 'lucide-react';
import { useBrowser } from '../../../../contexts/BrowserContext';

interface BookCardSourcesProps {
  urlsList: Array<{ site: string; url: string }>;
  bookId: string | number;
  isFav?: boolean;
  t: any;
  onCompare?: (id: string | number) => void;
  onToggleFav?: (id: string | number) => void;
}

export const BookCardSources: React.FC<BookCardSourcesProps> = ({
  urlsList,
  bookId,
  isFav,
  t,
  onCompare,
  onToggleFav,
}) => {
  const { openInBrowser } = useBrowser() || {};

  return (
    <>
      <div className="mt-2.5 relative">
        <div className="flex flex-wrap gap-1">
          {urlsList.map((u, i) => {
            let logoColor = 'bg-emerald-500 text-white';
            const siteLower = u.site.toLowerCase();
            if (siteLower.includes('biquge') || siteLower.includes('full') || siteLower.includes('truyenfull')) {
              logoColor = 'bg-sky-500 text-white';
            } else if (siteLower.includes('faloo') || siteLower.includes('vcomi') || siteLower.includes('fanqie')) {
              logoColor = 'bg-orange-500 text-white';
            } else if (siteLower.includes('quanben') || siteLower.includes('hjwzw')) {
              logoColor = 'bg-purple-500 text-white';
            }
            
            return (
              <a 
                key={i} 
                href={u.url} 
                target="_blank" 
                rel="noreferrer" 
                onClick={(e) => {
                  const isNativeApp = (window as any).electron || ((window as any).Capacitor?.isNativePlatform && (window as any).Capacitor.isNativePlatform());
                  if (isNativeApp && openInBrowser) {
                    e.preventDefault();
                    e.stopPropagation();
                    openInBrowser(u.url);
                  }
                }}
                className="inline-flex items-center gap-1 bg-[#0b0b14]/40 border border-[#1f1f3a] hover:border-purple-500/30 rounded px-1.5 py-0.5 text-[9px] text-slate-300 hover:text-white transition-all"
              >
                <span className={`w-3 h-3 rounded flex items-center justify-center text-[8px] font-extrabold ${logoColor}`}>
                  {u.site[0]}
                </span>
                {u.site}
              </a>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-2 border-t border-[#1f1f3a]/20">
        <button 
          onClick={() => onCompare && onCompare(bookId)}
          className="flex-1 inline-flex items-center justify-center gap-1 bg-transparent border border-purple-500/30 text-purple-400 hover:bg-purple-600/10 py-2.5 sm:py-1.5 rounded-lg text-[10px] font-bold transition-all min-h-[36px]"
        >
          <Columns className="w-3 h-3" /> So sánh bản dịch
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFav && onToggleFav(bookId); }}
          className={`px-3 py-2.5 sm:px-2 sm:py-1.5 border rounded-lg text-[10px] font-semibold transition-all min-h-[36px] ${
            isFav 
              ? 'bg-amber-400 border-amber-400 text-[#0b0b14]' 
              : 'bg-amber-400/5 border-amber-400/30 text-amber-400 hover:bg-amber-400/15'
          }`}
          title={isFav ? (t?.removeExternal || 'Bỏ yêu thích') : (t?.addBookshelf || 'Thêm vào tủ sách')}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </>
  );
};
