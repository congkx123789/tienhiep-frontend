// Browser Navigation Header Component
import React from 'react';
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
  Shield,
  Moon
} from 'lucide-react';
import { BrowserTab } from '../BrowserContext.types';

interface BrowserHeaderProps {
  activeTab: BrowserTab;
  tabsCount: number;
  urlInput: string;
  setUrlInput: (v: string) => void;
  onNavigate: (url: string) => void;
  onReload: () => void;
  onOpenTabSwitcher: () => void;
  onOpenTabConfig: () => void;
  onOpenSettings: () => void;
  onTool: (toolId: string) => void;
  autoTranslateActive: boolean;
  pinnedTools: string[];
}

export const BrowserHeader: React.FC<BrowserHeaderProps> = ({
  activeTab,
  tabsCount,
  urlInput,
  setUrlInput,
  onNavigate,
  onReload,
  onOpenTabSwitcher,
  onOpenTabConfig,
  onOpenSettings,
  onTool,
  autoTranslateActive,
  pinnedTools
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('about:')) {
      url = url.includes('.') && !url.includes(' ') ? 'https://' + url : 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
    onNavigate(url);
  };

  return (
    <div className="h-12 bg-slate-900/90 border-b border-white/10 px-3 flex items-center justify-between gap-2 shrink-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => window.history.back()}
          disabled={!activeTab?.canGoBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-white/10 transition-colors"
          title="Quay lại"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => window.history.forward()}
          disabled={!activeTab?.canGoForward}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-white/10 transition-colors"
          title="Tiến lên"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onReload}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Tải lại trang"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-2">
        <div className="relative flex items-center">
          <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Tìm kiếm hoặc nhập địa chỉ web..."
            className="w-full bg-slate-950/70 border border-white/10 rounded-full pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
          />
        </div>
      </form>

      <div className="flex items-center gap-1 shrink-0">
        {pinnedTools.includes('autoTranslate') && (
          <button
            onClick={() => onTool('autoTranslate')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              autoTranslateActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Tự động dịch"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
        {pinnedTools.includes('audio') && (
          <button
            onClick={() => onTool('audio')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
            title="Đọc Audio TTS"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        )}
        {pinnedTools.includes('teachNext') && (
          <button
            onClick={() => onTool('teachNext')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-colors"
            title="Chỉ định nút chuyển chương"
          >
            <Target className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onOpenTabSwitcher}
          className="relative px-2 h-7 rounded-lg border border-white/20 flex items-center justify-center gap-1 text-slate-300 hover:text-white hover:bg-white/10 transition-all text-xs font-semibold"
          title="Danh sách tab"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{tabsCount}</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Cài đặt dịch & công cụ"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
