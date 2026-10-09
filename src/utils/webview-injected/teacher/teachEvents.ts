// Teach mode user interactions, dragging, touches and action handlers
export function getTeachEventsScript(): string {
  return `
    let isDraggingCrosshair = false;
    let isTouchDrag = false;
    let dragOffset = { x: 34, y: 34 };

    // Di chuyển crosshair khi drag - tính tâm crosshair sau offset
    const onDragMove = (clientX, clientY) => {
      if (!isDraggingCrosshair) return;
      // Khi touch-drag: nâng crosshair lên 60px để ngón cái không che khuất tâm ngắm
      const effectiveY = isTouchDrag ? (clientY - 60) : clientY;
      const newLeft = Math.max(0, Math.min(window.innerWidth - 68, clientX - dragOffset.x));
      const newTop = Math.max(45, Math.min(window.innerHeight - 68, effectiveY - dragOffset.y));
      crosshair.style.setProperty("left", newLeft + "px", "important");
      crosshair.style.setProperty("top", newTop + "px", "important");
      detectUnderCrosshair(newLeft + 34, newTop + 34);
    };

    const startDrag = (clientX, clientY, fromTouch = false) => {
      isDraggingCrosshair = true;
      isTouchDrag = fromTouch;
      crosshair.style.cursor = 'grabbing';
      const rect = crosshair.getBoundingClientRect();
      dragOffset.x = clientX - rect.left;
      dragOffset.y = clientY - rect.top;
    };

    const endDrag = () => {
      if (isDraggingCrosshair) {
        isDraggingCrosshair = false;
        isTouchDrag = false;
        crosshair.style.cursor = 'grab';
      }
    };

    crosshair.addEventListener("pointerdown", (e) => {
      e.preventDefault(); e.stopPropagation(); startDrag(e.clientX, e.clientY, e.pointerType === 'touch');
      try { crosshair.setPointerCapture(e.pointerId); } catch(err) {}
    });
    const onGlobalPointerMove = (e) => {
      if (isDraggingCrosshair) { e.preventDefault(); e.stopPropagation(); onDragMove(e.clientX, e.clientY); }
    };
    window.addEventListener("pointermove", onGlobalPointerMove, { passive: false, capture: true });
    const onPointerEnd = (e) => {
      if (isDraggingCrosshair) { endDrag(); try { crosshair.releasePointerCapture(e.pointerId); } catch(err) {} }
    };
    window.addEventListener("pointerup", onPointerEnd, { capture: true });
    window.addEventListener("pointercancel", onPointerEnd, { capture: true });

    crosshair.addEventListener("touchstart", (e) => {
      if (e.touches?.[0]) { e.preventDefault(); e.stopPropagation(); startDrag(e.touches[0].clientX, e.touches[0].clientY, true); }
    }, { passive: false });
    const onTouchMove = (e) => {
      if (isDraggingCrosshair && e.touches?.[0]) { e.preventDefault(); e.stopPropagation(); onDragMove(e.touches[0].clientX, e.touches[0].clientY); }
    };
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", endDrag, { passive: true, capture: true });
    window.addEventListener("touchcancel", endDrag, { passive: true, capture: true });

    crosshair.addEventListener("mousedown", (e) => {
      if (e.button === 0) { e.preventDefault(); e.stopPropagation(); startDrag(e.clientX, e.clientY); }
    });
    const onMouseMove = (e) => { if (isDraggingCrosshair) onDragMove(e.clientX, e.clientY); };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", endDrag);

    // Khi mở Chế độ Chỉ định: chỉ phát hiện phần tử ngay dưới tâm ngắm ở giữa màn hình
    setTimeout(() => {
      const chRect = crosshair.getBoundingClientRect();
      detectUnderCrosshair(chRect.left + 34, chRect.top + 34);
    }, 150);

    let tapStartX = 0, tapStartY = 0, tapStartTime = 0;
    const onDocTouchStart = (e) => {
      if (!window.__isTeachingNext || !e.touches?.[0] || isTeachUI(e.target)) return;
      tapStartTime = Date.now();
      tapStartX = e.touches[0].clientX;
      tapStartY = e.touches[0].clientY;
    };

    let lastDirectTapTime = 0;
    const onDirectTap = (e) => {
      if (!window.__isTeachingNext || isTeachUI(e.target)) return;
      const now = Date.now();
      if (now - lastDirectTapTime < 320) {
        try { e.preventDefault(); e.stopPropagation(); } catch(err) {}
        return;
      }
      lastDirectTapTime = now;
      try { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); } catch(err) {}

      let clientX = e.clientX, clientY = e.clientY;
      if ((clientX === undefined || clientY === undefined) && e.changedTouches?.[0]) {
        clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY;
      }

      let target = refineToBestTarget(e.target, clientX, clientY);
      if (!target && clientX !== undefined && clientY !== undefined) {
        const els = document.elementsFromPoint ? document.elementsFromPoint(clientX, clientY) : [document.elementFromPoint(clientX, clientY)];
        for (const el of els) {
          if (el && !isTeachUI(el)) {
            target = refineToBestTarget(el, clientX, clientY);
            if (target) break;
          }
        }
      }

      // Khi tap vào trang: chỉ cập nhật target/highlight, crosshair KHÔNG nhảy vị trí
      if (target && target !== document.body && target !== document.documentElement) {
        const rect = target.getBoundingClientRect();
        handleTargetCandidate(target, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    };

    const onDocTouchEnd = (e) => {
      if (!window.__isTeachingNext || isTeachUI(e.target)) return;
      const touch = e.changedTouches?.[0];
      if (touch && (Date.now() - tapStartTime < 450) && Math.hypot(touch.clientX - tapStartX, touch.clientY - tapStartY) < 20) {
        onDirectTap(e);
      }
    };

    window.addEventListener("touchstart", onDocTouchStart, { passive: true, capture: true });
    window.addEventListener("touchend", onDocTouchEnd, { passive: false, capture: true });
    window.addEventListener("click", onDirectTap, { passive: false, capture: true });

    const cleanup = () => {
      window.__isTeachingNext = false; currentTarget = null; currentChunkTarget = null; currentContainerTarget = null; currentScope = 'chunk';
      stopRafLoop();
      ["touchstart", "touchend", "click"].forEach(ev => window.removeEventListener(ev, ev === "touchstart" ? onDocTouchStart : (ev === "touchend" ? onDocTouchEnd : onDirectTap), true));
      ["touchmove", "touchend", "touchcancel"].forEach(ev => window.removeEventListener(ev, ev === "touchmove" ? onTouchMove : endDrag, true));
      window.removeEventListener("pointermove", onGlobalPointerMove, true);
      window.removeEventListener("pointerup", onPointerEnd, true);
      window.removeEventListener("pointercancel", onPointerEnd, true);
      document.removeEventListener("mousemove", onMouseMove); document.removeEventListener("mouseup", endDrag);
      [highlightBox, floatingBadge, crosshair].forEach(el => el && el.remove());
    };

    if (window.__TienHiepHelpers) {
      window.__TienHiepHelpers.stopTeachNextMode = () => { cleanup(); if (banner) banner.remove(); };
    }

    bindInstantAction(document.getElementById("__cancel_teach_next"), () => { cleanup(); banner.remove(); });
    bindInstantAction(document.getElementById("__reset_teach_next"), () => {
      window.__TienHiepHelpers.deleteNextRule();
      let host = window.__TienHiepHelpers.getEffectiveUrl().hostname || window.location.hostname || '';
      if ((!host || host === 'localhost' || host === '127.0.0.1') && window.__originalUrl) {
        try { host = new URL(window.__originalUrl).hostname || host; } catch(e) {}
      }
      if (host) { try { localStorage.removeItem('__tienhiep_content_selector_' + host); localStorage.removeItem('__tienhiep_smart_content_rule_' + host); } catch(e) {} }
      if (window.__TienHiepTeachState) window.__TienHiepTeachState.clearRegions();
      cleanup(); banner.style.background = "linear-gradient(135deg,#3b82f6,#2563eb)"; banner.innerHTML = "<span>🔄 Đã khôi phục mặc định!</span>";
      setTimeout(() => { banner.remove(); }, 900);
    });

    const onAddRegionClick = () => {
      const state = window.__TienHiepTeachState;
      if (state && state.addCurrentRegion()) {
        const list = state.getCollectedRegions();
        banner.style.background = "linear-gradient(135deg,#6366f1,#4f46e5)";
        banner.innerHTML = "<span>➕ Đã gộp vùng " + list.length + "! Tiếp tục rê tâm ngắm hoặc bấm Lưu</span>";
        updateTargetUI();
        setTimeout(() => { banner.style.background = "linear-gradient(135deg,#0f172a,#1e1b4b)"; updateTargetUI(); }, 1400);
      }
    };

    [
      ["__add_region_btn", onAddRegionClick],
      ["__teach_badge_add_region", onAddRegionClick],
      ["__descend_level_btn", () => descendOneLevel()],
      ["__teach_badge_descend", () => descendOneLevel()],
      ["__teach_badge_ascend", () => ascendOneLevel()],
      ["__confirm_teach_next", () => currentTarget && saveAndApplyRule(currentTarget)],
      ["__read_from_here", () => currentTarget && readFromTargetParagraph(currentTarget)],
      ["__scope_toggle_btn", () => applyTargetScope('container')],
      ["__save_content_area", () => currentTarget && saveContentAreaRule(currentTarget)],
      ["__back_to_chunk", () => applyTargetScope('chunk')],
      ["__test_next_teach", () => { if (currentTarget) { cleanup(); banner.remove(); window.__TienHiepHelpers.triggerNavigation(currentTarget); } }],
      ["__teach_badge_save", () => (currentScope === 'container' || isTargetParagraph) ? saveContentAreaRule(currentTarget) : (currentTarget && saveAndApplyRule(currentTarget))],
      ["__teach_badge_read", () => currentTarget && readFromTargetParagraph(currentTarget)],
      ["__teach_badge_scope", () => applyTargetScope(currentScope === 'chunk' ? 'container' : 'chunk')],
      ["__teach_badge_prev", () => shiftTargetSibling(-1)],
      ["__teach_badge_next", () => shiftTargetSibling(1)]
    ].forEach(([id, handler]) => bindInstantAction(document.getElementById(id), handler));

    bindInstantAction(crosshair, () => {
      if (isDraggingCrosshair) return;
      if (currentTarget) {
        if (currentScope === 'container' || isTargetParagraph) saveContentAreaRule(currentTarget);
        else saveAndApplyRule(currentTarget);
      }
    });
  `;
}
