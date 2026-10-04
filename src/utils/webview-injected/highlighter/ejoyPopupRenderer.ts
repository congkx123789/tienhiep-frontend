// eJOY Popup DOM renderer with streamlined Notebook Layout & Mobile/Desktop adaptation
export function getEjoyPopupRendererScript(): string {
  return `
    function showPopupAt(x, y, data) {
      if (activePopup) { activePopup.remove(); activePopup = null; }

      const isMobile = window.innerWidth <= 640 || ('ontouchstart' in window && window.innerWidth <= 800);
      const popup = document.createElement('div');
      popup.id = '__th_ejoy_popup';

      if (isMobile) {
        popup.style.cssText = 'position: fixed; left: 10px; right: 10px; bottom: 10px; width: auto; max-width: calc(100vw - 20px); max-height: 52vh; overflow-y: auto; z-index: 2147483647; background: #ffffff; border-radius: 16px; border: 1px solid #cbd5e1; border-top: 3.5px solid #7c3aed; box-shadow: 0 -8px 25px rgba(0,0,0,0.2); padding: 10px 12px 12px 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: #1e293b; user-select: none; box-sizing: border-box;';
      } else {
        const popupWidth = 420;
        let posX = Math.max(12, Math.min(window.innerWidth - popupWidth - 14, x - popupWidth / 2));
        let posY = y + 8;
        if (y - window.scrollY + 220 > window.innerHeight && y - window.scrollY > 230) posY = y - 230;
        popup.style.cssText = 'position: absolute; left: ' + posX + 'px; top: ' + (posY + window.scrollY) + 'px; width: ' + popupWidth + 'px; max-width: 92vw; z-index: 2147483647; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; border-top: 4px solid #7c3aed; box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.2); padding: 11px 15px 12px 15px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12.5px; color: #1e293b; user-select: none; box-sizing: border-box;';
      }

      if (isMobile) {
        const pullBar = document.createElement('div');
        pullBar.style.cssText = 'width: 32px; height: 3.5px; background: #cbd5e1; border-radius: 99px; margin: 0 auto 6px auto;';
        popup.appendChild(pullBar);
      }

      // 1. Header: Sổ tay + Nguồn + Đóng
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 5px; margin-bottom: 7px;';
      header.innerHTML = '<div style="display: flex; align-items: center; gap: 5px;"><span style="font-size: 11px; font-weight: 800; color: #7c3aed;">📓 SỔ TAY TỪ VỰNG</span><span style="font-size: 9px; font-weight: 700; background: #f3e8ff; color: #7e22ce; padding: 1px 5px; border-radius: 3px; border: 1px solid #d8b4fe;">' + (data.source || 'CMLM C++') + '</span></div>';

      const btnClose = document.createElement('button');
      btnClose.textContent = '✕';
      btnClose.style.cssText = 'background: none; border: none; font-size: 14px; font-weight: bold; color: #94a3b8; cursor: pointer; padding: 2px 5px; line-height: 1;';
      btnClose.onclick = closePopup;
      header.appendChild(btnClose);
      popup.appendChild(header);

      // 2. Thẻ từ vựng chính: Tiếng Việt + Chữ Hán Match + Hán Việt + Nút tác vụ
      const wordRow = document.createElement('div');
      wordRow.style.cssText = 'display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px;';

      const hasHanInOrig = data.origZh && /[一-龥]/.test(data.origZh);
      const wordInfo = document.createElement('div');
      let wordHtml = '<div style="display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap;">';
      wordHtml += '<strong style="font-size: 15.5px; font-weight: 800; color: #0f172a; line-height: 1.2;">' + data.selectedText + '</strong>';
      if (hasHanInOrig) {
        wordHtml += '<span style="font-size: 15.5px; font-weight: 800; color: #6d28d9; font-family: SimSun, serif; background: #ede9fe; border: 1.5px solid #c4b5fd; padding: 1px 7px; border-radius: 4px;">' + data.origZh + '</span>';
      }
      if (data.hanviet) {
        wordHtml += '<span style="font-size: 11.5px; font-weight: 600; color: #4338ca;">[' + data.hanviet + ']</span>';
      }
      wordHtml += '</div>';
      wordInfo.innerHTML = wordHtml;

      const actionBtns = document.createElement('div');
      actionBtns.style.cssText = 'display: flex; align-items: center; gap: 4px; flex-shrink: 0;';

      const btnSpeak = document.createElement('button');
      btnSpeak.className = '__th_ejoy_btn';
      btnSpeak.textContent = '🔊';
      btnSpeak.title = 'Phát âm';
      btnSpeak.onclick = () => speakWord(hasHanInOrig ? data.origZh : data.selectedText);

      const btnCopy = document.createElement('button');
      btnCopy.className = '__th_ejoy_btn';
      btnCopy.textContent = '📋';
      btnCopy.title = 'Sao chép';
      btnCopy.onclick = () => {
        const t = (hasHanInOrig ? data.selectedText + ' (' + data.origZh + (data.hanviet ? ' - ' + data.hanviet : '') + ')' : data.selectedText);
        navigator.clipboard.writeText(t);
        btnCopy.textContent = '✓';
        setTimeout(() => { btnCopy.textContent = '📋'; }, 1200);
      };

      const btnSave = document.createElement('button');
      btnSave.className = '__th_ejoy_btn __th_ejoy_btn_save';
      btnSave.textContent = '⭐';
      btnSave.title = 'Lưu vào Sổ tay';
      btnSave.onclick = () => {
        let ctxStr = '';
        if (data.accurateContext && data.accurateContext.target) {
          ctxStr = (data.accurateContext.before || '') + '【' + data.accurateContext.target + '】' + (data.accurateContext.after || '');
        }
        saveWordToNotebook(data.selectedText, hasHanInOrig ? data.origZh : '', data.hanviet || '', data.currentMeaning || data.selectedText, ctxStr);
        btnSave.textContent = '⭐ Đã lưu';
      };

      actionBtns.appendChild(btnSpeak);
      actionBtns.appendChild(btnCopy);
      actionBtns.appendChild(btnSave);
      wordRow.appendChild(wordInfo);
      wordRow.appendChild(actionBtns);
      popup.appendChild(wordRow);

      // 3. Ngữ cảnh chữ Hán chuẩn xác: Đánh dấu ĐÚNG từ đang trong sổ tay giữa câu nguyên tác
      const hasTargetHan = data.accurateContext && data.accurateContext.target && /[一-龥]/.test(data.accurateContext.target);
      const hasContextHan = data.accurateContext && /[一-龥]/.test((data.accurateContext.before || '') + (data.accurateContext.after || ''));
      if (hasTargetHan && hasContextHan) {
        const ctxBox = document.createElement('div');
        ctxBox.style.cssText = 'background: #f8fafc; border: 1.5px solid #ddd6fe; border-radius: 8px; padding: 7px 10px; margin-bottom: 7px; font-family: SimSun, serif; line-height: 1.6;';
        let ctxHtml = '<div style="font-size: 9.5px; font-weight: 800; color: #6d28d9; text-transform: uppercase; margin-bottom: 4px; font-family: -apple-system, sans-serif; display: flex; align-items: center; gap: 4px;"><span>🇨🇳</span><span>CÂU CHỮ HÁN GỐC (NGỮ CẢNH):</span></div>';
        ctxHtml += '<div style="font-size: 13.5px; color: #334155;">';
        if (data.accurateContext.before) ctxHtml += '<span>' + data.accurateContext.before + '</span> ';
        ctxHtml += '<span style="color: #ffffff; font-weight: 900; background: #7c3aed; border: 1px solid #6d28d9; padding: 2px 7px; border-radius: 4px; font-size: 15px; box-shadow: 0 1px 3px rgba(124,58,237,0.3);">【' + data.accurateContext.target + '】</span>';
        if (data.accurateContext.after) ctxHtml += ' <span>' + data.accurateContext.after + '</span>';
        ctxHtml += '</div>';
        ctxBox.innerHTML = ctxHtml;
        popup.appendChild(ctxBox);
      } else if (hasHanInOrig) {
        const ctxBox = document.createElement('div');
        ctxBox.style.cssText = 'background: #f8fafc; border: 1.5px solid #ddd6fe; border-radius: 8px; padding: 7px 10px; margin-bottom: 7px; font-family: SimSun, serif; line-height: 1.5;';
        ctxBox.innerHTML = '<div style="font-size: 9.5px; font-weight: 800; color: #6d28d9; text-transform: uppercase; margin-bottom: 3px; font-family: -apple-system, sans-serif;">🇨🇳 CHỮ HÁN MATCH ĐỐI ỨNG (TỪ TRUNG):</div><div style="font-size: 16px; font-weight: 800; color: #6d28d9; font-family: SimSun, serif;">【' + data.origZh + '】' + (data.hanviet ? ' <span style="font-size: 12px; color: #4338ca; font-weight: 600;">[' + data.hanviet + ']</span>' : '') + '</div>';
        popup.appendChild(ctxBox);
      }

      // 4. Debug bóc tách token chi tiết đối ứng
      const validTokens = (data.tokens && Array.isArray(data.tokens)) ? data.tokens.filter(t => t && t.zh && /[一-龥]/.test(t.zh)) : [];
      if (validTokens.length > 0) {
        const debugBox = document.createElement('div');
        debugBox.style.cssText = 'background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 5px 8px; margin-bottom: 6px; font-size: 11px;';
        let debugHtml = '<div style="font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 3px; display: flex; justify-content: space-between;"><span>🔍 PHÂN TÍCH ĐỐI ỨNG TỪNG TỪ:</span><span style="color: #6d28d9;">' + validTokens.length + ' từ</span></div>';
        debugHtml += '<div style="display: flex; flex-wrap: wrap; gap: 4px; max-height: 52px; overflow-y: auto;">';
        validTokens.forEach(t => {
          const isTarget = data.origZh && t.zh && data.origZh.includes(t.zh);
          debugHtml += '<span style="display: inline-flex; align-items: center; gap: 3px; padding: 1.5px 6px; border-radius: 4px; background: ' + (isTarget ? '#ede9fe; border: 1px solid #a78bfa; color: #6d28d9; font-weight: 700;' : '#ffffff; border: 1px solid #e2e8f0; color: #334155;') + '">';
          debugHtml += '<strong style="font-family: SimSun, serif; font-size: 12px;">' + t.zh + '</strong> <span style="color: #64748b; font-size: 9.5px;">(' + (t.vi || t.hanviet) + ')</span>';
          debugHtml += '</span>';
        });
        debugHtml += '</div>';
        debugBox.innerHTML = debugHtml;
        popup.appendChild(debugBox);
      }

      // 5. Các lựa chọn đổi nghĩa trực tiếp vào câu (Đã lọc bỏ từ trùng lặp)
      const rawAlts = (data.alternatives && Array.isArray(data.alternatives)) ? data.alternatives : [];
      const filteredAlts = rawAlts.filter(a => a && a.trim() && a.trim().toLowerCase() !== data.selectedText.trim().toLowerCase());
      if (filteredAlts.length > 0) {
        const altSection = document.createElement('div');
        altSection.style.cssText = 'margin-top: 5px; margin-bottom: 6px;';
        altSection.innerHTML = '<div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 3px;">Đổi nghĩa khác:</div>';
        const altsContainer = document.createElement('div');
        altsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 4px; max-height: 60px; overflow-y: auto;';
        filteredAlts.slice(0, 5).forEach(alt => {
          const chip = document.createElement('button');
          chip.className = '__th_ejoy_alt_chip';
          chip.textContent = alt;
          chip.onclick = () => replaceWordInParagraph(data.parentPara, data.paraIdx, data.selectedText, alt);
          altsContainer.appendChild(chip);
        });
        altSection.appendChild(altsContainer);
        popup.appendChild(altSection);
      }

      // 5. Footer: Thời gian siêu tốc & Liên kết sổ tay
      const footer = document.createElement('div');
      footer.style.cssText = 'margin-top: 5px; padding-top: 5px; border-top: 1px dashed #e2e8f0; display: flex; align-items: center; justify-content: space-between;';
      footer.innerHTML = '<span style="font-size: 9.5px; color: #94a3b8;">⚡ ' + (data.elapsed || '0.08ms In-Memory') + '</span><button type="button" style="background: none; border: none; color: #7c3aed; font-size: 10px; font-weight: 700; cursor: pointer; text-decoration: underline;">📖 Xem sổ tay (' + getSavedWords().length + ')</button>';
      const btnViewNotebook = footer.querySelector('button');
      if (btnViewNotebook) {
        btnViewNotebook.onclick = () => { closePopup(); openNotebookModal(); };
      }
      popup.appendChild(footer);

      document.body.appendChild(popup);
      activePopup = popup;
    }

    function replaceWordInParagraph(parentPara, paraIdx, oldWord, newWord) {
      if (!parentPara || !oldWord || !newWord) return;
      let curText = parentPara.innerText || parentPara.textContent || '';
      if (curText.includes(oldWord)) curText = curText.replace(oldWord, newWord);
      const spans = parentPara.querySelectorAll('.tts-sentence');
      if (spans.length > 0) {
        spans.forEach(sp => {
          if (sp.textContent && sp.textContent.includes(oldWord)) {
            sp.textContent = sp.textContent.replace(oldWord, newWord);
          }
        });
      } else {
        parentPara.textContent = curText;
      }
      if (paraIdx !== null) {
        try {
          window.parent.postMessage({
            type: 'PARAGRAPH_EDITED',
            paraIdx: paraIdx,
            newText: curText,
            oldWord: oldWord,
            newWord: newWord
          }, '*');
        } catch(e) {}
      }
      closePopup();
    }
  `;
}
