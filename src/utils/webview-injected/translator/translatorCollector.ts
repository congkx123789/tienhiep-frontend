export function getTranslatorCollectorScript(): string {
  return `
    window.__collectAndTranslateNodes = (root) => {
      if (!window.__autoTranslateEnabled) return;
      const chineseRegex = /[一-龥]/;
      const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      const currentRoot = root || document.body || document.documentElement;
      if (!currentRoot) return;

      if (document.title && !viRegex.test(document.title) && chineseRegex.test(document.title)) {
        const rawTitle = document.title.trim();
        const cachedTitle = window.__translationCache.get(rawTitle);
        if (cachedTitle && isGoodTranslation(rawTitle, cachedTitle)) {
          applyTranslatedText({ type: "title" }, cachedTitle);
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
            if (node.__ti_translated__) return NodeFilter.FILTER_REJECT;
            if (viRegex.test(node.nodeValue)) {
              node.__ti_translated__ = true;
              return NodeFilter.FILTER_REJECT;
            }
            const parent = node.parentNode;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.nodeName;
            if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA") return NodeFilter.FILTER_REJECT;
            if (parent.closest && parent.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, #__th_ejoy_popup, [id^="__teach"], [id^="__th_ejoy"]')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        });

        let node = walker.nextNode();
        while (node) {
          const rawVal = node.nodeValue;
          if (rawVal && !node.__ti_translated__ && !viRegex.test(rawVal) && chineseRegex.test(rawVal)) {
            const trimmed = rawVal.trim();
            if (trimmed.length > 0) {
              if (!node.__original_chinese__) node.__original_chinese__ = rawVal;
              const cachedVal = window.__translationCache.get(rawVal) || window.__translationCache.get(trimmed);
              if (cachedVal && isGoodTranslation(trimmed, cachedVal)) {
                node.__ti_translated__ = true;
                node.nodeValue = window.__translationCache.has(rawVal) ? cachedVal : rawVal.replace(trimmed, cachedVal);
                if (window.__ti_translation_pairs) {
                  window.__ti_translation_pairs.set(cachedVal.trim(), trimmed);
                }
                let pNode = node.parentElement;
                while (pNode && pNode !== document.body) {
                  if (pNode.hasAttribute('data-tts-idx') || pNode.classList.contains('tienhiep-tts-paragraph') || pNode.tagName === 'P') {
                    const prevZh = pNode.getAttribute('data-orig-zh') || '';
                    if (!prevZh || !/[一-龥]/.test(prevZh)) pNode.setAttribute('data-orig-zh', trimmed);
                    else if (!prevZh.includes(trimmed)) pNode.setAttribute('data-orig-zh', prevZh + ' ' + trimmed);
                    break;
                  }
                  pNode = pNode.parentElement;
                }
              } else {
                if (cachedVal && !isGoodTranslation(trimmed, cachedVal)) {
                  window.__translationCache.delete(rawVal);
                  window.__translationCache.delete(trimmed);
                }
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
                const cached = window.__translationCache.get(val);
                if (cached && isGoodTranslation(val, cached)) {
                  applyTranslatedText({ type: "attr", element: el, attr }, cached);
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

    window.__sweepUntranslatedNodes = () => {
      const root = document.body || document.documentElement;
      if (!root) return 0;
      const chineseRegex = /[一-龥]/;
      const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      let missedCount = 0;
      try {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: function(node) {
            if (!node || !node.nodeValue) return NodeFilter.FILTER_REJECT;
            const parent = node.parentNode;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.nodeName;
            if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA") return NodeFilter.FILTER_REJECT;
            if (parent.closest && parent.closest('#__teach_next_banner, teach-banner, [id^="__teach"], [id^="__th_ejoy"]')) return NodeFilter.FILTER_REJECT;
            if (chineseRegex.test(node.nodeValue) && !viRegex.test(node.nodeValue)) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        });
        let node = walker.nextNode();
        while (node) {
          node.__ti_translated__ = false;
          const rawVal = node.nodeValue;
          const trimmed = rawVal ? rawVal.trim() : "";
          if (trimmed.length > 0) {
            const cachedVal = window.__translationCache.get(rawVal) || window.__translationCache.get(trimmed);
            if (cachedVal && isGoodTranslation(trimmed, cachedVal)) {
              node.__ti_translated__ = true;
              node.nodeValue = window.__translationCache.has(rawVal) ? cachedVal : rawVal.replace(trimmed, cachedVal);
            } else {
              missedCount++;
              if (!targetGroupsMap.has(rawVal)) {
                targetGroupsMap.set(rawVal, []);
                uniqueTranslateQueue.push(rawVal);
              }
              const list = targetGroupsMap.get(rawVal);
              if (!list.some(t => t.node === node)) list.push({ type: "text", node: node, orig: rawVal });
            }
          }
          node = walker.nextNode();
        }
      } catch(e) {}
      return missedCount;
    };

    window.__forceTranslateAll = () => {
      window.__autoTranslateEnabled = true;
      if (window.__translationCache) {
        for (const [k, v] of window.__translationCache.entries()) {
          if (!isGoodTranslation(k, v)) window.__translationCache.delete(k);
        }
      }
      uniqueTranslateQueue.length = 0;
      targetGroupsMap.clear();
      const root = document.body || document.documentElement;
      if (root) {
        try {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
          let n = walker.nextNode();
          while (n) {
            if (/[一-龥]/.test(n.nodeValue || '')) n.__ti_translated__ = false;
            n = walker.nextNode();
          }
        } catch(e) {}
        window.__collectAndTranslateNodes(root);
      }
      if (uniqueTranslateQueue.length > 0) {
        processTranslateQueue();
      }
    };
  `;
}
