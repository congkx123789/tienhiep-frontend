// Browser Viewports container for all active and background tabs
import React from 'react';
import { BrowserTab } from '../BrowserContext.types';
import { ChromeMobileNewTab } from '../../../components';
import { normalizeUrlForIframe } from '../browserHelpers';
import { createTranslateScript } from '../../../utils/webview-injected';
import { Loader2 } from 'lucide-react';

interface BrowserViewportsProps {
  tabs: BrowserTab[];
  activeTabId: string;
  onNavigate: (url: string) => void;
  onOpenBookmarks: () => void;
  bookmarksCount: number;
}

export const BrowserViewports: React.FC<BrowserViewportsProps> = ({
  tabs,
  activeTabId,
  onNavigate,
  onOpenBookmarks,
  bookmarksCount
}) => {
  return (
    <div className="flex-1 relative w-full min-h-0 overflow-hidden bg-slate-950">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isNewTab = tab.url === 'about:newtab' || !tab.url;

        return (
          <div
            key={tab.id}
            style={{ display: isActive ? 'flex' : 'none' }}
            className="absolute inset-0 w-full h-full flex-col relative"
          >
            {isNewTab ? (
              <ChromeMobileNewTab
                onNavigate={onNavigate}
                onOpenBookmarks={onOpenBookmarks}
                bookmarksCount={bookmarksCount}
              />
            ) : (
              <>
                {tab.isLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm pointer-events-none">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                    <span className="text-xs font-semibold text-slate-300">Đang tải trang truyện...</span>
                    <span className="text-[11px] text-slate-500 max-w-xs truncate mt-1 px-4 text-center">{tab.url}</span>
                  </div>
                )}
                <iframe
                  id={`global-wv-${tab.id}`}
                  src={normalizeUrlForIframe(tab.url)}
                  className="w-full h-full flex-1 border-none bg-slate-900"
                  style={{ display: 'block' }}
                  allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media"
                  onLoad={(e) => {
                    try {
                      const iframe = e.currentTarget;
                      if (iframe.contentWindow) {
                        (iframe.contentWindow as any).__TIENHIEP_TAB_ID__ = tab.id;
                      }
                      const doc = iframe.contentDocument || iframe.contentWindow?.document;
                      if (doc) {
                        const script = doc.createElement('script');
                        script.textContent = `window.__TIENHIEP_TAB_ID__ = "${tab.id}";\n` + createTranslateScript(false);
                        (doc.head || doc.documentElement).appendChild(script);
                      }
                    } catch (err) {}
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

