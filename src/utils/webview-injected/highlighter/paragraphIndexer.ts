// Paragraph indexing and sentence splitting script for TTS injection
export function getParagraphIndexerScript(): string {
  return `
    indexParagraphsForTTS: () => {
      const host = window.__TienHiepHelpers.getEffectiveUrl().hostname || '';
      let mainEl = null;

      document.querySelectorAll('[data-tts-idx]').forEach(el => {
        el.removeAttribute('data-tts-idx');
        el.style.cursor = '';
      });

      let idx = 0;
      const indexedEls = [];
      const isNav = /^(chương trước|chương sau|trở lại|danh sách|mục lục|trang trước|trang sau|上一章|下一章|回目录)$/i;
      const hasWord = /[a-zA-Z0-9\u4e00-\u9fa5\u00C0-\u1EF9]/;

      // 0. ƯU TIÊN CAO NHẤT: Smart Content Rule theo Bậc DOM và Đa Vùng đã học
      try {
        const smartRuleRaw = localStorage.getItem('__tienhiep_smart_content_rule_' + host) ||
                             localStorage.getItem('__tienhiep_smart_content_rule_' + host.replace(/^www\./, ''));
        if (smartRuleRaw) {
          const rule = JSON.parse(smartRuleRaw);
          if (rule && Array.isArray(rule.regions) && rule.regions.length > 0) {
            rule.regions.forEach(reg => {
              const container = document.querySelector(reg.lcaSelector);
              if (container) {
                const tag = (reg.chunkTag || 'p').toLowerCase();
                const candidates = Array.from(container.querySelectorAll(tag));
                candidates.forEach(el => {
                  if (el.closest('nav, header, footer, aside, .ad, .advertisement, [id*="google_ads"]')) return;
                  const txt = (el.innerText || el.textContent || '').trim();
                  if (txt && hasWord.test(txt) && !isNav.test(txt) && txt.length >= 6) {
                    let linkLen = 0;
                    el.querySelectorAll('a').forEach(a => linkLen += (a.textContent || '').length);
                    if (linkLen / (txt.length || 1) <= 0.25) {
                      el.setAttribute('data-tts-idx', String(idx));
                      el.style.cursor = 'pointer';
                      indexedEls.push(el);
                      idx++;
                    }
                  }
                });
              }
            });
          }
        }
      } catch(e) {}

      if (indexedEls.length === 0) {
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

        let pTags = Array.from(mainEl.querySelectorAll("p"));

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

      }

      let ttsStyle = document.getElementById('__tienhiep_tts_para_style');
      if (!ttsStyle) {
        ttsStyle = document.createElement('style');
        ttsStyle.id = '__tienhiep_tts_para_style';
        ttsStyle.textContent = '[data-tts-active="true"] { background: rgba(254, 240, 138, 0.45) !important; border-left: 4px solid #7c3aed !important; padding: 4px 8px !important; border-radius: 4px !important; transition: all 0.2s ease !important; } .tienhiep-tts-active-span { background: rgba(254, 240, 138, 0.5) !important; border-left: 3px solid #7c3aed !important; padding: 1px 4px !important; border-radius: 3px !important; display: inline-block !important; }';
        (document.head || document.documentElement).appendChild(ttsStyle);
      }

      if (!window.__tienhiepTapToReadInstalled) {
        window.__tienhiepTapToReadInstalled = true;
        let pointerDownPos = null;

        document.addEventListener('pointerdown', (e) => {
          pointerDownPos = { x: e.clientX, y: e.clientY, time: Date.now() };
        }, true);

        // Double click kích hoạt phát TTS từ đoạn đó
        document.addEventListener('dblclick', (e) => {
          if (window.__isTeachingNext) return;
          if (e.target && e.target.closest && e.target.closest('a, button, input, select, textarea, [onclick], [role="button"]')) return;
          const el = e.target && e.target.closest ? e.target.closest('[data-tts-idx]') : null;
          if (!el) return;
          const paraIdx = parseInt(el.getAttribute('data-tts-idx'), 10);
          if (isNaN(paraIdx)) return;

          const translatedText = (el.innerText || el.textContent || '').trim();
          try {
            window.parent.postMessage({
              type: 'START_TTS_FROM_PARAGRAPH',
              paraIdx,
              text: translatedText
            }, '*');
          } catch(err) {}

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
          let origZh = pEl.getAttribute('data-orig-zh') || '';
          if (!origZh) {
            try {
              const zhParts = [];
              const tw = document.createTreeWalker(pEl, NodeFilter.SHOW_TEXT);
              let tn = tw.nextNode();
              while (tn) {
                if (tn.__original_chinese__) {
                  zhParts.push(tn.__original_chinese__);
                } else if (/[一-龥]/.test(tn.nodeValue || '') && !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(tn.nodeValue || '')) {
                  tn.__original_chinese__ = tn.nodeValue;
                  zhParts.push(tn.nodeValue);
                } else if (window.__ti_translation_pairs && window.__ti_translation_pairs.has(tn.nodeValue)) {
                  zhParts.push(window.__ti_translation_pairs.get(tn.nodeValue));
                }
                tn = tw.nextNode();
              }
              if (zhParts.length > 0) origZh = zhParts.join('').trim();
            } catch(e) {}
          }
          if (origZh) {
            pEl.setAttribute('data-orig-zh', origZh);
          }
          if (pEl.querySelector('.tts-sentence')) {
            pEl.querySelectorAll('.tts-sentence').forEach(sp => {
              if (sp.parentNode) { while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp); sp.parentNode.removeChild(sp); }
            });
          }
          const text = (pEl.textContent || '').trim();
          if (!text) return;
          const parts = text.split(/([.!?。！？…]+["”'’」]*\\s*)/);
          const sList = [];
          let cur = "";
          for (let pi = 0; pi < parts.length; pi++) {
            cur += parts[pi];
            const isPunct = /[.!?。！？…]/.test(parts[pi]);
            if (isPunct || cur.length >= 200) {
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
              if (/[一-龥]/.test(sText) && !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(sText)) {
                if (span.firstChild) span.firstChild.__original_chinese__ = sText.trim();
              }
              pEl.appendChild(span);
              sentenceCounter++;
            });
          }
        });
      } catch(wrapSentencesErr) {}

      return { indexed: idx, total: indexedEls.length };
    },
  `;
}
