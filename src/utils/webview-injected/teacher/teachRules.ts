// Teach Mode rule generation and CSS selector utilities
export function getTeachRulesScript(): string {
  return `
    const generateContainerSelector = (el) => {
      if (!el || el === document.body || el === document.documentElement) return '';
      for (const std of CONTENT_SELECTORS) {
        try {
          if (el.matches && el.matches(std)) return std;
          const closest = el.closest ? el.closest(std) : null;
          if (closest && closest !== document.body && closest !== document.documentElement) return std;
        } catch(e) {}
      }

      if (el.id && !/\\d{4,}/.test(el.id)) return '#' + el.id;
      if (el.className && typeof el.className === 'string') {
        const classes = el.className.trim().split(/\\s+/).filter(c => c && !c.includes(':') && !c.includes('/') && !/\\d{4,}/.test(c));
        for (const cls of classes) {
          try { if (document.querySelectorAll('.' + cls).length === 1) return '.' + cls; } catch(e) {}
        }
        if (classes.length > 1) {
          try { if (document.querySelectorAll('.' + classes.slice(0, 2).join('.')).length === 1) return '.' + classes.slice(0, 2).join('.'); } catch(e) {}
        }
      }
      if (el.parentElement?.id && !/\\d{4,}/.test(el.parentElement.id)) return '#' + el.parentElement.id + ' > ' + el.tagName.toLowerCase();
      const tag = el.tagName.toLowerCase();
      if (tag === 'article') return 'article';
      const firstCls = el.className && typeof el.className === 'string' ? el.className.trim().split(/\\s+/).find(c => c && !/\\d{4,}/.test(c)) : '';
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
