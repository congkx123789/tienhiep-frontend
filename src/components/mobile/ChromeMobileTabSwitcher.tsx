import React from 'react';
import { X, Plus, Shield, Globe, Trash2, Check } from 'lucide-react';

interface ChromeMobileTabSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: any[];
  activeTabId: any;
  onSelectTab: (id: any) => void;
  onCloseTab: (id: string, e?: any) => void;
  onCloseAllTabs?: (all?: boolean) => void;
  onNewTab: (isPrivate?: boolean) => void;
  activeTabType?: 'normal' | 'private' | string;
  onToggleTabType?: (type: string) => void;
}

export default function ChromeMobileTabSwitcher({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCloseAllTabs = () => {},
  onNewTab,
  activeTabType = 'normal',
  onToggleTabType = () => {}
}: ChromeMobileTabSwitcherProps) {
  if (!isOpen) return null;

  const normalTabs = tabs.filter(t => !t.isPrivate);
  const privateTabs = tabs.filter(t => t.isPrivate);
  const currentTabs = activeTabType === 'private' ? privateTabs : normalTabs;

  return (
    <div className="fixed inset-0 z-[200000] bg-black/80 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center animate-fade-in">
      <div className="w-full sm:max-w-md h-[92vh] sm:h-[85vh] bg-[#121216] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header: Mode Selector & Close */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#181820]">
          {/* Segments: Normal vs Incognito */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => onToggleTabType('normal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabType === 'normal'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Thường ({normalTabs.length})</span>
            </button>
            <button
              onClick={() => onToggleTabType('private')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabType === 'private'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Ẩn danh ({privateTabs.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-transform active:scale-95"
            >
              Xong
            </button>
          </div>
        </div>

        {/* Tab Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          {currentTabs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-slate-400">
                {activeTabType === 'private' ? '🕶️' : '📑'}
              </div>
              <p className="text-sm font-semibold text-slate-300">
                {activeTabType === 'private' ? 'Không có tab ẩn danh nào' : 'Chưa có tab nào đang mở'}
              </p>
              <button
                onClick={() => onNewTab(activeTabType === 'private')}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
                Mở tab mới
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {currentTabs.map(tab => {
                const isActive = tab.id === activeTabId;
                const isNewTab = tab.url === 'about:newtab';
                return (
                  <div
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      onClose();
                    }}
                    className={`relative flex flex-col rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden group shadow-lg ${
                      isActive
                        ? 'border-indigo-400 ring-2 ring-indigo-500/30 bg-[#1c1c24]'
                        : 'border-white/10 hover:border-white/20 bg-[#16161c]'
                    }`}
                  >
                    {/* Tab Top Bar */}
                    <div className="flex items-center justify-between px-2.5 py-2 border-b border-white/5 bg-white/5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                        <span className="text-xs">
                          {tab.isPrivate ? '🕶️' : isNewTab ? '✨' : '📖'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-200 truncate">
                          {tab.title || (isNewTab ? 'Tab mới' : tab.url)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCloseTab(tab.id, e);
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/20 transition-all shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Tab Preview Box */}
                    <div className="h-28 flex flex-col items-center justify-center p-3 text-center bg-black/20">
                      <span className="text-2xl mb-1 opacity-70">
                        {tab.isPrivate ? '🕶️' : isNewTab ? '🚀' : '📄'}
                      </span>
                      <span className="text-[10px] text-slate-400 line-clamp-2 max-w-[120px] break-words">
                        {isNewTab ? 'Trang bắt đầu' : (tab.url || '')}
                      </span>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute bottom-1 right-2 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-[#181820]">
          <button
            onClick={() => onCloseAllTabs(true)}
            disabled={currentTabs.length === 0}
            className="text-xs text-rose-400 hover:text-rose-300 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Đóng tất cả ({currentTabs.length})
          </button>

          <button
            onClick={() => {
              onNewTab(activeTabType === 'private');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Tab mới
          </button>
        </div>
      </div>
    </div>
  );
}
