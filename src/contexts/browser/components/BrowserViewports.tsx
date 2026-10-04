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

export const BrowserViewports: React.FC<BrowserViewportsProps> = ({
  tabs,
  activeTabId,
  onNavigate,
  onOpenBookmarks,
  bookmarksCount,
  onTabLoaded,
  onToggleDirectMode
}) => {
  const getIframeSrc = (tab: BrowserTab) => {
    const rawUrl = tab.initialUrl || tab.url;
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
  };

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>, tabId: string) => {
    onTabLoaded?.(tabId);
    try {
      const iframe = e.currentTarget;
      if (iframe.contentWindow) {
        (iframe.contentWindow as any).__TIENHIEP_TAB_ID__ = tabId;
      }
      const doc = iframe.contentDocument;
      if (doc && !doc.getElementById('__tienhiep_injected_script')) {
        const script = doc.createElement('script');
        script.id = '__tienhiep_injected_script';
        script.textContent = `window.__TIENHIEP_TAB_ID__ = "${tabId}";\n` + createTranslateScript(false);
        (doc.head || doc.documentElement || doc.body).appendChild(script);
      }
    } catch (err) {}
  };

  return (
    <div className="flex-1 relative w-full min-h-0 overflow-hidden bg-slate-950">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isNewTab = tab.url === 'about:newtab' || !tab.url;
        const isDesktop = tab.isDesktopMode !== false;

        return (
          <div
            key={tab.id}
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

                {isDesktop ? (
                  <iframe
                    id={`global-wv-${tab.id}`}
                    src={getIframeSrc(tab)}
                    className="w-full h-full flex-1 border-none bg-white"
                    style={{ display: 'block' }}
                    allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media"
                    onLoad={(e) => handleIframeLoad(e, tab.id)}
                  />
                ) : (
                  <div className="w-full h-full flex-1 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80">
                    <div className="w-full max-w-[430px] h-full max-h-[94vh] rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col bg-slate-900 relative ring-1 ring-white/10">
                      <div className="h-4 bg-slate-950 flex items-center justify-center shrink-0">
                        <div className="w-16 h-1 rounded-full bg-slate-700/60" />
                      </div>
                      <iframe
                        id={`global-wv-${tab.id}`}
                        src={getIframeSrc(tab)}
                        className="w-full h-full flex-1 border-none bg-white"
                        style={{ display: 'block' }}
                        allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media"
                        onLoad={(e) => handleIframeLoad(e, tab.id)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
