// Injected Extractor: URL resolver and Clean Chapter Text extractor
export function getInjectedExtractorScript(): string {
  return `
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
      const apexHost = host.replace(/^www\\./, '');
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
        mainEl = document.querySelector('article, section, main, #main, .content, .container, body') || document.body;
      }

      let chapterTitle = "Chương đọc";
      const headingCandidates = Array.from(document.querySelectorAll("h1, h2, h3, .chapter-title, .title, .title1, .nr_title, #nr_title, .readTitle, [class*='title'], [id*='title']"));
      
      const viHeading = headingCandidates.find(el => {
        const txt = (el.textContent || "").trim();
        return /Chương\\s*\\d+/i.test(txt) || /Chapter\\s*\\d+/i.test(txt);
      });

      const h1Heading = headingCandidates.find(el => {
        const isH1OrMain = el.tagName === 'H1' || el.classList.contains('title1');
        const txt = (el.textContent || "").trim();
        return isH1OrMain && txt.length > 0 && txt.length < 150;
      });

      const zhHeading = headingCandidates.find(el => {
        const txt = (el.textContent || "").trim();
        return /第\\s*\\d+\\s*[章節页]/.test(txt);
      });

      const heading = viHeading || h1Heading || zhHeading;
      if (heading) {
        chapterTitle = heading.textContent.trim();
      } else {
        const viDocMatch = document.title.match(/(Chương\\s*\\d+[^\\-_|]*)/i) || document.title.match(/(Chapter\\s*\\d+[^\\-_|]*)/i);
        if (viDocMatch) {
          chapterTitle = viDocMatch[1].trim();
        } else {
          const zhDocMatch = document.title.match(/(第\\s*\\d+\\s*[章節页][^\\-_|]*)/);
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
      const hasWord = /[a-zA-Z0-9\\u4e00-\\u9fa5\\u00C0-\\u1EF9]/;

      const rawLines = (clone.textContent || "").split(new RegExp('[\\\\r\\\\n]+'));
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

      const contentHasVietnamese = paragraphs.some(p => /[a-zA-Z0-9\\u00C0-\\u1EF9]/.test(p) && !/[\\u4e00-\\u9fa5]/.test(p));
      const titleIsChinese = /[\\u4e00-\\u9fa5]/.test(chapterTitle);

      if (contentHasVietnamese && titleIsChinese) {
        const pureViCandidate = headingCandidates.find(el => {
          const txt = (el.textContent || "").trim();
          return txt.length > 2 && txt.length < 100 && !/[\\u4e00-\\u9fa5]/.test(txt) && (/Chương/i.test(txt) || /Chapter/i.test(txt) || el.tagName === 'H1' || el.classList.contains('title1'));
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
  `;
}
