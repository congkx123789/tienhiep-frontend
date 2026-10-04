// Base DOM highlighter utilities: clear highlights, active paragraph/sentence highlight
export function getHighlighterBaseScript(): string {
  return `
    isLargeContainerEl: (el) => {
      if (!el || el === document.body || el === document.documentElement) return true;
      if (el.classList && (el.classList.contains('txtnav') || el.classList.contains('read-content') || el.classList.contains('content'))) return true;
      if (el.id === 'content' || el.tagName === 'ARTICLE' || el.tagName === 'MAIN' || el.tagName === 'SECTION') return true;
      const txt = (el.innerText || el.textContent || '').trim();
      return (txt.length > 500) || (el.querySelectorAll && el.querySelectorAll('p').length >= 2);
    },

    clearAllTtsHighlights: (resetPointers = false) => {
      if (typeof CSS !== 'undefined' && CSS.highlights) { try { CSS.highlights.delete('tienhiep-tts-highlight'); } catch(e) {} }
      document.querySelectorAll('#tienhiep-active-highlight, .tienhiep-active-word-highlight').forEach(el => {
        if (el.parentNode) {
          while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
          el.parentNode.removeChild(el);
        }
      });
      document.querySelectorAll('.tienhiep-tts-active-span').forEach(sp => {
        if (sp.parentNode) { while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp); sp.parentNode.removeChild(sp); }
      });
      document.querySelectorAll('.tts-active-sentence').forEach(el => {
        el.classList.remove('tts-active-sentence');
        el.style.backgroundColor = ''; el.style.color = ''; el.style.boxShadow = ''; el.style.borderBottom = '';
      });
      document.querySelectorAll('[data-tts-active="true"], [data-tts-active-para="true"]').forEach(el => {
        el.removeAttribute('data-tts-active'); el.removeAttribute('data-tts-active-para');
        el.style.backgroundColor = ''; el.style.color = ''; el.style.borderLeft = ''; el.style.paddingLeft = '';
      });
      window.__lastTtsSentenceEl = null; window.__lastTTSHighlightedNode = null; window.__lastTtsActivePara = null;
      if (resetPointers) {
        window.__lastTtsSpanIdx = 0;
        window.__lastTtsParaIdx = 0;
      }
    },

    highlightActiveParagraph: (paraIdx) => {
      if (typeof paraIdx !== 'number' || isNaN(paraIdx) || paraIdx < 0) return;
      let target = document.querySelector('[data-tts-idx="' + paraIdx + '"]');
      if (!target) {
        const allP = Array.from(document.querySelectorAll('.txtnav p, #content p, .read-content p, article p, p'));
        if (allP[paraIdx]) target = allP[paraIdx];
      }
      if (target && !window.__TienHiepHelpers.isLargeContainerEl(target)) {
        document.querySelectorAll('[data-tts-active-para="true"]').forEach(p => {
          if (p !== target) { p.removeAttribute('data-tts-active-para'); p.style.borderLeft = ''; p.style.paddingLeft = ''; }
        });
        target.setAttribute('data-tts-active-para', 'true');
        target.style.borderLeft = '4px solid #8b5cf6';
        target.style.paddingLeft = '8px';
      }
    },

    updateParagraphText: (paraIdx, newText) => {
      if (typeof paraIdx !== 'number' || isNaN(paraIdx) || !newText) return;
      let target = document.querySelector('[data-tts-idx="' + paraIdx + '"]');
      if (!target) {
        const allP = Array.from(document.querySelectorAll('.txtnav p, #content p, .read-content p, article p, p'));
        if (allP[paraIdx]) target = allP[paraIdx];
      }
      if (target) {
        target.textContent = newText;
        target.style.transition = 'all 0.3s ease';
        target.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
        setTimeout(() => { target.style.backgroundColor = ''; }, 1200);
      }
    },

    highlightSentence: (sentenceText, sentenceId) => {
      if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.clearAllTtsHighlights === 'function') {
        window.__TienHiepHelpers.clearAllTtsHighlights(false);
      }

      let ttsStyle = document.getElementById('__tienhiep_tts_para_style');
      if (!ttsStyle) {
        ttsStyle = document.createElement('style');
        ttsStyle.id = '__tienhiep_tts_para_style';
        (document.head || document.documentElement).appendChild(ttsStyle);
      }
      ttsStyle.textContent = 'body, #content, .txtnav, .read-content, article, main, .tienhiep-tts-paragraph { padding-bottom: 95px !important; } ' +
        '[data-tts-active="true"], [data-tts-active-para="true"] { background: rgba(254, 240, 138, 0.28) !important; border-left: 4px solid #8b5cf6 !important; padding-left: 8px !important; border-radius: 4px !important; transition: all 0.2s ease !important; } ' +
        '.tts-active-sentence, .tienhiep-active-word-highlight, #tienhiep-active-highlight { background-color: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 4px !important; padding: 2px 4px !important; box-shadow: 0 0 14px rgba(245, 158, 11, 0.85) !important; border-bottom: 2px solid #b45309 !important; display: inline !important; }';

      const norm = (str) => (str || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5\u00C0-\u1EF9]/gu, '');
      const fullNorm = norm(sentenceText);
      let targetEl = null;

      // 1. ƯU TIÊN SỐ 1: Khớp nội dung văn bản đang đọc (Text-first matching với directional scan)
      if (fullNorm.length >= 2) {
        const headSig = fullNorm.slice(0, Math.min(22, fullNorm.length));
        const midSig = fullNorm.length > 25 ? fullNorm.slice(Math.floor(fullNorm.length / 2) - 8, Math.floor(fullNorm.length / 2) + 8) : '';
        const allSpans = Array.from(document.querySelectorAll('.tts-sentence'));

        if (allSpans.length > 0) {
          const matchSpan = (sp) => {
            const spNorm = norm(sp.textContent);
            if (!spNorm) return false;
            if (fullNorm.length >= 12) {
              return spNorm.includes(headSig) || (midSig && spNorm.includes(midSig)) || (spNorm.length >= 8 && fullNorm.includes(spNorm.slice(0, 18)));
            }
            return spNorm === fullNorm || spNorm.startsWith(fullNorm) || fullNorm.startsWith(spNorm);
          };

          const lastIdx = typeof window.__lastTtsSpanIdx === 'number' ? Math.max(0, window.__lastTtsSpanIdx) : 0;
          for (let i = lastIdx; i < allSpans.length; i++) {
            if (matchSpan(allSpans[i])) { targetEl = allSpans[i]; window.__lastTtsSpanIdx = i; break; }
          }
          if (!targetEl && lastIdx > 0) {
            for (let i = 0; i < lastIdx; i++) {
              if (matchSpan(allSpans[i])) { targetEl = allSpans[i]; window.__lastTtsSpanIdx = i; break; }
            }
          }
        }

        // 2. Nếu không tìm thấy trong span .tts-sentence, quét theo thẻ đoạn <p>
        if (!targetEl) {
          const allParas = Array.from(document.querySelectorAll('.txtnav p, #content p, .read-content p, article p, [data-tts-idx], p'));
          const matchPara = (p) => {
            const pNorm = norm(p.textContent);
            if (!pNorm) return false;
            return fullNorm.length >= 10 ? pNorm.includes(headSig) : pNorm.includes(fullNorm);
          };

          const lastPIdx = typeof window.__lastTtsParaIdx === 'number' ? Math.max(0, window.__lastTtsParaIdx) : 0;
          for (let i = lastPIdx; i < allParas.length; i++) {
            if (matchPara(allParas[i])) { targetEl = allParas[i]; window.__lastTtsParaIdx = i; break; }
          }
          if (!targetEl && lastPIdx > 0) {
            for (let i = 0; i < lastPIdx; i++) {
              if (matchPara(allParas[i])) { targetEl = allParas[i]; window.__lastTtsParaIdx = i; break; }
            }
          }
        }
      }

      // 3. Fallback cuối cùng: Chỉ khi không khớp text mới dùng ID câu
      const sId = typeof sentenceId === 'number' ? sentenceId : parseInt(sentenceId, 10);
      if (!targetEl && !isNaN(sId) && sId >= 0) {
        targetEl = document.getElementById('s-' + (sId - 1)) ||
                   document.querySelector('[data-sid="' + (sId - 1) + '"]') ||
                   document.getElementById('s-' + sId) || 
                   document.querySelector('[data-sid="' + sId + '"]');
      }

      if (targetEl) {
        const isContainer = targetEl.tagName === 'P' || targetEl.tagName === 'DIV' || targetEl.tagName === 'ARTICLE';
        if (!isContainer) {
          targetEl.classList.add('tts-active-sentence');
          targetEl.style.backgroundColor = '#f59e0b';
          targetEl.style.color = '#000000';
          targetEl.style.borderRadius = '4px';
          targetEl.style.boxShadow = '0 0 14px rgba(245, 158, 11, 0.85)';
          targetEl.style.borderBottom = '2px solid #b45309';
          window.__lastTtsSentenceEl = targetEl;
        } else {
          let wrapped = false;
          if (fullNorm.length >= 3) {
            try {
              const headWord = (sentenceText || '').trim().replace(/^[“"'\s«『「]+/, '').slice(0, 12).toLowerCase();
              const tw = document.createTreeWalker(targetEl, NodeFilter.SHOW_TEXT);
              let tn = tw.nextNode();
              while (tn) {
                const rawLower = (tn.nodeValue || '').toLowerCase();
                const mIdx = headWord ? rawLower.indexOf(headWord) : -1;
                if (mIdx !== -1) {
                  const rng = document.createRange();
                  rng.setStart(tn, mIdx);
                  const wordLen = Math.min(tn.nodeValue.length - mIdx, Math.max(headWord.length, (sentenceText || '').trim().length));
                  rng.setEnd(tn, mIdx + wordLen);
                  const sp = document.createElement('span');
                  sp.className = 'tienhiep-active-word-highlight tts-active-sentence';
                  sp.style.cssText = 'background-color: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 4px !important; padding: 2px 4px !important; box-shadow: 0 0 12px rgba(245, 158, 11, 0.85) !important; border-bottom: 2px solid #b45309 !important; display: inline !important;';
                  rng.surroundContents(sp);
                  window.__lastTtsSentenceEl = sp;
                  wrapped = true;
                  break;
                }
                tn = tw.nextNode();
              }
            } catch(e) {}
          }
          if (!wrapped) {
            targetEl.setAttribute('data-tts-active', 'true');
          }
        }

        const parentPara = isContainer ? targetEl : targetEl.closest('p, [data-tts-idx], .tienhiep-tts-paragraph');
        if (parentPara && !window.__TienHiepHelpers.isLargeContainerEl(parentPara)) {
          document.querySelectorAll('[data-tts-active-para="true"]').forEach(p => {
            if (p !== parentPara) { p.removeAttribute('data-tts-active-para'); p.style.borderLeft = ''; p.style.paddingLeft = ''; }
          });
          parentPara.setAttribute('data-tts-active-para', 'true');
          parentPara.style.borderLeft = '4px solid #8b5cf6';
          parentPara.style.paddingLeft = '8px';
          window.__lastTtsActivePara = parentPara;
        }
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
  `;
}
