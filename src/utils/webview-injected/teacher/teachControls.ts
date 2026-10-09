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
        const badgeW = floatingBadge.offsetWidth || 280;
        let badgeTop = chRect.bottom + 10;
        if (badgeTop + 55 > window.innerHeight) {
          badgeTop = Math.max(50, chRect.top - 55);
        }
        let badgeLeft;
        if (window.innerWidth < 480) {
          badgeLeft = Math.max(6, Math.round((window.innerWidth - Math.min(window.innerWidth - 12, badgeW)) / 2));
        } else {
          badgeLeft = Math.max(8, Math.min(window.innerWidth - badgeW - 8, chRect.left + 34 - Math.round(badgeW / 2)));
        }
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

    let collectedRegions = [];
    let currentHierarchy = null;

    window.__TienHiepTeachState = {
      getHierarchy: () => currentHierarchy,
      getCollectedRegions: () => collectedRegions,
      addCurrentRegion: () => {
        if (!currentHierarchy) return false;
        const reg = {
          lcaSelector: currentHierarchy.lcaSelector,
          chunkTag: currentHierarchy.chunkTag,
          relativeDepth: currentHierarchy.relativeDepth,
          count: currentHierarchy.count
        };
        const exists = collectedRegions.some(r => r.lcaSelector === reg.lcaSelector && r.chunkTag === reg.chunkTag);
        if (!exists) collectedRegions.push(reg);
        return true;
      },
      clearRegions: () => { collectedRegions = []; }
    };

    const ascendOneLevel = () => {
      if (!currentTarget) return;
      if (currentScope === 'sentence') {
        const pEl = currentTarget.closest ? currentTarget.closest('p, [data-tts-idx], .tienhiep-tts-paragraph') : currentChunkTarget;
        if (pEl) {
          currentScope = 'chunk';
          currentTarget = pEl;
          currentChunkTarget = pEl;
          handleTargetCandidate(pEl);
          return;
        }
      }
      if (currentScope === 'chunk') {
        applyTargetScope('container');
      }
    };

    const updateTargetUI = () => {
      if (!currentTarget) return;
      const getEl = (id) => document.getElementById(id);
      const isLinkOrBtn = !!currentTarget.closest('a, button, [role="button"], [id*="next"], [class*="next"]');
      const isSentence = currentTarget.classList?.contains('tts-sentence') || !!currentTarget.closest('.tts-sentence');
      const textSnippet = (currentTarget.textContent || "").trim().slice(0, 22);
      const tag = currentTarget.tagName.toLowerCase();

      const els = {
        infoText: getEl("__teach_info_text"),
        badgeTypeTag: getEl("__teach_badge_type_tag"), badgeName: getEl("__teach_badge_name"), badgeSub: getEl("__teach_badge_sub"),
        badgePrevBtn: getEl("__teach_badge_prev"), badgeNextBtn: getEl("__teach_badge_next"),
        badgeReadBtn: getEl("__teach_badge_read"), badgeScopeBtn: getEl("__teach_badge_scope"),
        badgeDescendBtn: getEl("__teach_badge_descend"), badgeAscendBtn: getEl("__teach_badge_ascend"),
        badgeAddRegionBtn: getEl("__teach_badge_add_region"), badgeSaveBtn: getEl("__teach_badge_save")
      };

      const setDisplay = (el, show, style = "inline-flex") => { if (el) el.style.setProperty("display", show ? style : "none", "important"); };

      if (isLinkOrBtn) {
        const idStr = currentTarget.id ? ('#' + currentTarget.id) : '';
        const href = currentTarget.href || (currentTarget.querySelector ? (currentTarget.querySelector('a') || {}).href : '') || '';
        const hrefSnippet = href ? ' → ' + href.split('/').slice(-1)[0] : '';
        const displayName = textSnippet || (tag + idStr);

        if (els.badgeTypeTag) { els.badgeTypeTag.textContent = "NÚT CHUYỂN"; els.badgeTypeTag.style.background = "#10b981"; }
        if (els.badgeName) els.badgeName.textContent = displayName;
        if (els.badgeSub) els.badgeSub.textContent = (tag + idStr) + hrefSnippet;
        if (els.infoText) els.infoText.innerHTML = '🎯 <b>Nút chuyển:</b> <span style="color:#fde047;">' + displayName + '</span>';

        [els.badgePrevBtn, els.badgeNextBtn, els.badgeSaveBtn].forEach(el => setDisplay(el, true));
        [els.badgeReadBtn, els.badgeScopeBtn, els.badgeDescendBtn, els.badgeAscendBtn, els.badgeAddRegionBtn].forEach(el => setDisplay(el, false));
        if (els.badgeSaveBtn) { els.badgeSaveBtn.innerHTML = '✓ Lưu nút'; els.badgeSaveBtn.style.background = "#10b981"; }
      } else if (currentScope === 'container') {
        const container = currentTarget;
        const pCount = container.querySelectorAll ? container.querySelectorAll('p, [data-tts-idx]').length : 0;
        const textLen = (container.innerText || "").trim().length;
        const sel = generateContainerSelector(container);

        if (els.badgeTypeTag) { els.badgeTypeTag.textContent = "📦 CẢ VÙNG ĐỌC"; els.badgeTypeTag.style.background = "#0ea5e9"; }
        if (els.badgeName) els.badgeName.textContent = sel || 'Vùng chứa truyện';
        if (els.badgeSub) els.badgeSub.textContent = (pCount > 0 ? ('Gồm ' + pCount + ' đoạn • ') : '') + textLen.toLocaleString('vi-VN') + ' ký tự';
        if (els.infoText) els.infoText.innerHTML = '🎯 <b>Cả vùng:</b> ' + (sel || 'Khối truyện') + ' (' + pCount + ' đoạn)';

        [els.badgePrevBtn, els.badgeNextBtn, els.badgeReadBtn, els.badgeDescendBtn, els.badgeAscendBtn, els.badgeAddRegionBtn].forEach(el => setDisplay(el, false));
        [els.badgeScopeBtn, els.badgeSaveBtn].forEach(el => setDisplay(el, true));
        if (els.badgeScopeBtn) { els.badgeScopeBtn.innerHTML = '📄 1 Đoạn'; els.badgeScopeBtn.style.background = "rgba(255,255,255,0.2)"; }
        if (els.badgeSaveBtn) { els.badgeSaveBtn.innerHTML = '✓ Lưu vùng'; els.badgeSaveBtn.style.background = "#10b981"; }
      } else if (isSentence || currentScope === 'sentence') {
        if (els.badgeTypeTag) { els.badgeTypeTag.textContent = "CÂU CON"; els.badgeTypeTag.style.background = "#ec4899"; }
        if (els.badgeName) els.badgeName.textContent = textSnippet ? ('"' + textSnippet + '..."') : 'Câu văn';
        if (els.badgeSub) els.badgeSub.textContent = 'Mức độ câu con cụ thể';
        if (els.infoText) els.infoText.innerHTML = '🎯 <b>Câu:</b> <span style="color:#f472b6;">' + textSnippet + '</span>';

        [els.badgePrevBtn, els.badgeNextBtn, els.badgeDescendBtn, els.badgeScopeBtn, els.badgeAddRegionBtn].forEach(el => setDisplay(el, false));
        [els.badgeReadBtn, els.badgeAscendBtn, els.badgeSaveBtn].forEach(el => setDisplay(el, true));
        if (els.badgeReadBtn) els.badgeReadBtn.innerHTML = '📖 Đọc câu';
        if (els.badgeSaveBtn) { els.badgeSaveBtn.innerHTML = '✓ Lưu'; els.badgeSaveBtn.style.background = "#10b981"; }
      } else {
        currentHierarchy = analyzeChunkHierarchy(currentTarget);
        const relDepth = currentHierarchy ? currentHierarchy.relativeDepth : 1;
        const matchedCount = currentHierarchy ? currentHierarchy.count : 1;
        const lcaSel = currentHierarchy ? currentHierarchy.lcaSelector : '';

        if (els.badgeTypeTag) { els.badgeTypeTag.textContent = "ĐOẠN VĂN"; els.badgeTypeTag.style.background = "#8b5cf6"; }
        if (els.badgeName) els.badgeName.textContent = matchedCount + " đoạn (" + (currentHierarchy ? currentHierarchy.chunkTag : tag) + ")";
        if (els.badgeSub) els.badgeSub.textContent = (lcaSel ? (lcaSel + " • ") : '') + "Bậc " + relDepth + (collectedRegions.length > 0 ? (" • Đã chọn " + collectedRegions.length) : "");
        if (els.infoText) els.infoText.innerHTML = '🎯 <b>Đoạn <p>:</b> ' + matchedCount + ' đoạn' + (collectedRegions.length > 0 ? (' (Gộp ' + collectedRegions.length + ' vùng)') : '');

        const hasSentences = !!(currentTarget && currentTarget.querySelector && currentTarget.querySelector('.tts-sentence'));
        [els.badgeReadBtn, els.badgeScopeBtn, els.badgeSaveBtn, els.badgeAddRegionBtn].forEach(el => setDisplay(el, true));
        [els.badgePrevBtn, els.badgeNextBtn, els.badgeAscendBtn].forEach(el => setDisplay(el, false));
        setDisplay(els.badgeDescendBtn, hasSentences);

        if (els.badgeReadBtn) els.badgeReadBtn.innerHTML = '📖 Đọc';
        if (els.badgeScopeBtn) { els.badgeScopeBtn.innerHTML = '📦 Cả vùng'; els.badgeScopeBtn.style.background = "linear-gradient(135deg,#0ea5e9,#0284c7)"; }
        if (els.badgeAddRegionBtn) els.badgeAddRegionBtn.innerHTML = '➕ Thêm' + (collectedRegions.length > 0 ? (' (' + collectedRegions.length + ')') : '');
        if (els.badgeSaveBtn) { els.badgeSaveBtn.innerHTML = '✓ Lưu'; els.badgeSaveBtn.style.background = "#10b981"; }
      }
    };

    const applyTargetScope = (newScope) => {
      currentScope = newScope;
      if (currentScope === 'container') {
        const container = (currentHierarchy && currentHierarchy.lca) || currentContainerTarget || (currentChunkTarget ? findContentContainer(currentChunkTarget) : null) || (currentTarget ? findContentContainer(currentTarget) : null);
        if (container) { currentTarget = container; currentContainerTarget = container; }
      } else {
        const chunk = currentChunkTarget || (currentTarget ? (currentTarget.tagName === 'P' ? currentTarget : currentTarget.querySelector('p')) : null);
        if (chunk) { currentTarget = chunk; currentChunkTarget = chunk; }
      }
      updateTargetUI();
      updateHighlight();
    };

    const handleTargetCandidate = (rawTarget, cx, cy) => {
      if (!rawTarget || isTeachUI(rawTarget)) return false;
      const target = refineToBestTarget(rawTarget, cx, cy);
      if (!target || target === document.body || target === document.documentElement) return false;

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
      return true;
    };

    const shiftTargetSibling = (dir) => {
      if (!currentTarget) return;
      const tag = currentTarget.tagName.toLowerCase();
      const parent = currentTarget.parentElement || document.body;
      const lca = (currentHierarchy && currentHierarchy.lca) || findContentContainer(currentTarget) || parent;

      if (isTargetParagraph) {
        let similar = [];
        if (currentTarget.hasAttribute('data-tts-idx')) {
          similar = Array.from(document.querySelectorAll('[data-tts-idx]'));
        }
        if (similar.length <= 1) {
          const sel = currentTarget.className ? (tag + '.' + Array.from(currentTarget.classList).slice(0, 2).join('.')) : tag;
          try { similar = Array.from(lca.querySelectorAll(sel)).filter(el => (el.textContent || '').trim().length > 6); } catch(e) {}
        }
        if (similar.length <= 1) {
          similar = Array.from(lca.querySelectorAll('p, div, li, span, section')).filter(el => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && (el.textContent || '').trim().length > 8 && !el.closest('nav, header, footer, [id*="ad"]');
          });
        }
        if (similar.length > 1) {
          let currIdx = similar.indexOf(currentTarget);
          if (currIdx === -1) currIdx = 0;
          let nextIdx = (currIdx + dir + similar.length) % similar.length;
          currentTarget = similar[nextIdx];
          handleTargetCandidate(currentTarget);
          currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      const siblings = Array.from(parent.querySelectorAll('a, button, [role="button"], p, div')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (siblings.length <= 1) return;
      const currIdx = siblings.indexOf(currentTarget);
      if (currIdx === -1) return;
      currentTarget = siblings[(currIdx + dir + siblings.length) % siblings.length];
      handleTargetCandidate(currentTarget);
    };

    const descendOneLevel = () => {
      if (!currentTarget) return;
      const sent = currentTarget.querySelector ? currentTarget.querySelector('.tts-sentence') : null;
      if (sent) {
        currentChunkTarget = currentTarget.closest ? currentTarget.closest('p, [data-tts-idx], .tienhiep-tts-paragraph') : currentChunkTarget;
        currentScope = 'sentence';
        currentTarget = sent;
        handleTargetCandidate(currentTarget);
        return;
      }
      const kids = Array.from(currentTarget.children).filter(ch => (ch.textContent || '').trim().length > 4);
      if (kids.length > 0) {
        currentTarget = kids[0];
        handleTargetCandidate(currentTarget);
        currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
        if (!el || isTeachUI(el)) continue;
        if (handleTargetCandidate(el, centerX, centerY)) break;
      }
    };
  `;
}
