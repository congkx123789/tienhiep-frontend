import React, { useEffect, useRef } from 'react';
import { 
  Plus, 
  Shield, 
  RotateCcw, 
  Star, 
  History, 
  Share2, 
  Monitor, 
  Smartphone, 
  Languages, 
  Volume2, 
  ShieldAlert, 
  X,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sliders,
  BrainCircuit
} from 'lucide-react';

export default function ChromeMobileMenu({
  isOpen,
  onClose,
  onNewTab,
  isPrivate,
  onTogglePrivate,
  onReload,
  onOpenHistory,
  isDesktopMode,
  onToggleDesktopMode,
  isAutoTranslate,
  onToggleTranslate,
  isAudioPlaying,
  onToggleAudio,
  cleanAdsActive,
  onToggleCleanAds,
  currentUrl,
  currentTitle,
  onOpenExternal,
  isBookmarked,
  onToggleBookmark,
  onOpenBookmarks,
  canGoBack,
  onGoBack,
  canGoForward,
  onGoForward,
  onOpenTabConfig,
  onOpenTranslationSettings
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    let timer;
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      timer = setTimeout(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);
      }, 60);
    }
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (currentUrl && currentUrl !== 'about:newtab') {
        await navigator.clipboard.writeText(currentUrl);
        alert('Đã sao chép liên kết vào bộ nhớ tạm!');
      }
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share && currentUrl && currentUrl !== 'about:newtab') {
      try {
        await navigator.share({
          title: currentTitle || 'Trang web',
          url: currentUrl
        });
      } catch {}
    } else {
      handleCopyLink();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200000] bg-black/40 backdrop-blur-[2px] flex justify-end items-start animate-fade-in">
      <div 
        ref={menuRef}
        className="w-64 max-w-[85vw] mt-14 mr-2 bg-[#181824] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-2 text-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Quick Actions Bar (Back, Forward, Star, Reload, Share, External, Close) */}
        <div className="flex items-center justify-between px-1 py-2 border-b border-white/10 mb-1">
          <button
            type="button"
            onClick={() => { if (canGoBack && onGoBack) { onGoBack(); onClose(); } }}
            disabled={!canGoBack}
            className={`p-2 rounded-2xl transition-all ${
              canGoBack ? 'hover:bg-white/10 text-slate-300 hover:text-white active:scale-90' : 'text-slate-600 opacity-40 cursor-not-allowed'
            }`}
            title="Quay lại"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => { if (canGoForward && onGoForward) { onGoForward(); onClose(); } }}
            disabled={!canGoForward}
            className={`p-2 rounded-2xl transition-all ${
              canGoForward ? 'hover:bg-white/10 text-slate-300 hover:text-white active:scale-90' : 'text-slate-600 opacity-40 cursor-not-allowed'
            }`}
            title="Tiến tới"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => { if (onToggleBookmark) onToggleBookmark(); }}
            className={`p-2 rounded-2xl hover:bg-white/10 transition-all active:scale-90 ${
              isBookmarked ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'
            }`}
            title={isBookmarked ? "Đã đánh dấu trang" : "Thêm vào dấu trang"}
          >
            <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => { onReload(); onClose(); }}
            className="p-2 rounded-2xl hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-90"
            title="Tải lại trang"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-2xl hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-90"
            title="Chia sẻ liên kết"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {currentUrl && currentUrl.startsWith('http') && onOpenExternal && (
            <button
              type="button"
              onClick={() => { onOpenExternal(currentUrl); onClose(); }}
              className="p-2 rounded-2xl hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition-all active:scale-90"
              title="Mở bằng Chrome Ngoài"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90"
            title="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Items List */}
        <div className="flex flex-col space-y-0.5 text-xs font-medium">
          {/* New Tab */}
          <button
            type="button"
            onClick={() => { onNewTab(false); onClose(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Tab mới</span>
          </button>

          {/* New Incognito Tab */}
          <button
            type="button"
            onClick={() => { onNewTab(true); onClose(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-purple-950/40 text-purple-300 active:bg-purple-900/40 transition-all text-left"
          >
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Tab ẩn danh mới</span>
          </button>

          <div className="h-px bg-white/5 my-1" />

          {/* Bookmarks */}
          <button
            type="button"
            onClick={() => { if (onOpenBookmarks) onOpenBookmarks(); onClose(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
          >
            <Star className="w-4 h-4 text-amber-400" />
            <span>Dấu trang (Bookmarks)</span>
          </button>

          {/* Web History */}
          <button
            type="button"
            onClick={() => { onOpenHistory(); onClose(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Lịch sử duyệt web</span>
          </button>

          {/* Desktop Site Toggle */}
          <button
            type="button"
            onClick={() => { onToggleDesktopMode(); onClose(); }}
            className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              {isDesktopMode ? (
                <Monitor className="w-4 h-4 text-blue-400" />
              ) : (
                <Smartphone className="w-4 h-4 text-slate-400" />
              )}
              <span>Trang web cho máy tính</span>
            </div>
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
              isDesktopMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-500'
            }`}>
              {isDesktopMode && <span className="text-[10px]">✓</span>}
            </div>
          </button>

          {/* Quản lý & Cấu hình Tab */}
          <button
            type="button"
            onClick={() => { if (onOpenTabConfig) onOpenTabConfig(); onClose(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
          >
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>Quản lý & Cấu hình Tab</span>
          </button>

          <div className="h-px bg-white/5 my-1" />

          {/* Tiện ích Đọc Truyện & AI */}
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Tiện ích Đọc & Dịch AI
          </div>

          {/* Bảng công cụ & Cài đặt dịch */}
          <button
            type="button"
            onClick={() => { if (onOpenTranslationSettings) onOpenTranslationSettings(); onClose(); }}
            className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span>Bảng công cụ & Cài đặt dịch</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300">
              MỞ
            </span>
          </button>

          {/* Auto Translate Toggle */}
          <button
            type="button"
            onClick={() => { onToggleTranslate(); onClose(); }}
            className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <Languages className={`w-4 h-4 ${isAutoTranslate ? 'text-pink-400' : 'text-slate-400'}`} />
              <span>Dịch thuật AI (Tự động)</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isAutoTranslate ? 'bg-pink-600/30 text-pink-300' : 'bg-white/5 text-slate-500'
            }`}>
              {isAutoTranslate ? 'BẬT' : 'TẮT'}
            </span>
          </button>

          {/* Auto TTS Read Toggle */}
          <button
            type="button"
            onClick={() => { onToggleAudio(); onClose(); }}
            className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <Volume2 className={`w-4 h-4 ${isAudioPlaying ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Đọc giọng nói TTS</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isAudioPlaying ? 'bg-amber-600/30 text-amber-300' : 'bg-white/5 text-slate-500'
            }`}>
              {isAudioPlaying ? 'ĐANG PHÁT' : 'TẮT'}
            </span>
          </button>

          {/* Clean Ads Toggle */}
          <button
            type="button"
            onClick={() => { onToggleCleanAds(); onClose(); }}
            className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className={`w-4 h-4 ${cleanAdsActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Chặn QC & Pop-up rác</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              cleanAdsActive ? 'bg-emerald-600/30 text-emerald-300' : 'bg-white/5 text-slate-500'
            }`}>
              {cleanAdsActive ? 'BẬT' : 'TẮT'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
