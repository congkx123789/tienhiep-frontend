// Navigation trigger execution for Injected Script
export function getNavigatorTriggerScript(): string {
  return `
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
      const chapterNumRegex = /(\\d+)(?:_\\d+)?(?:\\.html?|\\/)?$/;

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
        const regex = /^\\s*(上一章|上一页|上一頁|上页|上頁|chương trước|trang trước|hồi trước|prev chapter|prev page|trước)\\s*$/i;
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
  `;
}
