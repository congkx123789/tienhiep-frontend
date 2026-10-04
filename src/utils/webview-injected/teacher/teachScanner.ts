// Teach mode element scanner and DOM heuristic analysis
export function getTeachScannerScript(): string {
  return `
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
  `;
}
