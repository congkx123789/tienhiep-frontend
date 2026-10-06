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
          if (u.includes('localhost:3532') || u.includes('127.0.0.1:3532') || u.startsWith('http://localhost') || u === 'about:blank') {
            u = 'about:newtab';
          }
          return {
            ...t,
            url: u,
            initialUrl: u,
            title: u === 'about:newtab' ? 'Tab mới' : t.title,
            isDirectMode: false
          };
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

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    return getAccountItem<BookmarkItem[]>(BOOKMARKS_KEY, []);
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    return getAccountItem<HistoryItem[]>(HISTORY_KEY, []);
  });

  // Tự động nạp lại tabs, bookmarks và history khi chuyển đổi tài khoản (đăng nhập / đăng xuất)
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
    try {
      const regularTabs = tabs.filter(t => !t.isPrivate);
      setAccountItem(INITIAL_TABS_KEY, regularTabs);
    } catch (e) {}
  }, [tabs]);

  useEffect(() => {
    setAccountItem(BOOKMARKS_KEY, bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    setAccountItem(HISTORY_KEY, history.slice(0, 500));
  }, [history]);

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

  const openInBrowser = useCallback((targetUrl: string, inNewTab: boolean = false, isPrivate: boolean = false) => {
    let cleanUrl = (targetUrl || '').replace(/^https:\/\/(10\.0\.2\.2|127\.0\.0\.1|localhost):5051/i, 'http://$1:5051');
    if (cleanUrl.includes('localhost:3532') || cleanUrl.includes('127.0.0.1:3532') || cleanUrl.startsWith('http://localhost/') || cleanUrl === 'http://localhost') {
      cleanUrl = 'about:newtab';
    }
    if (inNewTab || !activeTabId) {
      openNewTab(isPrivate, cleanUrl);
    } else {
      setTabs(prev => prev.map(t => {
        if (t.id !== activeTabId) return t;
        let stack = t.historyStack && t.historyStack.length > 0 ? [...t.historyStack] : [t.url || cleanUrl];
        let idx = typeof t.historyIndex === 'number' ? t.historyIndex : stack.length - 1;

        // Tránh nhân bản nếu URL mới trùng khớp với URL hiện tại ở đỉnh con trỏ
        if (cleanUrl !== t.url && stack[idx] !== cleanUrl) {
          // THUẬT TOÁN CẮT TƯƠNG LAI (Chrome-like History Truncation)
          stack = stack.slice(0, idx + 1);
          stack.push(cleanUrl);
          idx = stack.length - 1;
        }

        return {
          ...t,
          url: cleanUrl,
          initialUrl: cleanUrl,
          title: cleanUrl === t.url ? t.title : 'Đang tải...',
          isLoading: true,
          historyStack: stack,
          historyIndex: idx,
          canGoBack: idx > 0,
          canGoForward: idx < stack.length - 1
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
    addToHistory, addBookmark, removeBookmark, translateAllTabTitles,
    toggleDesktopMode, toggleDirectMode
  };
}
