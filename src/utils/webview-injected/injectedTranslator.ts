// Injected Translator: DOM text scanner, batch queue, typewriter effect and cache
export function getInjectedTranslatorScript(useTypewriter: boolean = false): string {
  return `
    window.__translatePromises = window.__translatePromises || {};
    window.__transId = window.__transId || 0;
    window.__receiveTranslations = (id, results) => {
      if (window.__translatePromises[id]) {
        window.__translatePromises[id](results);
        delete window.__translatePromises[id];
      }
    };

    window.__translationCache = window.__translationCache || new Map();
    let uniqueTranslateQueue = [];
    let targetGroupsMap = new Map();
    let translateTimeout = null;
    let isTranslating = false;

    function streamTypewriterText(node, fullText) {
      if (!node || !node.parentNode) return;
      const words = fullText.split(' ');
      if (words.length <= 4) { node.nodeValue = fullText; return; }
      let currentIdx = 0;
      const step = Math.max(2, Math.ceil(words.length / 10));
      const timer = setInterval(() => {
        if (!node || !node.parentNode) { clearInterval(timer); return; }
        currentIdx = Math.min(words.length, currentIdx + step);
        node.nodeValue = words.slice(0, currentIdx).join(' ');
        if (currentIdx >= words.length) { clearInterval(timer); node.nodeValue = fullText; }
      }, 16);
    }

    function applyTranslatedText(target, transText, enableStream = ${useTypewriter ? 'true' : 'false'}) {
      if (!target || !transText) return;
      try {
        if (target.type === "text") {
          const node = target.node;
          if (!node || !node.parentNode) return;
          enableStream ? streamTypewriterText(node, transText) : (node.nodeValue = transText);
        } else if (target.type === "attr") {
          const el = target.element;
          if (!el) return;
          el.setAttribute(target.attr, transText);
          if (target.attr === "value" && "value" in el) el.value = transText;
        } else if (target.type === "title") {
          document.title = transText;
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "TITLE_UPDATED", title: transText }, "*");
          }
        }
      } catch(e) {}
    }

    async function processTranslateQueue() {
      if (uniqueTranslateQueue.length === 0 || isTranslating || !window.__autoTranslateEnabled) return;
      isTranslating = true;
      const batchUniqueTexts = uniqueTranslateQueue.splice(0, 120);
      try {
        const id = window.__transId++;
        const reqPayload = JSON.stringify({ id, texts: batchUniqueTexts });
        const translations = await new Promise((resolve) => {
          window.__translatePromises[id] = resolve;
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "TRANSLATE_REQ", id, texts: batchUniqueTexts }, "*");
          }
          console.log("[TRANSLATE_REQ]" + reqPayload);
          setTimeout(() => {
            if (window.__translatePromises[id]) {
              window.__translatePromises[id]([]);
              delete window.__translatePromises[id];
            }
          }, 3500);
        });

        if (translations && Array.isArray(translations)) {
          if (window.__autoTranslateObserver) {
            try { window.__autoTranslateObserver.disconnect(); } catch(e) {}
          }
          batchUniqueTexts.forEach((origText, idx) => {
            const trans = translations[idx];
            if (trans) {
              window.__translationCache.set(origText, trans);
              const trimmed = origText.trim();
              if (trimmed && !window.__translationCache.has(trimmed)) {
                window.__translationCache.set(trimmed, trans.trim());
              }
              const targets = targetGroupsMap.get(origText) || [];
              targets.forEach(t => applyTranslatedText(t, trans));
              targetGroupsMap.delete(origText);
            }
          });

          if (window.__autoTranslateObserver) {
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
        if (uniqueTranslateQueue.length > 0) {
          setTimeout(processTranslateQueue, 10);
        } else {
          clearTimeout(window.__translateCompleteTimeout);
          window.__translateCompleteTimeout = setTimeout(() => {
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
          }, 300);
        }
      }
    }

    window.__collectAndTranslateNodes = (root) => {
      if (!window.__autoTranslateEnabled) return;
      const chineseRegex = /[\\u4e00-\\u9fa5]/;
      const currentRoot = root || document.body || document.documentElement;
      if (!currentRoot) return;

      const sampleCheckText = (document.body ? document.body.innerText : '') || document.title || '';
      if (!chineseRegex.test(sampleCheckText)) return;

      if (document.title && chineseRegex.test(document.title)) {
        const rawTitle = document.title.trim();
        if (window.__translationCache.has(rawTitle)) {
          applyTranslatedText({ type: "title" }, window.__translationCache.get(rawTitle));
        } else {
          if (!targetGroupsMap.has(rawTitle)) {
            targetGroupsMap.set(rawTitle, []);
            uniqueTranslateQueue.push(rawTitle);
          }
          targetGroupsMap.get(rawTitle).push({ type: "title", orig: rawTitle });
        }
      }

      try {
        const walker = document.createTreeWalker(currentRoot, NodeFilter.SHOW_TEXT, {
          acceptNode: function(node) {
            if (!node || !node.nodeValue) return NodeFilter.FILTER_REJECT;
            const parent = node.parentNode;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.nodeName;
            if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA") return NodeFilter.FILTER_REJECT;
            if (parent.closest && parent.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"]')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        });

        let node = walker.nextNode();
        while (node) {
          const rawVal = node.nodeValue;
          if (rawVal && chineseRegex.test(rawVal)) {
            const trimmed = rawVal.trim();
            if (trimmed.length > 0) {
              if (!node.__original_chinese__) node.__original_chinese__ = rawVal;
              if (window.__translationCache.has(rawVal)) {
                node.nodeValue = window.__translationCache.get(rawVal);
              } else if (window.__translationCache.has(trimmed)) {
                node.nodeValue = rawVal.replace(trimmed, window.__translationCache.get(trimmed));
              } else {
                if (!targetGroupsMap.has(rawVal)) {
                  targetGroupsMap.set(rawVal, []);
                  uniqueTranslateQueue.push(rawVal);
                }
                const list = targetGroupsMap.get(rawVal);
                if (!list.some(t => t.node === node)) list.push({ type: "text", node: node, orig: rawVal });
              }
            }
          }
          node = walker.nextNode();
        }
      } catch(e) {}

      try {
        if (currentRoot.querySelectorAll) {
          const attrEls = currentRoot.querySelectorAll('[placeholder], [title], [alt], input[type="button"], input[type="submit"]');
          attrEls.forEach(el => {
            ["placeholder", "title", "alt", "value"].forEach(attr => {
              const val = el.getAttribute(attr);
              if (val && chineseRegex.test(val)) {
                if (window.__translationCache.has(val)) {
                  applyTranslatedText({ type: "attr", element: el, attr }, window.__translationCache.get(val));
                } else {
                  if (!targetGroupsMap.has(val)) {
                    targetGroupsMap.set(val, []);
                    uniqueTranslateQueue.push(val);
                  }
                  const list = targetGroupsMap.get(val);
                  if (!list.some(t => t.element === el && t.attr === attr)) {
                    list.push({ type: "attr", element: el, attr, orig: val });
                  }
                }
              }
            });
          });
        }
      } catch(e) {}

      if (uniqueTranslateQueue.length > 0 && !translateTimeout) {
        translateTimeout = setTimeout(() => { translateTimeout = null; processTranslateQueue(); }, 10);
      }
    };

    window.toggleAutoTranslate = (enabled) => {
      if (enabled) {
        const chineseRegex = /[\\u4e00-\\u9fa5]/;
        const sampleCheckText = (document.body ? document.body.innerText : '') || document.title || '';
        if (!chineseRegex.test(sampleCheckText)) { window.__autoTranslateEnabled = false; return; }
      }
      window.__autoTranslateEnabled = enabled;
      if (window.__TienHiepHelpers) window.__TienHiepHelpers.__autoTranslateEnabled = enabled;
      if (enabled) {
        if (window.__autoTranslateObserver && rootTarget) {
          try { window.__autoTranslateObserver.observe(rootTarget, { childList: true, subtree: true, characterData: true }); } catch(e) {}
        }
        if (typeof window.__collectAndTranslateNodes === "function") {
          window.__collectAndTranslateNodes(document.body || document.documentElement);
        }
      } else {
        if (window.__autoTranslateObserver) {
          try { window.__autoTranslateObserver.disconnect(); } catch(e) {}
        }
        uniqueTranslateQueue.length = 0;
        targetGroupsMap.clear();
        if (translateTimeout) { clearTimeout(translateTimeout); translateTimeout = null; }
        const b = document.getElementById("__teach_next_banner");
        if (b) b.remove();
        const box = document.getElementById("__teach_highlighter_box");
        if (box) box.remove();
        try {
          const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT, null);
          let n = walker.nextNode();
          while (n) {
            if (n.__original_chinese__) n.nodeValue = n.__original_chinese__;
            n = walker.nextNode();
          }
        } catch(e) {}
      }
      return enabled;
    };

    if (window.__TienHiepHelpers) window.__TienHiepHelpers.toggleAutoTranslate = window.toggleAutoTranslate;
    try {
      if (localStorage.getItem("__tienhiep_auto_translate_active") === "true") {
        setTimeout(() => { if (typeof window.toggleAutoTranslate === "function") window.toggleAutoTranslate(true); }, 300);
      }
    } catch(e) {}
  `;
}
