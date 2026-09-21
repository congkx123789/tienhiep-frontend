import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, RotateCcw, Settings2, Home, Search, ArrowRight, Globe, Sparkles, Volume2, Moon, SkipForward, SkipBack, Bookmark, Plus, Target, ShieldCheck, Shield } from 'lucide-react';
import { isElectron } from '../utils/electron';
import { Capacitor } from '@capacitor/core';

const isCapacitor = Capacitor.isNativePlatform();
import api from '../services/api';
import AudioPlayer from '../components/AudioPlayer';
import TranslationSettingsModal from '../components/TranslationSettingsModal';
import ReaderQuickTools from '../components/ReaderQuickTools';
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

// Unified robust translate executor with local engine first, cloud fallback, and 15s timeout
async function executeTranslate(texts, mode = 'vietphrase', userVipKey = 'VIP2026') {
  const candidateServers = [];
  if (typeof window !== 'undefined' && (window.electron || isCapacitor)) {
    candidateServers.push(isCapacitor ? 'http://10.0.2.2:5051' : 'http://127.0.0.1:5051');
  } else {
    candidateServers.push('http://127.0.0.1:5051');
  }

  // Check stored user settings
  try {
    const stored = localStorage.getItem('translationSettings');
    if (stored) {
      const s = JSON.parse(stored);
      if (s.serverUrl && !s.serverUrl.includes('tienhiep.lyvuha.com') && !candidateServers.includes(s.serverUrl)) {
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

export const BrowserProvider = ({ children }) => {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [activeAudioObj, setActiveAudioObj] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  // Map of tabId -> { html: string, loading: bool, error: string } for proxy-fetched content
  const [tabProxyContent, setTabProxyContent] = useState({});
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

  useEffect(() => {
    if (isVisible && tabs.length === 0) {
      openInBrowser('https://www.google.com/');
    }
  }, [isVisible, tabs.length]);

  const addToHistory = (url, title = '') => {
    if (!url || url === 'about:blank' || url.includes('iframe_proxy')) return;
    setHistory(prev => {
      // Bỏ trùng lặp gần nhất
      if (prev.length > 0 && prev[0].url === url) return prev;
      const updated = [{ url, title: title || url, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 100);
      localStorage.setItem('browserHistory', JSON.stringify(updated));
      return updated;
    });
  };
  
  const autoStatesRef = React.useRef({});
  const autoAudioStatesRef = React.useRef({});
  const scriptContentRef = React.useRef('');

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
    if (isCapacitor) return true; // Proxy everything on mobile to bypass CSP / X-Frame-Options inside iframe
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
    // Only proxy novel sites — everything else navigates directly
    if (!shouldUseProxy(url)) return url;
    return `${host}/api/iframe_proxy?url=${encodeURIComponent(url)}`;
  };

  const openInBrowser = (url) => {
    if (!url) return;
    // On Web (not running in Electron or native Capacitor app), open directly in a new browser tab
    if (!window.electron && !isCapacitor) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    const newId = Date.now().toString();
    setTabs(prev => [...prev, {
      id: newId,
      url,
      initialUrl: url,
      title: 'Đang tải...',
      history: [url],
      historyIndex: 0
    }]);
    setActiveTabId(newId);
    setIsVisible(true);
    addToHistory(url);
    // On Capacitor, fetch proxy content for novel sites via fetch() instead of iframe src
    if (isCapacitor && shouldUseProxy(url)) {
      // Use setTimeout to allow state update before fetch (fetchProxyContent needs tabId registered)
      setTimeout(() => fetchProxyContent(newId, url), 100);
    }
  };

  const navigateTabToUrl = (tabId, targetUrl) => {
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
    if (isCapacitor && shouldUseProxy(targetUrl)) {
      fetchProxyContent(tabId, targetUrl);
    }
  };

  // Fetch proxy HTML content for Capacitor (avoids WebView intercepting http://10.0.2.2:5051)
  const fetchProxyContent = React.useCallback(async (tabId, url) => {
    if (!url || !shouldUseProxy(url)) return;
    const backendUrl = `http://10.0.2.2:5051/api/iframe_proxy?url=${encodeURIComponent(url)}`;
    setTabProxyContent(prev => ({ ...prev, [tabId]: { html: null, loading: true, error: null } }));
    try {
      const res = await fetch(backendUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      setTabProxyContent(prev => ({ ...prev, [tabId]: { html, loading: false, error: null } }));
      // Update tab title from HTML
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, title: titleMatch[1].trim() } : t));
      }
    } catch (err) {
      setTabProxyContent(prev => ({ ...prev, [tabId]: { html: null, loading: false, error: err.message } }));
    }
  }, []);  // eslint-disable-line

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
      // Re-fetch proxy content
      fetchProxyContent(activeTabId, currentUrl);
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
    if (e) e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    } else if (newTabs.length === 0) {
      setActiveTabId(null);
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

      if (!tabId) return;
      const iframe = document.getElementById('global-wv-' + tabId);
      if (!iframe) return;

      if (data.type === 'IFRAME_READY' || data.type === 'PAGE_LOADED') {
        let realUrl = data.url;
        if (realUrl === 'about:srcdoc') {
          // Keep current tab URL to prevent overwriting with about:srcdoc
          const existingTab = tabs.find(t => t.id === tabId);
          realUrl = existingTab ? existingTab.url : null;
        }
        if (realUrl && realUrl.includes('iframe_proxy')) {
          try {
            const urlObj = new URL(realUrl);
            const decodedUrl = urlObj.searchParams.get('url');
            if (decodedUrl) realUrl = decodedUrl;
          } catch (e) {}
        }

        // Update tab URL and title
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, url: realUrl || t.url, title: data.title || t.title || 'Đã tải' } : t));
        if (realUrl && realUrl !== 'about:srcdoc') addToHistory(realUrl);
        
        // Inject translation script to iframe
        const script = scriptContentRef.current;
        if (script && iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ action: 'INJECT_SCRIPT', script }, '*');
        }

        // Auto translate trigger if enabled
        const isEnabled = autoStatesRef.current[tabId] || false;
        if (isEnabled && iframe && iframe.contentWindow) {
          setTimeout(() => {
            iframe.contentWindow.postMessage({ action: 'TOGGLE_AUTO_TRANSLATE', enabled: true }, '*');
          }, 100);
        }
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
          iframe.contentWindow.postMessage({ action: 'TRANSLATE_RES', id: reqId, translations }, '*');
        } catch (err) {
          console.error("Iframe IPC Translate Error:", err);
          const fallbackId = data.id !== undefined ? data.id : (data.payload ? data.payload.id : null);
          iframe.contentWindow.postMessage({ action: 'TRANSLATE_RES', id: fallbackId, translations: [] }, '*');
        }
      }

      if (data.type === 'TRANSLATION_COMPLETE') {
        if (autoAudioStatesRef.current[tabId]) {
          setTimeout(() => {
            if (autoAudioStatesRef.current[tabId]) {
              // Trigger activeAudioObj
              setActiveAudioObj({ 
                tabId: tabId, 
                title_vietphrase: data.title || 'Chương truyện', 
                title: data.title || 'Chương truyện', 
                description: data.text || '', 
                isChapter: true,
                onBoundary: (charIdx, sentenceText) => {
                  iframe.contentWindow.postMessage({ action: 'TTS_BOUNDARY', charIdx, sentenceText }, '*');
                }
              });
              iframe.contentWindow.postMessage({ action: 'SET_TTS_PLAYING', playing: true }, '*');
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

      if (data.type === 'AUDIO_TEXT_RES') {
        if (data.text && data.text.length > 50) {
          setActiveAudioObj({ 
            title_vietphrase: data.title || 'Chương truyện', 
            author_hanviet: "Trang Web Nhúng", 
            description: data.text, 
            isChapter: true,
            tabId: tabId,
            onBoundary: (charIdx, sentenceText) => {
              iframe.contentWindow.postMessage({ action: 'TTS_BOUNDARY', charIdx, sentenceText }, '*');
            }
          });
          iframe.contentWindow.postMessage({ action: 'SET_TTS_PLAYING', playing: true }, '*');
        } else {
          autoAudioStatesRef.current[tabId] = false;
          alert("Không đủ chữ để đọc hoặc trang web chưa được dịch xong. Hãy đợi một chút và thử lại.");
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
          setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, title: e.title } : t));
          setHistory(prev => {
            const updated = prev.map(item => item.url === wv.src ? { ...item, title: e.title } : item);
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
        
        if (isIframe) {
          const script = scriptContentRef.current || createTranslateScript(false);
          if (script) {
            wv.contentWindow.postMessage({ action: 'INJECT_SCRIPT', script }, '*');
          }
          setTimeout(() => {
            wv.contentWindow.postMessage({ action: 'TOGGLE_AUTO_TRANSLATE', enabled: newState }, '*');
          }, 100);
        } else {
          if (newState) {
            await translateWebviewPage(wv);
          } else {
            await revertWebviewPage(wv);
          }
        }
      }

      else if (action === 'audio') {
        autoAudioStatesRef.current[tabId] = true;
        if (isIframe) {
          wv.contentWindow.postMessage({ action: 'EXTRACT_TEXT' }, '*');
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
          wv.contentWindow.postMessage({ action: 'TRIGGER_NEXT' }, '*');
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

        if (!isIframe) {
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
          wv.contentWindow.postMessage({ action: 'TRIGGER_PREV' }, '*');
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
          wv.contentWindow.postMessage({ action: 'TEACH_NEXT' }, '*');
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
        if (!isIframe) {
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
        if (!isIframe) {
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
        if (!isIframe) {
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
        if (!isIframe) {
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
        if (!isIframe) {
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
      if (!wv) return;
      
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
      setActiveAudioObj
    }}>
      {children}
      {tabs.length > 0 && isNativeApp && isVisible && (
        <div
          className="fixed top-14 left-0 right-0 bottom-16 sm:bottom-0 z-[9990] bg-[#0b0b14] flex flex-col animate-fade-in shadow-2xl"
        >

          {/* ═══ TOP NAVIGATION BAR ═══ */}
          <div className="flex flex-col bg-gradient-to-b from-[#0f0c24] to-[#110e26] border-b border-indigo-500/20 shadow-xl">

            {/* Row 1: Safari Header - Nav controls + Search Capsule with Quick Actions + Close */}
            <div className="flex items-center gap-1.5 px-2.5 py-2">
              {/* Home */}
              <button
                onClick={() => setIsVisible(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all shrink-0 active:scale-95"
                title="Về trang chủ"
              >
                <Home className="w-4 h-4" />
              </button>

              {/* Back / Forward */}
              {(() => {
                const activeTab = tabs.find(t => t.id === activeTabId);
                const canGoBack = isElectron ? true : (activeTab?.historyIndex > 0);
                const canGoForward = isElectron ? true : (activeTab?.history && activeTab.historyIndex < activeTab.history.length - 1);
                
                return (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={handleGoBack}
                      disabled={!canGoBack}
                      className={`p-1.5 rounded-full transition-all ${canGoBack ? 'hover:bg-white/10 text-slate-300 hover:text-white active:scale-95' : 'text-slate-600 cursor-not-allowed opacity-30'}`}
                      title="Quay lại"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleGoForward}
                      disabled={!canGoForward}
                      className={`p-1.5 rounded-full transition-all ${canGoForward ? 'hover:bg-white/10 text-slate-300 hover:text-white active:scale-95' : 'text-slate-600 cursor-not-allowed opacity-30'}`}
                      title="Tiến tới"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}

              {/* Safari Integrated Search Capsule - Tối ưu độ tương phản cao cho chế độ tối */}
              <form
                className="flex-1 min-w-0 flex items-center gap-2 bg-[#1c1936] hover:bg-[#231f45] border border-indigo-500/40 focus-within:border-indigo-400 focus-within:bg-[#231f45] focus-within:ring-2 focus-within:ring-indigo-500/30 rounded-full px-3 py-1.5 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                onSubmit={handleAddressSubmit}
              >
                <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onFocus={e => {
                    const activeTab = tabs.find(t => t.id === activeTabId);
                    if (activeTab && !urlInput) setUrlInput(activeTab.url || '');
                    e.target.select();
                  }}
                  placeholder="Nhập địa chỉ web hoặc tìm kiếm..."
                  className="flex-1 bg-transparent text-[13px] font-medium text-white placeholder-slate-400 outline-none min-w-0 selection:bg-indigo-600 selection:text-white"
                />
                
                {/* Reload inside capsule */}
                <button
                  type="button"
                  onClick={handleReload}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  title="Tải lại"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </form>

              {/* Quick Action Group on Header (Safari Extensions style) */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white/10 p-1 rounded-full border border-white/10 shadow-sm">
                {/* ═══ NHÓM 1: AI DỊCH THUẬT & ĐỌC GIỌNG NÓI ═══ */}
                <div className="flex items-center gap-1">
                  {/* Dịch / Auto Dịch */}
                  <button
                    onClick={() => handleTool('translate', activeTabId)}
                    className={`px-2 py-1 rounded-full transition-all flex items-center gap-1 text-[11px] font-bold active:scale-95 ${
                      autoStates[activeTabId]
                        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-[0_0_12px_rgba(217,70,239,0.7)]'
                        : 'bg-white/5 hover:bg-white/15 text-fuchsia-300 hover:text-white'
                    }`}
                    title={autoStates[activeTabId] ? 'Đang Auto Dịch (Bấm để tắt)' : 'Dịch trang / Bật Auto Dịch'}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
                    <span className="hidden md:inline">{autoStates[activeTabId] ? 'Đang Dịch' : 'Dịch'}</span>
                  </button>

                  {/* Nghe Audio TTS */}
                  <button
                    onClick={() => handleTool('audio', activeTabId)}
                    className={`px-2 py-1 rounded-full transition-all flex items-center gap-1 text-[11px] font-bold active:scale-95 ${
                      activeAudioObj
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.7)]'
                        : 'bg-white/5 hover:bg-white/15 text-amber-300 hover:text-white'
                    }`}
                    title="Nghe đọc giọng AI (TTS)"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden md:inline">{activeAudioObj ? 'Đang Đọc' : 'Đọc AI'}</span>
                  </button>
                </div>

                {/* Vạch phân chia */}
                <div className="h-4 w-px bg-white/15 mx-0.5 shrink-0" />

                {/* ═══ NHÓM 2: BÓNG TỐI, CHẶN QUẢNG CÁO & CÀI ĐẶT TOÀN CỤC ═══ */}
                <div className="flex items-center gap-1">
                  {/* Bật/Tắt chế độ tối (Bóng tối) */}
                  <button
                    onClick={() => handleTool('dark_mode', activeTabId)}
                    className={`p-1.5 rounded-full transition-all flex items-center justify-center active:scale-90 ${
                      darkModeActive
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : 'text-slate-400 hover:text-amber-200 hover:bg-white/10'
                    }`}
                    title={darkModeActive ? 'Chế độ tối: Đang BẬT (Bấm để chuyển chế độ sáng)' : 'Bật chế độ tối (Bóng tối)'}
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>

                  {/* Cố định chức năng Tắt Quảng Cáo tự hiện linh tinh */}
                  <button
                    onClick={() => handleTool('clean_ads', activeTabId)}
                    className={`p-1.5 rounded-full transition-all flex items-center justify-center active:scale-90 ${
                      cleanAdsActive
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'text-slate-400 hover:text-emerald-300 hover:bg-white/10'
                    }`}
                    title={cleanAdsActive ? 'Chặn quảng cáo & Pop-up tự hiện: Đang BẬT (Bấm để tắt)' : 'Bật chặn quảng cáo & Pop-up tự hiện'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>

                  {/* Cài đặt công cụ Tools */}
                  <button
                    onClick={() => setIsTranslationSettingsOpen(true)}
                    className="p-1.5 rounded-full text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/20 transition-all flex items-center justify-center active:scale-90"
                    title="Bảng điều khiển & Cài đặt công cụ"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Close Browser */}
              <button
                onClick={() => setIsVisible(false)}
                className="p-1.5 rounded-full hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all shrink-0 active:scale-95"
                title="Đóng trình duyệt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Row 2: Safari Tab Bar (Pill tabs + Add Tab) */}
            <div className="flex items-center gap-1.5 px-2.5 pb-2 border-t border-white/5 pt-1 overflow-x-auto no-scrollbar">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  onClick={() => {
                    setActiveTabId(tab.id);
                    setUrlInput(tab.url || '');
                  }}
                  className={`group relative flex items-center gap-1.5 px-3 py-1 min-w-[90px] max-w-[160px] rounded-full cursor-pointer transition-all duration-200 border shrink-0 ${
                    activeTabId === tab.id
                      ? 'bg-indigo-600/30 text-indigo-100 border-indigo-400/40 shadow-[0_2px_8px_rgba(99,102,241,0.25)]'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border-transparent'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTabId === tab.id ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="truncate text-[11px] font-medium flex-1">{tab.title || tab.url}</span>
                  <button
                    type="button"
                    onClick={e => closeTab(tab.id, e)}
                    className="p-0.5 rounded-full hover:bg-white/20 text-slate-400 hover:text-white transition-all shrink-0 opacity-60 group-hover:opacity-100"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}

              {/* Nút thêm tab mới kiểu Safari */}
              <button
                onClick={() => openInBrowser('https://www.google.com/')}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
                title="Mở tab mới"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ═══ WEBVIEW CONTENT ═══ */}
          <div className="flex-1 relative bg-[#121214] overflow-hidden">
            {tabs.map(tab => {
              const isTabActive = activeTabId === tab.id;
              const isTransitioning = !!tabTransitioning[tab.id];

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
                const rawUrl = tab.url || tab.initialUrl;
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
                      className={isTabActive ? 'w-full h-full relative bg-white' : 'w-0 h-0 invisible absolute'}
                    >
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                          <div className="text-center text-gray-500">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-sm">Đang tải...</p>
                          </div>
                        </div>
                      )}
                      {proxyError && !srcdocHtml && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10 p-6">
                          <div className="text-center text-red-500">
                            <p className="font-bold mb-1">Không thể tải trang</p>
                            <p className="text-sm text-gray-500">{proxyError}</p>
                            <button
                              onClick={() => fetchProxyContent(tab.id, rawUrl)}
                              className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg"
                            >Thử lại</button>
                          </div>
                        </div>
                      )}
                      <iframe
                        id={`global-wv-${tab.id}`}
                        srcDoc={srcdocHtml}
                        className="w-full h-full border-none bg-white"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
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
                      className={isTabActive ? 'w-full h-full border-none bg-white' : 'w-0 h-0 invisible absolute'}
                      sandbox={isProxied
                        ? 'allow-scripts allow-same-origin allow-forms allow-popups'
                        : 'allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-top-navigation-by-user-activation'
                      }
                    />
                  );
                }
              }
            })}
          </div>

          {/* FLOATING READER QUICK TOOLS (TIỆN ÍCH ĐỌC THU GỌN) */}
          <ReaderQuickTools
            activeTabId={activeTabId}
            isAutoTranslate={autoStates[activeTabId]}
            isAudioPlaying={!!activeAudioObj}
            darkModeActive={darkModeActive}
            cleanAdsActive={cleanAdsActive}
            onToolAction={(action, payload) => handleTool(action, activeTabId, payload)}
          />

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
    </BrowserContext.Provider>
  );
};
