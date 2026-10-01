// Teach mode highlighting loop and UI controllers
export function getTeachControlsScript(): string {
  return `
    let currentTarget = null;
    let currentScope = 'chunk';
    let currentChunkTarget = null;
    let currentContainerTarget = null;
    let isTargetParagraph = false;
    let rafLoopId = null;

    const updateHighlight = () => {
      if (!currentTarget) {
        highlightBox.style.setProperty("display", "none", "important");
        floatingBadge.style.setProperty("display", "none", "important");
        return;
      }
      const rect = currentTarget.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        highlightBox.style.setProperty("display", "block", "important");
        highlightBox.style.setProperty("left", rect.left + "px", "important");
        highlightBox.style.setProperty("top", rect.top + "px", "important");
        highlightBox.style.setProperty("width", rect.width + "px", "important");
        highlightBox.style.setProperty("height", rect.height + "px", "important");

        if (currentScope === 'container') {
          highlightBox.style.setProperty("outline", "3.5px solid #0ea5e9", "important");
          highlightBox.style.setProperty("background", "rgba(14,165,233,0.18)", "important");
          highlightBox.style.setProperty("box-shadow", "0 0 25px rgba(14,165,233,0.85), inset 0 0 18px rgba(14,165,233,0.22)", "important");
          floatingBadge.style.setProperty("border", "1.5px solid #0ea5e9", "important");
        } else {
          highlightBox.style.setProperty("outline", "2.5px solid #f59e0b", "important");
          highlightBox.style.setProperty("background", "rgba(245,158,11,0.2)", "important");
          highlightBox.style.setProperty("box-shadow", "0 0 18px rgba(245,158,11,0.7), inset 0 0 12px rgba(245,158,11,0.25)", "important");
          floatingBadge.style.setProperty("border", "1.5px solid #f59e0b", "important");
        }

        floatingBadge.style.setProperty("display", "flex", "important");
        const chRect = crosshair.getBoundingClientRect();
        let badgeTop = chRect.bottom + 12;
        if (badgeTop + 55 > window.innerHeight) badgeTop = Math.max(50, chRect.top - 58);
        let badgeLeft = Math.max(8, Math.min(window.innerWidth - 330, chRect.left + 34 - 150));
        floatingBadge.style.setProperty("top", badgeTop + "px", "important");
        floatingBadge.style.setProperty("left", badgeLeft + "px", "important");
      } else {
        highlightBox.style.setProperty("display", "none", "important");
        floatingBadge.style.setProperty("display", "none", "important");
      }
    };

    const startRafLoop = () => {
      if (rafLoopId) return;
      const loop = () => {
        updateHighlight();
        currentTarget ? (rafLoopId = requestAnimationFrame(loop)) : (rafLoopId = null);
      };
      rafLoopId = requestAnimationFrame(loop);
    };

    const stopRafLoop = () => {
      if (rafLoopId) { cancelAnimationFrame(rafLoopId); rafLoopId = null; }
    };

    const updateTargetUI = () => {
      if (!currentTarget) return;
      const getEl = (id) => document.getElementById(id);
      const isLinkOrBtn = !!currentTarget.closest('a, button, [role="button"], [id*="next"], [class*="next"]');
      const textSnippet = (currentTarget.textContent || "").trim().slice(0, 22);
      const tag = currentTarget.tagName.toLowerCase();

      const els = {
        infoText: getEl("__teach_info_text"), confirmBtn: getEl("__confirm_teach_next"), readBtn: getEl("__read_from_here"),
        scopeToggleBtn: getEl("__scope_toggle_btn"), saveContentBtn: getEl("__save_content_area"), backToChunkBtn: getEl("__back_to_chunk"),
        testNextBtn: getEl("__test_next_teach"), badgeTypeTag: getEl("__teach_badge_type_tag"), badgeName: getEl("__teach_badge_name"),
        badgeSub: getEl("__teach_badge_sub"), badgePrevBtn: getEl("__teach_badge_prev"), badgeNextBtn: getEl("__teach_badge_next"),
        badgeSaveBtn: getEl("__teach_badge_save"), badgeReadBtn: getEl("__teach_badge_read"), badgeScopeBtn: getEl("__teach_badge_scope")
      };

      const setDisplay = (el, show, style = "inline-flex") => { if (el) el.style.setProperty("display", show ? style : "none", "important"); };

      if (isLinkOrBtn) {
        const idStr = currentTarget.id ? ('#' + currentTarget.id) : '';
        const href = currentTarget.href || (currentTarget.querySelector ? (currentTarget.querySelector('a') || {}).href : '') || '';
        const hrefSnippet = href ? ' → ' + href.split('/').slice(-1)[0] : '';
        const displayName = textSnippet || (tag + idStr);

        if (els.badgeTypeTag) { els.badgeTypeTag.textContent = "NÚT CHUYỂN"; els.badgeTypeTag.style.background = "#10b981"; }
        if (els.infoText) els.infoText.innerHTML = '🎯 Đã nhắm nút: <b style="color:#fde047;">' + displayName + '</b>' + (hrefSnippet ? ' <span style="opacity:0.75;">' + hrefSnippet + '</span>' : '');
        [els.badgePrevBtn, els.badgeNextBtn, els.confirmBtn, els.badgeSaveBtn, els.testNextBtn].forEach(el => setDisplay(el, true));
        [els.readBtn, els.scopeToggleBtn, els.saveContentBtn, els.backToChunkBtn, els.badgeReadBtn, els.badgeScopeBtn].forEach(el => setDisplay(el, false));
        if (els.confirmBtn) els.confirmBtn.innerHTML = '✓ Lưu nút: ' + (textSnippet ? ('"' + textSnippet.slice(0, 10) + '"') : tag);
        if (els.badgeSaveBtn) { els.badgeSaveBtn.innerHTML = '✓ Lưu'; els.badgeSaveBtn.style.background = "#10b981"; }
        if (els.badgeName) els.badgeName.textContent = displayName;
        if (els.badgeSub) els.badgeSub.textContent = (tag + idStr) + hrefSnippet;
      } else if (currentScope === 'container') {
        const container = currentTarget;
        const pCount = container.querySelectorAll ? container.querySelectorAll('p, [data-tts-idx]').length : 0;
        const textLen = (container.innerText || "").trim().length;
        const sel = generateContainerSelector(container);

        if (els.badgeTypeTag) { els.badgeTypeTag.textContent = "📦 CẢ VÙNG ĐỌC"; els.badgeTypeTag.style.background = "#0ea5e9"; }
        if (els.badgeName) els.badgeName.textContent = sel || 'Vùng chứa truyện';
        if (els.badgeSub) els.badgeSub.textContent = (pCount > 0 ? ('Gồm ' + pCount + ' đoạn văn • ') : '') + textLen.toLocaleString('vi-VN') + ' ký tự';
        if (els.infoText) els.infoText.innerHTML = '🎯 <b>Vùng chứa cả chương:</b> <b style="color:#38bdf8;">' + (sel || 'Khối truyện') + '</b> (' + pCount + ' đoạn • ' + textLen.toLocaleString('vi-VN') + ' chữ)';

        [els.badgePrevBtn, els.badgeNextBtn, els.readBtn, els.confirmBtn, els.testNextBtn, els.scopeToggleBtn, els.badgeReadBtn].forEach(el => setDisplay(el, false));
        [els.saveContentBtn, els.backToChunkBtn, els.badgeScopeBtn, els.badgeSaveBtn].forEach(el => setDisplay(el, true));
        if (els.saveContentBtn) els.saveContentBtn.innerHTML = '✓ Lưu vùng này';
        if (els.backToChunkBtn) els.backToChunkBtn.innerHTML = '📄 1 Đoạn';
        if (els.badgeScopeBtn) { els.badgeScopeBtn.innerHTML = '📄 1 Đoạn'; els.badgeScopeBtn.style.background = "rgba(255,255,255,0.2)"; }
        if (els.badgeSaveBtn) { els.badgeSaveBtn.innerHTML = '✓ Lưu vùng này'; els.badgeSaveBtn.style.background = "#10b981"; }
      } else {
        let paraIdx = parseInt(currentTarget.getAttribute('data-tts-idx'));
        let totalParas = document.querySelectorAll('[data-tts-idx]').length;
        if (isNaN(paraIdx) || totalParas === 0) {
          const allP = Array.from(document.querySelectorAll('p'));
          paraIdx = allP.indexOf(currentTarget);
          totalParas = allP.length;
        }
        const stepDisplay = (paraIdx >= 0) ? ('Đoạn ' + (paraIdx + 1)) : 'Đoạn văn';
        const stepSub = (paraIdx >= 0 && totalParas > 0) ? ('Bước ' + (paraIdx + 1) + '/' + totalParas) : 'Đoạn đọc theo cây HTML';

        if (els.badgeTypeTag) { els.badgeTypeTag.textContent = stepDisplay.toUpperCase(); els.badgeTypeTag.style.background = "#8b5cf6"; }
        if (els.infoText) els.infoText.innerHTML = '🎯 <b>' + stepDisplay + ':</b> <span style="color:#c4b5fd;">\"' + textSnippet + '...\"</span>';
        [els.badgePrevBtn, els.badgeNextBtn, els.readBtn, els.scopeToggleBtn, els.badgeReadBtn, els.badgeScopeBtn].forEach(el => setDisplay(el, true));
        [els.confirmBtn, els.testNextBtn, els.saveContentBtn, els.backToChunkBtn, els.badgeSaveBtn].forEach(el => setDisplay(el, false));
        if (els.readBtn) els.readBtn.innerHTML = '📖 Đọc từ đây';
        if (els.scopeToggleBtn) els.scopeToggleBtn.innerHTML = '📦 Cả vùng';
        if (els.badgeReadBtn) els.badgeReadBtn.innerHTML = '📖 Đọc';
        if (els.badgeScopeBtn) { els.badgeScopeBtn.innerHTML = '📦 Cả vùng'; els.badgeScopeBtn.style.background = "linear-gradient(135deg,#0ea5e9,#0284c7)"; }
        if (els.badgeName) els.badgeName.textContent = textSnippet ? ('\"' + textSnippet + '...\"') : stepDisplay;
        if (els.badgeSub) els.badgeSub.textContent = stepSub + ' • Bấm "📦 Cả vùng" để ôm trọn cả bài';
      }
    };

    const applyTargetScope = (newScope) => {
      currentScope = newScope;
      if (currentScope === 'container') {
        const container = currentContainerTarget || (currentChunkTarget ? findContentContainer(currentChunkTarget) : null) || (currentTarget ? findContentContainer(currentTarget) : null);
        if (container) { currentTarget = container; currentContainerTarget = container; }
      } else {
        const chunk = currentChunkTarget || (currentTarget ? (currentTarget.tagName === 'P' ? currentTarget : currentTarget.querySelector('p')) : null);
        if (chunk) { currentTarget = chunk; currentChunkTarget = chunk; }
      }
      updateTargetUI();
      updateHighlight();
    };

    const handleTargetCandidate = (rawTarget, cx, cy) => {
      if (!rawTarget || (rawTarget.closest && rawTarget.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]'))) return;
      const target = refineToBestTarget(rawTarget, cx, cy);
      if (!target || target === document.body || target === document.documentElement) return;

      const isLinkOrBtn = !!target.closest('a, button, [role="button"], [id*="next"], [class*="next"]');
      isTargetParagraph = !isLinkOrBtn && (target.tagName === 'P' || target.hasAttribute('data-tts-idx') || (target.textContent || "").trim().length > 15);

      if (isTargetParagraph) {
        currentChunkTarget = target;
        currentContainerTarget = findContentContainer(target);
        currentTarget = (currentScope === 'container' && currentContainerTarget) ? currentContainerTarget : target;
      } else {
        currentTarget = target;
      }

      startRafLoop();
      updateTargetUI();
      updateHighlight();
    };

    const shiftTargetSibling = (dir) => {
      if (!currentTarget) return;
      if (isTargetParagraph) {
        const allParas = Array.from(document.querySelectorAll('[data-tts-idx], p')).filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && (el.textContent || '').trim().length > 5;
        });
        if (allParas.length > 1) {
          let currIdx = allParas.indexOf(currentTarget);
          if (currIdx === -1) currIdx = 0;
          let nextIdx = (currIdx + dir + allParas.length) % allParas.length;
          currentTarget = allParas[nextIdx];
          handleTargetCandidate(currentTarget);
          currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      const parent = currentTarget.parentElement;
      if (!parent) return;
      const siblings = Array.from(parent.querySelectorAll('a, button, [role="button"], p')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (siblings.length <= 1) return;
      const currIdx = siblings.indexOf(currentTarget);
      if (currIdx === -1) return;
      currentTarget = siblings[(currIdx + dir + siblings.length) % siblings.length];
      handleTargetCandidate(currentTarget);
    };

    const detectUnderCrosshair = (centerX, centerY) => {
      let elements = typeof document.elementsFromPoint === 'function' ? (document.elementsFromPoint(centerX, centerY) || []) : [];
      if (elements.length === 0) {
        crosshair.style.setProperty("display", "none", "important");
        const single = document.elementFromPoint(centerX, centerY);
        crosshair.style.setProperty("display", "flex", "important");
        if (single) elements = [single];
      }
      for (const el of elements) {
        if (!el || el === crosshair || crosshair.contains(el) || el === banner || banner.contains(el) || el === highlightBox || highlightBox.contains(el) || el === floatingBadge || floatingBadge.contains(el)) continue;
        handleTargetCandidate(el, centerX, centerY);
        break;
      }
    };
  `;
}
