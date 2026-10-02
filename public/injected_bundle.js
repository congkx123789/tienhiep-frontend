(function() {
    if (window.__translatorInitialized) return;
    window.__translatorInitialized = true;
    window.__autoTranslateEnabled = false;

    
    // Lock String.prototype.tran to stop scripts like chinese.js from corrupting Vietnamese text
    try {
      window.zh_init = function() {};
      window.zh_tran = function() {};
      window.zh_tranBody = function() {};
      window.zh_getLang = function() {};
      Object.defineProperty(String.prototype, 'tran', {
        value: function() { return this.toString(); },
        writable: false,
        configurable: false
      });
      const hideGbkLang = () => {
        try {
          document.querySelectorAll('.lang, #zh_click_s, #zh_click_t, .textsel').forEach(el => el.remove());
          if (!document.getElementById('__tienhiep_hide_gbk_lang')) {
            const s = document.createElement('style');
            s.id = '__tienhiep_hide_gbk_lang';
            s.textContent = '.lang, #zh_click_s, #zh_click_t, .textsel { display: none !important; }';
            (document.head || document.documentElement).appendChild(s);
          }
        } catch(err) {}
      };
      hideGbkLang();
      document.addEventListener('DOMContentLoaded', hideGbkLang);
      setTimeout(hideGbkLang, 500);
      setTimeout(hideGbkLang, 1500);

      const adaptDesktopLayout = () => {
        try {
          const host = (window.location.hostname || '').toLowerCase();
          const isChinese = /[\u4e00-\u9fa5]/.test(document.title) || /(69shu|biquge|uukanshu|faloo|fanqie|ptwxz|b520|qidian)/i.test(host);
          if (!isChinese) return;

          document.querySelectorAll('table, td, th, div, span, p').forEach(el => {
            const w = el.getAttribute('width');
            if (w && (w.endsWith('px') || parseInt(w) >= 450)) {
              el.setAttribute('data-prev-width', w);
              el.setAttribute('width', '100%');
            }
            if (el.style && el.style.width && parseInt(el.style.width) >= 450) {
              el.style.width = '100%';
              el.style.maxWidth = '100vw';
            }
          });
          const readingContainer = document.querySelector('#content, .content, #booktxt, #htmlContent, .read-content, .yd_text2, .showtxt, #chaptercontent, [id*="content"], [class*="content"]');
          if (readingContainer) {
            document.body.style.maxWidth = '100vw';
            document.body.style.overflowX = 'hidden';
            readingContainer.style.maxWidth = '100vw';
            readingContainer.style.width = '100%';
            readingContainer.style.wordBreak = 'break-word';
            readingContainer.style.overflowWrap = 'break-word';
            readingContainer.style.boxSizing = 'border-box';
          }
        } catch(err) {}
      };
      adaptDesktopLayout();
      document.addEventListener('DOMContentLoaded', adaptDesktopLayout);
      setTimeout(adaptDesktopLayout, 500);
      setTimeout(adaptDesktopLayout, 1500);
    } catch(e) {}
  

    window.__TienHiepHelpers = {
      
    getEffectiveUrl: () => {
      let raw = window.__originalUrl || '';
      if (!raw || raw.startsWith('about:') || raw === 'null') {
        const baseEl = document.querySelector('base');
        raw = (baseEl && baseEl.href) || document.baseURI || window.location.href || '';
      }
      if (raw && (raw.includes('iframe_proxy') || raw.includes('localhost') || raw.includes('127.0.0.1'))) {
        try {
          const u = new URL(raw, window.location.href);
          const real = u.searchParams.get('url');
          if (real) raw = real;
        } catch(e) {}
      }
      try {
        return new URL(raw);
      } catch(e) {
        return {
          href: raw || '',
          origin: (raw && raw.startsWith('http')) ? (new URL(raw).origin) : '',
          host: '',
          hostname: '',
          pathname: '',
          search: '',
          protocol: ''
        };
      }
    },

    extractCleanChapterText: () => {
      const effUrl = window.__TienHiepHelpers.getEffectiveUrl();
      const host = effUrl.hostname || window.location.hostname || '';
      const apexHost = host.replace(/^www\./, '');
      let mainEl = null;

      // 0. Ưu tiên cao nhất: Selector vùng đọc do người dùng chỉ định
      try {
        const savedSel = localStorage.getItem('__tienhiep_content_selector_' + host) ||
                         localStorage.getItem('__tienhiep_content_selector_' + apexHost);
        if (savedSel) {
          const el = document.querySelector(savedSel);
          if (el && (el.innerText || "").trim().length > 35) {
            mainEl = el;
          }
        }
      } catch(e) {}

      // 1. Selector đặc thù theo từng tên miền lớn
      if (!mainEl) {
        const SELECTORS = {
          "qidian": ".read-content, #read-content",
          "fanqie": ".muye-reader-content-novel",
          "truyenfull": "#chapter-c, .chapter-c",
          "tangthuvien": ".box-chap, #chapter-content",
          "metruyenchu": "#chapter-detail",
          "hjwzw": "#content, .content",
          "uukanshu": "#contentbox, .contentbox",
          "69shuba": ".txtnav",
          "69shu": ".txtnav",
          "biquge": ".showtxt, #content, #chaptercontent",
          "xbiquge": "#content, .showtxt",
          "b520": "#content, .content"
        };

        for (const [domain, selector] of Object.entries(SELECTORS)) {
          if (host.includes(domain) || apexHost.includes(domain)) {
            const els = selector.split(",").map(s => s.trim());
            for (const sel of els) {
              const el = document.querySelector(sel);
              if (el && (el.innerText || "").trim().length > 40) {
                mainEl = el;
                break;
              }
            }
          }
          if (mainEl) break;
        }
      }

      // 2. Quét qua danh sách selector chuẩn toàn cầu
      if (!mainEl) {
        const UNIVERSAL_SELECTORS = [
          ".txtnav", "#content", "#txtContent", "#chaptercontent", "#chapterContent",
          "#contentbox", ".read-content", "#read-content", ".muye-reader-content-novel",
          "#chapter-c", ".chapter-c", ".box-chap", "#chapter-detail", ".showtxt",
          ".novel-content", ".reading-content", "article", ".entry-content",
          "#htmlContent", ".article-content", ".page-content", ".yd_text2", "#nr1",
          "#BookText", "#booktxt", ".book_con", "#acontent", ".reader-content",
          ".chapter_content", "#novelcontent", "#viewcontent", "#content_text",
          ".content-text", "#chapter-body", ".chapter-body", "#text_content"
        ];
        for (const sel of UNIVERSAL_SELECTORS) {
          const el = document.querySelector(sel);
          if (el) {
            const txt = (el.innerText || "").trim();
            let linkLen = 0;
            el.querySelectorAll("a").forEach(a => linkLen += (a.innerText || "").length);
            const density = linkLen / (txt.length || 1);
            if (txt.length > 200 && density < 0.25) {
              mainEl = el;
              break;
            }
          }
        }
      }

      // 3. Phân tích cây DOM Heuristic
      if (!mainEl) {
        let bestEl = null;
        let bestScore = -1;
        document.querySelectorAll("div, article, section, main").forEach(el => {
          if (el.closest('nav, header, footer, aside, .menu, .search, .navbar, .sidebar, .comments, [id*="comment"]')) {
            return;
          }
          const text = (el.innerText || "").trim();
          const textLength = text.length;
          if (textLength < 250) return;

          let linkTextLength = 0;
          el.querySelectorAll("a").forEach(a => linkTextLength += (a.innerText || "").length);
          const linkDensity = linkTextLength / (textLength || 1);
          if (linkDensity > 0.15) return;

          const pCount = el.querySelectorAll("p").length;
          const brCount = el.querySelectorAll("br").length;
          const score = textLength * (1 - linkDensity) * (pCount + (brCount / 2) + 1);
          if (score > bestScore) {
            bestScore = score;
            bestEl = el;
          }
        });
        if (bestEl && bestScore > 150) {
          mainEl = bestEl;
        }
      }

      if (!mainEl) {
        return {
          title: document.title || "Trang chủ",
          text: "",
          isChapter: false,
          error: "NOT_CHAPTER_PAGE"
        };
      }

      let chapterTitle = "Chương đọc";
      const headingCandidates = Array.from(document.querySelectorAll("h1, h2, h3, .chapter-title, .title, .title1, .nr_title, #nr_title, .readTitle, [class*='title'], [id*='title']"));
      
      const viHeading = headingCandidates.find(el => {
        const txt = (el.textContent || "").trim();
        return /Chương\s*\d+/i.test(txt) || /Chapter\s*\d+/i.test(txt);
      });

      const h1Heading = headingCandidates.find(el => {
        const isH1OrMain = el.tagName === 'H1' || el.classList.contains('title1');
        const txt = (el.textContent || "").trim();
        return isH1OrMain && txt.length > 0 && txt.length < 150;
      });

      const zhHeading = headingCandidates.find(el => {
        const txt = (el.textContent || "").trim();
        return /第\s*\d+\s*[章節页]/.test(txt);
      });

      const heading = viHeading || h1Heading || zhHeading;
      if (heading) {
        chapterTitle = heading.textContent.trim();
      } else {
        const viDocMatch = document.title.match(/(Chương\s*\d+[^\-_|]*)/i) || document.title.match(/(Chapter\s*\d+[^\-_|]*)/i);
        if (viDocMatch) {
          chapterTitle = viDocMatch[1].trim();
        } else {
          const zhDocMatch = document.title.match(/(第\s*\d+\s*[章節页][^\-_|]*)/);
          if (zhDocMatch) {
            chapterTitle = zhDocMatch[1].trim();
          }
        }
      }

      const clone = mainEl.cloneNode(true);
      clone.querySelectorAll('script, style, iframe, button, a, .ads, .advertisement, .comment, .social-share, .footer, .header, [id*="google_ads"]').forEach(el => el.remove());
      clone.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(String.fromCharCode(10))));
      clone.querySelectorAll('p').forEach(p => p.appendChild(document.createTextNode(String.fromCharCode(10))));

      let paragraphs = [];
      const isNav = /^(chương trước|chương sau|trở lại|danh sách|mục lục|trang trước|trang sau|上一章|下一章|回目录)$/i;
      const hasWord = /[a-zA-Z0-9\u4e00-\u9fa5\u00C0-\u1EF9]/;

      const rawLines = (clone.textContent || "").split(new RegExp('[\\r\\n]+'));
      rawLines.forEach(line => {
        const txt = line.trim();
        if (txt && hasWord.test(txt) && !isNav.test(txt)) paragraphs.push(txt);
      });

      if (paragraphs.length === 0) {
        const pTags = clone.querySelectorAll("p");
        pTags.forEach(p => {
          const txt = (p.textContent || "").trim();
          if (txt && hasWord.test(txt) && !isNav.test(txt)) paragraphs.push(txt);
        });
      }

      const contentHasVietnamese = paragraphs.some(p => /[a-zA-Z0-9\u00C0-\u1EF9]/.test(p) && !/[\u4e00-\u9fa5]/.test(p));
      const titleIsChinese = /[\u4e00-\u9fa5]/.test(chapterTitle);

      if (contentHasVietnamese && titleIsChinese) {
        const pureViCandidate = headingCandidates.find(el => {
          const txt = (el.textContent || "").trim();
          return txt.length > 2 && txt.length < 100 && !/[\u4e00-\u9fa5]/.test(txt) && (/Chương/i.test(txt) || /Chapter/i.test(txt) || el.tagName === 'H1' || el.classList.contains('title1'));
        });
        if (pureViCandidate) {
          chapterTitle = pureViCandidate.textContent.trim();
        } else {
          chapterTitle = "Chương đọc";
        }
      }

      if (chapterTitle === "Chương đọc" || !chapterTitle) {
        const docT = (document.title || "").trim();
        if (docT && !contentHasVietnamese) {
          chapterTitle = docT.split(/[-_|_]/)[0].trim() || docT;
        }
      }

      const newlineSep = String.fromCharCode(10) + String.fromCharCode(10);
      return { title: chapterTitle, text: paragraphs.join(newlineSep) };
    },
  
      
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
      const hasWord = /[a-zA-Z0-9\u4e00-\u9fa5\u00C0-\u1EF9]/;

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
        const viHeading = headingCandidates.find(el => /Chương\s*\d+/i.test((el.textContent || "").trim()));
        const h1Heading = headingCandidates.find(el => (el.tagName === 'H1' || el.classList.contains('title1')) && (el.textContent || "").trim().length < 150);
        const zhHeading = headingCandidates.find(el => /第\s*\d+\s*[章節页]/.test((el.textContent || "").trim()));
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

        const validCharRegex = /[\p{L}\p{N}]/u;
        indexedEls.forEach(pEl => {
          if (pEl.querySelector('.tts-sentence')) {
            pEl.querySelectorAll('.tts-sentence').forEach(sp => {
              if (sp.parentNode) { while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp); sp.parentNode.removeChild(sp); }
            });
          }
          const text = (pEl.textContent || '').trim();
          if (!text) return;
          const parts = text.split(/([.!?。！？]+["”'’」]?\s*)/);
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
        const cleanText = sentenceText.trim().replace(/^[“"'s«『「]+|[”"'s»』」]+$/gu, '').slice(0, 24);
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
  
      
    getNovelKeys: () => {
      const effUrl = window.__TienHiepHelpers.getEffectiveUrl();
      let host = effUrl.hostname || '';
      if ((!host || host === 'localhost' || host === '127.0.0.1') && window.__originalUrl) {
        try { host = new URL(window.__originalUrl).hostname || host; } catch(e) {}
      }
      const path = effUrl.pathname || '';
      const parts = path.split('/').filter(Boolean);
      let novelKey = host;

      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.') || /^\d+$/.test(lastPart)) {
          novelKey = host + '/' + parts.slice(0, parts.length - 1).join('/');
        } else {
          novelKey = host + '/' + parts.join('/');
        }
      } else if (parts.length === 1) {
        const onlyPart = parts[0];
        if (!onlyPart.includes('.') && !/^\d+$/.test(onlyPart)) {
          novelKey = host + '/' + onlyPart;
        }
      }
      return { host, novelKey, pathname: path, url: effUrl.href };
    },

    getSavedNextRules: () => {
      try {
        const allData = JSON.parse(localStorage.getItem('__tienhiep_novel_next_rules') || '{}');
        const { host, novelKey } = window.__TienHiepHelpers.getNovelKeys();
        let list = allData[novelKey] || allData[host] || [];
        if (!Array.isArray(list)) list = list ? [list] : [];
        return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      } catch (e) {
        return [];
      }
    },

    getSavedNextRule: () => {
      const list = window.__TienHiepHelpers.getSavedNextRules();
      return list.length > 0 ? list[0] : null;
    },

    saveNextRule: (ruleData) => {
      try {
        const allData = JSON.parse(localStorage.getItem('__tienhiep_novel_next_rules') || '{}');
        const { host, novelKey } = window.__TienHiepHelpers.getNovelKeys();
        let list = allData[novelKey] || allData[host] || [];
        if (!Array.isArray(list)) list = list ? [list] : [];

        const newRule = {
          id: ruleData.id || ('rule_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
          selector: (ruleData.selector || '').trim(),
          customUrl: (ruleData.customUrl || '').trim(),
          selectors: Array.isArray(ruleData.selectors) && ruleData.selectors.length > 0 ? ruleData.selectors : (ruleData.selector ? [ruleData.selector.trim()] : []),
          containerSelector: ruleData.containerSelector || '',
          childIndex: ruleData.childIndex,
          text: (ruleData.text || '').trim(),
          urlPattern: ruleData.urlPattern || null,
          pattern: ruleData.pattern || (ruleData.customUrl ? 'direct_url' : 'smart_teach'),
          title: ruleData.title || (ruleData.selector ? ('Selector: ' + ruleData.selector) : (ruleData.customUrl ? ('URL: ' + ruleData.customUrl) : 'Quy tắc tự học')),
          updatedAt: Date.now()
        };

        list = list.filter(r => {
          if (newRule.selector && r.selector && r.selector === newRule.selector) return false;
          if (newRule.customUrl && r.customUrl && r.customUrl === newRule.customUrl) return false;
          if (r.id === newRule.id) return false;
          return true;
        });

        list.unshift(newRule);
        if (list.length > 20) list = list.slice(0, 20);

        allData[novelKey] = list;
        allData[host] = list;
        localStorage.setItem('__tienhiep_novel_next_rules', JSON.stringify(allData));

        if (newRule.selector) localStorage.setItem('__tienhiep_custom_next_selector', newRule.selector);
        if (newRule.text) localStorage.setItem('__tienhiep_custom_next_text', newRule.text);
        return { success: true, rule: newRule, history: list };
      } catch (e) {
        return { success: false };
      }
    },

    selectNextRule: (ruleId) => {
      try {
        const allData = JSON.parse(localStorage.getItem('__tienhiep_novel_next_rules') || '{}');
        const { host, novelKey } = window.__TienHiepHelpers.getNovelKeys();
        let list = allData[novelKey] || allData[host] || [];
        if (!Array.isArray(list)) list = list ? [list] : [];

        const targetRule = list.find(r => r.id === ruleId);
        if (targetRule) {
          targetRule.updatedAt = Date.now();
          list = [targetRule, ...list.filter(r => r.id !== ruleId)];
          allData[novelKey] = list;
          allData[host] = list;
          localStorage.setItem('__tienhiep_novel_next_rules', JSON.stringify(allData));
          return { success: true, activeRule: targetRule, history: list };
        }
        return { success: false };
      } catch (e) {
        return { success: false };
      }
    },

    deleteNextRule: (ruleId = null) => {
      try {
        const allData = JSON.parse(localStorage.getItem('__tienhiep_novel_next_rules') || '{}');
        const { host, novelKey } = window.__TienHiepHelpers.getNovelKeys();
        let list = allData[novelKey] || allData[host] || [];
        if (!Array.isArray(list)) list = list ? [list] : [];

        if (ruleId) {
          list = list.filter(r => r.id !== ruleId);
          allData[novelKey] = list;
          allData[host] = list;
        } else {
          delete allData[novelKey];
          delete allData[host];
          list = [];
        }

        localStorage.setItem('__tienhiep_novel_next_rules', JSON.stringify(allData));
        if (list.length === 0) {
          localStorage.removeItem('__tienhiep_custom_next_selector');
          localStorage.removeItem('__tienhiep_custom_next_text');
        }
        return { success: true, history: list };
      } catch (e) {
        return { success: false };
      }
    },

    clearAllNextRules: () => {
      return window.__TienHiepHelpers.deleteNextRule(null);
    },
  

    findNextTarget: () => {
      const effUrl = window.__TienHiepHelpers.getEffectiveUrl();
      const currentHref = effUrl.href;
      const currentPath = effUrl.pathname;
      const currentOrigin = (effUrl.origin && effUrl.origin !== 'null') ? effUrl.origin : undefined;
      const baseForUrl = currentOrigin || (effUrl.href && effUrl.href.startsWith('http') ? effUrl.href : undefined);

      const negativeTextRegex = /^(目录|回目录|返回目录|目录页|首页|返回首页|书页|书目|书架|加入书签|书签|上一章|上一页|上一頁|上页|上頁|chương trước|trang trước|hồi trước|mục lục|danh sách|trang chủ|tủ sách|dấu trang)$/i;
      const negativeTextContainsRegex = /(回目录|返回目录|目录|首页|书架|书签|上一章|上一页|上一頁|chương trước|mục lục|trang chủ)/i;
      const nextKeywordRegex = /(下一章|下一页|下一頁|下页|下頁|chương sau|tiếp theo|hồi sau|trang sau|next chapter|next page)/i;

      let nextButtonPointsToBookInfo = false;

      const isNegativeUrl = (urlStr) => {
        if (!urlStr) return true;
        const lower = urlStr.toLowerCase();
        if (lower.startsWith('javascript:') || lower.startsWith('mailto:') || lower.startsWith('tel:')) return true;
        if (lower.includes('/catalog') || lower.includes('/index') || lower.includes('/dir') || lower.includes('/menu') || lower.includes('/chapterlist') || lower.includes('/list')) return true;
        if (lower.includes('/login') || lower.includes('/register') || lower.includes('/comment') || lower.includes('/vote') || lower.includes('/user')) return true;
        return false;
      };

      const isValidNextLink = (targetHref, candidateEl = null) => {
        if (!targetHref) return false;
        try {
          let resolved = baseForUrl ? new URL(targetHref, baseForUrl) : new URL(targetHref);
          if (resolved.protocol === 'javascript:') return false;
          if (resolved.href === currentHref) return false;
          if (currentOrigin && resolved.origin === currentOrigin && resolved.pathname === currentPath && resolved.search === (effUrl.search || '')) return false;
          
          const candidateTxt = candidateEl ? (candidateEl.textContent || "").trim() : "";
          const isExplicitNextBtn = nextKeywordRegex.test(candidateTxt);

          const pathTrimmed = resolved.pathname.replace(new RegExp('/+$'), '');
          const currentPathTrimmed = currentPath.replace(new RegExp('/+$'), '');
          const isParentBookDir = currentPathTrimmed.startsWith(pathTrimmed) && currentPathTrimmed.length > pathTrimmed.length;
          const isBookInfoPage = new RegExp('/book/\\d+(\\.[a-zA-Z]+)?$', 'i').test(resolved.pathname);

          if (isParentBookDir || isBookInfoPage) {
            if (isExplicitNextBtn) nextButtonPointsToBookInfo = true;
            return false;
          }

          if (isNegativeUrl(resolved.pathname) || isNegativeUrl(resolved.href)) return false;

          if (candidateEl) {
            if (negativeTextRegex.test(candidateTxt) || negativeTextContainsRegex.test(candidateTxt)) return false;
          }
          return resolved.href;
        } catch (e) {
          return false;
        }
      };

      const resolveTargetEl = (el, sourceDesc) => {
        if (!el) return null;
        const txt = (el.textContent || "").trim();
        if (negativeTextRegex.test(txt) || negativeTextContainsRegex.test(txt)) return null;

        const a = el.tagName === 'A' ? el : (el.closest('a') || el.querySelector('a'));
        if (a) {
          const aTxt = (a.textContent || "").trim();
          if (negativeTextRegex.test(aTxt) || negativeTextContainsRegex.test(aTxt)) return null;
          const validHref = isValidNextLink(a.href, a);
          if (validHref) return { type: 'element', el: a, source: sourceDesc };
        } else if (el) {
          return { type: 'element', el: el, source: sourceDesc };
        }
        return null;
      };

      const chapterNumRegex = new RegExp('(\\d+)(?:\\.[a-zA-Z]+|/)?(?:\\?.*)?$');

      // 1. Duyệt danh sách quy tắc đã lưu
      const savedRules = window.__TienHiepHelpers.getSavedNextRules();
      for (const savedRule of savedRules) {
        if (savedRule.customUrl) {
          const validHref = isValidNextLink(savedRule.customUrl);
          if (validHref) return { type: 'url', url: validHref, source: 'Quy tắc URL trực tiếp (' + savedRule.customUrl + ')' };
        }

        const selectorsToTry = [];
        if (Array.isArray(savedRule.selectors)) selectorsToTry.push(...savedRule.selectors);
        if (savedRule.selector && !selectorsToTry.includes(savedRule.selector)) selectorsToTry.unshift(savedRule.selector);

        for (const sel of selectorsToTry) {
          try {
            if (sel === 'a' || sel === 'button') continue;
            const foundEls = Array.from(document.querySelectorAll(sel));
            for (const el of foundEls) {
              const resolved = resolveTargetEl(el, 'Quy tắc chỉ định (' + sel + ')');
              if (resolved) return resolved;
            }
          } catch (e) {}
        }

        if (savedRule.containerSelector) {
          try {
            const container = document.querySelector(savedRule.containerSelector);
            if (container) {
              const links = Array.from(container.querySelectorAll('a, button')).filter(el => {
                const txt = (el.textContent || "").trim();
                return !negativeTextRegex.test(txt) && !negativeTextContainsRegex.test(txt);
              });
              if (savedRule.childIndex !== undefined && links[savedRule.childIndex]) {
                const resolved = resolveTargetEl(links[savedRule.childIndex], 'Chỉ định: đúng vị trí trong cụm');
                if (resolved) return resolved;
              }
            }
          } catch (e) {}
        }

        if (savedRule.text && !negativeTextContainsRegex.test(savedRule.text)) {
          const targetTxt = savedRule.text.trim().toLowerCase();
          const allCandidates = Array.from(document.querySelectorAll("a, button, [role='button']"));
          for (const el of allCandidates) {
            const t = (el.textContent || "").trim().toLowerCase();
            if (t && (t === targetTxt || t.includes(targetTxt))) {
              const resolved = resolveTargetEl(el, 'Chữ nút đã chỉ định: ' + savedRule.text);
              if (resolved) return resolved;
            }
          }
        }
      }

      // 2. Tự động tăng số chương (+1) trên URL hiện tại
      try {
        const numMatch = currentHref.match(chapterNumRegex);
        if (numMatch) {
          const currentNum = parseInt(numMatch[1], 10);
          const nextNum = currentNum + 1;
          const allLinks = Array.from(document.querySelectorAll("a[href]"));
          
          for (const a of allLinks) {
            const validHref = isValidNextLink(a.href, a);
            if (!validHref) continue;
            const targetMatch = validHref.match(chapterNumRegex);
            if (targetMatch && parseInt(targetMatch[1], 10) === nextNum) {
              return { type: 'element', el: a, source: 'Tự động link URL (+1)' };
            }
          }
        }
      } catch (e) {}

      // 3. Khớp từ khóa chương sau chính xác
      const regexExact = /^\s*(下一章|下一页|下一頁|下页|下頁|chương sau|tiếp theo|hồi sau|trang sau|next chapter|next page|sau)\s*$/i;
      const textCandidates = Array.from(document.querySelectorAll("a[href], button, [role='button'], a"));
      for (const el of textCandidates) {
        const txt = (el.textContent || "").trim();
        if (regexExact.test(txt)) {
          const resolved = resolveTargetEl(el, 'Khớp chữ: ' + txt);
          if (resolved) return resolved;
        }
      }

      // 4. Các Selector chuẩn của các nền tảng truyện
      const commonSelectors = [
        '#page_next a', '.page_next a', '#page_next', '.page_next',
        'a[rel="next"]', '[rel="next"]',
        '.next-btn', '#next-chap', '.next', '#next', '.next-chapter', '#next-chapter',
        '[id*="next-chap"]', '[class*="next-chap"]', '[id*="next_url"]', '[class*="next_url"]',
        '#next_url', '#pb_next', '#pt_next', '#linkNext', '.linkNext', '#chapter_next',
        'a.next', 'a.nextchapter', 'a.btn-next'
      ];
      for (const sel of commonSelectors) {
        try {
          const candidates = Array.from(document.querySelectorAll(sel));
          for (const el of candidates) {
            const resolved = resolveTargetEl(el, 'Selector chuẩn: ' + sel);
            if (resolved) return resolved;
          }
        } catch (e) {}
      }

      if (nextButtonPointsToBookInfo) {
        return { type: 'last_chapter', source: 'Nút Chương Sau trỏ về thông tin truyện (Đã hết chương)' };
      }

      return null;
    },
  

    triggerNavigation: (target) => {
      if (!target) return false;
      try {
        localStorage.setItem('__tienhiep_auto_translate_active', 'true');
      } catch(e) {}

      let destUrl = '';
      let clickEl = null;

      if (typeof target === 'string') {
        destUrl = target;
      } else if (target.type === 'url' && target.url) {
        destUrl = target.url;
      } else if (target.type === 'element' && target.el) {
        clickEl = target.el;
        const anchor = clickEl.tagName === "A" ? clickEl : (clickEl.closest('a') || clickEl.querySelector('a'));
        if (anchor && anchor.href && !anchor.href.startsWith("javascript:")) {
          destUrl = anchor.href;
        }
      } else if (target.tagName) {
        clickEl = target;
        const anchor = clickEl.tagName === "A" ? clickEl : (clickEl.closest('a') || clickEl.querySelector('a'));
        if (anchor && anchor.href && !anchor.href.startsWith("javascript:")) {
          destUrl = anchor.href;
        }
      }

      if (destUrl) {
        let fullUrl = destUrl;
        try {
          const effUrl = window.__TienHiepHelpers.getEffectiveUrl();
          const baseForNav = (effUrl.origin && effUrl.origin !== 'null' ? effUrl.origin : null) || effUrl.href;
          if (baseForNav && baseForNav.startsWith('http')) {
            fullUrl = new URL(destUrl, baseForNav).href;
          } else {
            fullUrl = new URL(destUrl, window.location.href).href;
          }
        } catch(e) {}

        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'NAVIGATE_REQ', tabId: (window as any).__TIENHIEP_TAB_ID__, url: fullUrl }, '*');
          return true;
        }
        window.location.href = fullUrl;
        return true;
      }

      if (clickEl) {
        clickEl.click();
        return true;
      }
      return false;
    },
    
    checkAndTriggerAutoNext: (force = true, delaySeconds = 0) => {
      if (window.isTtsPlaying && !force) return false;

      const target = window.__TienHiepHelpers.findNextTarget();

      if (target && target.type === 'last_chapter') {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'LAST_CHAPTER_REACHED' }, '*');
        }
        const tip = document.createElement("div");
        tip.style.cssText = "position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:12px 18px;border-radius:10px;z-index:99999;font-size:12px;font-weight:bold;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-family:sans-serif;max-width:320px;";
        tip.innerText = '🎉 Bạn đã nghe đến chương mới nhất hiện có của truyện! Hãy chờ tác giả ra chương mới.';
        document.body.appendChild(tip);
        setTimeout(() => tip.remove(), 5000);
        return false;
      }

      if (target) {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'NEXT_CHAPTER_FOUND' }, '*');
        }
        const delay = (delaySeconds !== undefined && delaySeconds !== null) ? Number(delaySeconds) : 0;
        if (delay <= 0) {
          return window.__TienHiepHelpers.triggerNavigation(target);
        }

        const existingCountdown = document.getElementById("__next_chapter_countdown");
        if (existingCountdown) existingCountdown.remove();

        const tip = document.createElement("div");
        tip.id = "__next_chapter_countdown";
        tip.style.cssText = "position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#4f46e5,#3730a3);color:#fff;padding:10px 18px;border-radius:12px;z-index:99999;font-size:12px;font-weight:bold;box-shadow:0 8px 24px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.25);display:flex;align-items:center;gap:10px;font-family:sans-serif;";
        
        let remaining = delay;
        tip.innerHTML = '<span>⏱️ Chuyển chương sau trong <b id="__next_sec" style="color:#fde047;font-size:14px;">' + remaining + '</b>s...</span><button id="__cancel_next_sec" style="background:rgba(239,68,68,0.8);border:none;color:#fff;padding:3px 8px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:bold;">Hủy</button>';
        document.body.appendChild(tip);

        let isCancelled = false;
        const timer = setInterval(() => {
          remaining--;
          const secEl = document.getElementById("__next_sec");
          if (secEl) secEl.innerText = remaining;
          if (remaining <= 0) clearInterval(timer);
        }, 1000);

        const cancelBtn = document.getElementById("__cancel_next_sec");
        if (cancelBtn) {
          cancelBtn.onclick = () => {
            isCancelled = true;
            clearInterval(timer);
            tip.remove();
          };
        }

        setTimeout(() => {
          clearInterval(timer);
          if (isCancelled) return;
          window.__TienHiepHelpers.triggerNavigation(target);
          tip.remove();
        }, delay * 1000);
        return true;
      } else if (force) {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'NEXT_CHAPTER_NOT_FOUND', url: window.location.href }, '*');
        }
        const tip = document.createElement("div");
        tip.style.cssText = "position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;padding:12px 18px;border-radius:10px;z-index:99999;font-size:12px;font-weight:bold;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-family:sans-serif;max-width:320px;";
        tip.innerText = '⚠️ Không tìm thấy nút Chương Sau! Hãy dùng nút Chỉ Định Nút trên thanh công cụ để ghi nhớ nút cho truyện này.';
        document.body.appendChild(tip);
        setTimeout(() => tip.remove(), 4000);
        return false;
      }
      return false;
    },

    checkAndTriggerAutoPrev: () => {
      let prevBtn = null;
      const selector = '.prev-btn, #prev-chap, .prev, #prev, .prev-chapter, #prev-chapter, [id*="prev-chap"], [class*="prev-chap"], a[rel="prev"]';
      const selectors = selector.split(",").map(s => s.trim());
      for (const sel of selectors) {
        try {
          const el = document.querySelector(sel);
          if (el) {
            prevBtn = el;
            break;
          }
        } catch (e) {}
      }

      if (!prevBtn) {
        const regex = /^\s*(上一章|上一页|上一頁|chương trước|trang trước|hồi trước|prev chapter)\s*$/i;
        prevBtn = Array.from(document.querySelectorAll("a, button, span")).find(el => {
          return regex.test((el.textContent || "").trim());
        });
      }

      if (prevBtn) {
        localStorage.setItem('__tienhiep_auto_translate_active', 'true');
        return window.__TienHiepHelpers.triggerNavigation(prevBtn);
      }
      return false;
    },
  
      
    startTeachNextMode: () => {
      
    window.__isTeachingNext = true;
    const existingBanner = document.getElementById("__teach_next_banner");
    if (existingBanner) existingBanner.remove();
    const existingBox = document.getElementById("__teach_highlighter_box");
    if (existingBox) existingBox.remove();
    const existingCrosshair = document.getElementById("__teach_crosshair_target");
    if (existingCrosshair) existingCrosshair.remove();

    const bindInstantAction = (el, fn) => {
      if (!el) return;
      let isLocked = false;
      const handler = (e) => {
        if (isLocked) return;
        isLocked = true;
        setTimeout(() => { isLocked = false; }, 320);
        try {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        } catch(err) {}
        fn(e);
      };
      el.addEventListener('pointerdown', handler, { passive: false, capture: true });
      el.addEventListener('touchstart', handler, { passive: false, capture: true });
      el.addEventListener('click', handler, { passive: false, capture: true });
    };

    const banner = document.createElement("teach-banner");
    banner.id = "__teach_next_banner";
    banner.style.cssText = "position:fixed !important;top:10px !important;left:8px !important;right:8px !important;max-width:700px !important;margin:0 auto !important;background:linear-gradient(135deg,#0f172a,#1e1b4b) !important;color:#ffffff !important;padding:8px 12px !important;border-radius:14px !important;z-index:2147483647 !important;font-size:12px !important;font-weight:bold !important;box-shadow:0 14px 40px rgba(0,0,0,0.92) !important;display:flex !important;flex-direction:row !important;align-items:center !important;justify-content:space-between !important;gap:8px !important;border:1.5px solid rgba(129,140,248,0.6) !important;font-family:system-ui,sans-serif !important;box-sizing:border-box !important;pointer-events:auto !important;-webkit-user-select:none !important;user-select:none !important;";
    banner.innerHTML = '<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;overflow:hidden;"><span id="__teach_info_text" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;color:#c7d2fe;">🎯 <b>Chỉ định:</b> Rê tâm ngắm vào Nút hoặc Vùng đọc</span></div><div style="display:flex;align-items:center;gap:6px;flex-shrink:0;"><button id="__read_from_here" style="display:none;background:linear-gradient(135deg,#8b5cf6,#6d28d9) !important;border:none !important;color:#fff !important;padding:7px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(139,92,246,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">📖 Đọc từ đây</button><button id="__scope_toggle_btn" style="display:none;background:linear-gradient(135deg,#0ea5e9,#0284c7) !important;border:none !important;color:#fff !important;padding:7px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(14,165,233,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">📦 Cả vùng</button><button id="__save_content_area" style="display:none;background:linear-gradient(135deg,#10b981,#059669) !important;border:none !important;color:#fff !important;padding:7px 12px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(16,185,129,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">✓ Lưu vùng này</button><button id="__back_to_chunk" style="display:none;background:rgba(255,255,255,0.2) !important;border:none !important;color:#fff !important;padding:7px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">📄 1 Đoạn</button><button id="__confirm_teach_next" style="display:none;background:linear-gradient(135deg,#10b981,#059669) !important;border:none !important;color:#fff !important;padding:7px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(16,185,129,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">✓ Lưu nút</button><button id="__test_next_teach" style="display:none;background:linear-gradient(135deg,#f59e0b,#d97706) !important;border:none !important;color:#fff !important;padding:7px 9px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">⏭ Thử</button><button id="__reset_teach_next" style="background:rgba(255,255,255,0.18) !important;border:none !important;color:#fff !important;padding:7px 9px !important;border-radius:8px !important;cursor:pointer !important;font-weight:600 !important;font-size:11px !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">Mặc định</button><button id="__cancel_teach_next" style="background:linear-gradient(135deg,#ef4444,#dc2626) !important;border:none !important;color:#fff !important;padding:7px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:12px !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;box-shadow:0 0 10px rgba(239,68,68,0.5) !important;">✕ Hủy</button></div>';
    document.body.appendChild(banner);

    const highlightBox = document.createElement("teach-highlighter");
    highlightBox.id = "__teach_highlighter_box";
    highlightBox.style.cssText = "position:fixed !important;pointer-events:none !important;z-index:2147483640 !important;outline:2.5px solid #f59e0b !important;outline-offset:-1px !important;background:rgba(245,158,11,0.2) !important;box-shadow:0 0 18px rgba(245,158,11,0.7), inset 0 0 12px rgba(245,158,11,0.25) !important;border-radius:6px !important;display:none !important;box-sizing:border-box !important;will-change:top,left,width,height !important;";
    document.body.appendChild(highlightBox);

    const floatingBadge = document.createElement("div");
    floatingBadge.id = "__teach_floating_badge";
    floatingBadge.style.cssText = "position:fixed !important;pointer-events:auto !important;display:none !important;background:linear-gradient(135deg,#0f172a,#1e1b4b) !important;border:1.5px solid #f59e0b !important;color:#ffffff !important;border-radius:10px !important;padding:6px 10px !important;font-size:11px !important;font-family:system-ui,sans-serif !important;white-space:nowrap !important;box-shadow:0 8px 24px rgba(0,0,0,0.92) !important;z-index:2147483647 !important;align-items:center !important;gap:8px !important;box-sizing:border-box !important;max-width:94vw !important;";
    floatingBadge.innerHTML = '<div style="display:flex;flex-direction:column;gap:2px;min-width:0;overflow:hidden;"><div style="display:flex;align-items:center;gap:5px;"><span id="__teach_badge_type_tag" style="background:#f59e0b;color:#0f172a;font-weight:900;padding:1px 5px;border-radius:4px;font-size:9px;">MỤC TIÊU</span><span id="__teach_badge_name" style="font-weight:bold;color:#fde047;max-width:140px;overflow:hidden;text-overflow:ellipsis;">...</span></div><div id="__teach_badge_sub" style="font-size:10px;color:#94a3b8;max-width:190px;overflow:hidden;text-overflow:ellipsis;">...</div></div><div style="display:flex;align-items:center;gap:4px;flex-shrink:0;"><button id="__teach_badge_prev" title="Chọn nút trước trong cụm" style="background:rgba(255,255,255,0.18) !important;border:none !important;color:#fff !important;padding:5px 8px !important;border-radius:6px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">◀</button><button id="__teach_badge_next" title="Chọn nút sau trong cụm" style="background:rgba(255,255,255,0.18) !important;border:none !important;color:#fff !important;padding:5px 8px !important;border-radius:6px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">▶</button><button id="__teach_badge_read" style="display:none;background:linear-gradient(135deg,#8b5cf6,#6d28d9) !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 10px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">📖 Đọc</button><button id="__teach_badge_scope" style="display:none;background:linear-gradient(135deg,#0ea5e9,#0284c7) !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 9px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">📦 Cả vùng</button><button id="__teach_badge_save" style="background:#10b981 !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 10px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;box-shadow:0 0 10px rgba(16,185,129,0.6) !important;min-height:30px !important;touch-action:manipulation !important;">✓ Lưu</button></div>';
    document.body.appendChild(floatingBadge);

    const crosshair = document.createElement("teach-crosshair");
    crosshair.id = "__teach_crosshair_target";
    const initX = Math.max(10, Math.round(window.innerWidth / 2 - 34));
    const initY = Math.max(80, Math.round(window.innerHeight * 0.65 - 34));
    crosshair.style.cssText = "position:fixed !important;left:" + initX + "px !important;top:" + initY + "px !important;width:68px !important;height:68px !important;z-index:2147483646 !important;cursor:grab !important;touch-action:none !important;user-select:none !important;-webkit-user-select:none !important;display:flex !important;align-items:center !important;justify-content:center !important;border-radius:50% !important;border:3px dashed #f59e0b !important;background:rgba(245,158,11,0.25) !important;box-shadow:0 0 24px rgba(245,158,11,0.8), inset 0 0 12px rgba(245,158,11,0.3) !important;box-sizing:border-box !important;";
    crosshair.innerHTML = '<div id="__teach_ch_h" style="position:absolute;width:100%;height:2px;background:#f59e0b !important;top:50%;left:0;pointer-events:none;transform:translateY(-50%);"></div><div id="__teach_ch_v" style="position:absolute;height:100%;width:2px;background:#f59e0b !important;left:50%;top:0;pointer-events:none;transform:translateX(-50%);"></div><div id="__teach_ch_dot" style="width:16px;height:16px;border-radius:50%;background:#ef4444 !important;border:2px solid #ffffff !important;box-shadow:0 0 10px #ef4444 !important;pointer-events:none;z-index:2;"></div><div id="__teach_ch_lbl" style="position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:6px;background:#f59e0b !important;color:#0f172a !important;font-size:11px !important;font-weight:900 !important;padding:5px 12px !important;border-radius:8px !important;white-space:nowrap !important;box-shadow:0 4px 14px rgba(0,0,0,0.85) !important;pointer-events:auto !important;cursor:grab !important;touch-action:none !important;letter-spacing:0.3px !important;border:1.5px solid #ffffff !important;user-select:none !important;-webkit-user-select:none !important;">🎯 RÊ TÂM NGẮM</div>';
    document.body.appendChild(crosshair);
  
      
    const findContentContainer = (target) => {
      if (!target || target === document.body || target === document.documentElement) return null;

      const NOVEL_SELECTORS = [
        ".txtnav", "#content", "#chaptercontent", "#chapterContent", "#contentbox",
        ".read-content", "#read-content", ".muye-reader-content-novel", "#chapter-c",
        ".chapter-c", ".box-chap", "#chapter-detail", ".showtxt", ".novel-content",
        ".reading-content", "article", ".entry-content", "#htmlContent", ".article-content",
        ".page-content", ".yd_text2", "#nr1", "#BookText", "#booktxt", ".book_con",
        "#acontent", ".reader-content", ".chapter_content", "#novelcontent", "#viewcontent",
        "#content_text", ".content-text", "#chapter-body", ".chapter-body", "#text_content"
      ];

      for (const sel of NOVEL_SELECTORS) {
        try {
          const matched = target.closest ? target.closest(sel) : null;
          if (matched && matched !== document.body && matched !== document.documentElement) {
            const pCount = matched.querySelectorAll('p, [data-tts-idx]').length;
            const txtLen = (matched.innerText || '').trim().length;
            if (pCount >= 2 || txtLen > 150) return matched;
          }
        } catch(e) {}
      }

      const directPCount = target.querySelectorAll ? target.querySelectorAll('p, [data-tts-idx]').length : 0;
      if (directPCount >= 3) return target;

      let curr = target.parentElement;
      let bestCandidate = null;
      let maxPCount = 0;

      while (curr && curr !== document.body && curr !== document.documentElement) {
        const tag = curr.tagName.toLowerCase();
        if (tag === 'header' || tag === 'footer' || tag === 'nav' || tag === 'aside') break;

        const id = (curr.id || '').toLowerCase();
        const cls = typeof curr.className === 'string' ? curr.className.toLowerCase() : '';
        if (id === 'app' || id === '__next' || id === 'root') break;

        const pCount = curr.querySelectorAll('p, [data-tts-idx]').length;
        const textLen = (curr.innerText || '').trim().length;

        if (/(content|chapter|read|article|txtnav|showtxt|booktext|yd_text)/i.test(id + ' ' + cls)) {
          if (pCount >= 2 || textLen > 200) return curr;
        }

        if (pCount >= 3 && pCount >= maxPCount) {
          maxPCount = pCount;
          bestCandidate = curr;
        }
        curr = curr.parentElement;
      }
      return bestCandidate || target.parentElement || target;
    };

    const generateContainerSelector = (el) => {
      if (!el || el === document.body || el === document.documentElement) return '';

      const STANDARD_CONTAINERS = [
        '.txtnav', '#content', '#chaptercontent', '#chapterContent',
        '.read-content', '#read-content', '.muye-reader-content-novel',
        '#chapter-c', '.chapter-c', '.box-chap', '#chapter-detail',
        '.showtxt', '.novel-content', '.reading-content', 'article'
      ];
      for (const std of STANDARD_CONTAINERS) {
        try {
          if (el.matches && el.matches(std)) return std;
          const closest = el.closest ? el.closest(std) : null;
          if (closest && closest !== document.body && closest !== document.documentElement) return std;
        } catch(e) {}
      }

      if (el.id && !/\d{4,}/.test(el.id)) return '#' + el.id;

      if (el.className && typeof el.className === 'string') {
        const classes = el.className.trim().split(/\s+/).filter(c => c && !c.includes(':') && !c.includes('/') && !/\d{4,}/.test(c));
        if (classes.length > 0) {
          for (const cls of classes) {
            const singleClass = '.' + cls;
            try {
              if (document.querySelectorAll(singleClass).length === 1) return singleClass;
            } catch(e) {}
          }
          if (classes.length > 1) {
            const combined = '.' + classes.slice(0, 2).join('.');
            try {
              if (document.querySelectorAll(combined).length === 1) return combined;
            } catch(e) {}
          }
        }
      }

      if (el.parentElement && el.parentElement.id && !/\d{4,}/.test(el.parentElement.id)) {
        return '#' + el.parentElement.id + ' > ' + el.tagName.toLowerCase();
      }

      const tag = el.tagName.toLowerCase();
      if (tag === 'article') return 'article';
      const firstCls = el.className && typeof el.className === 'string' ? el.className.trim().split(/\s+/).find(c => c && !/\d{4,}/.test(c)) : '';
      return tag + (firstCls ? '.' + firstCls : '');
    };

    const refineToBestTarget = (rawEl, cx, cy) => {
      if (!rawEl || rawEl === document.body || rawEl === document.documentElement) return null;
      
      const directAnchor = rawEl.tagName === 'A' ? rawEl : rawEl.closest('a');
      if (directAnchor) return directAnchor;
      
      const directBtn = rawEl.tagName === 'BUTTON' ? rawEl : rawEl.closest('button');
      if (directBtn) return directBtn;

      const pEl = rawEl.tagName === 'P' ? rawEl : (rawEl.closest('[data-tts-idx]') || rawEl.closest('p'));
      if (pEl) return pEl;

      const pCountInRaw = rawEl.querySelectorAll ? rawEl.querySelectorAll('p, [data-tts-idx]').length : 0;
      if (pCountInRaw === 0) {
        const candidateLinks = Array.from(rawEl.querySelectorAll('a[href], button, [role="button"]')).filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });

        if (candidateLinks.length > 0) {
          const nextRel = candidateLinks.find(a => a.getAttribute('rel') === 'next');
          if (nextRel) return nextRel;

          const nextKwRegex = /(下一章|下一页|下一頁|下页|下頁|chương sau|tiếp theo|hồi sau|trang sau|next chapter|next page|sau|trang kế)/i;
          const nextKw = candidateLinks.find(a => nextKwRegex.test((a.textContent || '').trim()));
          if (nextKw) return nextKw;

          if (cx !== undefined && cy !== undefined) {
            let closest = candidateLinks[0];
            let minDist = Infinity;
            candidateLinks.forEach(a => {
              const r = a.getBoundingClientRect();
              const acx = r.left + r.width / 2;
              const acy = r.top + r.height / 2;
              const d = Math.hypot(cx - acx, cy - acy);
              if (d < minDist) {
                minDist = d;
                closest = a;
              }
            });
            return closest;
          }
          return candidateLinks[candidateLinks.length - 1];
        }
      }
      return rawEl;
    };

    const generateSmartRule = (target) => {
      const anchor = target.tagName === 'A' ? target : (target.closest('a') || target.querySelector('a') || target);
      const selectors = [];
      let containerSelector = '';
      let childIndex = undefined;

      const rawHref = (anchor && anchor.getAttribute) ? anchor.getAttribute('href') : '';
      const text = (target.textContent || (anchor ? anchor.textContent : '') || '').trim();

      let urlPattern = null;
      if (rawHref && !rawHref.startsWith('javascript:')) {
        const m = rawHref.match(new RegExp('^(.*?)(\\d+)(\\.[a-zA-Z]+|/)?$'));
        if (m) urlPattern = { prefix: m[1], suffix: m[3] || '' };
      }

      if (anchor && anchor.id) selectors.push('#' + anchor.id);
      if (anchor && anchor.getAttribute && anchor.getAttribute('rel') === 'next') selectors.push('a[rel="next"]');

      const parent = anchor ? anchor.parentElement : null;
      if (parent) {
        if (parent.id) {
          selectors.push('#' + parent.id + ' ' + anchor.tagName.toLowerCase());
          containerSelector = '#' + parent.id;
        } else if (parent.className && typeof parent.className === 'string') {
          const pClasses = parent.className.trim().split(/\s+/).filter(c => c && !c.includes(':'));
          if (pClasses.length > 0) {
            selectors.push('.' + pClasses[0] + ' ' + anchor.tagName.toLowerCase());
            containerSelector = '.' + pClasses[0];
          }
        }

        const siblings = Array.from(parent.querySelectorAll('a, button'));
        const idx = siblings.indexOf(anchor);
        if (idx !== -1) {
          childIndex = idx;
          if (containerSelector) {
            if (idx === siblings.length - 1) {
              selectors.push(containerSelector + ' a:last-child');
            } else {
              selectors.push(containerSelector + ' a:nth-child(' + (idx + 1) + ')');
            }
          }
        }
      }

      if (anchor && anchor.className && typeof anchor.className === 'string') {
        const classes = anchor.className.trim().split(/\s+/).filter(c => c && !c.includes(':'));
        if (classes.length > 0) selectors.push(anchor.tagName.toLowerCase() + '.' + classes[0]);
      }

      if (anchor && anchor.tagName) selectors.push(anchor.tagName.toLowerCase());
      const uniqueSelectors = Array.from(new Set(selectors.filter(Boolean)));

      return {
        selector: uniqueSelectors[0] || 'a',
        selectors: uniqueSelectors,
        containerSelector,
        childIndex,
        text,
        urlPattern,
        rawHref,
        pattern: 'smart_teach'
      };
    };
  
      
    let currentTarget = null;
    let currentScope = 'chunk';
    let currentChunkTarget = null;
    let currentContainerTarget = null;
    let isTargetParagraph = false;
    let rafLoopId = null;

    const updateHighlight = () => {
      if (!currentTarget) {
        highlightBox.style.setProperty("display", "none", "important");
        floatingBadge.style.setProperty("display", "none", "important");
        return;
      }
      const rect = currentTarget.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        highlightBox.style.setProperty("display", "block", "important");
        highlightBox.style.setProperty("left", rect.left + "px", "important");
        highlightBox.style.setProperty("top", rect.top + "px", "important");
        highlightBox.style.setProperty("width", rect.width + "px", "important");
        highlightBox.style.setProperty("height", rect.height + "px", "important");

        if (currentScope === 'container') {
          highlightBox.style.setProperty("outline", "3.5px solid #0ea5e9", "important");
          highlightBox.style.setProperty("background", "rgba(14,165,233,0.18)", "important");
          highlightBox.style.setProperty("box-shadow", "0 0 25px rgba(14,165,233,0.85), inset 0 0 18px rgba(14,165,233,0.22)", "important");
          floatingBadge.style.setProperty("border", "1.5px solid #0ea5e9", "important");
        } else {
          highlightBox.style.setProperty("outline", "2.5px solid #f59e0b", "important");
          highlightBox.style.setProperty("background", "rgba(245,158,11,0.2)", "important");
          highlightBox.style.setProperty("box-shadow", "0 0 18px rgba(245,158,11,0.7), inset 0 0 12px rgba(245,158,11,0.25)", "important");
          floatingBadge.style.setProperty("border", "1.5px solid #f59e0b", "important");
        }

        floatingBadge.style.setProperty("display", "flex", "important");
        const chRect = crosshair.getBoundingClientRect();
        let badgeTop = chRect.bottom + 12;
        if (badgeTop + 55 > window.innerHeight) badgeTop = Math.max(50, chRect.top - 58);
        let badgeLeft = Math.max(8, Math.min(window.innerWidth - 330, chRect.left + 34 - 150));
        floatingBadge.style.setProperty("top", badgeTop + "px", "important");
        floatingBadge.style.setProperty("left", badgeLeft + "px", "important");
      } else {
        highlightBox.style.setProperty("display", "none", "important");
        floatingBadge.style.setProperty("display", "none", "important");
      }
    };

    const startRafLoop = () => {
      if (rafLoopId) return;
      const loop = () => {
        updateHighlight();
        currentTarget ? (rafLoopId = requestAnimationFrame(loop)) : (rafLoopId = null);
      };
      rafLoopId = requestAnimationFrame(loop);
    };

    const stopRafLoop = () => {
      if (rafLoopId) { cancelAnimationFrame(rafLoopId); rafLoopId = null; }
    };

    const updateTargetUI = () => {
      if (!currentTarget) return;
      const getEl = (id) => document.getElementById(id);
      const isLinkOrBtn = !!currentTarget.closest('a, button, [role="button"], [id*="next"], [class*="next"]');
      const textSnippet = (currentTarget.textContent || "").trim().slice(0, 22);
      const tag = currentTarget.tagName.toLowerCase();

      const els = {
        infoText: getEl("__teach_info_text"), confirmBtn: getEl("__confirm_teach_next"), readBtn: getEl("__read_from_here"),
        scopeToggleBtn: getEl("__scope_toggle_btn"), saveContentBtn: getEl("__save_content_area"), backToChunkBtn: getEl("__back_to_chunk"),
        testNextBtn: getEl("__test_next_teach"), badgeTypeTag: getEl("__teach_badge_type_tag"), badgeName: getEl("__teach_badge_name"),
        badgeSub: getEl("__teach_badge_sub"), badgePrevBtn: getEl("__teach_badge_prev"), badgeNextBtn: getEl("__teach_badge_next"),
        badgeSaveBtn: getEl("__teach_badge_save"), badgeReadBtn: getEl("__teach_badge_read"), badgeScopeBtn: getEl("__teach_badge_scope")
      };

      const setDisplay = (el, show, style = "inline-flex") => { if (el) el.style.setProperty("display", show ? style : "none", "important"); };

      if (isLinkOrBtn) {
        const idStr = currentTarget.id ? ('#' + currentTarget.id) : '';
        const href = currentTarget.href || (currentTarget.querySelector ? (currentTarget.querySelector('a') || {}).href : '') || '';
        const hrefSnippet = href ? ' → ' + href.split('/').slice(-1)[0] : '';
        const displayName = textSnippet || (tag + idStr);

        if (els.badgeTypeTag) { els.badgeTypeTag.textContent = "NÚT CHUYỂN"; els.badgeTypeTag.style.background = "#10b981"; }
        if (els.infoText) els.infoText.innerHTML = '🎯 Đã nhắm nút: <b style="color:#fde047;">' + displayName + '</b>' + (hrefSnippet ? ' <span style="opacity:0.75;">' + hrefSnippet + '</span>' : '');
        [els.badgePrevBtn, els.badgeNextBtn, els.confirmBtn, els.badgeSaveBtn, els.testNextBtn].forEach(el => setDisplay(el, true));
        [els.readBtn, els.scopeToggleBtn, els.saveContentBtn, els.backToChunkBtn, els.badgeReadBtn, els.badgeScopeBtn].forEach(el => setDisplay(el, false));
        if (els.confirmBtn) els.confirmBtn.innerHTML = '✓ Lưu nút: ' + (textSnippet ? ('"' + textSnippet.slice(0, 10) + '"') : tag);
        if (els.badgeSaveBtn) { els.badgeSaveBtn.innerHTML = '✓ Lưu'; els.badgeSaveBtn.style.background = "#10b981"; }
        if (els.badgeName) els.badgeName.textContent = displayName;
        if (els.badgeSub) els.badgeSub.textContent = (tag + idStr) + hrefSnippet;
      } else if (currentScope === 'container') {
        const container = currentTarget;
        const pCount = container.querySelectorAll ? container.querySelectorAll('p, [data-tts-idx]').length : 0;
        const textLen = (container.innerText || "").trim().length;
        const sel = generateContainerSelector(container);

        if (els.badgeTypeTag) { els.badgeTypeTag.textContent = "📦 CẢ VÙNG ĐỌC"; els.badgeTypeTag.style.background = "#0ea5e9"; }
        if (els.badgeName) els.badgeName.textContent = sel || 'Vùng chứa truyện';
        if (els.badgeSub) els.badgeSub.textContent = (pCount > 0 ? ('Gồm ' + pCount + ' đoạn văn • ') : '') + textLen.toLocaleString('vi-VN') + ' ký tự';
        if (els.infoText) els.infoText.innerHTML = '🎯 <b>Vùng chứa cả chương:</b> <b style="color:#38bdf8;">' + (sel || 'Khối truyện') + '</b> (' + pCount + ' đoạn • ' + textLen.toLocaleString('vi-VN') + ' chữ)';

        [els.badgePrevBtn, els.badgeNextBtn, els.readBtn, els.confirmBtn, els.testNextBtn, els.scopeToggleBtn, els.badgeReadBtn].forEach(el => setDisplay(el, false));
        [els.saveContentBtn, els.backToChunkBtn, els.badgeScopeBtn, els.badgeSaveBtn].forEach(el => setDisplay(el, true));
        if (els.saveContentBtn) els.saveContentBtn.innerHTML = '✓ Lưu vùng này';
        if (els.backToChunkBtn) els.backToChunkBtn.innerHTML = '📄 1 Đoạn';
        if (els.badgeScopeBtn) { els.badgeScopeBtn.innerHTML = '📄 1 Đoạn'; els.badgeScopeBtn.style.background = "rgba(255,255,255,0.2)"; }
        if (els.badgeSaveBtn) { els.badgeSaveBtn.innerHTML = '✓ Lưu vùng này'; els.badgeSaveBtn.style.background = "#10b981"; }
      } else {
        let paraIdx = parseInt(currentTarget.getAttribute('data-tts-idx'));
        let totalParas = document.querySelectorAll('[data-tts-idx]').length;
        if (isNaN(paraIdx) || totalParas === 0) {
          const allP = Array.from(document.querySelectorAll('p'));
          paraIdx = allP.indexOf(currentTarget);
          totalParas = allP.length;
        }
        const stepDisplay = (paraIdx >= 0) ? ('Đoạn ' + (paraIdx + 1)) : 'Đoạn văn';
        const stepSub = (paraIdx >= 0 && totalParas > 0) ? ('Bước ' + (paraIdx + 1) + '/' + totalParas) : 'Đoạn đọc theo cây HTML';

        if (els.badgeTypeTag) { els.badgeTypeTag.textContent = stepDisplay.toUpperCase(); els.badgeTypeTag.style.background = "#8b5cf6"; }
        if (els.infoText) els.infoText.innerHTML = '🎯 <b>' + stepDisplay + ':</b> <span style="color:#c4b5fd;">"' + textSnippet + '..."</span>';
        [els.badgePrevBtn, els.badgeNextBtn, els.readBtn, els.scopeToggleBtn, els.badgeReadBtn, els.badgeScopeBtn].forEach(el => setDisplay(el, true));
        [els.confirmBtn, els.testNextBtn, els.saveContentBtn, els.backToChunkBtn, els.badgeSaveBtn].forEach(el => setDisplay(el, false));
        if (els.readBtn) els.readBtn.innerHTML = '📖 Đọc từ đây';
        if (els.scopeToggleBtn) els.scopeToggleBtn.innerHTML = '📦 Cả vùng';
        if (els.badgeReadBtn) els.badgeReadBtn.innerHTML = '📖 Đọc';
        if (els.badgeScopeBtn) { els.badgeScopeBtn.innerHTML = '📦 Cả vùng'; els.badgeScopeBtn.style.background = "linear-gradient(135deg,#0ea5e9,#0284c7)"; }
        if (els.badgeName) els.badgeName.textContent = textSnippet ? ('"' + textSnippet + '..."') : stepDisplay;
        if (els.badgeSub) els.badgeSub.textContent = stepSub + ' • Bấm "📦 Cả vùng" để ôm trọn cả bài';
      }
    };

    const applyTargetScope = (newScope) => {
      currentScope = newScope;
      if (currentScope === 'container') {
        const container = currentContainerTarget || (currentChunkTarget ? findContentContainer(currentChunkTarget) : null) || (currentTarget ? findContentContainer(currentTarget) : null);
        if (container) { currentTarget = container; currentContainerTarget = container; }
      } else {
        const chunk = currentChunkTarget || (currentTarget ? (currentTarget.tagName === 'P' ? currentTarget : currentTarget.querySelector('p')) : null);
        if (chunk) { currentTarget = chunk; currentChunkTarget = chunk; }
      }
      updateTargetUI();
      updateHighlight();
    };

    const handleTargetCandidate = (rawTarget, cx, cy) => {
      if (!rawTarget || (rawTarget.closest && rawTarget.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]'))) return;
      const target = refineToBestTarget(rawTarget, cx, cy);
      if (!target || target === document.body || target === document.documentElement) return;

      const isLinkOrBtn = !!target.closest('a, button, [role="button"], [id*="next"], [class*="next"]');
      isTargetParagraph = !isLinkOrBtn && (target.tagName === 'P' || target.hasAttribute('data-tts-idx') || (target.textContent || "").trim().length > 15);

      if (isTargetParagraph) {
        currentChunkTarget = target;
        currentContainerTarget = findContentContainer(target);
        currentTarget = (currentScope === 'container' && currentContainerTarget) ? currentContainerTarget : target;
      } else {
        currentTarget = target;
      }

      startRafLoop();
      updateTargetUI();
      updateHighlight();
    };

    const shiftTargetSibling = (dir) => {
      if (!currentTarget) return;
      if (isTargetParagraph) {
        const allParas = Array.from(document.querySelectorAll('[data-tts-idx], p')).filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && (el.textContent || '').trim().length > 5;
        });
        if (allParas.length > 1) {
          let currIdx = allParas.indexOf(currentTarget);
          if (currIdx === -1) currIdx = 0;
          let nextIdx = (currIdx + dir + allParas.length) % allParas.length;
          currentTarget = allParas[nextIdx];
          handleTargetCandidate(currentTarget);
          currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      const parent = currentTarget.parentElement;
      if (!parent) return;
      const siblings = Array.from(parent.querySelectorAll('a, button, [role="button"], p')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (siblings.length <= 1) return;
      const currIdx = siblings.indexOf(currentTarget);
      if (currIdx === -1) return;
      currentTarget = siblings[(currIdx + dir + siblings.length) % siblings.length];
      handleTargetCandidate(currentTarget);
    };

    const detectUnderCrosshair = (centerX, centerY) => {
      let elements = typeof document.elementsFromPoint === 'function' ? (document.elementsFromPoint(centerX, centerY) || []) : [];
      if (elements.length === 0) {
        crosshair.style.setProperty("display", "none", "important");
        const single = document.elementFromPoint(centerX, centerY);
        crosshair.style.setProperty("display", "flex", "important");
        if (single) elements = [single];
      }
      for (const el of elements) {
        if (!el || el === crosshair || crosshair.contains(el) || el === banner || banner.contains(el) || el === highlightBox || highlightBox.contains(el) || el === floatingBadge || floatingBadge.contains(el)) continue;
        handleTargetCandidate(el, centerX, centerY);
        break;
      }
    };
  
      
    let isDraggingCrosshair = false;
    let dragOffset = { x: 34, y: 34 };

    const onDragMove = (clientX, clientY) => {
      if (!isDraggingCrosshair) return;
      const newLeft = Math.max(0, Math.min(window.innerWidth - 68, clientX - dragOffset.x));
      const newTop = Math.max(45, Math.min(window.innerHeight - 68, clientY - dragOffset.y));
      crosshair.style.setProperty("left", newLeft + "px", "important");
      crosshair.style.setProperty("top", newTop + "px", "important");
      detectUnderCrosshair(newLeft + 34, newTop + 34);
    };

    const startDrag = (clientX, clientY) => {
      isDraggingCrosshair = true;
      crosshair.style.cursor = 'grabbing';
      const rect = crosshair.getBoundingClientRect();
      dragOffset.x = clientX - rect.left;
      dragOffset.y = clientY - rect.top;
    };

    const endDrag = () => {
      if (isDraggingCrosshair) {
        isDraggingCrosshair = false;
        crosshair.style.cursor = 'grab';
      }
    };

    crosshair.addEventListener("pointerdown", (e) => {
      e.preventDefault(); e.stopPropagation();
      startDrag(e.clientX, e.clientY);
      try { crosshair.setPointerCapture(e.pointerId); } catch(err) {}
    });

    crosshair.addEventListener("pointermove", (e) => {
      if (!isDraggingCrosshair) return;
      e.preventDefault(); e.stopPropagation();
      onDragMove(e.clientX, e.clientY);
    });

    const onPointerEnd = (e) => {
      if (!isDraggingCrosshair) return;
      endDrag();
      try { crosshair.releasePointerCapture(e.pointerId); } catch(err) {}
    };
    crosshair.addEventListener("pointerup", onPointerEnd);
    crosshair.addEventListener("pointercancel", onPointerEnd);

    crosshair.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches[0]) {
        e.preventDefault(); e.stopPropagation();
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    const onTouchMove = (e) => {
      if (isDraggingCrosshair && e.touches && e.touches[0]) {
        e.preventDefault(); e.stopPropagation();
        onDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", endDrag, { passive: true, capture: true });
    window.addEventListener("touchcancel", endDrag, { passive: true, capture: true });

    crosshair.addEventListener("mousedown", (e) => {
      if (e.button === 0) { e.preventDefault(); e.stopPropagation(); startDrag(e.clientX, e.clientY); }
    });

    const onMouseMove = (e) => { if (isDraggingCrosshair) onDragMove(e.clientX, e.clientY); };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", endDrag);

    setTimeout(() => { detectUnderCrosshair(initX + 34, initY + 34); }, 150);

    const saveAndApplyRule = (target) => {
      if (!target) return;
      window.__TienHiepHelpers.saveNextRule(generateSmartRule(target));
      cleanup();
      banner.style.background = "linear-gradient(135deg,#10b981,#059669)";
      banner.innerHTML = "<span>✅ Đã lưu nút Chuyển Trang vào bộ nhớ theo tên miền! Tự chuyển trang...</span>";
      setTimeout(() => {
        banner.remove();
        if (!window.__TienHiepHelpers.triggerNavigation(target)) window.__TienHiepHelpers.checkAndTriggerAutoNext(true);
      }, 700);
    };

    const saveContentAreaRule = (target) => {
      if (!target) return;
      const container = (currentScope === 'container' && target) ? target : findContentContainer(target);
      if (!container) return;
      const selector = generateContainerSelector(container);
      const pCount = container.querySelectorAll ? container.querySelectorAll('p, [data-tts-idx]').length : 0;
      let host = window.__TienHiepHelpers.getEffectiveUrl().hostname || window.location.hostname || '';
      if ((!host || host === 'localhost' || host === '127.0.0.1') && window.__originalUrl) {
        try { host = new URL(window.__originalUrl).hostname || host; } catch(e) {}
      }
      if (host && selector) {
        try { localStorage.setItem('__tienhiep_content_selector_' + host, selector); } catch(e) {}
      }

      highlightBox.style.setProperty("outline", "4px solid #10b981", "important");
      highlightBox.style.setProperty("background", "rgba(16,185,129,0.25)", "important");
      highlightBox.style.setProperty("box-shadow", "0 0 35px rgba(16,185,129,0.95)", "important");

      if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') window.__TienHiepHelpers.indexParagraphsForTTS();
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'CONTENT_AREA_SAVED', selector, host }, '*');

      banner.style.background = "linear-gradient(135deg,#059669,#10b981)";
      banner.innerHTML = "<span>✅ Đã lưu vùng đọc: <b>" + selector + "</b> (" + pCount + " đoạn văn) cho tên miền này!</span>";
      setTimeout(() => { cleanup(); banner.remove(); }, 1200);
    };

    const readFromTargetParagraph = (target) => {
      if (!target) return;
      let paraIdx = parseInt(target.getAttribute('data-tts-idx'));
      if (isNaN(paraIdx)) {
        const allParas = Array.from(document.querySelectorAll('[data-tts-idx]'));
        paraIdx = allParas.indexOf(target);
        if (paraIdx === -1) paraIdx = Array.from(document.querySelectorAll('p')).indexOf(target);
      }
      if (paraIdx < 0) paraIdx = 0;

      if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.highlightActiveParagraph === 'function') {
        window.__TienHiepHelpers.highlightActiveParagraph(paraIdx);
      }
      const sentenceSnippet = (target.textContent || '').trim().slice(0, 80);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'START_TTS_FROM_PARAGRAPH', paraIdx, sentenceText: sentenceSnippet }, '*');
      }

      cleanup();
      banner.style.background = "linear-gradient(135deg,#8b5cf6,#6d28d9)";
      banner.innerHTML = "<span>📖 Bắt đầu đọc từ bước " + (paraIdx + 1) + "...</span>";
      setTimeout(() => { banner.remove(); }, 800);
    };

    let tapStartX = 0, tapStartY = 0, tapStartTime = 0;
    const onDocTouchStart = (e) => {
      if (!window.__isTeachingNext || !e.touches || !e.touches[0]) return;
      if (e.target && e.target.closest && e.target.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]')) return;
      tapStartTime = Date.now();
      tapStartX = e.touches[0].clientX;
      tapStartY = e.touches[0].clientY;
    };

    const onDirectTap = (e) => {
      if (!window.__isTeachingNext) return;
      if (e.target && e.target.closest && e.target.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]')) return;

      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      let clientX = e.clientX, clientY = e.clientY;
      if ((clientX === undefined || clientY === undefined) && e.changedTouches && e.changedTouches[0]) {
        clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY;
      }

      let target = refineToBestTarget(e.target, clientX, clientY);
      if (!target && clientX !== undefined && clientY !== undefined) {
        const els = document.elementsFromPoint ? document.elementsFromPoint(clientX, clientY) : [document.elementFromPoint(clientX, clientY)];
        for (const el of els) {
          if (el && !el.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"]')) {
            target = refineToBestTarget(el, clientX, clientY);
            if (target) break;
          }
        }
      }

      if (target && target !== document.body && target !== document.documentElement) {
        const rect = target.getBoundingClientRect();
        const targetX = Math.max(0, Math.min(window.innerWidth - 68, rect.left + rect.width / 2 - 34));
        const targetY = Math.max(45, Math.min(window.innerHeight - 68, rect.top + rect.height / 2 - 34));
        crosshair.style.setProperty("left", targetX + "px", "important");
        crosshair.style.setProperty("top", targetY + "px", "important");
        handleTargetCandidate(target, clientX, clientY);
      }
    };

    const onDocTouchEnd = (e) => {
      if (!window.__isTeachingNext) return;
      if (e.target && e.target.closest && e.target.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]')) return;
      const touch = (e.changedTouches && e.changedTouches[0]) || null;
      if (touch && (Date.now() - tapStartTime < 450) && Math.hypot(touch.clientX - tapStartX, touch.clientY - tapStartY) < 18) {
        onDirectTap(e);
      }
    };

    window.addEventListener("touchstart", onDocTouchStart, { passive: true, capture: true });
    window.addEventListener("touchend", onDocTouchEnd, { passive: false, capture: true });
    window.addEventListener("click", onDirectTap, { passive: false, capture: true });

    const cleanup = () => {
      window.__isTeachingNext = false;
      currentTarget = null; currentChunkTarget = null; currentContainerTarget = null; currentScope = 'chunk';
      stopRafLoop();
      window.removeEventListener("touchstart", onDocTouchStart, { passive: true, capture: true });
      window.removeEventListener("touchend", onDocTouchEnd, { passive: false, capture: true });
      window.removeEventListener("click", onDirectTap, { passive: false, capture: true });
      window.removeEventListener("touchmove", onTouchMove, { passive: false, capture: true });
      window.removeEventListener("touchend", endDrag, { passive: true, capture: true });
      window.removeEventListener("touchcancel", endDrag, { passive: true, capture: true });
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", endDrag);
      if (highlightBox) highlightBox.remove();
      if (floatingBadge) floatingBadge.remove();
      if (crosshair) crosshair.remove();
    };

    bindInstantAction(document.getElementById("__cancel_teach_next"), () => { cleanup(); banner.remove(); });
    bindInstantAction(document.getElementById("__reset_teach_next"), () => {
      window.__TienHiepHelpers.deleteNextRule();
      let host = window.__TienHiepHelpers.getEffectiveUrl().hostname || window.location.hostname || '';
      if ((!host || host === 'localhost' || host === '127.0.0.1') && window.__originalUrl) {
        try { host = new URL(window.__originalUrl).hostname || host; } catch(e) {}
      }
      if (host) { try { localStorage.removeItem('__tienhiep_content_selector_' + host); } catch(e) {} }
      cleanup();
      banner.style.background = "linear-gradient(135deg,#3b82f6,#2563eb)";
      banner.innerHTML = "<span>🔄 Đã khôi phục cài đặt mặc định cho trang này!</span>";
      setTimeout(() => { banner.remove(); }, 900);
    });

    bindInstantAction(document.getElementById("__confirm_teach_next"), () => { if (currentTarget) saveAndApplyRule(currentTarget); });
    bindInstantAction(document.getElementById("__read_from_here"), () => { if (currentTarget) readFromTargetParagraph(currentTarget); });
    bindInstantAction(document.getElementById("__scope_toggle_btn"), () => { applyTargetScope('container'); });
    bindInstantAction(document.getElementById("__save_content_area"), () => { if (currentTarget) saveContentAreaRule(currentTarget); });
    bindInstantAction(document.getElementById("__back_to_chunk"), () => { applyTargetScope('chunk'); });
    bindInstantAction(document.getElementById("__test_next_teach"), () => {
      if (currentTarget) { cleanup(); banner.remove(); window.__TienHiepHelpers.triggerNavigation(currentTarget); }
    });

    bindInstantAction(document.getElementById("__teach_badge_save"), () => {
      (currentScope === 'container' && currentTarget) ? saveContentAreaRule(currentTarget) : (currentTarget && saveAndApplyRule(currentTarget));
    });
    bindInstantAction(document.getElementById("__teach_badge_read"), () => { if (currentTarget) readFromTargetParagraph(currentTarget); });
    bindInstantAction(document.getElementById("__teach_badge_scope"), () => { applyTargetScope(currentScope === 'chunk' ? 'container' : 'chunk'); });
    bindInstantAction(document.getElementById("__teach_badge_prev"), () => { shiftTargetSibling(-1); });
    bindInstantAction(document.getElementById("__teach_badge_next"), () => { shiftTargetSibling(1); });

    let lastCrosshairTap = 0;
    crosshair.addEventListener("touchend", () => {
      if (isDraggingCrosshair) return;
      const now = Date.now();
      if (now - lastCrosshairTap < 350 && currentTarget) {
        if (currentScope === 'container') saveContentAreaRule(currentTarget);
        else if (isTargetParagraph) readFromTargetParagraph(currentTarget);
        else saveAndApplyRule(currentTarget);
      }
      lastCrosshairTap = now;
    });
  
    },
  
    };

    
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

    function applyTranslatedText(target, transText, enableStream = false) {
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
      const chineseRegex = /[\u4e00-\u9fa5]/;
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
        const chineseRegex = /[\u4e00-\u9fa5]/;
        const sampleCheckText = (document.body ? document.body.innerText : '') || document.title || '';
        if (!chineseRegex.test(sampleCheckText)) { window.__autoTranslateEnabled = false; return false; }
      }
      window.__autoTranslateEnabled = enabled;
      if (window.__TienHiepHelpers) window.__TienHiepHelpers.__autoTranslateEnabled = enabled;
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
  
    
    window.__tienhiepDarkMode = (function() {
      try { return localStorage.getItem('__tienhiep_dark_mode_active') === 'true'; } catch(e) { return false; }
    })();
    window.__tienhiepCleanAds = true;

    const DARK_BG_CSS = 'html, body { background-color: #111118 !important; background: #111118 !important; } div:not(#__teach_highlighter_box):not(#__teach_next_banner):not(#__teach_tag_badge):not([id^="__teach"]):not([id^="__cancel"]):not([id^="__reset"]):not(#tienhiep-active-highlight):not([id*="tienhiep-active"]), teach-highlighter, teach-badge, teach-banner, p:not(#tienhiep-active-highlight):not([id*="tienhiep-active"]), span:not(#tienhiep-active-highlight):not([id*="tienhiep-active"]), ul, ol, li, section, article, main, header, footer, nav, aside, dl, dt, dd, table, thead, tbody, tfoot, tr, th, td, blockquote, form, fieldset, legend, label, pre, code, .content, #content, [class*="content"], [class*="read"], [id*="content"], [id*="chapter"], [class*="chapter"], [class*="wrap"], [class*="box"], [class*="container"], [class*="main"] { background-color: #111118 !important; background: #111118 !important; border-color: #2a2a3a !important; box-shadow: none !important; } .title, .breadcrumb, .topbar, .nlist_page { background-color: #181926 !important; border-color: #2e3050 !important; } img, .pic, picture, video, canvas, svg { background-color: transparent !important; } teach-highlighter, #__teach_highlighter_box { background-color: rgba(245,158,11,0.18) !important; outline: 2.5px solid #f59e0b !important; box-shadow: 0 0 16px rgba(245,158,11,0.65), inset 0 0 12px rgba(245,158,11,0.2) !important; border-radius: 6px !important; } teach-banner, #__teach_next_banner, teach-badge, #__teach_tag_badge { background-color: unset; color: unset; } #tienhiep-active-highlight, span#tienhiep-active-highlight { background-color: #f59e0b !important; background: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 4px !important; padding: 2px 6px !important; box-shadow: 0 0 16px rgba(245, 158, 11, 0.95) !important; border-bottom: 2px solid #b45309 !important; display: inline !important; } ::highlight(tienhiep-tts-highlight) { background-color: #f59e0b !important; color: #000000 !important; }';
    const DARK_COLOR_CSS = 'body *:not(#__teach_highlighter_box):not(#__teach_next_banner):not(#__teach_tag_badge):not([id^="__teach"]):not([id^="__cancel"]):not([id^="__reset"]):not(teach-highlighter):not(teach-badge):not(teach-banner):not(#tienhiep-active-highlight):not([id*="tienhiep-active"]) { color: #e8ecf0 !important; } h1, h2, h3, h4, h5, h6, [class*="title"], .title, [id*="title"] { color: #ffffff !important; } a, a:link, a:visited, a * { color: #93c5fd !important; text-decoration: none !important; } a:hover, a:hover * { color: #bfdbfe !important; } button:not([id^="__"]), a.button, a.s1, .btn, input[type="button"], input[type="submit"] { background-color: #e11d48 !important; color: #ffffff !important; border-color: #be123c !important; } input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select { background-color: #1c1a3a !important; color: #f0f4ff !important; border: 1px solid #4f46e5 !important; } img, canvas, svg, video, picture { opacity: 0.92 !important; background-color: transparent !important; } .nlist_page a, .breadcrumb a { color: #a5b4fc !important; }';
    const DARK_THEME_CSS = DARK_BG_CSS + ' ' + DARK_COLOR_CSS;

    window.__ensureDarkMode = () => {
      const contentSelectors = ['#content', '.content', '.read-content', '.chapter-content', '[id*="chapter"]', '[class*="chapter"]', '[class*="readarea"]', '.booktext', '#booktext', '.txt', '#txt', '.chapter', '.article-content', '.novel-content', '.story-content', '.text-content', '[id*="content"]'];
      if (!window.__tienhiepDarkMode) {
        const s = document.getElementById('__tienhiep_dark_style');
        if (s) s.remove();
        try {
          if (document.body) { document.body.style.removeProperty('background-color'); document.body.style.removeProperty('color'); }
          for (const sel of contentSelectors) {
            document.querySelectorAll(sel).forEach(el => {
              if (el && el.style) { el.style.removeProperty('background-color'); el.style.removeProperty('color'); }
              if (el) el.querySelectorAll('p, span, div, font, h1, h2, h3, a').forEach(child => { if (child && child.style) { child.style.removeProperty('color'); child.style.removeProperty('background-color'); } });
            });
          }
        } catch(e) {}
        return;
      }

      let styleEl = document.getElementById('__tienhiep_dark_style');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = '__tienhiep_dark_style';
        (document.head || document.documentElement).appendChild(styleEl);
      }
      styleEl.textContent = DARK_THEME_CSS;

      try {
        if (document.body) { document.body.style.setProperty('background-color', '#111118', 'important'); document.body.style.setProperty('color', '#e8ecf0', 'important'); }
        for (const sel of contentSelectors) {
          try {
            document.querySelectorAll(sel).forEach(el => {
              if (el && el.style) { el.style.setProperty('background-color', '#111118', 'important'); el.style.setProperty('color', '#e8ecf0', 'important'); }
              if (el) el.querySelectorAll('p, span, div, font').forEach(child => { if (child.style) { child.style.setProperty('color', '#e8ecf0', 'important'); if (child.style.backgroundColor && child.style.backgroundColor !== 'transparent' && child.style.backgroundColor !== 'rgba(0, 0, 0, 0)') child.style.setProperty('background-color', '#111118', 'important'); } });
            });
          } catch(e) {}
        }
      } catch(e) {}
    };

    try {
      if (!window.__tienhiepDocWriteIntercepted) {
        window.__tienhiepDocWriteIntercepted = true;
        const origWrite = document.write.bind(document);
        const origWriteln = document.writeln.bind(document);
        const isAdSnippet = (str) => (!str || typeof str !== 'string') ? false : /(geniees|magsrv|popads|propeller|adsterra|cpm|zoneid|guanggao|doubleclick)/i.test(str) || str.toLowerCase().includes('/ad');
        document.write = function(...args) { if (args.some(isAdSnippet)) return; return origWrite(...args); };
        document.writeln = function(...args) { if (args.some(isAdSnippet)) return; return origWriteln(...args); };
      }
    } catch(e) {}

    try {
      if (!window.__tienhiepClickInterceptorAttached) {
        window.__tienhiepClickInterceptorAttached = true;
        window.addEventListener('click', (e) => {
          if (!window.__tienhiepCleanAds || window.__isTeachingNext) return;
          const target = e.target;
          if (!target || (target.closest && target.closest('#__teach_next_banner, #__teach_highlighter_box'))) return;

          const link = target.closest ? target.closest('a') : null;
          if (link) {
            function unwrapRedirect(rawUrl) {
              try {
                const u = new URL(rawUrl);
                if (u.hostname.includes('google.') && (u.pathname === '/url' || u.pathname.startsWith('/url'))) {
                  const target = u.searchParams.get('url') || u.searchParams.get('q');
                  if (target && target.startsWith('http')) return target;
                }
                if (u.hostname.includes('baidu.') && u.searchParams.get('url')) {
                  const target = u.searchParams.get('url');
                  if (target && target.startsWith('http')) return target;
                }
              } catch(e) {}
              return rawUrl;
            }

            const rawHref = (link.getAttribute('href') || '').trim();
            let href = link.href ? link.href.trim() : '';
            const effUrl = window.__TienHiepHelpers ? window.__TienHiepHelpers.getEffectiveUrl() : null;
            let baseHref = window.__originalUrl || '';
            if (!baseHref || baseHref.includes('localhost') || baseHref.includes('127.0.0.1') || baseHref.includes('10.0.2.2')) {
              baseHref = effUrl && effUrl.origin && !effUrl.origin.includes('localhost') && !effUrl.origin.includes('127.0.0.1') && !effUrl.origin.includes('10.0.2.2') ? effUrl.href : '';
            }
            if (!baseHref) {
              const baseEl = document.querySelector('base');
              if (baseEl && baseEl.href && !baseEl.href.includes('localhost') && !baseEl.href.includes('127.0.0.1')) baseHref = baseEl.href;
            }
            if (!baseHref && effUrl && effUrl.href) baseHref = effUrl.href;

            if (rawHref && (rawHref.startsWith('/') || !rawHref.includes('://')) && !rawHref.startsWith('javascript:') && !rawHref.startsWith('#')) {
              try { if (baseHref) href = new URL(rawHref, baseHref).href; } catch(e) {}
            } else if (href && (href.startsWith('http://localhost') || href.startsWith('capacitor://localhost') || href.includes('127.0.0.1') || href.includes('10.0.2.2'))) {
              try { if (baseHref) { const u = new URL(href); href = new URL(u.pathname + u.search + u.hash, baseHref).href; } } catch(e) {}
            }
            href = unwrapRedirect(href);

            const isAd = /(magsrv|geniees|popads|propeller|adsterra|cpm|zoneid|guanggao|doubleclick|affiliate|track\.|click\.|ads\.|bet\b|casino\b|18\+)/i.test(href);
            if (isAd) {
              e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
              if (link.parentNode) link.remove();
              return false;
            }

            if (href && !href.startsWith('javascript:') && !href.startsWith('#') && !href.includes('void(0)')) {
              e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
              if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'NAVIGATE_REQ', tabId: window.__TIENHIEP_TAB_ID__, url: href }, '*');
              } else {
                window.location.href = href;
              }
              return false;
            }
          }
        }, true);
      }
    } catch(e) {}

    window.__ensureCleanAds = () => {
      if (!window.__tienhiepCleanAds) {
        const s = document.getElementById('__tienhiep_adblock_style');
        if (s) s.remove();
        return;
      }
      if (window.open !== window.__tienhiepBlockedOpen) {
        window.__tienhiepBlockedOpen = function(u) {
          if (u && typeof u === 'string') {
            try {
              let clean = u;
              if (clean.includes('google.') || clean.includes('baidu.')) {
                const pu = new URL(clean);
                const t = pu.searchParams.get('url') || pu.searchParams.get('q');
                if (t && t.startsWith('http')) clean = t;
              }
              if (!clean.startsWith('javascript:') && !clean.startsWith('#')) {
                if (window.parent && window.parent !== window) {
                  window.parent.postMessage({ type: 'NAVIGATE_REQ', tabId: window.__TIENHIEP_TAB_ID__, url: clean }, '*');
                } else {
                  window.location.href = clean;
                }
              }
            } catch(e) {}
          }
          return null;
        };
        window.open = window.__tienhiepBlockedOpen;
      }

      let adStyle = document.getElementById('__tienhiep_adblock_style');
      if (!adStyle) {
        adStyle = document.createElement('style');
        adStyle.id = '__tienhiep_adblock_style';
        adStyle.textContent = 'iframe[src*="ad"], iframe[src*="union"], iframe[src*="cpm"], iframe[src*="pop"], iframe[src*="geniees"], iframe[src*="magsrv"], iframe[src*="vantage"], [class*="popup-wrap"], [class*="modal-wrap"], [id*="bonus"], [class*="bonus"], [class*="vantage"], [id*="vantage"], [class*="captcha"], [id*="captcha"], [class*="recaptcha"], [id*="recaptcha"], [class*="gift"], [id*="gift"], [class*="redpack"], [id*="redpack"], [class*="hongbao"], [class*="reward"], .advertisement, .advertising, [class*="banner-ad"], [id*="banner-ad"], [class*="float-ad"], [id*="float-ad"], [class*="popup-ad"], [id*="popup-ad"], ins.adsbygoogle, .google-ad, [id*="google_ads"], #ad_top, #ad_bottom, #ad_left, #ad_right, .bottom-ad, .top-ad, .side-ad, .tuiguang, [class*="tuiguang"], [id*="tuiguang"], .guanggao, [class*="guanggao"], [id*="guanggao"], [class*="pop-win"], [id*="pop-win"], .float-window, .app-download-bar, .download-banner, [class*="modal-backdrop"], [class*="overlay-mask"], [class*="popup-overlay"] { display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important; pointer-events: none !important; opacity: 0 !important; }';
        (document.head || document.documentElement).appendChild(adStyle);
      }

      const spamSelectors = ['iframe[src*="ad"]', 'iframe[src*="union"]', 'iframe[src*="cpm"]', 'iframe[src*="pop"]', 'iframe[src*="geniees"]', 'iframe[src*="magsrv"]', 'iframe[src*="vantage"]', '[class*="popup-wrap"]', '[class*="modal-wrap"]', '[id*="bonus"]', '[class*="bonus"]', '[class*="gift"]', '[id*="gift"]', '[class*="redpack"]', '[id*="redpack"]', '[class*="hongbao"]', '[class*="reward"]', '.tuiguang', '[class*="tuiguang"]', '[id*="tuiguang"]', '.guanggao', '[class*="guanggao"]', '[id*="guanggao"]', 'ins.adsbygoogle', '.google-ad', '[id*="google_ads"]', '#ad_top', '#ad_bottom', '#ad_left', '#ad_right', '.bottom-ad', '.top-ad', '.side-ad', '[class*="pop-win"]', '[id*="pop-win"]', '.float-window', '.app-download-bar', '.download-banner', '[class*="vantage"]', '[id*="vantage"]'];
      spamSelectors.forEach(s => {
        try {
          document.querySelectorAll(s).forEach(el => {
            if (el.id === '__teach_next_banner' || el.id === '__teach_highlighter_box') return;
            if (el.innerText && el.innerText.length > 500 && (el.querySelectorAll('p').length > 2)) return;
            el.remove();
          });
        } catch(e) {}
      });

      try {
        const fakeCaptchaPattern = /not a robot|i['’]m not a robot|click the button|human verification|verify you are human|prove you are not a robot/i;
        const adTextPattern = /vantage|hoa hồng|hoa hong|tham gia ngay|đăng ký ngay|kiếm tiền|đối tác|affiliate|forex|crypto|trading|betting|nhà cái|casino|đặt cược|tài xỉu|nổ hũ|game bài|congratulations|bonus|get bonus|approved|lucky\s*draw|trúng thưởng|nhận thưởng|vòng quay|nạp thẻ|tải app|download app|đăng ký nhận quà/i;
        const floatingEls = document.querySelectorAll('div, section, aside, dialog, a, form');
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;

        floatingEls.forEach(el => {
          if (el.id === '__teach_next_banner' || el.id === '__teach_highlighter_box') return;
          if (el.closest && el.closest('#__teach_next_banner, #__teach_highlighter_box')) return;
          if (el.id === 'content' || el.classList.contains('content') || el.classList.contains('read-content') || el.classList.contains('txtnav')) return;

          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          const zIndex = parseInt(style.zIndex, 10);
          const isPositioned = style.position === 'fixed' || style.position === 'absolute';
          const text = (el.innerText || '').trim();

          if (fakeCaptchaPattern.test(text)) {
            let topModal = el;
            while (topModal.parentElement && topModal.parentElement !== document.body && topModal.parentElement !== document.documentElement) {
              const pStyle = window.getComputedStyle(topModal.parentElement);
              if (pStyle.position === 'fixed' || pStyle.position === 'absolute') { topModal = topModal.parentElement; } else { break; }
            }
            topModal.remove();
            document.querySelectorAll('div, section, aside, form').forEach(bg => {
              if (bg.id === 'content' || bg.classList.contains('content') || bg.classList.contains('read-content') || bg.classList.contains('txtnav')) return;
              const bgStyle = window.getComputedStyle(bg);
              if (bgStyle.position === 'fixed' || bgStyle.position === 'absolute') {
                const bgRect = bg.getBoundingClientRect();
                if (bgRect.width >= windowWidth * 0.75 && bgRect.height >= windowHeight * 0.75) {
                  if (!bg.innerText || bg.innerText.trim().length < 100 || fakeCaptchaPattern.test(bg.innerText)) bg.remove();
                }
              }
            });
            if (document.body) { document.body.style.overflow = ''; document.body.style.pointerEvents = ''; }
            if (document.documentElement) { document.documentElement.style.overflow = ''; document.documentElement.style.pointerEvents = ''; }
            return;
          }

          if (isPositioned && (zIndex > 20 || zIndex === 2147483647)) {
            const isFullScreen = rect.width >= windowWidth * 0.7 && rect.height >= windowHeight * 0.7;
            const isTransparent = parseFloat(style.opacity) < 0.1 || style.visibility === 'hidden' || style.backgroundColor === 'transparent' || style.backgroundColor === 'rgba(0, 0, 0, 0)';
            if (isFullScreen && isTransparent && (!el.innerText || el.innerText.trim().length < 50)) { el.remove(); return; }
          }

          if (isPositioned) {
            const hasAdKeyword = adTextPattern.test(text);
            const hasAdIframe = el.querySelector('iframe[src*="ad"], iframe[src*="cpm"], iframe[src*="magsrv"], iframe[src*="geniees"], iframe[src*="vantage"]');
            const hasAdAction = /get bonus|download|cài đặt|nhận ngay|tham gia ngay|bonus|gift|redpack|hongbao/i.test(text);
            const isSmallFloatingWidget = (rect.width > 0 && rect.width < 180 && rect.height > 0 && rect.height < 180);
            const hasBadgeOrIcon = el.querySelector('svg, img, canvas, [class*="badge"], [class*="num"], [class*="count"], [class*="gift"], [class*="redpack"], [class*="bonus"]');
            const isNearBottomOrCorner = (rect.bottom >= windowHeight - 160 || rect.top <= 160 || rect.left <= 100 || rect.right >= windowWidth - 100);

            if (hasAdKeyword || hasAdIframe || hasAdAction || (isSmallFloatingWidget && (hasBadgeOrIcon || text === '1' || text === '!') && isNearBottomOrCorner && text.length <= 15)) {
              if (!el.innerText || el.innerText.length < 500) {
                el.remove();
                if (document.body && document.body.style.overflow === 'hidden') document.body.style.overflow = '';
                if (document.documentElement && document.documentElement.style.overflow === 'hidden') document.documentElement.style.overflow = '';
              }
            }
          }
        });
      } catch(e) {}
    };

    window.__ensureDarkMode();
    window.__ensureCleanAds();

    window.__autoTranslateObserver = new MutationObserver((mutations) => {
      if (window.__tienhiepDarkMode) window.__ensureDarkMode();
      if (window.__tienhiepCleanAds) window.__ensureCleanAds();
      if (!window.__autoTranslateEnabled) return;
      const chineseRegex = /[\u4e00-\u9fa5]/;
      mutations.forEach(m => {
        if (m.type === "characterData") {
          const node = m.target;
          if (node.nodeType === 3 && chineseRegex.test(node.nodeValue) && (!node.__original_chinese__ || node.nodeValue === node.__original_chinese__)) {
            window.__collectAndTranslateNodes(node);
          }
        } else if (m.type === "childList") {
          m.addedNodes.forEach(node => {
            if (node.nodeType === 1 || node.nodeType === 3) window.__collectAndTranslateNodes(node);
          });
        }
      });
    });
    const rootTarget = document.body || document.documentElement;
    if (rootTarget) window.__autoTranslateObserver.observe(rootTarget, { childList: true, subtree: true, characterData: true });

    setInterval(() => {
      if (window.__tienhiepDarkMode) window.__ensureDarkMode();
      if (window.__tienhiepCleanAds) window.__ensureCleanAds();
    }, 1500);
  
    
    if (!window.__tienhiep_injected_ipc) {
      window.__tienhiep_injected_ipc = true;

      function scrollNovelTop() {
        try {
          window.scrollTo({ top: 0, behavior: 'auto' });
          if (document.documentElement) document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;
          const scrollables = document.querySelectorAll('div, section, article, main, #wrapper, .wrapper, #content, .content, #chaptercontent, .read-content, #main, .novel-content');
          for (let i = 0; i < scrollables.length; i++) {
            const el = scrollables[i];
            if (el && el.scrollHeight > el.clientHeight && el.scrollTop > 0) {
              el.scrollTop = 0;
            }
          }
        } catch(e) {}
      }

      function scrollNovelBottom() {
        try {
          const maxH = Math.max(
            document.body ? document.body.scrollHeight : 0,
            document.documentElement ? document.documentElement.scrollHeight : 0
          );
          window.scrollTo({ top: maxH, behavior: 'auto' });
          if (document.documentElement) document.documentElement.scrollTop = maxH;
          if (document.body) document.body.scrollTop = maxH;
          const scrollables = document.querySelectorAll('div, section, article, main, #wrapper, .wrapper, #content, .content, #chaptercontent, .read-content, #main, .novel-content');
          for (let i = 0; i < scrollables.length; i++) {
            const el = scrollables[i];
            if (el && el.scrollHeight > el.clientHeight) {
              el.scrollTop = el.scrollHeight;
            }
          }
        } catch(e) {}
      }

      window.addEventListener('message', (e) => {
        if (!e.data) return;
        const data = e.data;
        const action = data.action;

        if (action === 'TEACH_NEXT' || action === 'teach_next') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.startTeachNextMode === 'function') {
            window.__TienHiepHelpers.startTeachNextMode();
          }
        } else if (action === 'TRIGGER_NEXT' || action === 'next') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.checkAndTriggerAutoNext === 'function') {
            window.__TienHiepHelpers.checkAndTriggerAutoNext(true, data.delay || 0);
          }
        } else if (action === 'TRIGGER_PREV' || action === 'prev') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.checkAndTriggerAutoPrev === 'function') {
            window.__TienHiepHelpers.checkAndTriggerAutoPrev();
          }
        } else if (action === 'EXTRACT_TEXT' || action === 'audio') {
          let res = { title: document.title || 'Chương đọc', text: '' };
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.extractCleanChapterText === 'function') {
            try {
              const cleaned = window.__TienHiepHelpers.extractCleanChapterText();
              if (cleaned && cleaned.text && cleaned.text.trim().length > 20) {
                res = cleaned;
              }
            } catch(e) {}
          }
          if (!res.text || res.text.trim().length < 20) {
            res.text = (document.body ? document.body.innerText : '') || '';
            res.title = document.title || 'Chương đọc';
          }
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'AUDIO_TEXT_RES',
              tabId: (window as any).__TIENHIEP_TAB_ID__,
              title: res.title,
              text: res.text
            }, '*');
          }
        } else if (action === 'TRANSLATE_RES' || action === 'translate_res') {
          if (typeof window.__receiveTranslations === 'function') {
            window.__receiveTranslations(data.id, data.translations || [], data.pageSessionId);
          }
        } else if (action === 'TOGGLE_AUTO_TRANSLATE') {
          const fn = (window.__TienHiepHelpers && window.__TienHiepHelpers.toggleAutoTranslate) || window.toggleAutoTranslate;
          if (typeof fn === 'function') {
            fn(data.enabled);
          }
        } else if (action === 'FORCE_TRANSLATE') {
          const chineseRegex = /[\u4e00-\u9fa5]/;
          const sampleCheckText = (document.body ? document.body.innerText : '') || document.title || '';
          if (!chineseRegex.test(sampleCheckText)) {
            window.__autoTranslateEnabled = false;
            return;
          }
          window.__autoTranslateEnabled = true;
          if (typeof window.__collectAndTranslateNodes === 'function') {
            window.__collectAndTranslateNodes(document.body || document.documentElement);
          }
        } else if (action === 'TOGGLE_DARK_MODE') {
          window.__tienhiepDarkMode = !!data.enabled;
          if (typeof window.__ensureDarkMode === 'function') window.__ensureDarkMode();
        } else if (action === 'CLEAN_ADS') {
          window.__tienhiepCleanAds = !!data.enabled;
          if (typeof window.__ensureCleanAds === 'function') window.__ensureCleanAds();
        } else if (action === 'COPY_TEXT') {
          let res = { text: document.body ? document.body.innerText : '' };
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.extractCleanChapterText === 'function') {
            res = window.__TienHiepHelpers.extractCleanChapterText();
          }
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'COPY_TEXT_RES',
              tabId: (window as any).__TIENHIEP_TAB_ID__,
              text: res.text
            }, '*');
          }
        } else if (action === 'SET_TTS_PLAYING') {
          window.isTtsPlaying = !!data.playing;
          if (!data.playing && window.__TienHiepHelpers && typeof window.__TienHiepHelpers.clearAllTtsHighlights === 'function') {
            window.__TienHiepHelpers.clearAllTtsHighlights();
          }
        } else if (action === 'CLEAR_TTS_HIGHLIGHTS') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.clearAllTtsHighlights === 'function') {
            window.__TienHiepHelpers.clearAllTtsHighlights();
          }
        } else if (action === 'EXEC_HELPER') {
          if (data.fn && window.__TienHiepHelpers && typeof window.__TienHiepHelpers[data.fn] === 'function') {
            const args = Array.isArray(data.args) ? data.args : [];
            try { window.__TienHiepHelpers[data.fn](...args); } catch(err) {}
          }
        } else if (action === 'HIGHLIGHT_SENTENCE' || action === 'TTS_BOUNDARY') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.highlightSentence === 'function') {
            window.__TienHiepHelpers.highlightSentence(data.sentenceText, data.sentenceId);
          }
        } else if (action === 'TOGGLE_AUTOSCROLL') {
          if (window.__scrollInterval) {
            clearInterval(window.__scrollInterval);
            window.__scrollInterval = null;
          } else {
            const speed = data.speed || 30;
            window.__scrollInterval = setInterval(() => {
              window.scrollBy({ top: 1, behavior: 'instant' });
            }, speed);
          }
        } else if (action === 'NAVIGATE_BACK') {
          window.history.back();
        } else if (action === 'NAVIGATE_FORWARD') {
          window.history.forward();
        } else if (action === 'SCROLL_TOP' || action === 'HOME' || action === 'home') {
          scrollNovelTop();
        } else if (action === 'SCROLL_BOTTOM' || action === 'END' || action === 'end') {
          scrollNovelBottom();
        } else if (action === 'RELOAD_PAGE' || action === 'reload' || action === 'f5') {
          window.location.reload();
        }
      });

      window.addEventListener('keydown', (e) => {
        const tag = (e.target && (e.target as any).tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (e.key === 'Home') {
          e.preventDefault();
          scrollNovelTop();
        } else if (e.key === 'End') {
          e.preventDefault();
          scrollNovelBottom();
        } else if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
          e.preventDefault();
          window.location.reload();
        }
      });

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
            window.__TienHiepHelpers.indexParagraphsForTTS();
          }
        }, 300);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
              window.__TienHiepHelpers.indexParagraphsForTTS();
            }
          }, 300);
        });
      }

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'PAGE_LOADED',
          tabId: (window as any).__TIENHIEP_TAB_ID__,
          url: (window.__TienHiepHelpers ? window.__TienHiepHelpers.getEffectiveUrl().href : '') || window.__originalUrl || window.location.href,
          title: document.title
        }, '*');
      }
    }
  
  })();