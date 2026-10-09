// Target finding logic for Chapter Navigation
export function getNextTargetScript(): string {
  return `
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

          const pathTrimmed = resolved.pathname.replace(/[\\/]+$/, '');
          const currentPathTrimmed = currentPath.replace(/[\\/]+$/, '');
          const isParentBookDir = currentPathTrimmed.startsWith(pathTrimmed) && currentPathTrimmed.length > pathTrimmed.length;
          const isBookInfoPage = /[\\/]book[\\/]\\d+(\\.[a-zA-Z]+)?$/i.test(resolved.pathname);

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

      const chapterNumRegex = new RegExp('(\\\\d+)(?:\\\\.[a-zA-Z]+|/)?(?:\\\\?.*)?$');

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
      const regexExact = /^\\s*(下一章|下一页|下一頁|下页|下頁|chương sau|tiếp theo|hồi sau|trang sau|next chapter|next page|sau)\\s*$/i;
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
  `;
}
