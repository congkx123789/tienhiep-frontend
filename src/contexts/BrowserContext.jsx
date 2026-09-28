import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, RotateCcw, Settings2, Home, Search, ArrowRight, Globe, Sparkles, Volume2, Moon, SkipForward, SkipBack, Bookmark, Plus, Target, ShieldCheck, Shield, MoreVertical, Layers, Trash2, Languages } from 'lucide-react';
import { isElectron } from '../utils/electron';
import { Capacitor } from '@capacitor/core';

const isCapacitor = Capacitor.isNativePlatform();
import api from '../services/api';
import AudioPlayer from '../components/AudioPlayer';
import TranslationSettingsModal from '../components/TranslationSettingsModal';
import ReaderQuickTools from '../components/ReaderQuickTools';
import ChromeMobileNewTab from '../components/ChromeMobileNewTab';
import ChromeMobileTabSwitcher from '../components/ChromeMobileTabSwitcher';
import ChromeMobileMenu from '../components/ChromeMobileMenu';
import ChromeMobileBookmarksModal from '../components/ChromeMobileBookmarksModal';
import { localTranslator } from '../utils/localTranslator';
import { createTranslateScript } from '../utils/webviewInjectedScript';

const translationTextCache = new Map();
const CACHE_MAX_KEYS = 20000;

function getCachedTranslation(text, mode) {
  return translationTextCache.get(`${mode}::${text}`);
}

function setCachedTranslation(text, mode, translated) {
  if (translationTextCache.size > CACHE_MAX_KEYS) {
    const firstKey = translationTextCache.keys().next().value;
    translationTextCache.delete(firstKey);
  }
  translationTextCache.set(`${mode}::${text}`, translated);
}

export function chineseNumberToArabic(chStr) {
  if (!chStr) return '';
  if (/^\d+$/.test(chStr)) return chStr;
  const digits = { '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
  const units = { '十': 10, '百': 100, '千': 1000, '万': 10000 };
  let result = 0;
  let current = 0;
  for (let i = 0; i < chStr.length; i++) {
    const char = chStr[i];
    if (digits[char] !== undefined) {
      current = digits[char];
    } else if (units[char] !== undefined) {
      const u = units[char];
      if (current === 0 && u === 10) current = 1;
      result += (current || 1) * u;
      current = 0;
    }
  }
  result += current;
  return result > 0 ? String(result) : chStr;
}

export function cleanNovelTabTitle(title) {
  if (!title || typeof title !== 'string') return 'Tab mới';
  let t = title.trim();
  // Khử các hậu tố web novel rác
  t = t.replace(/\s*[-_|\s]+(69书吧|69shu|UU看书|uukanshu|起点中文网|起点中文|笔趣阁|八一中文网|番茄小说|飞卢小说网|纵横中文网|晋江文学城|truyenfull|tangthuvien|tàng thư viện|metruyenchu|đọc truyện online|手机版|wap).*$/i, '');
  t = t.replace(/\s*\(\d+\/\d+\)\s*$/i, '');
  t = t.replace(/\s*[-_|\s]+$/, '');

  // Chuyển đổi định dạng chương Hán sang Tiếng Việt
  t = t.replace(/第\s*([0-9一二两三四五六七八九十百千万]+)\s*章/g, (m, p1) => {
    return 'Chương ' + chineseNumberToArabic(p1) + ':';
  });
  t = t.replace(/第\s*([0-9一二两三四五六七八九十百千万]+)\s*节/g, (m, p1) => {
    return 'Tiết ' + chineseNumberToArabic(p1) + ':';
  });
  t = t.replace(/第\s*([0-9一二两三四五六七八九十百千万]+)\s*回/g, (m, p1) => {
    return 'Hồi ' + chineseNumberToArabic(p1) + ':';
  });
  t = t.replace(/第\s*([0-9一二两三四五六七八九十百千万]+)\s*卷/g, (m, p1) => {
    return 'Quyển ' + chineseNumberToArabic(p1) + ':';
  });
  t = t.replace(/\s*:\s*/g, ': ');
  return t.trim() || 'Trang web';
}

// Unified robust translate executor with local engine first, cloud fallback, and 15s timeout
async function executeTranslate(texts, mode = 'vietphrase', userVipKey = 'VIP2026') {
  const candidateServers = [];
  if (typeof window !== 'undefined' && (window.electron || isCapacitor)) {
    if (isCapacitor) {
      candidateServers.push('https://api-tienhiep.lyvuha.com');
      candidateServers.push('http://127.0.0.1:5051');
      candidateServers.push('http://10.0.2.2:5051');
    } else {
      candidateServers.push('http://127.0.0.1:5051');
      candidateServers.push('https://api-tienhiep.lyvuha.com');
    }
  } else {
    candidateServers.push('http://127.0.0.1:5051');
    candidateServers.push('https://api-tienhiep.lyvuha.com');
  }

  // Check stored user settings
  try {
    const stored = localStorage.getItem('translationSettings');
    if (stored) {
      const s = JSON.parse(stored);
      if (s.serverUrl && !candidateServers.includes(s.serverUrl)) {
        candidateServers.unshift(s.serverUrl);
      }
    }
  } catch (e) {}

  candidateServers.push('https://cong123779-tienhiep-api.hf.space');

  for (const srv of candidateServers) {
    try {
      const res = await fetch(`${srv}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VIP-Key': userVipKey || 'VIP2026'
        },
        body: JSON.stringify({ texts, mode, vip_key: userVipKey || 'VIP2026' }),
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.translations && json.translations.length === texts.length) {
          return json.translations;
        }
      }
    } catch (err) {
      console.warn(`[Translate Engine] Failed on ${srv}, trying next:`, err);
    }
  }

  // Fallback to local JS translator
  try {
    await localTranslator.loadDictionaries();
    return texts.map(t => localTranslator.translateSentence(t, mode));
  } catch (err) {
    console.error("[Translate Engine] All translation sources failed:", err);
    return texts;
  }
}

import { BrowserContext, useBrowser } from './BrowserContextCore';
export { BrowserContext, useBrowser };

const EXTERNAL_MEDIA_HOSTS = [
  'google.com', 'google.com.vn', 'youtube.com', 'youtu.be', 'tiktok.com', 'facebook.com', 'fb.com',
  'instagram.com', 'twitter.com', 'x.com', 'bilibili.com', 'douyin.com',
  'netflix.com', 'spotify.com'
];

const isExternalMediaUrl = (url) => {
  if (!url) return false;
  try {
    const h = new URL(url).hostname.toLowerCase();
    return EXTERNAL_MEDIA_HOSTS.some(d => h.includes(d));
  } catch { return false; }
};

const openExternalNative = async (url) => {
  if (isCapacitor) {
    try {
      const { Browser: CapBrowser } = await import('@capacitor/browser');
      await CapBrowser.open({ url, presentationStyle: 'fullscreen' });
      return true;
    } catch (e) {
      window.open(url, '_blank');
      return true;
    }
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
};

export const BrowserProvider = ({ children }) => {
  const [tabs, setTabs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('__browser_tabs_v2'));
      if (Array.isArray(saved) && saved.length > 0) {
        // Chỉ khôi phục tab thường (không private) và bỏ dữ liệu html lớn
        return saved
          .filter(t => !t.isPrivate)
          .map(t => ({ ...t, loading: false, error: null }));
      }
    } catch {}
    return [];
  });
  const [activeTabId, setActiveTabId] = useState(() => {
    try {
      return localStorage.getItem('__browser_active_tab_v2') || null;
    } catch { return null; }
  });
  const [activeTabType, setActiveTabType] = useState('normal'); // 'normal' | 'private'
  const [isTabSwitcherOpen, setIsTabSwitcherOpen] = useState(false);
  const [isChromeMenuOpen, setIsChromeMenuOpen] = useState(false);
  const [isDesktopMode, setIsDesktopMode] = useState(false);
  const [activeAudioObj, setActiveAudioObj] = useState(null);
  const activeAudioObjRef = React.useRef(null);
  React.useEffect(() => {
    activeAudioObjRef.current = activeAudioObj;
  }, [activeAudioObj]);
  const [isVisible, setIsVisible] = useState(false);
  const [isTabConfigOpen, setIsTabConfigOpen] = useState(false);
  const tabElementsRef = React.useRef({});
  React.useEffect(() => {
    if (activeTabId && tabElementsRef.current[activeTabId]) {
      try {
        tabElementsRef.current[activeTabId].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      } catch(e) {}
    }
  }, [activeTabId]);
  // Map of tabId -> { html: string, loading: bool, error: string } for proxy-fetched content
  const [tabProxyContent, setTabProxyContent] = useState({});
  const tabProxyContentRef = React.useRef({});
  const [isTranslationSettingsOpen, setIsTranslationSettingsOpen] = useState(false);
  const [pinnedTools, setPinnedTools] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pinnedTools')) || ['translate', 'audio', 'scroll', 'next', 'dark_mode', 'clean_ads'];
    } catch { return ['translate', 'audio', 'scroll', 'next', 'dark_mode', 'clean_ads']; }
  });

  // Trạng thái Chế Độ Tối (Mặc định TẮT - giữ nguyên giao diện gốc của trang web)
  const [darkModeActive, setDarkModeActive] = useState(() => {
    try {
      const v = localStorage.getItem('__tienhiep_dark_mode_active');
      return v === 'true';
    } catch { return false; }
  });

  const [cleanAdsActive, setCleanAdsActive] = useState(() => {
    try {
      const v = localStorage.getItem('__tienhiep_clean_ads_active');
      return v === null ? true : v !== 'false';
    } catch { return true; }
  });
  
  const [urlInput, setUrlInput] = useState('');
  
  // Quản lý trạng thái chuyển trang để kích hoạt tấm chắn chống chớp trắng (Anti-Flicker Shield)
  const [tabTransitioning, setTabTransitioning] = useState({});
  
  // Lịch sử duyệt web
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('browserHistory')) || [];
    } catch { return []; }
  });

  // Thông báo Toast giao diện người dùng
  const [toastInfo, setToastInfo] = useState(null);
  const showToast = React.useCallback((message, type = 'info') => {
    setToastInfo({ message, type, id: Date.now() });
  }, []);

  React.useEffect(() => {
    if (!toastInfo) return;
    const timer = setTimeout(() => {
      setToastInfo(null);
    }, 3800);
    return () => clearTimeout(timer);
  }, [toastInfo]);

  React.useEffect(() => {
    const handleAppToast = (e) => {
      if (e && e.detail && e.detail.message) {
        showToast(e.detail.message, e.detail.type || 'info');
      }
    };
    window.addEventListener('app-toast', handleAppToast);
    return () => window.removeEventListener('app-toast', handleAppToast);
  }, [showToast]);

  const targetStartSentenceIdxRef = React.useRef({});
  const targetStartSnippetRef = React.useRef({});

  const visibleTabs = React.useMemo(() => {
    return tabs.filter(t => (t.isPrivate ? 'private' : 'normal') === activeTabType);
  }, [tabs, activeTabType]);

  const normalTabCount = React.useMemo(() => tabs.filter(t => !t.isPrivate).length, [tabs]);
  const privateTabCount = React.useMemo(() => tabs.filter(t => t.isPrivate).length, [tabs]);

  const openNewTab = (isPrivate = activeTabType === 'private') => {
    if (isPrivate && activeTabType !== 'private') {
      setActiveTabType('private');
    } else if (!isPrivate && activeTabType !== 'normal') {
      setActiveTabType('normal');
    }
    openInBrowser('about:newtab', { isPrivate });
  };

  const closeAllTabs = (onlyCurrentType = true) => {
    if (onlyCurrentType) {
      const remaining = tabs.filter(t => (t.isPrivate ? 'private' : 'normal') !== activeTabType);
      setTabs(remaining);
      if (remaining.length > 0) {
        setActiveTabId(remaining[remaining.length - 1].id);
      } else {
        setActiveTabId(null);
      }
    } else {
      setTabs([]);
      setActiveTabId(null);
      setIsVisible(false);
    }
  };

  // Lưu tabs vào localStorage mỗi khi thay đổi (chỉ tab thường)
  useEffect(() => {
    try {
      const normalTabs = tabs.filter(t => !t.isPrivate).map(t => ({
        id: t.id, url: t.url, title: t.title, isPrivate: false,
        history: (t.history || []).slice(-20),
        historyIndex: t.historyIndex || 0,
      }));
      localStorage.setItem('__browser_tabs_v2', JSON.stringify(normalTabs));
    } catch {}
  }, [tabs]);

  // Lưu activeTabId
  useEffect(() => {
    try {
      if (activeTabId) localStorage.setItem('__browser_active_tab_v2', activeTabId);
    } catch {}
  }, [activeTabId]);

  useEffect(() => {
    if (isVisible && tabs.length === 0) {
      openInBrowser('https://www.69shuba.com/');
    }
  }, [isVisible, tabs.length]);

  const addToHistory = (url, title = '') => {
    if (!url || url === 'about:blank' || url === 'about:newtab' || url.includes('iframe_proxy')) return;
    
    // Check if the current tab is private or if currently in incognito mode
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab?.isPrivate || activeTabType === 'private') {
      return; // DO NOT record history in Incognito / Private mode
    }

    setHistory(prev => {
      if (prev.length > 0 && prev[0].url === url) return prev;
      let domain = '';
      try { domain = new URL(url).hostname; } catch {}
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('vi-VN');
      const updated = [
        {
          id: Date.now() + Math.random().toString(36).slice(2, 6),
          url,
          title: title || domain || url,
          time: timeStr,
          date: dateStr,
          domain
        },
        ...prev
      ].slice(0, 200);
      try {
        localStorage.setItem('browserHistory', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Web Bookmarks management (⭐️ Dấu trang)
  const [webBookmarks, setWebBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('__tienhiep_web_bookmarks') || '[]');
    } catch {
      return [];
    }
  });
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);

  const toggleBookmark = (url, title = '') => {
    if (!url || url === 'about:newtab' || url === 'about:blank') return;
    setWebBookmarks(prev => {
      const exists = prev.some(b => b.url === url);
      let updated;
      if (exists) {
        updated = prev.filter(b => b.url !== url);
      } else {
        let domain = '';
        try { domain = new URL(url).hostname; } catch {}
        updated = [
          {
            id: Date.now().toString(),
            url,
            title: title || domain || url,
            domain,
            createdAt: Date.now()
          },
          ...prev
        ];
      }
      try {
        localStorage.setItem('__tienhiep_web_bookmarks', JSON.stringify(updated));
      } catch(e) {}
      return updated;
    });
  };

  const deleteBookmark = (idOrUrl) => {
    setWebBookmarks(prev => {
      const updated = prev.filter(b => b.id !== idOrUrl && b.url !== idOrUrl);
      try {
        localStorage.setItem('__tienhiep_web_bookmarks', JSON.stringify(updated));
      } catch(e) {}
      return updated;
    });
  };
  
  const autoStatesRef = React.useRef({});
  const autoAudioStatesRef = React.useRef({});
  const audioExtractRetriesRef = React.useRef({});
  const scriptContentRef = React.useRef(createTranslateScript(false));
  const proxyHtmlCacheRef = React.useRef(new Map());
  const activeProxyServerRef = React.useRef(null);

  const activeHost = React.useMemo(() => {
    try {
      return localStorage.getItem('api_host') || 'http://localhost:8005';
    } catch {
      return 'http://localhost:8005';
    }
  }, []);

  // Domains that need backend proxy (for translation/TTS script injection)
  const PROXY_DOMAINS = [
    '69shuba.com', '69shu.com', '69shu.me', '69shu.pro',
    'ixdzs', 'biquge', 'bqg', 'uukanshu', 'piaotia', 'twkan',
    'qidian.com', 'faloo.com', 'fanqie', 'huanqixiaoshuo',
    'hjwzw.com', 'sto9.com', 'quanben', 'xbiquge', 'esjzone',
    'truyenfull', 'tangthuvien', 'metruyenchu', 'truyenchu',
  ];

  const shouldUseProxy = (url) => {
    if (!url) return false;
    if (url.includes('127.0.0.1') || url.includes('localhost') || url.includes('10.0.2.2')) return false;
    if (url.startsWith('about:')) return false;
    if (isCapacitor) {
      // On mobile: mọi trang web mở trong in-app browser đều qua proxy để gỡ X-Frame-Options/CSP & tiêm công cụ dịch/TTS
      return true;
    }
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return PROXY_DOMAINS.some(d => hostname.includes(d));
    } catch { return false; }
  };

  const getProxyUrl = (url, host) => {
    if (!url) return '';
    if (url.includes('127.0.0.1') || url.includes('localhost') || url.includes('10.0.2.2')) {
      return url;
    }
    if (!shouldUseProxy(url)) return url;
    return `${host}/api/iframe_proxy?url=${encodeURIComponent(url)}&desktop=${isDesktopMode ? 1 : 0}`;
  };

  const openInBrowser = async (url, options = {}) => {
    if (!url) return;

    // Tự động chuyển YouTube sang bản Mobile m.youtube.com để tương thích tốt nhất trên điện thoại
    if (url.includes('youtube.com') && !url.includes('m.youtube.com')) {
      url = url.replace('www.youtube.com', 'm.youtube.com').replace('https://youtube.com', 'https://m.youtube.com');
    }

    // On Web (not running in Electron or native Capacitor app), open directly in a new browser tab
    if (!window.electron && !isCapacitor) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    const isPrivate = options.isPrivate ?? (activeTabType === 'private');
    const newId = Date.now().toString();
    const isNewTab = url === 'about:newtab';
    const initialTitle = isNewTab ? (isPrivate ? 'Tab ẩn danh mới' : 'Tab mới') : 'Đang tải...';

    setTabs(prev => [...prev, {
      id: newId,
      url,
      initialUrl: url,
      title: initialTitle,
      isPrivate,
      history: [url],
      historyIndex: 0
    }]);
    setActiveTabId(newId);
    setIsVisible(true);
    if (!isPrivate && !isNewTab) {
      addToHistory(url, initialTitle);
    }
    // On Capacitor, fetch proxy content via fetch() instead of iframe src
    if (isCapacitor && shouldUseProxy(url) && !isNewTab) {
      setTimeout(() => fetchProxyContent(newId, url), 100);
    }
  };

  const navigateTabToUrl = async (tabId, targetUrl) => {
    if (!targetUrl) return;

    if (targetUrl.includes('youtube.com') && !targetUrl.includes('m.youtube.com')) {
      targetUrl = targetUrl.replace('www.youtube.com', 'm.youtube.com').replace('https://youtube.com', 'https://m.youtube.com');
    }

    if (tabId === activeTabId) {
      setUrlInput(targetUrl === 'about:newtab' ? '' : targetUrl);
    }
    addToHistory(targetUrl, targetUrl);

    setTabs(prev => prev.map(t => {
      if (t.id !== tabId) return t;
      if (t.url === targetUrl) return t;

      const newHistory = t.history ? [...t.history.slice(0, t.historyIndex + 1), targetUrl] : [t.url || t.initialUrl, targetUrl];
      const newIndex = newHistory.length - 1;

      return {
        ...t,
        url: targetUrl,
        history: newHistory,
        historyIndex: newIndex
      };
    }));
    // If this is a novel proxy site on Capacitor, trigger fetch
    if (isCapacitor && shouldUseProxy(targetUrl) && targetUrl !== 'about:newtab') {
      fetchProxyContent(tabId, targetUrl);
    }
  };

  // Fetch proxy HTML content for Capacitor with cache, candidate priority, and reliable timeouts
  const fetchProxyContent = React.useCallback(async (tabId, url, forceRefresh = false) => {
    if (!url || !shouldUseProxy(url)) return;

    const cacheKey = `${url}_${isDesktopMode ? 'dt' : 'mb'}`;

    // 1. Kiểm tra cache frontend (TTL 5 phút)
    if (!forceRefresh) {
      const cached = proxyHtmlCacheRef.current.get(cacheKey);
      if (cached && (Date.now() - cached.time < 300000)) {
        setTabProxyContent(prev => ({ ...prev, [tabId]: { html: cached.html, loading: false, error: null } }));
        const titleMatch = cached.html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          setTabs(prev => prev.map(t => t.id === tabId ? { ...t, title: cleanNovelTabTitle(titleMatch[1].trim()) } : t));
        }
        return;
      }
    }

    // Khi tải mới hoặc F5: nếu là forceRefresh thì giữ nguyên nội dung html cũ để màn hình không bị chớp trắng
    setTabProxyContent(prev => ({
      ...prev,
      [tabId]: {
        html: forceRefresh ? (prev[tabId]?.html || null) : (prev[tabId]?.html || null),
        loading: true,
        error: null
      }
    }));

    // Thứ tự candidates: Ưu tiên server vừa chạy thành công -> server chính thức online -> local adb reverse -> local emulator -> cloud HF
    const baseCandidates = [
      'https://api-tienhiep.lyvuha.com',
      'http://127.0.0.1:5051',
      'http://10.0.2.2:5051',
      'https://cong123779-tienhiep-api.hf.space'
    ];
    const orderedServers = [];
    if (activeProxyServerRef.current && baseCandidates.includes(activeProxyServerRef.current)) {
      orderedServers.push(activeProxyServerRef.current);
    }
    for (const s of baseCandidates) {
      if (!orderedServers.includes(s)) orderedServers.push(s);
    }

    let html = null;
    let lastError = null;

    for (const server of orderedServers) {
      const pUrl = `${server}/api/iframe_proxy?url=${encodeURIComponent(url)}&desktop=${isDesktopMode ? 1 : 0}`;
      try {
        // Local: 18s timeout (backend crawl timeout là 16s), Cloud: 25s timeout
        const isCloud = server.includes('hf.space');
        const timeoutMs = isCloud ? 25000 : 18000;
        const res = await fetch(pUrl, { signal: AbortSignal.timeout(timeoutMs) });
        if (res.ok) {
          const text = await res.text();
          if (text && text.length > 50) {
            html = text;
            activeProxyServerRef.current = server;
            lastError = null;
            break;
          }
        } else {
          lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (err) {
        lastError = err;
        console.warn(`[ProxyFetch] Server ${server} failed:`, err?.message || err);
      }
    }

    if (html) {
      // Lưu cache frontend (giữ tối đa 60 trang)
      proxyHtmlCacheRef.current.set(cacheKey, { html, time: Date.now() });
      if (proxyHtmlCacheRef.current.size > 60) {
        const firstKey = proxyHtmlCacheRef.current.keys().next().value;
        proxyHtmlCacheRef.current.delete(firstKey);
      }

      tabProxyContentRef.current[tabId] = { html, loading: false, error: null };
      setTabProxyContent(prev => ({ ...prev, [tabId]: { html, loading: false, error: null } }));
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, title: cleanNovelTabTitle(titleMatch[1].trim()) } : t));
      }

      // Nạp trực tiếp nội dung vào iframe qua DOMParser (Loại bỏ lỗi màn hình trắng và lỗi reset vô tận của srcdoc trên Android)
      [0, 50, 150, 350, 800].forEach(delay => {
        setTimeout(() => {
          const el = document.getElementById('global-wv-' + tabId);
          if (el && el.contentDocument) {
            const doc = el.contentDocument;
            if (doc.documentElement) {
              doc.documentElement.style.backgroundColor = '#121214';
            }
            if (el.__renderedHtmlHash === html && doc.body && doc.body.children.length > 0) return;
            try {
              const parser = new DOMParser();
              const parsed = parser.parseFromString(html, 'text/html');
              if (parsed) {
                if (parsed.head) doc.head.innerHTML = parsed.head.innerHTML;
                if (parsed.body) {
                  doc.body.innerHTML = parsed.body.innerHTML;
                  if (parsed.body.className) doc.body.className = parsed.body.className;
                  if (parsed.body.getAttribute('style')) doc.body.setAttribute('style', parsed.body.getAttribute('style'));
                }
                if (parsed.title) doc.title = parsed.title;
              }
              el.__renderedHtmlHash = html;
              handleIframeLoaded(tabId, el);
            } catch(e) {}
          }
        }, delay);
      });
    } else {
      let friendlyError = 'Không thể tải trang truyện từ nguồn này.';
      const errMsg = String(lastError?.message || lastError || '');
      if (lastError?.name === 'TimeoutError' || errMsg.includes('timed out') || errMsg.includes('timeout')) {
        friendlyError = 'Trang nguồn phản hồi quá chậm (Timeout). Vui lòng thử lại.';
      } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
        friendlyError = 'Không thể kết nối máy chủ Proxy. Vui lòng kiểm tra mạng.';
      } else if (errMsg) {
        friendlyError = errMsg;
      }
      setTabProxyContent(prev => ({
        ...prev,
        [tabId]: {
          html: prev[tabId]?.html || null,
          loading: false,
          error: friendlyError
        }
      }));
    }
  }, [shouldUseProxy, isDesktopMode]);

  const handleAddressSubmit = (e) => {
    if (e) e.preventDefault();
    let targetUrl = urlInput.trim();
    if (!targetUrl) return;
    if (!/^https?:\/\//i.test(targetUrl) && !targetUrl.startsWith('localhost')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = 'https://' + targetUrl;
      } else {
        targetUrl = 'https://www.google.com/search?q=' + encodeURIComponent(targetUrl);
      }
    }
    
    if (activeTabId) {
      const wv = document.getElementById('global-wv-' + activeTabId);
      if (wv && wv.tagName.toLowerCase() === 'webview') {
        wv.src = targetUrl;
      } else if (isCapacitor && shouldUseProxy(targetUrl)) {
        // On Capacitor: novel sites use fetch+srcdoc, just update state and trigger fetch
        navigateTabToUrl(activeTabId, targetUrl);
        fetchProxyContent(activeTabId, targetUrl);
        addToHistory(targetUrl);
        return;
      } else if (wv) {
        // Non-novel sites on Capacitor: set src directly (external URL, allowed)
        wv.src = targetUrl;
      }
      navigateTabToUrl(activeTabId, targetUrl);
      addToHistory(targetUrl);
    } else {
      openInBrowser(targetUrl);
    }
  };

  const handleGoBack = () => {
    if (!activeTabId) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    const wv = document.getElementById('global-wv-' + activeTabId);

    if (wv && wv.tagName.toLowerCase() === 'webview') {
      if (wv.canGoBack()) wv.goBack();
    } else if (tab.history && tab.historyIndex > 0) {
      const newIndex = tab.historyIndex - 1;
      const targetUrl = tab.history[newIndex];
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: targetUrl, historyIndex: newIndex } : t));
      if (isCapacitor && shouldUseProxy(targetUrl)) {
        fetchProxyContent(activeTabId, targetUrl);
      } else if (wv) {
        wv.src = targetUrl;
      }
    }
  };

  const handleGoForward = () => {
    if (!activeTabId) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    const wv = document.getElementById('global-wv-' + activeTabId);

    if (wv && wv.tagName.toLowerCase() === 'webview') {
      if (wv.canGoForward()) wv.goForward();
    } else if (tab.history && tab.historyIndex < tab.history.length - 1) {
      const newIndex = tab.historyIndex + 1;
      const targetUrl = tab.history[newIndex];
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: targetUrl, historyIndex: newIndex } : t));
      if (isCapacitor && shouldUseProxy(targetUrl)) {
        fetchProxyContent(activeTabId, targetUrl);
      } else if (wv) {
        wv.src = targetUrl;
      }
    }
  };

  const handleReload = () => {
    if (!activeTabId) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    const wv = document.getElementById('global-wv-' + activeTabId);
    const currentUrl = tab.url || tab.initialUrl;

    if (wv && wv.tagName.toLowerCase() === 'webview') {
      wv.reload();
    } else if (isCapacitor && shouldUseProxy(currentUrl)) {
      // Re-fetch proxy content (force fresh fetch)
      fetchProxyContent(activeTabId, currentUrl, true);
    } else if (wv) {
      const currentSrc = wv.src;
      wv.src = '';
      setTimeout(() => { wv.src = currentSrc; }, 50);
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabId);
  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
    } else {
      setUrlInput('');
    }
  }, [activeTabId, activeTab?.url]);

  const closeTab = (tabId, e) => {
    if (e) {
      try { e.preventDefault(); e.stopPropagation(); } catch(err) {}
    }
    const newTabs = tabs.filter(t => t.id !== tabId);
    if (newTabs.length === 0) {
      const newTabId = 'tab_' + Date.now();
      const freshTab = {
        id: newTabId,
        url: 'about:newtab',
        initialUrl: 'about:newtab',
        title: 'Tab mới',
        isPrivate: activeTabType === 'private',
        history: ['about:newtab'],
        historyIndex: 0
      };
      setTabs([freshTab]);
      setActiveTabId(newTabId);
      setUrlInput('');
      return;
    }
    setTabs(newTabs);
    if (activeTabId === tabId) {
      const closedIndex = tabs.findIndex(t => t.id === tabId);
      const nextTab = newTabs[Math.min(closedIndex, newTabs.length - 1)] || newTabs[0];
      setActiveTabId(nextTab.id);
      setUrlInput(nextTab.url === 'about:newtab' ? '' : (nextTab.url || ''));
    }
  };

  const closeOtherTabs = (keepTabId) => {
    const keepTab = tabs.find(t => t.id === keepTabId) || tabs[0];
    if (keepTab) {
      setTabs([keepTab]);
      setActiveTabId(keepTab.id);
      setUrlInput(keepTab.url === 'about:newtab' ? '' : (keepTab.url || ''));
    }
  };

  const translateAllTabTitles = async () => {
    const titlesToTranslate = [];
    const tabIndices = [];
    tabs.forEach((t) => {
      if (t.title && /[\u4e00-\u9fa5]/.test(t.title)) {
        titlesToTranslate.push(cleanNovelTabTitle(t.title));
        tabIndices.push(t.id);
      }
    });
    if (titlesToTranslate.length > 0) {
      try {
        const results = await executeTranslate(titlesToTranslate, 'vietphrase');
        if (results && results.length === titlesToTranslate.length) {
          setTabs(prev => prev.map(t => {
            const idx = tabIndices.indexOf(t.id);
            if (idx !== -1 && results[idx]) {
              return { ...t, title: cleanNovelTabTitle(results[idx]) };
            }
            return t;
          }));
        }
      } catch(e) {}
    }
  };

  const closeAll = () => {
    setTabs([]);
    setActiveTabId(null);
    setIsVisible(false);
  };

  // Window message handler for iframe tabs (Capacitor/Mobile)
  useEffect(() => {
    const handleWindowMessage = async (event) => {
      const { data } = event;
      if (!data || !data.type) return;

      console.log("[BrowserContext IPC] Received message type:", data.type, "payload keys:", Object.keys(data));

      // Find the tab associated with this message source
      let tabId = null;
      tabs.forEach(t => {
        const iframe = document.getElementById('global-wv-' + t.id);
        if (iframe && iframe.contentWindow === event.source) {
          tabId = t.id;
        }
      });

      console.log("[BrowserContext IPC] Resolved tabId:", tabId);

      if (!tabId && activeTabId) {
        tabId = activeTabId;
      }

      if (!tabId) return;
      const iframe = document.getElementById('global-wv-' + tabId);
      if (!iframe) return;

      // Helper gửi message an toàn — tránh crash khi iframe.contentWindow = null
      const send = (msg) => {
        const el = document.getElementById('global-wv-' + tabId);
        if (el && el.contentWindow) {
          try { el.contentWindow.postMessage(msg, '*'); } catch(e) {}
        }
      };
      const sendAfter = (msg, ms) => setTimeout(() => send(msg), ms);

      if (data.type === 'IFRAME_READY' || data.type === 'PAGE_LOADED') {
        // Phục hồi body ngay lập tức nếu Android WebView bị lỗi trắng trang không parse srcdoc
        try {
          const ifr = document.getElementById('global-wv-' + tabId);
          if (ifr && ifr.contentDocument) {
            const doc = ifr.contentDocument;
            if (!doc.body || doc.body.children.length === 0 || (doc.body.innerText || '').trim().length === 0) {
              const rawHtml = tabProxyContentRef.current[tabId]?.html || tabProxyContent[tabId]?.html || ifr.getAttribute('srcdoc') || ifr.srcdoc || '';
              if (rawHtml && rawHtml.length > 50) {
                const parser = new DOMParser();
                const parsedDoc = parser.parseFromString(rawHtml, 'text/html');
                if (parsedDoc && parsedDoc.body && (parsedDoc.body.innerHTML || '').trim().length > 0) {
                  doc.body.innerHTML = parsedDoc.body.innerHTML;
                  if (parsedDoc.body.className) doc.body.className = parsedDoc.body.className;
                  if (parsedDoc.body.getAttribute('style')) doc.body.setAttribute('style', parsedDoc.body.getAttribute('style'));
                  console.log(`[BrowserContext IPC] Phục hồi body thành công khi IFRAME_READY cho tab ${tabId}`);
                }
              }
            }
          }
        } catch(e) {}

        let realUrl = data.url;
        const isLocalHost = !realUrl || realUrl === 'about:srcdoc' || realUrl.includes('localhost') || realUrl.includes('127.0.0.1') || realUrl.includes('10.0.2.2');
        if (isLocalHost) {
          // Giữ nguyên URL truyện thực sự của tab, không bao giờ ghi đè bằng localhost của app
          const existingTab = tabs.find(t => t.id === tabId);
          realUrl = existingTab ? existingTab.url : null;
        } else if (realUrl && realUrl.includes('iframe_proxy')) {
          try {
            const urlObj = new URL(realUrl);
            const decodedUrl = urlObj.searchParams.get('url');
            if (decodedUrl) realUrl = decodedUrl;
          } catch (e) {}
        }

        // Update tab URL and title (làm sạch và tự dịch sang Tiếng Việt nếu còn chữ Hán)
        const rawTitle = data.title || 'Đã tải';
        const initialCleanTitle = cleanNovelTabTitle(rawTitle);
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, url: realUrl || t.url, title: initialCleanTitle } : t));
        if (realUrl && !realUrl.includes('localhost') && realUrl !== 'about:srcdoc') addToHistory(realUrl);

        if (/[\u4e00-\u9fa5]/.test(initialCleanTitle)) {
          const capTabId = tabId;
          executeTranslate([initialCleanTitle], 'vietphrase').then(trans => {
            if (trans && trans[0]) {
              const viTitle = cleanNovelTabTitle(trans[0]);
              setTabs(prev => prev.map(t => t.id === capTabId ? { ...t, title: viTitle } : t));
            }
          }).catch(() => {});
        }
        
        // Inject translation script to iframe
        const script = scriptContentRef.current;
        if (script) send({ action: 'INJECT_SCRIPT', script });

        // Auto translate trigger if enabled (kiểm tra cả ref tab và localStorage)
        const isEnabled = autoStatesRef.current[tabId] || autoAudioStatesRef.current[tabId] || (localStorage.getItem('__tienhiep_auto_translate_active') === 'true');
        if (isEnabled) {
          autoStatesRef.current[tabId] = true;
          setAutoStates(prev => ({ ...prev, [tabId]: true }));
          sendAfter({ action: 'TOGGLE_AUTO_TRANSLATE', enabled: true }, 80);
          sendAfter({ action: 'FORCE_TRANSLATE' }, 300);
        }

        // Tap-to-Read: Gán data-tts-idx sau khi trang render xong
        sendAfter({ action: 'EXEC_HELPER', fn: 'indexParagraphsForTTS', args: [] }, 600);

        // Auto TTS: Nếu tab này đang bật Audio TTS HOẶC AudioPlayer đang mở trên tab này, tự động trích xuất nội dung chương mới để phát tiếp
        if (autoAudioStatesRef.current[tabId] || (activeAudioObjRef.current && (!activeAudioObjRef.current.tabId || activeAudioObjRef.current.tabId === tabId))) {
          autoAudioStatesRef.current[tabId] = true;
          audioExtractRetriesRef.current[tabId] = 0;
          showToast("📖 Đang tải nội dung chương mới...", "info");
          sendAfter({ action: 'EXTRACT_TEXT' }, 800);
        }
      }

      if (data.type === 'NEXT_CHAPTER_FOUND') {
        showToast("📖 Đã tìm thấy nút chương tiếp. Đang chuyển trang...", "info");
      }

      if (data.type === 'NEXT_CHAPTER_NOT_FOUND') {
        showToast("⚠️ Không tìm thấy nút chuyển chương tự động. Vui lòng bật Tâm Ngắm 🎯 để chỉ định nút cho truyện này!", "warning");
      }

      if (data.type === 'LAST_CHAPTER_REACHED') {
        autoAudioStatesRef.current[tabId] = false;
        showToast("🎉 Bạn đã đọc/nghe đến chương mới nhất của truyện này! Hãy chờ tác giả ra chương mới.", "info");
      }

      if (data.type === 'NAVIGATE_REQ') {
        if (isCapacitor && shouldUseProxy(data.url)) {
          navigateTabToUrl(tabId, data.url);
        } else {
          const proxyHost = isCapacitor ? 'http://10.0.2.2:5051' : '';
          const newUrl = getProxyUrl(data.url, proxyHost);
          iframe.src = newUrl;
          setTabs(prev => prev.map(t => t.id === tabId ? { ...t, url: data.url } : t));
          addToHistory(data.url);
        }
      }

      if (data.type === 'TRANSLATE_REQ') {
        try {
          const reqId = data.id !== undefined ? data.id : (data.payload ? data.payload.id : null);
          const reqTexts = data.texts ? data.texts : (data.payload ? data.payload.texts : null);

          if (reqId === null || !reqTexts) {
            throw new Error("Invalid TRANSLATE_REQ structure");
          }

          const stored = localStorage.getItem('translationSettings');
          const settings = stored ? JSON.parse(stored) : { engineType: 'browser', mode: 'advanced', serverUrl: 'https://tienhiep.lyvuha.com' };
          const mode = settings.mode || 'advanced';
          const useServer = settings.engineType === 'server';

          let translations = new Array(reqTexts.length);
          let textsToTranslate = [];
          let originalIndices = [];

          // 1. Cache Check
          reqTexts.forEach((t, i) => {
            const cached = getCachedTranslation(t, mode);
            if (cached) {
              translations[i] = cached;
            } else {
              textsToTranslate.push(t);
              originalIndices.push(i);
            }
          });

          // 2. Fetch translations
          if (textsToTranslate.length > 0) {
            const fetchedTranslations = await executeTranslate(textsToTranslate, mode, settings.vipKey);

            // 3. Save to cache
            fetchedTranslations.forEach((trans, idx) => {
              const origIdx = originalIndices[idx];
              translations[origIdx] = trans;
              setCachedTranslation(textsToTranslate[idx], mode, trans);
            });
          }

          // Send back translations to iframe
          send({ action: 'TRANSLATE_RES', id: reqId, translations });
          if (event.source && typeof event.source.postMessage === 'function') {
            try { event.source.postMessage({ action: 'TRANSLATE_RES', id: reqId, translations }, '*'); } catch(e) {}
          }
          const iframeEl = document.getElementById('global-wv-' + tabId);
          if (iframeEl && iframeEl.contentWindow && typeof iframeEl.contentWindow.__receiveTranslations === 'function') {
            try { iframeEl.contentWindow.__receiveTranslations(reqId, translations); } catch(e) {}
          }
        } catch (err) {
          console.error("Iframe IPC Translate Error:", err);
          const fallbackId = data.id !== undefined ? data.id : (data.payload ? data.payload.id : null);
          send({ action: 'TRANSLATE_RES', id: fallbackId, translations: [] });
          if (event.source && typeof event.source.postMessage === 'function') {
            try { event.source.postMessage({ action: 'TRANSLATE_RES', id: fallbackId, translations: [] }, '*'); } catch(e) {}
          }
          const iframeEl = document.getElementById('global-wv-' + tabId);
          if (iframeEl && iframeEl.contentWindow && typeof iframeEl.contentWindow.__receiveTranslations === 'function') {
            try { iframeEl.contentWindow.__receiveTranslations(fallbackId, []); } catch(e) {}
          }
        }
      }

      if (data.type === 'TITLE_UPDATED' && data.title) {
        const viTitle = cleanNovelTabTitle(data.title);
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, title: viTitle } : t));
      }

      if (data.type === 'TRANSLATION_COMPLETE') {
        if (data.title) {
          const viTitle = cleanNovelTabTitle(data.title);
          setTabs(prev => prev.map(t => t.id === tabId ? { ...t, title: viTitle } : t));
        }
        if (autoAudioStatesRef.current[tabId]) {
          const capturedTabId = tabId;
          setTimeout(() => {
            if (autoAudioStatesRef.current[capturedTabId]) {
              const el = document.getElementById('global-wv-' + capturedTabId);
              if (el && el.contentWindow) {
                try { el.contentWindow.postMessage({ action: 'EXTRACT_TEXT' }, '*'); } catch(e) {}
              }
            }
          }, 300);
        }
      }
      
      if (data.type === 'COPY_TEXT_RES') {
        if (data.text) {
          navigator.clipboard.writeText(data.text);
          alert('Đã copy thành công ' + data.text.length + ' ký tự!');
        } else {
          alert('Không tìm thấy văn bản để copy!');
        }
      }

      if (data.type === 'CONTENT_AREA_SAVED') {
        const { selector, host } = data;
        showToast(`📌 Đã lưu vùng đọc theo cây DOM: "${selector}" cho ${host || 'trang này'}!`, 'info');
      }

      if (data.type === 'AUDIO_TEXT_RES') {
        const textLen = (data.text || '').trim().length;
        if (data.error === "NOT_CHAPTER_PAGE" || textLen < 30) {
          const currentRetries = (audioExtractRetriesRef.current[tabId] || 0) + 1;
          audioExtractRetriesRef.current[tabId] = currentRetries;

          if (currentRetries <= 6) {
            console.log(`[Auto TTS] Nội dung chương chưa sẵn sàng (lần ${currentRetries}/6), đang phục hồi DOM và thử lại...`);
            // Phục hồi body iframe nếu Android WebView bị rỗng do parse srcdoc
            const iframeEl = document.getElementById('global-wv-' + tabId);
            if (iframeEl && iframeEl.contentDocument) {
              try {
                const doc = iframeEl.contentDocument;
                if (!doc.body || doc.body.children.length === 0 || (doc.body.innerText || '').trim().length === 0) {
                  const rawHtml = tabProxyContentRef.current[tabId]?.html || tabProxyContent[tabId]?.html || iframeEl.getAttribute('srcdoc') || iframeEl.srcdoc || '';
                  if (rawHtml && rawHtml.length > 50) {
                    const parser = new DOMParser();
                    const parsed = parser.parseFromString(rawHtml, 'text/html');
                    if (parsed && parsed.body && (parsed.body.innerHTML || '').trim().length > 0) {
                      doc.body.innerHTML = parsed.body.innerHTML;
                      if (parsed.body.className) doc.body.className = parsed.body.className;
                      if (parsed.body.getAttribute('style')) doc.body.setAttribute('style', parsed.body.getAttribute('style'));
                      console.log(`[Auto TTS Retry] Phục hồi body thành công cho tab ${tabId}`);
                    }
                  }
                }
              } catch(e) {}
            }

            setTimeout(() => {
              if (autoAudioStatesRef.current[tabId]) {
                const el = document.getElementById('global-wv-' + tabId);
                if (el && el.contentWindow) {
                  try { el.contentWindow.postMessage({ action: 'EXTRACT_TEXT' }, '*'); } catch(e) {}
                }
              }
            }, 750);
            return;
          }

          autoAudioStatesRef.current[tabId] = false;
          audioExtractRetriesRef.current[tabId] = 0;
          console.warn("[Auto TTS] Trang hiện tại không tìm thấy vùng nội dung chương truyện theo cây HTML sau 6 lần thử:", data);
          showToast('⚠️ Không tìm thấy nội dung chương truyện theo cây HTML. Vui lòng mở chương đọc hoặc dùng Tâm Ngắm 🎯 để chỉ định vùng đọc!', 'warning');
          return;
        }

        if (data.text && data.text.length > 30) {
          // Kiểm tra xem nội dung đã dịch sang tiếng Việt chưa (tránh đọc tiếng Trung khi trang mới chuyển chương)
          if (autoStatesRef.current[tabId]) {
            const chineseMatches = data.text.match(/[\u4e00-\u9fa5]/g) || [];
            const chineseRatio = chineseMatches.length / data.text.length;
            if (chineseRatio > 0.15) {
              const currentRetries = (audioExtractRetriesRef.current[tabId] || 0) + 1;
              audioExtractRetriesRef.current[tabId] = currentRetries;
              if (currentRetries <= 10) {
                console.log(`[Auto TTS] Nội dung đang dịch (${Math.round(chineseRatio * 100)}% chữ Hán), chờ hoàn tất lần ${currentRetries}/10...`);
                if (currentRetries === 1) {
                  showToast("⏳ Đang chờ dịch chương mới sang tiếng Việt...", "info");
                }
                setTimeout(() => {
                  if (autoAudioStatesRef.current[tabId]) {
                    send({ action: 'EXTRACT_TEXT' });
                  }
                }, 1000);
                return;
              }
            }
          }

          audioExtractRetriesRef.current[tabId] = 0;
          const capturedTabId = tabId;
          // Tách đoạn văn — hỗ trợ cả \n\n thực và literal \n
          const paragraphsList = (data.text || '')
            .split(/\n\n|\\n\\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
          const safeSendAudio = (msg) => {
            const el = document.getElementById('global-wv-' + capturedTabId);
            if (el && el.contentWindow) try { el.contentWindow.postMessage(msg, '*'); } catch(e) {}
          };

          const targetStartIdx = targetStartSentenceIdxRef.current[capturedTabId];
          delete targetStartSentenceIdxRef.current[capturedTabId];
          const targetSnippet = targetStartSnippetRef.current[capturedTabId];
          delete targetStartSnippetRef.current[capturedTabId];

          // Ánh xạ vị trí đọc chính xác theo chuỗi snippet của đoạn được chỉ định
          let calculatedStartSentenceIdx = 0;
          if (targetSnippet && paragraphsList.length > 0) {
            const cleanTarget = targetSnippet.replace(/^["“'‘\s]+|["”'’\s]+$/g, '').slice(0, 30).toLowerCase();
            const matchedParaIdx = paragraphsList.findIndex(p => {
              const cleanP = p.toLowerCase();
              return cleanP.includes(cleanTarget) || cleanTarget.includes(cleanP.slice(0, 20));
            });
            if (matchedParaIdx !== -1) {
              calculatedStartSentenceIdx = matchedParaIdx + (data.title ? 1 : 0);
            }
          }
          if (calculatedStartSentenceIdx === 0 && typeof targetStartIdx === 'number' && !isNaN(targetStartIdx)) {
            calculatedStartSentenceIdx = targetStartIdx + (data.title ? 1 : 0);
          }
          const startSentenceIdx = calculatedStartSentenceIdx;

          const titleOffset = data.title ? (data.title.trim().length + 3) : 0;

          const audioObjForTab = { 
            title_vietphrase: data.title || 'Chương truyện', 
            author_hanviet: "Trang Web Nhúng", 
            description: data.text, 
            isChapter: true,
            tabId: capturedTabId,
            paragraphs: paragraphsList,
            startSnippet: targetSnippet,
            startParaIdx: targetStartIdx,
            startSentenceIdx: startSentenceIdx,
            onBoundary: (charIdx, sentenceText, sentenceId) => {
              safeSendAudio({ action: 'TTS_BOUNDARY', charIdx, sentenceText, sentenceId });
              safeSendAudio({ action: 'HIGHLIGHT_SENTENCE', sentenceText, sentenceId });
            }
          };
          if (data.title) {
            const viTitle = cleanNovelTabTitle(data.title);
            setTabs(prev => prev.map(t => t.id === capturedTabId ? { ...t, title: viTitle } : t));
          }
          setActiveAudioObj(audioObjForTab);
          send({ action: 'SET_TTS_PLAYING', playing: true });
        } else {
          // Thử lại nếu đang bật Auto Audio hoặc Audio Player đang mở (trang web đang tải hoặc đang dịch)
          const isAudioActive = autoAudioStatesRef.current[tabId] || (activeAudioObjRef.current && (!activeAudioObjRef.current.tabId || activeAudioObjRef.current.tabId === tabId));
          if (isAudioActive) {
            autoAudioStatesRef.current[tabId] = true;
            const currentRetries = (audioExtractRetriesRef.current[tabId] || 0) + 1;
            audioExtractRetriesRef.current[tabId] = currentRetries;
            if (currentRetries <= 8) {
              console.log(`[Auto TTS] Nội dung chưa sẵn sàng (${data.text ? data.text.length : 0} ký tự), thử lại lần ${currentRetries}/8 sau 1000ms...`);
              setTimeout(() => {
                if (autoAudioStatesRef.current[tabId] || activeAudioObjRef.current) {
                  send({ action: 'EXTRACT_TEXT' });
                }
              }, 1000);
              return;
            }
            // Sau 8 lần vẫn không có chữ: Cảnh báo chi tiết cho người dùng
            showToast("⚠️ Không trích xuất được nội dung chương mới. Vui lòng kiểm tra lại trang web.", "warning");
          }
          autoAudioStatesRef.current[tabId] = false;
          console.warn("[Auto TTS] Không đủ chữ để đọc sau các lần thử lại.");
        }
      }

      // ── Tap-to-Read & Chỉ định đoạn đọc từ Tâm Ngắm ──
      if (data.type === 'TAP_PARAGRAPH' || data.type === 'START_TTS_FROM_PARAGRAPH') {
        const paraIdx = data.paraIdx;
        const sentenceSnippet = data.sentenceText || '';
        if (typeof paraIdx !== 'number' || isNaN(paraIdx)) return;
        const capturedTabIdTap = tabId;
        targetStartSentenceIdxRef.current[capturedTabIdTap] = paraIdx;
        targetStartSnippetRef.current[capturedTabIdTap] = sentenceSnippet;

        const safeSendTap = (msg) => {
          const el = document.getElementById('global-wv-' + capturedTabIdTap);
          if (el && el.contentWindow) try { el.contentWindow.postMessage(msg, '*'); } catch(e) {}
        };
        // Highlight đoạn được tap ngay lập tức trong webview
        safeSendTap({ action: 'EXEC_HELPER', fn: 'highlightActiveParagraph', args: [paraIdx] });

        // Nếu AudioPlayer đang mở, phát sự kiện seek tới câu/đoạn tương ứng kèm snippet
        if (activeAudioObjRef.current) {
          window.dispatchEvent(new CustomEvent('global-tts-seek', {
            detail: { 
              sentenceIdx: paraIdx,
              paraIdx: paraIdx,
              sentenceSnippet: sentenceSnippet
            }
          }));
        } else {
          // Nếu AudioPlayer chưa mở, kích hoạt Auto Audio để trích xuất và đọc từ đoạn đó
          autoAudioStatesRef.current[tabId] = true;
          safeSendTap({ action: 'EXTRACT_TEXT' });
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [tabs]);

  const translateWebviewPage = async (wv) => {
    if (!wv) return;
    try {
      const extractScript = `
        (() => {
          try {
            window.__transNodes = window.__transNodes || new Map();
            let nextId = window.__transNodes.size + 1;
            const items = [];
            const root = document.body || document.documentElement;
            if (!root) return [];

            const walker = document.createTreeWalker(
              root,
              NodeFilter.SHOW_TEXT,
              {
                acceptNode: (node) => {
                  if (!node || !node.nodeValue) return NodeFilter.FILTER_REJECT;
                  const val = node.nodeValue.trim();
                  // Kiểm tra có ký tự tiếng Trung chưa dịch
                  if (!val || !/[\\u4e00-\\u9fa5]/.test(val)) return NodeFilter.FILTER_REJECT;
                  const parent = node.parentElement;
                  if (!parent) return NodeFilter.FILTER_REJECT;
                  const tag = parent.tagName;
                  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') {
                    return NodeFilter.FILTER_REJECT;
                  }
                  return NodeFilter.FILTER_ACCEPT;
                }
              }
            );

            let currentNode = walker.nextNode();
            while (currentNode) {
              // Tìm xem node này đã từng được lưu hay chưa
              let existingId = null;
              for (const [id, entry] of window.__transNodes.entries()) {
                if (entry.node === currentNode) {
                  existingId = id;
                  break;
                }
              }

              if (existingId !== null) {
                // Node đã có trong map nhưng văn bản vẫn còn tiếng Trung -> cần dịch tiếp
                items.push({ id: existingId, text: currentNode.nodeValue });
              } else {
                const id = nextId++;
                window.__transNodes.set(id, { node: currentNode, orig: currentNode.nodeValue });
                items.push({ id, text: currentNode.nodeValue });
              }
              currentNode = walker.nextNode();
            }
            return items;
          } catch (e) {
            return [];
          }
        })()
      `;

      const items = await wv.executeJavaScript(extractScript);
      if (!items || items.length === 0) return;

      const stored = localStorage.getItem('translationSettings');
      const settings = stored ? JSON.parse(stored) : { mode: 'advanced' };
      const mode = settings.mode || 'advanced';

      const BATCH_SIZE = 50;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);
        const translations = new Array(chunk.length);
        const toFetch = [];
        const toFetchIdx = [];

        chunk.forEach((item, idx) => {
          const cached = getCachedTranslation(item.text, mode);
          if (cached) {
            translations[idx] = cached;
          } else {
            toFetch.push(item.text);
            toFetchIdx.push(idx);
          }
        });

        if (toFetch.length > 0) {
          const fetched = await executeTranslate(toFetch, mode, settings.vipKey);
          fetched.forEach((trans, fIdx) => {
            const origIdx = toFetchIdx[fIdx];
            translations[origIdx] = trans;
            setCachedTranslation(toFetch[fIdx], mode, trans);
          });
        }

        const updates = chunk.map((item, idx) => ({
          id: item.id,
          text: translations[idx] || item.text
        }));

        const updatePayload = JSON.stringify(updates);
        await wv.executeJavaScript(`
          (() => {
            try {
              if (!window.__transNodes) return;
              const updates = ${updatePayload};
              for (let i = 0; i < updates.length; i++) {
                const it = updates[i];
                const entry = window.__transNodes.get(it.id);
                if (entry && entry.node) {
                  entry.node.nodeValue = it.text;
                }
              }
            } catch (e) {}
          })()
        `);
      }

      // Kích hoạt thêm observer bên trong webview để tự động dịch các đoạn sinh động tiếp theo
      await wv.executeJavaScript(`
        if (typeof window.toggleAutoTranslate === 'function') {
          window.toggleAutoTranslate(true);
        }
      `).catch(() => {});
    } catch (err) {
      console.error("[TranslateWebviewPage] Error:", err);
    }
  };

  const revertWebviewPage = async (wv) => {
    if (!wv) return;
    try {
      await wv.executeJavaScript(`
        (() => {
          try {
            if (typeof window.toggleAutoTranslate === 'function') {
              window.toggleAutoTranslate(false);
            }
            if (window.__autoTranslateObserver) {
              window.__autoTranslateObserver.disconnect();
            }
            if (window.__transNodes) {
              for (const entry of window.__transNodes.values()) {
                if (entry && entry.node && entry.orig) {
                  entry.node.nodeValue = entry.orig;
                }
              }
            }
          } catch (e) {}
        })()
      `);
    } catch (err) {
      console.error("[RevertWebviewPage] Error:", err);
    }
  };

  const DARK_BG_CSS = 'html, body { background-color: #111118 !important; background: #111118 !important; } div:not(#__teach_highlighter_box):not(#__teach_next_banner):not(#__teach_tag_badge):not([id^="__teach"]):not([id^="__cancel"]):not([id^="__reset"]):not(#tienhiep-active-highlight):not([id*="tienhiep-active"]), teach-highlighter, teach-badge, teach-banner, p:not(#tienhiep-active-highlight):not([id*="tienhiep-active"]), span:not(#tienhiep-active-highlight):not([id*="tienhiep-active"]), ul, ol, li, section, article, main, header, footer, nav, aside, dl, dt, dd, table, thead, tbody, tfoot, tr, th, td, blockquote, form, fieldset, legend, label, pre, code, .content, #content, [class*="content"], [class*="read"], [id*="content"], [id*="chapter"], [class*="chapter"], [class*="wrap"], [class*="box"], [class*="container"], [class*="main"] { background-color: #111118 !important; background: #111118 !important; border-color: #2a2a3a !important; box-shadow: none !important; } .title, .breadcrumb, .topbar, .nlist_page { background-color: #181926 !important; border-color: #2e3050 !important; } img, .pic, picture, video, canvas, svg { background-color: transparent !important; } teach-highlighter, #__teach_highlighter_box { background-color: rgba(245,158,11,0.18) !important; outline: 2.5px solid #f59e0b !important; box-shadow: 0 0 16px rgba(245,158,11,0.65), inset 0 0 12px rgba(245,158,11,0.2) !important; border-radius: 6px !important; } teach-banner, #__teach_next_banner, teach-badge, #__teach_tag_badge { background-color: unset; color: unset; } #tienhiep-active-highlight, span#tienhiep-active-highlight { background-color: #f59e0b !important; background: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 4px !important; padding: 2px 6px !important; box-shadow: 0 0 16px rgba(245, 158, 11, 0.95) !important; border-bottom: 2px solid #b45309 !important; display: inline !important; } ::highlight(tienhiep-tts-highlight) { background-color: #f59e0b !important; color: #000000 !important; }';
  const DARK_COLOR_CSS = 'body *:not(#__teach_highlighter_box):not(#__teach_next_banner):not(#__teach_tag_badge):not([id^="__teach"]):not([id^="__cancel"]):not([id^="__reset"]):not(teach-highlighter):not(teach-badge):not(teach-banner):not(#tienhiep-active-highlight):not([id*="tienhiep-active"]) { color: #e8ecf0 !important; } h1, h2, h3, h4, h5, h6, [class*="title"], .title, [id*="title"] { color: #ffffff !important; } a, a:link, a:visited, a * { color: #93c5fd !important; text-decoration: none !important; } a:hover, a:hover * { color: #bfdbfe !important; } button:not([id^="__"]), a.button, a.s1, .btn, input[type="button"], input[type="submit"] { background-color: #e11d48 !important; color: #ffffff !important; border-color: #be123c !important; } input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select { background-color: #1c1a3a !important; color: #f0f4ff !important; border: 1px solid #4f46e5 !important; } img, canvas, svg, video, picture { opacity: 0.92 !important; background-color: transparent !important; } .nlist_page a, .breadcrumb a { color: #a5b4fc !important; }';
  const DARK_THEME_CSS = DARK_BG_CSS + ' ' + DARK_COLOR_CSS;

  const applyDarkModeToWebview = async (wv, enable) => {
    if (!wv) return;
    try {
      if (enable) {
        if (typeof wv.insertCSS === 'function') {
          try {
            if (wv.__darkCssKey) {
              await wv.removeInsertedCSS(wv.__darkCssKey).catch(() => {});
            }
            wv.__darkCssKey = await wv.insertCSS(DARK_THEME_CSS);
          } catch(e) {}
        }

        await wv.executeJavaScript(`
          (() => {
            window.__tienhiepDarkMode = true;
            let styleEl = document.getElementById('__tienhiep_dark_style');
            if (!styleEl) {
              styleEl = document.createElement('style');
              styleEl.id = '__tienhiep_dark_style';
              (document.head || document.documentElement).appendChild(styleEl);
            }
            styleEl.textContent = ${JSON.stringify(DARK_THEME_CSS)};
            // Ép màu trực tiếp qua JS để thắng inline style
            if (document.body) {
              document.body.style.setProperty('background-color', '#111118', 'important');
              document.body.style.setProperty('color', '#e8ecf0', 'important');
            }
            const contentEls = document.querySelectorAll('#content, .content, [class*="chapter"], [id*="chapter"], [class*="read"], .booktext, #txt, .txt');
            contentEls.forEach(el => {
              if (el && el.style) {
                el.style.setProperty('background-color', '#111118', 'important');
                el.style.setProperty('color', '#e8ecf0', 'important');
              }
            });
            if (typeof window.__ensureDarkMode === 'function') {
              window.__ensureDarkMode();
            }
          })()
        `);
      } else {
        if (typeof wv.removeInsertedCSS === 'function' && wv.__darkCssKey) {
          try {
            await wv.removeInsertedCSS(wv.__darkCssKey);
            wv.__darkCssKey = null;
          } catch(e) {}
        }
        await wv.executeJavaScript(`
          (() => {
            window.__tienhiepDarkMode = false;
            try { localStorage.setItem('__tienhiep_dark_mode_active', 'false'); } catch(e) {}
            const styleEl = document.getElementById('__tienhiep_dark_style');
            if (styleEl) styleEl.remove();
            if (document.body) {
              document.body.style.removeProperty('background-color');
              document.body.style.removeProperty('color');
            }
            const contentSelectors = [
              '#content', '.content', '.read-content', '.chapter-content',
              '[id*="chapter"]', '[class*="chapter"]', '[class*="readarea"]',
              '.booktext', '#booktext', '.txt', '#txt', '.chapter', '.article-content',
              '.novel-content', '.story-content', '.text-content', '[id*="content"]'
            ];
            for (const sel of contentSelectors) {
              try {
                const els = document.querySelectorAll(sel);
                els.forEach(el => {
                  if (el && el.style) {
                    el.style.removeProperty('background-color');
                    el.style.removeProperty('color');
                  }
                  if (el) {
                    el.querySelectorAll('p, span, div, font, h1, h2, h3, a').forEach(child => {
                      if (child && child.style) {
                        child.style.removeProperty('color');
                        child.style.removeProperty('background-color');
                      }
                    });
                  }
                });
              } catch(e) {}
            }
            if (typeof window.__ensureDarkMode === 'function') {
              window.__ensureDarkMode();
            }
          })()
        `);
      }
    } catch (err) {}
  };

  const applyCleanAdsToWebview = async (wv, enable) => {
    if (!wv) return;
    try {
      if (enable) {
        await wv.executeJavaScript(`
          (() => {
            // 1. Chặn window.open mở popup tự động
            window.open = function() {
              console.log('[TienHiep AdBlock] Đã chặn popup window.open');
              return null;
            };

            // 2. Chặn xin quyền thông báo Notifications (triệt tiêu bẫy push notification từ fake captcha)
            try {
              if (typeof Notification !== 'undefined') {
                Notification.requestPermission = function() {
                  return Promise.resolve('denied');
                };
              }
            } catch(e) {}

            // 3. Chặn các hộp thoại cảnh báo virus / hệ thống giả mạo
            try {
              window.alert = function(msg) { console.log('[TienHiep AdBlock] Đã chặn alert giả mạo:', msg); };
              window.confirm = function(msg) { console.log('[TienHiep AdBlock] Đã chặn confirm giả mạo:', msg); return false; };
            } catch(e) {}

            // 4. Chặn Click-Jacking và cướp link ở giai đoạn Capture Phase (cao nhất trước mọi listener khác)
            if (!window.__tienhiepClickHijackInstalled) {
              window.__tienhiepClickHijackInstalled = true;
              document.addEventListener('click', (e) => {
                const el = e.target;
                if (!el) return;
                if (el.id === '__teach_next_banner' || el.id === '__teach_highlighter_box') return;
                if (el.closest && el.closest('#__teach_next_banner, #__teach_highlighter_box')) return;

                const style = window.getComputedStyle(el);
                const isFixed = style.position === 'fixed' || style.position === 'absolute';
                const rect = el.getBoundingClientRect();
                const windowWidth = window.innerWidth || document.documentElement.clientWidth;
                const windowHeight = window.innerHeight || document.documentElement.clientHeight;

                // A. Chặn click vào màng che tàng hình phủ màn hình
                if (isFixed && rect.width >= windowWidth * 0.7 && rect.height >= windowHeight * 0.7) {
                  const isTransparent = parseFloat(style.opacity) < 0.1 || style.visibility === 'hidden' || style.backgroundColor === 'transparent' || style.backgroundColor === 'rgba(0, 0, 0, 0)';
                  if (isTransparent && (!el.innerText || el.innerText.trim().length < 50)) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[TienHiep AdBlock] 🚫 Đã chặn click-jacking và xóa màng che:', el);
                    el.remove();
                    return;
                  }
                }

                // B. Chặn thẻ <a> có target="_blank" mở ra ngoài domain truyện
                const anchor = el.closest ? el.closest('a') : null;
                if (anchor && anchor.href && anchor.target === '_blank') {
                  try {
                    const curHost = window.location.hostname;
                    const targetHost = new URL(anchor.href).hostname;
                    if (targetHost && targetHost !== curHost && !targetHost.endsWith('.' + curHost) && !curHost.endsWith('.' + targetHost)) {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[TienHiep AdBlock] 🚫 Đã chặn click mở tab sang domain ngoài:', anchor.href);
                    }
                  } catch(err) {}
                }
              }, true);
            }

            // 5. Chặn triệt để document.write inject script quảng cáo
            try {
              if (!window.__tienhiepDocWriteIntercepted) {
                window.__tienhiepDocWriteIntercepted = true;
                const origWrite = document.write.bind(document);
                const origWriteln = document.writeln.bind(document);
                const isAdSnippet = (str) => {
                  if (!str || typeof str !== 'string') return false;
                  return /geniees|magsrv|popads|propeller|adsterra|cpm|zoneid|guanggao|\\/ad[\\/_\\.\\?]|doubleclick/i.test(str);
                };
                document.write = function(...args) {
                  if (args.some(isAdSnippet)) {
                    console.log('[TienHiep AdBlock] Đã vô hiệu hóa document.write tải script quảng cáo');
                    return;
                  }
                  return origWrite(...args);
                };
                document.writeln = function(...args) {
                  if (args.some(isAdSnippet)) {
                    console.log('[TienHiep AdBlock] Đã vô hiệu hóa document.writeln tải script quảng cáo');
                    return;
                  }
                  return origWriteln(...args);
                };
              }
            } catch(e) {}

            // 6. CSS Rules ẩn triệt để các vị trí quảng cáo và modal popup
            let adStyle = document.getElementById('__tienhiep_adblock_style');
            if (!adStyle) {
              adStyle = document.createElement('style');
              adStyle.id = '__tienhiep_adblock_style';
              adStyle.textContent = \`
                iframe[src*="ad"], iframe[src*="union"], iframe[src*="cpm"], iframe[src*="pop"],
                iframe[src*="geniees"], iframe[src*="magsrv"], iframe[src*="vantage"],
                [class*="popup-wrap"], [class*="modal-wrap"], [id*="bonus"], [class*="bonus"],
                [class*="vantage"], [id*="vantage"],
                [class*="captcha"]:not(#content *), [id*="captcha"]:not(#content *),
                [class*="recaptcha"], [id*="recaptcha"],
                [class*="robot-check"], [id*="robot-check"],
                [class*="human-verify"], [id*="human-verify"],
                .advertisement, .advertising,
                [class*="banner-ad"], [id*="banner-ad"],
                [class*="float-ad"], [id*="float-ad"],
                [class*="popup-ad"], [id*="popup-ad"],
                ins.adsbygoogle, .google-ad, [id*="google_ads"],
                #ad_top, #ad_bottom, #ad_left, #ad_right,
                .bottom-ad, .top-ad, .side-ad,
                .tuiguang, [class*="tuiguang"], [id*="tuiguang"],
                .guanggao, [class*="guanggao"], [id*="guanggao"],
                [class*="pop-win"], [id*="pop-win"],
                .float-window, .app-download-bar, .download-banner,
                [class*="modal-backdrop"], [class*="overlay-mask"], [class*="popup-overlay"],
                [class*="njt"]:not(#content *), [class*="gotcha"]:not(#content *) {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  pointer-events: none !important;
                  opacity: 0 !important;
                }
                /* Giải phóng scroll bị khóa bởi quảng cáo popup */
                html:has([class*="captcha"]) body,
                html:has([class*="robot"]) body {
                  overflow: auto !important;
                }
              \`;
              (document.head || document.documentElement).appendChild(adStyle);
            }

            // 4. Quét sạch các phần tử quảng cáo và modal popup đang có trên DOM
            const cleanDom = () => {
              const spamSelectors = [
                'iframe[src*="ad"]', 'iframe[src*="union"]', 'iframe[src*="cpm"]', 'iframe[src*="pop"]', 'iframe[src*="geniees"]', 'iframe[src*="magsrv"]', 'iframe[src*="vantage"]',
                '.tuiguang', '[class*="tuiguang"]', '[id*="tuiguang"]',
                '.guanggao', '[class*="guanggao"]', '[id*="guanggao"]',
                'ins.adsbygoogle', '.google-ad', '[id*="google_ads"]',
                '#ad_top', '#ad_bottom', '#ad_left', '#ad_right',
                '.bottom-ad', '.top-ad', '.side-ad',
                '[class*="pop-win"]', '[id*="pop-win"]',
                '.float-window', '.app-download-bar', '.download-banner',
                '[class*="vantage"]', '[id*="vantage"]'
              ];
              spamSelectors.forEach(s => {
                try {
                  document.querySelectorAll(s).forEach(el => {
                    if (el.id === '__teach_next_banner' || el.id === '__teach_highlighter_box') return;
                    if (el.innerText && el.innerText.length > 500 && (el.querySelectorAll('p').length > 2)) return;
                    el.remove();
                  });
                } catch(e) {}
              });

              // Tiêu diệt triệt để:
              // 1. Modal giả mạo Captcha / "I'm not a robot"
              // 2. Banner quảng cáo sàn giao dịch / Forex / Vantage / cờ bạc / hoa hồng
              // 3. Màng che click-jacking mờ ảo hoặc vô hình
              try {
                // Pattern nhận diện Fake CAPTCHA (quanben5 và các dạng tương tự)
                const fakeCaptchaPattern = /not a robot|i[''']m not a robot|click the button|human verification|verify you are human|prove you are not a robot|are you a robot|security check|bot check|robot check/i;
                const adTextPattern = /vantage|hoa hồng|hoa hong|tham gia ngay|đăng ký ngay|kiếm tiền|đối tác|affiliate|forex|crypto|trading|betting|nhà cái|casino|đặt cược|tài xỉu|nổ hũ|game bài|congratulations|bonus|get bonus|approved|lucky\s*draw|trúng thưởng|nhận thưởng|vòng quay|nạp thẻ|tải app|download app|đăng ký nhận quà/i;
                
                const windowWidth = window.innerWidth || document.documentElement.clientWidth;
                const windowHeight = window.innerHeight || document.documentElement.clientHeight;

                // === BƯỚC 1: Tiêu diệt Fake CAPTCHA ngay lập tức ===
                // Quét tất cả các element có chứa text "not a robot" dù nằm ở bất kỳ đâu
                const allEls = document.querySelectorAll('div, section, aside, dialog, form, article');
                allEls.forEach(el => {
                  if (el.id === '__teach_next_banner' || el.id === '__teach_highlighter_box') return;
                  if (el.closest && el.closest('#__teach_next_banner, #__teach_highlighter_box')) return;
                  
                  // Bỏ qua các vùng nội dung truyện chính
                  if (el.id === 'content' || el.id === 'txt' || el.id === 'chapter-content' ||
                      el.classList.contains('content') || el.classList.contains('read-content') ||
                      el.classList.contains('txtnav') || el.classList.contains('booktext')) return;
                  
                  const text = (el.innerText || '').trim();
                  
                  // A. Fake Captcha: bất kể kích thước
                  if (fakeCaptchaPattern.test(text)) {
                    console.log('[TienHiep AdBlock] 🚫 Gỡ bỏ fake captcha:', el.tagName, el.className || el.id);
                    el.remove();
                    // Khôi phục scroll bị khóa
                    document.body.style.removeProperty('overflow');
                    document.body.style.removeProperty('height');
                    document.documentElement.style.removeProperty('overflow');
                    document.documentElement.style.removeProperty('height');
                    // Xóa tất cả backdrop/overlay che phủ toàn màn hình còn sót lại
                    document.querySelectorAll('div, section').forEach(bg => {
                      const bgStyle = window.getComputedStyle(bg);
                      const bgRect = bg.getBoundingClientRect();
                      if ((bgStyle.position === 'fixed' || bgStyle.position === 'absolute') &&
                          bgRect.width >= windowWidth * 0.7 && bgRect.height >= windowHeight * 0.7 &&
                          parseInt(bgStyle.zIndex, 10) > 5) {
                        const bgText = (bg.innerText || '').trim();
                        if (bgText.length < 200) {
                          bg.remove();
                        }
                      }
                    });
                    return;
                  }

                  const style = window.getComputedStyle(el);
                  const isFixedOrAbsolute = style.position === 'fixed' || style.position === 'absolute';

                  // B. Tiêu diệt widget nổi quảng cáo Vantage / Hoa Hồng / Cờ Bạc / Hộp quà
                  if (isFixedOrAbsolute) {
                    const hasAdKeyword = adTextPattern.test(text);
                    const hasAdIframe = el.querySelector('iframe[src*="ad"], iframe[src*="cpm"], iframe[src*="magsrv"], iframe[src*="geniees"], iframe[src*="vantage"]');
                    const hasAdAction = /get bonus|download|cài đặt|nhận ngay|tham gia ngay/i.test(text);

                    if (hasAdKeyword || hasAdIframe || hasAdAction) {
                      if (!el.innerText || el.innerText.length < 600) {
                        console.log('[TienHiep AdBlock] 🚫 Gỡ bỏ popup quảng cáo nổi:', el);
                        el.remove();
                        document.body.style.removeProperty('overflow');
                        document.documentElement.style.removeProperty('overflow');
                        return;
                      }
                    }

                    // C. Tiêu diệt màng che click-jacking trong suốt phủ toàn màn hình
                    const rect = el.getBoundingClientRect();
                    const zIndex = parseInt(style.zIndex, 10);
                    if ((zIndex > 20 || zIndex === 2147483647) && rect.width >= windowWidth * 0.7 && rect.height >= windowHeight * 0.7) {
                      const isTransparent = parseFloat(style.opacity) < 0.1 || style.visibility === 'hidden' || style.backgroundColor === 'transparent' || style.backgroundColor === 'rgba(0, 0, 0, 0)';
                      if (isTransparent && (!el.innerText || el.innerText.trim().length < 50)) {
                        console.log('[TienHiep AdBlock] 🚫 Gỡ bỏ click-jacking overlay:', el);
                        el.remove();
                        return;
                      }
                      // D. Tiêu diệt màng che đen tối (opacity > 0 nhưng không có nội dung truyện)
                      const bgColor = style.backgroundColor;
                      const isBlackish = bgColor && (bgColor.includes('0, 0, 0') || bgColor.includes('rgba(0,0,0') || bgColor === '#000' || bgColor === '#000000' || bgColor.startsWith('rgb(0'));
                      const hasAlpha = bgColor && bgColor.includes('rgba') && parseFloat(bgColor.split(',')[3]) > 0.1;
                      if ((isBlackish || (hasAlpha && parseFloat(style.opacity) > 0.3)) && text.length < 200) {
                        console.log('[TienHiep AdBlock] 🚫 Gỡ bỏ màng đen overlay:', el);
                        el.remove();
                        document.body.style.removeProperty('overflow');
                        document.documentElement.style.removeProperty('overflow');
                        return;
                      }
                    }
                  }
                });

                // === BƯỚC 2: Nếu body bị khóa overflow hidden mà không có lý do hợp lệ → mở khóa ===
                if (document.body && (document.body.style.overflow === 'hidden' || window.getComputedStyle(document.body).overflow === 'hidden')) {
                  // Kiểm tra xem có modal hợp lệ không (modal của app chính như settings thì bỏ qua)
                  const hasLegitModal = document.querySelector('#__teach_next_banner, #tienhiep-active-highlight');
                  if (!hasLegitModal) {
                    document.body.style.removeProperty('overflow');
                    document.body.style.overflow = '';
                    document.documentElement.style.overflow = '';
                    document.documentElement.style.removeProperty('overflow');
                    console.log('[TienHiep AdBlock] ✅ Đã giải phóng scroll bị khóa bởi quảng cáo');
                  }
                }
              } catch(e) {}
            };
            cleanDom();

            if (window.__tienhiepAdObserver) {
              window.__tienhiepAdObserver.disconnect();
            }
            // Dùng debounce để tránh vòng lặp vô tận khi website tái tạo quảng cáo liên tục
            let __cleanDomTimer = null;
            window.__tienhiepAdObserver = new MutationObserver((mutations) => {
              const hasNewNodes = mutations.some(m => m.addedNodes && m.addedNodes.length > 0);
              if (!hasNewNodes) return;
              if (__cleanDomTimer) clearTimeout(__cleanDomTimer);
              __cleanDomTimer = setTimeout(() => { cleanDom(); __cleanDomTimer = null; }, 200);
            });
            window.__tienhiepAdObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
          })()
        `);
      } else {
        await wv.executeJavaScript(`
          (() => {
            if (window.__tienhiepAdObserver) {
              window.__tienhiepAdObserver.disconnect();
              window.__tienhiepAdObserver = null;
            }
            const adStyle = document.getElementById('__tienhiep_adblock_style');
            if (adStyle) adStyle.remove();
          })()
        `);
      }
    } catch (err) {}
  };

  useEffect(() => {
    const resumeTTSPlayback = async (tabId, webview) => {
      try {
        const result = await webview.executeJavaScript(`
          (window.__TienHiepHelpers ? window.__TienHiepHelpers.extractCleanChapterText() : { title: document.title, text: document.body.innerText })
        `);

        if (!result || !result.text || result.text.length <= 50) {
          console.log("[Auto Audio] Trang chưa tải đủ nội dung text, thử lại sau 600ms...");
          setTimeout(() => {
            if (autoAudioStatesRef.current[tabId]) {
              resumeTTSPlayback(tabId, webview);
            }
          }, 600);
          return;
        }

        setActiveAudioObj({ 
          tabId: tabId, 
          title_vietphrase: result.title || 'Chương đọc', 
          title: result.title || 'Chương đọc', 
          description: result.text, 
          isChapter: true,
          startSentenceIdx: 0,
          onBoundary: (charIdx, sentenceText) => {
            window.dispatchEvent(new CustomEvent('global-tts-boundary', {
              detail: { charIdx, sentenceText }
            }));
          }
        });
        webview.executeJavaScript(`window.isTtsPlaying = true;`).catch(() => {});
      } catch (err) {
        console.error("Auto Audio Resume Error:", err);
      }
    };


    tabs.forEach(tab => {
      const wv = document.getElementById('global-wv-' + tab.id);
      if (!wv) return;
      if (!wv.dataset.listenersAttached) {
        wv.dataset.listenersAttached = 'true';
        wv.addEventListener('new-window', (e) => {
          e.preventDefault();
          const targetUrl = e.url || e.targetUrl || '';
          const isCleanAdsOn = localStorage.getItem('__tienhiep_clean_ads_active') !== 'false';
          
          if (isCleanAdsOn) {
            // Chặn các popup quảng cáo tự hiện nhảy tab linh tinh
            const isSpam = /ad|banner|click|cpm|pop|affiliate|track|promo|game|bet|casino|18\+|union|redirect|tongji/i.test(targetUrl);
            let currentHost = '';
            let targetHost = '';
            try { currentHost = new URL(wv.src || 'http://localhost').hostname; } catch(err) {}
            try { targetHost = new URL(targetUrl).hostname; } catch(err) {}
            
            if (isSpam || (targetHost && currentHost && targetHost !== currentHost && !targetUrl.includes('chapter') && !targetUrl.includes('.html'))) {
              console.log('[TienHiep AdBlock] Đã chặn popup quảng cáo tự bung:', targetUrl);
              return; // Chặn triệt để, không mở tab mới!
            }
          }

          const newId = Date.now().toString();
          setTabs(prev => [...prev, { id: newId, url: targetUrl, initialUrl: targetUrl, title: 'Đang tải...' }]);
          setActiveTabId(newId);
        });
        wv.addEventListener('page-title-updated', (e) => {
          const cleanedTitle = cleanNovelTabTitle(e.title);
          setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, title: cleanedTitle } : t));
          setHistory(prev => {
            const updated = prev.map(item => item.url === wv.src ? { ...item, title: cleanedTitle } : item);
            localStorage.setItem('browserHistory', JSON.stringify(updated));
            return updated;
          });
        });

        wv.addEventListener('console-message', async (e) => {
          if (e.message === '[Translation Complete]' && autoAudioStatesRef.current[tab.id]) {
            setTimeout(() => {
              if (autoAudioStatesRef.current[tab.id]) {
                resumeTTSPlayback(tab.id, wv);
              }
            }, 300);
          }
          
          if (e.message.startsWith('[TRANSLATE_REQ]')) {
             try {
                const data = JSON.parse(e.message.substring(15));
                const stored = localStorage.getItem('translationSettings');
                const settings = stored ? JSON.parse(stored) : { engineType: 'browser', mode: 'advanced', serverUrl: 'http://127.0.0.1:5051' };
                const mode = settings.mode || 'advanced';
                const useServer = settings.engineType === 'server';

                let translations = new Array(data.texts.length);
                let textsToTranslate = [];
                let originalIndices = [];

                // 1. Check Cache First
                data.texts.forEach((t, i) => {
                  const cached = getCachedTranslation(t, mode);
                  if (cached) {
                    translations[i] = cached;
                  } else {
                    textsToTranslate.push(t);
                    originalIndices.push(i);
                  }
                });

                // 2. Fetch missing translations
                if (textsToTranslate.length > 0) {
                  const fetchedTranslations = await executeTranslate(textsToTranslate, mode, settings.vipKey);

                  // 3. Save to Cache and merge results
                  fetchedTranslations.forEach((trans, idx) => {
                     const origIdx = originalIndices[idx];
                     translations[origIdx] = trans;
                     setCachedTranslation(textsToTranslate[idx], mode, trans);
                  });
                }
                
                const transPayload = JSON.stringify(translations);
                await wv.executeJavaScript(`if(typeof window.__receiveTranslations === 'function') window.__receiveTranslations(${data.id}, ${transPayload});`).catch(e => console.error("ReceiveTrans JS error:", e));
             } catch(err) {
                console.error("IPC Translate Error:", err);
                try {
                  const data = JSON.parse(e.message.substring(15));
                  wv.executeJavaScript(`if(typeof window.__receiveTranslations === 'function') window.__receiveTranslations(${data.id}, []);`).catch(() => {});
                } catch(e) {}
             }
          }
        });

        const setupAndTranslateNewPage = async () => {
          wv.__translationCompletedForThisPage = false;
          
          // 1. Áp dụng Chế độ tối nếu người dùng đã bật (Mặc định tắt để giữ giao diện chuẩn gốc của web)
          const isDark = localStorage.getItem('__tienhiep_dark_mode_active') === 'true';
          applyDarkModeToWebview(wv, isDark);

          const isClean = localStorage.getItem('__tienhiep_clean_ads_active') !== 'false';
          applyCleanAdsToWebview(wv, isClean);

          // 2. Tiêm script helper và quan sát dịch ngầm
          const settingsStr = localStorage.getItem('translationSettings') || '{}';
          const useTypewriter = JSON.parse(settingsStr).typewriterEffect === true;
          const scriptContent = createTranslateScript(useTypewriter);
          wv.__translateScript = scriptContent;
          scriptContentRef.current = scriptContent;

          try {
            await wv.executeJavaScript(scriptContent);
          } catch (err) {}

          const isEnabled = autoStatesRef.current[tab.id] || autoAudioStatesRef.current[tab.id] || localStorage.getItem('__tienhiep_auto_translate_active') === 'true';
          if (isEnabled) {
            autoStatesRef.current[tab.id] = true;
            setAutoStates(prev => ({ ...prev, [tab.id]: true }));

            try {
              await wv.executeJavaScript(`if (typeof window.toggleAutoTranslate === 'function') window.toggleAutoTranslate(true);`);
            } catch (err) {}

            // Chạy dịch đợt 1
            await translateWebviewPage(wv);

            // Chạy dịch đợt 2 sau 500ms cho các web load nội dung bằng JS
            setTimeout(async () => {
              if (autoStatesRef.current[tab.id]) {
                await translateWebviewPage(wv);
              }
            }, 500);

            // Chạy dịch đợt 3 sau 1200ms để bảo đảm 100% không sót đoạn văn nào
            setTimeout(async () => {
              if (autoStatesRef.current[tab.id]) {
                await translateWebviewPage(wv);
              }
            }, 1200);
          }
        };

        // Kích hoạt tấm chắn chống chớp trắng & nạp CSS tối tức thì (Native Chromium)
        wv.addEventListener('did-start-loading', () => {
          setTabTransitioning(prev => ({ ...prev, [tab.id]: true }));
          const isDark = localStorage.getItem('__tienhiep_dark_mode_active') === 'true';
          if (isDark && typeof wv.insertCSS === 'function') {
            wv.insertCSS(DARK_THEME_CSS).then(k => { wv.__darkCssKey = k; }).catch(() => {});
          }
          // Timeout an toàn tự động gỡ tấm chắn sau 3.5s nếu trang tải quá lâu
          setTimeout(() => {
            setTabTransitioning(prev => ({ ...prev, [tab.id]: false }));
          }, 3500);
        });

        wv.addEventListener('did-navigate', (e) => {
          setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, url: e.url } : t));
          if (activeTabId === tab.id) {
            setUrlInput(e.url);
          }
          addToHistory(e.url);
          wv.__translationCompletedForThisPage = false;
          setupAndTranslateNewPage();
        });

        wv.addEventListener('did-navigate-in-page', (e) => {
          setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, url: e.url } : t));
          if (activeTabId === tab.id) {
            setUrlInput(e.url);
          }
          addToHistory(e.url);
          wv.__translationCompletedForThisPage = false;
          setupAndTranslateNewPage();
        });

        wv.addEventListener('dom-ready', () => {
          setupAndTranslateNewPage();

          // Khi DOM đã nạp xong và Dark Theme đã áp dụng, gỡ tấm chắn êm dịu (chống chớp)
          setTimeout(() => {
            setTabTransitioning(prev => ({ ...prev, [tab.id]: false }));
          }, 150);

          // Nếu TTS đang bật trên tab này, kích hoạt tự động phát lại khi sang trang mới
          if (autoAudioStatesRef.current[tab.id]) {
            setTimeout(() => {
              if (autoAudioStatesRef.current[tab.id]) {
                resumeTTSPlayback(tab.id, wv);
              }
            }, 2500);
          }
        });

        wv.addEventListener('did-finish-load', () => {
          setupAndTranslateNewPage();
          setTimeout(() => {
            setTabTransitioning(prev => ({ ...prev, [tab.id]: false }));
          }, 80);
        });
      }
    });
  }, [tabs]);

  const [autoStates, setAutoStates] = useState(() => {
    try {
      return localStorage.getItem('__tienhiep_auto_translate_active') === 'true' ? { default: true } : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (activeTabId && localStorage.getItem('__tienhiep_auto_translate_active') === 'true') {
      autoStatesRef.current[activeTabId] = true;
      setAutoStates(prev => ({ ...prev, [activeTabId]: true }));
    }
  }, [activeTabId]);

  const handleIframeLoaded = React.useCallback((tabId, iframeEl) => {
    if (!iframeEl) return;
    try {
      const doc = iframeEl.contentDocument;
      const win = iframeEl.contentWindow;
      if (!doc || !win) return;

      // BẢO VỆ CHỐNG LỖI MÀN HÌNH TRẮNG TRÊN ANDROID WEBVIEW:
      // Thuộc tính srcdoc trên Android WebView thường xuyên bị lỗi không parse phần body của HTML truyện dài / ký tự tiếng Trung
      // Nếu doc.body bị rỗng hoặc bị cắt cụt (truncated), lập tức dùng DOMParser để nạp lại đầy đủ nội dung vào doc.body!
      try {
        const rawHtml = tabProxyContentRef.current[tabId]?.html || tabProxyContent[tabId]?.html || iframeEl.getAttribute('srcdoc') || iframeEl.srcdoc || '';
        if (rawHtml && rawHtml.length > 50) {
          try {
            const parser = new DOMParser();
            const parsedDoc = parser.parseFromString(rawHtml, 'text/html');
            if (parsedDoc && parsedDoc.body && (parsedDoc.body.innerHTML || '').trim().length > 0) {
              const parsedLen = (parsedDoc.body.innerHTML || '').length;
              const currentLen = (doc.body ? doc.body.innerHTML || '' : '').length;
              if (!doc.body || doc.body.children.length === 0 || currentLen < parsedLen * 0.7) {
                if (parsedDoc.head && (!doc.head || doc.head.children.length === 0)) {
                  doc.head.innerHTML = parsedDoc.head.innerHTML;
                }
                doc.body.innerHTML = parsedDoc.body.innerHTML;
                if (parsedDoc.body.className) doc.body.className = parsedDoc.body.className;
                if (parsedDoc.body.getAttribute('style')) doc.body.setAttribute('style', parsedDoc.body.getAttribute('style'));
                console.log(`[BrowserContext] Phục hồi body thành công cho tab ${tabId} (${doc.body.children.length} elements)`);
              }
            }
          } catch(e) {
            console.warn('[BrowserContext] DOMParser error:', e);
          }
        }
      } catch(recoverErr) {
        console.warn('[BrowserContext] Lỗi phục hồi body iframe:', recoverErr);
      }

      console.log(`[BrowserContext] Iframe loaded for tab ${tabId}. Direct injecting scripts...`);

      const targetTab = tabs.find(t => t.id === tabId);
      if (targetTab && targetTab.url) {
        win.__originalUrl = targetTab.url;
      }

      // 1. Inject script dịch thuật & TienHiepHelpers trực tiếp vào DOM iframe
      const scriptCode = scriptContentRef.current || createTranslateScript(false);
      try {
        const existingScript = doc.getElementById('__tienhiep_injected_script');
        if (existingScript) existingScript.remove();
      } catch(e) {}

      try {
        const scriptTag = doc.createElement('script');
        scriptTag.id = '__tienhiep_injected_script';
        scriptTag.textContent = scriptCode;
        (doc.head || doc.body || doc.documentElement).appendChild(scriptTag);
      } catch(e) {
        console.warn('appendChild script tag failed:', e);
      }

      // CHẠY TRỰC TIẾP QUA win.eval ĐỂ ĐẢM BẢO CHẮC CHẮN SCRIPT ĐƯỢC THỰC THI NGAY
      try {
        win.eval(scriptCode);
      } catch(e) {
        console.warn('Direct win.eval scriptCode error:', e);
      }

      // 2. Cập nhật tiêu đề tab
      const rawTitle = doc.title || 'Đã tải';
      const cleanTitle = cleanNovelTabTitle(rawTitle);
      setTabs(prev => {
        const target = prev.find(t => t.id === tabId);
        if (target && target.title === cleanTitle) return prev;
        return prev.map(t => t.id === tabId ? { ...t, title: cleanTitle } : t);
      });

      // 3. Phân đoạn TTS
      setTimeout(() => {
        try {
          if (win.__TienHiepHelpers && typeof win.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
            win.__TienHiepHelpers.indexParagraphsForTTS();
          }
        } catch(e) {}
      }, 300);

      // 4. Tự động kích hoạt dịch thuật nếu tab bật HOẶC đã lưu tự động dịch trong localStorage
      const isAutoTranslate = autoStatesRef.current[tabId] || (localStorage.getItem('__tienhiep_auto_translate_active') === 'true');
      if (isAutoTranslate) {
        autoStatesRef.current[tabId] = true;
        setAutoStates(prev => ({ ...prev, [tabId]: true }));
        setTimeout(() => {
          try {
            if (typeof win.toggleAutoTranslate === 'function') {
              win.toggleAutoTranslate(true);
            }
            if (typeof win.__collectAndTranslateNodes === 'function') {
              win.__collectAndTranslateNodes(doc.body || doc.documentElement);
            }
          } catch(e) {}
        }, 150);
      }

      // 5. Nếu tab đang phát Audio TTS, tự động nạp chương mới để đọc tiếp
      if (autoAudioStatesRef.current[tabId] || (activeAudioObjRef.current && (!activeAudioObjRef.current.tabId || activeAudioObjRef.current.tabId === tabId))) {
        autoAudioStatesRef.current[tabId] = true;
        audioExtractRetriesRef.current[tabId] = 0;
        setTimeout(() => {
          try {
            if (win.parent && win.parent !== win) {
              win.postMessage({ action: 'EXTRACT_TEXT' }, '*');
            }
          } catch(e) {}
        }, 800);
      }
    } catch(err) {
      console.warn(`[BrowserContext] Direct iframe inject error for tab ${tabId}:`, err);
    }
  }, [setTabs, setAutoStates]);

  const ensureIframeRendered = React.useCallback((tabId, iframeEl) => {
    if (!iframeEl) return;
    try {
      const doc = iframeEl.contentDocument;
      if (!doc) return;
      
      // Ngăn ngừa chớp màn hình trắng bằng việc áp dụng background tối
      if (doc.documentElement) {
        doc.documentElement.style.backgroundColor = '#121214';
      }

      const rawHtml = tabProxyContentRef.current[tabId]?.html || tabProxyContent[tabId]?.html || '';
      if (!rawHtml || rawHtml.length < 50) return;
      if (iframeEl.__renderedHtmlHash === rawHtml && doc.body && doc.body.children.length > 0) return;

      try {
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(rawHtml, 'text/html');
        if (parsedDoc) {
          if (parsedDoc.head) doc.head.innerHTML = parsedDoc.head.innerHTML;
          if (parsedDoc.body) {
            doc.body.innerHTML = parsedDoc.body.innerHTML;
            if (parsedDoc.body.className) doc.body.className = parsedDoc.body.className;
            if (parsedDoc.body.getAttribute('style')) doc.body.setAttribute('style', parsedDoc.body.getAttribute('style'));
          }
          if (parsedDoc.title) doc.title = parsedDoc.title;
        }
        iframeEl.__renderedHtmlHash = rawHtml;
        handleIframeLoaded(tabId, iframeEl);
      } catch(e) {}
    } catch(e) {
      console.warn('[BrowserContext] ensureIframeRendered error:', e);
    }
  }, [handleIframeLoaded, tabProxyContent]);

  // Lắng nghe F5 / Ctrl+R từ Electron để chỉ reload riêng webview hiện tại
  useEffect(() => {
    if (window.electron && typeof window.electron.onActiveTabReload === 'function') {
      const unsub = window.electron.onActiveTabReload(() => {
        if (!activeTabId) return;
        const wv = document.getElementById('global-wv-' + activeTabId);
        if (wv && typeof wv.reload === 'function') {
          console.log('[BrowserContext] F5: Đang reload riêng webview tab', activeTabId);
          wv.reload();
        }
      });
      return unsub;
    }
  }, [activeTabId]);

  // Đảm bảo nội dung body của iframe luôn được hiển thị (Chống lỗi màn hình trắng của Android WebView)
  useEffect(() => {
    if (!isCapacitor) return;
    const checkAndFixIframes = () => {
      tabs.forEach(tab => {
        const rawHtml = tabProxyContentRef.current[tab.id]?.html || tabProxyContent[tab.id]?.html;
        if (rawHtml) {
          const iframe = document.getElementById('global-wv-' + tab.id);
          if (iframe && iframe.contentDocument) {
            const doc = iframe.contentDocument;
            if (doc.documentElement) {
              doc.documentElement.style.backgroundColor = '#121214';
            }
            if (iframe.__renderedHtmlHash === rawHtml && doc.body && doc.body.children.length > 0) {
              return;
            }
            try {
              const parser = new DOMParser();
              const parsedDoc = parser.parseFromString(rawHtml, 'text/html');
              if (parsedDoc) {
                if (parsedDoc.head) doc.head.innerHTML = parsedDoc.head.innerHTML;
                if (parsedDoc.body) {
                  doc.body.innerHTML = parsedDoc.body.innerHTML;
                  if (parsedDoc.body.className) doc.body.className = parsedDoc.body.className;
                  if (parsedDoc.body.getAttribute('style')) doc.body.setAttribute('style', parsedDoc.body.getAttribute('style'));
                }
                if (parsedDoc.title) doc.title = parsedDoc.title;
              }
              iframe.__renderedHtmlHash = rawHtml;
              handleIframeLoaded(tab.id, iframe);
            } catch(e2) {}
          }
        }
      });
    };

    checkAndFixIframes();
    const interval = setInterval(checkAndFixIframes, 1000);
    return () => clearInterval(interval);
  }, [tabProxyContent, tabs, isCapacitor, handleIframeLoaded]);

  const togglePin = (toolId) => {
    setPinnedTools(prev => {
      const newPins = prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId];
      localStorage.setItem('pinnedTools', JSON.stringify(newPins));
      return newPins;
    });
  };











  const handleTool = async (action, tabId, payload = null) => {
    console.log("[BrowserContext Tool] handleTool action:", action, "tabId:", tabId, "payload:", payload);
    const wv = document.getElementById('global-wv-' + tabId);
    if (!wv) {
      console.warn("[BrowserContext Tool] No element found for global-wv-" + tabId);
      return;
    }
    const isIframe = wv.tagName.toLowerCase() === 'iframe';
    console.log("[BrowserContext Tool] Element found:", wv.tagName, "isIframe:", isIframe);
    
    try {
      if (action === 'translate') {
        const current = autoStates[tabId] || false;
        const newState = !current;
        autoStatesRef.current[tabId] = newState;
        if (newState) {
          localStorage.setItem('__tienhiep_auto_translate_active', 'true');
        } else {
          localStorage.removeItem('__tienhiep_auto_translate_active');
        }
        setAutoStates(prev => ({ ...prev, [tabId]: newState }));
        
        if (isIframe && wv.contentWindow) {
          const script = scriptContentRef.current || createTranslateScript(false);
          try {
            if (!wv.contentWindow.__TienHiepHelpers && script) {
              wv.contentWindow.eval(script);
            }
            if (typeof wv.contentWindow.toggleAutoTranslate === 'function') {
              wv.contentWindow.toggleAutoTranslate(newState);
            }
            if (newState && typeof wv.contentWindow.__collectAndTranslateNodes === 'function') {
              wv.contentWindow.__collectAndTranslateNodes(wv.contentDocument ? (wv.contentDocument.body || wv.contentDocument.documentElement) : null);
            }
          } catch(e) {
            console.warn('[handleTool translate] Direct eval/call error:', e);
          }
          if (script) {
            wv.contentWindow.postMessage({ action: 'INJECT_SCRIPT', script }, '*');
          }
          wv.contentWindow.postMessage({ action: 'TOGGLE_AUTO_TRANSLATE', enabled: newState }, '*');
        } else {
          if (newState) {
            await translateWebviewPage(wv);
          } else {
            await revertWebviewPage(wv);
          }
        }
      }

      else if (action === 'audio') {
        if (activeAudioObj) {
          console.log("[Audio] Người dùng bấm tắt TTS khi đang phát.");
          setActiveAudioObj(null);
          autoAudioStatesRef.current[tabId] = false;
          if (isIframe && wv.contentWindow) {
            wv.contentWindow.postMessage({ action: 'SET_TTS_PLAYING', playing: false }, '*');
          } else {
            wv.executeJavaScript(`window.isTtsPlaying = false;`).catch(() => {});
          }
          return;
        }

        autoAudioStatesRef.current[tabId] = true;
        if (isIframe && wv.contentWindow) {
          const script = scriptContentRef.current || createTranslateScript(false);
          try {
            if (!wv.contentWindow.__TienHiepHelpers && script) {
              wv.contentWindow.eval(script);
            }
          } catch(e) {}
          if (script) {
            wv.contentWindow.postMessage({ action: 'INJECT_SCRIPT', script }, '*');
          }
          if (!autoStates[tabId]) {
            autoStatesRef.current[tabId] = true;
            localStorage.setItem('__tienhiep_auto_translate_active', 'true');
            setAutoStates(prev => ({ ...prev, [tabId]: true }));
            try {
              if (typeof wv.contentWindow.toggleAutoTranslate === 'function') {
                wv.contentWindow.toggleAutoTranslate(true);
              }
            } catch(e) {}
            wv.contentWindow.postMessage({ action: 'TOGGLE_AUTO_TRANSLATE', enabled: true }, '*');
          }
          setTimeout(() => {
            if (wv.contentWindow) {
              wv.contentWindow.postMessage({ action: 'EXTRACT_TEXT' }, '*');
            }
          }, 150);
        } else {
          // Nếu trang web chưa được kích hoạt dịch, tự động dịch trang trước để có nội dung tiếng Việt
          if (!autoStates[tabId]) {
            console.log("[Audio] Auto translate was off. Triggering translateWebviewPage...");
            autoStatesRef.current[tabId] = true;
            localStorage.setItem('__tienhiep_auto_translate_active', 'true');
            setAutoStates(prev => ({ ...prev, [tabId]: true }));
            await translateWebviewPage(wv);
          }

          const result = await wv.executeJavaScript(`
            (window.__TienHiepHelpers ? window.__TienHiepHelpers.extractCleanChapterText() : { title: document.title, text: document.body.innerText })
          `);

          if (result && result.error === "NOT_CHAPTER_PAGE") {
            autoAudioStatesRef.current[tabId] = false;
            console.warn("[Audio] Trang hiện tại không phải là chương truyện theo cây HTML:", result);
            showToast('⚠️ Không tìm thấy nội dung chương truyện theo cây HTML. Vui lòng mở một chương truyện cụ thể hoặc dùng Tâm Ngắm 🎯 để chỉ định vùng đọc!', 'warning');
            return;
          }

          if (result && result.text && result.text.length > 50) {
             setActiveAudioObj({ 
               title_vietphrase: result.title, 
               author_hanviet: "Trang Web Nhúng", 
               description: result.text, 
               isChapter: true,
               tabId: tabId,
               startSentenceIdx: 0,
               onBoundary: (charIdx, sentenceText) => {
                 window.dispatchEvent(new CustomEvent('global-tts-boundary', {
                   detail: { charIdx, sentenceText }
                 }));
               }
             });
             wv.executeJavaScript(`window.isTtsPlaying = true;`).catch(() => {});
          } else {
            console.log("[Audio] Đang chờ nạp nội dung trang...");
            setTimeout(() => {
              if (autoAudioStatesRef.current[tabId]) {
                resumeTTSPlayback(tabId, wv);
              }
            }, 800);
          }
        }
      }
      else if (action === 'scroll') {
        if (isIframe) {
          const settings = JSON.parse(localStorage.getItem('translationSettings') || '{}');
          const scrollSpeed = settings.scrollSpeed || 30;
          wv.contentWindow.postMessage({ action: 'TOGGLE_AUTOSCROLL', speed: scrollSpeed }, '*');
        } else {
          const settings = JSON.parse(localStorage.getItem('translationSettings') || '{}');
          const scrollSpeed = settings.scrollSpeed || 30;
          const isScrolling = await wv.executeJavaScript(`
            (() => {
              if (window.__scrollInterval) { clearInterval(window.__scrollInterval); window.__scrollInterval = null; return false; }
              else { window.__scrollInterval = setInterval(() => window.scrollBy({top: 1, behavior: 'instant'}), ${scrollSpeed}); return true; }
            })()
          `);
        }
      }
      else if (action === 'next') {
        // Tự động kích hoạt Auto Dịch để khi sang chương mới lập tức dịch tự động
        autoStatesRef.current[tabId] = true;
        localStorage.setItem('__tienhiep_auto_translate_active', 'true');
        setAutoStates(prev => ({ ...prev, [tabId]: true }));

        // Nếu đang bật Audio TTS, duy trì trạng thái để tự động phát tiếp chương sau
        if (activeAudioObj) {
          autoAudioStatesRef.current[tabId] = true;
        }

        if (isIframe) {
          try {
            if (wv.contentWindow && wv.contentWindow.__TienHiepHelpers && typeof wv.contentWindow.__TienHiepHelpers.checkAndTriggerAutoNext === 'function') {
              wv.contentWindow.__TienHiepHelpers.checkAndTriggerAutoNext(true, 0);
            }
          } catch(e) {}
          if (wv.contentWindow) {
            try { wv.contentWindow.postMessage({ action: 'TRIGGER_NEXT' }, '*'); } catch(e) {}
          }
        } else {
          const script = scriptContentRef.current || createTranslateScript(false);
          await wv.executeJavaScript(script).catch(() => {});
          await wv.executeJavaScript(`if (window.__TienHiepHelpers) window.__TienHiepHelpers.checkAndTriggerAutoNext(true, 0);`);
        }
      }
      else if (action === 'next_with_delay') {
        const delay = payload?.delay !== undefined ? Number(payload.delay) : 3;
        autoStatesRef.current[tabId] = true;
        localStorage.setItem('__tienhiep_auto_translate_active', 'true');
        setAutoStates(prev => ({ ...prev, [tabId]: true }));

        if (activeAudioObj) {
          autoAudioStatesRef.current[tabId] = true;
        }

        if (isIframe) {
          try {
            if (wv.contentWindow && wv.contentWindow.__TienHiepHelpers && typeof wv.contentWindow.__TienHiepHelpers.checkAndTriggerAutoNext === 'function') {
              wv.contentWindow.__TienHiepHelpers.checkAndTriggerAutoNext(true, delay);
            }
          } catch(e) {}
          if (wv.contentWindow) {
            try { wv.contentWindow.postMessage({ action: 'TRIGGER_NEXT', delay }, '*'); } catch(e) {}
          }
        } else {
          const script = scriptContentRef.current || createTranslateScript(false);
          await wv.executeJavaScript(script).catch(() => {});
          await wv.executeJavaScript(`if (window.__TienHiepHelpers) window.__TienHiepHelpers.checkAndTriggerAutoNext(true, ${delay});`);
        }
      }
      else if (action === 'prev') {
        // Tự động kích hoạt Auto Dịch
        autoStatesRef.current[tabId] = true;
        localStorage.setItem('__tienhiep_auto_translate_active', 'true');
        setAutoStates(prev => ({ ...prev, [tabId]: true }));

        if (isIframe) {
          try {
            if (wv.contentWindow && wv.contentWindow.__TienHiepHelpers && typeof wv.contentWindow.__TienHiepHelpers.checkAndTriggerAutoPrev === 'function') {
              wv.contentWindow.__TienHiepHelpers.checkAndTriggerAutoPrev();
            }
          } catch(e) {}
          if (wv.contentWindow) {
            try { wv.contentWindow.postMessage({ action: 'TRIGGER_PREV' }, '*'); } catch(e) {}
          }
        } else {
          const script = scriptContentRef.current || createTranslateScript(false);
          await wv.executeJavaScript(script).catch(() => {});
          await wv.executeJavaScript(`
            if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.checkAndTriggerAutoPrev === 'function') {
              window.__TienHiepHelpers.checkAndTriggerAutoPrev();
            } else {
              let prevBtn = document.querySelector('.prev-btn, #prev-chap, .prev, #prev, .prev-chapter, #prev-chapter, a[rel="prev"]');
              if (!prevBtn) {
                prevBtn = Array.from(document.querySelectorAll("a, button, span")).find(el => {
                  const txt = (el.textContent || "").trim().toLowerCase();
                  return /上一章|上一页|chương trước|trang trước|hồi trước/.test(txt);
                });
              }
              if (prevBtn) {
                if (prevBtn.tagName === "A" && prevBtn.href && !prevBtn.href.startsWith("javascript:")) {
                  window.location.href = prevBtn.href;
                } else {
                  prevBtn.click();
                }
              } else if (window.history.length > 1) {
                window.history.back();
              }
            }
          `);
        }
      }
      else if (action === 'scroll_top') {
        if (!isIframe) {
          await wv.executeJavaScript(`window.scrollTo({ top: 0, behavior: 'smooth' });`);
        }
      }
      else if (action === 'scroll_bottom') {
        if (!isIframe) {
          await wv.executeJavaScript(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });`);
        }
      }
      else if (action === 'bookmark_save') {
        if (!isIframe) {
          return await wv.executeJavaScript(`
            (() => {
              const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
              const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
              const percent = Math.min(100, Math.round((scrollY / maxScroll) * 100));
              const title = (window.__TienHiepHelpers ? window.__TienHiepHelpers.extractCleanChapterText().title : document.title) || document.title;
              return {
                title,
                url: window.location.href,
                scrollY,
                percent
              };
            })()
          `);
        } else {
          const activeTab = tabs.find(t => t.id === tabId);
          return {
            title: activeTab?.title || 'Trang đọc',
            url: activeTab?.url || '',
            scrollY: 0,
            percent: 0
          };
        }
      }
      else if (action === 'bookmark_jump') {
        const bm = payload;
        if (!bm) return;
        const activeTab = tabs.find(t => t.id === tabId);
        if (activeTab && bm.url && activeTab.url !== bm.url) {
          setTabs(prev => prev.map(t => t.id === tabId ? { ...t, url: bm.url, initialUrl: bm.url, title: bm.title } : t));
          setUrlInput(bm.url);
          setTimeout(async () => {
            try {
              if (!isIframe) {
                await wv.executeJavaScript(`window.scrollTo({ top: ${bm.scrollY || 0}, behavior: 'smooth' });`);
              }
            } catch(e){}
          }, 1500);
        } else {
          if (!isIframe) {
            await wv.executeJavaScript(`window.scrollTo({ top: ${bm.scrollY || 0}, behavior: 'smooth' });`);
          }
        }
      }
      else if (action === 'toggle_scroll') {
        const enabled = payload?.enabled;
        const speed = payload?.speed || 25;
        if (!isIframe) {
          await wv.executeJavaScript(`
            (() => {
              if (window.__tienhiep_scrollInterval) {
                clearInterval(window.__tienhiep_scrollInterval);
                window.__tienhiep_scrollInterval = null;
              }
              if (${enabled}) {
                const stopAutoScroll = () => {
                  if (window.__tienhiep_scrollInterval) {
                    clearInterval(window.__tienhiep_scrollInterval);
                    window.__tienhiep_scrollInterval = null;
                  }
                  window.removeEventListener('wheel', stopAutoScroll);
                  window.removeEventListener('touchstart', stopAutoScroll);
                };
                window.addEventListener('wheel', stopAutoScroll, { passive: true, once: true });
                window.addEventListener('touchstart', stopAutoScroll, { passive: true, once: true });

                window.__tienhiep_scrollInterval = setInterval(() => {
                  const isAtBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 10);
                  if (isAtBottom) {
                    stopAutoScroll();
                  } else {
                    window.scrollBy({ top: 1, behavior: 'instant' });
                  }
                }, ${speed});
              }
            })()
          `);
        }
      }
      else if (action === 'set_scroll_speed') {
        const speed = payload || 25;
        if (!isIframe) {
          await wv.executeJavaScript(`
            if (window.__tienhiep_scrollInterval) {
              clearInterval(window.__tienhiep_scrollInterval);
              window.__tienhiep_scrollInterval = setInterval(() => {
                const isAtBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 10);
                if (isAtBottom) {
                  clearInterval(window.__tienhiep_scrollInterval);
                  window.__tienhiep_scrollInterval = null;
                } else {
                  window.scrollBy({ top: 1, behavior: 'instant' });
                }
              }, ${speed});
            }
          `);
        }
      }
      else if (action === 'font_size_cycle') {
        if (!isIframe) {
          await wv.executeJavaScript(`
            (() => {
              const sizes = ['16px', '18px', '21px', '24px'];
              const current = window.__readerFontSizeIdx || 0;
              const nextIdx = (current + 1) % sizes.length;
              window.__readerFontSizeIdx = nextIdx;
              const chosenSize = sizes[nextIdx];
              
              document.querySelectorAll('p, div, article, section, font, span').forEach(el => {
                if ((el.innerText || '').length > 30) {
                  el.style.fontSize = chosenSize;
                  el.style.lineHeight = '1.8';
                }
              });
            })()
          `);
        }
      }
      else if (action === 'teach_next') {
        if (isIframe) {
          const script = createTranslateScript(false);
          // 1. Thử inject & gọi trực tiếp trên contentWindow
          try {
            if (wv.contentWindow) {
              if (!wv.contentWindow.__TienHiepHelpers && script) {
                if (typeof wv.contentWindow.eval === 'function') {
                  wv.contentWindow.eval(script);
                } else if (wv.contentDocument) {
                  const s = wv.contentDocument.createElement('script');
                  s.textContent = script;
                  (wv.contentDocument.head || wv.contentDocument.documentElement).appendChild(s);
                }
              }
              if (wv.contentWindow.__TienHiepHelpers && typeof wv.contentWindow.__TienHiepHelpers.startTeachNextMode === 'function') {
                wv.contentWindow.__TienHiepHelpers.startTeachNextMode();
              }
            }
          } catch(e) {
            console.warn('[teach_next] direct call error:', e);
          }
          // 2. Đồng thời gửi qua postMessage IPC để đảm bảo mọi loại iframe đều nhận được
          if (script && wv.contentWindow) {
            try { wv.contentWindow.postMessage({ action: 'INJECT_SCRIPT', script }, '*'); } catch(e) {}
          }
          setTimeout(() => {
            if (wv.contentWindow) {
              try { wv.contentWindow.postMessage({ action: 'TEACH_NEXT' }, '*'); } catch(e) {}
            }
          }, 80);
        } else {
          try {
            // Luôn cập nhật script mới nhất để không dùng code cũ trong bộ nhớ đệm webview
            const script = createTranslateScript(false);
            await wv.executeJavaScript(script).catch(() => {});
            await wv.executeJavaScript(`if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.startTeachNextMode === 'function') window.__TienHiepHelpers.startTeachNextMode();`);
          } catch (err) {
            console.error("[teach_next] Lỗi khi bật chế độ chỉ định nút:", err);
          }
        }
      }
      else if (action === 'get_next_rule') {
        if (isIframe) {
          try {
            if (wv.contentWindow && wv.contentWindow.__TienHiepHelpers && typeof wv.contentWindow.__TienHiepHelpers.getNovelKeys === 'function') {
              const keys = wv.contentWindow.__TienHiepHelpers.getNovelKeys();
              const rule = wv.contentWindow.__TienHiepHelpers.getSavedNextRule();
              const history = typeof wv.contentWindow.__TienHiepHelpers.getSavedNextRules === 'function' ? wv.contentWindow.__TienHiepHelpers.getSavedNextRules() : (rule ? [rule] : []);
              return { ...keys, rule, history };
            }
          } catch(e) {}
          return { host: '', novelKey: '', rule: null, history: [], url: '' };
        } else {
          return await wv.executeJavaScript(`
            (() => {
              if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.getNovelKeys === 'function') {
                const keys = window.__TienHiepHelpers.getNovelKeys();
                const rule = window.__TienHiepHelpers.getSavedNextRule();
                const history = typeof window.__TienHiepHelpers.getSavedNextRules === 'function' ? window.__TienHiepHelpers.getSavedNextRules() : (rule ? [rule] : []);
                return { ...keys, rule, history };
              }
              return { host: window.location.hostname, novelKey: window.location.hostname, rule: null, history: [], url: window.location.href };
            })()
          `);
        }
      }
      else if (action === 'save_next_rule') {
        if (isIframe) {
          try {
            if (wv.contentWindow && wv.contentWindow.__TienHiepHelpers && typeof wv.contentWindow.__TienHiepHelpers.saveNextRule === 'function') {
              return wv.contentWindow.__TienHiepHelpers.saveNextRule(payload);
            }
          } catch(e) {}
          return false;
        } else {
          return await wv.executeJavaScript(`
            (() => {
              if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.saveNextRule === 'function') {
                return window.__TienHiepHelpers.saveNextRule(${JSON.stringify(payload)});
              }
              return false;
            })()
          `);
        }
      }
      else if (action === 'select_next_rule') {
        if (isIframe) {
          try {
            if (wv.contentWindow && wv.contentWindow.__TienHiepHelpers && typeof wv.contentWindow.__TienHiepHelpers.selectNextRule === 'function') {
              return wv.contentWindow.__TienHiepHelpers.selectNextRule(payload?.ruleId);
            }
          } catch(e) {}
          return false;
        } else {
          return await wv.executeJavaScript(`
            (() => {
              if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.selectNextRule === 'function') {
                return window.__TienHiepHelpers.selectNextRule(${JSON.stringify(payload?.ruleId)});
              }
              return false;
            })()
          `);
        }
      }
      else if (action === 'delete_next_rule') {
        if (isIframe) {
          try {
            if (wv.contentWindow && wv.contentWindow.__TienHiepHelpers && typeof wv.contentWindow.__TienHiepHelpers.deleteNextRule === 'function') {
              return wv.contentWindow.__TienHiepHelpers.deleteNextRule(payload?.ruleId || null);
            }
          } catch(e) {}
          return false;
        } else {
          return await wv.executeJavaScript(`
            (() => {
              if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.deleteNextRule === 'function') {
                return window.__TienHiepHelpers.deleteNextRule(${JSON.stringify(payload?.ruleId || null)});
              }
              return false;
            })()
          `);
        }
      }
      else if (action === 'clear_all_next_rules') {
        if (isIframe) {
          try {
            if (wv.contentWindow && wv.contentWindow.__TienHiepHelpers && typeof wv.contentWindow.__TienHiepHelpers.clearAllNextRules === 'function') {
              return wv.contentWindow.__TienHiepHelpers.clearAllNextRules();
            }
          } catch(e) {}
          return false;
        } else {
          return await wv.executeJavaScript(`
            (() => {
              if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.clearAllNextRules === 'function') {
                return window.__TienHiepHelpers.clearAllNextRules();
              }
              return false;
            })()
          `);
        }
      }
      else if (action === 'dark_mode') {
        const nextState = !darkModeActive;
        setDarkModeActive(nextState);
        localStorage.setItem('__tienhiep_dark_mode_active', String(nextState));
        if (isIframe) {
          wv.contentWindow.postMessage({ action: 'TOGGLE_DARK_MODE', enabled: nextState }, '*');
        } else {
          await applyDarkModeToWebview(wv, nextState);
        }
      }
      else if (action === 'clean_ads') {
        const nextState = !cleanAdsActive;
        setCleanAdsActive(nextState);
        localStorage.setItem('__tienhiep_clean_ads_active', String(nextState));
        if (isIframe) {
          wv.contentWindow.postMessage({ action: 'CLEAN_ADS', enabled: nextState }, '*');
        } else {
          await applyCleanAdsToWebview(wv, nextState);
        }
      }
      else if (action === 'force_translate') {
        if (isIframe) {
          wv.contentWindow.postMessage({ action: 'FORCE_TRANSLATE' }, '*');
        } else {
          await wv.executeJavaScript(`
            if (window.__autoTranslateObserver) {
               const allNodes = window.__TienHiepHelpers ? window.__TienHiepHelpers.collectTextNodes(document.body) : [];
               if(allNodes.length > 0) window.__translateQueue = allNodes;
               if(window.__processTranslationQueue) window.__processTranslationQueue();
            }
          `);
        }
      }
      else if (action === 'copy_text') {
        if (isIframe) {
          wv.contentWindow.postMessage({ action: 'COPY_TEXT' }, '*');
        } else {
          const text = await wv.executeJavaScript(`(window.__TienHiepHelpers ? window.__TienHiepHelpers.extractCleanChapterText().text : document.body.innerText)`);
          if (text) {
            navigator.clipboard.writeText(text);
            alert('Đã copy thành công ' + text.length + ' ký tự!');
          }
        }
      }
      else if (action === 'clear_history') {
        setHistory([]);
        localStorage.removeItem('browserHistory');
        alert('Đã xóa toàn bộ lịch sử duyệt web!');
      }
      else if (action === 'clear_cache') {
        try {
          if (!isIframe) {
            await wv.executeJavaScript(`
              localStorage.clear();
              sessionStorage.clear();
            `);
            if (wv.clearData) {
              wv.clearData();
            }
          }
          alert('Đã xóa toàn bộ Cache & Dữ liệu lưu trữ cục bộ!');
        } catch (e) {
          alert('Không thể xóa Cache: ' + e.message);
        }
      }
      else if (action === 'clear_cookies') {
        try {
          if (!isIframe && wv.clearData) {
            wv.clearData();
          }
          alert('Đã xóa toàn bộ Cookies trình duyệt!');
        } catch (e) {
          alert('Không thể xóa Cookies: ' + e.message);
        }
      }
    } catch (e) { alert("Lỗi: " + e.message); }
  };

  const highlightSentenceInWebview = (tabId, sentenceText) => {
    const wv = document.getElementById('global-wv-' + tabId);
    if (!wv) return;
    
    if (wv.tagName.toLowerCase() === 'iframe') {
      wv.contentWindow.postMessage({ action: 'HIGHLIGHT_SENTENCE', sentenceText }, '*');
      return;
    }
    
    wv.executeJavaScript(`
      ((rawSentence) => {
        if (!rawSentence) return;
        const rawTarget = String(rawSentence).trim();
        if (!rawTarget) return;

        // 1. Chuẩn hóa chuỗi tìm kiếm an toàn tuyệt đối (dùng charCode Set, không bao giờ bị lỗi escape cú pháp)
        function stripPunct(str, isCore) {
          const skipCodes = new Set([34, 39, 8220, 8221, 171, 187, 12302, 12303, 12300, 12301, 65288, 65289, 40, 41, 8212, 45, 32, 9, 13, 10]);
          const endSkipCodes = isCore
            ? new Set([...skipCodes, 46, 44, 33, 63, 58, 59, 8230])
            : skipCodes;
          let start = 0;
          while (start < str.length && skipCodes.has(str.charCodeAt(start))) start++;
          let end = str.length - 1;
          while (end >= start && endSkipCodes.has(str.charCodeAt(end))) end--;
          return str.substring(start, end + 1).trim();
        }
        const cleanTarget = stripPunct(rawTarget, false);
        const coreWord = stripPunct(rawTarget, true);
        if (!cleanTarget && !coreWord) return;

        function normalizeStr(str) {
          if (!str) return '';
          return str
            .replace(/[\\uff01-\\uff5e]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
            .replace(/[\\u3000\\u00a0\\t\\r\\n]+/g, ' ')
            .replace(/[“”«»『』]/g, '"')
            .replace(/[‘’]/g, "'")
            .trim();
        }

        // 2. Xác định vùng chứa nội dung truyện (tránh quét nhầm menu, header, ads, footer)
        const container = document.querySelector('#content, .content, .read-content, #read-content, #chapter-c, .chapter-c, .box-chap, #chapter-content, #contentbox, .txtnav, .showtxt, #chapter-detail, .muye-reader-content-novel, article, main') || document.body;

        function isWordBoundary(fullStr, startIdx, matchLen) {
          const prevChar = startIdx > 0 ? fullStr[startIdx - 1] : ' ';
          const nextChar = (startIdx + matchLen < fullStr.length) ? fullStr[startIdx + matchLen] : ' ';
          const isLetter = (c) => /[a-zA-Z0-9\\u00C0-\\u1EF9\\u4e00-\\u9fa5]/.test(c);
          return !isLetter(prevChar) && !isLetter(nextChar);
        }

        function findWordMatch(str, word) {
          if (!word || !str) return -1;
          let searchIdx = 0;
          while (searchIdx < str.length) {
            const pos = str.indexOf(word, searchIdx);
            if (pos === -1) break;
            if (isWordBoundary(str, pos, word.length)) {
              return pos;
            }
            searchIdx = pos + 1;
          }
          return -1;
        }

        // 3. Hàm tìm kiếm text node thông minh:
        function findTargetNode(root, targetText, fallbackWord) {
          const isShort = (targetText.length <= 8) || (fallbackWord && fallbackWord.length <= 8);

          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function(node) {
              const p = node.parentElement;
              if (!p) return NodeFilter.FILTER_REJECT;
              const tag = p.nodeName;
              if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'BUTTON' || tag === 'A') return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            }
          }, false);

          const allNodes = [];
          let n;
          while (n = walker.nextNode()) {
            if (n.nodeValue && n.nodeValue.trim().length > 0) {
              allNodes.push(n);
            }
          }

          if (allNodes.length === 0) return null;

          let startIdx = 0;
          if (window.__lastTTSHighlightedNode && document.contains(window.__lastTTSHighlightedNode)) {
            const lastIdx = allNodes.indexOf(window.__lastTTSHighlightedNode);
            if (lastIdx !== -1) {
              startIdx = lastIdx;
            }
          }

          function checkNode(node) {
            const val = node.nodeValue || '';
            
            // Ưu tiên 1: So khớp trực tiếp toàn bộ chuỗi đích cleanTarget
            const exactIdx = val.indexOf(targetText);
            if (exactIdx !== -1) {
              if (isShort && !isWordBoundary(val, exactIdx, targetText.length)) {
                const boundIdx = findWordMatch(val, targetText);
                if (boundIdx !== -1) {
                  return { node, startIdx: boundIdx, matchLen: targetText.length };
                }
              }
              return { node, startIdx: exactIdx, matchLen: targetText.length };
            }

            // Ưu tiên 2: Chuẩn hóa khoảng trắng, dấu Unicode Fullwidth, hoa thường
            const normVal = normalizeStr(val).toLowerCase();
            const normTarget = normalizeStr(targetText).toLowerCase();
            if (normTarget && normVal.includes(normTarget)) {
              const simpleIdx = val.toLowerCase().indexOf(targetText.toLowerCase());
              if (simpleIdx !== -1) {
                return { node, startIdx: simpleIdx, matchLen: targetText.length };
              }
              const normIdx = normVal.indexOf(normTarget);
              return { node, startIdx: Math.max(0, Math.min(normIdx, val.length - 1)), matchLen: Math.min(targetText.length, val.length) };
            }

            // Ưu tiên 3: So khớp từ lõi (coreWord)
            if (fallbackWord && fallbackWord !== targetText) {
              const coreIdx = val.indexOf(fallbackWord);
              if (coreIdx !== -1) {
                if (isShort && !isWordBoundary(val, coreIdx, fallbackWord.length)) {
                  const boundIdx = findWordMatch(val, fallbackWord);
                  if (boundIdx !== -1) {
                    return { node, startIdx: boundIdx, matchLen: fallbackWord.length };
                  }
                }
                return { node, startIdx: coreIdx, matchLen: fallbackWord.length };
              }
              const normFallback = normalizeStr(fallbackWord).toLowerCase();
              if (normFallback && normVal.includes(normFallback)) {
                const normIdx = normVal.indexOf(normFallback);
                return { node, startIdx: Math.max(0, Math.min(normIdx, val.length - 1)), matchLen: Math.min(fallbackWord.length, val.length) };
              }
            }

            return null;
          }

          // Quét tiếp từ vị trí node câu trước đó (tránh nhảy lùi ngược lên đầu trang)
          for (let i = startIdx; i < allNodes.length; i++) {
            const res = checkNode(allNodes[i]);
            if (res) return res;
          }

          // Fallback: nếu không tìm thấy phía dưới, quét lại từ đầu
          if (startIdx > 0) {
            for (let i = 0; i < startIdx; i++) {
              const res = checkNode(allNodes[i]);
              if (res) return res;
            }
          }

          // Fallback cho câu dài (> 15 ký tự): thử tiền tố 50% - 60% chiều dài
          if (!isShort && targetText.length > 15) {
            const prefix = targetText.substring(0, Math.floor(targetText.length * 0.55));
            const normPrefix = normalizeStr(prefix).toLowerCase();
            for (let i = startIdx; i < allNodes.length; i++) {
              const node = allNodes[i];
              const val = node.nodeValue || '';
              const idx = val.indexOf(prefix);
              if (idx !== -1) {
                return { node, startIdx: idx, matchLen: prefix.length };
              }
              const normVal = normalizeStr(val).toLowerCase();
              if (normVal.includes(normPrefix)) {
                return { node, startIdx: 0, matchLen: Math.min(prefix.length, val.length) };
              }
            }
            if (startIdx > 0) {
              for (let i = 0; i < startIdx; i++) {
                const node = allNodes[i];
                const val = node.nodeValue || '';
                const idx = val.indexOf(prefix);
                if (idx !== -1) {
                  return { node, startIdx: idx, matchLen: prefix.length };
                }
              }
            }
          }

          return null;
        }

        // Ưu tiên tìm trong container nội dung truyện
        let match = findTargetNode(container, cleanTarget, coreWord);
        // Fallback: nếu không tìm thấy trong container (ví dụ tiêu đề chương nằm ở h1/h2 ngoài container)
        if (!match && container !== document.body) {
          match = findTargetNode(document.body, cleanTarget, coreWord);
        }
        if (!match) return;

        const { node, startIdx: foundStart, matchLen } = match;
        window.__lastTTSHighlightedNode = node;

        if (typeof CSS !== 'undefined' && CSS.highlights) {
          try {
            if (!document.getElementById('tienhiep-highlight-css')) {
              const style = document.createElement('style');
              style.id = 'tienhiep-highlight-css';
              style.textContent = '::highlight(tienhiep-tts-highlight) { background-color: #f59e0b !important; color: #000000 !important; text-decoration: underline 2.5px solid #b45309 !important; border-radius: 3px; font-weight: 700 !important; } #tienhiep-active-highlight, span#tienhiep-active-highlight { background-color: #f59e0b !important; background: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 4px !important; padding: 2px 6px !important; box-shadow: 0 0 16px rgba(245, 158, 11, 0.95) !important; border-bottom: 2px solid #b45309 !important; display: inline !important; }';
              (document.head || document.documentElement).appendChild(style);
            }
            const range = new Range();
            const safeStart = Math.max(0, Math.min(foundStart, node.nodeValue.length));
            const safeEnd = Math.max(safeStart, Math.min(safeStart + matchLen, node.nodeValue.length));
            range.setStart(node, safeStart);
            range.setEnd(node, safeEnd);
            CSS.highlights.set('tienhiep-tts-highlight', new Highlight(range));
            
            const el = node.parentElement || node;
            if (el && typeof el.scrollIntoView === 'function') {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
          } catch(err) {}
        }

        const oldHighlight = document.getElementById('tienhiep-active-highlight');
        if (oldHighlight && oldHighlight.parentNode) {
          const parent = oldHighlight.parentNode;
          const textNode = document.createTextNode(oldHighlight.textContent);
          parent.replaceChild(textNode, oldHighlight);
          parent.normalize();
        }

        const parent = node.parentNode;
        if (parent) {
          const textVal = node.nodeValue || '';
          const safeStart = Math.max(0, Math.min(foundStart, textVal.length));
          const safeLen = Math.min(matchLen, textVal.length - safeStart);

          const beforeText = textVal.substring(0, safeStart);
          const matchedText = textVal.substring(safeStart, safeStart + safeLen);
          const afterText = textVal.substring(safeStart + safeLen);

          const fragment = document.createDocumentFragment();
          if (beforeText) fragment.appendChild(document.createTextNode(beforeText));

          const span = document.createElement('span');
          span.id = 'tienhiep-active-highlight';
          span.style.cssText = 'background-color: #f59e0b !important; background: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 4px !important; padding: 2px 6px !important; box-shadow: 0 0 16px rgba(245, 158, 11, 0.95) !important; display: inline !important; border-bottom: 2px solid #b45309 !important; transition: all 0.15s ease;';
          span.textContent = matchedText;
          fragment.appendChild(span);

          if (afterText) fragment.appendChild(document.createTextNode(afterText));
          parent.replaceChild(fragment, node);
          window.__lastTTSHighlightedNode = span;
          span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      })(${JSON.stringify(sentenceText)})
    `).catch(err => {});
  };

  // Khi chuyển chương hoặc sách mới, dọn sạch highlight cũ và đặt lại con trỏ tìm kiếm về đầu trang
  useEffect(() => {
    if (activeAudioObj?.tabId) {
      const wv = document.getElementById('global-wv-' + activeAudioObj.tabId);
      if (wv && typeof wv.executeJavaScript === 'function') {
        wv.executeJavaScript(`
          (() => {
            window.__lastTTSHighlightedNode = null;
            if (typeof CSS !== 'undefined' && CSS.highlights) CSS.highlights.delete('tienhiep-tts-highlight');
            var oldH = document.getElementById('tienhiep-active-highlight');
            if (oldH && oldH.parentNode) {
              oldH.parentNode.replaceChild(document.createTextNode(oldH.textContent), oldH);
              oldH.parentNode.normalize();
            }
          })();
        `).catch(() => {});
      }
    }
  }, [activeAudioObj?.tabId, activeAudioObj?.title, activeAudioObj?.chapterIdx]);

  // Lắng nghe sự kiện phát âm thanh để highlight và tự động cuộn trang trong webview
  useEffect(() => {
    const handleBoundary = (e) => {
      if (e.detail && e.detail.sentenceText && activeAudioObj?.tabId) {
        highlightSentenceInWebview(activeAudioObj.tabId, e.detail.sentenceText);
      }
    };
    window.addEventListener('global-tts-boundary', handleBoundary);
    return () => window.removeEventListener('global-tts-boundary', handleBoundary);
  }, [activeAudioObj?.tabId]);

  // Định kỳ cập nhật nội dung chương dịch mới chạy ngầm trong khi phát TTS
  useEffect(() => {
    if (!activeAudioObj || !activeAudioObj.tabId) return;
    const tabId = activeAudioObj.tabId;
    
    const interval = setInterval(async () => {
      const wv = document.getElementById('global-wv-' + tabId);
      if (!wv || typeof wv.executeJavaScript !== 'function') return;
      
      try {
        const result = await wv.executeJavaScript(`
          (window.__TienHiepHelpers ? window.__TienHiepHelpers.extractCleanChapterText() : { title: document.title, text: document.body.innerText })
        `);
        
        if (result && result.text && result.text.length > 50) {
          const currentIsVietnamese = !/[\u4e00-\u9fa5]/.test(result.text.slice(0, 300));
          const resultTitleIsVi = result.title && !/[\u4e00-\u9fa5]/.test(result.title);
          
          setActiveAudioObj(prev => {
            if (!prev || prev.tabId !== tabId) return prev;
            const prevHadChinese = /[\u4e00-\u9fa5]/.test((prev.description || '').slice(0, 300)) || /[\u4e00-\u9fa5]/.test(prev.title_vietphrase || '') || /[\u4e00-\u9fa5]/.test(prev.title || '');
            const isMissingText = !prev.description || prev.description.length < 50;

            // Cập nhật khi trước đó thiếu text HOẶC trước đó là tiếng Trung mà nay đã dịch sang tiếng Việt
            if (isMissingText || (prevHadChinese && (currentIsVietnamese || resultTitleIsVi))) {
              console.log("[Dynamic Text Sync] Cập nhật bản dịch tiếng Việt hoàn chỉnh cho AudioPlayer!", result.title);
              return {
                ...prev,
                title_vietphrase: result.title,
                title: result.title,
                description: result.text
              };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Dynamic Text Sync Error:", err);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [activeAudioObj?.tabId]);

  const handleGlobalNextChapter = () => {
    if (activeAudioObj?.playType === 'local') {
      const book = activeAudioObj.book;
      const nextIdx = activeAudioObj.chapterIdx + 1;
      if (book && book.chapters && nextIdx < book.chapters.length) {
        window.dispatchEvent(new CustomEvent('global-tts-chapter-changed', {
          detail: { bookId: book.id, chapterIdx: nextIdx }
        }));
        setActiveAudioObj({
          ...activeAudioObj,
          chapterIdx: nextIdx,
          title_vietphrase: book.chapters[nextIdx]?.title || '',
          title: book.chapters[nextIdx]?.title || '',
          description: book.chapters[nextIdx]?.content || '',
          startSentenceIdx: 0,
        });
      } else {
        alert("Đã đến chương cuối cùng!");
        setActiveAudioObj(null);
      }
    } else if (activeAudioObj?.playType === 'online') {
      const nextIdx = activeAudioObj.chapterIdx + 1;
      window.dispatchEvent(new CustomEvent('global-tts-chapter-changed', {
        detail: { bookId: activeAudioObj.book?.id, chapterIdx: nextIdx }
      }));
    } else {
      const targetId = activeAudioObj?.tabId || activeTabId;
      if (targetId) {
        autoAudioStatesRef.current[targetId] = true;
        handleTool('next', targetId);
      }
    }
  };

  const handleGlobalPrevChapter = () => {
    if (activeAudioObj?.playType === 'local') {
      const book = activeAudioObj.book;
      const prevIdx = (activeAudioObj.chapterIdx || 0) - 1;
      if (book && book.chapters && prevIdx >= 0) {
        window.dispatchEvent(new CustomEvent('global-tts-chapter-changed', {
          detail: { bookId: book.id, chapterIdx: prevIdx }
        }));
        setActiveAudioObj({
          ...activeAudioObj,
          chapterIdx: prevIdx,
          title_vietphrase: book.chapters[prevIdx]?.title || '',
          title: book.chapters[prevIdx]?.title || '',
          description: book.chapters[prevIdx]?.content || '',
          startSentenceIdx: 0,
        });
      }
    } else {
      // Với webview: chuyển về chương trước
      if (activeAudioObj?.tabId) {
        handleTool('prev', activeAudioObj.tabId);
      } else {
        handleTool('prev', activeTabId);
      }
    }
  };

  const isNativeApp = typeof window !== 'undefined' && (!!window.electron || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()));

  return (
    <BrowserContext.Provider value={{
      openInBrowser,
      tabs: isNativeApp ? tabs : [],
      activeTabId: isNativeApp ? activeTabId : null,
      closeTab,
      closeAll,
      isVisible: isNativeApp ? isVisible : false,
      setIsVisible: (val) => { if (isNativeApp) setIsVisible(val); },
      activeAudioObj,
      setActiveAudioObj,
      history,
      clearBrowserHistory: () => {
        setHistory([]);
        try { localStorage.removeItem('browserHistory'); } catch {}
      },
      deleteBrowserHistoryItem: (id) => {
        setHistory(prev => {
          const updated = prev.filter(item => item.id !== id);
          try { localStorage.setItem('browserHistory', JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
    }}>
      {children}
      {tabs.length > 0 && isNativeApp && isVisible && (
        <div
          className="fixed top-14 left-0 right-0 bottom-16 sm:bottom-0 z-[9990] bg-[#0b0b14] flex flex-col animate-fade-in shadow-2xl"
        >

          {/* ═══ TOP NAVIGATION BAR ═══ */}
          <div className="flex flex-col bg-gradient-to-b from-[#0f0c24] to-[#110e26] border-b border-indigo-500/20 shadow-xl">

            {/* Row 1: Chrome Mobile Header — Clean, Spacious & Non-crowded */}
            <div className="flex items-center gap-2 px-2.5 py-2">
              {/* Home */}
              <button
                onClick={() => setIsVisible(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-all shrink-0 active:scale-95"
                title="Về trang chủ"
              >
                <Home className="w-4 h-4" />
              </button>

              {/* Back button (Only shown when can go back, keeping header clean) */}
              {(() => {
                const activeTab = tabs.find(t => t.id === activeTabId);
                const canGoBack = isElectron ? true : (activeTab?.historyIndex > 0);
                if (!canGoBack) return null;
                return (
                  <button
                    onClick={handleGoBack}
                    className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-all shrink-0 active:scale-95"
                    title="Quay lại"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                );
              })()}

              {/* Chrome Omnibox / Search Capsule — Takes all remaining width (flex-1 min-w-0) */}
              <form
                className={`flex-1 min-w-0 flex items-center gap-2 rounded-full px-3 py-1.5 transition-all shadow-inner border ${
                  activeTabType === 'private'
                    ? 'bg-[#181528] border-purple-500/40 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/25'
                    : 'bg-[#1c1936] hover:bg-[#231f45] border-indigo-500/30 focus-within:border-indigo-400 focus-within:bg-[#231f45] focus-within:ring-2 focus-within:ring-indigo-500/25'
                }`}
                onSubmit={handleAddressSubmit}
              >
                {activeTabType === 'private' ? (
                  <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" title="Tab Ẩn danh" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}

                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onFocus={e => {
                    const activeTab = tabs.find(t => t.id === activeTabId);
                    if (activeTab && !urlInput) setUrlInput(activeTab.url || '');
                    e.target.select();
                  }}
                  placeholder={activeTabType === 'private' ? "Tìm kiếm ẩn danh hoặc nhập URL..." : "Tìm kiếm hoặc nhập URL..."}
                  className="flex-1 bg-transparent text-xs sm:text-[13px] font-medium text-white placeholder-slate-400 outline-none min-w-0 selection:bg-indigo-600 selection:text-white"
                />

                {/* AI / Audio status indicators inside Omnibox */}
                {autoStates[activeTabId] && (
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shrink-0" title="Đang dịch tự động" />
                )}
                {activeAudioObj && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" title="Đang phát giọng đọc TTS" />
                )}

                {/* Reload or Clear inside capsule */}
                {urlInput && urlInput !== (tabs.find(t => t.id === activeTabId)?.url || '') ? (
                  <button
                    type="button"
                    onClick={() => setUrlInput('')}
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                    title="Xóa chữ"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReload}
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                    title="Tải lại trang"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </form>

              {/* Desktop-only quick action extensions (hidden on mobile) */}
              <div className="hidden lg:flex items-center gap-1 shrink-0 bg-white/5 p-1 rounded-full border border-white/10 shadow-sm">
                <button
                  onClick={() => handleTool('translate', activeTabId)}
                  className={`px-2 py-1 rounded-full transition-all flex items-center gap-1 text-[11px] font-bold active:scale-95 ${
                    autoStates[activeTabId]
                      ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-[0_0_12px_rgba(217,70,239,0.7)]'
                      : 'bg-white/5 hover:bg-white/15 text-fuchsia-300 hover:text-white'
                  }`}
                  title="Dịch trang"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dịch</span>
                </button>
                <button
                  onClick={() => handleTool('audio', activeTabId)}
                  className={`px-2 py-1 rounded-full transition-all flex items-center gap-1 text-[11px] font-bold active:scale-95 ${
                    activeAudioObj
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.7)]'
                      : 'bg-white/5 hover:bg-white/15 text-amber-300 hover:text-white'
                  }`}
                  title="Nghe Audio TTS"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Đọc AI</span>
                </button>
                <button
                  onClick={() => handleTool('dark_mode', activeTabId)}
                  className={`p-1.5 rounded-full transition-all flex items-center justify-center active:scale-90 ${
                    darkModeActive ? 'bg-amber-500/25 text-amber-300' : 'text-slate-400 hover:text-amber-200'
                  }`}
                  title="Chế độ tối"
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleTool('clean_ads', activeTabId)}
                  className={`p-1.5 rounded-full transition-all flex items-center justify-center active:scale-90 ${
                    cleanAdsActive ? 'bg-emerald-500/25 text-emerald-300' : 'text-slate-400 hover:text-emerald-300'
                  }`}
                  title="Chặn quảng cáo"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsTranslationSettingsOpen(true)}
                  className="p-1.5 rounded-full text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/20 transition-all flex items-center justify-center active:scale-90"
                  title="Cài đặt công cụ"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tab Switcher Button (Chrome Mobile style badge) */}
              <button
                type="button"
                onClick={() => setIsTabSwitcherOpen(true)}
                className={`w-7 h-7 rounded-lg border text-[11px] font-bold transition-all shrink-0 active:scale-90 flex items-center justify-center shadow-sm ${
                  activeTabType === 'private'
                    ? 'border-purple-500/50 bg-purple-950/40 text-purple-200'
                    : 'border-white/20 bg-white/10 hover:bg-white/15 text-white'
                }`}
                title="Quản lý Tab (Kiểu Chrome Mobile)"
              >
                <span>{visibleTabs.length}</span>
              </button>

              {/* Chrome Mobile 3-Dots Menu Button */}
              <button
                type="button"
                onClick={() => setIsChromeMenuOpen(!isChromeMenuOpen)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-all shrink-0 active:scale-90"
                title="Tùy chọn khác (Kiểu Chrome Mobile)"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Row 2: Modern Mobile Tab Bar with Auto-Scroll & Easy Touch Targets */}
            <div className={`relative flex items-center px-2 py-1.5 border-t transition-colors ${
              activeTabType === 'private' ? 'border-purple-500/20 bg-[#16141e]' : 'border-white/5 bg-[#121216]'
            }`}>
              {/* Vùng cuộn các tab */}
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth min-w-0 pr-1.5">
                {visibleTabs.map(tab => {
                  const isActive = activeTabId === tab.id;
                  const isAudioPlaying = activeAudioObj && activeAudioObj.tabId === tab.id;
                  return (
                    <div
                      key={tab.id}
                      ref={el => { if (el) tabElementsRef.current[tab.id] = el; }}
                      onClick={() => {
                        setActiveTabId(tab.id);
                        setUrlInput(tab.url === 'about:newtab' ? '' : (tab.url || ''));
                      }}
                      className={`group relative flex items-center gap-2 px-3.5 h-8.5 min-w-[105px] max-w-[200px] rounded-xl cursor-pointer transition-all duration-200 border shrink-0 select-none ${
                        isActive
                          ? tab.isPrivate
                            ? 'bg-gradient-to-r from-purple-600/35 to-pink-600/25 text-purple-100 border-purple-400/60 shadow-[0_2px_12px_rgba(168,85,247,0.3)]'
                            : 'bg-gradient-to-r from-indigo-600/35 to-purple-600/25 text-indigo-100 border-indigo-400/50 shadow-[0_2px_12px_rgba(99,102,241,0.25)]'
                          : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 border-white/5'
                      }`}
                    >
                      <span className="text-xs shrink-0">
                        {isAudioPlaying ? '🔊' : tab.isPrivate ? '🕶️' : tab.url === 'about:newtab' ? '✨' : '📖'}
                      </span>
                      <span className="truncate text-[11.5px] font-semibold flex-1 tracking-tight">
                        {tab.url === 'about:newtab' ? (tab.isPrivate ? 'Tab ẩn danh' : 'Tab mới') : (tab.title || tab.url)}
                      </span>
                      <button
                        type="button"
                        onClick={e => closeTab(tab.id, e)}
                        title="Đóng tab này"
                        className="w-5.5 h-5.5 rounded-full hover:bg-white/20 active:scale-90 text-slate-400 hover:text-white transition-all flex items-center justify-center shrink-0 -mr-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Nhóm nút tiện ích ghim cố định góc phải */}
              <div className="flex items-center gap-1.5 shrink-0 pl-1.5 border-l border-white/10">
                {/* Nút thêm tab mới */}
                <button
                  onClick={() => openNewTab(activeTabType === 'private')}
                  className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/10 transition-all flex items-center justify-center shrink-0 active:scale-95 shadow-sm"
                  title={activeTabType === 'private' ? 'Mở tab ẩn danh mới' : 'Mở tab mới'}
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Nút Cấu Hình & Quản Lý Tab */}
                <button
                  onClick={() => setIsTabConfigOpen(true)}
                  className="w-8 h-8 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all flex items-center justify-center shrink-0 active:scale-95 shadow-sm"
                  title="Cấu hình & Quản lý Tab"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ═══ WEBVIEW CONTENT ═══ */}
          <div className="flex-1 relative bg-[#121214] overflow-hidden">
            {tabs.map(tab => {
              const isTabActive = activeTabId === tab.id;
              const isTransitioning = !!tabTransitioning[tab.id];
              const rawUrl = tab.url || tab.initialUrl;
              const isNewTab = rawUrl === 'about:newtab' || !rawUrl;

              if (isNewTab) {
                return (
                  <div
                    key={tab.id}
                    className={isTabActive ? 'w-full h-full relative' : 'w-0 h-0 invisible absolute'}
                  >
                    <ChromeMobileNewTab
                      isPrivate={tab.isPrivate}
                      onNavigate={(url) => navigateTabToUrl(tab.id, url)}
                      onTogglePrivate={() => {
                        const targetMode = tab.isPrivate ? 'normal' : 'private';
                        setActiveTabType(targetMode);
                        openNewTab(targetMode === 'private');
                      }}
                    />
                  </div>
                );
              }

              if (isElectron) {
                return (
                  <div
                    key={tab.id}
                    className={isTabActive ? 'w-full h-full relative bg-[#121214]' : 'w-0 h-0 invisible absolute'}
                  >
                    <webview
                      id={`global-wv-${tab.id}`}
                      src={tab.initialUrl || tab.url}
                      allowpopups="true"
                      className="w-full h-full border-none bg-[#121214]"
                      style={{ backgroundColor: '#121214' }}
                    />

                    {/* ═══ TẤM CHẮN CHỐNG CHỚP TRẮNG (ANTI-FLICKER TRANSITION SHIELD) ═══ */}
                    <div
                      className={`absolute inset-0 bg-[#121214] z-[25] flex flex-col items-center justify-center transition-opacity duration-200 pointer-events-none ${
                        isTransitioning ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2.5">
                        <div className="w-7 h-7 border-2 border-indigo-500/80 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[11px] text-slate-400 font-semibold tracking-wide">Đang chuyển trang...</span>
                      </div>
                    </div>
                  </div>
                );
              } else {
                const isProxied = shouldUseProxy(rawUrl);

                if (isCapacitor && isProxied) {
                  // On Capacitor: use fetch+srcdoc to avoid WebView intercepting http://10.0.2.2 requests
                  const proxyState = tabProxyContent[tab.id];
                  const srcdocHtml = proxyState?.html || '';
                  const isLoading = proxyState?.loading;
                  const proxyError = proxyState?.error;

                  // Trigger initial fetch if no content yet
                  if (!proxyState && rawUrl) {
                    fetchProxyContent(tab.id, rawUrl);
                  }

                  return (
                    <div
                      key={tab.id}
                      className={isTabActive ? 'w-full h-full relative bg-[#121214]' : 'w-0 h-0 invisible absolute'}
                    >
                      {/* Khi F5 và đã có sẵn nội dung: hiện thanh tiến trình mỏng phía trên cùng, không che mất nội dung */}
                      {isLoading && srcdocHtml && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-30 animate-pulse shadow-sm" />
                      )}

                      {/* Khi tải trang mới chưa có nội dung: hiện màn hình loading Dark Mode êm dịu */}
                      {isLoading && !srcdocHtml && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#121214] z-20">
                          <div className="text-center text-slate-200 px-6 py-5 bg-[#1a1a22] rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col items-center max-w-xs mx-auto animate-fade-in">
                            <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                            <p className="text-sm font-semibold text-slate-100">Đang tải trang...</p>
                            <p className="text-xs text-slate-400 mt-1">Đang tối ưu giao diện & chống quảng cáo</p>
                          </div>
                        </div>
                      )}

                      {proxyError && !srcdocHtml && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#121214] z-20 p-6">
                          <div className="text-center bg-[#1a1a22] p-6 rounded-2xl shadow-2xl border border-slate-700/50 max-w-sm w-full mx-auto">
                            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <p className="font-semibold text-slate-100 text-base mb-1">Không thể tải trang</p>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">{proxyError}</p>
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => fetchProxyContent(tab.id, rawUrl, true)}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 mx-auto"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Thử lại ngay
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <iframe
                        key={tab.id}
                        id={`global-wv-${tab.id}`}
                        className="w-full h-full border-none bg-[#121214]"
                        style={{ backgroundColor: '#121214', colorScheme: 'dark' }}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        allowFullScreen
                        onLoad={(e) => ensureIframeRendered(tab.id, e.target)}
                      />
                    </div>
                  );
                } else {
                  // Direct URL — non-novel sites (Google, YouTube, etc.) or non-Capacitor
                  const proxyHost = isCapacitor ? 'http://10.0.2.2:5051' : '';
                  const iframeSrc = isProxied ? getProxyUrl(rawUrl, proxyHost) : rawUrl;
                  return (
                    <iframe
                      key={tab.id}
                      id={`global-wv-${tab.id}`}
                      src={iframeSrc}
                      className={isTabActive ? 'w-full h-full border-none bg-[#121214]' : 'w-0 h-0 invisible absolute'}
                      sandbox={isProxied
                        ? 'allow-scripts allow-same-origin allow-forms allow-presentation'
                        : 'allow-scripts allow-same-origin allow-forms allow-top-navigation allow-top-navigation-by-user-activation allow-presentation'
                      }
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                      onLoad={(e) => handleIframeLoaded(tab.id, e.target)}
                    />
                  );
                }
              }
            })}
          </div>

          {/* FLOATING READER QUICK TOOLS (CHUYỂN CHƯƠNG & CHỈ ĐỊNH) */}
          {!activeAudioObj && (
            <ReaderQuickTools
              onToolAction={(action, payload) => handleTool(action, activeTabId, payload)}
            />
          )}

          {/* CHROME MOBILE TAB SWITCHER MODAL */}
          <ChromeMobileTabSwitcher
            isOpen={isTabSwitcherOpen}
            onClose={() => setIsTabSwitcherOpen(false)}
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={(id) => {
              setActiveTabId(id);
              const targetTab = tabs.find(t => t.id === id);
              if (targetTab) {
                setActiveTabType(targetTab.isPrivate ? 'private' : 'normal');
              }
            }}
            onCloseTab={(id, e) => closeTab(id, e)}
            onCloseAllTabs={closeAllTabs}
            onNewTab={(isPrivate) => {
              openNewTab(isPrivate);
              setIsTabSwitcherOpen(false);
            }}
            activeTabType={activeTabType}
            onToggleTabType={(type) => setActiveTabType(type)}
          />

          {/* CHROME MOBILE 3-DOTS MENU */}
          {(() => {
            const activeTab = tabs.find(t => t.id === activeTabId);
            return (
              <ChromeMobileMenu
                isOpen={isChromeMenuOpen}
                onClose={() => setIsChromeMenuOpen(false)}
                onNewTab={(isPriv) => openNewTab(isPriv)}
                isPrivate={activeTabType === 'private'}
                onTogglePrivate={() => {
                  const nextType = activeTabType === 'normal' ? 'private' : 'normal';
                  setActiveTabType(nextType);
                  openNewTab(nextType === 'private');
                }}
                onReload={handleReload}
                onOpenHistory={() => {
                  setIsVisible(false);
                  window.location.hash = '#/history';
                }}
                isDesktopMode={isDesktopMode}
                onToggleDesktopMode={() => {
                  setIsDesktopMode(!isDesktopMode);
                  handleReload();
                }}
                onOpenTabConfig={() => setIsTabConfigOpen(true)}
                isAutoTranslate={autoStates[activeTabId]}
                onToggleTranslate={() => handleTool('translate', activeTabId)}
                isAudioPlaying={!!activeAudioObj}
                onToggleAudio={() => handleTool('audio', activeTabId)}
                cleanAdsActive={cleanAdsActive}
                onToggleCleanAds={() => setCleanAdsActive(!cleanAdsActive)}
                currentUrl={activeTab?.url || ''}
                currentTitle={activeTab?.title || ''}
                onOpenExternal={(url) => {
                  if (isCapacitor) {
                    openExternalNative(url);
                  } else {
                    window.open(url, '_blank');
                  }
                }}
                isBookmarked={webBookmarks.some(b => b.url === (activeTab?.url || ''))}
                onToggleBookmark={() => toggleBookmark(activeTab?.url, activeTab?.title)}
                onOpenBookmarks={() => setIsBookmarksModalOpen(true)}
                canGoBack={isElectron ? true : (activeTab?.historyIndex > 0)}
                onGoBack={handleGoBack}
                canGoForward={isElectron ? true : (activeTab?.history && activeTab.historyIndex < activeTab.history.length - 1)}
                onGoForward={handleGoForward}
              />
            );
          })()}

          {/* CHROME MOBILE BOOKMARKS MODAL */}
          {(() => {
            const activeTab = tabs.find(t => t.id === activeTabId);
            return (
              <ChromeMobileBookmarksModal
                isOpen={isBookmarksModalOpen}
                onClose={() => setIsBookmarksModalOpen(false)}
                bookmarks={webBookmarks}
                onSelectBookmark={(url) => {
                  if (activeTabId) {
                    navigateTabToUrl(activeTabId, url);
                  } else {
                    openInBrowser(url);
                  }
                }}
                onDeleteBookmark={deleteBookmark}
                onAddCurrentPage={() => toggleBookmark(activeTab?.url, activeTab?.title)}
                currentUrl={activeTab?.url || ''}
                currentTitle={activeTab?.title || ''}
              />
            );
          })()}

          {/* TRANSLATION SETTINGS MODAL */}
          <TranslationSettingsModal
            isOpen={isTranslationSettingsOpen}
            onClose={() => setIsTranslationSettingsOpen(false)}
            onToolAction={(action) => handleTool(action, activeTabId)}
            isAutoTranslate={autoStates[activeTabId]}
            pinnedTools={pinnedTools}
            onTogglePin={togglePin}
            history={history}
            onNavigate={(url) => {
              if (activeTabId) {
                setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url, initialUrl: url, title: 'Đang tải...' } : t));
                addToHistory(url);
              } else {
                openInBrowser(url);
              }
              setIsTranslationSettingsOpen(false);
            }}
          />

          {/* TAB CONFIGURATION & MANAGER MODAL */}
          {isTabConfigOpen && (
            <div className="fixed inset-0 z-[200050] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200" onClick={() => setIsTabConfigOpen(false)}>
              <div 
                className="w-full sm:max-w-md bg-[#18181b] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden pb-6 sm:pb-0 safe-bottom"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
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

                {/* Quick actions */}
                <div className="p-4 space-y-2.5 border-b border-white/10 bg-white/[0.01]">
                  <button
                    onClick={() => {
                      translateAllTabTitles();
                      setIsTabConfigOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all text-xs font-medium group"
                  >
                    <span className="flex items-center gap-2.5">
                      <Languages className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      Dịch tất cả tiêu đề tab sang Tiếng Việt
                    </span>
                    <span className="text-[10px] bg-indigo-500/30 px-2 py-0.5 rounded-full text-indigo-200">Tự động</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        openNewTab(false);
                        setIsTabConfigOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-medium border border-white/10 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm tab thường
                    </button>
                    <button
                      onClick={() => {
                        openNewTab(true);
                        setIsTabConfigOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/20 transition-all"
                    >
                      <Shield className="w-3.5 h-3.5" /> Thêm tab ẩn danh
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        closeOtherTabs(activeTabId);
                        setIsTabConfigOpen(false);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 text-xs font-medium border border-white/5 hover:border-amber-500/30 transition-all"
                    >
                      Đóng các tab khác
                    </button>
                    <button
                      onClick={() => {
                        closeAll();
                        setIsTabConfigOpen(false);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Đóng tất cả tab
                    </button>
                  </div>
                </div>

                {/* List of open tabs */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1.5 max-h-[300px]">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 px-1">Danh sách thẻ đang mở</p>
                  {tabs.map((t) => {
                    const isTabActive = t.id === activeTabId;
                    return (
                      <div
                        key={t.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isTabActive
                            ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-sm'
                            : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div 
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer pr-2"
                          onClick={() => {
                            setActiveTabId(t.id);
                            setUrlInput(t.url === 'about:newtab' ? '' : (t.url || ''));
                            setIsTabConfigOpen(false);
                          }}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isTabActive ? 'bg-indigo-500/30 text-indigo-400' : 'bg-white/10 text-slate-400'}`}>
                            {t.isPrivate ? <Shield className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate leading-tight">
                              {t.title || 'Tab mới'}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {t.url || 'about:newtab'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(t.id);
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center shrink-0 transition-colors"
                          title="Đóng tab này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* GLOBAL PERSISTENT AUDIO PLAYER */}
      {activeAudioObj && (
        <AudioPlayer 
          book={activeAudioObj} 
          onClose={() => {
            setActiveAudioObj(null);
            if (activeAudioObj.tabId) {
              autoAudioStatesRef.current[activeAudioObj.tabId] = false;
              const wv = document.getElementById('global-wv-' + activeAudioObj.tabId);
              if (wv) {
                const isIframe = wv.tagName.toLowerCase() === 'iframe';
                if (isIframe) {
                  wv.contentWindow.postMessage({ action: 'SET_TTS_PLAYING', playing: false }, '*');
                } else {
                  wv.executeJavaScript(`window.isTtsPlaying = false;`);
                }
              }
            }
          }} 
          onNextChapter={handleGlobalNextChapter}
          onPrevChapter={handleGlobalPrevChapter}
        />
      )}
      {/* TOAST THÔNG BÁO HỆ THỐNG / CHỈ ĐỊNH VÙNG ĐỌC */}
      {toastInfo && (
        <div 
          className="fixed top-14 left-1/2 -translate-x-1/2 z-[200060] max-w-[92vw] px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
          style={{
            background: toastInfo.type === 'warning' ? 'linear-gradient(135deg, rgba(30, 20, 10, 0.95), rgba(45, 25, 10, 0.92))' : 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 27, 75, 0.94))',
            borderColor: toastInfo.type === 'warning' ? '#f59e0b' : '#6366f1',
            color: '#ffffff',
            boxShadow: toastInfo.type === 'warning' ? '0 10px 30px rgba(245, 158, 11, 0.35)' : '0 10px 30px rgba(99, 102, 241, 0.4)'
          }}
        >
          <span className="text-base shrink-0">{toastInfo.type === 'warning' ? '⚠️' : '📌'}</span>
          <span className="text-xs font-semibold leading-relaxed flex-1">{toastInfo.message}</span>
          <button 
            onClick={() => setToastInfo(null)}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded-md ml-1"
          >
            ✕
          </button>
        </div>
      )}
    </BrowserContext.Provider>
  );
};
