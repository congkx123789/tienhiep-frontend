import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { WifiOff, RotateCw } from 'lucide-react';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { BrowserTab, normalizeUrlForIframe } from '../../contexts/browser';
import ChromeMobileNewTab from './ChromeMobileNewTab';
import { createTranslateScript } from '../../utils/webview-injected';

export interface TabViewportItemProps {
  tab: BrowserTab;
  isActive: boolean;
  onNavigate: (url: string) => void;
  onOpenBookmarks: () => void;
  bookmarksCount: number;
  onTabLoaded?: (tabId: string) => void;
  onToggleDirectMode?: (tabId: string) => void;
  onReloadTab?: (tabId: string) => void;
}

const TabLoadingBar: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  if (!isLoading) return null;
  return (
    <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-950/60 z-30 overflow-hidden pointer-events-none">
      <div className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 animate-pulse w-full shadow-sm" />
    </div>
  );
};

export const TabViewportItem = React.memo<TabViewportItemProps>(({
  tab,
  isActive,
  onNavigate,
  onOpenBookmarks,
  bookmarksCount,
  onTabLoaded,
  onToggleDirectMode,
  onReloadTab
}) => {
  const [isAwSnap, setIsAwSnap] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [srcDocContent, setSrcDocContent] = useState<string | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Dùng mạng chuẩn của iPhone (CapacitorHttp) để nạp trang trực tiếp
  useEffect(() => {
    let isCancelled = false;
    setSrcDocContent(null);
    setIsAwSnap(false);
    setErrorMessage('');
    setIsIframeLoaded(false);

    const rawUrl = tab.url;
    if (!rawUrl || rawUrl === 'about:newtab' || rawUrl === 'about:blank') return;
    if (rawUrl.includes('google.') || rawUrl.includes('youtube.')) return;

    const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

    if (isNative) {
      (async () => {
        try {
          const res = await CapacitorHttp.get({
            url: rawUrl,
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            connectTimeout: 8000,
            readTimeout: 10000
          });

          if (!isCancelled && res.status >= 200 && res.status < 400 && res.data) {
            let html = typeof res.data === 'string' ? res.data : String(res.data);
            if (html.length > 50 && !html.includes('Just a moment...')) {
              const scriptCode = `window.__TIENHIEP_TAB_ID__ = "${tab.id}";\nwindow.__originalUrl = "${rawUrl}";\n` + createTranslateScript(false);
              const resetCss = `<style>
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  max-width: 100vw !important;
                  overflow-x: hidden !important;
                  overflow-y: auto !important;
                  -webkit-overflow-scrolling: touch !important;
                  background-color: #ffffff !important;
                }
                img, table { max-width: 100% !important; height: auto !important; }
              </style>`;
              const injectMeta = `<base href="${rawUrl}">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">\n${resetCss}\n<script>${scriptCode}</script>\n`;
              const headMatch = /<\s*head\b[^>]*>/i.exec(html);
              if (headMatch) {
                const pos = headMatch.index + headMatch[0].length;
                html = html.slice(0, pos) + '\n' + injectMeta + html.slice(pos);
              } else {
                const htmlMatch = /<\s*html\b[^>]*>/i.exec(html);
                if (htmlMatch) {
                  const pos = htmlMatch.index + htmlMatch[0].length;
                  html = html.slice(0, pos) + '\n<head>' + injectMeta + '</head>' + html.slice(pos);
                } else {
                  html = injectMeta + html;
                }
              }
              setSrcDocContent(html);
              setIsIframeLoaded(true);
              onTabLoaded?.(tab.id);
            }
          }
        } catch (err) {
          console.warn('[Native Fetch Fallback]', err);
        }
      })();
    }

    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = setTimeout(() => {
      setIsIframeLoaded(prev => {
        if (!prev) {
          setIsAwSnap(true);
          setErrorMessage('Không thể tải trang web — Hãy thử chế độ Direct hoặc mở trình duyệt ngoài');
        }
        return prev;
      });
    }, 15000);

    return () => {
      isCancelled = true;
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [tab.url, tab.id, tab.refreshKey, onTabLoaded]);

  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'PROXY_LOAD_ERROR') {
        const wv = document.getElementById(`global-wv-${tab.id}`) as HTMLIFrameElement | null;
        if ((wv && wv.contentWindow === e.source) || e.data.url?.includes(encodeURIComponent(tab.url))) {
          setErrorMessage(e.data.error || 'Máy chủ phản hồi quá lâu');
          setIsAwSnap(true);
        }
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [tab.id, tab.url]);

  const handleManualRetry = useCallback(() => {
    setIsAwSnap(false);
    setErrorMessage('');
    onReloadTab?.(tab.id);
  }, [tab.id, onReloadTab]);

  const iframeSrc = useMemo(() => {
    const rawUrl = tab.url;
    if (!rawUrl || rawUrl === 'about:newtab') return 'about:blank';
    if (rawUrl.includes('google.') && (rawUrl.includes('search') || rawUrl.includes('igu=1'))) {
      return normalizeUrlForIframe(rawUrl);
    }
    if (tab.isDirectMode === true) {
      const hasBlocker = /69shu|biquge|uukanshu|qidian|fanqie|faloo|ixdzs|quanben|bqg|520/i.test(rawUrl);
      if (!hasBlocker) {
        if (rawUrl.includes('youtube.com/watch') || rawUrl.includes('youtu.be/')) {
          return normalizeUrlForIframe(rawUrl);
        }
        return rawUrl;
      }
    }
    const isDesktopParam = tab.isDesktopMode !== false ? '&desktop=1' : '&desktop=0';
    const refreshParam = tab.refreshKey ? `&_t=${tab.refreshKey}` : '';
    const proxy = normalizeUrlForIframe(rawUrl, tab.id);
    return proxy.includes('?') ? `${proxy}${isDesktopParam}${refreshParam}` : `${proxy}?${isDesktopParam}${refreshParam}`;
  }, [tab.url, tab.isDirectMode, tab.isDesktopMode, tab.refreshKey]);

  const handleIframeLoad = useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setIsIframeLoaded(true);
    onTabLoaded?.(tab.id);

    setTimeout(() => {
      try {
        const iframe = e.currentTarget;
        let docTitle = '';
        let docBody = '';
        let canAccessDoc = false;
        try {
          if (iframe.contentDocument) {
            docTitle = iframe.contentDocument.title || '';
            docBody = iframe.contentDocument.body?.innerText?.trim() || '';
            canAccessDoc = true;
          }
        } catch (_) { }

        const isCf = canAccessDoc && (
          docTitle.includes('Just a moment') ||
          docTitle.includes('Checking your') ||
          (docBody.length < 50 && docTitle.length < 5)
        );

        if (isCf && !tab.url?.includes('google.')) {
          setIsAwSnap(true);
          setErrorMessage('Trang này yêu cầu xác minh bảo mật — Hãy thử Direct Mode hoặc mở ngoài.');
          return;
        }

        const isSearchOrMedia = tab.url?.includes('google.') || tab.url?.includes('youtube.');
        const scriptCode = `window.__TIENHIEP_TAB_ID__ = "${tab.id}";\n` + createTranslateScript(false);
        if (iframe.contentWindow && !isSearchOrMedia) {
          iframe.contentWindow.postMessage({ action: 'INJECT_SCRIPT', script: scriptCode }, '*');
        }
        let doc: Document | null = null;
        try { doc = iframe.contentDocument; } catch (_) { }
        if (doc && !isSearchOrMedia && !doc.getElementById('__tienhiep_injected_script')) {
          const script = doc.createElement('script');
          script.id = '__tienhiep_injected_script';
          script.textContent = scriptCode;
          (doc.head || doc.documentElement || doc.body).appendChild(script);
        }
      } catch (_) { }
    }, 800);
  }, [tab.id, tab.url, onTabLoaded]);

  const isNewTab = tab.url === 'about:newtab' || !tab.url;

  return (
    <div style={{ display: isActive ? 'flex' : 'none' }} className="absolute inset-0 w-full h-full flex flex-col overflow-hidden">
      {isNewTab ? (
        <ChromeMobileNewTab onNavigate={onNavigate} onOpenBookmarks={onOpenBookmarks} bookmarksCount={bookmarksCount} />
      ) : (
        <div className="relative flex-1 w-full overflow-hidden" style={{ minHeight: 0 }}>
          <TabLoadingBar isLoading={tab.isLoading} />

          {isAwSnap ? (
            <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-6 bg-[#161622] text-slate-300 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl">
                <WifiOff className="w-8 h-8" />
              </div>
              <div className="text-center max-w-md">
                <h3 className="text-lg font-bold text-white mb-1.5">Không thể tải trang</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Đường truyền web gốc đang bận hoặc bị bảo vệ.
                </p>
                {errorMessage && (
                  <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400 break-all">
                    {errorMessage}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button onClick={handleManualRetry} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
                  <RotateCw className="w-3.5 h-3.5" /> Tải lại
                </button>
                <button onClick={() => onToggleDirectMode?.(tab.id)} className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer">
                  {tab.isDirectMode ? 'Thử tải lại' : 'Thử tải trực tiếp'}
                </button>
                <button onClick={() => window.open(tab.url, '_blank')} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold active:scale-95 transition-all cursor-pointer">
                  Mở trình duyệt ngoài
                </button>
              </div>
            </div>
          ) : (
            <>
              {tab.isLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d0d16]/90 backdrop-blur-sm pointer-events-none">
                  <div className="w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-2" />
                  <span className="text-[11px] font-medium text-slate-300">
                    {tab.title && tab.title !== 'Đang tải...' ? tab.title : 'Đang tải trang truyện...'}
                  </span>
                </div>
              )}
              <iframe
                id={`global-wv-${tab.id}`}
                key={`iframe-${tab.id}-${tab.refreshKey || 0}`}
                src={srcDocContent ? undefined : iframeSrc}
                srcDoc={srcDocContent || undefined}
                className="border-none w-full h-full"
                scrolling="yes"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', background: '#ffffff', touchAction: 'auto' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
                allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media"
                onLoad={handleIframeLoad}
                onError={() => {
                  if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
                  if (!tab.url?.includes('google.')) {
                    setIsAwSnap(true);
                    setErrorMessage('Không thể tải trang truyện');
                  }
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}, (p, n) => (
  p.isActive === n.isActive && p.bookmarksCount === n.bookmarksCount &&
  p.tab.id === n.tab.id && p.tab.url === n.tab.url &&
  p.tab.refreshKey === n.tab.refreshKey && p.tab.isLoading === n.tab.isLoading &&
  p.tab.isDesktopMode === n.tab.isDesktopMode && p.tab.isDirectMode === n.tab.isDirectMode
));
