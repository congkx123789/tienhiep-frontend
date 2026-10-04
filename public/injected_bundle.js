(function() {
    if (window.__translatorInitialized) return;
    window.__translatorInitialized = true;
    window.__autoTranslateEnabled = false;

    
    (function() {
      try {
        const _ow = Document.prototype.write;
        const _owl = Document.prototype.writeln;
        Document.prototype.write = function(...args) {
          if (document.readyState === 'complete') return;
          return _ow.apply(this, args);
        };
        Document.prototype.writeln = function(...args) {
          if (document.readyState === 'complete') return;
          return _owl.apply(this, args);
        };
      } catch(e) {}

      // Khắc phục các website SPA đọc truyện (như bqg, biquge) dùng location.pathname
      try {
        let _customUrlParse = null;
        if (window.__originalUrl) {
          const u = new URL(window.__originalUrl);
          const parsed = u.pathname.match(new RegExp('/book/(\\d+)/(\\d+)[_]*(\\d*)\\.html'));
          if (parsed) {
            _customUrlParse = parsed;
            window.id = Number(parsed[1]);
            window.chapterid = Number(parsed[2]);
            window.page = Number(parsed[3]) || 1;
          }
        }
        if (_customUrlParse) {
          window.urlParse = _customUrlParse;
          let _val = _customUrlParse;
          Object.defineProperty(window, 'urlParse', {
            get: () => _val,
            set: (v) => { if (v) _val = v; },
            configurable: true
          });
        }
      } catch(e) {}

      // Chặn mở popup cửa sổ riêng ngoài hệ điều hành, chuyển thành mở Tab trong App
      try {
        window.open = function(url) {
          if (!url) return null;
          try {
            const full = new URL(url, window.location.href).href;
            if (/^https?:\/\//i.test(full) && window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'NAVIGATE_REQ', tabId: window.__TIENHIEP_TAB_ID__, url: full, newTab: true }, '*');
              return null;
            }
          } catch(e) {}
          window.location.href = url;
          return null;
        };

        document.addEventListener('click', function(e) {
          const a = e.target && e.target.closest ? e.target.closest('a') : null;
          if (!a) return;
          const href = a.getAttribute('href');
          if (!href || /^(javascript:|#|mailto:|tel:|data:)/i.test(href.trim())) return;
          const isBlank = a.target === '_blank' || a.getAttribute('target') === '_blank';
          try {
            const full = new URL(href, window.location.href).href;
            if (/^https?:\/\//i.test(full) && window.parent && window.parent !== window) {
              if (isBlank) {
                e.preventDefault();
                e.stopPropagation();
                window.parent.postMessage({ type: 'NAVIGATE_REQ', tabId: window.__TIENHIEP_TAB_ID__, url: full, newTab: true }, '*');
              }
            }
          } catch(err) {}
        }, true);
      } catch(e) {}
    })();
  

    window.__TienHiepHelpers = {
      
    getEffectiveUrl: () => {
      let raw = window.__originalUrl || '';
      if (!raw || raw.startsWith('about:') || raw.startsWith('chrome') || raw === 'null') {
        const baseEl = document.querySelector('base');
        const candidate = (baseEl && baseEl.href) || '';
        if (candidate && candidate.startsWith('http')) {
          raw = candidate;
        } else {
          raw = (document.baseURI && !document.baseURI.startsWith('chrome')) ? document.baseURI : (window.location.href && !window.location.href.startsWith('chrome') ? window.location.href : '');
        }
      }
      if (raw && (raw.includes('iframe_proxy') || raw.includes('localhost') || raw.includes('127.0.0.1'))) {
        try {
          const u = new URL(raw, window.location.href);
          const real = u.searchParams.get('url');
          if (real && real.startsWith('http')) raw = real;
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

      // 0. Ưu tiên cao nhất: Smart Content Rule theo Bậc DOM và Đa Vùng đã học
      try {
        const smartRuleRaw = localStorage.getItem('__tienhiep_smart_content_rule_' + host) ||
                             localStorage.getItem('__tienhiep_smart_content_rule_' + apexHost);
        if (smartRuleRaw) {
          const rule = JSON.parse(smartRuleRaw);
          if (rule && Array.isArray(rule.regions) && rule.regions.length > 0) {
            const firstLca = document.querySelector(rule.regions[0].lcaSelector);
            if (firstLca && (firstLca.innerText || "").trim().length > 30) mainEl = firstLca;
          }
        }
        if (!mainEl) {
          const savedSel = localStorage.getItem('__tienhiep_content_selector_' + host) ||
                           localStorage.getItem('__tienhiep_content_selector_' + apexHost);
          if (savedSel) {
            const el = document.querySelector(savedSel);
            if (el && (el.innerText || "").trim().length > 35) mainEl = el;
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
        mainEl = document.querySelector('article, section, main, #main, .content, .container, body') || document.body;
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

      // 0. ƯU TIÊN TUYỆT ĐỐI: Trích xuất trực tiếp theo thứ tự các đoạn đã gán [data-tts-idx]
      // Đảm bảo 100% đoạn thứ pIdx khi click chuột trùng khớp hoàn hảo với đoạn pIdx mà TTS đọc
      const indexedList = Array.from(document.querySelectorAll('[data-tts-idx]'));
      if (indexedList.length > 0) {
        indexedList.sort((a, b) => {
          const ia = parseInt(a.getAttribute('data-tts-idx') || '0', 10);
          const ib = parseInt(b.getAttribute('data-tts-idx') || '0', 10);
          return ia - ib;
        });
        indexedList.forEach(el => {
          const txt = (el.innerText || el.textContent || "").trim();
          if (txt && hasWord.test(txt) && !isNav.test(txt)) {
            paragraphs.push(txt);
          }
        });
      }

      if (paragraphs.length === 0) {
        const rawLines = (clone.textContent || "").split(new RegExp('[\\r\\n]+'));
        rawLines.forEach(line => {
          const txt = line.trim();
          if (txt && hasWord.test(txt) && !isNav.test(txt)) paragraphs.push(txt);
        });
      }

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

      if (sentenceText) {
        const cleanText = sentenceText.trim().replace(/^[“"'s«『「]+|[”"'s»』」]+$/gu, '').slice(0, 24);
        if (cleanText.length >= 4) {
          const allSpans = Array.from(document.querySelectorAll('.tts-sentence, p'));
          targetEl = allSpans.find(el => el.textContent && el.textContent.includes(cleanText)) || null;
        }
      }

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
      const hasWord = /[a-zA-Z0-9一-龥À-ỹ]/;

      // 0. ƯU TIÊN CAO NHẤT: Smart Content Rule theo Bậc DOM và Đa Vùng đã học
      try {
        const smartRuleRaw = localStorage.getItem('__tienhiep_smart_content_rule_' + host) ||
                             localStorage.getItem('__tienhiep_smart_content_rule_' + host.replace(/^www./, ''));
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
  
    
    showInlineNotebook: (el, paraIdx, rawZhText, translatedText) => {
      const existing = document.getElementById('__tienhiep_inline_notebook');
      if (existing) {
        const isSame = existing.getAttribute('data-para-idx') === String(paraIdx);
        existing.remove();
        if (isSame) return;
      }

      const notebook = document.createElement('div');
      notebook.id = '__tienhiep_inline_notebook';
      notebook.setAttribute('data-para-idx', String(paraIdx));
      notebook.style.cssText = 'margin: 6px 0 12px 0 !important; padding: 6px 10px !important; background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-left: 4px solid #8b5cf6 !important; border-radius: 8px !important; box-shadow: 0 4px 14px rgba(0,0,0,0.06) !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; font-size: 12px !important; line-height: 1.3 !important; color: #1e293b !important; box-sizing: border-box !important; display: block !important; width: 100% !important; user-select: none !important; clear: both !important;';

      let currentMode = 'phrase';
      let cachedTokens = [];
      let charTokens = [];

      const renderContent = () => {
        const tokensToRender = currentMode === 'char' ? charTokens : cachedTokens;
        notebook.innerHTML = '';

        const topBar = document.createElement('div');
        topBar.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px; padding-bottom: 4px; border-bottom: 1px dashed #e2e8f0;';

        const leftGroup = document.createElement('div');
        leftGroup.style.cssText = 'display: flex; align-items: center; gap: 6px; overflow-x: auto;';

        const titleSpan = document.createElement('span');
        titleSpan.style.cssText = 'font-size: 10.5px; font-weight: 800; color: #6d28d9; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;';
        titleSpan.textContent = '📓 SỔ TAY TỪ:';
        leftGroup.appendChild(titleSpan);

        const modeGroup = document.createElement('div');
        modeGroup.style.cssText = 'display: inline-flex; background: #f1f5f9; padding: 2px; border-radius: 4px; font-size: 10px; font-weight: 600;';

        const btnPhrase = document.createElement('button');
        btnPhrase.textContent = 'Cụm từ';
        btnPhrase.style.cssText = 'padding: 1px 6px; border-radius: 3px; border: none; cursor: pointer; background: ' + (currentMode === 'phrase' ? '#ffffff' : 'transparent') + '; color: ' + (currentMode === 'phrase' ? '#6d28d9' : '#64748b') + '; box-shadow: ' + (currentMode === 'phrase' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none') + ';';
        btnPhrase.onclick = () => { currentMode = 'phrase'; renderContent(); };

        const btnChar = document.createElement('button');
        btnChar.textContent = 'Từ đơn';
        btnChar.style.cssText = 'padding: 1px 6px; border-radius: 3px; border: none; cursor: pointer; background: ' + (currentMode === 'char' ? '#ffffff' : 'transparent') + '; color: ' + (currentMode === 'char' ? '#6d28d9' : '#64748b') + '; box-shadow: ' + (currentMode === 'char' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none') + ';';
        btnChar.onclick = () => { currentMode = 'char'; renderContent(); };

        modeGroup.appendChild(btnPhrase);
        modeGroup.appendChild(btnChar);
        leftGroup.appendChild(modeGroup);

        const btnPlay = document.createElement('button');
        btnPlay.textContent = '▶ Phát';
        btnPlay.style.cssText = 'display: inline-flex; align-items: center; gap: 2px; padding: 2px 7px; background: #7c3aed; color: #ffffff; border: none; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer; white-space: nowrap;';
        btnPlay.onclick = () => {
          try {
            window.parent.postMessage({ type: 'START_TTS_FROM_PARAGRAPH', paraIdx: paraIdx, text: translatedText }, '*');
          } catch(e) {}
        };
        leftGroup.appendChild(btnPlay);

        const btnClose = document.createElement('button');
        btnClose.textContent = '✕';
        btnClose.style.cssText = 'background: none; border: none; color: #94a3b8; font-size: 14px; font-weight: bold; cursor: pointer; padding: 0 4px; line-height: 1;';
        btnClose.onclick = () => notebook.remove();

        topBar.appendChild(leftGroup);
        topBar.appendChild(btnClose);
        notebook.appendChild(topBar);

        const chipRow = document.createElement('div');
        chipRow.style.cssText = 'display: flex; align-items: center; gap: 4px; overflow-x: auto; padding: 2px 0; -webkit-overflow-scrolling: touch;';

        const labelSpan = document.createElement('span');
        labelSpan.style.cssText = 'font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; white-space: nowrap; margin-right: 2px;';
        labelSpan.textContent = 'CHỌN TỪ:';
        chipRow.appendChild(labelSpan);

        const altPanel = document.createElement('div');
        altPanel.id = '__th_alt_panel';
        altPanel.style.cssText = 'display: none; margin-top: 5px; padding: 3px 6px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 4px; font-size: 11px; align-items: center; gap: 6px; overflow-x: auto;';

        const chipBtns = [];
        tokensToRender.forEach((tok) => {
          const btn = document.createElement('button');
          btn.style.cssText = 'display: inline-flex; flex-direction: column; align-items: center; justify-content: center; padding: 2px 5px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; flex-shrink: 0; line-height: 1.1; font-family: inherit;';

          const zhSpan = document.createElement('span');
          zhSpan.style.cssText = 'font-size: 11px; font-weight: 700; color: #0f172a;';
          zhSpan.textContent = tok.zh;

          const viSpan = document.createElement('span');
          viSpan.style.cssText = 'font-size: 9px; color: #64748b; max-width: 65px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px;';
          viSpan.textContent = tok.vi || tok.hanviet;

          btn.appendChild(zhSpan);
          btn.appendChild(viSpan);

          btn.onclick = () => {
            chipBtns.forEach(b => {
              b.style.borderColor = '#cbd5e1';
              b.style.background = '#ffffff';
            });
            btn.style.borderColor = '#7c3aed';
            btn.style.background = '#f5f3ff';

            altPanel.innerHTML = '';
            altPanel.style.display = 'flex';

            const infoSpan = document.createElement('span');
            infoSpan.style.cssText = 'color: #475569; font-weight: 600; white-space: nowrap;';
            infoSpan.innerHTML = 'Từ: <strong style="color: #6d28d9;">' + tok.zh + '</strong> (' + tok.vi + ')';
            altPanel.appendChild(infoSpan);

            const sepSpan = document.createElement('span');
            sepSpan.style.cssText = 'color: #94a3b8; border-left: 1px solid #cbd5e1; padding-left: 6px; white-space: nowrap;';
            sepSpan.textContent = 'Đổi sang:';
            altPanel.appendChild(sepSpan);

            const alts = (tok.alternatives && tok.alternatives.length > 0) ? tok.alternatives : [tok.vi];
            const altBtnsContainer = document.createElement('div');
            altBtnsContainer.style.cssText = 'display: flex; gap: 4px; overflow-x: auto;';

            alts.forEach(alt => {
              const aBtn = document.createElement('button');
              aBtn.textContent = alt;
              const isCur = alt === tok.vi;
              aBtn.style.cssText = 'padding: 1px 6px; background: ' + (isCur ? '#ede9fe' : '#ffffff') + '; color: ' + (isCur ? '#6d28d9' : '#334155') + '; font-weight: ' + (isCur ? '700' : '500') + '; border: 1px solid ' + (isCur ? '#a78bfa' : '#cbd5e1') + '; border-radius: 4px; cursor: pointer; font-size: 10.5px; white-space: nowrap;';

              aBtn.onclick = () => {
                const oldWord = tok.vi;
                let curText = el.innerText || el.textContent || '';
                if (oldWord && curText.includes(oldWord)) {
                  curText = curText.replace(oldWord, alt);
                } else {
                  curText = curText + ' ' + alt;
                }

                const spans = el.querySelectorAll('.tts-sentence');
                if (spans.length > 0) {
                  spans.forEach(sp => {
                    if (sp.textContent && sp.textContent.includes(oldWord)) {
                      sp.textContent = sp.textContent.replace(oldWord, alt);
                    }
                  });
                } else {
                  el.textContent = curText;
                }

                tok.vi = alt;
                viSpan.textContent = alt;
                infoSpan.innerHTML = 'Từ: <strong style="color: #6d28d9;">' + tok.zh + '</strong> (' + alt + ')';

                try {
                  window.parent.postMessage({
                    type: 'PARAGRAPH_EDITED',
                    paraIdx: paraIdx,
                    newText: curText
                  }, '*');
                } catch(e) {}

                altBtnsContainer.querySelectorAll('button').forEach(b => {
                  b.style.background = '#ffffff';
                  b.style.borderColor = '#cbd5e1';
                  b.style.color = '#334155';
                  b.style.fontWeight = '500';
                });
                aBtn.style.background = '#ede9fe';
                aBtn.style.borderColor = '#a78bfa';
                aBtn.style.color = '#6d28d9';
                aBtn.style.fontWeight = '700';
              };

              altBtnsContainer.appendChild(aBtn);
            });

            altPanel.appendChild(altBtnsContainer);
          };

          chipBtns.push(btn);
          chipRow.appendChild(btn);
        });

        notebook.appendChild(chipRow);
        notebook.appendChild(altPanel);
      };

      notebook.innerHTML = '<div style="font-size: 11px; color: #64748b; padding: 2px;">📓 Đang tra từ vựng sổ tay...</div>';
      el.insertAdjacentElement('afterend', notebook);

      const targetZh = rawZhText || el.getAttribute('data-orig-zh') || '';
      fetch('http://127.0.0.1:5051/api/translate/align', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zh: targetZh, vi: translatedText, mode: 4 })
      })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.tokens) && data.tokens.length > 0) {
          cachedTokens = data.tokens.filter(t => t.zh && t.zh.trim());
        } else {
          cachedTokens = targetZh.split('').filter(c => /[\u4e00-\u9fa5]/.test(c)).map(c => ({
            zh: c,
            vi: c,
            hanviet: c,
            alternatives: [c]
          }));
        }

        charTokens = [];
        cachedTokens.forEach(t => {
          if (t.zh.length <= 1) {
            charTokens.push(t);
          } else {
            const chars = Array.from(t.zh);
            const hvParts = t.hanviet ? t.hanviet.split(/\s+/) : [];
            chars.forEach((c, idx) => {
              charTokens.push({
                zh: c,
                vi: hvParts[idx] || t.vi,
                hanviet: hvParts[idx] || '',
                alternatives: hvParts[idx] ? [hvParts[idx]] : [t.vi]
              });
            });
          }
        });

        renderContent();
      })
      .catch(() => {
        notebook.innerHTML = '<div style="font-size: 11px; color: #94a3b8; padding: 2px;">Không kết nối được dịch thuật sổ tay.</div>';
      });
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

      const isAdOrSpamEl = (targetEl) => {
        if (!targetEl) return false;
        const h = (targetEl.getAttribute('href') || targetEl.href || '').toLowerCase();
        const oc = (targetEl.getAttribute('onclick') || '').toLowerCase();
        const t = (targetEl.textContent || '').trim().toLowerCase();
        if (h.includes('gourl') || oc.includes('gourl') || h.includes('closead') || oc.includes('closead')) return true;
        if (/哄骗|做爱|巨乳|小姨子|偷情|操了|高潮|抽插|cầm thú|lừa nữ|ký túc xá|报错|báo lỗi/.test(t)) return true;
        return false;
      };

      const resolveTargetEl = (el, sourceDesc) => {
        if (!el || isAdOrSpamEl(el)) return null;
        const txt = (el.textContent || "").trim();
        if (negativeTextRegex.test(txt) || negativeTextContainsRegex.test(txt)) return null;

        const a = el.tagName === 'A' ? el : (el.closest('a') || el.querySelector('a'));
        if (a) {
          if (isAdOrSpamEl(a)) return null;
          const aTxt = (a.textContent || "").trim();
          if (negativeTextRegex.test(aTxt) || negativeTextContainsRegex.test(aTxt)) return null;

          const validHref = isValidNextLink(a.href, a);
          if (validHref) return { type: 'element', el: a, source: sourceDesc };

          // Hỗ trợ nút AJAX / SPA dùng javascript: (ví dụ: a#pb_next có href="javascript:urlpage('next')")
          const rawH = (a.getAttribute('href') || a.href || '').trim();
          const isNextKw = nextKeywordRegex.test(aTxt) || nextKeywordRegex.test(txt);
          const isNextIdCls = /(pb_next|pt_next|next|page_next|readpage_down|js_page_down)/i.test((a.id || '') + ' ' + (a.className || ''));
          const isNextJs = /javascript:.*(next|page|urlpage)/i.test(rawH) || /javascript:.*(next|page|urlpage)/i.test(a.getAttribute('onclick') || '');
          if (isNextKw || isNextIdCls || isNextJs) {
            return { type: 'element', el: a, source: sourceDesc + ' (Nút AJAX/JS)' };
          }
        } else if (el) {
          const isNextKw = nextKeywordRegex.test(txt);
          const isNextIdCls = /(pb_next|pt_next|next|page_next|readpage_down|js_page_down)/i.test((el.id || '') + ' ' + (el.className || ''));
          if (isNextKw || isNextIdCls) {
            return { type: 'element', el: el, source: sourceDesc };
          }
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
          window.parent.postMessage({ type: 'NAVIGATE_REQ', tabId: window.__TIENHIEP_TAB_ID__, url: fullUrl }, '*');
          return true;
        }
        window.location.href = fullUrl;
        return true;
      }

      if (clickEl) {
        try {
          const rawH = (clickEl.getAttribute('href') || clickEl.href || '').trim();
          if (rawH.toLowerCase().startsWith('javascript:')) {
            const jsCode = rawH.substring(11).trim();
            if (jsCode) {
              window.eval(jsCode);
              return true;
            }
          }
        } catch(e) {}
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
      const effUrl = window.__TienHiepHelpers.getEffectiveUrl();
      const currentHref = effUrl.href;
      const chapterNumRegex = /(\d+)(?:_\d+)?(?:\.html?|\/)?$/;

      // 1. Tìm bằng URL decrement (-1)
      try {
        const numMatch = currentHref.match(chapterNumRegex);
        if (numMatch) {
          const currentNum = parseInt(numMatch[1], 10);
          if (currentNum > 1) {
            const prevNum = currentNum - 1;
            const allLinks = Array.from(document.querySelectorAll("a[href]"));
            for (const a of allLinks) {
              const targetMatch = (a.href || "").match(chapterNumRegex);
              if (targetMatch && parseInt(targetMatch[1], 10) === prevNum) {
                try { localStorage.setItem('__tienhiep_auto_translate_active', 'true'); } catch(e) {}
                return window.__TienHiepHelpers.triggerNavigation(a);
              }
            }
          }
        }
      } catch (e) {}

      // 2. Tìm bằng Selectors phổ biến của các trang truyện
      const selector = '#page_prev a, .page_prev a, #page_prev, .page_prev, .prev-btn, #prev-chap, .prev, #prev, .prev-chapter, #prev-chapter, [id*="prev-chap"], [class*="prev-chap"], [id*="prev_url"], [class*="prev_url"], #prev_url, #pb_prev, #pt_prev, #linkPrev, .linkPrev, #chapter_prev, a.prev, a.prevchapter, a.btn-prev, a[rel="prev"], [rel="prev"]';
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

      // 3. Khớp từ khóa nút Chương Trước
      if (!prevBtn) {
        const regex = /^\s*(上一章|上一页|上一頁|上页|上頁|chương trước|trang trước|hồi trước|prev chapter|prev page|trước)\s*$/i;
        prevBtn = Array.from(document.querySelectorAll("a, button, span, [role='button']")).find(el => {
          return regex.test((el.textContent || "").trim());
        });
      }

      if (prevBtn) {
        try { localStorage.setItem('__tienhiep_auto_translate_active', 'true'); } catch(e) {}
        return window.__TienHiepHelpers.triggerNavigation(prevBtn);
      }

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'PREV_CHAPTER_NOT_FOUND', url: window.location.href }, '*');
      }
      const tip = document.createElement("div");
      tip.style.cssText = "position:fixed;bottom:24px;left:24px;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;padding:12px 18px;border-radius:10px;z-index:99999;font-size:12px;font-weight:bold;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-family:sans-serif;max-width:320px;";
      tip.innerText = '⚠️ Không tìm thấy nút Chương Trước!';
      document.body.appendChild(tip);
      setTimeout(() => tip.remove(), 4000);
      return false;
    },
  
      
    startTeachNextMode: () => {
      
    window.__isTeachingNext = true;
    if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
      try { window.__TienHiepHelpers.indexParagraphsForTTS(); } catch(e) {}
    }
    const existingBanner = document.getElementById("__teach_next_banner");
    if (existingBanner) existingBanner.remove();
    const existingBox = document.getElementById("__teach_highlighter_box");
    if (existingBox) existingBox.remove();
    const existingCrosshair = document.getElementById("__teach_crosshair_target");
    if (existingCrosshair) existingCrosshair.remove();
    const existingBadge = document.getElementById("__teach_floating_badge");
    if (existingBadge) existingBadge.remove();

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
    banner.style.cssText = "position:fixed !important;top:8px !important;left:6px !important;right:6px !important;max-width:760px !important;margin:0 auto !important;background:linear-gradient(135deg,#0f172a,#1e1b4b) !important;color:#ffffff !important;padding:8px 10px !important;border-radius:12px !important;z-index:2147483647 !important;font-size:12px !important;font-weight:bold !important;box-shadow:0 14px 40px rgba(0,0,0,0.92) !important;display:flex !important;flex-direction:column !important;gap:6px !important;border:1.5px solid rgba(129,140,248,0.6) !important;font-family:system-ui,sans-serif !important;box-sizing:border-box !important;pointer-events:auto !important;-webkit-user-select:none !important;user-select:none !important;";
    banner.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0;"><span id="__teach_info_text" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;color:#c7d2fe;flex:1;min-width:0;">🎯 <b>Chỉ định:</b> Chạm hoặc rê tâm ngắm vào Nút / Vùng đọc</span><button id="__cancel_teach_next" style="background:linear-gradient(135deg,#ef4444,#dc2626) !important;border:none !important;color:#fff !important;padding:5px 10px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:30px !important;flex-shrink:0 !important;box-shadow:0 0 10px rgba(239,68,68,0.5) !important;">✕ Hủy</button></div><div id="__teach_action_row" style="display:flex;align-items:center;gap:6px;width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px;"><button id="__confirm_teach_next" style="display:none;background:linear-gradient(135deg,#10b981,#059669) !important;border:none !important;color:#fff !important;padding:6px 12px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(16,185,129,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:32px !important;white-space:nowrap !important;flex-shrink:0 !important;">✓ Lưu nút</button><button id="__save_content_area" style="display:none;background:linear-gradient(135deg,#10b981,#059669) !important;border:none !important;color:#fff !important;padding:6px 12px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(16,185,129,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:32px !important;white-space:nowrap !important;flex-shrink:0 !important;">✓ Lưu vùng đọc</button><button id="__read_from_here" style="display:none;background:linear-gradient(135deg,#8b5cf6,#6d28d9) !important;border:none !important;color:#fff !important;padding:6px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(139,92,246,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:32px !important;white-space:nowrap !important;flex-shrink:0 !important;">📖 Đọc từ đây</button><button id="__scope_toggle_btn" style="display:none;background:linear-gradient(135deg,#0ea5e9,#0284c7) !important;border:none !important;color:#fff !important;padding:6px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(14,165,233,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:32px !important;white-space:nowrap !important;flex-shrink:0 !important;">📦 Cả vùng</button><button id="__back_to_chunk" style="display:none;background:rgba(255,255,255,0.2) !important;border:none !important;color:#fff !important;padding:6px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:32px !important;white-space:nowrap !important;flex-shrink:0 !important;">📄 1 Đoạn</button><button id="__add_region_btn" style="display:none;background:linear-gradient(135deg,#6366f1,#4f46e5) !important;border:none !important;color:#fff !important;padding:6px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(99,102,241,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:32px !important;white-space:nowrap !important;flex-shrink:0 !important;">➕ Thêm vùng</button><button id="__test_next_teach" style="display:none;background:linear-gradient(135deg,#f59e0b,#d97706) !important;border:none !important;color:#fff !important;padding:6px 10px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:32px !important;white-space:nowrap !important;flex-shrink:0 !important;">⏭ Thử</button><button id="__reset_teach_next" style="background:rgba(255,255,255,0.18) !important;border:none !important;color:#fff !important;padding:6px 10px !important;border-radius:8px !important;cursor:pointer !important;font-weight:600 !important;font-size:11px !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:32px !important;white-space:nowrap !important;flex-shrink:0 !important;">Mặc định</button></div>';
    document.body.appendChild(banner);

    const highlightBox = document.createElement("teach-highlighter");
    highlightBox.id = "__teach_highlighter_box";
    highlightBox.style.cssText = "position:fixed !important;pointer-events:none !important;z-index:2147483640 !important;outline:2.5px solid #f59e0b !important;outline-offset:-1px !important;background:rgba(245,158,11,0.2) !important;box-shadow:0 0 18px rgba(245,158,11,0.7), inset 0 0 12px rgba(245,158,11,0.25) !important;border-radius:6px !important;display:none !important;box-sizing:border-box !important;will-change:top,left,width,height !important;";
    document.body.appendChild(highlightBox);

    const floatingBadge = document.createElement("div");
    floatingBadge.id = "__teach_floating_badge";
    floatingBadge.style.cssText = "position:fixed !important;pointer-events:auto !important;display:none !important;background:linear-gradient(135deg,#0f172a,#1e1b4b) !important;border:1.5px solid #f59e0b !important;color:#ffffff !important;border-radius:10px !important;padding:6px 8px !important;font-size:11px !important;font-family:system-ui,sans-serif !important;white-space:nowrap !important;box-shadow:0 8px 24px rgba(0,0,0,0.92) !important;z-index:2147483647 !important;align-items:center !important;gap:6px !important;box-sizing:border-box !important;max-width:96vw !important;overflow:hidden !important;";
    floatingBadge.innerHTML = '<div style="display:flex;flex-direction:column;gap:2px;min-width:0;overflow:hidden;flex:1;"><div style="display:flex;align-items:center;gap:5px;"><span id="__teach_badge_type_tag" style="background:#f59e0b;color:#0f172a;font-weight:900;padding:1px 5px;border-radius:4px;font-size:9px;flex-shrink:0;">MỤC TIÊU</span><span id="__teach_badge_name" style="font-weight:bold;color:#fde047;max-width:130px;overflow:hidden;text-overflow:ellipsis;">...</span></div><div id="__teach_badge_sub" style="font-size:10px;color:#94a3b8;max-width:180px;overflow:hidden;text-overflow:ellipsis;">...</div></div><div style="display:flex;align-items:center;gap:4px;flex-shrink:0;"><button id="__teach_badge_prev" title="Chọn nút trước trong cụm" style="background:rgba(255,255,255,0.18) !important;border:none !important;color:#fff !important;padding:5px 8px !important;border-radius:6px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">◀</button><button id="__teach_badge_next" title="Chọn nút sau trong cụm" style="background:rgba(255,255,255,0.18) !important;border:none !important;color:#fff !important;padding:5px 8px !important;border-radius:6px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">▶</button><button id="__teach_badge_read" style="display:none;background:linear-gradient(135deg,#8b5cf6,#6d28d9) !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 10px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">📖 Đọc</button><button id="__teach_badge_scope" style="display:none;background:linear-gradient(135deg,#0ea5e9,#0284c7) !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 9px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">📦 Cả vùng</button><button id="__teach_badge_add_region" style="display:none;background:linear-gradient(135deg,#6366f1,#4f46e5) !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 9px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">➕ Thêm</button><button id="__teach_badge_save" style="background:#10b981 !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 10px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;box-shadow:0 0 10px rgba(16,185,129,0.6) !important;min-height:30px !important;touch-action:manipulation !important;">✓ Lưu</button></div>';
    document.body.appendChild(floatingBadge);

    const crosshair = document.createElement("teach-crosshair");
    crosshair.id = "__teach_crosshair_target";
    crosshair.style.cssText = "position:fixed !important;left:calc(50vw - 34px) !important;top:calc(50vh - 34px) !important;width:68px !important;height:68px !important;z-index:2147483646 !important;cursor:grab !important;touch-action:none !important;user-select:none !important;-webkit-user-select:none !important;display:flex !important;align-items:center !important;justify-content:center !important;border-radius:50% !important;border:3px dashed #f59e0b !important;background:rgba(245,158,11,0.25) !important;box-shadow:0 0 24px rgba(245,158,11,0.8), inset 0 0 12px rgba(245,158,11,0.3) !important;box-sizing:border-box !important;";
    crosshair.innerHTML = '<div id="__teach_ch_h" style="position:absolute;width:100%;height:2px;background:#f59e0b !important;top:50%;left:0;pointer-events:none;transform:translateY(-50%);"></div><div id="__teach_ch_v" style="position:absolute;height:100%;width:2px;background:#f59e0b !important;left:50%;top:0;pointer-events:none;transform:translateX(-50%);"></div><div id="__teach_ch_dot" style="width:16px;height:16px;border-radius:50%;background:#ef4444 !important;border:2px solid #ffffff !important;box-shadow:0 0 10px #ef4444 !important;pointer-events:none;z-index:2;"></div><div id="__teach_ch_lbl" style="position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:6px;background:#f59e0b !important;color:#0f172a !important;font-size:11px !important;font-weight:900 !important;padding:5px 12px !important;border-radius:8px !important;white-space:nowrap !important;box-shadow:0 4px 14px rgba(0,0,0,0.85) !important;pointer-events:auto !important;cursor:grab !important;touch-action:none !important;letter-spacing:0.3px !important;border:1.5px solid #ffffff !important;user-select:none !important;-webkit-user-select:none !important;">🎯 RÊ TÂM NGẮM</div>';
    document.body.appendChild(crosshair);
  
      
    const generateContainerSelector = (el) => {
      if (!el || el === document.body || el === document.documentElement) return '';
      for (const std of CONTENT_SELECTORS) {
        try {
          if (el.matches && el.matches(std)) return std;
          const closest = el.closest ? el.closest(std) : null;
          if (closest && closest !== document.body && closest !== document.documentElement) return std;
        } catch(e) {}
      }

      if (el.id && !/\d{4,}/.test(el.id)) return '#' + el.id;
      if (el.className && typeof el.className === 'string') {
        const classes = el.className.trim().split(/\s+/).filter(c => c && !c.includes(':') && !c.includes('/') && !/\d{4,}/.test(c));
        for (const cls of classes) {
          try { if (document.querySelectorAll('.' + cls).length === 1) return '.' + cls; } catch(e) {}
        }
        if (classes.length > 1) {
          try { if (document.querySelectorAll('.' + classes.slice(0, 2).join('.')).length === 1) return '.' + classes.slice(0, 2).join('.'); } catch(e) {}
        }
      }
      if (el.parentElement?.id && !/\d{4,}/.test(el.parentElement.id)) return '#' + el.parentElement.id + ' > ' + el.tagName.toLowerCase();
      const tag = el.tagName.toLowerCase();
      if (tag === 'article') return 'article';
      const firstCls = el.className && typeof el.className === 'string' ? el.className.trim().split(/\s+/).find(c => c && !/\d{4,}/.test(c)) : '';
      if (firstCls) return tag + '.' + firstCls;
      if (el.parentElement && el.parentElement !== document.body && el.parentElement !== document.documentElement) {
        const parentSel = generateContainerSelector(el.parentElement);
        if (parentSel && !parentSel.includes('>')) {
          const siblings = Array.from(el.parentElement.children).filter(c => c.tagName === el.tagName);
          return parentSel + ' > ' + tag + (siblings.length > 1 ? ':nth-of-type(' + (siblings.indexOf(el) + 1) + ')' : '');
        }
      }
      return tag;
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
  
      
    const isTeachUI = (el) => !!(el?.closest?.('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]'));

    const getDomDepth = (node) => {
      let d = 0;
      let curr = node;
      while (curr && curr !== document.body && curr !== document.documentElement) {
        d++;
        curr = curr.parentElement;
      }
      return d;
    };

    const findLowestCommonAncestor = (elements) => {
      if (!elements || elements.length === 0) return null;
      if (elements.length === 1) return findContentContainer(elements[0]);
      const getAncestors = (el) => {
        const chain = [];
        let curr = el ? el.parentElement : null;
        while (curr && curr !== document.body && curr !== document.documentElement) {
          const tag = curr.tagName.toLowerCase();
          if (!['header', 'footer', 'nav', 'aside'].includes(tag)) chain.push(curr);
          curr = curr.parentElement;
        }
        return chain;
      };
      let common = getAncestors(elements[0]);
      for (let i = 1; i < elements.length; i++) {
        const ancSet = new Set(getAncestors(elements[i]));
        common = common.filter(a => ancSet.has(a));
      }
      if (common.length > 0) {
        for (const anc of common) {
          const tag = anc.tagName.toLowerCase();
          if (tag !== 'table' && tag !== 'body' && tag !== 'html') return anc;
        }
        return common[0];
      }
      return findContentContainer(elements[0]);
    };

    const CONTENT_SELECTORS = [
      ".txtnav", "#content", "#chaptercontent", "#chapterContent", "#contentbox",
      ".read-content", "#read-content", ".muye-reader-content-novel", "#chapter-c",
      ".chapter-c", ".box-chap", "#chapter-detail", ".showtxt", ".novel-content",
      ".reading-content", "article", ".entry-content", "#htmlContent", ".article-content",
      ".page-content", ".yd_text2", "#nr1", "#BookText", "#booktxt", ".book_con",
      "#acontent", ".reader-content", ".chapter_content", "#novelcontent", "#viewcontent"
    ];

    const findContentContainer = (target) => {
      if (!target || target === document.body || target === document.documentElement) return null;
      for (const std of CONTENT_SELECTORS) {
        try {
          const matched = target.closest ? target.closest(std) : null;
          if (matched && matched !== document.body && matched !== document.documentElement) {
            const pCount = matched.querySelectorAll('p, [data-tts-idx]').length;
            const txtLen = (matched.innerText || '').trim().length;
            if (pCount >= 2 || txtLen > 150) return matched;
          }
        } catch(e) {}
      }
      if ((target.querySelectorAll?.('p, [data-tts-idx]')?.length || 0) >= 3) return target;

      let curr = target.parentElement;
      let bestCandidate = null;
      let maxPCount = 0;
      while (curr && curr !== document.body && curr !== document.documentElement) {
        const tag = curr.tagName.toLowerCase();
        if (['header', 'footer', 'nav', 'aside'].includes(tag)) break;
        const id = (curr.id || '').toLowerCase();
        const cls = typeof curr.className === 'string' ? curr.className.toLowerCase() : '';
        if (['app', '__next', 'root'].includes(id)) break;
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

    const analyzeChunkHierarchy = (targetEl, additionalChunks = []) => {
      if (!targetEl) return null;
      const chunks = [targetEl, ...(additionalChunks || [])].filter(Boolean);
      const lca = findLowestCommonAncestor(chunks);
      if (!lca) return null;
      const lcaDepth = getDomDepth(lca);
      const targetDepth = getDomDepth(targetEl);
      const relativeDepth = Math.max(1, targetDepth - lcaDepth);
      const tag = targetEl.tagName.toUpperCase();
      const candidateEls = Array.from(lca.querySelectorAll(tag.toLowerCase()));
      const matched = candidateEls.filter(el => {
        if (isSpamOrAd(el)) return false;
        const d = getDomDepth(el) - lcaDepth;
        if (Math.abs(d - relativeDepth) > 1) return false;
        const txt = (el.innerText || el.textContent || '').trim();
        if (txt.length < 8) return false;
        let linkLen = 0;
        el.querySelectorAll('a').forEach(a => linkLen += (a.textContent || '').length);
        return !(linkLen / (txt.length || 1) > 0.18);
      });
      return {
        lca,
        lcaSelector: generateContainerSelector(lca),
        relativeDepth,
        chunkTag: tag,
        count: matched.length > 0 ? matched.length : chunks.length,
        matchedElements: matched,
        targetDepth,
        lcaDepth
      };
    };

    const isSpamOrAd = (el) => {
      if (!el) return false;
      const h = (el.getAttribute('href') || el.href || '').toLowerCase();
      const oc = (el.getAttribute('onclick') || '').toLowerCase();
      const t = (el.textContent || '').trim().toLowerCase();
      if (/gourl|closead|javascript:history|scrollto/.test(h + ' ' + oc)) return true;
      return /哄骗|做爱|巨乳|小姨子|偷情|操了|高潮|抽插|cầm thú|lừa nữ|ký túc xá|报错|báo lỗi/.test(t);
    };

    const refineToBestTarget = (rawEl, cx, cy) => {
      if (!rawEl || rawEl === document.body || rawEl === document.documentElement || isSpamOrAd(rawEl)) return null;
      const nextKwRegex = /(下一章|下一页|下一頁|下页|下頁|chương sau|tiếp theo|hồi sau|trang sau|next chapter|next page|sau|trang kế)/i;

      // 1. Kiểm tra trực tiếp xem rawEl có phải liên kết / nút bấm không
      const directAnchor = rawEl.tagName === 'A' ? rawEl : (rawEl.closest ? rawEl.closest('a, button, [role="button"]') : null);
      if (directAnchor && !isSpamOrAd(directAnchor)) return directAnchor;

      // 2. Khi có tọa độ (cx, cy) từ tâm ngắm hoặc chạm cảm ứng: Ưu tiên tìm nút bấm / liên kết ở lân cận trước
      if (cx !== undefined && cy !== undefined) {
        let pointEls = [];
        try {
          if (typeof document.elementsFromPoint === 'function') {
            pointEls = document.elementsFromPoint(cx, cy) || [];
          }
        } catch(e) {}

        for (const pEl of pointEls) {
          if (!pEl || isTeachUI(pEl)) continue;
          const directA = pEl.closest ? pEl.closest('a, button, [role="button"]') : null;
          if (directA && !isSpamOrAd(directA)) return directA;
        }

        // Tìm các thẻ liên kết trong container của rawEl hoặc phụ cận
        const searchRoot = (rawEl.parentElement && rawEl.parentElement !== document.body) ? rawEl.parentElement : rawEl;
        const candidateLinks = Array.from(searchRoot.querySelectorAll ? searchRoot.querySelectorAll('a[href], button, [role="button"], a') : []).filter(el => {
          if (isSpamOrAd(el)) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });

        if (candidateLinks.length > 0) {
          let bestDist = Infinity;
          let bestCand = null;

          for (const cand of candidateLinks) {
            const r = cand.getBoundingClientRect();
            const candCx = r.left + r.width / 2;
            const candCy = r.top + r.height / 2;
            const d = Math.hypot(cx - candCx, cy - candCy);

            if (cx >= r.left - 6 && cx <= r.right + 6 && cy >= r.top - 6 && cy <= r.bottom + 6) {
              if (d < bestDist) { bestDist = d; bestCand = cand; }
            }
          }
          if (bestCand) return bestCand;
        }
      }

      // 3. Kiểm tra đoạn văn / vùng đọc
      const pEl = (rawEl.tagName === 'P' || rawEl.hasAttribute('data-tts-idx') || rawEl.classList?.contains('tienhiep-tts-paragraph'))
        ? rawEl
        : (rawEl.closest ? (rawEl.closest('[data-tts-idx], .tienhiep-tts-paragraph') || rawEl.closest('p')) : null);
      if (pEl && !isSpamOrAd(pEl)) return pEl;

      const pCountInRaw = rawEl.querySelectorAll ? rawEl.querySelectorAll('p, [data-tts-idx], .tienhiep-tts-paragraph').length : 0;
      if (pCountInRaw > 0 && cy !== undefined) {
        const chunks = Array.from(rawEl.querySelectorAll('[data-tts-idx], .tienhiep-tts-paragraph, p')).filter(c => !isSpamOrAd(c));
        let hit = chunks.find(c => {
          const r = c.getBoundingClientRect();
          return cy >= r.top - 6 && cy <= r.bottom + 6;
        });
        if (!hit && chunks.length > 0) {
          let minDist = Infinity;
          chunks.forEach(c => {
            const r = c.getBoundingClientRect();
            const d = Math.abs(cy - (r.top + r.height / 2));
            if (d < minDist) { minDist = d; hit = c; }
          });
        }
        if (hit) return hit;
      }

      // 4. Nếu không tìm thấy đoạn văn, quét liên kết dự phòng trong rawEl
      const fallbackLinks = Array.from(rawEl.querySelectorAll ? rawEl.querySelectorAll('a[href], button, [role="button"]') : []).filter(el => {
        if (isSpamOrAd(el)) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });

      if (fallbackLinks.length > 0) {
        const nextRel = fallbackLinks.find(a => a.getAttribute('rel') === 'next');
        if (nextRel) return nextRel;
        const nextKw = fallbackLinks.find(a => nextKwRegex.test((a.textContent || '').trim()));
        if (nextKw) return nextKw;
        return fallbackLinks[fallbackLinks.length - 1];
      }

      return rawEl;
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
        const badgeW = floatingBadge.offsetWidth || 280;
        let badgeTop = chRect.bottom + 10;
        if (badgeTop + 55 > window.innerHeight) {
          badgeTop = Math.max(50, chRect.top - 55);
        }
        let badgeLeft;
        if (window.innerWidth < 480) {
          badgeLeft = Math.max(6, Math.round((window.innerWidth - Math.min(window.innerWidth - 12, badgeW)) / 2));
        } else {
          badgeLeft = Math.max(8, Math.min(window.innerWidth - badgeW - 8, chRect.left + 34 - Math.round(badgeW / 2)));
        }
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

    let collectedRegions = [];
    let currentHierarchy = null;

    window.__TienHiepTeachState = {
      getHierarchy: () => currentHierarchy,
      getCollectedRegions: () => collectedRegions,
      addCurrentRegion: () => {
        if (!currentHierarchy) return false;
        const reg = {
          lcaSelector: currentHierarchy.lcaSelector,
          chunkTag: currentHierarchy.chunkTag,
          relativeDepth: currentHierarchy.relativeDepth,
          count: currentHierarchy.count
        };
        const exists = collectedRegions.some(r => r.lcaSelector === reg.lcaSelector && r.chunkTag === reg.chunkTag);
        if (!exists) collectedRegions.push(reg);
        return true;
      },
      clearRegions: () => { collectedRegions = []; }
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
        testNextBtn: getEl("__test_next_teach"), addRegionBtn: getEl("__add_region_btn"), badgeAddRegionBtn: getEl("__teach_badge_add_region"),
        badgeTypeTag: getEl("__teach_badge_type_tag"), badgeName: getEl("__teach_badge_name"), badgeSub: getEl("__teach_badge_sub"),
        badgePrevBtn: getEl("__teach_badge_prev"), badgeNextBtn: getEl("__teach_badge_next"), badgeSaveBtn: getEl("__teach_badge_save"),
        badgeReadBtn: getEl("__teach_badge_read"), badgeScopeBtn: getEl("__teach_badge_scope")
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
        [els.readBtn, els.scopeToggleBtn, els.saveContentBtn, els.backToChunkBtn, els.badgeReadBtn, els.badgeScopeBtn, els.addRegionBtn, els.badgeAddRegionBtn].forEach(el => setDisplay(el, false));
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
        currentHierarchy = analyzeChunkHierarchy(currentTarget);
        const relDepth = currentHierarchy ? currentHierarchy.relativeDepth : 1;
        const matchedCount = currentHierarchy ? currentHierarchy.count : 1;
        const lcaSel = currentHierarchy ? currentHierarchy.lcaSelector : '';

        if (els.badgeTypeTag) { els.badgeTypeTag.textContent = "BẬC " + relDepth; els.badgeTypeTag.style.background = "#8b5cf6"; }
        if (els.badgeName) els.badgeName.textContent = matchedCount + " đoạn (" + (currentHierarchy ? currentHierarchy.chunkTag : tag) + ")";
        if (els.badgeSub) els.badgeSub.textContent = (lcaSel ? (lcaSel + " • ") : '') + "Bậc DOM " + relDepth + (collectedRegions.length > 0 ? (" • Đã gộp " + collectedRegions.length + " vùng") : "");
        if (els.infoText) els.infoText.innerHTML = '🎯 <b>Bậc ' + relDepth + ':</b> Tìm thấy <b style="color:#38bdf8;">' + matchedCount + ' đoạn văn</b> trong <span style="color:#fde047;">' + (lcaSel || 'khối truyện') + '</span>' + (collectedRegions.length > 0 ? ' <b style="color:#a7f3d0;">(Đã chọn ' + collectedRegions.length + ' vùng)</b>' : '');

        [els.badgePrevBtn, els.badgeNextBtn, els.readBtn, els.scopeToggleBtn, els.badgeReadBtn, els.badgeScopeBtn, els.saveContentBtn, els.badgeSaveBtn, els.addRegionBtn, els.badgeAddRegionBtn].forEach(el => setDisplay(el, true));
        [els.confirmBtn, els.testNextBtn, els.backToChunkBtn].forEach(el => setDisplay(el, false));

        if (els.readBtn) els.readBtn.innerHTML = '📖 Đọc từ đây';
        if (els.scopeToggleBtn) els.scopeToggleBtn.innerHTML = '📦 Cả vùng';
        if (els.badgeReadBtn) els.badgeReadBtn.innerHTML = '📖 Đọc';
        if (els.badgeScopeBtn) { els.badgeScopeBtn.innerHTML = '📦 Cả vùng'; els.badgeScopeBtn.style.background = "linear-gradient(135deg,#0ea5e9,#0284c7)"; }

        const totalParas = collectedRegions.reduce((sum, r) => sum + (r.count || 0), 0) + (collectedRegions.some(r => r.lcaSelector === lcaSel) ? 0 : matchedCount);
        if (els.saveContentBtn) els.saveContentBtn.innerHTML = '✓ Lưu vùng đọc (' + totalParas + ' đoạn)';
        if (els.addRegionBtn) els.addRegionBtn.innerHTML = '➕ Thêm vùng (' + collectedRegions.length + ')';
        if (els.badgeSaveBtn) { els.badgeSaveBtn.innerHTML = '✓ Lưu'; els.badgeSaveBtn.style.background = "#10b981"; }
      }
    };

    const applyTargetScope = (newScope) => {
      currentScope = newScope;
      if (currentScope === 'container') {
        const container = (currentHierarchy && currentHierarchy.lca) || currentContainerTarget || (currentChunkTarget ? findContentContainer(currentChunkTarget) : null) || (currentTarget ? findContentContainer(currentTarget) : null);
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
  
      
    const saveAndApplyRule = (target) => {
      if (!target) return;
      if (typeof isSpamOrAd === 'function' && isSpamOrAd(target)) {
        banner.style.background = "linear-gradient(135deg,#ef4444,#dc2626)";
        banner.innerHTML = "<span>⚠️ Đây là liên kết quảng cáo/rác! Hãy rê tâm ngắm vào nút Chương Sau.</span>";
        setTimeout(() => { banner.style.background = "linear-gradient(135deg,#0f172a,#1e1b4b)"; updateTargetUI(); }, 2000);
        return;
      }
      window.__TienHiepHelpers.saveNextRule(generateSmartRule(target));
      cleanup();
      banner.style.background = "linear-gradient(135deg,#10b981,#059669)";
      banner.innerHTML = "<span>✅ Đã lưu cấu hình nút Chuyển Trang thành công!</span>";
      setTimeout(() => {
        banner.remove();
      }, 1200);
    };

    const saveContentAreaRule = (target) => {
      if (!target) return;
      const state = window.__TienHiepTeachState;
      const collected = (state && state.getCollectedRegions) ? state.getCollectedRegions() : [];
      const currentH = (state && state.getHierarchy) ? state.getHierarchy() : null;

      let host = window.__TienHiepHelpers.getEffectiveUrl().hostname || window.location.hostname || '';
      if ((!host || host === 'localhost' || host === '127.0.0.1') && window.__originalUrl) {
        try { host = new URL(window.__originalUrl).hostname || host; } catch(e) {}
      }

      let regions = [...collected];
      if (currentH && !regions.some(r => r.lcaSelector === currentH.lcaSelector && r.chunkTag === currentH.chunkTag)) {
        regions.push({
          lcaSelector: currentH.lcaSelector,
          chunkTag: currentH.chunkTag,
          relativeDepth: currentH.relativeDepth,
          count: currentH.count
        });
      }

      if (regions.length === 0) {
        const container = (currentScope === 'container' && target) ? target : findContentContainer(target);
        if (container) {
          const selector = generateContainerSelector(container);
          regions.push({ lcaSelector: selector, chunkTag: 'P', relativeDepth: 1, count: container.querySelectorAll('p').length });
        }
      }
      if (regions.length === 0) return;

      const mainSelector = regions[0].lcaSelector;
      const totalParas = regions.reduce((sum, r) => sum + (r.count || 0), 0);
      const smartRule = {
        domain: host,
        updatedAt: Date.now(),
        regions: regions,
        selector: mainSelector,
        excludeSelectors: ['.ad', '.advertisement', 'nav', 'header', 'footer', '[id*="ad"]', 'table.nav']
      };

      if (host) {
        try {
          localStorage.setItem('__tienhiep_smart_content_rule_' + host, JSON.stringify(smartRule));
          localStorage.setItem('__tienhiep_content_selector_' + host, mainSelector);
        } catch(e) {}
      }

      Object.assign(highlightBox.style, { outline: "4px solid #10b981", background: "rgba(16,185,129,0.25)", boxShadow: "0 0 35px rgba(16,185,129,0.95)" });
      if (window.__TienHiepHelpers?.indexParagraphsForTTS) window.__TienHiepHelpers.indexParagraphsForTTS();
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'SMART_CONTENT_RULE_SAVED', rule: smartRule, selector: mainSelector, host }, '*');
      }
      banner.style.background = "linear-gradient(135deg,#059669,#10b981)";
      banner.innerHTML = "<span>✅ Đã lưu vùng đọc thông minh: <b>" + totalParas + " đoạn văn</b> (" + regions.length + " vùng) cho " + host + "!</span>";
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
  
      
    let isDraggingCrosshair = false;
    let isTouchDrag = false;
    let dragOffset = { x: 34, y: 34 };

    // Di chuyển crosshair khi drag - tính tâm crosshair sau offset
    const onDragMove = (clientX, clientY) => {
      if (!isDraggingCrosshair) return;
      // Khi touch-drag: nâng crosshair lên 60px để ngón cái không che khuất tâm ngắm
      const effectiveY = isTouchDrag ? (clientY - 60) : clientY;
      const newLeft = Math.max(0, Math.min(window.innerWidth - 68, clientX - dragOffset.x));
      const newTop = Math.max(45, Math.min(window.innerHeight - 68, effectiveY - dragOffset.y));
      crosshair.style.setProperty("left", newLeft + "px", "important");
      crosshair.style.setProperty("top", newTop + "px", "important");
      detectUnderCrosshair(newLeft + 34, newTop + 34);
    };

    const startDrag = (clientX, clientY, fromTouch = false) => {
      isDraggingCrosshair = true;
      isTouchDrag = fromTouch;
      crosshair.style.cursor = 'grabbing';
      const rect = crosshair.getBoundingClientRect();
      dragOffset.x = clientX - rect.left;
      dragOffset.y = clientY - rect.top;
    };

    const endDrag = () => {
      if (isDraggingCrosshair) {
        isDraggingCrosshair = false;
        isTouchDrag = false;
        crosshair.style.cursor = 'grab';
      }
    };

    crosshair.addEventListener("pointerdown", (e) => {
      e.preventDefault(); e.stopPropagation(); startDrag(e.clientX, e.clientY, e.pointerType === 'touch');
      try { crosshair.setPointerCapture(e.pointerId); } catch(err) {}
    });
    crosshair.addEventListener("pointermove", (e) => {
      if (isDraggingCrosshair) { e.preventDefault(); e.stopPropagation(); onDragMove(e.clientX, e.clientY); }
    });
    const onPointerEnd = (e) => {
      if (isDraggingCrosshair) { endDrag(); try { crosshair.releasePointerCapture(e.pointerId); } catch(err) {} }
    };
    crosshair.addEventListener("pointerup", onPointerEnd);
    crosshair.addEventListener("pointercancel", onPointerEnd);

    crosshair.addEventListener("touchstart", (e) => {
      if (e.touches?.[0]) { e.preventDefault(); e.stopPropagation(); startDrag(e.touches[0].clientX, e.touches[0].clientY, true); }
    }, { passive: false });
    const onTouchMove = (e) => {
      if (isDraggingCrosshair && e.touches?.[0]) { e.preventDefault(); e.stopPropagation(); onDragMove(e.touches[0].clientX, e.touches[0].clientY); }
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

    // Khi mở Chế độ Chỉ định: chỉ phát hiện phần tử ngay dưới tâm ngắm ở giữa màn hình
    setTimeout(() => {
      const chRect = crosshair.getBoundingClientRect();
      detectUnderCrosshair(chRect.left + 34, chRect.top + 34);
    }, 150);

    let tapStartX = 0, tapStartY = 0, tapStartTime = 0;
    const onDocTouchStart = (e) => {
      if (!window.__isTeachingNext || !e.touches?.[0] || isTeachUI(e.target)) return;
      tapStartTime = Date.now();
      tapStartX = e.touches[0].clientX;
      tapStartY = e.touches[0].clientY;
    };

    let lastDirectTapTime = 0;
    const onDirectTap = (e) => {
      if (!window.__isTeachingNext || isTeachUI(e.target)) return;
      const now = Date.now();
      if (now - lastDirectTapTime < 320) {
        try { e.preventDefault(); e.stopPropagation(); } catch(err) {}
        return;
      }
      lastDirectTapTime = now;
      try { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); } catch(err) {}

      let clientX = e.clientX, clientY = e.clientY;
      if ((clientX === undefined || clientY === undefined) && e.changedTouches?.[0]) {
        clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY;
      }

      let target = refineToBestTarget(e.target, clientX, clientY);
      if (!target && clientX !== undefined && clientY !== undefined) {
        const els = document.elementsFromPoint ? document.elementsFromPoint(clientX, clientY) : [document.elementFromPoint(clientX, clientY)];
        for (const el of els) {
          if (el && !isTeachUI(el)) {
            target = refineToBestTarget(el, clientX, clientY);
            if (target) break;
          }
        }
      }

      // Khi tap vào trang: chỉ cập nhật target/highlight, crosshair KHÔNG nhảy vị trí
      if (target && target !== document.body && target !== document.documentElement) {
        const rect = target.getBoundingClientRect();
        handleTargetCandidate(target, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    };

    const onDocTouchEnd = (e) => {
      if (!window.__isTeachingNext || isTeachUI(e.target)) return;
      const touch = e.changedTouches?.[0];
      if (touch && (Date.now() - tapStartTime < 450) && Math.hypot(touch.clientX - tapStartX, touch.clientY - tapStartY) < 20) {
        onDirectTap(e);
      }
    };

    window.addEventListener("touchstart", onDocTouchStart, { passive: true, capture: true });
    window.addEventListener("touchend", onDocTouchEnd, { passive: false, capture: true });
    window.addEventListener("click", onDirectTap, { passive: false, capture: true });

    const cleanup = () => {
      window.__isTeachingNext = false; currentTarget = null; currentChunkTarget = null; currentContainerTarget = null; currentScope = 'chunk';
      stopRafLoop();
      ["touchstart", "touchend", "click"].forEach(ev => window.removeEventListener(ev, ev === "touchstart" ? onDocTouchStart : (ev === "touchend" ? onDocTouchEnd : onDirectTap), true));
      ["touchmove", "touchend", "touchcancel"].forEach(ev => window.removeEventListener(ev, ev === "touchmove" ? onTouchMove : endDrag, true));
      document.removeEventListener("mousemove", onMouseMove); document.removeEventListener("mouseup", endDrag);
      [highlightBox, floatingBadge, crosshair].forEach(el => el && el.remove());
    };

    bindInstantAction(document.getElementById("__cancel_teach_next"), () => { cleanup(); banner.remove(); });
    bindInstantAction(document.getElementById("__reset_teach_next"), () => {
      window.__TienHiepHelpers.deleteNextRule();
      let host = window.__TienHiepHelpers.getEffectiveUrl().hostname || window.location.hostname || '';
      if ((!host || host === 'localhost' || host === '127.0.0.1') && window.__originalUrl) {
        try { host = new URL(window.__originalUrl).hostname || host; } catch(e) {}
      }
      if (host) { try { localStorage.removeItem('__tienhiep_content_selector_' + host); localStorage.removeItem('__tienhiep_smart_content_rule_' + host); } catch(e) {} }
      if (window.__TienHiepTeachState) window.__TienHiepTeachState.clearRegions();
      cleanup(); banner.style.background = "linear-gradient(135deg,#3b82f6,#2563eb)"; banner.innerHTML = "<span>🔄 Đã khôi phục mặc định!</span>";
      setTimeout(() => { banner.remove(); }, 900);
    });

    const onAddRegionClick = () => {
      const state = window.__TienHiepTeachState;
      if (state && state.addCurrentRegion()) {
        const list = state.getCollectedRegions();
        banner.style.background = "linear-gradient(135deg,#6366f1,#4f46e5)";
        banner.innerHTML = "<span>➕ Đã gộp vùng " + list.length + "! Tiếp tục rê tâm ngắm hoặc bấm Lưu</span>";
        updateTargetUI();
        setTimeout(() => { banner.style.background = "linear-gradient(135deg,#0f172a,#1e1b4b)"; updateTargetUI(); }, 1400);
      }
    };

    [
      ["__add_region_btn", onAddRegionClick],
      ["__teach_badge_add_region", onAddRegionClick],
      ["__confirm_teach_next", () => currentTarget && saveAndApplyRule(currentTarget)],
      ["__read_from_here", () => currentTarget && readFromTargetParagraph(currentTarget)],
      ["__scope_toggle_btn", () => applyTargetScope('container')],
      ["__save_content_area", () => currentTarget && saveContentAreaRule(currentTarget)],
      ["__back_to_chunk", () => applyTargetScope('chunk')],
      ["__test_next_teach", () => { if (currentTarget) { cleanup(); banner.remove(); window.__TienHiepHelpers.triggerNavigation(currentTarget); } }],
      ["__teach_badge_save", () => (currentScope === 'container' || isTargetParagraph) ? saveContentAreaRule(currentTarget) : (currentTarget && saveAndApplyRule(currentTarget))],
      ["__teach_badge_read", () => currentTarget && readFromTargetParagraph(currentTarget)],
      ["__teach_badge_scope", () => applyTargetScope(currentScope === 'chunk' ? 'container' : 'chunk')],
      ["__teach_badge_prev", () => shiftTargetSibling(-1)],
      ["__teach_badge_next", () => shiftTargetSibling(1)]
    ].forEach(([id, handler]) => bindInstantAction(document.getElementById(id), handler));

    let lastCrosshairTap = 0;
    crosshair.addEventListener("touchend", () => {
      if (isDraggingCrosshair) return;
      const now = Date.now();
      if (now - lastCrosshairTap < 350 && currentTarget) {
        if (currentScope === 'container' || isTargetParagraph) saveContentAreaRule(currentTarget);
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
    window.__resetTransSession = resetTransSession;
    // Chi reset khi nguoi dung thuc su roi khoi trang (beforeunload), khong reset khi doi hash/popstate
    window.addEventListener('beforeunload', resetTransSession);

    window.__translationCache = window.__translationCache || new Map();
    window.__ti_translation_pairs = window.__ti_translation_pairs || new Map();
    window.__ti_original_title = window.__ti_original_title || (document ? document.title : "");
    let uniqueTranslateQueue = [], targetGroupsMap = new Map(), translateTimeout = null, isTranslating = false;
    let sweepRetryCount = 0;

    const _tiViRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    const _tiZhRegex = /[一-龥]/;

    function isGoodTranslation(orig, trans) {
      if (!trans || typeof trans !== 'string') return false;
      const t = trans.trim(), o = (orig || '').trim();
      if (!t || t === o) return false;
      if (_tiZhRegex.test(o) && _tiZhRegex.test(t) && !_tiViRegex.test(t)) return false;
      return true;
    }

    function streamTypewriterText(node, fullText) {
      if (!node || !node.parentNode) return;
      const words = fullText.split(' ');
      if (words.length <= 4) { node.nodeValue = fullText; return; }
      let currentIdx = 0;
      const step = Math.max(2, Math.ceil(words.length / 10));
      const timer = setInterval(() => {
        if (!node || !node.parentNode || !window.__autoTranslateEnabled) { clearInterval(timer); return; }
        currentIdx = Math.min(words.length, currentIdx + step);
        node.nodeValue = words.slice(0, currentIdx).join(' ');
        if (currentIdx >= words.length) { clearInterval(timer); node.nodeValue = fullText; }
      }, 16);
    }

    function applyTranslatedText(target, transText, enableStream = false) {
      if (!window.__autoTranslateEnabled || !target || !transText) return;
      try {
        if (target.orig && _tiZhRegex.test(target.orig) && !_tiViRegex.test(target.orig)) {
          window.__ti_translation_pairs.set(transText, target.orig);
          const trT = transText.trim(), trO = target.orig.trim();
          if (trT && trO) {
            window.__ti_translation_pairs.set(trT, trO);
            const normT = trT.replace(/["“”]/g, '"');
            window.__ti_translation_pairs.set(normT, trO);
            const curlyT = trT.replace(/"/g, '“');
            window.__ti_translation_pairs.set(curlyT, trO);
          }
        }
        if (target.type === "text") {
          const node = target.node;
          if (!node || !node.parentNode || !document.contains(node)) return;
          if (isGoodTranslation(target.orig, transText) || _tiViRegex.test(transText)) {
            node.__ti_translated__ = true;
          }
          if (target.orig && _tiZhRegex.test(target.orig)) {
            if (!node.__original_chinese__) node.__original_chinese__ = target.orig;
          }
          if (target.orig && _tiZhRegex.test(target.orig) && !_tiViRegex.test(target.orig)) {
            const cleanOrig = target.orig.trim();
            let pNode = node.parentElement;
            while (pNode && pNode !== document.body) {
              if (pNode.hasAttribute('data-tts-idx') || pNode.classList.contains('tienhiep-tts-paragraph') || pNode.tagName === 'P') {
                const prevZh = pNode.getAttribute('data-orig-zh') || '';
                if (!prevZh || !_tiZhRegex.test(prevZh) || _tiViRegex.test(prevZh)) {
                  pNode.setAttribute('data-orig-zh', cleanOrig);
                } else if (!prevZh.includes(cleanOrig)) {
                  pNode.setAttribute('data-orig-zh', prevZh + ' ' + cleanOrig);
                }
                break;
              }
              pNode = pNode.parentElement;
            }
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

        if (!window.__autoTranslateEnabled || curSession !== window.__pageSessionId) {
          uniqueTranslateQueue.length = 0;
          targetGroupsMap.clear();
          return;
        }

        if (translations && Array.isArray(translations)) {
          if (window.__autoTranslateObserver) {
            try { window.__autoTranslateObserver.disconnect(); } catch(e) {}
          }
          batchUniqueTexts.forEach((origText, idx) => {
            const trans = translations[idx];
            if (isGoodTranslation(origText, trans)) {
              window.__translationCache.set(origText, trans);
              const trimmed = origText.trim();
              if (trimmed) window.__translationCache.set(trimmed, trans.trim());
              const targets = targetGroupsMap.get(origText) || [];
              targets.forEach(t => applyTranslatedText(t, trans));
              targetGroupsMap.delete(origText);
            }
          });

          if (window.__autoTranslateObserver && window.__autoTranslateEnabled) {
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
        if (!window.__autoTranslateEnabled || curSession !== window.__pageSessionId) {
          uniqueTranslateQueue.length = 0;
          targetGroupsMap.clear();
          return;
        }
        if (uniqueTranslateQueue.length > 0) {
          setTimeout(processTranslateQueue, 10);
        } else {
          clearTimeout(window.__translateCompleteTimeout);
          window.__translateCompleteTimeout = setTimeout(() => {
            // SWEEP PASS: Quet vet kiem tra triet de truoc khi bao hoan tat
            if (window.__autoTranslateEnabled && typeof window.__sweepUntranslatedNodes === 'function') {
              const missed = window.__sweepUntranslatedNodes();
              if (missed > 0 && sweepRetryCount < 3) {
                sweepRetryCount++;
                console.log("[Translate Sweep Pass] Con " + missed + " nodes chua dich, tiep tuc dich dot " + sweepRetryCount);
                processTranslateQueue();
                return;
              }
            }
            sweepRetryCount = 0;

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
          }, 350);
        }
      }
    }
  
    
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
  
  
    
    window.__tienhiepDarkMode = false;
    window.__tienhiepCleanAds = false;
    window.__ensureDarkMode = () => {};
    window.__ensureCleanAds = () => {};
  
    
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
              tabId: window.__TIENHIEP_TAB_ID__,
              title: res.title,
              text: res.text,
              initialParaIdx: typeof data.initialParaIdx === 'number' ? data.initialParaIdx : 0
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
          window.__autoTranslateEnabled = true;
          if (typeof window.__forceTranslateAll === 'function') {
            window.__forceTranslateAll();
          } else if (typeof window.__collectAndTranslateNodes === 'function') {
            window.__collectAndTranslateNodes(document.body || document.documentElement);
          }
        } else if (action === 'REVERT_ORIGINAL') {
          window.__autoTranslateEnabled = false;
          if (typeof window.__revertToOriginal === 'function') {
            window.__revertToOriginal();
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
              tabId: window.__TIENHIEP_TAB_ID__,
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
        const tag = (e.target && e.target.tagName) || '';
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
        let eff = (window.__TienHiepHelpers ? window.__TienHiepHelpers.getEffectiveUrl().href : '') || window.__originalUrl || '';
        if (!eff || eff.indexOf('chrome') === 0 || eff.indexOf('about:') === 0) {
          eff = window.__originalUrl || '';
        }
        if (eff && (eff.indexOf('http://') === 0 || eff.indexOf('https://') === 0)) {
          window.parent.postMessage({
            type: 'PAGE_LOADED',
            tabId: window.__TIENHIEP_TAB_ID__,
            url: eff,
            title: document.title
          }, '*');
        }
      }
    }
  
    
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
      ].join('\n');
      (document.head || document.documentElement).appendChild(style);

      
    function getSavedWords() {
      try {
        const raw = localStorage.getItem('__th_ejoy_saved_words');
        return raw ? JSON.parse(raw) : [];
      } catch(e) {
        return [];
      }
    }

    function saveWordToNotebook(word, zh, hv, meaning, context) {
      if (!word) return false;
      try {
        const list = getSavedWords();
        const exists = list.some(item => item.word.toLowerCase() === word.toLowerCase());
        if (!exists) {
          list.unshift({
            id: Date.now(),
            word: word,
            zh: zh || '',
            hv: hv || '',
            meaning: meaning || '',
            context: context || '',
            date: new Date().toLocaleDateString('vi-VN')
          });
          localStorage.setItem('__th_ejoy_saved_words', JSON.stringify(list.slice(0, 300)));
        }
        return true;
      } catch(e) {
        return false;
      }
    }

    function openNotebookModal() {
      const existing = document.getElementById('__th_ejoy_notebook_modal');
      if (existing) existing.remove();

      const words = getSavedWords();
      const modal = document.createElement('div');
      modal.id = '__th_ejoy_notebook_modal';
      modal.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 16px;';

      const box = document.createElement('div');
      box.style.cssText = 'background: #ffffff; border-radius: 14px; width: 440px; max-width: 95vw; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 20px 40px rgba(0,0,0,0.25); overflow: hidden;';

      // Header
      const header = document.createElement('div');
      header.style.cssText = 'padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; background: #f8fafc;';
      header.innerHTML = '<div style="font-size: 14px; font-weight: 800; color: #6d28d9; display: flex; align-items: center; gap: 6px;"><span>📓</span><span>SỔ TAY TỪ VỰNG (' + words.length + ' từ)</span></div>';

      const btnCloseModal = document.createElement('button');
      btnCloseModal.textContent = '✕';
      btnCloseModal.style.cssText = 'background: none; border: none; font-size: 16px; font-weight: bold; color: #64748b; cursor: pointer; padding: 4px;';
      btnCloseModal.onclick = () => { modal.remove(); };
      header.appendChild(btnCloseModal);
      box.appendChild(header);

      // Body list
      const listDiv = document.createElement('div');
      listDiv.style.cssText = 'padding: 12px 16px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 8px;';

      if (words.length === 0) {
        listDiv.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 32px 0; font-size: 13px;">Chưa có từ nào trong Sổ tay.<br>Hãy bấm ⭐ "Lưu Sổ Tay" khi tra từ để lưu lại!</div>';
      } else {
        words.forEach((item) => {
          const row = document.createElement('div');
          row.style.cssText = 'padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; display: flex; align-items: center; justify-content: space-between; gap: 8px;';
          let rowHtml = '<div><strong style="color: #0f172a; font-size: 13.5px;">' + item.word + '</strong>';
          if (item.hv) rowHtml += ' <span style="color: #7c3aed; font-size: 11.5px; font-weight: 600;">[' + item.hv + ']</span>';
          if (item.zh) rowHtml += ' <span style="color: #6d28d9; font-size: 12px; font-weight: 700; font-family: SimSun, serif; background: #ede9fe; padding: 1px 5px; border-radius: 4px;">' + item.zh + '</span>';
          rowHtml += '<div style="color: #059669; font-size: 12px; font-weight: 600; margin-top: 2px;">' + item.meaning + '</div>';
          if (item.context) {
            rowHtml += '<div style="color: #64748b; font-size: 11.5px; font-family: SimSun, serif; margin-top: 3px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">' + item.context + '</div>';
          }
          rowHtml += '</div>';
          row.innerHTML = rowHtml;

          const delBtn = document.createElement('button');
          delBtn.textContent = '🗑️';
          delBtn.style.cssText = 'background: none; border: none; font-size: 13px; cursor: pointer; opacity: 0.6; padding: 4px;';
          delBtn.title = 'Xóa khỏi sổ tay';
          delBtn.onclick = () => {
            const updated = getSavedWords().filter(w => w.id !== item.id);
            localStorage.setItem('__th_ejoy_saved_words', JSON.stringify(updated));
            row.remove();
          };
          row.appendChild(delBtn);
          listDiv.appendChild(row);
        });
      }
      box.appendChild(listDiv);
      modal.appendChild(box);
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
      document.body.appendChild(modal);
    }
  
      
    function showPopupAt(x, y, data) {
      if (activePopup) { activePopup.remove(); activePopup = null; }

      const isMobile = window.innerWidth <= 640 || ('ontouchstart' in window && window.innerWidth <= 800);
      const popup = document.createElement('div');
      popup.id = '__th_ejoy_popup';

      if (isMobile) {
        popup.style.cssText = 'position: fixed; left: 10px; right: 10px; bottom: 10px; width: auto; max-width: calc(100vw - 20px); max-height: 52vh; overflow-y: auto; z-index: 2147483647; background: #ffffff; border-radius: 16px; border: 1px solid #cbd5e1; border-top: 3.5px solid #7c3aed; box-shadow: 0 -8px 25px rgba(0,0,0,0.2); padding: 10px 12px 12px 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: #1e293b; user-select: none; box-sizing: border-box;';
      } else {
        const popupWidth = 420;
        let posX = Math.max(12, Math.min(window.innerWidth - popupWidth - 14, x - popupWidth / 2));
        let posY = y + 8;
        if (y - window.scrollY + 220 > window.innerHeight && y - window.scrollY > 230) posY = y - 230;
        popup.style.cssText = 'position: absolute; left: ' + posX + 'px; top: ' + (posY + window.scrollY) + 'px; width: ' + popupWidth + 'px; max-width: 92vw; z-index: 2147483647; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; border-top: 4px solid #7c3aed; box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.2); padding: 11px 15px 12px 15px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12.5px; color: #1e293b; user-select: none; box-sizing: border-box;';
      }

      if (isMobile) {
        const pullBar = document.createElement('div');
        pullBar.style.cssText = 'width: 32px; height: 3.5px; background: #cbd5e1; border-radius: 99px; margin: 0 auto 6px auto;';
        popup.appendChild(pullBar);
      }

      // 1. Header: Sổ tay + Nguồn + Đóng
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 5px; margin-bottom: 7px;';
      header.innerHTML = '<div style="display: flex; align-items: center; gap: 5px;"><span style="font-size: 11px; font-weight: 800; color: #7c3aed;">📓 SỔ TAY TỪ VỰNG</span><span style="font-size: 9px; font-weight: 700; background: #f3e8ff; color: #7e22ce; padding: 1px 5px; border-radius: 3px; border: 1px solid #d8b4fe;">' + (data.source || 'CMLM C++') + '</span></div>';

      const btnClose = document.createElement('button');
      btnClose.textContent = '✕';
      btnClose.style.cssText = 'background: none; border: none; font-size: 14px; font-weight: bold; color: #94a3b8; cursor: pointer; padding: 2px 5px; line-height: 1;';
      btnClose.onclick = closePopup;
      header.appendChild(btnClose);
      popup.appendChild(header);

      // 2. Thẻ từ vựng chính: Tiếng Việt + Chữ Hán Match + Hán Việt + Nút tác vụ
      const wordRow = document.createElement('div');
      wordRow.style.cssText = 'display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px;';

      const hasHanInOrig = data.origZh && /[一-龥]/.test(data.origZh);
      const wordInfo = document.createElement('div');
      let wordHtml = '<div style="display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap;">';
      wordHtml += '<strong style="font-size: 15.5px; font-weight: 800; color: #0f172a; line-height: 1.2;">' + data.selectedText + '</strong>';
      if (hasHanInOrig) {
        wordHtml += '<span style="font-size: 15.5px; font-weight: 800; color: #6d28d9; font-family: SimSun, serif; background: #ede9fe; border: 1.5px solid #c4b5fd; padding: 1px 7px; border-radius: 4px;">' + data.origZh + '</span>';
      }
      if (data.hanviet) {
        wordHtml += '<span style="font-size: 11.5px; font-weight: 600; color: #4338ca;">[' + data.hanviet + ']</span>';
      }
      wordHtml += '</div>';
      wordInfo.innerHTML = wordHtml;

      const actionBtns = document.createElement('div');
      actionBtns.style.cssText = 'display: flex; align-items: center; gap: 4px; flex-shrink: 0;';

      const btnSpeak = document.createElement('button');
      btnSpeak.className = '__th_ejoy_btn';
      btnSpeak.textContent = '🔊';
      btnSpeak.title = 'Phát âm';
      btnSpeak.onclick = () => speakWord(hasHanInOrig ? data.origZh : data.selectedText);

      const btnCopy = document.createElement('button');
      btnCopy.className = '__th_ejoy_btn';
      btnCopy.textContent = '📋';
      btnCopy.title = 'Sao chép';
      btnCopy.onclick = () => {
        const t = (hasHanInOrig ? data.selectedText + ' (' + data.origZh + (data.hanviet ? ' - ' + data.hanviet : '') + ')' : data.selectedText);
        navigator.clipboard.writeText(t);
        btnCopy.textContent = '✓';
        setTimeout(() => { btnCopy.textContent = '📋'; }, 1200);
      };

      const btnSave = document.createElement('button');
      btnSave.className = '__th_ejoy_btn __th_ejoy_btn_save';
      btnSave.textContent = '⭐';
      btnSave.title = 'Lưu vào Sổ tay';
      btnSave.onclick = () => {
        let ctxStr = '';
        if (data.accurateContext && data.accurateContext.target) {
          ctxStr = (data.accurateContext.before || '') + '【' + data.accurateContext.target + '】' + (data.accurateContext.after || '');
        }
        saveWordToNotebook(data.selectedText, hasHanInOrig ? data.origZh : '', data.hanviet || '', data.currentMeaning || data.selectedText, ctxStr);
        btnSave.textContent = '⭐ Đã lưu';
      };

      actionBtns.appendChild(btnSpeak);
      actionBtns.appendChild(btnCopy);
      actionBtns.appendChild(btnSave);
      wordRow.appendChild(wordInfo);
      wordRow.appendChild(actionBtns);
      popup.appendChild(wordRow);

      // 3. Ngữ cảnh chữ Hán chuẩn xác: Đánh dấu ĐÚNG từ đang trong sổ tay giữa câu nguyên tác
      const hasTargetHan = data.accurateContext && data.accurateContext.target && /[一-龥]/.test(data.accurateContext.target);
      const hasContextHan = data.accurateContext && /[一-龥]/.test((data.accurateContext.before || '') + (data.accurateContext.after || ''));
      if (hasTargetHan && hasContextHan) {
        const ctxBox = document.createElement('div');
        ctxBox.style.cssText = 'background: #f8fafc; border: 1.5px solid #ddd6fe; border-radius: 8px; padding: 7px 10px; margin-bottom: 7px; font-family: SimSun, serif; line-height: 1.6;';
        let ctxHtml = '<div style="font-size: 9.5px; font-weight: 800; color: #6d28d9; text-transform: uppercase; margin-bottom: 4px; font-family: -apple-system, sans-serif; display: flex; align-items: center; gap: 4px;"><span>🇨🇳</span><span>CÂU CHỮ HÁN GỐC (NGỮ CẢNH):</span></div>';
        ctxHtml += '<div style="font-size: 13.5px; color: #334155;">';
        if (data.accurateContext.before) ctxHtml += '<span>' + data.accurateContext.before + '</span> ';
        ctxHtml += '<span style="color: #ffffff; font-weight: 900; background: #7c3aed; border: 1px solid #6d28d9; padding: 2px 7px; border-radius: 4px; font-size: 15px; box-shadow: 0 1px 3px rgba(124,58,237,0.3);">【' + data.accurateContext.target + '】</span>';
        if (data.accurateContext.after) ctxHtml += ' <span>' + data.accurateContext.after + '</span>';
        ctxHtml += '</div>';
        ctxBox.innerHTML = ctxHtml;
        popup.appendChild(ctxBox);
      } else if (hasHanInOrig) {
        const ctxBox = document.createElement('div');
        ctxBox.style.cssText = 'background: #f8fafc; border: 1.5px solid #ddd6fe; border-radius: 8px; padding: 7px 10px; margin-bottom: 7px; font-family: SimSun, serif; line-height: 1.5;';
        ctxBox.innerHTML = '<div style="font-size: 9.5px; font-weight: 800; color: #6d28d9; text-transform: uppercase; margin-bottom: 3px; font-family: -apple-system, sans-serif;">🇨🇳 CHỮ HÁN MATCH ĐỐI ỨNG (TỪ TRUNG):</div><div style="font-size: 16px; font-weight: 800; color: #6d28d9; font-family: SimSun, serif;">【' + data.origZh + '】' + (data.hanviet ? ' <span style="font-size: 12px; color: #4338ca; font-weight: 600;">[' + data.hanviet + ']</span>' : '') + '</div>';
        popup.appendChild(ctxBox);
      }

      // 4. Debug bóc tách token chi tiết đối ứng
      const validTokens = (data.tokens && Array.isArray(data.tokens)) ? data.tokens.filter(t => t && t.zh && /[一-龥]/.test(t.zh)) : [];
      if (validTokens.length > 0) {
        const debugBox = document.createElement('div');
        debugBox.style.cssText = 'background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 5px 8px; margin-bottom: 6px; font-size: 11px;';
        let debugHtml = '<div style="font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 3px; display: flex; justify-content: space-between;"><span>🔍 PHÂN TÍCH ĐỐI ỨNG TỪNG TỪ:</span><span style="color: #6d28d9;">' + validTokens.length + ' từ</span></div>';
        debugHtml += '<div style="display: flex; flex-wrap: wrap; gap: 4px; max-height: 52px; overflow-y: auto;">';
        validTokens.forEach(t => {
          const isTarget = data.origZh && t.zh && data.origZh.includes(t.zh);
          debugHtml += '<span style="display: inline-flex; align-items: center; gap: 3px; padding: 1.5px 6px; border-radius: 4px; background: ' + (isTarget ? '#ede9fe; border: 1px solid #a78bfa; color: #6d28d9; font-weight: 700;' : '#ffffff; border: 1px solid #e2e8f0; color: #334155;') + '">';
          debugHtml += '<strong style="font-family: SimSun, serif; font-size: 12px;">' + t.zh + '</strong> <span style="color: #64748b; font-size: 9.5px;">(' + (t.vi || t.hanviet) + ')</span>';
          debugHtml += '</span>';
        });
        debugHtml += '</div>';
        debugBox.innerHTML = debugHtml;
        popup.appendChild(debugBox);
      }

      // 5. Các lựa chọn đổi nghĩa trực tiếp vào câu (Đã lọc bỏ từ trùng lặp)
      const rawAlts = (data.alternatives && Array.isArray(data.alternatives)) ? data.alternatives : [];
      const filteredAlts = rawAlts.filter(a => a && a.trim() && a.trim().toLowerCase() !== data.selectedText.trim().toLowerCase());
      if (filteredAlts.length > 0) {
        const altSection = document.createElement('div');
        altSection.style.cssText = 'margin-top: 5px; margin-bottom: 6px;';
        altSection.innerHTML = '<div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 3px;">Đổi nghĩa khác:</div>';
        const altsContainer = document.createElement('div');
        altsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 4px; max-height: 60px; overflow-y: auto;';
        filteredAlts.slice(0, 5).forEach(alt => {
          const chip = document.createElement('button');
          chip.className = '__th_ejoy_alt_chip';
          chip.textContent = alt;
          chip.onclick = () => replaceWordInParagraph(data.parentPara, data.paraIdx, data.selectedText, alt);
          altsContainer.appendChild(chip);
        });
        altSection.appendChild(altsContainer);
        popup.appendChild(altSection);
      }

      // 5. Footer: Thời gian siêu tốc & Liên kết sổ tay
      const footer = document.createElement('div');
      footer.style.cssText = 'margin-top: 5px; padding-top: 5px; border-top: 1px dashed #e2e8f0; display: flex; align-items: center; justify-content: space-between;';
      footer.innerHTML = '<span style="font-size: 9.5px; color: #94a3b8;">⚡ ' + (data.elapsed || '0.08ms In-Memory') + '</span><button type="button" style="background: none; border: none; color: #7c3aed; font-size: 10px; font-weight: 700; cursor: pointer; text-decoration: underline;">📖 Xem sổ tay (' + getSavedWords().length + ')</button>';
      const btnViewNotebook = footer.querySelector('button');
      if (btnViewNotebook) {
        btnViewNotebook.onclick = () => { closePopup(); openNotebookModal(); };
      }
      popup.appendChild(footer);

      document.body.appendChild(popup);
      activePopup = popup;
    }

    function replaceWordInParagraph(parentPara, paraIdx, oldWord, newWord) {
      if (!parentPara || !oldWord || !newWord) return;
      let curText = parentPara.innerText || parentPara.textContent || '';
      if (curText.includes(oldWord)) curText = curText.replace(oldWord, newWord);
      const spans = parentPara.querySelectorAll('.tts-sentence');
      if (spans.length > 0) {
        spans.forEach(sp => {
          if (sp.textContent && sp.textContent.includes(oldWord)) {
            sp.textContent = sp.textContent.replace(oldWord, newWord);
          }
        });
      } else {
        parentPara.textContent = curText;
      }
      if (paraIdx !== null) {
        try {
          window.parent.postMessage({
            type: 'PARAGRAPH_EDITED',
            paraIdx: paraIdx,
            newText: curText,
            oldWord: oldWord,
            newWord: newWord
          }, '*');
        } catch(e) {}
      }
      closePopup();
    }
  

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
          const isWordChar = (c) => /[a-zA-Z0-9\u00C0-\u1EF9]/.test(c);
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
  
  })();