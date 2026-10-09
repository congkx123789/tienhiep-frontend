// Injected Base: Raw passthrough with link routing to App tabs and page blanking protection
export function getInjectedBaseScript(): string {
  return `
    (function() {
      // Chống kiểm tra Bot: Ẩn cờ webdriver và bổ sung thông số tương thích Safari Native
      try {
        if ('webdriver' in navigator) {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true
          });
        }
      } catch(e) {}

      // Vô hiệu hóa script chinese.js / tw_cn.js làm hỏng bảng mã UTF-8 thành rác mojibake
      try {
        window.zh_tran = function() {};
        window.zh_init = function() {};
        String.prototype.tran = function() { return this; };
      } catch(e) {}

      // Giả lập click bằng PointerEvent chuẩn người thật (isTrusted / native simulation)
      window.__tienhiep_human_click = function(el) {
        if (!el) return;
        try {
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2 + (Math.random() * 4 - 2);
          const cy = rect.top + rect.height / 2 + (Math.random() * 4 - 2);
          const downEvt = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerType: 'touch' });
          const upEvt = new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerType: 'touch' });
          const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window });
          el.dispatchEvent(downEvt);
          el.dispatchEvent(upEvt);
          el.dispatchEvent(clickEvt);
        } catch (_) {
          el.click();
        }
      };

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
          const parsed = u.pathname.match(new RegExp('/book/(\\\\d+)/(\\\\d+)[_]*(\\\\d*)\\\\.html'));
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
        const getEffectiveBase = () => {
          return (window.__originalUrl && window.__originalUrl.startsWith('http')) ? window.__originalUrl : window.location.href;
        };

        window.open = function(url) {
          if (!url) return null;
          try {
            const full = new URL(url, getEffectiveBase()).href;
            if (/^https?:\\/\\//i.test(full) && window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'NAVIGATE_REQ', tabId: window.__TIENHIEP_TAB_ID__, url: full, newTab: true }, '*');
              return null;
            }
          } catch(e) {}
          window.location.href = url;
          return null;
        };

        document.addEventListener('click', function(e) {
          if (window.__isTeachingNext) return;
          const a = e.target && e.target.closest ? e.target.closest('a') : null;
          if (!a) return;
          if (a.closest && a.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"]')) return;
          const href = a.getAttribute('href');
          if (!href || /^(javascript:|#|mailto:|tel:|data:)/i.test(href.trim())) return;
          const isBlank = a.target === '_blank' || a.getAttribute('target') === '_blank';
          try {
            const full = new URL(href, getEffectiveBase()).href;
            if (/^https?:\\/\\//i.test(full) && window.parent && window.parent !== window) {
              e.preventDefault();
              e.stopPropagation();
              if (isBlank) {
                window.parent.postMessage({ type: 'NAVIGATE_REQ', tabId: window.__TIENHIEP_TAB_ID__, url: full, newTab: true }, '*');
              } else if (!href.startsWith('#')) {
                // Định tuyến qua parent để đồng bộ URL bar, Chrome history stack và nút Back/Forward
                window.parent.postMessage({ type: 'NAVIGATE_REQ', tabId: window.__TIENHIEP_TAB_ID__, url: full, newTab: false }, '*');
              }
            }
          } catch(err) {}
        }, true);
      } catch(e) {}
    })();
  `;
}
