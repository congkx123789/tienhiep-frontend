// Browser Modals, Drawers and Overlays
import React from 'react';
import { X, Layers, Plus, Shield, Globe, Trash2, Languages } from 'lucide-react';
import { BrowserTab, ToastInfo, BookmarkItem, HistoryItem, ActiveAudioBook } from '../BrowserContext.types';
import {
  AudioPlayer,
  TranslationSettingsModal,
  ChromeMobileTabSwitcher,
  ChromeMobileBookmarksModal
} from '../../../components';

interface BrowserModalsProps {
  tabs: BrowserTab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  isTabConfigOpen: boolean;
  setIsTabConfigOpen: (v: boolean) => void;
  isTabSwitcherOpen: boolean;
  setIsTabSwitcherOpen: (v: boolean) => void;
  isBookmarksOpen: boolean;
  setIsBookmarksOpen: (v: boolean) => void;
  isTranslationSettingsOpen: boolean;
  setIsTranslationSettingsOpen: (v: boolean) => void;
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  toastInfo: ToastInfo | null;
  setToastInfo: (t: ToastInfo | null) => void;
  activeAudioObj: ActiveAudioBook | null;
  onCloseAudio: () => void;
  onNextChapter: () => void;
  onPrevChapter: () => void;
  openNewTab: (isPrivate?: boolean) => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (keepId: string) => void;
  closeAll: () => void;
  translateAllTabTitles: () => void;
  onNavigate: (url: string) => void;
  onTool: (toolId: string) => void;
  autoTranslateActive: boolean;
  pinnedTools: string[];
  togglePin: (id: string) => void;
  removeBookmark: (id: string) => void;
}

export const BrowserModals: React.FC<BrowserModalsProps> = ({
  tabs,
  activeTabId,
  setActiveTabId,
  isTabConfigOpen,
  setIsTabConfigOpen,
  isTabSwitcherOpen,
  setIsTabSwitcherOpen,
  isBookmarksOpen,
  setIsBookmarksOpen,
  isTranslationSettingsOpen,
  setIsTranslationSettingsOpen,
  bookmarks,
  history,
  toastInfo,
  setToastInfo,
  activeAudioObj,
  onCloseAudio,
  onNextChapter,
  onPrevChapter,
  openNewTab,
  closeTab,
  closeOtherTabs,
  closeAll,
  translateAllTabTitles,
  onNavigate,
  onTool,
  autoTranslateActive,
  pinnedTools,
  togglePin,
  removeBookmark
}) => {
  return (
    <>
      {/* TAB CONFIG MODAL */}
      {isTabConfigOpen && (
        <div className="fixed inset-0 z-[200050] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Quản lý & Cấu hình Tab</h3>
                  <p className="text-[11px] text-slate-400">Đang mở {tabs.length} thẻ</p>
                </div>
              </div>
              <button
                onClick={() => setIsTabConfigOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 border-b border-white/10 bg-white/[0.01]">
              <button
                onClick={() => { translateAllTabTitles(); setIsTabConfigOpen(false); }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all text-xs font-medium"
              >
                <span className="flex items-center gap-2.5">
                  <Languages className="w-4 h-4 text-indigo-400" />
                  Dịch tất cả tiêu đề tab sang Tiếng Việt
                </span>
                <span className="text-[10px] bg-indigo-500/30 px-2 py-0.5 rounded-full text-indigo-200">Tự động</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { openNewTab(false); setIsTabConfigOpen(false); }}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-medium border border-white/10 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm tab thường
                </button>
                <button
                  onClick={() => { openNewTab(true); setIsTabConfigOpen(false); }}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/20 transition-all"
                >
                  <Shield className="w-3.5 h-3.5" /> Thêm tab ẩn danh
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { closeOtherTabs(activeTabId); setIsTabConfigOpen(false); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 text-xs font-medium border border-white/5 transition-all"
                >
                  Đóng tab khác
                </button>
                <button
                  onClick={() => { closeAll(); setIsTabConfigOpen(false); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Đóng tất cả
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 max-h-[260px]">
              {tabs.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                    t.id === activeTabId ? 'bg-indigo-600/15 border-indigo-500/40 text-white' : 'bg-white/[0.03] border-white/5 text-slate-300'
                  }`}
                >
                  <div
                    className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                    onClick={() => { setActiveTabId(t.id); setIsTabConfigOpen(false); }}
                  >
                    {t.isPrivate ? <Shield className="w-3.5 h-3.5 text-purple-400" /> : <Globe className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="text-xs truncate">{t.title || 'Tab mới'}</span>
                  </div>
                  <button onClick={() => closeTab(t.id)} className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-md">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB SWITCHER */}
      {isTabSwitcherOpen && (
        <ChromeMobileTabSwitcher
          isOpen={isTabSwitcherOpen}
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={(id) => { setActiveTabId(id); setIsTabSwitcherOpen(false); }}
          onCloseTab={closeTab}
          onNewTab={() => { openNewTab(false); setIsTabSwitcherOpen(false); }}
          onClose={() => setIsTabSwitcherOpen(false)}
        />
      )}

      {/* BOOKMARKS MODAL */}
      {isBookmarksOpen && (
        <ChromeMobileBookmarksModal
          isOpen={isBookmarksOpen}
          onClose={() => setIsBookmarksOpen(false)}
          bookmarks={bookmarks}
          onSelectBookmark={(url) => { onNavigate(url); setIsBookmarksOpen(false); }}
          onDeleteBookmark={removeBookmark}
        />
      )}

      {/* GLOBAL PERSISTENT AUDIO PLAYER */}
      {activeAudioObj && (
        <AudioPlayer
          book={activeAudioObj}
          onClose={onCloseAudio}
          onNextChapter={onNextChapter}
          onPrevChapter={onPrevChapter}
        />
      )}

      {/* TRANSLATION SETTINGS MODAL */}
      <TranslationSettingsModal
        isOpen={isTranslationSettingsOpen}
        onClose={() => setIsTranslationSettingsOpen(false)}
        onToolAction={onTool}
        isAutoTranslate={autoTranslateActive}
        pinnedTools={pinnedTools}
        onTogglePin={togglePin}
        history={history}
        onNavigate={onNavigate}
      />

      {/* TOAST NOTIFICATION */}
      {toastInfo && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[200060] max-w-[92vw] px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-2 bg-slate-900/95 border-indigo-500/50 text-white animate-in fade-in duration-200">
          <span className="text-xs font-semibold">{toastInfo.message}</span>
          <button onClick={() => setToastInfo(null)} className="text-slate-400 hover:text-white text-xs ml-1">✕</button>
        </div>
      )}
    </>
  );
};
