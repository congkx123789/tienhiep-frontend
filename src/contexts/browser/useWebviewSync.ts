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
  addToHistory: (url: string, title?: string) => void
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
      const { type, id, texts, url, title, text, paraIdx, sentenceText, selector, host } = e.data;

      if (type === 'NAVIGATE_REQ' && url) {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url, initialUrl: url, title: 'Đang tải...' } : t));
        addToHistory(url);
      } else if (type === 'PAGE_LOADED') {
        if (url) {
          setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url, title: cleanNovelTabTitle(title || t.title), isLoading: false } : t));
          addToHistory(url, title);
        }
      } else if (type === 'TRANSLATE_REQ' && id !== undefined && Array.isArray(texts)) {
        try {
          const translations = await executeTranslate(texts);
          sendWebviewMessage(activeTabId, { action: 'TRANSLATE_RES', id, translations });
        } catch (err) {
          sendWebviewMessage(activeTabId, { action: 'TRANSLATE_RES', id, translations: texts });
        }
      } else if (type === 'AUDIO_TEXT_RES') {
        if (text) startAudioFromContent(activeTabId, title || 'Chương đọc', text, 0);
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
      } else if (type === 'LAST_CHAPTER_REACHED') {
        setToastInfo({ message: 'Bạn đã đọc đến chương mới nhất của truyện!', type: 'info' });
        setTimeout(() => setToastInfo(null), 5000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTabId, setTabs, addToHistory, sendWebviewMessage, startAudioFromContent]);

  const handleTool = useCallback((toolId: string, tabId: string) => {
    if (!tabId) return;
    if (toolId === 'autoTranslate') {
      const next = !autoStates[tabId];
      setAutoStates(prev => ({ ...prev, [tabId]: next }));
      sendWebviewMessage(tabId, { action: 'TOGGLE_AUTO_TRANSLATE', enabled: next });
    } else if (toolId === 'audio') {
      sendWebviewMessage(tabId, { action: 'EXTRACT_TEXT' });
    } else if (toolId === 'teachNext') {
      sendWebviewMessage(tabId, { action: 'TEACH_NEXT' });
    } else if (toolId === 'nextChapter') {
      sendWebviewMessage(tabId, { action: 'TRIGGER_NEXT', delay: 0 });
    } else if (toolId === 'prevChapter') {
      sendWebviewMessage(tabId, { action: 'TRIGGER_PREV' });
    } else if (toolId === 'darkMode') {
      try {
        const cur = localStorage.getItem('__tienhiep_dark_mode_active') === 'true';
        const next = !cur;
        localStorage.setItem('__tienhiep_dark_mode_active', String(next));
        sendWebviewMessage(tabId, { action: 'TOGGLE_DARK_MODE', enabled: next });
      } catch (e) {}
    } else if (toolId === 'cleanAds') {
      sendWebviewMessage(tabId, { action: 'CLEAN_ADS', enabled: true });
    }
  }, [autoStates, sendWebviewMessage]);

  return {
    autoStates, setAutoStates,
    toastInfo, setToastInfo,
    isTranslationSettingsOpen, setIsTranslationSettingsOpen,
    pinnedTools, setPinnedTools, togglePin,
    handleTool
  };
}
