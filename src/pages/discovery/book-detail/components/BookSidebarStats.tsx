import { Award, CheckCircle2, Eye, Zap, Star, Book, ExternalLink } from 'lucide-react';
import { useBrowser } from '../../../../contexts/BrowserContext';
import { BookInfo, ParsedSource } from '../BookDetail.types';

interface BookSidebarStatsProps {
  book: BookInfo;
  urlsList: ParsedSource[];
}

export function BookSidebarStats({ book, urlsList }: BookSidebarStatsProps) {
  const { openInBrowser } = useBrowser();

  const handleOpenSource = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (openInBrowser) {
      openInBrowser(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Translation Stats Card */}
      <div className="bg-[#121225]/60 border border-[#1f1f3a] rounded-3xl p-6 space-y-5">
        <h3 className="text-sm font-extrabold text-white border-b border-[#1f1f3a] pb-2.5 flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" /> Thống kê & Chi tiết
        </h3>

        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Trạng thái:
            </span>
            <span className="text-emerald-400 font-bold">Đang cập nhật</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-purple-400" /> Tổng lượt xem:
            </span>
            <span className="text-slate-200 font-bold">
              {book.word_count_max ? Math.round(book.word_count_max * 1.5).toLocaleString() : '340,500'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Tốc độ ra chương:
            </span>
            <span className="text-slate-200 font-bold">~12 chương / ngày</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-purple-400" /> Độ tin cậy nguồn:
            </span>
            <span className="text-indigo-400 font-bold">99.1% (Sạch QC)</span>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-[#1f1f3a]/30">
            <span className="text-slate-500 text-xs flex items-center gap-1.5">
              <Book className="w-3.5 h-3.5 text-purple-400" /> Đọc ở trang gốc (Web thật):
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {urlsList && urlsList.length > 0 ? (
                urlsList.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleOpenSource(src.url, e)}
                    className="inline-flex items-center gap-1 bg-[#0b0b14]/50 border border-[#1f1f3a] hover:border-purple-500/40 rounded px-2 py-1 text-[10px] text-slate-300 hover:text-purple-300 transition-all hover:scale-[1.02]"
                    title={src.url}
                  >
                    <span className="w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-black bg-purple-600 text-white">
                      {src.site[0]}
                    </span>
                    {src.site}
                    <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                  </a>
                ))
              ) : (
                <span className="text-slate-500 italic text-[11px]">Metruyenchu, Biquge (Không tìm thấy link)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Translation Engine Badge */}
      <div className="bg-gradient-to-br from-purple-900/35 to-indigo-950/40 border border-purple-500/20 rounded-3xl p-6 text-center space-y-3.5">
        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center mx-auto text-purple-400">
          <Zap className="w-5 h-5 fill-current animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-black text-white">Dịch thuật bởi Antigravity AI</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Ứng dụng bộ dịch thuật mạng nơ-ron nâng cao giúp chuyển ngữ chính xác ngữ cảnh Hán Việt sang Việt ngữ.
          </p>
        </div>
      </div>
    </div>
  );
}
