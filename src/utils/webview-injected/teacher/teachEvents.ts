// Teach mode user interactions, dragging, touches and action handlers
export function getTeachEventsScript(): string {
  return `
    let isDraggingCrosshair = false;
    let dragOffset = { x: 34, y: 34 };

    const onDragMove = (clientX, clientY) => {
      if (!isDraggingCrosshair) return;
      const newLeft = Math.max(0, Math.min(window.innerWidth - 68, clientX - dragOffset.x));
      const newTop = Math.max(45, Math.min(window.innerHeight - 68, clientY - dragOffset.y));
      crosshair.style.setProperty("left", newLeft + "px", "important");
      crosshair.style.setProperty("top", newTop + "px", "important");
      detectUnderCrosshair(newLeft + 34, newTop + 34);
    };

    const startDrag = (clientX, clientY) => {
      isDraggingCrosshair = true;
      crosshair.style.cursor = 'grabbing';
      const rect = crosshair.getBoundingClientRect();
      dragOffset.x = clientX - rect.left;
      dragOffset.y = clientY - rect.top;
    };

    const endDrag = () => {
      if (isDraggingCrosshair) {
        isDraggingCrosshair = false;
        crosshair.style.cursor = 'grab';
      }
    };

    crosshair.addEventListener("pointerdown", (e) => {
      e.preventDefault(); e.stopPropagation();
      startDrag(e.clientX, e.clientY);
      try { crosshair.setPointerCapture(e.pointerId); } catch(err) {}
    });

    crosshair.addEventListener("pointermove", (e) => {
      if (!isDraggingCrosshair) return;
      e.preventDefault(); e.stopPropagation();
      onDragMove(e.clientX, e.clientY);
    });

    const onPointerEnd = (e) => {
      if (!isDraggingCrosshair) return;
      endDrag();
      try { crosshair.releasePointerCapture(e.pointerId); } catch(err) {}
    };
    crosshair.addEventListener("pointerup", onPointerEnd);
    crosshair.addEventListener("pointercancel", onPointerEnd);

    crosshair.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches[0]) {
        e.preventDefault(); e.stopPropagation();
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    const onTouchMove = (e) => {
      if (isDraggingCrosshair && e.touches && e.touches[0]) {
        e.preventDefault(); e.stopPropagation();
        onDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
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

    setTimeout(() => { detectUnderCrosshair(initX + 34, initY + 34); }, 150);

    const saveAndApplyRule = (target) => {
      if (!target) return;
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
      const container = (currentScope === 'container' && target) ? target : findContentContainer(target);
      if (!container) return;
      const selector = generateContainerSelector(container);
      const pCount = container.querySelectorAll ? container.querySelectorAll('p, [data-tts-idx]').length : 0;
      let host = window.__TienHiepHelpers.getEffectiveUrl().hostname || window.location.hostname || '';
      if ((!host || host === 'localhost' || host === '127.0.0.1') && window.__originalUrl) {
        try { host = new URL(window.__originalUrl).hostname || host; } catch(e) {}
      }
      if (host && selector) {
        try { localStorage.setItem('__tienhiep_content_selector_' + host, selector); } catch(e) {}
      }

      highlightBox.style.setProperty("outline", "4px solid #10b981", "important");
      highlightBox.style.setProperty("background", "rgba(16,185,129,0.25)", "important");
      highlightBox.style.setProperty("box-shadow", "0 0 35px rgba(16,185,129,0.95)", "important");

      if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') window.__TienHiepHelpers.indexParagraphsForTTS();
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'CONTENT_AREA_SAVED', selector, host }, '*');

      banner.style.background = "linear-gradient(135deg,#059669,#10b981)";
      banner.innerHTML = "<span>✅ Đã lưu vùng đọc: <b>" + selector + "</b> (" + pCount + " đoạn văn) cho tên miền này!</span>";
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

    let tapStartX = 0, tapStartY = 0, tapStartTime = 0;
    const onDocTouchStart = (e) => {
      if (!window.__isTeachingNext || !e.touches || !e.touches[0]) return;
      if (e.target && e.target.closest && e.target.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]')) return;
      tapStartTime = Date.now();
      tapStartX = e.touches[0].clientX;
      tapStartY = e.touches[0].clientY;
    };

    const onDirectTap = (e) => {
      if (!window.__isTeachingNext) return;
      if (e.target && e.target.closest && e.target.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]')) return;

      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      let clientX = e.clientX, clientY = e.clientY;
      if ((clientX === undefined || clientY === undefined) && e.changedTouches && e.changedTouches[0]) {
        clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY;
      }

      let target = refineToBestTarget(e.target, clientX, clientY);
      if (!target && clientX !== undefined && clientY !== undefined) {
        const els = document.elementsFromPoint ? document.elementsFromPoint(clientX, clientY) : [document.elementFromPoint(clientX, clientY)];
        for (const el of els) {
          if (el && !el.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"]')) {
            target = refineToBestTarget(el, clientX, clientY);
            if (target) break;
          }
        }
      }

      if (target && target !== document.body && target !== document.documentElement) {
        const rect = target.getBoundingClientRect();
        const targetX = Math.max(0, Math.min(window.innerWidth - 68, rect.left + rect.width / 2 - 34));
        const targetY = Math.max(45, Math.min(window.innerHeight - 68, rect.top + rect.height / 2 - 34));
        crosshair.style.setProperty("left", targetX + "px", "important");
        crosshair.style.setProperty("top", targetY + "px", "important");
        handleTargetCandidate(target, clientX, clientY);
      }
    };

    const onDocTouchEnd = (e) => {
      if (!window.__isTeachingNext) return;
      if (e.target && e.target.closest && e.target.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]')) return;
      const touch = (e.changedTouches && e.changedTouches[0]) || null;
      if (touch && (Date.now() - tapStartTime < 450) && Math.hypot(touch.clientX - tapStartX, touch.clientY - tapStartY) < 18) {
        onDirectTap(e);
      }
    };

    window.addEventListener("touchstart", onDocTouchStart, { passive: true, capture: true });
    window.addEventListener("touchend", onDocTouchEnd, { passive: false, capture: true });
    window.addEventListener("click", onDirectTap, { passive: false, capture: true });

    const cleanup = () => {
      window.__isTeachingNext = false;
      currentTarget = null; currentChunkTarget = null; currentContainerTarget = null; currentScope = 'chunk';
      stopRafLoop();
      window.removeEventListener("touchstart", onDocTouchStart, { passive: true, capture: true });
      window.removeEventListener("touchend", onDocTouchEnd, { passive: false, capture: true });
      window.removeEventListener("click", onDirectTap, { passive: false, capture: true });
      window.removeEventListener("touchmove", onTouchMove, { passive: false, capture: true });
      window.removeEventListener("touchend", endDrag, { passive: true, capture: true });
      window.removeEventListener("touchcancel", endDrag, { passive: true, capture: true });
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", endDrag);
      if (highlightBox) highlightBox.remove();
      if (floatingBadge) floatingBadge.remove();
      if (crosshair) crosshair.remove();
    };

    bindInstantAction(document.getElementById("__cancel_teach_next"), () => { cleanup(); banner.remove(); });
    bindInstantAction(document.getElementById("__reset_teach_next"), () => {
      window.__TienHiepHelpers.deleteNextRule();
      let host = window.__TienHiepHelpers.getEffectiveUrl().hostname || window.location.hostname || '';
      if ((!host || host === 'localhost' || host === '127.0.0.1') && window.__originalUrl) {
        try { host = new URL(window.__originalUrl).hostname || host; } catch(e) {}
      }
      if (host) { try { localStorage.removeItem('__tienhiep_content_selector_' + host); } catch(e) {} }
      cleanup();
      banner.style.background = "linear-gradient(135deg,#3b82f6,#2563eb)";
      banner.innerHTML = "<span>🔄 Đã khôi phục cài đặt mặc định cho trang này!</span>";
      setTimeout(() => { banner.remove(); }, 900);
    });

    bindInstantAction(document.getElementById("__confirm_teach_next"), () => { if (currentTarget) saveAndApplyRule(currentTarget); });
    bindInstantAction(document.getElementById("__read_from_here"), () => { if (currentTarget) readFromTargetParagraph(currentTarget); });
    bindInstantAction(document.getElementById("__scope_toggle_btn"), () => { applyTargetScope('container'); });
    bindInstantAction(document.getElementById("__save_content_area"), () => { if (currentTarget) saveContentAreaRule(currentTarget); });
    bindInstantAction(document.getElementById("__back_to_chunk"), () => { applyTargetScope('chunk'); });
    bindInstantAction(document.getElementById("__test_next_teach"), () => {
      if (currentTarget) { cleanup(); banner.remove(); window.__TienHiepHelpers.triggerNavigation(currentTarget); }
    });

    bindInstantAction(document.getElementById("__teach_badge_save"), () => {
      (currentScope === 'container' && currentTarget) ? saveContentAreaRule(currentTarget) : (currentTarget && saveAndApplyRule(currentTarget));
    });
    bindInstantAction(document.getElementById("__teach_badge_read"), () => { if (currentTarget) readFromTargetParagraph(currentTarget); });
    bindInstantAction(document.getElementById("__teach_badge_scope"), () => { applyTargetScope(currentScope === 'chunk' ? 'container' : 'chunk'); });
    bindInstantAction(document.getElementById("__teach_badge_prev"), () => { shiftTargetSibling(-1); });
    bindInstantAction(document.getElementById("__teach_badge_next"), () => { shiftTargetSibling(1); });

    let lastCrosshairTap = 0;
    crosshair.addEventListener("touchend", () => {
      if (isDraggingCrosshair) return;
      const now = Date.now();
      if (now - lastCrosshairTap < 350 && currentTarget) {
        if (currentScope === 'container') saveContentAreaRule(currentTarget);
        else if (isTargetParagraph) readFromTargetParagraph(currentTarget);
        else saveAndApplyRule(currentTarget);
      }
      lastCrosshairTap = now;
    });
  `;
}
