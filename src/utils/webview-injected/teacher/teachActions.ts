// Teach Mode action handlers: saving rules, persisting content boundaries, starting TTS
export function getTeachActionsScript(): string {
  return `
    const saveAndApplyRule = (target) => {
      if (!target) return;
      if (typeof isSpamOrAd === 'function' && isSpamOrAd(target)) {
        banner.style.background = "linear-gradient(135deg,#ef4444,#dc2626)";
        banner.innerHTML = "<span>⚠️ Đây là liên kết quảng cáo/rác! Hãy rê tâm ngắm vào nút Chương Sau.</span>";
        setTimeout(() => { banner.style.background = "linear-gradient(135deg,#0f172a,#1e1b4b)"; updateTargetUI(); }, 2000);
        return;
      }
      window.__TienHiepHelpers.saveNextRule(generateSmartRule(target));
      cleanup();
      banner.style.background = "linear-gradient(135deg,#10b981,#059669)";
      banner.innerHTML = "<span>✅ Đã lưu nút Chuyển Trang vào bộ nhớ theo tên miền! Tự chuyển trang...</span>";
      setTimeout(() => {
        banner.remove();
        if (!window.__TienHiepHelpers.triggerNavigation(target)) window.__TienHiepHelpers.checkAndTriggerAutoNext(true);
      }, 700);
    };

    const saveContentAreaRule = (target) => {
      if (!target) return;
      const state = window.__TienHiepTeachState;
      const collected = (state && state.getCollectedRegions) ? state.getCollectedRegions() : [];
      const currentH = (state && state.getHierarchy) ? state.getHierarchy() : null;

      let host = window.__TienHiepHelpers.getEffectiveUrl().hostname || window.location.hostname || '';
      if ((!host || host === 'localhost' || host === '127.0.0.1') && window.__originalUrl) {
        try { host = new URL(window.__originalUrl).hostname || host; } catch(e) {}
      }

      let regions = [...collected];
      if (currentH && !regions.some(r => r.lcaSelector === currentH.lcaSelector && r.chunkTag === currentH.chunkTag)) {
        regions.push({
          lcaSelector: currentH.lcaSelector,
          chunkTag: currentH.chunkTag,
          relativeDepth: currentH.relativeDepth,
          count: currentH.count
        });
      }

      if (regions.length === 0) {
        const container = (currentScope === 'container' && target) ? target : findContentContainer(target);
        if (container) {
          const selector = generateContainerSelector(container);
          regions.push({ lcaSelector: selector, chunkTag: 'P', relativeDepth: 1, count: container.querySelectorAll('p').length });
        }
      }
      if (regions.length === 0) return;

      const mainSelector = regions[0].lcaSelector;
      const totalParas = regions.reduce((sum, r) => sum + (r.count || 0), 0);
      const smartRule = {
        domain: host,
        updatedAt: Date.now(),
        regions: regions,
        selector: mainSelector,
        excludeSelectors: ['.ad', '.advertisement', 'nav', 'header', 'footer', '[id*="ad"]', 'table.nav']
      };

      if (host) {
        try {
          localStorage.setItem('__tienhiep_smart_content_rule_' + host, JSON.stringify(smartRule));
          localStorage.setItem('__tienhiep_content_selector_' + host, mainSelector);
        } catch(e) {}
      }

      Object.assign(highlightBox.style, { outline: "4px solid #10b981", background: "rgba(16,185,129,0.25)", boxShadow: "0 0 35px rgba(16,185,129,0.95)" });
      if (window.__TienHiepHelpers?.indexParagraphsForTTS) window.__TienHiepHelpers.indexParagraphsForTTS();
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'SMART_CONTENT_RULE_SAVED', rule: smartRule, selector: mainSelector, host }, '*');
      }
      banner.style.background = "linear-gradient(135deg,#059669,#10b981)";
      banner.innerHTML = "<span>✅ Đã lưu vùng đọc thông minh: <b>" + totalParas + " đoạn văn</b> (" + regions.length + " vùng) cho " + host + "!</span>";
      setTimeout(() => { cleanup(); banner.remove(); }, 1200);
    };

    const readFromTargetParagraph = (target) => {
      if (!target) return;
      let paraIdx = parseInt(target.getAttribute('data-tts-idx'));
      if (isNaN(paraIdx)) {
        const allParas = Array.from(document.querySelectorAll('[data-tts-idx]'));
        paraIdx = allParas.indexOf(target);
        if (paraIdx === -1) paraIdx = Array.from(document.querySelectorAll('p')).indexOf(target);
      }
      if (paraIdx < 0) paraIdx = 0;

      if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.highlightActiveParagraph === 'function') {
        window.__TienHiepHelpers.highlightActiveParagraph(paraIdx);
      }
      const sentenceSnippet = (target.textContent || '').trim().slice(0, 80);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'START_TTS_FROM_PARAGRAPH', paraIdx, sentenceText: sentenceSnippet }, '*');
      }

      cleanup();
      banner.style.background = "linear-gradient(135deg,#8b5cf6,#6d28d9)";
      banner.innerHTML = "<span>📖 Bắt đầu đọc từ bước " + (paraIdx + 1) + "...</span>";
      setTimeout(() => { banner.remove(); }, 800);
    };
  `;
}
