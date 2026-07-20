import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, RotateCcw, Settings2, Home, Search, ArrowRight, Globe } from 'lucide-react';
import { isElectron } from '../utils/electron';
import { Capacitor } from '@capacitor/core';

const isCapacitor = Capacitor.isNativePlatform();
import api from '../services/api';
import AudioPlayer from '../components/AudioPlayer';
import TranslationSettingsModal from '../components/TranslationSettingsModal';
import { localTranslator } from '../utils/localTranslator';

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
  
  const [urlInput, setUrlInput] = useState('');
  
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
            let fetchedTranslations = [];
            if (useServer) {
              const host = settings.serverUrl || 'https://tienhiep.lyvuha.com';
              const res = await fetch(`${host}/translate`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'X-VIP-Key': settings.vipKey || 'VIP2026'
                },
                body: JSON.stringify({ texts: textsToTranslate, mode: mode, vip_key: settings.vipKey })
              });
              const json = await res.json();
              if (json.translations) fetchedTranslations = json.translations;
              else fetchedTranslations = textsToTranslate;
            } else {
              let localSuccess = false;
              // On Capacitor, try local server first
              const isLocalEnv = window.electron || isCapacitor;
              if (isLocalEnv) {
                try {
                  const localServerUrl = isCapacitor ? 'http://10.0.2.2:5051' : 'http://127.0.0.1:5051';
                  const res = await fetch(`${localServerUrl}/translate`, {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'X-VIP-Key': 'VIP2026'
                    },
                    body: JSON.stringify({ texts: textsToTranslate, mode: mode }),
                    signal: AbortSignal.timeout(1500)
                  });
                  if (res.ok) {
                    const json = await res.json();
                    if (json.translations && json.translations.length === textsToTranslate.length) {
                      fetchedTranslations = json.translations;
                      localSuccess = true;
                    }
                  }
                } catch (err) {
                  console.warn("[Local Server Translate] Failed:", err);
                }
              }
              
              if (!localSuccess) {
                await localTranslator.loadDictionaries();
                fetchedTranslations = textsToTranslate.map(t => localTranslator.translateSentence(t, mode));
              }
            }

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

  useEffect(() => {
    const resumeTTSPlayback = async (tabId, webview) => {
      if (webview.__translationCompletedForThisPage) return;
      webview.__translationCompletedForThisPage = true;
      try {
        const result = await webview.executeJavaScript(`
          (window.__TienHiepHelpers ? window.__TienHiepHelpers.extractCleanChapterText() : { title: document.title, text: document.body.innerText })
        `);
        if (result && result.text && result.text.length > 5) {
          setActiveAudioObj({ 
            tabId: tabId, 
            title_vietphrase: result.title, 
            title: result.title, 
            description: result.text, 
            isChapter: true,
            onBoundary: (charIdx, sentenceText) => {
              window.dispatchEvent(new CustomEvent('global-tts-boundary', {
                detail: { charIdx, sentenceText }
              }));
            }
          });
          webview.executeJavaScript(`window.isTtsPlaying = true;`);
        }
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
          const newId = Date.now().toString();
          const targetUrl = e.url || e.targetUrl;
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
        wv.addEventListener('did-navigate', (e) => {
          setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, url: e.url } : t));
          addToHistory(e.url);
          // Reset cờ báo để tránh tình trạng Audio gọi chồng chéo
          wv.__translationCompletedForThisPage = false;
        });
        wv.addEventListener('did-navigate-in-page', (e) => {
          setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, url: e.url } : t));
          addToHistory(e.url);
          wv.__translationCompletedForThisPage = false;
          const isEnabled = autoStatesRef.current[tab.id] || false;
          if (isEnabled) {
            wv.executeJavaScript(`
              if (window.toggleAutoTranslate) {
                window.toggleAutoTranslate(true);
              }
            `);
          }
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
                const settings = stored ? JSON.parse(stored) : { engineType: 'browser', mode: 'advanced', serverUrl: 'https://tienhiep.lyvuha.com' };
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
                  let fetchedTranslations = [];
                  if (useServer) {
                      const host = settings.serverUrl || 'https://tienhiep.lyvuha.com';
                      const res = await fetch(`${host}/translate`, {
                          method: 'POST',
                          headers: { 
                              'Content-Type': 'application/json',
                              'X-VIP-Key': settings.vipKey || 'VIP2026'
                          },
                          body: JSON.stringify({ texts: textsToTranslate, mode: mode, vip_key: settings.vipKey })
                      });
                      const json = await res.json();
                      if (json.translations) fetchedTranslations = json.translations;
                      else fetchedTranslations = textsToTranslate; // fallback
                  } else {
                      let localSuccess = false;
                      const isLocalEnv = window.electron || isCapacitor;
                      if (isLocalEnv) {
                          try {
                              const localServerUrl = isCapacitor ? 'http://10.0.2.2:5051' : 'http://127.0.0.1:5051';
                              const res = await fetch(`${localServerUrl}/translate`, {
                                  method: 'POST',
                                  headers: { 
                                      'Content-Type': 'application/json',
                                      'X-VIP-Key': 'VIP2026'
                                  },
                                  body: JSON.stringify({ texts: textsToTranslate, mode: mode }),
                                  signal: AbortSignal.timeout(1500)
                              });
                              if (res.ok) {
                                  const json = await res.json();
                                  if (json.translations && json.translations.length === textsToTranslate.length) {
                                      fetchedTranslations = json.translations;
                                      localSuccess = true;
                                    }
                              }
                          } catch (err) {
                              console.warn("[Local Server Translate] Failed, falling back to local JS translator:", err);
                          }
                      }
                      
                      if (!localSuccess) {
                          await localTranslator.loadDictionaries();
                          fetchedTranslations = textsToTranslate.map(t => localTranslator.translateSentence(t, mode));
                      }
                  }

                  // 3. Save to Cache and merge results
                  fetchedTranslations.forEach((trans, idx) => {
                     const origIdx = originalIndices[idx];
                     translations[origIdx] = trans;
                     setCachedTranslation(textsToTranslate[idx], mode, trans);
                  });
                }
                
                wv.executeJavaScript(`if(window.__receiveTranslations) window.__receiveTranslations(${data.id}, ${JSON.stringify(translations)})`);
             } catch(err) {
                console.error("IPC Translate Error:", err);
                const data = JSON.parse(e.message.substring(15));
                wv.executeJavaScript(`if(window.__receiveTranslations) window.__receiveTranslations(${data.id}, [])`);
             }
          }
        });

        const apiBase = import.meta.env.PROD || window.electron 
          ? 'https://cong123779-tienhiep-api.hf.space' 
          : 'http://localhost:5000';

        const settingsStr = localStorage.getItem('translationSettings') || '{}';
        const useTypewriter = JSON.parse(settingsStr).typewriterEffect === true;

        const scriptContent = `
          if (!window.__translatorInitialized) {
            window.__translatorInitialized = true;
            window.__autoTranslateEnabled = false;
            window.isTtsPlaying = false;
            
            // =========================================================
            // 1. HELPERS: Heuristic Text Extraction & Auto-Next
            // =========================================================
            window.__TienHiepHelpers = {
                extractCleanChapterText: () => {
                    const SELECTORS = {
                        "qidian.com": ".read-content, #read-content",
                        "fanqie.com": ".muye-reader-content-novel",
                        "truyenfull.vn": "#chapter-c, .chapter-c",
                        "tangthuvien.vn": ".box-chap, #chapter-content",
                        "metruyenchu.com.vn": "#chapter-detail",
                        "hjwzw.com": "#content, .content",
                        "tw.hjwzw.com": "#content, .content",
                        "uukanshu.com": "#contentbox",
                        "69shuba.com": ".txtnav",
                        "biquge": ".showtxt, #content"
                    };

                    const host = window.location.hostname;
                    let mainEl = null;

                    for (const [domain, selector] of Object.entries(SELECTORS)) {
                        if (host.includes(domain)) {
                            const els = selector.split(',').map(s => s.trim());
                            for (const sel of els) {
                                mainEl = document.querySelector(sel);
                                if (mainEl) break;
                            }
                        }
                        if (mainEl) break;
                    }

                    if (!mainEl) {
                        let bestEl = null;
                        let bestScore = -1;
                        
                        document.querySelectorAll('div, article, section').forEach(el => {
                            const text = el.innerText || '';
                            const textLength = text.trim().length;
                            if (textLength < 400) return;

                            let linkTextLength = 0;
                            el.querySelectorAll('a').forEach(a => linkTextLength += (a.innerText || '').length);

                            const linkDensity = linkTextLength / (textLength || 1);
                            if (linkDensity > 0.12) return;

                            const pCount = el.querySelectorAll('p').length;
                            const brCount = el.querySelectorAll('br').length;
                            const score = textLength * (1 - linkDensity) * (pCount + (brCount / 2) + 1);
                            if (score > bestScore) {
                                bestScore = score;
                                bestEl = el;
                            }
                        });
                        mainEl = bestEl || document.body;
                    }

                    let novelTitle = document.title.replace(/第\\s*\\d+\\s*[章页].*$/, '').replace(/_.*$/, '').replace(/-.*$/, '').trim();
                    let chapterTitle = "Chương đọc";
                    const heading = Array.from(document.querySelectorAll('h1, h2, .chapter-title, .title')).find(el => {
                        const txt = el.textContent;
                        return /第\\s*\\d+\\s*章/.test(txt) || /Chương\\s*\\d+/.test(txt);
                    });
                    if (heading) chapterTitle = heading.textContent.trim();
                    else {
                        const match = document.title.match(/(第\\s*\\d+\\s*章[^\\-_|]*)/) || document.title.match(/(Chương\\s*\\d+[^\\-_|]*)/);
                        if (match) chapterTitle = match[1].trim();
                    }

                    const clone = mainEl.cloneNode(true);
                    clone.querySelectorAll('script, style, iframe, button, a, .ads, .advertisement, .comment, .social-share, .footer, .header, [id*="google_ads"]').forEach(el => el.remove());

                    let paragraphs = [];
                    const pTags = clone.querySelectorAll('p');
                    if (pTags.length > 5) {
                        pTags.forEach(p => {
                            const txt = p.innerText.trim();
                            if (txt && txt.length > 5 && !/chương trước|chương sau|trở lại|danh sách/i.test(txt)) paragraphs.push(txt);
                        });
                    } else {
                        (clone.innerText || '').split(/\\n+/).forEach(line => {
                            const txt = line.trim();
                            if (txt && txt.length > 5 && !/chương trước|chương sau|trở lại|danh sách/i.test(txt)) paragraphs.push(txt);
                        });
                    }

                    return { title: chapterTitle, text: paragraphs.join('\\n\\n') };
                },
                
                checkAndTriggerAutoNext: (force = false) => {
                    const isNearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 150;
                    const isTooShort = document.documentElement.scrollHeight <= window.innerHeight + 150;

                    if (force || isNearBottom || isTooShort) {
                        if (window.isTtsPlaying && !force) return; // Prevent auto-next if TTS is playing naturally

                        let nextBtn = null;

                        // 1. Try Custom Saved Selector first
                        const customSelector = localStorage.getItem('__tienhiep_custom_next_selector');
                        if (customSelector) {
                            try {
                                nextBtn = document.querySelector(customSelector);
                            } catch(e) {}
                        }

                        // 2. Try Custom Saved Text next
                        if (!nextBtn) {
                            const customText = localStorage.getItem('__tienhiep_custom_next_text');
                            if (customText) {
                                nextBtn = Array.from(document.querySelectorAll('a, button, span, div')).find(el => {
                                    return (el.textContent || '').trim().toLowerCase() === customText.toLowerCase();
                                });
                            }
                        }

                        // 3. Fallback to default heuristic selectors
                        if (!nextBtn) {
                            const selector = '.next-btn, #next-chap, .next, #next, .next-chapter, #next-chapter, [id*="next-chap"], [class*="next-chap"], a:contains("下一章"), a:contains("下一页"), a:contains("Chương sau"), a:contains("chương sau"), a:contains("Chương tiếp"), a:contains("chương tiếp"), a:contains("Next"), a:contains("next"), a:contains("sau"), a:contains("Sau"), a[rel="next"]';
                            const selectors = selector.split(',').map(s => s.trim());
                            for (const sel of selectors) {
                                try {
                                    if (sel.includes(':contains')) {
                                        const matchText = sel.match(/"([^"]+)"/)?.[1];
                                        if (matchText) {
                                            nextBtn = Array.from(document.querySelectorAll('a, button, span, div')).find(el => {
                                                const txt = el.textContent || '';
                                                return txt.toLowerCase().includes(matchText.toLowerCase());
                                            });
                                        }
                                    } else {
                                        nextBtn = document.querySelector(sel);
                                    }
                                } catch(e) {}
                                if (nextBtn) break;
                            }
                        }

                        if (nextBtn) {
                            const tip = document.createElement('div');
                            tip.style = 'position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#3f51b5,#1a237e);color:#fff;padding:10px 18px;border-radius:10px;z-index:99999;font-size:12px;font-weight:bold;box-shadow:0 4px 16px rgba(0,0,0,0.3);';
                            let remaining = 3;
                            tip.innerText = 'Chuyển chương sau trong ' + remaining + 's...';
                            document.body.appendChild(tip);

                            const timer = setInterval(() => {
                                remaining--;
                                if (remaining <= 0) clearInterval(timer);
                                else tip.innerText = 'Chuyển chương sau trong ' + remaining + 's...';
                            }, 1000);
                            
                            setTimeout(() => {
                                clearInterval(timer);
                                if (window.isTtsPlaying && !force) { tip.remove(); return; }
                                try {
                                    if (nextBtn.tagName === 'A' && nextBtn.href && !nextBtn.href.startsWith('javascript:')) {
                                        window.location.href = nextBtn.href;
                                    } else {
                                        nextBtn.click();
                                    }
                                } catch (err) {}
                                tip.remove();
                            }, 3000);
                        }
                    }
                },
                
                startTeachNextMode: () => {
                    const existing = document.getElementById('__teach_next_banner');
                    if (existing) existing.remove();

                    const banner = document.createElement('div');
                    banner.id = '__teach_next_banner';
                    banner.style = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:12px 24px;border-radius:12px;z-index:999999;font-size:13px;font-weight:bold;box-shadow:0 10px 25px rgba(0,0,0,0.4);display:flex;align-items:center;gap:12px;border:1px solid rgba(255,255,255,0.2);transition:all 0.3s ease;font-family:sans-serif;';
                    banner.innerHTML = \`
                        <span>🎯 <b>Hãy Click vào nút "Chương Sau"</b> trên trang để dạy hệ thống...</span>
                        <button id="__cancel_teach_next" style="background:rgba(255,255,255,0.2);border:none;color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:11px;">Hủy</button>
                    \`;
                    document.body.appendChild(banner);

                    let hoveredEl = null;
                    let origOutline = '';

                    const onMouseOver = (e) => {
                        if (banner.contains(e.target)) return;
                        if (hoveredEl) {
                            hoveredEl.style.outline = origOutline;
                        }
                        hoveredEl = e.target;
                        origOutline = hoveredEl.style.outline;
                        hoveredEl.style.outline = '3px solid #f97316';
                        hoveredEl.style.cursor = 'pointer';
                    };

                    const onMouseOut = (e) => {
                        if (hoveredEl === e.target) {
                            hoveredEl.style.outline = origOutline;
                            hoveredEl = null;
                        }
                    };

                    const onClick = (e) => {
                        if (banner.contains(e.target)) return;
                        e.preventDefault();
                        e.stopPropagation();

                        const el = e.target;
                        
                        const getSelector = (target) => {
                            if (target.id) return '#' + target.id;
                            let parts = [];
                            let curr = target;
                            while (curr && curr.nodeType === Node.ELEMENT_NODE) {
                                let sel = curr.nodeName.toLowerCase();
                                if (curr.className) {
                                    const cls = Array.from(curr.classList).filter(c => !c.includes('hover') && !c.includes('active')).join('.');
                                    if (cls) sel += '.' + cls;
                                }
                                parts.unshift(sel);
                                curr = curr.parentNode;
                                if (parts.length >= 3) break;
                            }
                            return parts.join(' > ');
                        };

                        const selector = getSelector(el);
                        const text = el.innerText ? el.innerText.trim() : '';

                        localStorage.setItem('__tienhiep_custom_next_selector', selector);
                        if (text && text.length < 30) {
                            localStorage.setItem('__tienhiep_custom_next_text', text);
                        }

                        banner.style.background = 'linear-gradient(135deg,#10b981,#059669)';
                        banner.innerHTML = '🎉 Đã học thành công! Từ giờ nút này sẽ được dùng để chuyển chương.';
                        
                        cleanup();

                        setTimeout(() => {
                            banner.remove();
                        }, 2500);
                    };

                    const cleanup = () => {
                        document.removeEventListener('mouseover', onMouseOver, true);
                        document.removeEventListener('mouseout', onMouseOut, true);
                        document.removeEventListener('click', onClick, true);
                        if (hoveredEl) {
                            hoveredEl.style.outline = origOutline;
                        }
                    };

                    document.addEventListener('mouseover', onMouseOver, true);
                    document.addEventListener('mouseout', onMouseOut, true);
                    document.addEventListener('click', onClick, true);

                    document.getElementById('__cancel_teach_next').onclick = () => {
                        cleanup();
                        banner.remove();
                    };
                }
            };
            
            // =========================================================
            // 2. TRANSLATOR ENGINE
            // =========================================================
            window.__transPromises = {};
            window.__transId = 0;
            window.__receiveTranslations = (id, results) => {
                if (window.__transPromises[id]) {
                    window.__transPromises[id](results);
                    delete window.__transPromises[id];
                }
            };

            async function translateNodes(nodes) {
              const texts = nodes.map(n => n.nodeValue);
              try {
                const id = window.__transId++;
                const translations = await new Promise((resolve) => {
                    window.__transPromises[id] = resolve;
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage({ type: 'TRANSLATE_REQ', id, texts }, '*');
                    }
                    console.log('[TRANSLATE_REQ]' + JSON.stringify({ id, texts }));
                    setTimeout(() => {
                       if (window.__transPromises[id]) {
                           window.__transPromises[id]([]);
                           delete window.__transPromises[id];
                       }
                    }, 10000);
                });

                if (translations && translations.length === nodes.length) {
                  if (window.__autoTranslateObserver) window.__autoTranslateObserver.disconnect();
                  translations.forEach((trans, idx) => {
                    const node = nodes[idx];
                    if (node && trans) {
                      if (!${useTypewriter} || trans.length < 5) { 
                          node.nodeValue = trans; 
                          return; 
                      }
                      const words = trans.split(/(?<=\\s+)/);
                      node.nodeValue = "";
                      let i = 0;
                      function typeWriter() {
                          if (i < words.length) {
                              node.nodeValue += words[i]; i++;
                              requestAnimationFrame(() => setTimeout(typeWriter, 5));
                          }
                      }
                      typeWriter();
                    }
                  });
                  if (window.__autoTranslateObserver) {
                    window.__autoTranslateObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
                  }
                }
                return translations;
              } catch(e) { console.error('Translate API Error:', e); return []; }
            }

            const queue = [];
            let timeout = null;
            let isProcessing = false;

            const processQueue = () => {
              if (queue.length > 0 && !isProcessing && window.__autoTranslateEnabled) {
                isProcessing = true;
                const batch = queue.splice(0, 100);
                translateNodes(batch).finally(() => {
                  isProcessing = false;
                  if (queue.length > 0) setTimeout(processQueue, 100);
                  else {
                    clearTimeout(window.__translateCompleteTimeout);
                     window.__translateCompleteTimeout = setTimeout(() => {
                        if (window.parent && window.parent !== window) {
                            let res = { title: document.title, text: document.body.innerText };
                            if (window.__TienHiepHelpers) {
                                res = window.__TienHiepHelpers.extractCleanChapterText();
                            }
                            window.parent.postMessage({
                                type: 'TRANSLATION_COMPLETE',
                                title: res.title,
                                text: res.text
                            }, '*');
                        }
                        console.log('[Translation Complete]');
                     }, 800);
                  }
                });
              }
            };

            const collectNodes = (root) => {
              if (!window.__autoTranslateEnabled) return;
              const nodes = []; const stack = [root];
              while (stack.length > 0) {
                const node = stack.pop(); if (!node) continue;
                if (node.nodeType === 3) {
                  const val = node.__original_chinese__ || node.nodeValue;
                  if (val && /[\\u4e00-\\u9fa5]/.test(val)) {
                    const tag = node.parentNode?.nodeName;
                    if (tag !== 'SCRIPT' && tag !== 'STYLE' && tag !== 'NOSCRIPT') {
                      if (!node.__original_chinese__) node.__original_chinese__ = val;
                      nodes.push(node);
                    }
                  }
                } else {
                  if (node.shadowRoot) stack.push(node.shadowRoot);
                  let child = node.lastChild; while (child) { stack.push(child); child = child.previousSibling; }
                }
              }
              if (nodes.length > 0) {
                queue.push(...nodes);
                if (!timeout) timeout = setTimeout(() => { timeout = null; processQueue(); }, 200);
              }
            };

            window.__autoTranslateObserver = new MutationObserver((mutations) => {
              if (!window.__autoTranslateEnabled) return;
              mutations.forEach(m => {
                if (m.type === 'characterData') {
                  if (m.target.nodeType === 3) collectNodes(m.target);
                } else if (m.type === 'childList') {
                  m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 || node.nodeType === 3) collectNodes(node);
                  });
                }
              });
            });
            window.__autoTranslateObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

            window.toggleAutoTranslate = (enabled) => {
              window.__autoTranslateEnabled = enabled;
              if (enabled) collectNodes(document.body);
              return enabled;
            };

            // Monitor Scroll for AutoNext (Only if TTS is not active)
            window.addEventListener('scroll', () => {
                if (window.__autoTranslateEnabled && !window.isTtsPlaying) {
                    window.__TienHiepHelpers.checkAndTriggerAutoNext(false);
                }
            });
          }
        `;
        
        wv.addEventListener('dom-ready', () => {
          const isEnabled = autoStatesRef.current[tab.id] || false;
          wv.executeJavaScript(scriptContent + `
            if (${isEnabled} && window.toggleAutoTranslate) {
              window.toggleAutoTranslate(true);
            }
          `);

          // Nếu TTS đang bật trên tab này, kích hoạt tự động phát lại khi sang trang mới
          if (autoAudioStatesRef.current[tab.id]) {
            if (isEnabled) {
              // Nếu dịch tự động được bật, chờ tối đa 4.5 giây để dịch xong trước khi tự động phát (hoặc phát dự phòng)
              setTimeout(() => {
                if (autoAudioStatesRef.current[tab.id]) {
                  resumeTTSPlayback(tab.id, wv);
                }
              }, 4500);
            } else {
              // Nếu không dịch, đợi 1.2 giây để tải xong DOM rồi phát ngay lập tức
              setTimeout(() => {
                if (autoAudioStatesRef.current[tab.id]) {
                  resumeTTSPlayback(tab.id, wv);
                }
              }, 1200);
            }
          }
        });
        
        // Save the script content to the webview dataset so we can inject it manually if needed
        wv.__translateScript = scriptContent;
        scriptContentRef.current = scriptContent;
      }
    });
  }, [tabs]);

  const [autoStates, setAutoStates] = useState({});

  const togglePin = (toolId) => {
    setPinnedTools(prev => {
      const newPins = prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId];
      localStorage.setItem('pinnedTools', JSON.stringify(newPins));
      return newPins;
    });
  };











  const handleTool = async (action, tabId) => {
    console.log("[BrowserContext Tool] handleTool action:", action, "tabId:", tabId);
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
        
        if (isIframe) {
          const script = scriptContentRef.current;
          if (script) {
            wv.contentWindow.postMessage({ action: 'INJECT_SCRIPT', script }, '*');
          }
          setTimeout(() => {
            wv.contentWindow.postMessage({ action: 'TOGGLE_AUTO_TRANSLATE', enabled: newState }, '*');
          }, 100);
        } else {
          // Inject script if missing (fail-safe for race conditions)
          await wv.executeJavaScript(`
            if (!window.__translatorInitialized && \`${wv.__translateScript ? 'true' : 'false'}\` === 'true') {
              ${wv.__translateScript || ''}
            }
            if (window.toggleAutoTranslate) {
              window.toggleAutoTranslate(${newState});
            }
          `);
        }
        
        setAutoStates(prev => ({ ...prev, [tabId]: newState }));
      }

      else if (action === 'audio') {
        autoAudioStatesRef.current[tabId] = true;
        if (isIframe) {
          wv.contentWindow.postMessage({ action: 'EXTRACT_TEXT' }, '*');
        } else {
          const result = await wv.executeJavaScript(`
            (window.__TienHiepHelpers ? window.__TienHiepHelpers.extractCleanChapterText() : { title: document.title, text: document.body.innerText })
          `);
          if (result.text && result.text.length > 50) {
             setActiveAudioObj({ 
               title_vietphrase: result.title, 
               author_hanviet: "Trang Web Nhúng", 
               description: result.text, 
               isChapter: true,
               tabId: tabId,
               onBoundary: (charIdx, sentenceText) => {
                 window.dispatchEvent(new CustomEvent('global-tts-boundary', {
                   detail: { charIdx, sentenceText }
                 }));
               }
             });
             wv.executeJavaScript(`window.isTtsPlaying = true;`);
          } else {
            autoAudioStatesRef.current[tabId] = false;
            alert("Không đủ chữ để đọc hoặc trang web chưa được dịch xong. Hãy đợi một chút và thử lại.");
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
        if (isIframe) {
          wv.contentWindow.postMessage({ action: 'TRIGGER_NEXT' }, '*');
        } else {
          await wv.executeJavaScript(`if (window.__TienHiepHelpers) window.__TienHiepHelpers.checkAndTriggerAutoNext(true);`);
        }
      }
      else if (action === 'teach_next') {
        if (isIframe) {
          wv.contentWindow.postMessage({ action: 'TEACH_NEXT' }, '*');
        } else {
          await wv.executeJavaScript(`if (window.__TienHiepHelpers) window.__TienHiepHelpers.startTeachNextMode();`);
        }
      }
      else if (action === 'dark_mode') {
        if (isIframe) {
          wv.contentWindow.postMessage({ action: 'TOGGLE_DARK_MODE' }, '*');
        } else {
          await wv.executeJavaScript(`
            if (document.documentElement.style.filter.includes('invert(1)')) {
              document.documentElement.style.filter = '';
              document.documentElement.style.backgroundColor = '';
            } else {
              document.documentElement.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(1.1)';
              document.documentElement.style.backgroundColor = '#111';
            }
          `);
        }
      }
      else if (action === 'clean_ads') {
        if (isIframe) {
          const settings = JSON.parse(localStorage.getItem('translationSettings') || '{}');
          const continuous = settings.continuousClean !== false;
          wv.contentWindow.postMessage({ action: 'CLEAN_ADS', continuous }, '*');
        } else {
          const settings = JSON.parse(localStorage.getItem('translationSettings') || '{}');
          const continuous = settings.continuousClean !== false;
          if (continuous) {
             await wv.executeJavaScript(`
               if (window.__adObserver) { window.__adObserver.disconnect(); window.__adObserver = null; alert('Đã TẮT Lọc QC Liên Tục'); }
               else {
                 window.__adObserver = new MutationObserver(() => {
                   document.querySelectorAll('iframe, .ad, .ads, [id*="ad"], [class*="ad"], .banner, .popup, ins').forEach(ad => ad.remove());
                 });
                 window.__adObserver.observe(document.body, { childList: true, subtree: true });
                 alert('Đã BẬT Auto-Lọc QC (Chặn ngầm liên tục)');
               }
             `);
          } else {
             await wv.executeJavaScript(`
               const ads = document.querySelectorAll('iframe, .ad, .ads, [id*="ad"], [class*="ad"], .banner, .popup, ins');
               ads.forEach(ad => ad.remove());
               alert('Đã dọn dẹp 1 lần ' + ads.length + ' quảng cáo!');
             `);
          }
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
    
    const escapedSentence = sentenceText.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    
    wv.executeJavaScript(`
      (() => {
        const targetText = '${escapedSentence}'.trim();
        if (!targetText) return;

        function findTextNode(root, text) {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
          let node;
          while (node = walker.nextNode()) {
            const val = node.nodeValue || '';
            if (val.includes(text)) {
              return { node, startIdx: val.indexOf(text) };
            }
          }
          if (text.length > 15) {
            const prefix = text.substring(0, Math.floor(text.length * 0.65));
            const walker2 = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
            while (node = walker2.nextNode()) {
              const val = node.nodeValue || '';
              if (val.includes(prefix)) {
                return { node, startIdx: val.indexOf(prefix) };
              }
            }
          }
          return null;
        }

        let attempts = 0;
        function tryHighlight() {
          const oldHighlight = document.getElementById('tienhiep-active-highlight');
          const result = findTextNode(document.body, targetText);
          
          if (result) {
            if (oldHighlight) {
              const parent = oldHighlight.parentNode;
              if (parent) {
                const textNode = document.createTextNode(oldHighlight.textContent);
                parent.replaceChild(textNode, oldHighlight);
                parent.normalize();
              }
            }

            const { node, startIdx } = result;
            const parent = node.parentNode;
            if (parent && parent.nodeName !== 'SCRIPT' && parent.nodeName !== 'STYLE') {
              const textVal = node.nodeValue;
              const matchLen = Math.min(targetText.length, textVal.length - startIdx);
              
              const beforeText = textVal.substring(0, startIdx);
              const matchedText = textVal.substring(startIdx, startIdx + matchLen);
              const afterText = textVal.substring(startIdx + matchLen);

              const fragment = document.createDocumentFragment();
              if (beforeText) fragment.appendChild(document.createTextNode(beforeText));
              
              const span = document.createElement('span');
              span.id = 'tienhiep-active-highlight';
              span.style.backgroundColor = 'rgba(139, 92, 246, 0.25)';
              span.style.color = '#c084fc';
              span.style.borderBottom = '2px solid #a855f7';
              span.style.padding = '1px 3px';
              span.style.borderRadius = '3px';
              span.style.transition = 'all 0.3s ease';
              span.textContent = matchedText;
              fragment.appendChild(span);

              if (afterText) fragment.appendChild(document.createTextNode(afterText));

              parent.replaceChild(fragment, node);
              span.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } else if (attempts < 6) {
            attempts++;
            setTimeout(tryHighlight, 600);
          }
        }

        tryHighlight();
      })()
    `).catch(err => {});
  };

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
      if (!wv || !autoAudioStatesRef.current[tabId]) return;
      
      try {
        const result = await wv.executeJavaScript(`
          (window.__TienHiepHelpers ? window.__TienHiepHelpers.extractCleanChapterText() : { title: document.title, text: document.body.innerText })
        `);
        
        if (result.text && result.text.length > 50) {
          // Cập nhật state gốc bằng setActiveAudioObj chuẩn xác
          setActiveAudioObj(prev => {
            if (prev && prev.tabId === tabId && prev.description !== result.text) {
              return {
                ...prev,
                title_vietphrase: result.title,
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
      if (activeAudioObj?.tabId) {
        handleTool('next', activeAudioObj.tabId);
      } else {
        handleTool('next', activeTabId);
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
      // Với webview: click nút back của trình đọc
      if (activeAudioObj?.tabId) {
        const wv = document.getElementById('global-wv-' + activeAudioObj.tabId);
        if (wv?.canGoBack()) wv.goBack();
      }
    }
  };

  return (
    <BrowserContext.Provider value={{ openInBrowser, tabs, activeTabId, closeTab, closeAll, isVisible, setIsVisible, activeAudioObj, setActiveAudioObj }}>
      {children}
      {tabs.length > 0 && (
        <div
          className={`fixed left-0 right-0 bottom-0 z-[9999] bg-[#0b0b14] flex-col animate-fade-in shadow-2xl ${isVisible ? 'flex' : 'hidden'}`}
          style={{ top: document.querySelector('header') ? '56px' : '0px' }}
        >

          {/* ═══ TOP NAVIGATION BAR ═══ */}
          <div className="flex flex-col bg-gradient-to-b from-[#0f0c24] to-[#110e26] border-b border-indigo-500/20 shadow-xl">

            {/* Row 1: Nav controls + Address bar */}
            <div className="flex items-center gap-1.5 px-2 py-1.5">

              {/* Home Button */}
              <button
                onClick={() => setIsVisible(false)}
                className="p-2 rounded-lg hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-all shrink-0"
                title="Về trang chủ"
              >
                <Home className="w-4 h-4" />
              </button>

              {/* Back / Forward / Reload */}
              {(() => {
                const activeTab = tabs.find(t => t.id === activeTabId);
                const canGoBack = isElectron ? true : (activeTab?.historyIndex > 0);
                const canGoForward = isElectron ? true : (activeTab?.history && activeTab.historyIndex < activeTab.history.length - 1);
                
                return (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={handleGoBack}
                      disabled={!canGoBack}
                      className={`p-1.5 rounded-lg transition-all ${canGoBack ? 'hover:bg-white/10 text-slate-200 hover:text-white' : 'text-slate-600 cursor-not-allowed opacity-40'}`}
                      title="Quay lại"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleGoForward}
                      disabled={!canGoForward}
                      className={`p-1.5 rounded-lg transition-all ${canGoForward ? 'hover:bg-white/10 text-slate-200 hover:text-white' : 'text-slate-600 cursor-not-allowed opacity-40'}`}
                      title="Tiến tới"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleReload}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition-all"
                      title="Tải lại"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()}

              {/* Address / Search Bar */}
              <form
                className="flex-1 flex items-center gap-2 bg-[#1a1830] border border-indigo-500/25 hover:border-indigo-400/50 focus-within:border-indigo-400/70 focus-within:shadow-[0_0_0_2px_rgba(99,102,241,0.15)] rounded-full px-3 py-1 transition-all"
                onSubmit={handleAddressSubmit}
              >
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
                  className="flex-1 bg-transparent text-[13px] text-slate-200 placeholder-slate-500 outline-none min-w-0"
                />
                <button type="submit" className="p-0.5 text-slate-400 hover:text-indigo-300 transition-colors shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Settings + Close */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                  title="Đóng trình duyệt"
                ><X className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Row 2: Tabs */}
            <div className="flex items-center gap-1.5 px-2 pb-1.5 overflow-x-auto no-scrollbar">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  onClick={() => {
                    setActiveTabId(tab.id);
                    setUrlInput(tab.url || '');
                  }}
                  className={`group relative flex items-center gap-1.5 px-3 py-1 min-w-[100px] max-w-[180px] rounded-full cursor-pointer transition-all duration-200 border shrink-0 ${
                    activeTabId === tab.id
                      ? 'bg-indigo-600/30 text-indigo-100 border-indigo-400/50 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border-transparent'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTabId === tab.id ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="truncate text-[11px] font-semibold flex-1">{tab.title || tab.url}</span>
                  <X
                    className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-white transition-all shrink-0"
                    onClick={e => closeTab(tab.id, e)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ═══ WEBVIEW CONTENT ═══ */}
          <div className="flex-1 relative bg-white overflow-hidden">
            {tabs.map(tab => {
              const isTabActive = activeTabId === tab.id;
              if (isElectron) {
                return (
                  <webview
                    key={tab.id}
                    id={`global-wv-${tab.id}`}
                    src={tab.initialUrl || tab.url}
                    allowpopups="true"
                    className={isTabActive ? 'w-full h-full border-none bg-white' : 'w-0 h-0 invisible absolute'}
                  />
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

          {/* ═══ BOTTOM TOOL DOCK (minimal) ═══ */}
          <div className="flex items-center bg-[#0d0b20] border-t border-white/5 w-full justify-between overflow-hidden">
            {/* Scrollable Tools Container */}
            <div className="flex-1 flex items-center overflow-x-auto no-scrollbar scroll-smooth">
              {(() => {
                const isAutoTranslate = autoStates[activeTabId];
                const allTools = [
                  { id: 'translate',       icon: '✨', label: isAutoTranslate ? 'Auto ✓' : 'Dịch' },
                  { id: 'force_translate', icon: '⚡', label: 'Nhanh' },
                  { id: 'audio',           icon: '🔊', label: 'TTS' },
                  { id: 'scroll',          icon: '📜', label: 'Cuộn' },
                  { id: 'next',            icon: '⏭', label: 'Tiếp' },
                  { id: 'dark_mode',       icon: '🌙', label: 'Tối' },
                  { id: 'clean_ads',       icon: '🧹', label: 'QC' },
                  { id: 'copy_text',       icon: '📋', label: 'Copy' },
                  { id: 'teach_next',      icon: '🎯', label: 'Chỉ nút' },
                ].filter(t => pinnedTools.includes(t.id) || t.id === 'teach_next');

                return allTools.map(tool => {
                  const isActive = tool.id === 'translate' && isAutoTranslate;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleTool(tool.id, activeTabId)}
                      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[52px] shrink-0 transition-all active:scale-90 hover:bg-white/5 ${isActive ? 'text-fuchsia-400' : 'text-slate-400 hover:text-slate-200'}`}
                      title={tool.label}
                    >
                      <span className="text-lg leading-none">{tool.icon}</span>
                      <span className="text-[9px] font-medium tracking-wide whitespace-nowrap">{tool.label}</span>
                    </button>
                  );
                });
              })()}
            </div>

            {/* Pinned settings on the right */}
            <div className="flex items-center border-l border-white/5 bg-[#0d0b20] shrink-0 z-10 shadow-[-5px_0_10px_rgba(0,0,0,0.5)]">
              <button
                onClick={() => setIsTranslationSettingsOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 px-3.5 py-2 min-w-[56px] text-slate-400 hover:text-indigo-300 hover:bg-white/5 transition-all active:scale-90"
                title="Cài đặt công cụ"
              >
                <Settings2 className="w-4 h-4 text-indigo-400" />
                <span className="text-[9px] font-bold">Tools</span>
              </button>
            </div>
          </div>

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
