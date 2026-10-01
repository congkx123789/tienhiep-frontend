// Injected Base: Anti-corruption locks & layout adaptations
export function getInjectedBaseScript(): string {
  return `
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
          const isChinese = /[\\u4e00-\\u9fa5]/.test(document.title) || /(69shu|biquge|uukanshu|faloo|fanqie|ptwxz|b520|qidian)/i.test(host);
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
  `;
}
