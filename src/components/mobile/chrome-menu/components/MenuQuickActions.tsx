import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  RotateCcw, 
  Share2, 
  ExternalLink, 
  X 
} from 'lucide-react';

interface MenuQuickActionsProps {
  canGoBack?: boolean;
  onGoBack?: () => void;
  canGoForward?: boolean;
  onGoForward?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onReload: () => void;
  handleShare: () => void;
  currentUrl?: string;
  onOpenExternal?: (url: string) => void;
  onClose: () => void;
}

export const MenuQuickActions: React.FC<MenuQuickActionsProps> = ({
  canGoBack,
  onGoBack,
  canGoForward,
  onGoForward,
  isBookmarked,
  onToggleBookmark,
  onReload,
  handleShare,
  currentUrl,
  onOpenExternal,
  onClose,
}) => {
  return (
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
  );
};
