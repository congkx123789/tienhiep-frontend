// Tab Manager Hook for Browser Context
import { useState, useEffect, useCallback } from 'react';
import { BrowserTab, BookmarkItem, HistoryItem } from './BrowserContext.types';
import { cleanNovelTabTitle, executeTranslate } from './browserHelpers';

import { getAccountItem, setAccountItem } from '../../utils/accountStorage';

const INITIAL_TABS_KEY = 'tienhiep_browser_tabs';
const BOOKMARKS_KEY = 'tienhiep_browser_bookmarks';
const HISTORY_KEY = 'tienhiep_browser_history';

const DEFAULT_TABS: BrowserTab[] = [
  { id: 'tab-init-1', url: 'about:newtab', title: 'Tab mới', isLoading: false, canGoBack: false, canGoForward: false, isDesktopMode: true, isDirectMode: false }
];

export function useTabManager() {
  const [tabs, setTabs] = useState<BrowserTab[]>(() => {
    try {
      const saved = getAccountItem<BrowserTab[]>(INITIAL_TABS_KEY, DEFAULT_TABS);
      if (Array.isArray(saved) && saved.length > 0) {
        return saved.map(t => {
          let u = (t.url || '').replace(/^https:\/\/(10\.0\.2\.2|127\.0\.0\.1|localhost):5051/i, 'http://$1:5051').replace('/#/', '/');
          if (u.includes('localhost:3532') || u.includes('127.0.0.1:3532') || u.startsWith('http://localhost') || u === 'about:blank') u = 'about:newtab';
          const stack = Array.isArray(t.historyStack) && t.historyStack.length > 0 ? t.historyStack : [u];
          const idx = typeof t.historyIndex === 'number' ? Math.min(Math.max(0, t.historyIndex), stack.length - 1) : stack.length - 1;
          return { ...t, url: u, initialUrl: u, title: u === 'about:newtab' ? 'Tab mới' : t.title, isDirectMode: false, historyStack: stack, historyIndex: idx, canGoBack: idx > 0, canGoForward: idx < stack.length - 1 };
        });
      }
    } catch (e) {}
    return DEFAULT_TABS;
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || 'tab-init-1');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isTabSwitcherOpen, setIsTabSwitcherOpen] = useState(false);
  const [isTabConfigOpen, setIsTabConfigOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => getAccountItem<BookmarkItem[]>(BOOKMARKS_KEY, []));
  const [history, setHistory] = useState<HistoryItem[]>(() => getAccountItem<HistoryItem[]>(HISTORY_KEY, []));

  const reloadAccountData = useCallback(() => {
    const loadedTabs = getAccountItem<BrowserTab[]>(INITIAL_TABS_KEY, DEFAULT_TABS);
    const validTabs = Array.isArray(loadedTabs) && loadedTabs.length > 0 ? loadedTabs : DEFAULT_TABS;
    setTabs(validTabs);
    setActiveTabId(validTabs[0]?.id || 'tab-init-1');
    setBookmarks(getAccountItem<BookmarkItem[]>(BOOKMARKS_KEY, []));
    setHistory(getAccountItem<HistoryItem[]>(HISTORY_KEY, []));
  }, []);

  useEffect(() => {
    const onAuthChange = () => reloadAccountData();
    window.addEventListener('sync-auth-event', onAuthChange);
    return () => window.removeEventListener('sync-auth-event', onAuthChange);
  }, [reloadAccountData]);

  useEffect(() => {
    try { setAccountItem(INITIAL_TABS_KEY, tabs.filter(t => !t.isPrivate)); } catch (e) {}
  }, [tabs]);
  useEffect(() => { setAccountItem(BOOKMARKS_KEY, bookmarks); }, [bookmarks]);
  useEffect(() => { setAccountItem(HISTORY_KEY, history.slice(0, 500)); }, [history]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (activeTab) {
      const u = activeTab.url || '';
      const isInternal = !u || u === 'about:newtab' || u.includes('localhost:3532') || u.includes('127.0.0.1:3532') || u.startsWith('chrome');
      setUrlInput(isInternal ? '' : u);
    }
  }, [activeTabId, activeTab?.url]);

  const openNewTab = useCallback((isPrivate: boolean = false, initialUrl: string = 'about:newtab') => {
    const newId = 'tab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newTab: BrowserTab = {
      id: newId,
      url: initialUrl,
      initialUrl,
      title: initialUrl === 'about:newtab' ? (isPrivate ? 'Tab ẩn danh' : 'Tab mới') : 'Đang tải...',
      isLoading: initialUrl !== 'about:newtab',
      canGoBack: false,
      canGoForward: false,
      isPrivate,
      isDesktopMode: true,
      isDirectMode: false,
      historyStack: [initialUrl],
      historyIndex: 0
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    return newId;
  }, []);

  const toggleDesktopMode = useCallback((tabId?: string) => {
    const targetId = tabId || activeTabId;
    setTabs(prev => prev.map(t => t.id === targetId ? { ...t, isDesktopMode: t.isDesktopMode === false ? true : false } : t));
  }, [activeTabId]);

  const toggleDirectMode = useCallback((tabId?: string) => {
    const targetId = tabId || activeTabId;
    setTabs(prev => prev.map(t => t.id === targetId ? { ...t, isDirectMode: t.isDirectMode === false ? true : false } : t));
  }, [activeTabId]);

  const navigateTab = useCallback((tabId: string, targetUrl: string) => {
    if (!targetUrl) return;
    let cleanUrl = targetUrl.replace(/^https:\/\/(10\.0\.2\.2|127\.0\.0\.1|localhost):5051/i, 'http://$1:5051');
    if (cleanUrl.includes('localhost:3532') || cleanUrl.includes('127.0.0.1:3532') || cleanUrl.startsWith('http://localhost/') || cleanUrl === 'http://localhost') {
      cleanUrl = 'about:newtab';
    }

    setTabs(prev => prev.map(t => {
      if (t.id !== tabId) return t;
      const stack = Array.isArray(t.historyStack) && t.historyStack.length > 0 ? [...t.historyStack] : [t.url || cleanUrl];
      let idx = typeof t.historyIndex === 'number' ? t.historyIndex : stack.length - 1;

      // THUẬT TOÁN CẮT TƯƠNG LAI: A - B - C, lùi về B, đi D => Cắt C, trở thành [A, B, D]
      if (cleanUrl !== stack[idx] || cleanUrl !== t.url) {
        const truncated = stack.slice(0, idx + 1);
        truncated.push(cleanUrl);
        const newIdx = truncated.length - 1;
        return {
          ...t,
          url: cleanUrl,
          initialUrl: cleanUrl,
          title: cleanUrl === t.url ? t.title : 'Đang tải...',
          isLoading: cleanUrl !== 'about:newtab',
          historyStack: truncated,
          historyIndex: newIdx,
          canGoBack: newIdx > 0,
          canGoForward: false
        };
      }
      return { ...t, isLoading: cleanUrl !== 'about:newtab' };
    }));

    if (tabId === activeTabId) {
      const isInternal = !cleanUrl || cleanUrl === 'about:newtab' || cleanUrl.includes('localhost:3532') || cleanUrl.includes('127.0.0.1:3532');
      setUrlInput(isInternal ? '' : cleanUrl);
    }
  }, [activeTabId]);

  const navigateTabBack = useCallback((tabId: string) => {
    let targetUrl = '';
    setTabs(prev => prev.map(t => {
      if (t.id !== tabId) return t;
      const stack = t.historyStack || [];
      const idx = t.historyIndex ?? 0;
      if (idx <= 0 || stack.length <= 1) return t;
      const newIdx = idx - 1;
      targetUrl = stack[newIdx];
      return {
        ...t,
        url: targetUrl,
        initialUrl: targetUrl,
        historyIndex: newIdx,
        canGoBack: newIdx > 0,
        canGoForward: true,
        isLoading: true
      };
    }));

    if (targetUrl && tabId === activeTabId) {
      const isInternal = !targetUrl || targetUrl === 'about:newtab';
      setUrlInput(isInternal ? '' : targetUrl);
    }
    return targetUrl;
  }, [activeTabId]);

  const navigateTabForward = useCallback((tabId: string) => {
    let targetUrl = '';
    setTabs(prev => prev.map(t => {
      if (t.id !== tabId) return t;
      const stack = t.historyStack || [];
      const idx = t.historyIndex ?? 0;
      if (idx >= stack.length - 1) return t;
      const newIdx = idx + 1;
      targetUrl = stack[newIdx];
      return {
        ...t,
        url: targetUrl,
        initialUrl: targetUrl,
        historyIndex: newIdx,
        canGoBack: true,
        canGoForward: newIdx < stack.length - 1,
        isLoading: true
      };
    }));

    if (targetUrl && tabId === activeTabId) {
      const isInternal = !targetUrl || targetUrl === 'about:newtab';
      setUrlInput(isInternal ? '' : targetUrl);
    }
    return targetUrl;
  }, [activeTabId]);

  const reloadTab = useCallback((tabId: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? {
      ...t,
      refreshKey: (t.refreshKey || 0) + 1,
      isLoading: true
    } : t));
  }, []);

  const openInBrowser = useCallback((targetUrl: string, inNewTab: boolean = false, isPrivate: boolean = false) => {
    let cleanUrl = (targetUrl || '').replace(/^https:\/\/(10\.0\.2\.2|127\.0\.0\.1|localhost):5051/i, 'http://$1:5051');
    if (cleanUrl.includes('localhost:3532') || cleanUrl.includes('127.0.0.1:3532') || cleanUrl.startsWith('http://localhost/') || cleanUrl === 'http://localhost') {
      cleanUrl = 'about:newtab';
    }
    if (inNewTab || !activeTabId) openNewTab(isPrivate, cleanUrl);
    else navigateTab(activeTabId, cleanUrl);
  }, [activeTabId, openNewTab, navigateTab]);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (filtered.length === 0) {
        const fallbackId = 'tab-' + Date.now();
        setActiveTabId(fallbackId);
        return [{ id: fallbackId, url: 'about:newtab', title: 'Tab mới', isLoading: false, canGoBack: false, canGoForward: false }];
      }
      if (activeTabId === tabId) setActiveTabId(filtered[filtered.length - 1].id);
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

  const clearBrowserHistory = useCallback(() => {
    setHistory([]);
    try { setAccountItem(HISTORY_KEY, []); } catch (e) {}
  }, []);

  const deleteBrowserHistoryItem = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h.id !== id && h.url !== id);
      try { setAccountItem(HISTORY_KEY, next); } catch (e) {}
      return next;
    });
  }, []);

  const addBookmark = useCallback((url: string, title: string) => {
    if (!url || url.startsWith('about:')) return;
    setBookmarks(prev => prev.some(b => b.url === url) ? prev : [{ id: 'b-' + Date.now(), url, title: cleanNovelTabTitle(title) || url, createdAt: Date.now() }, ...prev]);
  }, []);

  const removeBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
  }, []);

  const translateAllTabTitles = useCallback(async () => {
    const chineseRegex = /[\u4e00-\u9fa5]/;
    const need = tabs.filter(t => t.title && chineseRegex.test(t.title));
    if (need.length === 0) return;
    try {
      const translated = await executeTranslate(need.map(t => t.title));
      setTabs(prev => prev.map(t => {
        const idx = need.findIndex(nt => nt.id === t.id);
        return (idx !== -1 && translated[idx]) ? { ...t, title: cleanNovelTabTitle(translated[idx]) } : t;
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
    navigateTab, navigateTabBack, navigateTabForward, reloadTab,
    addToHistory, clearBrowserHistory, deleteBrowserHistoryItem,
    addBookmark, removeBookmark, translateAllTabTitles,
    toggleDesktopMode, toggleDirectMode
  };
}
