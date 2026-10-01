import React from 'react';
import { 
  Plus, 
  Shield, 
  Star, 
  History, 
  Monitor, 
  Smartphone, 
  Sliders 
} from 'lucide-react';

interface MenuNavListProps {
  onNewTab: (isIncognito?: boolean) => void;
  onOpenBookmarks?: () => void;
  onOpenHistory: () => void;
  isDesktopMode: boolean;
  onToggleDesktopMode: () => void;
  onOpenTabConfig?: () => void;
  onClose: () => void;
}

export const MenuNavList: React.FC<MenuNavListProps> = ({
  onNewTab,
  onOpenBookmarks,
  onOpenHistory,
  isDesktopMode,
  onToggleDesktopMode,
  onOpenTabConfig,
  onClose,
}) => {
  return (
    <>
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
    </>
  );
};
