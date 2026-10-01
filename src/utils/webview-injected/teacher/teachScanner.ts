// Teach mode element scanner and DOM heuristic analysis
export function getTeachScannerScript(): string {
  return `
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

      if (el.id && !/\\d{4,}/.test(el.id)) return '#' + el.id;

      if (el.className && typeof el.className === 'string') {
        const classes = el.className.trim().split(/\\s+/).filter(c => c && !c.includes(':') && !c.includes('/') && !/\\d{4,}/.test(c));
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

      if (el.parentElement && el.parentElement.id && !/\\d{4,}/.test(el.parentElement.id)) {
        return '#' + el.parentElement.id + ' > ' + el.tagName.toLowerCase();
      }

      const tag = el.tagName.toLowerCase();
      if (tag === 'article') return 'article';
      const firstCls = el.className && typeof el.className === 'string' ? el.className.trim().split(/\\s+/).find(c => c && !/\\d{4,}/.test(c)) : '';
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
        const m = rawHref.match(new RegExp('^(.*?)(\\\\d+)(\\\\.[a-zA-Z]+|/)?$'));
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
          const pClasses = parent.className.trim().split(/\\s+/).filter(c => c && !c.includes(':'));
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
        const classes = anchor.className.trim().split(/\\s+/).filter(c => c && !c.includes(':'));
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
  `;
}
