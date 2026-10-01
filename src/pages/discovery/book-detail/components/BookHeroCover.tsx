import { useNavigate } from 'react-router-dom';
import { Book, Play, Star, ExternalLink, Share2 } from 'lucide-react';
import { useBrowser } from '../../../../contexts/BrowserContext';
import { BookInfo, ParsedSource } from '../BookDetail.types';

interface BookHeroCoverProps {
  book: BookInfo;
  displayTitle: string;
  displayAuthor: string;
  categoriesList: string[];
  urlsList: ParsedSource[];
  isFav: boolean;
  user: any;
  lang: string;
  handleToggleFav: () => void;
  setShareOpen: (open: boolean) => void;
}

export function BookHeroCover({
  book,
  displayTitle,
  displayAuthor,
  categoriesList,
  urlsList,
  isFav,
  user,
  lang,
  handleToggleFav,
  setShareOpen,
}: BookHeroCoverProps) {
  const navigate = useNavigate();
  const { openInBrowser } = useBrowser();

  const handleOpenSource = (url: string, e: React.MouseEvent) => {
    const isNativeApp = (window as any).electron || ((window as any).Capacitor?.isNativePlatform && (window as any).Capacitor.isNativePlatform());
    if (isNativeApp) {
      e.preventDefault();
      e.stopPropagation();
      openInBrowser(url);
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[#1f1f3a] mb-8 bg-[#0b0b14]/70 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start z-0">
      {book.cover && (
        <div
          className="absolute inset-0 z-[-1] opacity-15 blur-2xl scale-110 bg-cover bg-center"
          style={{ backgroundImage: `url(${book.cover})` }}
        />
      )}

      {book.cover ? (
        <img
          src={book.cover}
          alt="cover"
          className="w-[120px] md:w-[150px] h-[165px] md:h-[210px] object-cover rounded-xl border-2 border-[#1f1f3a]/80 shadow-2xl shrink-0"
        />
      ) : (
        <div className="w-[120px] md:w-[150px] h-[165px] md:h-[210px] bg-[#121225] border-2 border-[#1f1f3a]/80 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
          <Book className="w-12 h-12" />
        </div>
      )}

      <div className="flex-1 min-w-0 text-center md:text-left space-y-3">
        <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
          {displayTitle}
        </h2>
        {lang === 'vi' && (
          <p className="text-slate-400 text-xs font-semibold">
            Hán Việt: {book.title_hanviet || '—'} · Gốc Trung: {book.title}
          </p>
        )}
        <p className="text-purple-400 text-sm md:text-base font-bold">
          ✍ {lang === 'vi' ? 'Tác giả' : lang === 'en' ? 'Author' : '作者'}:{' '}
          <span
            onClick={() => {
              const authorName = book.author || book.author_hanviet;
              if (authorName && authorName !== '—') {
                navigate(`/author/${encodeURIComponent(authorName)}`);
              }
            }}
            className="cursor-pointer hover:underline text-purple-300 font-extrabold hover:text-purple-400 transition-colors"
          >
            {displayAuthor}
          </span>
        </p>

        <div className="flex flex-wrap justify-center md:justify-start gap-2 py-1">
          {categoriesList.map((cat, idx) => (
            <span key={idx} className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
              {cat}
            </span>
          ))}
        </div>

        {urlsList && urlsList.length > 0 && (
          <div className="flex flex-col gap-1.5 py-1 text-left">
            <span className="text-slate-500 text-[10px] font-bold block">
              {lang === 'vi' ? 'Nguồn gốc:' : 'Sources:'}
            </span>
            <div className="flex flex-wrap gap-1.5 relative">
              {urlsList.map((u, i) => (
                <a
                  key={i}
                  href={u.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => handleOpenSource(u.url, e)}
                  className="inline-flex items-center gap-1 bg-[#0b0b14]/40 border border-[#1f1f3a] hover:border-purple-500/30 rounded px-2 py-1 text-[10px] text-slate-300 hover:text-white transition-all hover:scale-[1.02]"
                  title={u.url}
                >
                  <span className="w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-extrabold bg-purple-600 text-white">
                    {u.site[0]}
                  </span>
                  {u.site}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-3">
          <button
            onClick={() => navigate(`/book/${book.id}/read/1`)}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg shadow-purple-500/20 hover:brightness-105 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current" /> {lang === 'vi' ? 'Bắt đầu đọc' : lang === 'en' ? 'Start Reading' : '开始阅读'}
          </button>
          <button
            onClick={handleToggleFav}
            className={`inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-xs font-bold transition-all border ${
              isFav
                ? 'bg-amber-400 border-amber-400 text-[#0b0b14]'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
            }`}
          >
            <Star className="w-4 h-4 fill-current" />
            {isFav ? (lang === 'vi' ? 'Đã lưu vào tủ' : lang === 'en' ? 'Saved in Shelf' : '已收藏') : (lang === 'vi' ? 'Thêm vào tủ' : lang === 'en' ? 'Save to Shelf' : '收藏')}
          </button>
          {urlsList && urlsList.length > 0 && (
            <a
              href={urlsList[0].url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleOpenSource(urlsList[0].url, e)}
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#0b0b14]/50 border border-purple-500/30 hover:bg-purple-500/10 text-purple-300 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
            >
              <ExternalLink className="w-4 h-4" />
              {lang === 'vi' ? 'Trang gốc (Web thật)' : 'Source Web'}
            </a>
          )}
          {user && (
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-200 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
            >
              <Share2 className="w-4 h-4" />
              {lang === 'vi' ? 'Chia sẻ với bạn bè' : 'Share with Friends'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
