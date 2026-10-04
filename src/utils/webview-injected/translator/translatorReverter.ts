export function getTranslatorReverterScript(): string {
  return `
    window.toggleAutoTranslate = (enabled) => {
      window.__autoTranslateEnabled = enabled;
      if (window.__TienHiepHelpers) window.__TienHiepHelpers.__autoTranslateEnabled = enabled;
      try { localStorage.setItem('__tienhiep_auto_translate_active', String(enabled)); } catch(e) {}
      if (enabled) {
        const rootEl = document.body || document.documentElement;
        if (window.__autoTranslateObserver && rootEl) {
          try { window.__autoTranslateObserver.observe(rootEl, { childList: true, subtree: true, characterData: true }); } catch(e) {}
        }
        if (typeof window.__forceTranslateAll === "function") {
          window.__forceTranslateAll();
        } else if (typeof window.__collectAndTranslateNodes === "function") {
          window.__collectAndTranslateNodes(rootEl);
        }
      } else {
        if (window.__autoTranslateObserver) { try { window.__autoTranslateObserver.disconnect(); } catch(e) {} }
        if (typeof window.__resetTransSession === 'function') {
          window.__resetTransSession();
        } else {
          window.__pageSessionId = 'ps_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
          uniqueTranslateQueue.length = 0;
          targetGroupsMap.clear();
          window.__translatePromises = {};
          if (translateTimeout) { clearTimeout(translateTimeout); translateTimeout = null; }
        }
        const b = document.getElementById("__teach_next_banner"); if (b) b.remove();
        const box = document.getElementById("__teach_highlighter_box"); if (box) box.remove();
        if (window.__ti_original_title) document.title = window.__ti_original_title;
        if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.clearAllTtsHighlights === 'function') {
          try { window.__TienHiepHelpers.clearAllTtsHighlights(); } catch(e) {}
        }
        const _viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
        const _zhRegex = /[一-龥]/;
        try {
          const rootEl = document.body || document.documentElement;
          if (rootEl) {
            // PASS 1: Walk individual text nodes
            const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
              acceptNode: (n) => (n && n.nodeValue ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
            });
            let n = walker.nextNode();
            while (n) {
              const cur = n.nodeValue;
              if (n.__original_chinese__) {
                n.nodeValue = n.__original_chinese__;
                n.__ti_translated__ = false;
              } else if (cur && window.__ti_translation_pairs) {
                const tr = cur.trim();
                const normTr = tr.replace(/["“”]/g, '"');
                if (window.__ti_translation_pairs.has(cur)) {
                  n.nodeValue = window.__ti_translation_pairs.get(cur);
                  n.__ti_translated__ = false;
                } else if (tr && window.__ti_translation_pairs.has(tr)) {
                  n.nodeValue = cur.replace(tr, window.__ti_translation_pairs.get(tr));
                  n.__ti_translated__ = false;
                } else if (normTr && window.__ti_translation_pairs.has(normTr)) {
                  n.nodeValue = cur.replace(tr, window.__ti_translation_pairs.get(normTr));
                  n.__ti_translated__ = false;
                }
              }
              n = walker.nextNode();
            }

            // PASS 2: Paragraph & container restoration from data-orig-zh
            const paraEls = rootEl.querySelectorAll('[data-orig-zh], [data-tts-idx], .tienhiep-tts-paragraph, p');
            paraEls.forEach(el => {
              const origZh = el.getAttribute('data-orig-zh');
              const curContent = el.textContent || '';
              if (origZh && _zhRegex.test(origZh) && _viRegex.test(curContent)) {
                el.innerHTML = '';
                el.textContent = origZh;
              } else if (_viRegex.test(curContent) && window.__ti_translation_pairs) {
                const trContent = curContent.trim();
                const normTr = trContent.replace(/["“”]/g, '"');
                if (window.__ti_translation_pairs.has(trContent)) {
                  el.innerHTML = '';
                  el.textContent = window.__ti_translation_pairs.get(trContent);
                } else if (window.__ti_translation_pairs.has(normTr)) {
                  el.innerHTML = '';
                  el.textContent = window.__ti_translation_pairs.get(normTr);
                }
              }
            });

            // PASS 3: Fallback for any leftover .tts-sentence spans
            const remainingSentences = rootEl.querySelectorAll('.tts-sentence');
            remainingSentences.forEach(sp => {
              const spTxt = sp.textContent || '';
              if (_viRegex.test(spTxt) && window.__ti_translation_pairs) {
                const tr = spTxt.trim();
                const normTr = tr.replace(/["“”]/g, '"');
                if (window.__ti_translation_pairs.has(tr)) {
                  sp.textContent = window.__ti_translation_pairs.get(tr) + ' ';
                } else if (window.__ti_translation_pairs.has(normTr)) {
                  sp.textContent = window.__ti_translation_pairs.get(normTr) + ' ';
                }
              }
            });
          }
        } catch(err) {
          console.error("[Revert DOM Error]", err);
        }
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

    window.__revertToOriginal = () => {
      window.toggleAutoTranslate(false);
    };

    if (window.__TienHiepHelpers) window.__TienHiepHelpers.toggleAutoTranslate = window.toggleAutoTranslate;
  `;
}
