// Teach Mode UI elements initialization with mobile responsiveness
export function getTeachUiScript(): string {
  return `
    window.__isTeachingNext = true;
    if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
      try { window.__TienHiepHelpers.indexParagraphsForTTS(); } catch(e) {}
    }
    const existingBanner = document.getElementById("__teach_next_banner");
    if (existingBanner) existingBanner.remove();
    const existingBox = document.getElementById("__teach_highlighter_box");
    if (existingBox) existingBox.remove();
    const existingCrosshair = document.getElementById("__teach_crosshair_target");
    if (existingCrosshair) existingCrosshair.remove();
    const existingBadge = document.getElementById("__teach_floating_badge");
    if (existingBadge) existingBadge.remove();

    const bindInstantAction = (el, fn) => {
      if (!el) return;
      let lastExec = 0;
      const handler = (e) => {
        const now = Date.now();
        if (now - lastExec < 300) {
          try { e.preventDefault(); e.stopPropagation(); } catch(_) {}
          return;
        }
        lastExec = now;
        try {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        } catch(err) {}
        fn(e);
      };
      el.addEventListener('click', handler, { capture: true });
      el.addEventListener('touchend', handler, { passive: false, capture: true });
    };

    const banner = document.createElement("teach-banner");
    banner.id = "__teach_next_banner";
    banner.style.cssText = "position:fixed !important;top:10px !important;left:50% !important;transform:translateX(-50%) !important;max-width:92vw !important;background:rgba(15,23,42,0.92) !important;backdrop-filter:blur(10px) !important;-webkit-backdrop-filter:blur(10px) !important;color:#ffffff !important;padding:5px 12px !important;border-radius:20px !important;z-index:2147483647 !important;font-size:11px !important;font-weight:600 !important;box-shadow:0 8px 30px rgba(0,0,0,0.85) !important;display:flex !important;align-items:center !important;gap:10px !important;border:1px solid rgba(245,158,11,0.5) !important;font-family:system-ui,sans-serif !important;box-sizing:border-box !important;pointer-events:auto !important;-webkit-user-select:none !important;user-select:none !important;";
    banner.innerHTML = '<span id="__teach_info_text" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;color:#fde047;max-width:70vw;">🎯 Rê tâm ngắm vào Nút hoặc Đoạn văn</span><button id="__cancel_teach_next" style="background:rgba(239,68,68,0.85) !important;border:none !important;color:#fff !important;padding:3px 9px !important;border-radius:12px !important;cursor:pointer !important;font-weight:bold !important;font-size:10px !important;touch-action:manipulation !important;pointer-events:auto !important;flex-shrink:0 !important;">✕ Đóng</button>';
    document.body.appendChild(banner);

    const highlightBox = document.createElement("teach-highlighter");
    highlightBox.id = "__teach_highlighter_box";
    highlightBox.style.cssText = "position:fixed !important;pointer-events:none !important;z-index:2147483640 !important;outline:2.5px solid #f59e0b !important;outline-offset:-1px !important;background:rgba(245,158,11,0.2) !important;box-shadow:0 0 18px rgba(245,158,11,0.7), inset 0 0 12px rgba(245,158,11,0.25) !important;border-radius:6px !important;display:none !important;box-sizing:border-box !important;will-change:top,left,width,height !important;";
    document.body.appendChild(highlightBox);

    const floatingBadge = document.createElement("div");
    floatingBadge.id = "__teach_floating_badge";
    floatingBadge.style.cssText = "position:fixed !important;pointer-events:auto !important;display:none !important;background:linear-gradient(135deg,#0f172a,#1e1b4b) !important;border:1.5px solid #f59e0b !important;color:#ffffff !important;border-radius:12px !important;padding:6px 10px !important;font-size:11px !important;font-family:system-ui,sans-serif !important;white-space:nowrap !important;box-shadow:0 10px 28px rgba(0,0,0,0.92) !important;z-index:2147483647 !important;align-items:center !important;gap:8px !important;box-sizing:border-box !important;max-width:96vw !important;overflow:hidden !important;";
    floatingBadge.innerHTML = '<div style="display:flex;flex-direction:column;gap:2px;min-width:0;overflow:hidden;flex-shrink:1;"><div style="display:flex;align-items:center;gap:5px;"><span id="__teach_badge_type_tag" style="background:#f59e0b;color:#0f172a;font-weight:900;padding:1px 5px;border-radius:4px;font-size:9px;flex-shrink:0;">MỤC TIÊU</span><span id="__teach_badge_name" style="font-weight:bold;color:#fde047;max-width:130px;overflow:hidden;text-overflow:ellipsis;">...</span></div><div id="__teach_badge_sub" style="font-size:10px;color:#94a3b8;max-width:170px;overflow:hidden;text-overflow:ellipsis;">...</div></div><div style="display:flex;align-items:center;gap:4px;flex-shrink:0;"><button id="__teach_badge_prev" title="Nút trước" style="background:rgba(255,255,255,0.18) !important;border:none !important;color:#fff !important;padding:5px 8px !important;border-radius:6px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">◀</button><button id="__teach_badge_next" title="Nút sau" style="background:rgba(255,255,255,0.18) !important;border:none !important;color:#fff !important;padding:5px 8px !important;border-radius:6px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">▶</button><button id="__teach_badge_read" style="display:none;background:linear-gradient(135deg,#8b5cf6,#6d28d9) !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 9px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">📖 Đọc</button><button id="__teach_badge_scope" style="display:none;background:linear-gradient(135deg,#0ea5e9,#0284c7) !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 9px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">📦 Cả vùng</button><button id="__teach_badge_descend" title="Hạ 1 cấp để chọn chi tiết hơn" style="display:none;background:linear-gradient(135deg,#ec4899,#db2777) !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 8px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">⬇️ Câu</button><button id="__teach_badge_ascend" title="Nâng cấp lên đoạn cha" style="display:none;background:linear-gradient(135deg,#f59e0b,#d97706) !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 8px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">⬆️ Đoạn</button><button id="__teach_badge_add_region" style="display:none;background:linear-gradient(135deg,#6366f1,#4f46e5) !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 8px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">➕ Thêm</button><button id="__teach_badge_save" style="background:#10b981 !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 10px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;box-shadow:0 0 10px rgba(16,185,129,0.6) !important;min-height:30px !important;touch-action:manipulation !important;">✓ Lưu</button></div>';
    document.body.appendChild(floatingBadge);

    const crosshair = document.createElement("div");
    crosshair.id = "__teach_crosshair_target";
    crosshair.style.cssText = "position:fixed !important;left:calc(50vw - 34px) !important;top:calc(50vh - 34px) !important;width:68px !important;height:68px !important;z-index:2147483646 !important;cursor:grab !important;touch-action:none !important;user-select:none !important;-webkit-user-select:none !important;display:flex !important;align-items:center !important;justify-content:center !important;border-radius:50% !important;border:3px dashed #f59e0b !important;background:rgba(245,158,11,0.25) !important;box-shadow:0 0 24px rgba(245,158,11,0.8), inset 0 0 12px rgba(245,158,11,0.3) !important;box-sizing:border-box !important;";
    crosshair.innerHTML = '<div id="__teach_ch_h" style="position:absolute;width:40px;height:2px;background:#f59e0b !important;top:50%;left:50%;pointer-events:none;transform:translate(-50%,-50%);"></div><div id="__teach_ch_v" style="position:absolute;height:40px;width:2px;background:#f59e0b !important;left:50%;top:50%;pointer-events:none;transform:translate(-50%,-50%);"></div><div id="__teach_ch_dot" style="width:16px;height:16px;border-radius:50%;background:#ef4444 !important;border:2px solid #ffffff !important;box-shadow:0 0 10px #ef4444 !important;pointer-events:none;z-index:2;"></div><div id="__teach_ch_lbl" style="position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:6px;background:#f59e0b !important;color:#0f172a !important;font-size:11px !important;font-weight:900 !important;padding:5px 12px !important;border-radius:8px !important;white-space:nowrap !important;box-shadow:0 4px 14px rgba(0,0,0,0.85) !important;pointer-events:auto !important;cursor:grab !important;touch-action:none !important;letter-spacing:0.3px !important;border:1.5px solid #ffffff !important;user-select:none !important;-webkit-user-select:none !important;">🎯 RÊ TÂM NGẮM</div>';
    document.body.appendChild(crosshair);
  `;
}
