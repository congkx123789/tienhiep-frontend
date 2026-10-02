// Webview IPC synchronization and Tool Actions Hook
import { useState, useEffect, useCallback } from 'react';
import { ToastInfo, BrowserTab } from './BrowserContext.types';
import { executeTranslate, cleanNovelTabTitle } from './browserHelpers';

export function useWebviewSync(
  tabs: BrowserTab[],
  setTabs: React.Dispatch<React.SetStateAction<BrowserTab[]>>,
  activeTabId: string,
  sendWebviewMessage: (tabId: string, payload: any) => void,
  startAudioFromContent: (tabId: string, title: string, text: string, initialParaIdx?: number) => void,
  addToHistory: (url: string, title?: string) => void,
  stopAudio?: (tabId?: string) => void,
  activeAudioObj?: any
) {
  const [autoStates, setAutoStates] = useState<Record<string, boolean>>({});
  const [toastInfo, setToastInfo] = useState<ToastInfo | null>(null);
  const [isTranslationSettingsOpen, setIsTranslationSettingsOpen] = useState(false);
  const [pinnedTools, setPinnedTools] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('tienhiep_pinned_tools');
      return s ? JSON.parse(s) : ['autoTranslate', 'audio', 'teachNext', 'cleanAds', 'darkMode'];
    } catch { return ['autoTranslate', 'audio', 'teachNext', 'cleanAds', 'darkMode']; }
  });

  const togglePin = useCallback((toolId: string) => {
    setPinnedTools(prev => {
      const next = prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId];
      try { localStorage.setItem('tienhiep_pinned_tools', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      const { type, id, texts, url, title, text, paraIdx, selector, host, tabId } = e.data;

      let senderTabId = tabId || '';
      if (!senderTabId && e.source) {
        for (const t of tabs) {
          const frame = document.getElementById(`global-wv-${t.id}`) as HTMLIFrameElement | null;
          if (frame && frame.contentWindow === e.source) {
            senderTabId = t.id;
            break;
          }
        }
      }
      if (!senderTabId) senderTabId = activeTabId;

      if (type === 'NAVIGATE_REQ' && url) {
        setTabs(prev => prev.map(t => {
          if (t.id !== senderTabId) return t;
          const stack = t.historyStack ? [...t.historyStack.slice(0, (t.historyIndex ?? 0) + 1), url] : [t.url, url];
          const newIdx = stack.length - 1;
          return {
            ...t,
            url,
            initialUrl: url,
            title: 'Đang tải...',
            historyStack: stack,
            historyIndex: newIdx,
            canGoBack: newIdx > 0,
            canGoForward: false
          };
        }));
        addToHistory(url);
      } else if (type === 'PAGE_LOADED') {
        if (url) {
          setTabs(prev => prev.map(t => t.id === senderTabId ? { ...t, url, title: cleanNovelTabTitle(title || t.title), isLoading: false } : t));
          addToHistory(url, title);
          if (autoStates[senderTabId]) {
            setTimeout(() => {
              sendWebviewMessage(senderTabId, { action: 'TOGGLE_AUTO_TRANSLATE', enabled: true });
              sendWebviewMessage(senderTabId, { action: 'FORCE_TRANSLATE' });
            }, 300);
          }
          if (sessionStorage.getItem('__tienhiep_tts_active_' + senderTabId) === 'true') {
            setTimeout(() => {
              if (!autoStates[senderTabId]) {
                sendWebviewMessage(senderTabId, { action: 'EXTRACT_TEXT' });
              }
            }, 800);
          }
        }
      } else if (type === 'TRANSLATE_REQ' && id !== undefined && Array.isArray(texts)) {
        const reqSession = (e.data && (e.data as any).pageSessionId) || '';
        const reqTabId = senderTabId;
        try {
          const translations = await executeTranslate(texts);
          if (e.source && typeof (e.source as any).postMessage === 'function') {
            (e.source as any).postMessage({ action: 'TRANSLATE_RES', id, pageSessionId: reqSession, translations }, '*');
          } else {
            sendWebviewMessage(reqTabId, { action: 'TRANSLATE_RES', id, pageSessionId: reqSession, translations });
          }
        } catch (err) {
          if (e.source && typeof (e.source as any).postMessage === 'function') {
            (e.source as any).postMessage({ action: 'TRANSLATE_RES', id, pageSessionId: reqSession, translations: texts }, '*');
          } else {
            sendWebviewMessage(reqTabId, { action: 'TRANSLATE_RES', id, pageSessionId: reqSession, translations: texts });
          }
        }
      } else if (type === 'TRANSLATION_COMPLETE') {
        if (text && sessionStorage.getItem('__tienhiep_tts_active_' + senderTabId) === 'true') {
          startAudioFromContent(senderTabId, title || 'Chương đọc', text, 0);
        }
      } else if (type === 'AUDIO_TEXT_RES') {
        if (text && text.trim().length > 0) {
          sessionStorage.setItem('__tienhiep_tts_active_' + senderTabId, 'true');
          startAudioFromContent(senderTabId, title || 'Chương đọc', text, 0);
        } else {
          setToastInfo({ message: 'Không trích xuất được nội dung để phát TTS!', type: 'warning' });
          setTimeout(() => setToastInfo(null), 4000);
        }
      } else if (type === 'TAP_PARAGRAPH') {
        sendWebviewMessage(activeTabId, { action: 'EXEC_HELPER', fn: 'highlightActiveParagraph', args: [paraIdx] });
      } else if (type === 'START_TTS_FROM_PARAGRAPH') {
        sendWebviewMessage(activeTabId, { action: 'EXTRACT_TEXT' });
      } else if (type === 'CONTENT_AREA_SAVED') {
        setToastInfo({ message: `Đã lưu vùng đọc: ${selector} cho ${host}`, type: 'success' });
        setTimeout(() => setToastInfo(null), 4000);
      } else if (type === 'NEXT_CHAPTER_NOT_FOUND') {
        setToastInfo({ message: 'Không tìm thấy nút Chương Sau! Hãy dùng tính năng Chỉ Định Nút Tiếp.', type: 'warning' });
        setTimeout(() => setToastInfo(null), 5000);
      } else if (type === 'PREV_CHAPTER_NOT_FOUND') {
        setToastInfo({ message: 'Không tìm thấy nút Chương Trước trên trang này!', type: 'warning' });
        setTimeout(() => setToastInfo(null), 5000);
      } else if (type === 'LAST_CHAPTER_REACHED') {
        setToastInfo({ message: 'Bạn đã đọc đến chương mới nhất của truyện!', type: 'info' });
        setTimeout(() => setToastInfo(null), 5000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTabId, setTabs, addToHistory, sendWebviewMessage, startAudioFromContent]);

  useEffect(() => {
    const handleTtsBoundary = (e: any) => {
      if (!activeTabId) return;
      const { sentenceText, sentenceId, charIdx } = e.detail || {};
      sendWebviewMessage(activeTabId, {
        action: 'HIGHLIGHT_SENTENCE',
        sentenceText,
        sentenceId,
        charIdx
      });
    };
    window.addEventListener('global-tts-boundary', handleTtsBoundary);
    return () => window.removeEventListener('global-tts-boundary', handleTtsBoundary);
  }, [activeTabId, sendWebviewMessage]);

  const handleTool = useCallback((toolId: string, tabId: string, payload?: any) => {
    if (!tabId) return;
    if (toolId === 'settings') {
      setIsTranslationSettingsOpen(true);
    } else if (toolId === 'autoTranslate' || toolId === 'translate') {
      const next = !autoStates[tabId];
      setAutoStates(prev => ({ ...prev, [tabId]: next }));
      sendWebviewMessage(tabId, { action: 'TOGGLE_AUTO_TRANSLATE', enabled: next });
      if (next) sendWebviewMessage(tabId, { action: 'FORCE_TRANSLATE' });
    } else if (toolId === 'audio') {
      if (activeAudioObj) {
        if (stopAudio) stopAudio(tabId);
      } else {
        sendWebviewMessage(tabId, { action: 'EXTRACT_TEXT' });
      }
    } else if (toolId === 'reload' || toolId === 'f5') {
      sendWebviewMessage(tabId, { action: 'RELOAD_PAGE' });
      const wv = document.getElementById('global-wv-' + tabId) as any;
      if (wv) {
        try {
          if (wv.tagName?.toLowerCase() === 'iframe' && wv.contentWindow) {
            wv.contentWindow.location.reload();
          } else if (wv.reload) {
            wv.reload();
          }
        } catch (e) {
          const s = wv.src;
          wv.src = 'about:blank';
          setTimeout(() => { wv.src = s; }, 50);
        }
      }
    } else if (toolId === 'teachNext' || toolId === 'teach_next') {
      sendWebviewMessage(tabId, { action: 'TEACH_NEXT' });
    } else if (toolId === 'nextChapter' || toolId === 'next') {
      sendWebviewMessage(tabId, { action: 'TRIGGER_NEXT', delay: payload?.delay ?? 0 });
    } else if (toolId === 'prevChapter' || toolId === 'prev') {
      sendWebviewMessage(tabId, { action: 'TRIGGER_PREV' });
    } else if (toolId === 'darkMode' || toolId === 'dark_mode') {
      try {
        const cur = localStorage.getItem('__tienhiep_dark_mode_active') === 'true';
        const next = !cur;
        localStorage.setItem('__tienhiep_dark_mode_active', String(next));
        sendWebviewMessage(tabId, { action: 'TOGGLE_DARK_MODE', enabled: next });
      } catch (e) {}
    } else if (toolId === 'cleanAds' || toolId === 'clean_ads') {
      sendWebviewMessage(tabId, { action: 'CLEAN_ADS', enabled: true });
    } else if (toolId === 'font_size_cycle') {
      sendWebviewMessage(tabId, { action: 'EXEC_HELPER', fn: 'cycleFontSize' });
    } else if (toolId === 'copy_text') {
      sendWebviewMessage(tabId, { action: 'COPY_TEXT' });
    } else if (toolId === 'scroll' || toolId === 'auto_scroll') {
      sendWebviewMessage(tabId, { action: 'TOGGLE_AUTOSCROLL' });
    } else if (toolId === 'force_translate') {
      sendWebviewMessage(tabId, { action: 'FORCE_TRANSLATE' });
    } else if (toolId === 'home' || toolId === 'scroll_top') {
      sendWebviewMessage(tabId, { action: 'SCROLL_TOP' });
      const wv = document.getElementById('global-wv-' + tabId) as HTMLIFrameElement | null;
      if (wv && wv.contentWindow) {
        try {
          wv.contentWindow.scrollTo({ top: 0, behavior: 'auto' });
          if (wv.contentDocument?.documentElement) wv.contentDocument.documentElement.scrollTop = 0;
          if (wv.contentDocument?.body) wv.contentDocument.body.scrollTop = 0;
        } catch (e) {}
      }
    } else if (toolId === 'end' || toolId === 'scroll_bottom') {
      sendWebviewMessage(tabId, { action: 'SCROLL_BOTTOM' });
      const wv = document.getElementById('global-wv-' + tabId) as HTMLIFrameElement | null;
      if (wv && wv.contentWindow) {
        try {
          const doc = wv.contentDocument || wv.contentWindow.document;
          const maxH = Math.max(doc?.body?.scrollHeight || 0, doc?.documentElement?.scrollHeight || 0);
          wv.contentWindow.scrollTo({ top: maxH, behavior: 'auto' });
          if (doc?.documentElement) doc.documentElement.scrollTop = maxH;
          if (doc?.body) doc.body.scrollTop = maxH;
        } catch (e) {}
      }
    }
  }, [autoStates, sendWebviewMessage, activeAudioObj, stopAudio]);

  return {
    autoStates, setAutoStates,
    toastInfo, setToastInfo,
    isTranslationSettingsOpen, setIsTranslationSettingsOpen,
    pinnedTools, setPinnedTools, togglePin,
    handleTool
  };
}
