// Injected Highlighter: Paragraph indexing, TTS span wrapping and active sentence highlight
export function getInjectedHighlighterScript(): string {
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
        target.style.transition = 'border-left 0.2s ease';
      }
    },

    indexParagraphsForTTS: () => {
      const host = window.__TienHiepHelpers.getEffectiveUrl().hostname || '';
      let mainEl = null;

      try {
        const savedSel = localStorage.getItem('__tienhiep_content_selector_' + host);
        if (savedSel) {
          const el = document.querySelector(savedSel);
          if (el && (el.innerText || "").trim().length > 30) mainEl = el;
        }
      } catch(e) {}

      if (!mainEl) {
        const UNIVERSAL_SELECTORS = [
          ".txtnav", "#content", "#txtContent", "#chaptercontent", "#chapterContent",
          "#contentbox", ".read-content", "#read-content", ".muye-reader-content-novel",
          "#chapter-c", ".chapter-c", ".box-chap", "#chapter-detail", ".showtxt",
          ".novel-content", ".reading-content", "article", ".entry-content",
          "#htmlContent", ".article-content", ".page-content", ".yd_text2", "#nr1",
          "#BookText", "#booktxt", ".book_con", "#acontent", ".reader-content",
          ".chapter_content", "#novelcontent", "#viewcontent"
        ];
        for (const sel of UNIVERSAL_SELECTORS) {
          const el = document.querySelector(sel);
          if (el && (el.innerText || "").trim().length > 150) { mainEl = el; break; }
        }
      }
      if (!mainEl) mainEl = document.querySelector('article, main, #content, .content, .read-content') || document.body;

      const isNav = /^(chương trước|chương sau|trở lại|danh sách|mục lục|trang trước|trang sau|上一章|下一章|回目录)$/i;
      const hasWord = /[a-zA-Z0-9\\u4e00-\\u9fa5\\u00C0-\\u1EF9]/;

      mainEl.querySelectorAll('[data-tts-idx]').forEach(el => {
        el.removeAttribute('data-tts-idx');
        el.style.cursor = '';
      });

      let idx = 0;
      let pTags = Array.from(mainEl.querySelectorAll("p"));
      if (pTags.length === 0) pTags = Array.from(document.querySelectorAll(".txtnav p, #content p, .read-content p, article p, p"));
      const indexedEls = [];

      if (pTags.length > 0) {
        pTags.forEach(p => {
          const txt = (p.innerText || p.textContent || "").trim();
          if (txt && hasWord.test(txt) && !isNav.test(txt)) {
            p.setAttribute('data-tts-idx', String(idx));
            p.style.cursor = 'pointer';
            indexedEls.push(p);
            idx++;
          }
        });
      }
      
      const mainTextLen = (mainEl.innerText || mainEl.textContent || '').trim().length;
      if (indexedEls.length < 3 && mainTextLen > 200) {
        try {
          indexedEls.forEach(el => el.removeAttribute('data-tts-idx'));
          indexedEls.length = 0;
          idx = 0;
          const childNodes = Array.from(mainEl.childNodes);
          let currentBatch = [];
          const fragment = document.createDocumentFragment();

          const flushBatch = () => {
            if (currentBatch.length === 0) return;
            const combinedText = currentBatch.map(n => n.textContent || '').join('').trim();
            if (combinedText && hasWord.test(combinedText) && !isNav.test(combinedText)) {
              const p = document.createElement('p');
              p.setAttribute('data-tts-idx', String(idx));
              p.className = 'tienhiep-tts-paragraph';
              p.style.cssText = 'margin: 14px 0 !important; line-height: 1.85 !important; cursor: pointer !important; word-break: break-word !important;';
              currentBatch.forEach(n => p.appendChild(n));
              fragment.appendChild(p);
              indexedEls.push(p);
              idx++;
            } else {
              currentBatch.forEach(n => fragment.appendChild(n));
            }
            currentBatch = [];
          };

          for (let i = 0; i < childNodes.length; i++) {
            const node = childNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
              flushBatch();
            } else if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && ['SPAN', 'FONT', 'B', 'I', 'EM', 'STRONG', 'A'].includes(node.tagName))) {
              currentBatch.push(node);
            } else {
              flushBatch();
              fragment.appendChild(node);
            }
          }
          flushBatch();
          if (indexedEls.length > 0) { mainEl.innerHTML = ''; mainEl.appendChild(fragment); }
        } catch(wrapErr) {}
      }

      let ttsStyle = document.getElementById('__tienhiep_tts_para_style');
      if (!ttsStyle) {
        ttsStyle = document.createElement('style');
        ttsStyle.id = '__tienhiep_tts_para_style';
        ttsStyle.textContent = '[data-tts-active="true"] { background: rgba(254, 240, 138, 0.45) !important; border-left: 4px solid #7c3aed !important; padding: 4px 8px !important; border-radius: 4px !important; transition: all 0.2s ease !important; display: block !important; } .tienhiep-tts-active-span { background: rgba(254, 240, 138, 0.5) !important; border-left: 3px solid #7c3aed !important; padding: 1px 4px !important; border-radius: 3px !important; display: inline-block !important; }';
        (document.head || document.documentElement).appendChild(ttsStyle);
      }

      if (!window.__tienhiepTapToReadInstalled) {
        window.__tienhiepTapToReadInstalled = true;
        document.addEventListener('click', (e) => {
          if (window.__isTeachingNext) return;
          if (e.target && e.target.closest('a, button, input, select, textarea, [onclick], [role="button"]')) return;
          if (!window.isTtsPlaying && !window.__audioActive) return;

          const el = e.target && e.target.closest ? e.target.closest('[data-tts-idx]') : null;
          if (!el) return;
          const paraIdx = parseInt(el.getAttribute('data-tts-idx'), 10);
          if (isNaN(paraIdx)) return;
          
          const sentenceSnippet = (el.textContent || '').trim().slice(0, 80);
          try { window.parent.postMessage({ type: 'TAP_PARAGRAPH', paraIdx, sentenceText: sentenceSnippet }, '*'); } catch(err) {}
          
          window.__TienHiepHelpers.clearAllTtsHighlights();
          el.setAttribute('data-tts-active', 'true');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, true);
      }

      try {
        const headingCandidates = Array.from(document.querySelectorAll("h1, h2, h3, .chapter-title, .title, .title1, .nr_title, #nr_title, .readTitle, [class*='title'], [id*='title']"));
        const viHeading = headingCandidates.find(el => /Chương\\s*\\d+/i.test((el.textContent || "").trim()));
        const h1Heading = headingCandidates.find(el => (el.tagName === 'H1' || el.classList.contains('title1')) && (el.textContent || "").trim().length < 150);
        const zhHeading = headingCandidates.find(el => /第\\s*\\d+\\s*[章節页]/.test((el.textContent || "").trim()));
        const heading = viHeading || h1Heading || zhHeading;

        let sentenceCounter = 0;
        if (heading && !mainEl.contains(heading)) {
          const hText = (heading.textContent || "").trim();
          if (hText.length > 0) {
            heading.querySelectorAll('.tts-sentence').forEach(el => el.remove());
            const span = document.createElement('span');
            span.id = 's-0';
            span.setAttribute('data-sid', '0');
            span.className = 'tts-sentence';
            span.textContent = hText;
            heading.innerHTML = '';
            heading.appendChild(span);
            sentenceCounter = 1;
          }
        }

        const validCharRegex = /[\\p{L}\\p{N}]/u;
        indexedEls.forEach(pEl => {
          if (pEl.querySelector('.tts-sentence')) {
            pEl.querySelectorAll('.tts-sentence').forEach(sp => {
              if (sp.parentNode) { while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp); sp.parentNode.removeChild(sp); }
            });
          }
          const text = (pEl.textContent || '').trim();
          if (!text) return;
          const parts = text.split(/([.!?。！？]+["”'’」]?\\s*)/);
          const sList = [];
          let cur = "";
          for (let pi = 0; pi < parts.length; pi++) {
            cur += parts[pi];
            const isPunct = /[.!?。！？]/.test(parts[pi]);
            if ((isPunct && cur.trim().length >= 70) || cur.length >= 220) {
              if (cur.trim() && validCharRegex.test(cur)) sList.push(cur.trim());
              cur = "";
            }
          }
          if (cur.trim() && validCharRegex.test(cur)) sList.push(cur.trim());
          if (sList.length > 0) {
            pEl.innerHTML = '';
            sList.forEach(sText => {
              const span = document.createElement('span');
              span.id = 's-' + sentenceCounter;
              span.setAttribute('data-sid', String(sentenceCounter));
              span.className = 'tts-sentence';
              span.textContent = sText + ' ';
              pEl.appendChild(span);
              sentenceCounter++;
            });
          }
        });
      } catch(wrapSentencesErr) {}

      return { indexed: idx, total: indexedEls.length };
    },

    highlightSentence: (sentenceText, sentenceId) => {
      if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.clearAllTtsHighlights === 'function') {
        window.__TienHiepHelpers.clearAllTtsHighlights();
      }

      let ttsStyle = document.getElementById('__tienhiep_tts_para_style');
      if (!ttsStyle) {
        ttsStyle = document.createElement('style');
        ttsStyle.id = '__tienhiep_tts_para_style';
        ttsStyle.textContent = '::highlight(tienhiep-tts-highlight) { background-color: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 3px !important; } #tienhiep-active-highlight, span#tienhiep-active-highlight, .tts-active-sentence { background-color: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 4px !important; padding: 2px 4px !important; box-shadow: 0 0 14px rgba(245, 158, 11, 0.85) !important; border-bottom: 2px solid #b45309 !important; display: inline !important; } [data-tts-active-para="true"] { border-left: 4px solid #8b5cf6 !important; padding-left: 8px !important; transition: border-left 0.2s ease !important; }';
        (document.head || document.documentElement).appendChild(ttsStyle);
      }

      const sId = typeof sentenceId === 'number' ? sentenceId : parseInt(sentenceId, 10);
      let targetEl = null;

      // 1. Ưu tiên khớp theo nội dung câu chữ thực tế đang đọc (sentenceText)
      if (sentenceText) {
        const cleanText = sentenceText.trim().replace(/^[“"'\s«『「]+|[”"'\s»』」]+$/gu, '').slice(0, 24);
        if (cleanText.length >= 4) {
          const allSpans = Array.from(document.querySelectorAll('.tts-sentence, p'));
          targetEl = allSpans.find(el => el.textContent && el.textContent.includes(cleanText)) || null;
        }
      }

      // 2. Dự phòng theo ID nếu không tìm thấy chuỗi văn bản
      if (!targetEl && !isNaN(sId) && sId > 0) {
        targetEl = document.getElementById('s-' + sId) || document.getElementById('s-' + (sId - 1));
      }

      if (!targetEl && document.querySelectorAll('.tts-sentence').length === 0) {
        if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
          window.__TienHiepHelpers.indexParagraphsForTTS();
          if (!isNaN(sId) && sId > 0) targetEl = document.getElementById('s-' + sId);
        }
      }

      if (targetEl) {
        targetEl.classList.add('tts-active-sentence');
        targetEl.style.backgroundColor = '#f59e0b';
        targetEl.style.color = '#000000';
        targetEl.style.borderRadius = '4px';
        targetEl.style.boxShadow = '0 0 14px rgba(245, 158, 11, 0.85)';
        targetEl.style.borderBottom = '2px solid #b45309';
        window.__lastTtsSentenceEl = targetEl;

        const parentPara = targetEl.closest('p, [data-tts-idx], .tienhiep-tts-paragraph');
        if (parentPara && !window.__TienHiepHelpers.isLargeContainerEl(parentPara)) {
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
