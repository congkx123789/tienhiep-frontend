import { SkipBack, SkipForward, Target, Volume2, Languages } from 'lucide-react';

export default function ReaderQuickTools({ onToolAction }) {
  return (
    <>
      {/* ═══ CỤM NỔI LỀ TRÁI: VỀ CHƯƠNG TRƯỚC & NÚT DỊCH ═══ */}
      <div className="fixed left-3 bottom-24 z-[9990] flex flex-col items-center gap-2.5 select-none pointer-events-auto">
        {/* Nút Bật / Tắt Dịch Trang [ 🌐 ] */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToolAction && onToolAction('translate'); }}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white transition-all duration-200 active:scale-90 border border-emerald-400/50 shadow-[0_6px_20px_rgba(16,185,129,0.45)] backdrop-blur-md group touch-manipulation cursor-pointer"
          title="Dịch trang web sang Tiếng Việt (🌐)"
        >
          <span className="flex items-center justify-center"><Languages className="w-5 h-5 transition-transform group-hover:scale-110" /></span>
        </button>

        {/* Về chương trước [ |< ] */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToolAction && onToolAction('prev'); }}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-950/85 hover:bg-slate-900 text-slate-300 hover:text-white transition-all duration-200 active:scale-90 border border-white/15 hover:border-indigo-500/50 shadow-[0_6px_20px_rgba(0,0,0,0.5)] backdrop-blur-md group touch-manipulation cursor-pointer"
          title="Về chương trước (|<)"
        >
          <span className="flex items-center justify-center"><SkipBack className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /></span>
        </button>
      </div>

      {/* ═══ CỤM NỔI LỀ PHẢI: NGHE TTS, CHỈ ĐỊNH & SANG CHƯƠNG SAU ═══ */}
      <div className="fixed right-3 bottom-24 z-[9990] flex flex-col items-center gap-2.5 select-none pointer-events-auto">
        {/* Nút Nghe Audio TTS [ 🔊 ] */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToolAction && onToolAction('audio'); }}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white transition-all duration-200 active:scale-90 border-2 border-purple-400/60 shadow-[0_8px_25px_rgba(147,51,234,0.6)] backdrop-blur-md group touch-manipulation cursor-pointer animate-pulse"
          title="Nghe đọc Audio truyện (TTS) 🔊"
        >
          <span className="flex items-center justify-center"><Volume2 className="w-5 h-5 transition-transform group-hover:scale-110" /></span>
        </button>

        {/* Chỉ định nút Chương Sau & Vùng đọc [ 🎯 ] */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToolAction && onToolAction('teach_next'); }}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-950/90 hover:bg-amber-950/90 text-amber-400 hover:text-amber-200 transition-all duration-200 active:scale-90 border border-amber-400/50 hover:border-amber-300 shadow-[0_6px_20px_rgba(0,0,0,0.6)] backdrop-blur-md group touch-manipulation cursor-pointer"
          title="Chỉ định vùng đọc theo cây DOM & Nút Chương Sau (🎯)"
        >
          <span className="flex items-center justify-center"><Target className="w-4 h-4 transition-transform group-hover:scale-110" /></span>
        </button>

        {/* Sang chương tiếp theo [ >| ] */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToolAction && onToolAction('next'); }}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white transition-all duration-200 active:scale-90 border border-indigo-400/50 shadow-[0_6px_24px_rgba(99,102,241,0.5)] backdrop-blur-md group touch-manipulation cursor-pointer"
          title="Sang chương tiếp theo (>|)"
        >
          <span className="flex items-center justify-center"><SkipForward className="w-5 h-5 transition-transform group-hover:translate-x-0.5" /></span>
        </button>
      </div>
    </>
  );
}
