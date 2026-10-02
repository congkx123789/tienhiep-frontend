// Injected AdBlock and Dark Mode enforcement
export function getInjectedAdBlockDarkScript(): string {
  return `
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

            const isAd = /(magsrv|geniees|popads|propeller|adsterra|cpm|zoneid|guanggao|doubleclick|affiliate|track\\.|click\\.|ads\\.|bet\\b|casino\\b|18\\+)/i.test(href);
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
        const adTextPattern = /vantage|hoa hồng|hoa hong|tham gia ngay|đăng ký ngay|kiếm tiền|đối tác|affiliate|forex|crypto|trading|betting|nhà cái|casino|đặt cược|tài xỉu|nổ hũ|game bài|congratulations|bonus|get bonus|approved|lucky\\s*draw|trúng thưởng|nhận thưởng|vòng quay|nạp thẻ|tải app|download app|đăng ký nhận quà/i;
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
      const chineseRegex = /[\\u4e00-\\u9fa5]/;
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
  `;
}
