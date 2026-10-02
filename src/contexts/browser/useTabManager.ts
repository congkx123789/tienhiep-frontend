// Tab Manager Hook for Browser Context
import { useState, useEffect, useCallback } from 'react';
import { BrowserTab, BookmarkItem, HistoryItem } from './BrowserContext.types';
import { cleanNovelTabTitle, executeTranslate } from './browserHelpers';

const INITIAL_TABS_KEY = 'tienhiep_browser_tabs';
const BOOKMARKS_KEY = 'tienhiep_browser_bookmarks';
const HISTORY_KEY = 'tienhiep_browser_history';

export function useTabManager() {
  const [tabs, setTabs] = useState<BrowserTab[]>(() => {
    try {
      const saved = localStorage.getItem(INITIAL_TABS_KEY);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed = parsed.map(t => ({
            ...t,
            url: (t.url || '').replace(/^https:\/\/(10\.0\.2\.2|127\.0\.0\.1|localhost):5051/i, 'http://$1:5051').replace('/#/', '/')
          }));
          return parsed;
        }
      }
    } catch (e) {}
    return [{ id: 'tab-init-1', url: 'about:newtab', title: 'Tab mới', isLoading: false, canGoBack: false, canGoForward: false }];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || 'tab-init-1');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isTabSwitcherOpen, setIsTabSwitcherOpen] = useState(false);
  const [isTabConfigOpen, setIsTabConfigOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try {
      const regularTabs = tabs.filter(t => !t.isPrivate);
      localStorage.setItem(INITIAL_TABS_KEY, JSON.stringify(regularTabs));
    } catch (e) {}
  }, [tabs]);

  useEffect(() => {
    try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks)); } catch (e) {}
  }, [bookmarks]);

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 500))); } catch (e) {}
  }, [history]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url === 'about:newtab' ? '' : (activeTab.url || ''));
    }
  }, [activeTabId, activeTab?.url]);

  const openNewTab = useCallback((isPrivate: boolean = false, initialUrl: string = 'about:newtab') => {
    const newId = 'tab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newTab: BrowserTab = {
      id: newId,
      url: initialUrl,
      initialUrl,
      title: initialUrl === 'about:newtab' ? (isPrivate ? 'Tab ẩn danh' : 'Tab mới') : 'Đang tải...',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isPrivate,
      historyStack: [initialUrl],
      historyIndex: 0
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    return newId;
  }, []);

  const openInBrowser = useCallback((targetUrl: string, inNewTab: boolean = false, isPrivate: boolean = false) => {
    const cleanUrl = targetUrl.replace(/^https:\/\/(10\.0\.2\.2|127\.0\.0\.1|localhost):5051/i, 'http://$1:5051').replace('/#/', '/');
    if (inNewTab || !activeTabId) {
      openNewTab(isPrivate, cleanUrl);
    } else {
      setTabs(prev => prev.map(t => {
        if (t.id !== activeTabId) return t;
        const stack = t.historyStack ? [...t.historyStack.slice(0, (t.historyIndex ?? 0) + 1), cleanUrl] : [t.url, cleanUrl];
        const newIdx = stack.length - 1;
        return {
          ...t,
          url: cleanUrl,
          initialUrl: cleanUrl,
          title: 'Đang tải...',
          historyStack: stack,
          historyIndex: newIdx,
          canGoBack: newIdx > 0,
          canGoForward: false
        };
      }));
    }
  }, [activeTabId, openNewTab]);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (filtered.length === 0) {
        const fallbackId = 'tab-' + Date.now();
        setActiveTabId(fallbackId);
        return [{ id: fallbackId, url: 'about:newtab', title: 'Tab mới', isLoading: false, canGoBack: false, canGoForward: false }];
      }
      if (activeTabId === tabId) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  }, [activeTabId]);

  const closeOtherTabs = useCallback((keepTabId: string) => {
    setTabs(prev => prev.filter(t => t.id === keepTabId));
    setActiveTabId(keepTabId);
  }, []);

  const closeAll = useCallback(() => {
    const newId = 'tab-' + Date.now();
    setTabs([{ id: newId, url: 'about:newtab', title: 'Tab mới', isLoading: false, canGoBack: false, canGoForward: false }]);
    setActiveTabId(newId);
  }, []);

  const addToHistory = useCallback((url: string, title?: string) => {
    if (!url || url.startsWith('about:') || activeTab?.isPrivate) return;
    setHistory(prev => [{ id: 'h-' + Date.now(), url, title: title || url, visitedAt: Date.now() }, ...prev.filter(h => h.url !== url)].slice(0, 500));
  }, [activeTab?.isPrivate]);

  const addBookmark = useCallback((url: string, title: string) => {
    if (!url || url.startsWith('about:')) return;
    setBookmarks(prev => {
      if (prev.some(b => b.url === url)) return prev;
      return [{ id: 'b-' + Date.now(), url, title: cleanNovelTabTitle(title) || url, createdAt: Date.now() }, ...prev];
    });
  }, []);

  const removeBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
  }, []);

  const translateAllTabTitles = useCallback(async () => {
    const chineseRegex = /[\u4e00-\u9fa5]/;
    const needTranslateTabs = tabs.filter(t => t.title && chineseRegex.test(t.title));
    if (needTranslateTabs.length === 0) return;
    try {
      const titles = needTranslateTabs.map(t => t.title);
      const translated = await executeTranslate(titles);
      setTabs(prev => prev.map(t => {
        const idx = needTranslateTabs.findIndex(nt => nt.id === t.id);
        if (idx !== -1 && translated[idx]) {
          return { ...t, title: cleanNovelTabTitle(translated[idx]) };
        }
        return t;
      }));
    } catch (e) {}
  }, [tabs]);

  return {
    tabs, setTabs,
    activeTabId, setActiveTabId,
    activeTab,
    urlInput, setUrlInput,
    isTabSwitcherOpen, setIsTabSwitcherOpen,
    isTabConfigOpen, setIsTabConfigOpen,
    isBookmarksOpen, setIsBookmarksOpen,
    bookmarks, setBookmarks,
    history, setHistory,
    openNewTab, openInBrowser, closeTab, closeOtherTabs, closeAll,
    addToHistory, addBookmark, removeBookmark, translateAllTabTitles
  };
}
