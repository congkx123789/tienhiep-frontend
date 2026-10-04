import { useState, useEffect, useRef } from 'react';
import {
  SkipBack, SkipForward, Target, Volume2, Languages,
  SlidersHorizontal, Sparkles, ArrowUpToLine, ArrowDownToLine,
  RotateCw, X, GripHorizontal
} from 'lucide-react';

interface ReaderQuickToolsProps {
  onToolAction?: (action: string, payload?: any) => void;
  isAudioPlaying?: boolean;
  isAutoTranslateActive?: boolean;
}

export default function ReaderQuickTools({ onToolAction, isAudioPlaying, isAutoTranslateActive }: ReaderQuickToolsProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('__tienhiep_quick_tools_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 640 || ('ontouchstart' in window && window.innerWidth <= 800);
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640 || ('ontouchstart' in window && window.innerWidth <= 800));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('__tienhiep_quick_tools_pos');
      if (saved && typeof window !== 'undefined') {
        const p = JSON.parse(saved);
        if (p && typeof p.x === 'number' && typeof p.y === 'number') {
          const w = window.innerWidth, h = window.innerHeight;
          const maxX = Math.max(8, w - 440), maxY = Math.max(8, h - 60);
          return { x: Math.max(8, Math.min(maxX, p.x)), y: Math.max(8, Math.min(maxY, p.y)) };
        }
      }
    } catch {}
    return null;
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clampPos = () => {
      const w = window.innerWidth, h = window.innerHeight;
      setIsMobile(w <= 640 || ('ontouchstart' in window && w <= 800));
      setPosition(prev => {
        if (!prev) return null;
        const dockW = containerRef.current?.offsetWidth || 440;
        const dockH = containerRef.current?.offsetHeight || 52;
        const maxX = Math.max(8, w - dockW - 12);
        const maxY = Math.max(8, h - dockH - 12);
        if (prev.x > maxX || prev.y > maxY || prev.x < 8 || prev.y < 8) {
          const clamped = { x: Math.max(8, Math.min(prev.x, maxX)), y: Math.max(8, Math.min(prev.y, maxY)) };
          try { localStorage.setItem('__tienhiep_quick_tools_pos', JSON.stringify(clamped)); } catch {}
          return clamped;
        }
        return prev;
      });
    };
    clampPos();
    const timer = setTimeout(clampPos, 100);
    window.addEventListener('resize', clampPos);
    return () => { clearTimeout(timer); window.removeEventListener('resize', clampPos); };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'Home') { e.preventDefault(); onToolAction?.('home'); }
      else if (e.key === 'End') { e.preventDefault(); onToolAction?.('end'); }
      else if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) { e.preventDefault(); onToolAction?.('reload'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToolAction]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isMobile) return;
    if ((e.target as HTMLElement).closest('button')) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    isDraggingRef.current = true;
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, initX: rect.left, initY: rect.top };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || isMobile) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    const dockW = containerRef.current?.offsetWidth || 380;
    const dockH = containerRef.current?.offsetHeight || 48;
    const newX = Math.max(8, Math.min(window.innerWidth - dockW - 8, dragStartRef.current.initX + dx));
    let newY = Math.max(8, Math.min(window.innerHeight - dockH - 8, dragStartRef.current.initY + dy));
    // Tự động hít bám vào đáy nếu kéo gần mép dưới
    if (newY >= window.innerHeight - dockH - 24) newY = window.innerHeight - dockH - 8;
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); } catch {}
      if (position) {
        try { localStorage.setItem('__tienhiep_quick_tools_pos', JSON.stringify(position)); } catch {}
      }
    }
  };

  const handleResetPosition = () => {
    setPosition(null);
    try { localStorage.removeItem('__tienhiep_quick_tools_pos'); } catch {}
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('__tienhiep_quick_tools_collapsed', String(next)); } catch {}
      return next;
    });
  };

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToolAction) onToolAction(action);
  };

  if (isCollapsed) {
    return (
      <div className="fixed right-3 bottom-6 z-[99999] select-none pointer-events-auto">
        <button
          type="button"
          onClick={toggleCollapse}
          className="w-10 h-10 rounded-full bg-white text-violet-700 flex items-center justify-center border border-violet-200 shadow-[0_8px_25px_rgba(124,58,237,0.25)] hover:scale-105 active:scale-90 transition-all cursor-pointer group"
          title="Mở thanh công cụ đọc truyện (Tiên Hiệp Quick Dock)"
        >
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform text-violet-600" />
        </button>
      </div>
    );
  }

  const containerStyle = (position && !isMobile)
    ? { left: `${position.x}px`, top: `${position.y}px` }
    : { left: '50%', transform: 'translateX(-50%)', bottom: isMobile ? 'calc(6px + env(safe-area-inset-bottom, 0px))' : '10px' };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={containerStyle}
      className={`fixed z-[99999] select-none pointer-events-auto max-w-[calc(100vw-12px)] opacity-90 hover:opacity-100 transition-opacity duration-200 ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="flex items-center gap-0.5 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-white/95 hover:bg-white text-slate-700 backdrop-blur-2xl border border-slate-200/90 rounded-full shadow-[0_12px_40px_-4px_rgba(0,0,0,0.18)] ring-1 ring-slate-900/5 shrink-0">
        {!isMobile && (
          <div
            onDoubleClick={handleResetPosition}
            className="text-slate-400 hover:text-slate-600 px-0.5 cursor-grab active:cursor-grabbing"
            title="Kéo di chuyển / Nhấp đúp để đặt lại về giữa đáy"
          >
            <GripHorizontal className="w-3.5 h-3.5" />
          </div>
        )}

        {/* 1. Cài Đặt Dịch [ ⚙️ ] */}
        <button
          type="button"
          onClick={(e) => handleAction('settings', e)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-90 border border-slate-200/70"
          title="Bảng Cài Đặt Dịch Thuật CMLM & Công Cụ (⚙️)"
        >
          <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* 2. Dịch Trang [ 🌐 ] */}
        <button
          type="button"
          onClick={(e) => handleAction('translate', e)}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            isAutoTranslateActive
              ? 'bg-emerald-600 ring-2 ring-emerald-400 text-white shadow-md shadow-emerald-500/40 animate-pulse'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
          }`}
          title={isAutoTranslateActive ? 'Đang bật Tự động dịch (Click để dịch lại)' : 'Dịch trang web bằng CMLM NAT INT8 (🌐)'}
        >
          <Languages className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* 3. Tải Lại Trang [ ⟳ F5 ] */}
        <button
          type="button"
          onClick={(e) => handleAction('reload', e)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-sky-50 hover:bg-sky-100 text-sky-600 active:scale-90 border border-sky-200/80 shadow-sm"
          title="Tải lại trang web (Phím F5 ⟳)"
        >
          <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* 4. Đầu Trang [ ⤒ Home ] */}
        <button
          type="button"
          onClick={(e) => handleAction('home', e)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-90 border border-slate-200/80 shadow-sm"
          title="Cuộn lên đầu trang (Phím Home ⤒)"
        >
          <ArrowUpToLine className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* 5. Về chương trước [ |< ] */}
        <button
          type="button"
          onClick={(e) => handleAction('prev', e)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-90 border border-slate-200/70"
          title="Về chương trước (|<)"
        >
          <SkipBack className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* 6. Audio TTS [ 🔊 ] */}
        <button
          type="button"
          onClick={(e) => handleAction('audio', e)}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all active:scale-90 border-2 ${
            isAudioPlaying
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white border-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.6)] animate-pulse'
              : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 text-white border-violet-300/40 shadow-[0_4px_14px_rgba(124,58,237,0.35)]'
          }`}
          title={isAudioPlaying ? 'Dừng đọc Audio truyện (TTS)' : 'Nghe đọc Audio truyện (TTS C++ Native) 🔊'}
        >
          <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* 7. Sang chương tiếp theo [ >| ] */}
        <button
          type="button"
          onClick={(e) => handleAction('next', e)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white active:scale-90 shadow-sm"
          title="Sang chương tiếp theo (>|)"
        >
          <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* 8. Cuối Trang [ ⤓ End ] */}
        <button
          type="button"
          onClick={(e) => handleAction('end', e)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-90 border border-slate-200/80 shadow-sm"
          title="Cuộn xuống cuối trang (Phím End ⤓)"
        >
          <ArrowDownToLine className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* 9. Chỉ định nút Chương Sau [ 🎯 ] */}
        <button
          type="button"
          onClick={(e) => handleAction('teach_next', e)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 active:scale-90 border border-amber-200/80 shadow-sm"
          title="Chỉ định vùng đọc & Nút Tiếp theo (🎯)"
        >
          <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* 10. Thu gọn Dock [ ✕ ] */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
          title="Thu gọn thanh công cụ đọc truyện"
        >
          <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </button>
      </div>
    </div>
  );
}
