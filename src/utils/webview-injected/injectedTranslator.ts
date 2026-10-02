// Injected Translator: DOM text scanner, batch queue, typewriter effect and cache
export function getInjectedTranslatorScript(useTypewriter: boolean = false): string {
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
    window.addEventListener('beforeunload', resetTransSession);
    window.addEventListener('popstate', resetTransSession);
    window.addEventListener('hashchange', resetTransSession);

    window.__translationCache = window.__translationCache || new Map();
    window.__ti_translation_pairs = window.__ti_translation_pairs || new Map();
    window.__ti_original_title = window.__ti_original_title || (document ? document.title : "");
    let uniqueTranslateQueue = [], targetGroupsMap = new Map(), translateTimeout = null, isTranslating = false;

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
        if (target.orig) {
          window.__ti_translation_pairs.set(transText, target.orig);
          const trT = transText.trim(), trO = target.orig.trim();
          if (trT && trO) window.__ti_translation_pairs.set(trT, trO);
        }
        if (target.type === "text") {
          const node = target.node;
          if (!node || !node.parentNode || !document.contains(node)) return;
          if (target.orig && !node.__original_chinese__) {
            node.__original_chinese__ = target.orig;
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

        if (curSession !== window.__pageSessionId) return;

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
      window.__autoTranslateEnabled = enabled;
      if (window.__TienHiepHelpers) window.__TienHiepHelpers.__autoTranslateEnabled = enabled;
      try { localStorage.setItem('__tienhiep_auto_translate_active', String(enabled)); } catch(e) {}
      if (enabled) {
        const rootEl = document.body || document.documentElement;
        if (window.__autoTranslateObserver && rootEl) {
          try { window.__autoTranslateObserver.observe(rootEl, { childList: true, subtree: true, characterData: true }); } catch(e) {}
        }
        if (typeof window.__collectAndTranslateNodes === "function") window.__collectAndTranslateNodes(rootEl);
      } else {
        if (window.__autoTranslateObserver) { try { window.__autoTranslateObserver.disconnect(); } catch(e) {} }
        uniqueTranslateQueue.length = 0;
        targetGroupsMap.clear();
        if (translateTimeout) { clearTimeout(translateTimeout); translateTimeout = null; }
        const b = document.getElementById("__teach_next_banner"); if (b) b.remove();
        const box = document.getElementById("__teach_highlighter_box"); if (box) box.remove();
        if (window.__ti_original_title) document.title = window.__ti_original_title;
        try {
          const rootEl = document.body || document.documentElement;
          if (rootEl) {
            const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
              acceptNode: (n) => (n && n.nodeValue ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
            });
            let n = walker.nextNode();
            while (n) {
              const cur = n.nodeValue;
              if (n.__original_chinese__) {
                n.nodeValue = n.__original_chinese__;
              } else if (cur && window.__ti_translation_pairs?.has(cur)) {
                n.nodeValue = window.__ti_translation_pairs.get(cur);
              } else if (cur && window.__ti_translation_pairs) {
                const tr = cur.trim();
                if (tr && window.__ti_translation_pairs.has(tr)) n.nodeValue = cur.replace(tr, window.__ti_translation_pairs.get(tr));
              }
              n = walker.nextNode();
            }
          }
        } catch(err) {}
        try {
          const attrEls = document.querySelectorAll('[placeholder], [title], [alt], input[type="button"], input[type="submit"]');
          attrEls.forEach(el => {
            ["placeholder", "title", "alt", "value"].forEach(attr => {
              const curVal = el.getAttribute(attr);
              if (curVal && window.__ti_translation_pairs?.has(curVal)) el.setAttribute(attr, window.__ti_translation_pairs.get(curVal));
            });
          });
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
