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

    clearAllTtsHighlights: () => {
      if (typeof CSS !== 'undefined' && CSS.highlights) { try { CSS.highlights.delete('tienhiep-tts-highlight'); } catch(e) {} }
      document.querySelectorAll('#tienhiep-active-highlight').forEach(el => {
        if (el.parentNode) { el.parentNode.replaceChild(document.createTextNode(el.textContent), el); el.parentNode.normalize(); }
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
      window.__lastTtsSpanIdx = 0;
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
        window.__TienHiepHelpers.clearAllTtsHighlights();
      }

      let ttsStyle = document.getElementById('__tienhiep_tts_para_style');
      if (!ttsStyle) {
        ttsStyle = document.createElement('style');
        ttsStyle.id = '__tienhiep_tts_para_style';
        ttsStyle.textContent = 'body, #content, .txtnav, .read-content, article, main, .tienhiep-tts-paragraph { padding-bottom: 95px !important; } ::highlight(tienhiep-tts-highlight) { background-color: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 3px !important; } #tienhiep-active-highlight, span#tienhiep-active-highlight, .tts-active-sentence { background-color: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 4px !important; padding: 2px 4px !important; box-shadow: 0 0 14px rgba(245, 158, 11, 0.85) !important; border-bottom: 2px solid #b45309 !important; display: inline !important; } [data-tts-active-para="true"] { border-left: 4px solid #8b5cf6 !important; padding-left: 8px !important; transition: border-left 0.2s ease !important; }';
        (document.head || document.documentElement).appendChild(ttsStyle);
      }

      const sId = typeof sentenceId === 'number' ? sentenceId : parseInt(sentenceId, 10);
      let targetEl = null;

      // 1. Thử tìm theo ID chuẩn s-X hoặc data-sid
      if (!isNaN(sId) && sId >= 0) {
        targetEl = document.getElementById('s-' + sId) || 
                   document.querySelector('[data-sid="' + sId + '"]') ||
                   document.getElementById('s-' + (sId - 1)) ||
                   document.querySelector('[data-sid="' + (sId - 1) + '"]');
      }

      // 2. Tìm kiếm theo nội dung câu (hỗ trợ cả từ ngắn, quét tuần tự theo chiều đọc để không bị nhảy ngược)
      if (sentenceText) {
        const norm = (str) => (str || '').toLowerCase().replace(/["“”'’«»『』\s]/g, '').trim();
        const cleanTarget = norm(sentenceText).slice(0, 30);

        if (cleanTarget.length >= 1) {
          const allSpans = Array.from(document.querySelectorAll('.tts-sentence'));
          
          if (allSpans.length > 0) {
            const lastIdx = typeof window.__lastTtsSpanIdx === 'number' ? Math.max(0, window.__lastTtsSpanIdx) : 0;
            let foundIdx = -1;

            for (let i = lastIdx; i < allSpans.length; i++) {
              const spNorm = norm(allSpans[i].textContent);
              if (spNorm && (spNorm.includes(cleanTarget) || cleanTarget.includes(spNorm))) {
                foundIdx = i;
                break;
              }
            }

            if (foundIdx === -1 && lastIdx > 0) {
              for (let i = 0; i < lastIdx; i++) {
                const spNorm = norm(allSpans[i].textContent);
                if (spNorm && (spNorm.includes(cleanTarget) || cleanTarget.includes(spNorm))) {
                  foundIdx = i;
                  break;
                }
              }
            }

            if (foundIdx !== -1) {
              targetEl = allSpans[foundIdx];
              window.__lastTtsSpanIdx = foundIdx;
            }
          }
        }
      }

      // 3. Nếu chưa có span .tts-sentence trên trang, tự động kích hoạt index
      if (!targetEl && document.querySelectorAll('.tts-sentence').length === 0) {
        if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
          window.__TienHiepHelpers.indexParagraphsForTTS();
          if (!isNaN(sId) && sId >= 0) {
            targetEl = document.getElementById('s-' + sId) || document.getElementById('s-' + (sId - 1));
          }
        }
      }

      if (targetEl) {
        // TUYỆT ĐỐI KHÔNG BÔI MÀU NGUYÊN KHỐI LÊN THẺ P HOẶC DIV
        const isContainer = targetEl.tagName === 'P' || targetEl.tagName === 'DIV' || targetEl.tagName === 'ARTICLE';
        if (!isContainer) {
          targetEl.classList.add('tts-active-sentence');
          targetEl.style.backgroundColor = '#f59e0b';
          targetEl.style.color = '#000000';
          targetEl.style.borderRadius = '4px';
          targetEl.style.boxShadow = '0 0 14px rgba(245, 158, 11, 0.85)';
          targetEl.style.borderBottom = '2px solid #b45309';
          window.__lastTtsSentenceEl = targetEl;
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
