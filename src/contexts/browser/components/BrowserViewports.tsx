import React from 'react';
import { BrowserTab } from '../BrowserContext.types';
import { ChromeMobileNewTab } from '../../../components';
import { normalizeUrlForIframe } from '../browserHelpers';
import { createTranslateScript } from '../../../utils/webview-injected';

/** Thanh tiến trình tải trang mỏng nhẹ ở đỉnh màn hình, không bao giờ che khuất trang web */
const TabLoadingBar: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  if (!isLoading) return null;
  return (
    <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-950/60 z-30 overflow-hidden pointer-events-none">
      <div className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 animate-pulse w-full shadow-sm" />
    </div>
  );
};

interface BrowserViewportsProps {
  tabs: BrowserTab[];
  activeTabId: string;
  onNavigate: (url: string) => void;
  onOpenBookmarks: () => void;
  bookmarksCount: number;
  onTabLoaded?: (tabId: string) => void;
  onToggleDirectMode?: (tabId: string) => void;
}


interface TabViewportItemProps {
  tab: BrowserTab;
  isActive: boolean;
  onNavigate: (url: string) => void;
  onOpenBookmarks: () => void;
  bookmarksCount: number;
  onTabLoaded?: (tabId: string) => void;
  onToggleDirectMode?: (tabId: string) => void;
}

const TabViewportItem = React.memo<TabViewportItemProps>(({
  tab,
  isActive,
  onNavigate,
  onOpenBookmarks,
  bookmarksCount,
  onTabLoaded,
  onToggleDirectMode
}) => {
  const [hasError, setHasError] = React.useState(false);

  const iframeSrc = React.useMemo(() => {
    setHasError(false);
    const rawUrl = tab.url;
    if (!rawUrl || rawUrl === 'about:newtab') return 'about:blank';
    if (tab.isDirectMode === true) {
      if (rawUrl.includes('youtube.com/watch') || rawUrl.includes('youtu.be/') || (rawUrl.includes('google.') && rawUrl.includes('search'))) {
        return normalizeUrlForIframe(rawUrl);
      }
      return rawUrl;
    }
    const isDesktopParam = tab.isDesktopMode !== false ? '&desktop=1' : '&desktop=0';
    const proxy = normalizeUrlForIframe(rawUrl);
    return proxy.includes('?') ? `${proxy}${isDesktopParam}` : `${proxy}?${isDesktopParam}`;
  }, [tab.url, tab.isDirectMode, tab.isDesktopMode]);

  const handleIframeLoad = React.useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    onTabLoaded?.(tab.id);
    setHasError(false);
    try {
      const iframe = e.currentTarget;
      if (iframe.contentWindow) {
        (iframe.contentWindow as any).__TIENHIEP_TAB_ID__ = tab.id;
      }
      const doc = iframe.contentDocument;
      if (doc && !doc.getElementById('__tienhiep_injected_script')) {
        const script = doc.createElement('script');
        script.id = '__tienhiep_injected_script';
        script.textContent = `window.__TIENHIEP_TAB_ID__ = "${tab.id}";\n` + createTranslateScript(false);
        (doc.head || doc.documentElement || doc.body).appendChild(script);
      }
    } catch (_) {}
  }, [tab.id, onTabLoaded]);

  const isNewTab = tab.url === 'about:newtab' || !tab.url;
  const isDesktop = tab.isDesktopMode !== false;

  return (
    <div
      style={{ display: isActive ? 'flex' : 'none' }}
      className="absolute inset-0 w-full h-full flex-col relative overflow-hidden"
    >
      {isNewTab ? (
        <ChromeMobileNewTab
          onNavigate={onNavigate}
          onOpenBookmarks={onOpenBookmarks}
          bookmarksCount={bookmarksCount}
        />
      ) : (
        <div className="w-full h-full flex-1 flex flex-col relative overflow-hidden">
          <TabLoadingBar isLoading={tab.isLoading} />

          {hasError ? (
            <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-300 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl shadow-lg">
                ⚠️
              </div>
              <div className="text-center max-w-md">
                <h4 className="text-base font-bold text-white mb-1">Không thể hiển thị trang web</h4>
                <p className="text-xs text-slate-400">Trang web có thể đang chặn khung nhúng hoặc máy chủ nguồn phản hồi chậm.</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => onToggleDirectMode?.(tab.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                  {tab.isDirectMode ? 'Chuyển qua Proxy' : 'Thử tải trực tiếp (Direct)'}
                </button>
                <button
                  onClick={() => window.open(tab.url, '_blank')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold active:scale-95 transition-all"
                >
                  Mở trình duyệt ngoài
                </button>
                <button
                  onClick={() => setHasError(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs active:scale-95 transition-all"
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : isDesktop ? (
            <iframe
              id={`global-wv-${tab.id}`}
              src={iframeSrc}
              className="w-full h-full flex-1 border-none bg-white"
              style={{ display: 'block' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
              allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media"
              onLoad={handleIframeLoad}
              onError={() => setHasError(true)}
            />
          ) : (
            <div className="w-full h-full flex-1 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80">
              <div className="w-full max-w-[430px] h-full max-h-[94vh] rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col bg-slate-900 relative ring-1 ring-white/10">
                <div className="h-4 bg-slate-950 flex items-center justify-center shrink-0">
                  <div className="w-16 h-1 rounded-full bg-slate-700/60" />
                </div>
                <iframe
                  id={`global-wv-${tab.id}`}
                  src={iframeSrc}
                  className="w-full h-full flex-1 border-none bg-white"
                  style={{ display: 'block' }}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                  allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media"
                  onLoad={handleIframeLoad}
                  onError={() => setHasError(true)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.isActive === next.isActive &&
    prev.bookmarksCount === next.bookmarksCount &&
    prev.tab.id === next.tab.id &&
    prev.tab.url === next.tab.url &&
    prev.tab.isLoading === next.tab.isLoading &&
    prev.tab.isDesktopMode === next.tab.isDesktopMode &&
    prev.tab.isDirectMode === next.tab.isDirectMode
  );
});

export const BrowserViewports: React.FC<BrowserViewportsProps> = ({
  tabs,
  activeTabId,
  onNavigate,
  onOpenBookmarks,
  bookmarksCount,
  onTabLoaded,
  onToggleDirectMode
}) => {
  return (
    <div className="flex-1 relative w-full min-h-0 overflow-hidden bg-slate-950">
      {tabs.map((tab) => (
        <TabViewportItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onNavigate={onNavigate}
          onOpenBookmarks={onOpenBookmarks}
          bookmarksCount={bookmarksCount}
          onTabLoaded={onTabLoaded}
          onToggleDirectMode={onToggleDirectMode}
        />
      ))}
    </div>
  );
};
