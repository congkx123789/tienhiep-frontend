// Injected Bridge: IPC message event handling between Webview and React Host
export function getInjectedBridgeScript(): string {
  return `
    if (!window.__tienhiep_injected_ipc) {
      window.__tienhiep_injected_ipc = true;
      window.addEventListener('message', (e) => {
        if (!e.data) return;
        const data = e.data;
        const action = data.action;

        if (action === 'TEACH_NEXT' || action === 'teach_next') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.startTeachNextMode === 'function') {
            window.__TienHiepHelpers.startTeachNextMode();
          }
        } else if (action === 'TRIGGER_NEXT' || action === 'next') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.checkAndTriggerAutoNext === 'function') {
            window.__TienHiepHelpers.checkAndTriggerAutoNext(true, data.delay || 0);
          }
        } else if (action === 'TRIGGER_PREV' || action === 'prev') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.checkAndTriggerAutoPrev === 'function') {
            window.__TienHiepHelpers.checkAndTriggerAutoPrev();
          }
        } else if (action === 'EXTRACT_TEXT' || action === 'audio') {
          let res = { title: document.title, text: document.body.innerText };
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.extractCleanChapterText === 'function') {
            res = window.__TienHiepHelpers.extractCleanChapterText();
          }
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'AUDIO_TEXT_RES',
              title: res.title,
              text: res.text
            }, '*');
          }
        } else if (action === 'TRANSLATE_RES' || action === 'translate_res') {
          if (typeof window.__receiveTranslations === 'function') {
            window.__receiveTranslations(data.id, data.translations || []);
          }
        } else if (action === 'TOGGLE_AUTO_TRANSLATE') {
          const fn = (window.__TienHiepHelpers && window.__TienHiepHelpers.toggleAutoTranslate) || window.toggleAutoTranslate;
          if (typeof fn === 'function') {
            fn(data.enabled);
          }
        } else if (action === 'FORCE_TRANSLATE') {
          const chineseRegex = /[\\u4e00-\\u9fa5]/;
          const sampleCheckText = (document.body ? document.body.innerText : '') || document.title || '';
          if (!chineseRegex.test(sampleCheckText)) {
            window.__autoTranslateEnabled = false;
            return;
          }
          window.__autoTranslateEnabled = true;
          if (typeof window.__collectAndTranslateNodes === 'function') {
            window.__collectAndTranslateNodes(document.body || document.documentElement);
          }
        } else if (action === 'TOGGLE_DARK_MODE') {
          window.__tienhiepDarkMode = !!data.enabled;
          if (typeof window.__ensureDarkMode === 'function') window.__ensureDarkMode();
        } else if (action === 'CLEAN_ADS') {
          window.__tienhiepCleanAds = !!data.enabled;
          if (typeof window.__ensureCleanAds === 'function') window.__ensureCleanAds();
        } else if (action === 'COPY_TEXT') {
          let res = { text: document.body.innerText };
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.extractCleanChapterText === 'function') {
            res = window.__TienHiepHelpers.extractCleanChapterText();
          }
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'COPY_TEXT_RES',
              text: res.text
            }, '*');
          }
        } else if (action === 'SET_TTS_PLAYING') {
          window.isTtsPlaying = !!data.playing;
          if (!data.playing && window.__TienHiepHelpers && typeof window.__TienHiepHelpers.clearAllTtsHighlights === 'function') {
            window.__TienHiepHelpers.clearAllTtsHighlights();
          }
        } else if (action === 'CLEAR_TTS_HIGHLIGHTS') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.clearAllTtsHighlights === 'function') {
            window.__TienHiepHelpers.clearAllTtsHighlights();
          }
        } else if (action === 'EXEC_HELPER') {
          if (data.fn && window.__TienHiepHelpers && typeof window.__TienHiepHelpers[data.fn] === 'function') {
            const args = Array.isArray(data.args) ? data.args : [];
            try { window.__TienHiepHelpers[data.fn](...args); } catch(err) {}
          }
        } else if (action === 'HIGHLIGHT_SENTENCE' || action === 'TTS_BOUNDARY') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.highlightSentence === 'function') {
            window.__TienHiepHelpers.highlightSentence(data.sentenceText, data.sentenceId);
          }
        } else if (action === 'TOGGLE_AUTOSCROLL') {
          if (window.__scrollInterval) {
            clearInterval(window.__scrollInterval);
            window.__scrollInterval = null;
          } else {
            const speed = data.speed || 30;
            window.__scrollInterval = setInterval(() => {
              window.scrollBy({ top: 1, behavior: 'instant' });
            }, speed);
          }
        }
      });

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
            window.__TienHiepHelpers.indexParagraphsForTTS();
          }
        }, 300);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
              window.__TienHiepHelpers.indexParagraphsForTTS();
            }
          }, 300);
        });
      }

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'PAGE_LOADED',
          url: (window.__TienHiepHelpers ? window.__TienHiepHelpers.getEffectiveUrl().href : '') || window.__originalUrl || window.location.href,
          title: document.title
        }, '*');
      }
    }
  `;
}
