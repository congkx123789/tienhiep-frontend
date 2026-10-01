import { useNavigate } from 'react-router-dom';
import { ChapterItem } from '../BookDetail.types';

interface BookChaptersListProps {
  bookId: number;
  chapters: ChapterItem[];
  chaptersLoading: boolean;
}

export function BookChaptersList({
  bookId,
  chapters,
  chaptersLoading,
}: BookChaptersListProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#121225]/60 border border-[#1f1f3a] rounded-3xl p-6">
      <h3 className="text-base font-extrabold text-white mb-4">Danh sách chương</h3>
      {chaptersLoading ? (
        <div className="text-center text-slate-500 py-6">Đang tải danh sách chương...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          {chapters.map((chap) => (
            <button
              key={chap.id}
              onClick={() => navigate(`/book/${bookId}/read/${chap.url_idx}`)}
              className="text-left px-4 py-3 bg-[#0b0b14]/50 hover:bg-purple-500/10 border border-[#1f1f3a] hover:border-purple-500/30 rounded-xl text-xs text-slate-300 hover:text-purple-300 transition-all truncate"
            >
              {chap.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
