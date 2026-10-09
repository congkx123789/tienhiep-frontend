import { useState, useRef, useCallback } from 'react';
import { ActiveAudioBook, BrowserTab } from './BrowserContext.types';
import { ensureVietnameseText } from './browserHelpers';
import { useBrowserAudioChapter } from './useBrowserAudioChapter';
import { splitAndMergeSentences } from '../../utils/sentenceSplitter';

export function useBrowserAudio(tabs: BrowserTab[], setTabs: React.Dispatch<React.SetStateAction<BrowserTab[]>>) {
  const [activeAudioObj, setActiveAudioObj] = useState<ActiveAudioBook | null>(null);
  const autoAudioStatesRef = useRef<Record<string, boolean>>({});
  const activeAudioObjRef = useRef<ActiveAudioBook | null>(null);
  activeAudioObjRef.current = activeAudioObj;

  const sendWebviewMessage = useCallback((tabId: string, payload: any) => {
    let sent = false;
    if (tabId) {
      const wv = document.getElementById('global-wv-' + tabId) as any;
      if (wv) {
        const isIframe = wv.tagName?.toLowerCase() === 'iframe';
        if (isIframe && wv.contentWindow) {
          wv.contentWindow.postMessage(payload, '*');
          sent = true;
        } else if (wv.executeJavaScript) {
          wv.executeJavaScript(`window.postMessage(${JSON.stringify(payload)}, '*');`);
          sent = true;
        }
      }
    }
    if (!sent) {
      const iframes = document.querySelectorAll('iframe[id^="global-wv-"]');
      iframes.forEach((frame: any) => {
        try {
          if (frame.contentWindow) {
            frame.contentWindow.postMessage(payload, '*');
          }
        } catch (e) { }
      });
    }
  }, []);

  const { handleGlobalNextChapter, handleGlobalPrevChapter } = useBrowserAudioChapter(
    activeAudioObjRef,
    setActiveAudioObj,
    sendWebviewMessage
  );

  /**
   * startAudioFromContent — phát TTS từ nội dung web tab.
   * Nếu đã là tiếng Việt -> khởi phát ngay tức thì, không dịch lại.
   */
  const startAudioFromContent = useCallback(async (
    tabId: string,
    rawTitle: string,
    rawText: string,
    initialParaIdx: number = 0
  ) => {
    const tab = tabs.find(t => t.id === tabId);

    autoAudioStatesRef.current[tabId] = true;
    sendWebviewMessage(tabId, { action: 'SET_TTS_PLAYING', playing: true });

    const hasChinese = /[\u4e00-\u9fa5]/.test(rawText || '') || /[\u4e00-\u9fa5]/.test(rawTitle || '');
    let title = rawTitle || tab?.title || 'Chương đọc';
    let text = rawText || '';

    if (hasChinese) {
      const paras = text.split('\n');
      const startP = Math.max(0, initialParaIdx || 0);
      const endP = Math.min(paras.length, startP + 3);

      // Fast-path: Dịch nhanh tiêu đề và 3 đoạn ưu tiên đầu tiên (< 30ms) để phát âm thanh tức thì!
      const priorityBatch: string[] = [];
      const priorityMapping: Array<{ type: 'title' | 'para'; idx?: number }> = [];
      if (/[\u4e00-\u9fa5]/.test(title)) {
        priorityBatch.push(title);
        priorityMapping.push({ type: 'title' });
      }
      for (let pi = startP; pi < endP; pi++) {
        if (/[\u4e00-\u9fa5]/.test(paras[pi])) {
          priorityBatch.push(paras[pi]);
          priorityMapping.push({ type: 'para', idx: pi });
        }
      }

      if (priorityBatch.length > 0) {
        const transPriority = await ensureVietnameseText(title, priorityBatch.join('\n'));
        if (transPriority.title) title = transPriority.title;
        if (transPriority.text) {
          const transPList = transPriority.text.split('\n');
          priorityMapping.forEach((m, idx) => {
            if (m.type === 'para' && m.idx !== undefined && transPList[idx]) {
              paras[m.idx] = transPList[idx];
            }
          });
        }
        text = paras.join('\n');
      }

      if (!autoAudioStatesRef.current[tabId]) return;

      let startSentenceIdx = 0;
      let startSnippet = '';
      if (initialParaIdx && initialParaIdx > 0 && text) {
        let count = 0;
        for (let pi = 0; pi < initialParaIdx && pi < paras.length; pi++) {
          const p = paras[pi].trim();
          if (!p) continue;
          count += splitAndMergeSentences(p).length;
        }
        startSentenceIdx = count;
        if (paras[initialParaIdx]) {
          startSnippet = paras[initialParaIdx].trim().slice(0, 40);
        }
      }

      setActiveAudioObj({
        title: title || tab?.title || 'Chương đọc',
        title_vietphrase: title || tab?.title || 'Chương đọc',
        author: 'Trình đọc Web',
        author_hanviet: 'Trình đọc Web',
        sourceUrl: tab?.url,
        tabId,
        currentChapterTitle: title,
        currentChapterContent: text,
        initialParaIdx,
        startSentenceIdx,
        startSnippet,
        isChapter: true,
        playType: 'online' as any
      });

      // Dịch ngầm phần còn lại của toàn chương trong background mà không chặn luồng âm thanh
      ensureVietnameseText(rawTitle, rawText).then(fullRes => {
        if (!autoAudioStatesRef.current[tabId]) return;
        if (fullRes && fullRes.text && fullRes.text !== text) {
          setActiveAudioObj(prev => {
            if (!prev || prev.tabId !== tabId) return prev;
            return {
              ...prev,
              title: fullRes.title || prev.title,
              title_vietphrase: fullRes.title || prev.title_vietphrase,
              currentChapterTitle: fullRes.title || prev.currentChapterTitle,
              currentChapterContent: fullRes.text
            };
          });
        }
      }).catch(() => {});

      return;
    }

    if (!autoAudioStatesRef.current[tabId]) return;

    let startSentenceIdx = 0;
    let startSnippet = '';
    if (initialParaIdx && initialParaIdx > 0 && text) {
      const paragraphs = text.split(/\n+/);
      let count = 0;
      for (let pi = 0; pi < initialParaIdx && pi < paragraphs.length; pi++) {
        const p = paragraphs[pi].trim();
        if (!p) continue;
        count += splitAndMergeSentences(p).length;
      }
      startSentenceIdx = count;
      if (paragraphs[initialParaIdx]) {
        startSnippet = paragraphs[initialParaIdx].trim().slice(0, 40);
      }
    }

    setActiveAudioObj({
      title: title || tab?.title || 'Chương đọc',
      title_vietphrase: title || tab?.title || 'Chương đọc',
      author: 'Trình đọc Web',
      author_hanviet: 'Trình đọc Web',
      sourceUrl: tab?.url,
      tabId,
      currentChapterTitle: title,
      currentChapterContent: text,
      initialParaIdx,
      startSentenceIdx,
      startSnippet,
      isChapter: true,
      playType: 'online' as any
    });
  }, [tabs, sendWebviewMessage]);

  const stopAudio = useCallback((tabId?: string) => {
    const targetTabId = tabId || activeAudioObjRef.current?.tabId;
    if (targetTabId) {
      autoAudioStatesRef.current[targetTabId] = false;
      try { sessionStorage.removeItem('__tienhiep_tts_active_' + targetTabId); } catch (e) { }
      sendWebviewMessage(targetTabId, { action: 'SET_TTS_PLAYING', playing: false });
      sendWebviewMessage(targetTabId, { action: 'CLEAR_TTS_HIGHLIGHTS' });
    }
    setActiveAudioObj(null);
  }, [sendWebviewMessage]);

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
