// Browser Navigation Header Component
import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Globe,
  Settings2,
  Layers,
  Sparkles,
  Volume2,
  Target,
  ArrowLeft,
  Search,
  X,
  Menu,
  Monitor,
  Smartphone
} from 'lucide-react';
import { BrowserTab } from '../BrowserContext.types';

interface BrowserHeaderProps {
  activeTab: BrowserTab;
  tabsCount: number;
  urlInput: string;
  setUrlInput: (v: string) => void;
  onNavigate: (url: string) => void;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onReload: () => void;
  onOpenTabSwitcher: () => void;
  onOpenTabConfig: () => void;
  onOpenSettings: () => void;
  onTool: (toolId: string) => void;
  autoTranslateActive: boolean;
  pinnedTools: string[];
  isDesktopMode?: boolean;
  onToggleDesktopMode?: () => void;
  isDirectMode?: boolean;
  onToggleDirectMode?: () => void;
  onCloseBrowser?: () => void;
  onOpenNavMenu?: () => void;
}

export const BrowserHeader: React.FC<BrowserHeaderProps> = ({
  activeTab,
  tabsCount,
  urlInput,
  setUrlInput,
  onNavigate,
  onNavigateBack,
  onNavigateForward,
  onReload,
  onOpenTabSwitcher,
  onOpenTabConfig,
  onOpenSettings,
  onTool,
  autoTranslateActive,
  pinnedTools,
  isDesktopMode,
  onToggleDesktopMode,
  isDirectMode,
  onToggleDirectMode,
  onCloseBrowser,
  onOpenNavMenu
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('about:')) {
      url = url.includes('.') && !url.includes(' ') ? 'https://' + url : 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
    setIsSearchFocused(false);
    onNavigate(url);
  };

  if (isSearchFocused) {
    return (
      <div className="h-12 bg-slate-900 border-b border-white/10 px-2 flex items-center gap-2 shrink-0 z-50 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Nhập tên truyện, tìm kiếm Google hoặc link..."
              className="w-full bg-slate-950 border border-indigo-500/50 rounded-full pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono shadow-inner"
              autoFocus
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput('')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-full shadow-md active:scale-95 transition-transform"
          >
            Đi
          </button>
        </form>
        <button
          type="button"
          onClick={() => setIsSearchFocused(false)}
          className="px-2 py-1.5 text-xs text-slate-400 hover:text-white font-medium active:scale-95 transition-transform"
        >
          Hủy
        </button>
      </div>
    );
  }

  return (
    <div className="h-12 bg-slate-900/90 border-b border-white/10 px-2 sm:px-3 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {onCloseBrowser && (
          <button
            type="button"
            onClick={onCloseBrowser}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 mr-0.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95"
            title="Trở về Ứng Dụng Tiên Hiệp"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Về App</span>
          </button>
        )}
        <button
          type="button"
          onClick={onNavigateBack}
          disabled={!activeTab?.canGoBack}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="Quay lại trang trước trong tab"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onNavigateForward}
          disabled={!activeTab?.canGoForward}
          className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="Tiến lên trang sau trong tab"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onReload}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          title="Tải lại trang (F5)"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      <div
        onClick={() => setIsSearchFocused(true)}
        className="flex-1 max-w-xl mx-1 sm:mx-2 cursor-pointer"
      >
        <div className="relative flex items-center">
          <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            readOnly
            value={urlInput}
            placeholder="Tìm kiếm hoặc nhập địa chỉ web..."
            className="w-full bg-slate-950/70 border border-white/10 rounded-full pl-8 sm:pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 cursor-pointer font-mono truncate"
          />
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {pinnedTools.includes('autoTranslate') && (
          <button
            onClick={() => onTool('autoTranslate')}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all ${
              autoTranslateActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Tự động dịch"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
        {pinnedTools.includes('audio') && (
          <button
            onClick={() => onTool('audio')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
            title="Đọc Audio TTS"
          >
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
        {pinnedTools.includes('teachNext') && (
          <button
            onClick={() => onTool('teachNext')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-colors"
            title="Chỉ định nút chuyển chương"
          >
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Nút chuyển đổi Máy tính / Điện thoại */}
        {onToggleDesktopMode && (
          <button
            type="button"
            onClick={onToggleDesktopMode}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all ${
              isDesktopMode !== false
                ? 'text-cyan-300 hover:text-white hover:bg-cyan-500/20 border border-cyan-500/30 shadow-sm'
                : 'text-amber-300 hover:text-white hover:bg-amber-500/20 border border-amber-500/30 shadow-sm'
            }`}
            title={isDesktopMode !== false ? 'Chế độ Máy tính (Desktop) - Nhấp để chuyển sang Điện thoại' : 'Chế độ Điện thoại (Mobile) - Nhấp để chuyển sang Máy tính'}
          >
            {isDesktopMode !== false ? <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        )}

        {/* Nút chuyển đổi Web gốc ban đầu / Proxy */}
        {onToggleDirectMode && (
          <button
            type="button"
            onClick={onToggleDirectMode}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all ${
              isDirectMode === true
                ? 'text-emerald-300 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-500/20 border border-purple-500/30'
            }`}
            title={isDirectMode === true ? 'Chế độ: Web gốc ban đầu (Trực tiếp 100%) - Nhấp để đổi sang Proxy' : 'Chế độ: Proxy (Qua máy chủ) - Nhấp để đổi sang Web gốc ban đầu'}
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        <button
          onClick={onOpenTabSwitcher}
          className="relative px-1.5 sm:px-2 h-7 rounded-lg border border-white/20 flex items-center justify-center gap-1 text-slate-300 hover:text-white hover:bg-white/10 transition-all text-xs font-semibold"
          title="Danh sách tab"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{tabsCount}</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Cài đặt dịch & công cụ"
        >
          <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Hamburger mở nav menu — chỉ hiển thị trên mobile */}
        {onOpenNavMenu && (
          <button
            onClick={onOpenNavMenu}
            className="sm:hidden w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Menu điều hướng"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
