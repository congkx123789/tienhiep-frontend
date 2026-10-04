export function getTranslatorQueueScript(useTypewriter: boolean = false): string {
  return `
    window.__pageSessionId = window.__pageSessionId || ('ps_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9));
    window.__translatePromises = window.__translatePromises || {};
    window.__transId = window.__transId || 0;
    window.__receiveTranslations = (id, results, pageSessionId) => {
      if (pageSessionId && pageSessionId !== window.__pageSessionId) return;
      if (window.__translatePromises[id]) {
        window.__translatePromises[id](results);
        delete window.__translatePromises[id];
      }
    };
    const resetTransSession = () => {
      window.__pageSessionId = 'ps_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      uniqueTranslateQueue.length = 0;
      targetGroupsMap.clear();
      window.__translatePromises = {};
      if (translateTimeout) { clearTimeout(translateTimeout); translateTimeout = null; }
    };
    window.__resetTransSession = resetTransSession;
    // Chi reset khi nguoi dung thuc su roi khoi trang (beforeunload), khong reset khi doi hash/popstate
    window.addEventListener('beforeunload', resetTransSession);

    window.__translationCache = window.__translationCache || new Map();
    window.__ti_translation_pairs = window.__ti_translation_pairs || new Map();
    window.__ti_original_title = window.__ti_original_title || (document ? document.title : "");
    let uniqueTranslateQueue = [], targetGroupsMap = new Map(), translateTimeout = null, isTranslating = false;
    let sweepRetryCount = 0;

    const _tiViRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    const _tiZhRegex = /[一-龥]/;

    function isGoodTranslation(orig, trans) {
      if (!trans || typeof trans !== 'string') return false;
      const t = trans.trim(), o = (orig || '').trim();
      if (!t || t === o) return false;
      if (_tiZhRegex.test(o) && _tiZhRegex.test(t) && !_tiViRegex.test(t)) return false;
      return true;
    }

    function streamTypewriterText(node, fullText) {
      if (!node || !node.parentNode) return;
      const words = fullText.split(' ');
      if (words.length <= 4) { node.nodeValue = fullText; return; }
      let currentIdx = 0;
      const step = Math.max(2, Math.ceil(words.length / 10));
      const timer = setInterval(() => {
        if (!node || !node.parentNode || !window.__autoTranslateEnabled) { clearInterval(timer); return; }
        currentIdx = Math.min(words.length, currentIdx + step);
        node.nodeValue = words.slice(0, currentIdx).join(' ');
        if (currentIdx >= words.length) { clearInterval(timer); node.nodeValue = fullText; }
      }, 16);
    }

    function applyTranslatedText(target, transText, enableStream = ${useTypewriter ? 'true' : 'false'}) {
      if (!window.__autoTranslateEnabled || !target || !transText) return;
      try {
        if (target.orig && _tiZhRegex.test(target.orig) && !_tiViRegex.test(target.orig)) {
          window.__ti_translation_pairs.set(transText, target.orig);
          const trT = transText.trim(), trO = target.orig.trim();
          if (trT && trO) {
            window.__ti_translation_pairs.set(trT, trO);
            const normT = trT.replace(/["“”]/g, '"');
            window.__ti_translation_pairs.set(normT, trO);
            const curlyT = trT.replace(/"/g, '“');
            window.__ti_translation_pairs.set(curlyT, trO);
          }
        }
        if (target.type === "text") {
          const node = target.node;
          if (!node || !node.parentNode || !document.contains(node)) return;
          if (isGoodTranslation(target.orig, transText) || _tiViRegex.test(transText)) {
            node.__ti_translated__ = true;
          }
          if (target.orig && _tiZhRegex.test(target.orig)) {
            if (!node.__original_chinese__) node.__original_chinese__ = target.orig;
          }
          if (target.orig && _tiZhRegex.test(target.orig) && !_tiViRegex.test(target.orig)) {
            const cleanOrig = target.orig.trim();
            let pNode = node.parentElement;
            while (pNode && pNode !== document.body) {
              if (pNode.hasAttribute('data-tts-idx') || pNode.classList.contains('tienhiep-tts-paragraph') || pNode.tagName === 'P') {
                const prevZh = pNode.getAttribute('data-orig-zh') || '';
                if (!prevZh || !_tiZhRegex.test(prevZh) || _tiViRegex.test(prevZh)) {
                  pNode.setAttribute('data-orig-zh', cleanOrig);
                } else if (!prevZh.includes(cleanOrig)) {
                  pNode.setAttribute('data-orig-zh', prevZh + ' ' + cleanOrig);
                }
                break;
              }
              pNode = pNode.parentElement;
            }
          }
          enableStream ? streamTypewriterText(node, transText) : (node.nodeValue = transText);
        } else if (target.type === "attr") {
          const el = target.element;
          if (!el || !document.contains(el)) return;
          el.setAttribute(target.attr, transText);
          if (target.attr === "value" && "value" in el) el.value = transText;
        } else if (target.type === "title") {
          document.title = transText;
          if (window.parent && window.parent !== window) window.parent.postMessage({ type: "TITLE_UPDATED", title: transText }, "*");
        }
      } catch(e) {}
    }

    async function processTranslateQueue() {
      if (uniqueTranslateQueue.length === 0 || isTranslating || !window.__autoTranslateEnabled) return;
      isTranslating = true;
      const curSession = window.__pageSessionId;
      const batchUniqueTexts = uniqueTranslateQueue.splice(0, 50);
      try {
        const id = window.__transId++;
        const reqPayload = JSON.stringify({ id, pageSessionId: curSession, texts: batchUniqueTexts });
        const translations = await new Promise((resolve) => {
          window.__translatePromises[id] = resolve;
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "TRANSLATE_REQ", id, pageSessionId: curSession, texts: batchUniqueTexts }, "*");
          }
          console.log("[TRANSLATE_REQ]" + reqPayload);
          setTimeout(() => {
            if (window.__translatePromises[id]) {
              window.__translatePromises[id]([]);
              delete window.__translatePromises[id];
            }
          }, 15000);
        });

        if (!window.__autoTranslateEnabled || curSession !== window.__pageSessionId) {
          uniqueTranslateQueue.length = 0;
          targetGroupsMap.clear();
          return;
        }

        if (translations && Array.isArray(translations)) {
          if (window.__autoTranslateObserver) {
            try { window.__autoTranslateObserver.disconnect(); } catch(e) {}
          }
          batchUniqueTexts.forEach((origText, idx) => {
            const trans = translations[idx];
            if (isGoodTranslation(origText, trans)) {
              window.__translationCache.set(origText, trans);
              const trimmed = origText.trim();
              if (trimmed) window.__translationCache.set(trimmed, trans.trim());
              const targets = targetGroupsMap.get(origText) || [];
              targets.forEach(t => applyTranslatedText(t, trans));
              targetGroupsMap.delete(origText);
            }
          });

          if (window.__autoTranslateObserver && window.__autoTranslateEnabled) {
            const root = document.body || document.documentElement;
            if (root) {
              try { window.__autoTranslateObserver.observe(root, { childList: true, subtree: true, characterData: true }); } catch(e) {}
            }
          }
        }
      } catch(err) {
        console.error("[Translate Batch Error]", err);
      } finally {
        isTranslating = false;
        if (!window.__autoTranslateEnabled || curSession !== window.__pageSessionId) {
          uniqueTranslateQueue.length = 0;
          targetGroupsMap.clear();
          return;
        }
        if (uniqueTranslateQueue.length > 0) {
          setTimeout(processTranslateQueue, 10);
        } else {
          clearTimeout(window.__translateCompleteTimeout);
          window.__translateCompleteTimeout = setTimeout(() => {
            // SWEEP PASS: Quet vet kiem tra triet de truoc khi bao hoan tat
            if (window.__autoTranslateEnabled && typeof window.__sweepUntranslatedNodes === 'function') {
              const missed = window.__sweepUntranslatedNodes();
              if (missed > 0 && sweepRetryCount < 3) {
                sweepRetryCount++;
                console.log("[Translate Sweep Pass] Con " + missed + " nodes chua dich, tiep tuc dich dot " + sweepRetryCount);
                processTranslateQueue();
                return;
              }
            }
            sweepRetryCount = 0;

            if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
              window.__TienHiepHelpers.indexParagraphsForTTS();
            }
            if (window.__lastTtsSentence && window.__TienHiepHelpers && typeof window.__TienHiepHelpers.highlightSentence === 'function') {
              window.__TienHiepHelpers.highlightSentence(window.__lastTtsSentence);
            }
            if (window.parent && window.parent !== window) {
              let res = { title: document.title, text: document.body.innerText };
              if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.extractCleanChapterText === 'function') {
                res = window.__TienHiepHelpers.extractCleanChapterText();
              }
              window.parent.postMessage({ type: "TRANSLATION_COMPLETE", title: res.title, text: res.text }, "*");
            }
          }, 350);
        }
      }
    }
  `;
}
