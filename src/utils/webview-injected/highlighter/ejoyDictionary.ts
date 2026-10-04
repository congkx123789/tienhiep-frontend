import { getEjoyNotebookModalScript } from './ejoyNotebookModal';
import { getEjoyPopupRendererScript } from './ejoyPopupRenderer';

// eJOY Style Dictionary & Word/Selection Lookup for Webview Reader
export function getEjoyDictionaryScript(): string {
  return `
    (function initEjoyDictionary() {
      if (window.__tienhiepEjoyInstalled) return;
      window.__tienhiepEjoyInstalled = true;

      let activePopup = null;
      let activeTriggerBtn = null;
      const _alignCache = new Map();

      const style = document.createElement('style');
      style.id = '__tienhiep_ejoy_styles';
      style.textContent = [
        '#__th_ejoy_popup { position: absolute; z-index: 2147483647; width: 420px; max-width: 92vw; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; border-top: 4px solid #7c3aed; box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.22); padding: 11px 15px 12px 15px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12.5px; color: #1e293b; user-select: none; box-sizing: border-box; }',
        '.__th_ejoy_btn { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }',
        '.__th_ejoy_btn:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; }',
        '.__th_ejoy_btn_save { border-color: #fde047; background: #fefce8; color: #a16207; }',
        '.__th_ejoy_alt_chip { padding: 3px 8px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }',
        '.__th_ejoy_alt_chip:hover { background: #ede9fe; border-color: #a78bfa; color: #6d28d9; }',
        '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'
      ].join('\\n');
      (document.head || document.documentElement).appendChild(style);

      ${getEjoyNotebookModalScript()}
      ${getEjoyPopupRendererScript()}

      let activeHighlightEl = null;
      function setVisualHighlight(rect) {
        removeVisualHighlight();
        if (!rect || rect.width === 0 || rect.height === 0) return;
        const hl = document.createElement('div');
        hl.id = '__th_ejoy_visual_highlight';
        hl.style.cssText = 'position: absolute; left: ' + (rect.left + window.scrollX) + 'px; top: ' + (rect.top + window.scrollY) + 'px; width: ' + rect.width + 'px; height: ' + rect.height + 'px; background-color: rgba(250, 204, 21, 0.45); border-bottom: 2.5px solid #eab308; border-radius: 3px; pointer-events: none; z-index: 2147483646; transition: all 0.15s ease; box-shadow: 0 0 6px rgba(234, 179, 8, 0.4);';
        document.body.appendChild(hl);
        activeHighlightEl = hl;
      }
      function removeVisualHighlight() {
        if (activeHighlightEl) { activeHighlightEl.remove(); activeHighlightEl = null; }
      }

      function closePopup() {
        if (activePopup) { activePopup.remove(); activePopup = null; }
        removeVisualHighlight();
      }
      function removeTriggerBtn() { if (activeTriggerBtn) { activeTriggerBtn.remove(); activeTriggerBtn = null; } }

      function speakWord(text) {
        if (!text) return;
        try {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(text);
            utt.lang = /[一-龥]/.test(text) ? 'zh-CN' : 'vi-VN';
            window.speechSynthesis.speak(utt);
          }
        } catch(e) {}
      }

      function findRawZhFromNode(parentPara) {
        if (!parentPara) return '';
        const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
        const pEl = parentPara.closest ? (parentPara.closest('[data-orig-zh]') || parentPara) : parentPara;
        let zh = pEl.getAttribute('data-orig-zh') || '';
        if ((!zh || !/[一-龥]/.test(zh) || viRegex.test(zh)) && parentPara.querySelector) {
          const childWithZh = parentPara.querySelector('[data-orig-zh]');
          if (childWithZh) zh = childWithZh.getAttribute('data-orig-zh') || '';
        }
        if (zh && viRegex.test(zh)) {
          zh = zh.replace(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđA-Za-z]/g, '').trim();
        }
        return (zh && /[一-龥]/.test(zh)) ? zh : '';
      }

      function buildAccurateZhContext(rawZh, matchedZh) {
        if (!rawZh || !matchedZh || !/[一-龥]/.test(rawZh) || !/[一-龥]/.test(matchedZh)) return null;
        const pos = rawZh.indexOf(matchedZh);
        if (pos !== -1) {
          const start = Math.max(0, pos - 15);
          const end = Math.min(rawZh.length, pos + matchedZh.length + 15);
          const before = (start > 0 ? '...' : '') + rawZh.slice(start, pos);
          const after = rawZh.slice(pos + matchedZh.length, end) + (end < rawZh.length ? '...' : '');
          return { before, target: matchedZh, after };
        }
        return null;
      }

      function findBestZhSnippet(selectedText, rawZh, parentPara) {
        if (/[一-龥]/.test(selectedText)) return selectedText;
        const pairs = window.__ti_translation_pairs;
        if (pairs && pairs instanceof Map) {
          const lowerSel = selectedText.toLowerCase().trim();
          if (pairs.has(lowerSel)) {
            const val = pairs.get(lowerSel);
            if (val && /[一-龥]/.test(val)) return val;
          }
          for (let [vi, zh] of pairs.entries()) {
            if (vi && (vi.toLowerCase() === lowerSel || vi.toLowerCase().includes(lowerSel)) && zh && /[一-龥]/.test(zh) && zh.length <= 15) {
              return zh;
            }
          }
        }
        return '';
      }

      function processWordLookup(selectedText, rect, parentPara) {
        if (!selectedText || selectedText.length > 80) return;
        removeTriggerBtn();
        setVisualHighlight(rect);

        const cacheKey = selectedText.toLowerCase().trim();
        const rawZh = findRawZhFromNode(parentPara);
        const paraIdx = parentPara ? parseInt(parentPara.getAttribute('data-tts-idx'), 10) : null;
        let zhTarget = findBestZhSnippet(selectedText, rawZh, parentPara);

        if (_alignCache.has(cacheKey)) {
          showPopupAt(rect.left + rect.width / 2, rect.bottom + 6, { ..._alignCache.get(cacheKey), parentPara, paraIdx, isLoading: false });
          return;
        }

        const initialAccurateCtx = buildAccurateZhContext(rawZh, zhTarget);
        const validInitialZh = (zhTarget && /[一-龥]/.test(zhTarget)) ? zhTarget : '';

        const initialData = {
          selectedText,
          origZh: validInitialZh,
          accurateContext: initialAccurateCtx,
          hanviet: '',
          currentMeaning: selectedText,
          alternatives: [],
          source: 'NHẬN DIỆN CỤM',
          confidence: '100%',
          parentPara,
          paraIdx,
          tokens: validInitialZh ? [{ zh: validInitialZh, vi: selectedText, hanviet: '', isMatched: true }] : [],
          isLoading: true
        };
        showPopupAt(rect.left + rect.width / 2, rect.bottom + 6, initialData);

        const viContext = parentPara ? parentPara.innerText.slice(0, 160) : selectedText;
        const sendZh = (rawZh && /[一-龥]/.test(rawZh)) ? rawZh : validInitialZh;

        fetch('http://127.0.0.1:5051/api/translate/align', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zh: sendZh, vi: viContext, selected: selectedText, mode: 4 })
        })
        .then(res => res.json())
        .then(data => {
          let finalClusterVi = selectedText;
          let finalClusterZh = validInitialZh;
          let finalHanviet = '';
          let finalAlts = [];
          let finalAccurateCtx = null;

          if (data && data.matched_cluster) {
            const mc = data.matched_cluster;
            if (mc.zh && /[一-龥]/.test(mc.zh)) finalClusterZh = mc.zh;
            if (mc.vi) finalClusterVi = mc.vi;
            if (mc.hanviet) finalHanviet = mc.hanviet;
            if (mc.alternatives && Array.isArray(mc.alternatives)) finalAlts = mc.alternatives;
            if (mc.context && mc.context.target && /[一-龥]/.test(mc.context.target)) {
              finalAccurateCtx = mc.context;
            }
          }

          if (!finalAccurateCtx && finalClusterZh && rawZh && /[一-龥]/.test(rawZh)) {
            finalAccurateCtx = buildAccurateZhContext(rawZh, finalClusterZh);
          }

          const rawTokens = (data && Array.isArray(data.tokens) && data.tokens.length > 0) ? data.tokens : [];
          const popupData = {
            selectedText: finalClusterVi,
            origZh: finalClusterZh,
            accurateContext: finalAccurateCtx,
            hanviet: finalHanviet,
            currentMeaning: finalClusterVi,
            alternatives: finalAlts,
            source: 'VIETPHRASE C++',
            confidence: '100%',
            parentPara, paraIdx,
            tokens: rawTokens.length > 0 ? rawTokens : (finalClusterZh ? [{ zh: finalClusterZh, vi: finalClusterVi, hanviet: finalHanviet, isMatched: true }] : []),
            totalTokensCount: rawTokens.length,
            matchedIdx: 0,
            modeName: data && data.mode_name ? data.mode_name : 'Mode 4 CMLM',
            elapsed: data && data.elapsed ? data.elapsed : '0.08ms',
            isLoading: false
          };
          _alignCache.set(cacheKey, popupData);
          showPopupAt(rect.left + rect.width / 2, rect.bottom + 6, popupData);
        })
        .catch(() => {});
      }

      window.__tienhiepProcessWordLookup = processWordLookup;

      function handleSelectionLookup() {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        const selectedText = sel.toString().trim();
        if (!selectedText || selectedText.length < 1 || selectedText.length > 80) return;
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        const node = sel.anchorNode;
        const parentPara = node ? ((node.nodeType === 1 ? node : node.parentElement)?.closest('[data-tts-idx], .tienhiep-tts-paragraph, p')) : null;
        processWordLookup(selectedText, rect, parentPara);
      }

      function handleWordClickLookup(e) {
        if (e.target && e.target.closest && e.target.closest('#__th_ejoy_popup, #__th_ejoy_notebook_modal, a, button, input, select, textarea')) return;
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return;
        let range = null;
        if (document.caretRangeFromPoint) range = document.caretRangeFromPoint(e.clientX, e.clientY);
        else if (document.caretPositionFromPoint) {
          const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
          if (pos) { range = document.createRange(); range.setStart(pos.offsetNode, pos.offset); range.collapse(true); }
        }
        if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) return;
        const textNode = range.startContainer;
        const text = textNode.nodeValue || '';
        const offset = range.startOffset;
        if (!text || offset < 0 || offset > text.length) return;
        let start = offset, end = offset;
        if (/[一-龥]/.test(text[offset] || '')) {
          while (start > 0 && /[一-龥]/.test(text[start - 1])) start--;
          while (end < text.length && /[一-龥]/.test(text[end])) end++;
        } else {
          const isWordChar = (c) => /[a-zA-Z0-9\\u00C0-\\u1EF9]/.test(c);
          if (!isWordChar(text[offset] || '') && offset > 0 && isWordChar(text[offset - 1] || '')) { start = offset - 1; end = offset; }
          else if (!isWordChar(text[offset] || '')) return;
          while (start > 0 && isWordChar(text[start - 1])) start--;
          while (end < text.length && isWordChar(text[end])) end++;
        }
        const word = text.slice(start, end).trim();
        if (!word || word.length < 1 || word.length > 40) return;
        const wordRange = document.createRange();
        wordRange.setStart(textNode, start);
        wordRange.setEnd(textNode, end);
        const rect = wordRange.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        // BÔI HIGHLIGHT VÙNG CHỌN TRỰC TIẾP TRÊN TRANG ĐỌC
        const selObj = window.getSelection();
        if (selObj) {
          try {
            selObj.removeAllRanges();
            selObj.addRange(wordRange);
          } catch(err) {}
        }

        const parentPara = (textNode.parentElement)?.closest('[data-tts-idx], .tienhiep-tts-paragraph, p');
        processWordLookup(word, rect, parentPara);
      }

      let _lastClickTime = 0;
      let _clickTimer = null;

      document.addEventListener('mouseup', (e) => {
        if (e.target && e.target.closest && e.target.closest('#__th_ejoy_popup, #__th_ejoy_notebook_modal')) return;
        setTimeout(handleSelectionLookup, 50);
      });
      document.addEventListener('touchend', (e) => {
        if (e.target && e.target.closest && e.target.closest('#__th_ejoy_popup, #__th_ejoy_notebook_modal')) return;
        setTimeout(handleSelectionLookup, 100);
      });

      document.addEventListener('dblclick', (e) => {
        if (_clickTimer) { clearTimeout(_clickTimer); _clickTimer = null; }
        handleWordClickLookup(e);
      });

      document.addEventListener('click', (e) => {
        if (e.target && e.target.closest && e.target.closest('#__th_ejoy_popup, #__th_ejoy_notebook_modal, a, button, input, select, textarea')) return;
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return;
        const now = Date.now();
        if (now - _lastClickTime < 300) return;
        _lastClickTime = now;
        _clickTimer = setTimeout(() => { handleWordClickLookup(e); }, 220);
      });

      document.addEventListener('mousedown', (e) => {
        if (activePopup && !activePopup.contains(e.target)) closePopup();
      });
    })();
  `;
}
