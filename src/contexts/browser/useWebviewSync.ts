import { useState, useEffect, useCallback, useRef } from 'react';
import { ToastInfo, BrowserTab } from './BrowserContext.types';
import { executeTranslate, cleanNovelTabTitle, injectTranslateScriptToTab } from './browserHelpers';
import { ParagraphMenuState } from '../../types';

export function useWebviewSync(
  tabs: BrowserTab[],
  setTabs: React.Dispatch<React.SetStateAction<BrowserTab[]>>,
  activeTabId: string,
  sendWebviewMessage: (tabId: string, payload: any) => void,
  startAudioFromContent: (tabId: string, title: string, text: string, initialParaIdx?: number) => void,
  addToHistory: (url: string, title?: string) => void,
  stopAudio?: (tabId?: string) => void,
  activeAudioObj?: any,
  openNewTab?: (isPrivate?: boolean, initialUrl?: string) => string,
  navigateTab?: (tabId: string, url: string) => void,
  setUrlInput?: (url: string) => void
) {
  const lastAudioStartRef = useRef<{ tabId: string; textPrefix: string; time: number }>({ tabId: '', textPrefix: '', time: 0 });
  const [autoStates, setAutoStates] = useState<Record<string, boolean>>({});
  const [toastInfo, setToastInfo] = useState<ToastInfo | null>(null);
  const [isTranslationSettingsOpen, setIsTranslationSettingsOpen] = useState(false);
  const [paragraphMenu, setParagraphMenu] = useState<ParagraphMenuState | null>(null);
  const [pinnedTools, setPinnedTools] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('tienhiep_pinned_tools');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['autoTranslate', 'audio', 'teachNext', 'cleanAds', 'darkMode'];
  });

  const togglePin = useCallback((toolId: string) => {
    setPinnedTools(prev => {
      const list = Array.isArray(prev) ? prev : ['autoTranslate', 'audio', 'teachNext', 'cleanAds', 'darkMode'];
      const next = list.includes(toolId) ? list.filter(id => id !== toolId) : [...list, toolId];
      try { localStorage.setItem('tienhiep_pinned_tools', JSON.stringify(next)); } catch (e) { }
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

      if ((type === 'NAVIGATE_REQ' || type === 'INTERNAL_LINK_CLICKED') && url) {
        if (typeof url !== 'string' || !url.startsWith('http')) return;
        if (typeof window !== 'undefined' && (window as any).__tienhiep_active_audio) {
          try { (window as any).__tienhiep_active_audio.pause(); } catch {}
        }
        if ((e.data.newTab || e.data.isNewTab) && openNewTab) {
          openNewTab(false, url);
          addToHistory(url);
          return;
        }
        if (navigateTab) navigateTab(senderTabId, url);
        addToHistory(url);
      } else if (type === 'PAGE_LOADED') {
        if (typeof window !== 'undefined' && (window as any).__tienhiep_active_audio) {
          try { (window as any).__tienhiep_active_audio.pause(); } catch {}
        }
        const loadedUrl = (url && typeof url === 'string' && url.startsWith('http')) ? url.trim() : '';
        setTabs(prev => prev.map(t => {
          if (t.id !== senderTabId) return t;
          let currentStack = Array.isArray(t.historyStack) && t.historyStack.length > 0 ? [...t.historyStack] : [t.url];
          let currentIdx = typeof t.historyIndex === 'number' ? t.historyIndex : currentStack.length - 1;

          if (loadedUrl) {
            const currentEntry = currentStack[currentIdx] || '';
            const isSame = currentEntry === loadedUrl || currentEntry.replace(/\/+$/, '') === loadedUrl.replace(/\/+$/, '');
            if (!isSame) {
              if (currentIdx > 0 && currentStack[currentIdx - 1]?.replace(/\/+$/, '') === loadedUrl.replace(/\/+$/, '')) {
                currentIdx = currentIdx - 1;
              } else if (currentIdx < currentStack.length - 1 && currentStack[currentIdx + 1]?.replace(/\/+$/, '') === loadedUrl.replace(/\/+$/, '')) {
                currentIdx = currentIdx + 1;
              } else {
                currentStack = currentStack.slice(0, currentIdx + 1);
                currentStack.push(loadedUrl);
                currentIdx = currentStack.length - 1;
              }
            }
          }
          return {
            ...t,
            url: loadedUrl || t.url,
            initialUrl: loadedUrl || t.initialUrl || t.url,
            title: title ? cleanNovelTabTitle(title) : t.title,
            isLoading: false,
            historyStack: currentStack,
            historyIndex: currentIdx,
            canGoBack: currentIdx > 0,
            canGoForward: currentIdx < currentStack.length - 1
          };
        }));

        if (loadedUrl) {
          if (senderTabId === activeTabId && setUrlInput) setUrlInput(loadedUrl);
          addToHistory(loadedUrl, title);
        }
        const isExcludedUrl = loadedUrl?.includes('google.') || loadedUrl?.includes('youtube.');
        const isAutoTranslateGlobal = localStorage.getItem('__tienhiep_auto_translate_active') === 'true';
        if (!isExcludedUrl && (autoStates[senderTabId] || isAutoTranslateGlobal)) {
          if (!autoStates[senderTabId]) {
            setAutoStates(prev => ({ ...prev, [senderTabId]: true }));
          }
          setTimeout(() => {
            sendWebviewMessage(senderTabId, { action: 'TOGGLE_AUTO_TRANSLATE', enabled: true });
            sendWebviewMessage(senderTabId, { action: 'FORCE_TRANSLATE' });
          }, 300);
        }
        if (!isExcludedUrl && sessionStorage.getItem('__tienhiep_tts_active_' + senderTabId) === 'true') {
          if (!autoStates[senderTabId]) {
            setTimeout(() => {
              sendWebviewMessage(senderTabId, { action: 'EXTRACT_TEXT' });
            }, 500);
          }
        }
      } else if (type === 'TRANSLATE_REQ') {
        const reqData = e.data.payload || e.data;
        const reqId = reqData.id ?? id;
        const reqTexts = reqData.texts || texts;
        const reqSession = reqData.pageSessionId || '';
        if (reqId !== undefined && Array.isArray(reqTexts) && reqTexts.length > 0) {
          let translations = reqTexts;
          try { translations = await executeTranslate(reqTexts); } catch (_) { }
          const payload = { action: 'TRANSLATE_RES', id: reqId, pageSessionId: reqSession, translations };
          if (e.source && typeof (e.source as any).postMessage === 'function') {
            (e.source as any).postMessage(payload, '*');
          }
          sendWebviewMessage(senderTabId, payload);
        }
      } else if (type === 'TRANSLATION_COMPLETE') {
        if (text && sessionStorage.getItem('__tienhiep_tts_active_' + senderTabId) === 'true') {
          const cleanPrefix = (text || '').trim().slice(0, 80);
          const now = Date.now();
          if (
            lastAudioStartRef.current.tabId !== senderTabId ||
            lastAudioStartRef.current.textPrefix !== cleanPrefix ||
            now - lastAudioStartRef.current.time >= 1000
          ) {
            lastAudioStartRef.current = { tabId: senderTabId, textPrefix: cleanPrefix, time: now };
            startAudioFromContent(senderTabId, title || 'Chương đọc', text, 0);
          }
        }
      } else if (type === 'AUDIO_TEXT_RES') {
        if (text && text.trim().length > 0) {
          sessionStorage.setItem('__tienhiep_tts_active_' + senderTabId, 'true');
          const cleanPrefix = (text || '').trim().slice(0, 80);
          const now = Date.now();
          if (
            lastAudioStartRef.current.tabId !== senderTabId ||
            lastAudioStartRef.current.textPrefix !== cleanPrefix ||
            now - lastAudioStartRef.current.time >= 1000
          ) {
            lastAudioStartRef.current = { tabId: senderTabId, textPrefix: cleanPrefix, time: now };
            const startPIdx = typeof e.data.initialParaIdx === 'number' ? e.data.initialParaIdx : 0;
            startAudioFromContent(senderTabId, title || 'Chương đọc', text, startPIdx);
          }
        } else {
          setToastInfo({ message: 'Không trích xuất được nội dung để phát TTS!', type: 'warning' });
          setTimeout(() => setToastInfo(null), 4000);
        }
      } else if (type === 'TAP_PARAGRAPH') {
        const pIdx = typeof paraIdx === 'number' ? paraIdx : parseInt(paraIdx, 10);
        if (!isNaN(pIdx)) {
          sendWebviewMessage(activeTabId, { action: 'EXEC_HELPER', fn: 'highlightActiveParagraph', args: [pIdx] });
          const transTxt = (e.data.translatedText || text || '').trim();
          setParagraphMenu({ pIdx, translatedText: transTxt, rawText: (e.data.rawText || transTxt).trim(), x: typeof e.data.clientX === 'number' ? e.data.clientX : window.innerWidth / 2, y: typeof e.data.clientY === 'number' ? e.data.clientY : 150 });
        }
      } else if (type === 'START_TTS_FROM_PARAGRAPH') {
        const validIdx = typeof paraIdx === 'number' ? paraIdx : (parseInt(paraIdx, 10) || 0);
        sendWebviewMessage(activeTabId, { action: 'EXEC_HELPER', fn: 'highlightActiveParagraph', args: [validIdx] });
        sessionStorage.setItem('__tienhiep_tts_active_' + senderTabId, 'true');
        sendWebviewMessage(activeTabId, { action: 'EXTRACT_TEXT', initialParaIdx: validIdx });
      } else if (type === 'SMART_CONTENT_RULE_SAVED') {
        const { rule: smartRule, selector: sel, host: siteHost } = e.data;
        const totalParas = smartRule?.regions?.reduce((sum: number, r: any) => sum + (r.count || 0), 0) || 0;
        try { if (siteHost && smartRule) { localStorage.setItem('__tienhiep_smart_content_rule_' + siteHost, JSON.stringify(smartRule)); localStorage.setItem('__tienhiep_content_selector_' + siteHost, sel || ''); } } catch (err) { }
        setToastInfo({ message: `Đã lưu vùng đọc thông minh: ${totalParas} đoạn cho ${siteHost}`, type: 'success' });
      } else if (type === 'NEXT_RULE_SAVED') {
        const textSnippet = e.data.rule?.text || e.data.rule?.selector || 'nút chuyển';
        setToastInfo({ message: `🎯 Đã ghi nhớ nút: "${textSnippet}"!`, type: 'success' });
      } else if (type === 'CONTENT_AREA_SAVED') {
        setToastInfo({ message: `Đã lưu vùng đọc: ${selector} cho ${host}`, type: 'success' });
      } else if (type === 'NEXT_CHAPTER_NOT_FOUND') {
        setToastInfo({ message: 'Không tìm thấy nút Chương Sau! Hãy dùng tính năng Chỉ Định Nút Tiếp.', type: 'warning' });
      } else if (type === 'PREV_CHAPTER_NOT_FOUND') {
        setToastInfo({ message: 'Không tìm thấy nút Chương Trước trên trang này!', type: 'warning' });
      } else if (type === 'PARAGRAPH_EDITED') {
        setToastInfo({ message: (e.data.oldWord && e.data.newWord) ? `Đã đổi nghĩa: "${e.data.oldWord}" ➔ "${e.data.newWord}"` : 'Đã cập nhật câu văn trực tiếp!', type: 'success' });
      } else if (type === 'LAST_CHAPTER_REACHED') {
        setToastInfo({ message: 'Bạn đã đọc đến chương mới nhất của truyện!', type: 'info' });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTabId, setTabs, addToHistory, sendWebviewMessage, startAudioFromContent, openNewTab, autoStates]);

  useEffect(() => {
    if ((window as any).electron?.onOpenInNewTab && openNewTab) {
      const unsub = (window as any).electron.onOpenInNewTab((targetUrl: string) => {
        if (targetUrl && /^https?:\/\//i.test(targetUrl)) openNewTab(false, targetUrl);
      });
      return () => { if (typeof unsub === 'function') unsub(); };
    }
  }, [openNewTab]);

  useEffect(() => {
    const handleTtsBoundary = (e: any) => {
      const targetTabId = activeAudioObj?.tabId || activeTabId;
      if (!targetTabId) return;
      const { sentenceText, sentenceId, charIdx } = e.detail || {};
      sendWebviewMessage(targetTabId, { action: 'HIGHLIGHT_SENTENCE', sentenceText, sentenceId, charIdx });
    };
    window.addEventListener('global-tts-boundary', handleTtsBoundary);
    return () => window.removeEventListener('global-tts-boundary', handleTtsBoundary);
  }, [activeTabId, activeAudioObj?.tabId, sendWebviewMessage]);

  const handleTool = useCallback((toolId: string, tabId: string, payload?: any) => {
    if (!tabId) return;
    const ensureInjected = () => injectTranslateScriptToTab(tabId, sendWebviewMessage);

    if (toolId === 'settings') setIsTranslationSettingsOpen(true);
    else if (toolId === 'autoTranslate' || toolId === 'translate') {
      const next = !autoStates[tabId];
      setAutoStates(prev => ({ ...prev, [tabId]: next }));
      if (next) {
        ensureInjected();
        sendWebviewMessage(tabId, { action: 'TOGGLE_AUTO_TRANSLATE', enabled: true });
        sendWebviewMessage(tabId, { action: 'FORCE_TRANSLATE' });
        setToastInfo({ message: '⚡ Đang dịch trang web sang Tiếng Việt...', type: 'info' });
      } else {
        sendWebviewMessage(tabId, { action: 'TOGGLE_AUTO_TRANSLATE', enabled: false });
        sendWebviewMessage(tabId, { action: 'REVERT_ORIGINAL' });
        setToastInfo({ message: '🌐 Đã khôi phục chữ Hán nguyên bản', type: 'info' });
      }
      setTimeout(() => setToastInfo(null), 2500);
    } else if (toolId === 'audio') {
      try { const s = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'); s.volume = 0.01; s.play().catch(() => {}); } catch (_) {}
      if (activeAudioObj) { if (stopAudio) stopAudio(tabId); }
      else { ensureInjected(); sendWebviewMessage(tabId, { action: 'EXTRACT_TEXT' }); }
    } else if (toolId === 'reload' || toolId === 'f5') {
      sendWebviewMessage(tabId, { action: 'RELOAD_PAGE' });
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, refreshKey: (t.refreshKey || 0) + 1, isLoading: true } : t));
    } else if (toolId === 'teachNext' || toolId === 'teach_next') {
      ensureInjected(); sendWebviewMessage(tabId, { action: 'TEACH_NEXT' });
    } else if (toolId === 'nextChapter' || toolId === 'next') sendWebviewMessage(tabId, { action: 'TRIGGER_NEXT', delay: payload?.delay ?? 0 });
    else if (toolId === 'prevChapter' || toolId === 'prev') sendWebviewMessage(tabId, { action: 'TRIGGER_PREV' });
    else if (toolId === 'darkMode' || toolId === 'dark_mode') {
      const next = !(localStorage.getItem('__tienhiep_dark_mode_active') === 'true');
      localStorage.setItem('__tienhiep_dark_mode_active', String(next));
      sendWebviewMessage(tabId, { action: 'TOGGLE_DARK_MODE', enabled: next });
    } else if (toolId === 'cleanAds' || toolId === 'clean_ads') {
      const next = !(localStorage.getItem('__tienhiep_clean_ads_active') === 'true');
      localStorage.setItem('__tienhiep_clean_ads_active', String(next));
      sendWebviewMessage(tabId, { action: 'CLEAN_ADS', enabled: next });
    } else if (toolId === 'font_size_cycle') sendWebviewMessage(tabId, { action: 'EXEC_HELPER', fn: 'cycleFontSize' });
    else if (toolId === 'copy_text') sendWebviewMessage(tabId, { action: 'COPY_TEXT' });
    else if (toolId === 'scroll' || toolId === 'auto_scroll') sendWebviewMessage(tabId, { action: 'TOGGLE_AUTOSCROLL' });
    else if (toolId === 'force_translate') sendWebviewMessage(tabId, { action: 'FORCE_TRANSLATE' });
    else if (toolId === 'home' || toolId === 'scroll_top') {
      sendWebviewMessage(tabId, { action: 'SCROLL_TOP' });
      try { (document.getElementById('global-wv-' + tabId) as any)?.contentWindow?.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { }
    } else if (toolId === 'end' || toolId === 'scroll_bottom') {
      sendWebviewMessage(tabId, { action: 'SCROLL_BOTTOM' });
      const wv = document.getElementById('global-wv-' + tabId) as HTMLIFrameElement | null;
      try {
        const doc = wv?.contentDocument || wv?.contentWindow?.document;
        const maxH = Math.max(doc?.body?.scrollHeight || 0, doc?.documentElement?.scrollHeight || 0);
        wv?.contentWindow?.scrollTo({ top: maxH, behavior: 'auto' });
      } catch (e) { }
    }
  }, [autoStates, sendWebviewMessage, activeAudioObj, stopAudio]);

  return {
    autoStates, setAutoStates,
    toastInfo, setToastInfo,
    isTranslationSettingsOpen, setIsTranslationSettingsOpen,
    paragraphMenu, setParagraphMenu,
    pinnedTools, setPinnedTools, togglePin,
    handleTool
  };
}
