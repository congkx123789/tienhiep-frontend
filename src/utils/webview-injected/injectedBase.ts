// Injected Base: Raw passthrough with link routing to App tabs and page blanking protection
export function getInjectedBaseScript(): string {
  return `
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
        window.open = function(url) {
          if (!url) return null;
          try {
            const full = new URL(url, window.location.href).href;
            if (/^https?:\\/\\//i.test(full) && window.parent && window.parent !== window) {
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
            if (/^https?:\\/\\//i.test(full) && window.parent && window.parent !== window) {
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
  `;
}
