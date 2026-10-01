import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Volume2 } from 'lucide-react';
import { BookItem } from '../BookCard.types';

interface BookCardHeaderProps {
  book: BookItem;
  displayTitle: string;
  displayAuthor: string;
  rawDesc: string;
  onRead?: (book: BookItem) => void;
  onPlayTrailer?: (book: BookItem) => void;
}

export const BookCardHeader: React.FC<BookCardHeaderProps> = ({
  book,
  displayTitle,
  displayAuthor,
  rawDesc,
  onRead,
  onPlayTrailer,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3">
      {book.cover ? (
        <img 
          src={book.cover} 
          alt="cover" 
          className="w-[60px] h-[82px] object-cover rounded-lg border border-[#2d2d55] shadow-md shrink-0 bg-[#0f0f1a] cursor-pointer hover:opacity-90 transition-opacity"
          onError={(e) => { (e.target as HTMLElement).remove(); }}
          onClick={() => onRead && onRead(book)}
        />
      ) : (
        <div 
          className="w-[60px] h-[82px] rounded-lg border border-[#2d2d55] bg-[#0f0f1a] flex items-center justify-center text-slate-500 shrink-0 shadow-md cursor-pointer hover:bg-[#1a1a2e] transition-colors"
          onClick={() => onRead && onRead(book)}
        >
          <Book className="w-5 h-5" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h3 
            className="text-slate-100 font-bold text-xs hover:text-purple-400 transition-colors cursor-pointer flex-1 whitespace-normal break-words line-clamp-2" 
            onClick={() => onRead && onRead(book)}
            title={displayTitle}
          >
            {displayTitle}
          </h3>
          
          {rawDesc && (
            <button
              onClick={() => onPlayTrailer && onPlayTrailer(book)}
              className="p-1 rounded bg-[#1f1f3a] hover:bg-purple-600 hover:text-white text-purple-400 transition-colors shrink-0"
              title="Nghe tóm tắt AI (TTS)"
            >
              <Volume2 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
          <div className="whitespace-normal break-words">
            Tác giả: <span 
              onClick={() => {
                const authorName = book.author || book.author_hanviet || displayAuthor;
                if (authorName && authorName !== '—') {
                  navigate(`/author/${encodeURIComponent(authorName)}`);
                }
              }}
              className="text-purple-400 hover:text-purple-300 cursor-pointer underline hover:no-underline font-semibold"
              title="Xem hồ sơ tác giả"
            >
              {displayAuthor}
            </span>
          </div>
          <div className="whitespace-normal break-words line-clamp-1">
            Gốc: <span className="text-slate-400">{book.title || '—'}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-1.5">
          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-amber-500/10 border border-amber-500/20 text-amber-400">
            {book.site_count || 5} nguồn
          </span>
          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            {book.site_count || 5} site
          </span>
          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            {book.word_count_max ? `${Math.round(book.word_count_max / 1000)}k chữ` : 'Chưa rõ số chữ'}
          </span>
        </div>
      </div>
    </div>
  );
};
