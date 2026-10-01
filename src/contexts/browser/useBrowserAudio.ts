// Browser Audio and Persistent TTS player controller
import { useState, useRef, useCallback } from 'react';
import { ActiveAudioBook, BrowserTab } from './BrowserContext.types';
import { ensureVietnameseText } from './browserHelpers';

export function useBrowserAudio(tabs: BrowserTab[], setTabs: React.Dispatch<React.SetStateAction<BrowserTab[]>>) {
  const [activeAudioObj, setActiveAudioObj] = useState<ActiveAudioBook | null>(null);
  const autoAudioStatesRef = useRef<Record<string, boolean>>({});

  const sendWebviewMessage = useCallback((tabId: string, payload: any) => {
    const wv = document.getElementById('global-wv-' + tabId) as any;
    if (!wv) return;
    const isIframe = wv.tagName?.toLowerCase() === 'iframe';
    if (isIframe && wv.contentWindow) {
      wv.contentWindow.postMessage(payload, '*');
    } else if (wv.executeJavaScript) {
      wv.executeJavaScript(`window.postMessage(${JSON.stringify(payload)}, '*');`);
    }
  }, []);

  const handleGlobalNextChapter = useCallback((tabId?: string) => {
    const targetTabId = tabId || activeAudioObj?.tabId;
    if (targetTabId) {
      sendWebviewMessage(targetTabId, { action: 'TRIGGER_NEXT', delay: 0 });
    }
  }, [activeAudioObj?.tabId, sendWebviewMessage]);

  const handleGlobalPrevChapter = useCallback((tabId?: string) => {
    const targetTabId = tabId || activeAudioObj?.tabId;
    if (targetTabId) {
      sendWebviewMessage(targetTabId, { action: 'TRIGGER_PREV' });
    }
  }, [activeAudioObj?.tabId, sendWebviewMessage]);

  const startAudioFromContent = useCallback(async (tabId: string, rawTitle: string, rawText: string, initialParaIdx: number = 0) => {
    const { title, text } = await ensureVietnameseText(rawTitle, rawText);
    const tab = tabs.find(t => t.id === tabId);
    
    autoAudioStatesRef.current[tabId] = true;
    sendWebviewMessage(tabId, { action: 'SET_TTS_PLAYING', playing: true });

    setActiveAudioObj({
      title: title || tab?.title || 'Chương đọc',
      author: 'Trình đọc Web',
      sourceUrl: tab?.url,
      tabId,
      currentChapterTitle: title,
      currentChapterContent: text,
      initialParaIdx
    });
  }, [tabs, sendWebviewMessage]);

  const stopAudio = useCallback((tabId?: string) => {
    const targetTabId = tabId || activeAudioObj?.tabId;
    if (targetTabId) {
      autoAudioStatesRef.current[targetTabId] = false;
      sendWebviewMessage(targetTabId, { action: 'SET_TTS_PLAYING', playing: false });
      sendWebviewMessage(targetTabId, { action: 'CLEAR_TTS_HIGHLIGHTS' });
    }
    setActiveAudioObj(null);
  }, [activeAudioObj?.tabId, sendWebviewMessage]);

  return {
    activeAudioObj, setActiveAudioObj,
    autoAudioStatesRef,
    sendWebviewMessage,
    handleGlobalNextChapter,
    handleGlobalPrevChapter,
    startAudioFromContent,
    stopAudio
  };
}
