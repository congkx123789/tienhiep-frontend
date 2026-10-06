import React from 'react';
import { WifiOff, RotateCw } from 'lucide-react';
import { BrowserTab } from '../BrowserContext.types';
import { ChromeMobileNewTab } from '../../../components';
import { normalizeUrlForIframe } from '../browserHelpers';
import { createTranslateScript } from '../../../utils/webview-injected';

const RETRY_INTERVALS = [2, 5, 10]; // Chrome Exponential Backoff: 2s -> 5s -> 10s (tối đa 3 lần)

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
  onReloadTab?: (tabId: string) => void;
}

interface TabViewportItemProps {
  tab: BrowserTab;
  isActive: boolean;
  onNavigate: (url: string) => void;
  onOpenBookmarks: () => void;
  bookmarksCount: number;
  onTabLoaded?: (tabId: string) => void;
  onToggleDirectMode?: (tabId: string) => void;
  onReloadTab?: (tabId: string) => void;
}

const TabViewportItem = React.memo<TabViewportItemProps>(({
  tab,
  isActive,
  onNavigate,
  onOpenBookmarks,
  bookmarksCount,
  onTabLoaded,
  onToggleDirectMode,
  onReloadTab
}) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [countdown, setCountdown] = React.useState(0);
  const [isAwSnap, setIsAwSnap] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    setRetryCount(0);
    setCountdown(0);
    setIsAwSnap(false);
    setErrorMessage('');
  }, [tab.url]);

  React.useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'PROXY_LOAD_ERROR') {
        const wv = document.getElementById(`global-wv-${tab.id}`) as HTMLIFrameElement | null;
        if ((wv && wv.contentWindow === e.source) || e.data.url?.includes(encodeURIComponent(tab.url))) {
          setErrorMessage(e.data.error || 'Máy chủ truyện phản hồi quá lâu');
          setRetryCount(prev => {
            if (prev < RETRY_INTERVALS.length) {
              setCountdown(RETRY_INTERVALS[prev]);
              return prev + 1;
            }
            setIsAwSnap(true);
            setCountdown(0);
            return prev;
          });
        }
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [tab.id, tab.url]);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0 && retryCount > 0 && retryCount <= RETRY_INTERVALS.length && !isAwSnap) {
      onReloadTab?.(tab.id);
    }
  }, [countdown, retryCount, isAwSnap, tab.id, onReloadTab]);

  const handleManualRetry = React.useCallback(() => {
    setRetryCount(0);
    setCountdown(0);
    setIsAwSnap(false);
    setErrorMessage('');
    onReloadTab?.(tab.id);
  }, [tab.id, onReloadTab]);

  const iframeSrc = React.useMemo(() => {
    const rawUrl = tab.url;
    if (!rawUrl || rawUrl === 'about:newtab') return 'about:blank';
    if (tab.isDirectMode === true) {
      if (rawUrl.includes('youtube.com/watch') || rawUrl.includes('youtu.be/') || (rawUrl.includes('google.') && rawUrl.includes('search'))) {
        return normalizeUrlForIframe(rawUrl);
      }
      return rawUrl;
    }
    const isDesktopParam = tab.isDesktopMode !== false ? '&desktop=1' : '&desktop=0';
    const refreshParam = tab.refreshKey ? `&_t=${tab.refreshKey}` : '';
    const proxy = normalizeUrlForIframe(rawUrl);
    return proxy.includes('?') ? `${proxy}${isDesktopParam}${refreshParam}` : `${proxy}?${isDesktopParam}${refreshParam}`;
  }, [tab.url, tab.isDirectMode, tab.isDesktopMode, tab.refreshKey]);

  const handleIframeLoad = React.useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    onTabLoaded?.(tab.id);
    if (!isAwSnap && countdown === 0) setRetryCount(0);
    try {
      const iframe = e.currentTarget;
      if (iframe.contentWindow) (iframe.contentWindow as any).__TIENHIEP_TAB_ID__ = tab.id;
      const doc = iframe.contentDocument;
      if (doc && !doc.getElementById('__tienhiep_injected_script')) {
        const script = doc.createElement('script');
        script.id = '__tienhiep_injected_script';
        script.textContent = `window.__TIENHIEP_TAB_ID__ = "${tab.id}";\n` + createTranslateScript(false);
        (doc.head || doc.documentElement || doc.body).appendChild(script);
      }
    } catch (_) {}
  }, [tab.id, onTabLoaded, isAwSnap, countdown]);

  const isNewTab = tab.url === 'about:newtab' || !tab.url;
  const isDesktop = tab.isDesktopMode !== false;

  return (
    <div style={{ display: isActive ? 'flex' : 'none' }} className="absolute inset-0 w-full h-full flex-col relative overflow-hidden">
      {isNewTab ? (
        <ChromeMobileNewTab onNavigate={onNavigate} onOpenBookmarks={onOpenBookmarks} bookmarksCount={bookmarksCount} />
      ) : (
        <div className="w-full h-full flex-1 flex flex-col relative overflow-hidden">
          <TabLoadingBar isLoading={tab.isLoading} />

          {countdown > 0 && !isAwSnap && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-indigo-500/40 px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs text-slate-200">
              <RotateCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <span>Đang thử lại ({retryCount}/{RETRY_INTERVALS.length}) sau <b className="text-indigo-400">{countdown}s</b></span>
              <button onClick={handleManualRetry} className="text-cyan-400 hover:underline font-semibold ml-1">F5 ngay</button>
              <button onClick={() => { setCountdown(0); setIsAwSnap(true); }} className="text-rose-400 hover:underline ml-1">Dừng</button>
            </div>
          )}

          {isAwSnap ? (
            <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-6 bg-[#161622] text-slate-300 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl">
                <WifiOff className="w-8 h-8" />
              </div>
              <div className="text-center max-w-md">
                <h3 className="text-lg font-bold text-white mb-1.5">Ôi, Hỏng! (Aw, Snap!)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Không thể kết nối đến máy chủ truyện sau {RETRY_INTERVALS.length} lần thử lại tự động. Tường lửa quá mạnh hoặc web gốc đang bị gián đoạn.
                </p>
                {errorMessage && (
                  <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400 break-all">
                    {errorMessage}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button onClick={handleManualRetry} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5" /> Tải lại ngay
                </button>
                <button onClick={() => onToggleDirectMode?.(tab.id)} className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold active:scale-95 transition-all">
                  {tab.isDirectMode ? 'Thử qua Proxy' : 'Thử tải trực tiếp (Direct)'}
                </button>
                <button onClick={() => window.open(tab.url, '_blank')} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold active:scale-95 transition-all">
                  Mở trình duyệt ngoài
                </button>
              </div>
            </div>
          ) : isDesktop ? (
            <iframe
              id={`global-wv-${tab.id}`}
              key={`iframe-${tab.id}-${tab.refreshKey || 0}`}
              src={iframeSrc}
              className="w-full h-full flex-1 border-none bg-white"
              style={{ display: 'block' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
              allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media"
              onLoad={handleIframeLoad}
              onError={() => { setRetryCount(prev => prev < RETRY_INTERVALS.length ? prev + 1 : prev); if (retryCount >= RETRY_INTERVALS.length) setIsAwSnap(true); else setCountdown(RETRY_INTERVALS[retryCount]); }}
            />
          ) : (
            <div className="w-full h-full flex-1 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80">
              <div className="w-full max-w-[430px] h-full max-h-[94vh] rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col bg-slate-900 relative ring-1 ring-white/10">
                <div className="h-4 bg-slate-950 flex items-center justify-center shrink-0">
                  <div className="w-16 h-1 rounded-full bg-slate-700/60" />
                </div>
                <iframe
                  id={`global-wv-${tab.id}`}
                  key={`iframe-${tab.id}-${tab.refreshKey || 0}`}
                  src={iframeSrc}
                  className="w-full h-full flex-1 border-none bg-white"
                  style={{ display: 'block' }}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                  allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media"
                  onLoad={handleIframeLoad}
                  onError={() => { setRetryCount(prev => prev < RETRY_INTERVALS.length ? prev + 1 : prev); if (retryCount >= RETRY_INTERVALS.length) setIsAwSnap(true); else setCountdown(RETRY_INTERVALS[retryCount]); }}
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
    prev.tab.refreshKey === next.tab.refreshKey &&
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
  onToggleDirectMode,
  onReloadTab
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
          onReloadTab={onReloadTab}
        />
      ))}
    </div>
  );
};
