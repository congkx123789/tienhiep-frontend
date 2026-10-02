// Navigation Rules manager for Injected Script
export function getNavigationRulesScript(): string {
  return `
    getNovelKeys: () => {
      const effUrl = window.__TienHiepHelpers.getEffectiveUrl();
      let host = effUrl.hostname || '';
      if ((!host || host === 'localhost' || host === '127.0.0.1') && window.__originalUrl) {
        try { host = new URL(window.__originalUrl).hostname || host; } catch(e) {}
      }
      const path = effUrl.pathname || '';
      const parts = path.split('/').filter(Boolean);
      let novelKey = host;

      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.') || /^\\d+$/.test(lastPart)) {
          novelKey = host + '/' + parts.slice(0, parts.length - 1).join('/');
        } else {
          novelKey = host + '/' + parts.join('/');
        }
      } else if (parts.length === 1) {
        const onlyPart = parts[0];
        if (!onlyPart.includes('.') && !/^\\d+$/.test(onlyPart)) {
          novelKey = host + '/' + onlyPart;
        }
      }
      return { host, novelKey, pathname: path, url: effUrl.href };
    },

    getSavedNextRules: () => {
      try {
        const allData = JSON.parse(localStorage.getItem('__tienhiep_novel_next_rules') || '{}');
        const { host, novelKey } = window.__TienHiepHelpers.getNovelKeys();
        let list = allData[novelKey] || allData[host] || [];
        if (!Array.isArray(list)) list = list ? [list] : [];
        return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      } catch (e) {
        return [];
      }
    },

    getSavedNextRule: () => {
      const list = window.__TienHiepHelpers.getSavedNextRules();
      return list.length > 0 ? list[0] : null;
    },

    saveNextRule: (ruleData) => {
      try {
        const allData = JSON.parse(localStorage.getItem('__tienhiep_novel_next_rules') || '{}');
        const { host, novelKey } = window.__TienHiepHelpers.getNovelKeys();
        let list = allData[novelKey] || allData[host] || [];
        if (!Array.isArray(list)) list = list ? [list] : [];

        const newRule = {
          id: ruleData.id || ('rule_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
          selector: (ruleData.selector || '').trim(),
          customUrl: (ruleData.customUrl || '').trim(),
          selectors: Array.isArray(ruleData.selectors) && ruleData.selectors.length > 0 ? ruleData.selectors : (ruleData.selector ? [ruleData.selector.trim()] : []),
          containerSelector: ruleData.containerSelector || '',
          childIndex: ruleData.childIndex,
          text: (ruleData.text || '').trim(),
          urlPattern: ruleData.urlPattern || null,
          pattern: ruleData.pattern || (ruleData.customUrl ? 'direct_url' : 'smart_teach'),
          title: ruleData.title || (ruleData.selector ? ('Selector: ' + ruleData.selector) : (ruleData.customUrl ? ('URL: ' + ruleData.customUrl) : 'Quy tắc tự học')),
          updatedAt: Date.now()
        };

        list = list.filter(r => {
          if (newRule.selector && r.selector && r.selector === newRule.selector) return false;
          if (newRule.customUrl && r.customUrl && r.customUrl === newRule.customUrl) return false;
          if (r.id === newRule.id) return false;
          return true;
        });

        list.unshift(newRule);
        if (list.length > 20) list = list.slice(0, 20);

        allData[novelKey] = list;
        allData[host] = list;
        localStorage.setItem('__tienhiep_novel_next_rules', JSON.stringify(allData));

        if (newRule.selector) localStorage.setItem('__tienhiep_custom_next_selector', newRule.selector);
        if (newRule.text) localStorage.setItem('__tienhiep_custom_next_text', newRule.text);
        return { success: true, rule: newRule, history: list };
      } catch (e) {
        return { success: false };
      }
    },

    selectNextRule: (ruleId) => {
      try {
        const allData = JSON.parse(localStorage.getItem('__tienhiep_novel_next_rules') || '{}');
        const { host, novelKey } = window.__TienHiepHelpers.getNovelKeys();
        let list = allData[novelKey] || allData[host] || [];
        if (!Array.isArray(list)) list = list ? [list] : [];

        const targetRule = list.find(r => r.id === ruleId);
        if (targetRule) {
          targetRule.updatedAt = Date.now();
          list = [targetRule, ...list.filter(r => r.id !== ruleId)];
          allData[novelKey] = list;
          allData[host] = list;
          localStorage.setItem('__tienhiep_novel_next_rules', JSON.stringify(allData));
          return { success: true, activeRule: targetRule, history: list };
        }
        return { success: false };
      } catch (e) {
        return { success: false };
      }
    },

    deleteNextRule: (ruleId = null) => {
      try {
        const allData = JSON.parse(localStorage.getItem('__tienhiep_novel_next_rules') || '{}');
        const { host, novelKey } = window.__TienHiepHelpers.getNovelKeys();
        let list = allData[novelKey] || allData[host] || [];
        if (!Array.isArray(list)) list = list ? [list] : [];

        if (ruleId) {
          list = list.filter(r => r.id !== ruleId);
          allData[novelKey] = list;
          allData[host] = list;
        } else {
          delete allData[novelKey];
          delete allData[host];
          list = [];
        }

        localStorage.setItem('__tienhiep_novel_next_rules', JSON.stringify(allData));
        if (list.length === 0) {
          localStorage.removeItem('__tienhiep_custom_next_selector');
          localStorage.removeItem('__tienhiep_custom_next_text');
        }
        return { success: true, history: list };
      } catch (e) {
        return { success: false };
      }
    },

    clearAllNextRules: () => {
      return window.__TienHiepHelpers.deleteNextRule(null);
    },
  `;
}
