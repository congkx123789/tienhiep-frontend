import { useState, useEffect } from 'react';
import {
  SkipBack,
  SkipForward,
  Target,
  Volume2,
  Languages,
  SlidersHorizontal,
  Sparkles,
  ArrowUpToLine,
  ArrowDownToLine,
  RotateCw,
  X
} from 'lucide-react';

interface ReaderQuickToolsProps {
  onToolAction?: (action: string, payload?: any) => void;
  isAudioPlaying?: boolean;
}

export default function ReaderQuickTools({ onToolAction, isAudioPlaying }: ReaderQuickToolsProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('__tienhiep_quick_tools_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'Home') {
        e.preventDefault();
        onToolAction?.('home');
      } else if (e.key === 'End') {
        e.preventDefault();
        onToolAction?.('end');
      } else if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        onToolAction?.('reload');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToolAction]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('__tienhiep_quick_tools_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToolAction) {
      onToolAction(action);
    }
  };

  // Trạng thái thu gọn: Mini Gem Bubble nổi gọn ở góc phải dưới
  if (isCollapsed) {
    return (
      <div className="fixed right-3 bottom-6 z-[99999] select-none pointer-events-auto">
        <button
          type="button"
          onClick={toggleCollapse}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-indigo-600 to-slate-900 text-purple-100 flex items-center justify-center border border-purple-400/50 shadow-[0_4px_20px_rgba(147,51,234,0.4)] backdrop-blur-md opacity-70 hover:opacity-100 active:scale-90 transition-all cursor-pointer group"
          title="Mở thanh công cụ đọc truyện (Tiên Hiệp Quick Dock)"
        >
          <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform text-amber-300" />
        </button>
      </div>
    );
  }

  // Trạng thái mở rộng: Floating Capsule Dock đặt gọn ở góc dưới
  return (
    <div className="fixed right-2 sm:right-4 bottom-5 z-[99999] select-none pointer-events-auto max-w-[calc(100vw-16px)] overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 bg-slate-950/92 backdrop-blur-xl border border-purple-500/30 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.85)] ring-1 ring-white/10 shrink-0">
        {/* 1. Nút Cài Đặt Dịch & Bảng Tiện Ích [ ⚙️ ] */}
        <button
          type="button"
          onClick={(e) => handleAction('settings', e)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 text-indigo-300 hover:text-white transition-all active:scale-90 border border-white/10"
          title="Bảng Cài Đặt Dịch Thuật CMLM & Công Cụ (⚙️)"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* 2. Nút Bật / Tắt Dịch Trang [ 🌐 ] */}
        <button
          type="button"
          onClick={(e) => handleAction('translate', e)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-600/80 hover:bg-emerald-500 text-white transition-all active:scale-90 border border-emerald-400/40 shadow-sm"
          title="Dịch trang web bằng CMLM NAT INT8 (🌐)"
        >
          <Languages className="w-3.5 h-3.5" />
        </button>

        {/* 3. Nút Tải Lại Trang [ ⟳ F5 ] */}
        <button
          type="button"
          onClick={(e) => handleAction('reload', e)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 hover:text-blue-100 transition-all active:scale-90 border border-blue-400/40 shadow-sm"
          title="Tải lại trang web (Phím F5 ⟳)"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* 4. Nút Về Đầu Trang / Đầu Chương [ ⤒ Home ] */}
        <button
          type="button"
          onClick={(e) => handleAction('home', e)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-100 transition-all active:scale-90 border border-cyan-400/40 shadow-sm"
          title="Cuộn lên đầu trang / đầu chương (Phím Home ⤒)"
        >
          <ArrowUpToLine className="w-3.5 h-3.5" />
        </button>

        {/* 5. Về chương trước [ |< ] */}
        <button
          type="button"
          onClick={(e) => handleAction('prev', e)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all active:scale-90 border border-white/10"
          title="Về chương trước (|<)"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        {/* 6. Nút Nghe Audio TTS [ 🔊 ] (Nút Trung Tâm Nổi Bật Nhất) */}
        <button
          type="button"
          onClick={(e) => handleAction('audio', e)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 border-2 ${
            isAudioPlaying
              ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.7)] animate-pulse'
              : 'bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700 hover:from-purple-500 text-white border-purple-400/70 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
          }`}
          title={isAudioPlaying ? 'Dừng đọc Audio truyện (TTS)' : 'Nghe đọc Audio truyện (TTS C++ Native) 🔊'}
        >
          <Volume2 className="w-4 h-4" />
        </button>

        {/* 7. Sang chương tiếp theo [ >| ] */}
        <button
          type="button"
          onClick={(e) => handleAction('next', e)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600/80 hover:bg-indigo-500 text-white transition-all active:scale-90 border border-indigo-400/50 shadow-sm"
          title="Sang chương tiếp theo (>|)"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* 8. Nút Về Cuối Trang / Cuối Chương [ ⤓ End ] */}
        <button
          type="button"
          onClick={(e) => handleAction('end', e)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-100 transition-all active:scale-90 border border-cyan-400/40 shadow-sm"
          title="Cuộn xuống cuối trang / vùng chuyển chương (Phím End ⤓)"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
        </button>

        {/* 9. Chỉ định nút Chương Sau & Vùng đọc [ 🎯 ] */}
        <button
          type="button"
          onClick={(e) => handleAction('teach_next', e)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-100 transition-all active:scale-90 border border-amber-400/50 shadow-sm"
          title="Chỉ định vùng đọc & Nút Tiếp theo (🎯)"
        >
          <Target className="w-3.5 h-3.5" />
        </button>

        {/* 10. Nút Thu gọn Dock [ ✕ ] */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="w-6 h-6 ml-0.5 rounded-full bg-white/5 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="Thu gọn thanh công cụ đọc truyện"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
