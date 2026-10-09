export function getTranslatorCollectorScript(): string {
  return `
    window.__collectAndTranslateNodes = (root) => {
      if (!window.__autoTranslateEnabled) return;
      const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
      const currentRoot = root || document.body || document.documentElement;
      if (!currentRoot) return;

      const extractChineseSegments = (str) => {
        if (!str || !chineseRegex.test(str)) return [];
        const segRegex = /(?:[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff01-\uff5e\u2014\u2026\u201c\u201d\u2018\u2019\u300a\u300b\u300c\u300d\u300e\u300f\u3010\u3011]+(?:[\\s0-9:：_\\/-]*[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff01-\uff5e\u2014\u2026\u201c\u201d\u2018\u2019\u300a\u300b\u300c\u300d\u300e\u300f\u3010\u3011]+)*)/g;
        const matches = str.match(segRegex);
        if (!matches || matches.length === 0) {
          const trimmed = str.trim();
          return (trimmed && chineseRegex.test(trimmed)) ? [trimmed] : [];
        }
        return matches.map(s => s.trim()).filter(s => s.length > 0 && chineseRegex.test(s));
      };

      if (document.title && chineseRegex.test(document.title)) {
        const titleSegments = extractChineseSegments(document.title);
        for (const rawTitle of titleSegments) {
          const cachedTitle = window.__translationCache.get(rawTitle);
          if (cachedTitle && isGoodTranslation(rawTitle, cachedTitle)) {
            document.title = document.title.replace(rawTitle, cachedTitle);
          } else {
            if (!targetGroupsMap.has(rawTitle)) {
              targetGroupsMap.set(rawTitle, []);
              uniqueTranslateQueue.push(rawTitle);
            }
            targetGroupsMap.get(rawTitle).push({ type: "title", orig: rawTitle, segment: rawTitle });
          }
        }
      }

      try {
        const walker = document.createTreeWalker(currentRoot, NodeFilter.SHOW_TEXT, {
          acceptNode: function(node) {
            if (!node || !node.nodeValue) return NodeFilter.FILTER_REJECT;
            if (node.__ti_translated__) return NodeFilter.FILTER_REJECT;
            if (!chineseRegex.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
            const parent = node.parentNode;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.nodeName;
            if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA" || tag === "CODE" || tag === "PRE" || tag === "SVG" || tag === "CANVAS") return NodeFilter.FILTER_REJECT;
            if (parent.closest && parent.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, #__th_ejoy_popup, [id^="__teach"], [id^="__th_ejoy"], [translate="no"], .notranslate')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        });

        let node = walker.nextNode();
        while (node) {
          const rawVal = node.nodeValue;
          if (rawVal && !node.__ti_translated__ && chineseRegex.test(rawVal)) {
            const segments = extractChineseSegments(rawVal);
            if (segments.length > 0) {
              if (!node.__original_chinese__) node.__original_chinese__ = rawVal;
              for (const seg of segments) {
                const cachedVal = window.__translationCache.get(seg);
                if (cachedVal && isGoodTranslation(seg, cachedVal)) {
                  if (node.nodeValue.includes(seg)) {
                    node.nodeValue = node.nodeValue.replace(seg, cachedVal);
                  }
                  if (window.__ti_translation_pairs) {
                    window.__ti_translation_pairs.set(cachedVal.trim(), seg);
                  }
                  if (!chineseRegex.test(node.nodeValue)) {
                    node.__ti_translated__ = true;
                  }
                } else {
                  if (cachedVal && !isGoodTranslation(seg, cachedVal)) {
                    window.__translationCache.delete(seg);
                  }
                  if (!targetGroupsMap.has(seg)) {
                    targetGroupsMap.set(seg, []);
                    uniqueTranslateQueue.push(seg);
                  }
                  const list = targetGroupsMap.get(seg);
                  if (!list.some(t => t.node === node && t.segment === seg)) {
                    list.push({ type: "text", node: node, segment: seg, orig: rawVal });
                  }
                }
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
                const segments = extractChineseSegments(val);
                for (const seg of segments) {
                  const cached = window.__translationCache.get(seg);
                  if (cached && isGoodTranslation(seg, cached)) {
                    applyTranslatedText({ type: "attr", element: el, attr, segment: seg, orig: val }, cached);
                  } else {
                    if (!targetGroupsMap.has(seg)) {
                      targetGroupsMap.set(seg, []);
                      uniqueTranslateQueue.push(seg);
                    }
                    const list = targetGroupsMap.get(seg);
                    if (!list.some(t => t.element === el && t.attr === attr && t.segment === seg)) {
                      list.push({ type: "attr", element: el, attr, segment: seg, orig: val });
                    }
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
      const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
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
            if (/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(n.nodeValue || '')) n.__ti_translated__ = false;
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
