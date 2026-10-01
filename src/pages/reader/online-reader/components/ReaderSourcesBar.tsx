import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Target, Eye, Search, X, ExternalLink } from 'lucide-react';
import { SourceItem, SearchMenuState } from '../Reader.types';

interface ReaderSourcesBarProps {
  allSourcesToRender: SourceItem[];
  isCurrentChapterPlaying: boolean;
  activeAudioObj: any;
  bookId?: string;
  chapterIdx?: string;
  bookTitle: string;
  bookDetails: any;
  autoScrollTts: boolean;
  onToggleAutoScroll: () => void;
  onTTSPlay: () => void;
  openInBrowser: (url: string) => void;
  t: any;
}

export const ReaderSourcesBar: React.FC<ReaderSourcesBarProps> = ({
  allSourcesToRender,
  isCurrentChapterPlaying,
  activeAudioObj,
  bookId,
  chapterIdx,
  bookTitle,
  bookDetails,
  autoScrollTts,
  onToggleAutoScroll,
  onTTSPlay,
  openInBrowser,
  t
}) => {
  const navigate = useNavigate();
  const [searchMenu, setSearchMenu] = useState<SearchMenuState | null>(null);
  const [customKeyword, setCustomKeyword] = useState('miễn phí đọc mới nhất');

  const triggerSearch = (engine: 'google' | 'baidu', language: 'vi' | 'zh') => {
    if (!searchMenu) return;
    const { site } = searchMenu;
    const bookTitleStr = bookDetails?.title || bookTitle || '';
    const bookAuthorStr = bookDetails?.author || '';
    const bookTitleVi = bookDetails?.title_vietphrase || bookTitle || '';
    const bookAuthorVi = bookDetails?.author_hanviet || '';

    const query = language === 'vi'
      ? `${bookTitleVi.trim()} ${bookAuthorVi.trim()} ${site} ${customKeyword}`.trim()
      : `${bookTitleStr.trim()} ${bookAuthorStr.trim()} ${site} ${customKeyword}`.trim();

    const searchUrl = engine === 'baidu'
      ? `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`
      : `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    openInBrowser(searchUrl);
    setSearchMenu(null);
  };

  const getLogoColor = (site: string) => {
    const s = site.toLowerCase();
    if (s.includes('biquge') || s.includes('full') || s.includes('truyenfull')) return 'bg-sky-500 text-white';
    if (s.includes('faloo') || s.includes('vcomi') || s.includes('fanqie')) return 'bg-orange-500 text-white';
    if (s.includes('quanben') || s.includes('hjwzw')) return 'bg-purple-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  return (
    <div className="flex flex-col gap-4 border-b border-slate-500/10 pb-4 reader-overlay">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase mr-1">Nguồn truyện:</span>
          {allSourcesToRender.map((src, idx) => {
            const logoColor = getLogoColor(src.site);
            if (src.isSearch) {
              return (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchMenu(prev => prev?.site === src.site ? null : { site: src.site, isChinese: src.isChinese });
                  }}
                  className={`inline-flex items-center gap-1 bg-[#0b0b14]/20 border border-dashed border-[#1f1f3a]/80 hover:border-purple-500/50 rounded-lg px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200 transition-all ${
                    searchMenu?.site === src.site ? 'border-purple-500 text-white bg-purple-950/20' : ''
                  }`}
                  title={`Không có link trực tiếp. Click để tìm kiếm trên Google/Baidu cho ${src.site}`}
                >
                  <span className={`w-3 h-3 rounded flex items-center justify-center text-[7px] font-extrabold ${logoColor} opacity-60`}>
                    {src.site[0]}
                  </span>
                  {src.site}
                  <Search className="w-2.5 h-2.5 text-slate-500 ml-0.5" />
                </button>
              );
            }

            return (
              <a
                key={idx}
                href={src.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  const win = window as any;
                  const isNative = win.electron || (win.Capacitor?.isNativePlatform && win.Capacitor.isNativePlatform());
                  if (isNative && src.url) {
                    e.preventDefault();
                    openInBrowser(src.url);
                  }
                }}
                className="cursor-pointer inline-flex items-center gap-1 bg-purple-950/20 hover:bg-purple-900/40 border border-purple-500/25 hover:border-purple-500/45 text-purple-300 rounded-lg px-2 py-0.5 text-[11px] font-black transition-all hover:scale-[1.02]"
                title={`Đi tới ${src.site} gốc`}
              >
                <span className={`w-3 h-3 rounded flex items-center justify-center text-[8px] font-extrabold ${logoColor}`}>
                  {src.site[0]}
                </span>
                {src.site}
                <ExternalLink className="w-2.5 h-2.5 text-purple-400 ml-0.5" />
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-1 bg-[#12122b]/50 border border-purple-500/10 p-1 rounded-xl shadow-md">
          <button
            onClick={onTTSPlay}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isCurrentChapterPlaying
                ? 'bg-purple-600 border border-purple-600 text-white shadow shadow-purple-500/25'
                : 'border-transparent text-slate-300 hover:bg-white/5'
            }`}
          >
            {isCurrentChapterPlaying ? <Pause className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
            <span>{isCurrentChapterPlaying ? (t.reader?.pauseBtn || "Dừng đọc AI") : (t.reader?.playBtn || "Đọc Audio AI")}</span>
          </button>

          {activeAudioObj && (
            <>
              <button
                onClick={() => {
                  const isSameBook = String(activeAudioObj.book?.id) === String(bookId);
                  if (isSameBook) {
                    if (activeAudioObj.chapterIdx !== parseInt(chapterIdx || '1')) {
                      navigate(`/book/${bookId}/read/${activeAudioObj.chapterIdx}`);
                    } else {
                      const activeEl = document.getElementById('active-tts-sentence');
                      if (activeEl) {
                        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }
                  } else {
                    alert("Đang phát ở sách khác: " + (activeAudioObj.book?.title || "Không rõ"));
                  }
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                title="Quay lại vị trí/chương đang đọc"
              >
                <Target className="w-4 h-4" />
              </button>

              <button
                onClick={onToggleAutoScroll}
                className={`p-1.5 rounded-lg transition-all ${
                  autoScrollTts ? 'text-purple-400 bg-purple-500/10' : 'text-slate-500 hover:text-slate-300'
                }`}
                title={autoScrollTts ? "Tắt tự động cuộn trang" : "Bật tự động cuộn trang"}
              >
                <Eye className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {searchMenu && (
        <div className="relative z-35 p-3.5 bg-[#0c0d1e]/98 border border-purple-500/45 rounded-xl shadow-2xl backdrop-blur-xl text-slate-200 text-xs space-y-3 max-w-md animate-slideUp">
          <div className="flex justify-between items-center border-b border-purple-500/10 pb-1.5">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-purple-300 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-purple-400" /> Tìm kiếm nguồn {searchMenu.site}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setSearchMenu(null); }}
              className="p-0.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Từ khóa phụ bổ sung</label>
            <input
              type="text"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              placeholder="miễn phí, mới nhất, raw..."
              className="w-full px-2.5 py-1.5 bg-[#080814] border border-[#1f1f3a] rounded-lg text-slate-200 outline-none focus:border-purple-500/70 transition-colors text-[10px]"
            />
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={() => triggerSearch('google', 'vi')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition-all"
            >
              <span className="flex items-center gap-1.5">🇻🇳 Tìm Google Tiếng Việt</span>
              <span className="text-[9px] text-purple-200 italic font-medium">Tên dịch + Tác giả Việt</span>
            </button>
            <button
              onClick={() => triggerSearch('google', 'zh')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-all"
            >
              <span className="flex items-center gap-1.5">🇨🇳 Tìm Google Tiếng Trung</span>
              <span className="text-[9px] text-blue-200 italic font-medium">Tên gốc + Tác giả Trung</span>
            </button>
            <button
              onClick={() => triggerSearch('baidu', 'zh')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#121225] border border-[#1f1f3a] hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold transition-all"
            >
              <span className="flex items-center gap-1.5">🇨🇳 Tìm Baidu Tiếng Trung (Raw)</span>
              <span className="text-[9px] text-slate-500 italic font-medium">Tên gốc + Tác giả Trung</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
