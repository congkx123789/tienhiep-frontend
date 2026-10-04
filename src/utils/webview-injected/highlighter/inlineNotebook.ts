// Inline Notebook UI and Vocabulary helper for TTS
export function getInlineNotebookScript(): string {
  return `
    showInlineNotebook: (el, paraIdx, rawZhText, translatedText) => {
      const existing = document.getElementById('__tienhiep_inline_notebook');
      if (existing) {
        const isSame = existing.getAttribute('data-para-idx') === String(paraIdx);
        existing.remove();
        if (isSame) return;
      }

      const notebook = document.createElement('div');
      notebook.id = '__tienhiep_inline_notebook';
      notebook.setAttribute('data-para-idx', String(paraIdx));
      notebook.style.cssText = 'margin: 6px 0 12px 0 !important; padding: 6px 10px !important; background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-left: 4px solid #8b5cf6 !important; border-radius: 8px !important; box-shadow: 0 4px 14px rgba(0,0,0,0.06) !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; font-size: 12px !important; line-height: 1.3 !important; color: #1e293b !important; box-sizing: border-box !important; display: block !important; width: 100% !important; user-select: none !important; clear: both !important;';

      let currentMode = 'phrase';
      let cachedTokens = [];
      let charTokens = [];

      const renderContent = () => {
        const tokensToRender = currentMode === 'char' ? charTokens : cachedTokens;
        notebook.innerHTML = '';

        const topBar = document.createElement('div');
        topBar.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px; padding-bottom: 4px; border-bottom: 1px dashed #e2e8f0;';

        const leftGroup = document.createElement('div');
        leftGroup.style.cssText = 'display: flex; align-items: center; gap: 6px; overflow-x: auto;';

        const titleSpan = document.createElement('span');
        titleSpan.style.cssText = 'font-size: 10.5px; font-weight: 800; color: #6d28d9; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;';
        titleSpan.textContent = '📓 SỔ TAY TỪ:';
        leftGroup.appendChild(titleSpan);

        const modeGroup = document.createElement('div');
        modeGroup.style.cssText = 'display: inline-flex; background: #f1f5f9; padding: 2px; border-radius: 4px; font-size: 10px; font-weight: 600;';

        const btnPhrase = document.createElement('button');
        btnPhrase.textContent = 'Cụm từ';
        btnPhrase.style.cssText = 'padding: 1px 6px; border-radius: 3px; border: none; cursor: pointer; background: ' + (currentMode === 'phrase' ? '#ffffff' : 'transparent') + '; color: ' + (currentMode === 'phrase' ? '#6d28d9' : '#64748b') + '; box-shadow: ' + (currentMode === 'phrase' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none') + ';';
        btnPhrase.onclick = () => { currentMode = 'phrase'; renderContent(); };

        const btnChar = document.createElement('button');
        btnChar.textContent = 'Từ đơn';
        btnChar.style.cssText = 'padding: 1px 6px; border-radius: 3px; border: none; cursor: pointer; background: ' + (currentMode === 'char' ? '#ffffff' : 'transparent') + '; color: ' + (currentMode === 'char' ? '#6d28d9' : '#64748b') + '; box-shadow: ' + (currentMode === 'char' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none') + ';';
        btnChar.onclick = () => { currentMode = 'char'; renderContent(); };

        modeGroup.appendChild(btnPhrase);
        modeGroup.appendChild(btnChar);
        leftGroup.appendChild(modeGroup);

        const btnPlay = document.createElement('button');
        btnPlay.textContent = '▶ Phát';
        btnPlay.style.cssText = 'display: inline-flex; align-items: center; gap: 2px; padding: 2px 7px; background: #7c3aed; color: #ffffff; border: none; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer; white-space: nowrap;';
        btnPlay.onclick = () => {
          try {
            window.parent.postMessage({ type: 'START_TTS_FROM_PARAGRAPH', paraIdx: paraIdx, text: translatedText }, '*');
          } catch(e) {}
        };
        leftGroup.appendChild(btnPlay);

        const btnClose = document.createElement('button');
        btnClose.textContent = '✕';
        btnClose.style.cssText = 'background: none; border: none; color: #94a3b8; font-size: 14px; font-weight: bold; cursor: pointer; padding: 0 4px; line-height: 1;';
        btnClose.onclick = () => notebook.remove();

        topBar.appendChild(leftGroup);
        topBar.appendChild(btnClose);
        notebook.appendChild(topBar);

        const chipRow = document.createElement('div');
        chipRow.style.cssText = 'display: flex; align-items: center; gap: 4px; overflow-x: auto; padding: 2px 0; -webkit-overflow-scrolling: touch;';

        const labelSpan = document.createElement('span');
        labelSpan.style.cssText = 'font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; white-space: nowrap; margin-right: 2px;';
        labelSpan.textContent = 'CHỌN TỪ:';
        chipRow.appendChild(labelSpan);

        const altPanel = document.createElement('div');
        altPanel.id = '__th_alt_panel';
        altPanel.style.cssText = 'display: none; margin-top: 5px; padding: 3px 6px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 4px; font-size: 11px; align-items: center; gap: 6px; overflow-x: auto;';

        const chipBtns = [];
        tokensToRender.forEach((tok) => {
          const btn = document.createElement('button');
          btn.style.cssText = 'display: inline-flex; flex-direction: column; align-items: center; justify-content: center; padding: 2px 5px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; flex-shrink: 0; line-height: 1.1; font-family: inherit;';

          const zhSpan = document.createElement('span');
          zhSpan.style.cssText = 'font-size: 11px; font-weight: 700; color: #0f172a;';
          zhSpan.textContent = tok.zh;

          const viSpan = document.createElement('span');
          viSpan.style.cssText = 'font-size: 9px; color: #64748b; max-width: 65px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px;';
          viSpan.textContent = tok.vi || tok.hanviet;

          btn.appendChild(zhSpan);
          btn.appendChild(viSpan);

          btn.onclick = () => {
            chipBtns.forEach(b => {
              b.style.borderColor = '#cbd5e1';
              b.style.background = '#ffffff';
            });
            btn.style.borderColor = '#7c3aed';
            btn.style.background = '#f5f3ff';

            altPanel.innerHTML = '';
            altPanel.style.display = 'flex';

            const infoSpan = document.createElement('span');
            infoSpan.style.cssText = 'color: #475569; font-weight: 600; white-space: nowrap;';
            infoSpan.innerHTML = 'Từ: <strong style="color: #6d28d9;">' + tok.zh + '</strong> (' + tok.vi + ')';
            altPanel.appendChild(infoSpan);

            const sepSpan = document.createElement('span');
            sepSpan.style.cssText = 'color: #94a3b8; border-left: 1px solid #cbd5e1; padding-left: 6px; white-space: nowrap;';
            sepSpan.textContent = 'Đổi sang:';
            altPanel.appendChild(sepSpan);

            const alts = (tok.alternatives && tok.alternatives.length > 0) ? tok.alternatives : [tok.vi];
            const altBtnsContainer = document.createElement('div');
            altBtnsContainer.style.cssText = 'display: flex; gap: 4px; overflow-x: auto;';

            alts.forEach(alt => {
              const aBtn = document.createElement('button');
              aBtn.textContent = alt;
              const isCur = alt === tok.vi;
              aBtn.style.cssText = 'padding: 1px 6px; background: ' + (isCur ? '#ede9fe' : '#ffffff') + '; color: ' + (isCur ? '#6d28d9' : '#334155') + '; font-weight: ' + (isCur ? '700' : '500') + '; border: 1px solid ' + (isCur ? '#a78bfa' : '#cbd5e1') + '; border-radius: 4px; cursor: pointer; font-size: 10.5px; white-space: nowrap;';

              aBtn.onclick = () => {
                const oldWord = tok.vi;
                let curText = el.innerText || el.textContent || '';
                if (oldWord && curText.includes(oldWord)) {
                  curText = curText.replace(oldWord, alt);
                } else {
                  curText = curText + ' ' + alt;
                }

                const spans = el.querySelectorAll('.tts-sentence');
                if (spans.length > 0) {
                  spans.forEach(sp => {
                    if (sp.textContent && sp.textContent.includes(oldWord)) {
                      sp.textContent = sp.textContent.replace(oldWord, alt);
                    }
                  });
                } else {
                  el.textContent = curText;
                }

                tok.vi = alt;
                viSpan.textContent = alt;
                infoSpan.innerHTML = 'Từ: <strong style="color: #6d28d9;">' + tok.zh + '</strong> (' + alt + ')';

                try {
                  window.parent.postMessage({
                    type: 'PARAGRAPH_EDITED',
                    paraIdx: paraIdx,
                    newText: curText
                  }, '*');
                } catch(e) {}

                altBtnsContainer.querySelectorAll('button').forEach(b => {
                  b.style.background = '#ffffff';
                  b.style.borderColor = '#cbd5e1';
                  b.style.color = '#334155';
                  b.style.fontWeight = '500';
                });
                aBtn.style.background = '#ede9fe';
                aBtn.style.borderColor = '#a78bfa';
                aBtn.style.color = '#6d28d9';
                aBtn.style.fontWeight = '700';
              };

              altBtnsContainer.appendChild(aBtn);
            });

            altPanel.appendChild(altBtnsContainer);
          };

          chipBtns.push(btn);
          chipRow.appendChild(btn);
        });

        notebook.appendChild(chipRow);
        notebook.appendChild(altPanel);
      };

      notebook.innerHTML = '<div style="font-size: 11px; color: #64748b; padding: 2px;">📓 Đang tra từ vựng sổ tay...</div>';
      el.insertAdjacentElement('afterend', notebook);

      const targetZh = rawZhText || el.getAttribute('data-orig-zh') || '';
      fetch('http://127.0.0.1:5051/api/translate/align', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zh: targetZh, vi: translatedText, mode: 4 })
      })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.tokens) && data.tokens.length > 0) {
          cachedTokens = data.tokens.filter(t => t.zh && t.zh.trim());
        } else {
          cachedTokens = targetZh.split('').filter(c => /[\\u4e00-\\u9fa5]/.test(c)).map(c => ({
            zh: c,
            vi: c,
            hanviet: c,
            alternatives: [c]
          }));
        }

        charTokens = [];
        cachedTokens.forEach(t => {
          if (t.zh.length <= 1) {
            charTokens.push(t);
          } else {
            const chars = Array.from(t.zh);
            const hvParts = t.hanviet ? t.hanviet.split(/\\s+/) : [];
            chars.forEach((c, idx) => {
              charTokens.push({
                zh: c,
                vi: hvParts[idx] || t.vi,
                hanviet: hvParts[idx] || '',
                alternatives: hvParts[idx] ? [hvParts[idx]] : [t.vi]
              });
            });
          }
        });

        renderContent();
      })
      .catch(() => {
        notebook.innerHTML = '<div style="font-size: 11px; color: #94a3b8; padding: 2px;">Không kết nối được dịch thuật sổ tay.</div>';
      });
    },
  `;
}
