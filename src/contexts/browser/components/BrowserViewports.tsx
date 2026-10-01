// Browser Viewports container for all active and background tabs
import React, { useRef, useEffect } from 'react';
import { BrowserTab } from '../BrowserContext.types';
import { ChromeMobileNewTab } from '../../../components';
import { normalizeUrlForIframe } from '../browserHelpers';
import { createTranslateScript } from '../../../utils/webview-injected';

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
    <div className="flex-1 relative w-full h-full overflow-hidden bg-slate-950">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isNewTab = tab.url === 'about:newtab' || !tab.url;

        return (
          <div
            key={tab.id}
            style={{ display: isActive ? 'block' : 'none' }}
            className="absolute inset-0 w-full h-full"
          >
            {isNewTab ? (
              <ChromeMobileNewTab
                onNavigate={onNavigate}
                onOpenBookmarks={onOpenBookmarks}
                bookmarksCount={bookmarksCount}
              />
            ) : (
              <iframe
                id={`global-wv-${tab.id}`}
                src={normalizeUrlForIframe(tab.url)}
                className="w-full h-full border-none bg-white"
                allow="autoplay; fullscreen; clipboard-read; clipboard-write"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                onLoad={(e) => {
                  try {
                    const iframe = e.currentTarget;
                    const doc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (doc) {
                      const script = doc.createElement('script');
                      script.textContent = createTranslateScript(false);
                      (doc.head || doc.documentElement).appendChild(script);
                    }
                  } catch (err) {}
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
