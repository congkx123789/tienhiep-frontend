// Injected Bridge: IPC message event handling between Webview and React Host
export function getInjectedBridgeScript(): string {
  return `
    if (!window.__tienhiep_injected_ipc) {
      window.__tienhiep_injected_ipc = true;

      function scrollNovelTop() {
        try {
          window.scrollTo({ top: 0, behavior: 'auto' });
          if (document.documentElement) document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;
          const scrollables = document.querySelectorAll('div, section, article, main, #wrapper, .wrapper, #content, .content, #chaptercontent, .read-content, #main, .novel-content');
          for (let i = 0; i < scrollables.length; i++) {
            const el = scrollables[i];
            if (el && el.scrollHeight > el.clientHeight && el.scrollTop > 0) {
              el.scrollTop = 0;
            }
          }
        } catch(e) {}
      }

      function scrollNovelBottom() {
        try {
          const maxH = Math.max(
            document.body ? document.body.scrollHeight : 0,
            document.documentElement ? document.documentElement.scrollHeight : 0
          );
          window.scrollTo({ top: maxH, behavior: 'auto' });
          if (document.documentElement) document.documentElement.scrollTop = maxH;
          if (document.body) document.body.scrollTop = maxH;
          const scrollables = document.querySelectorAll('div, section, article, main, #wrapper, .wrapper, #content, .content, #chaptercontent, .read-content, #main, .novel-content');
          for (let i = 0; i < scrollables.length; i++) {
            const el = scrollables[i];
            if (el && el.scrollHeight > el.clientHeight) {
              el.scrollTop = el.scrollHeight;
            }
          }
        } catch(e) {}
      }

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
          let res = { title: document.title || 'Chương đọc', text: '' };
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.extractCleanChapterText === 'function') {
            try {
              const cleaned = window.__TienHiepHelpers.extractCleanChapterText();
              if (cleaned && cleaned.text && cleaned.text.trim().length > 20) {
                res = cleaned;
              }
            } catch(e) {}
          }
          if (!res.text || res.text.trim().length < 20) {
            res.text = (document.body ? document.body.innerText : '') || '';
            res.title = document.title || 'Chương đọc';
          }
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'AUDIO_TEXT_RES',
              tabId: window.__TIENHIEP_TAB_ID__,
              title: res.title,
              text: res.text,
              initialParaIdx: typeof data.initialParaIdx === 'number' ? data.initialParaIdx : 0
            }, '*');
          }
        } else if (action === 'TRANSLATE_RES' || action === 'translate_res') {
          if (typeof window.__receiveTranslations === 'function') {
            window.__receiveTranslations(data.id, data.translations || [], data.pageSessionId);
          }
        } else if (action === 'TOGGLE_AUTO_TRANSLATE') {
          const fn = (window.__TienHiepHelpers && window.__TienHiepHelpers.toggleAutoTranslate) || window.toggleAutoTranslate;
          if (typeof fn === 'function') {
            fn(data.enabled);
          }
        } else if (action === 'FORCE_TRANSLATE') {
          window.__autoTranslateEnabled = true;
          if (typeof window.__forceTranslateAll === 'function') {
            window.__forceTranslateAll();
          } else if (typeof window.__collectAndTranslateNodes === 'function') {
            window.__collectAndTranslateNodes(document.body || document.documentElement);
          }
        } else if (action === 'REVERT_ORIGINAL') {
          window.__autoTranslateEnabled = false;
          if (typeof window.__revertToOriginal === 'function') {
            window.__revertToOriginal();
          }
        } else if (action === 'TOGGLE_DARK_MODE') {
          window.__tienhiepDarkMode = !!data.enabled;
          if (typeof window.__ensureDarkMode === 'function') window.__ensureDarkMode();
        } else if (action === 'CLEAN_ADS') {
          window.__tienhiepCleanAds = !!data.enabled;
          if (typeof window.__ensureCleanAds === 'function') window.__ensureCleanAds();
        } else if (action === 'COPY_TEXT') {
          let res = { text: document.body ? document.body.innerText : '' };
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.extractCleanChapterText === 'function') {
            res = window.__TienHiepHelpers.extractCleanChapterText();
          }
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'COPY_TEXT_RES',
              tabId: window.__TIENHIEP_TAB_ID__,
              text: res.text
            }, '*');
          }
        } else if (action === 'SET_TTS_PLAYING') {
          window.isTtsPlaying = !!data.playing;
          if (!data.playing && window.__TienHiepHelpers && typeof window.__TienHiepHelpers.clearAllTtsHighlights === 'function') {
            window.__TienHiepHelpers.clearAllTtsHighlights(true);
          }
        } else if (action === 'CLEAR_TTS_HIGHLIGHTS') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.clearAllTtsHighlights === 'function') {
            window.__TienHiepHelpers.clearAllTtsHighlights(true);
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
        } else if (action === 'NAVIGATE_BACK') {
          window.history.back();
        } else if (action === 'NAVIGATE_FORWARD') {
          window.history.forward();
        } else if (action === 'SCROLL_TOP' || action === 'HOME' || action === 'home') {
          scrollNovelTop();
        } else if (action === 'SCROLL_BOTTOM' || action === 'END' || action === 'end') {
          scrollNovelBottom();
        } else if (action === 'RELOAD_PAGE' || action === 'reload' || action === 'f5') {
          window.location.reload();
        }
      });

      window.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (e.key === 'Home') {
          e.preventDefault();
          scrollNovelTop();
        } else if (e.key === 'End') {
          e.preventDefault();
          scrollNovelBottom();
        } else if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
          e.preventDefault();
          window.location.reload();
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
        let eff = (window.__TienHiepHelpers ? window.__TienHiepHelpers.getEffectiveUrl().href : '') || window.__originalUrl || '';
        if (!eff || eff.indexOf('chrome') === 0 || eff.indexOf('about:') === 0) {
          eff = window.__originalUrl || '';
        }
        if (eff && (eff.indexOf('http://') === 0 || eff.indexOf('https://') === 0)) {
          window.parent.postMessage({
            type: 'PAGE_LOADED',
            tabId: window.__TIENHIEP_TAB_ID__,
            url: eff,
            title: document.title
          }, '*');
        }
      }
    }
  `;
}
