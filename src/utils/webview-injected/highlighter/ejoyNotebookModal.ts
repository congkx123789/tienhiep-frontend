// eJOY Style Notebook storage & modal viewer script
export function getEjoyNotebookModalScript(): string {
  return `
    function getSavedWords() {
      try {
        const raw = localStorage.getItem('__th_ejoy_saved_words');
        return raw ? JSON.parse(raw) : [];
      } catch(e) {
        return [];
      }
    }

    function saveWordToNotebook(word, zh, hv, meaning, context) {
      if (!word) return false;
      try {
        const list = getSavedWords();
        const exists = list.some(item => item.word.toLowerCase() === word.toLowerCase());
        if (!exists) {
          list.unshift({
            id: Date.now(),
            word: word,
            zh: zh || '',
            hv: hv || '',
            meaning: meaning || '',
            context: context || '',
            date: new Date().toLocaleDateString('vi-VN')
          });
          localStorage.setItem('__th_ejoy_saved_words', JSON.stringify(list.slice(0, 300)));
        }
        return true;
      } catch(e) {
        return false;
      }
    }

    function openNotebookModal() {
      const existing = document.getElementById('__th_ejoy_notebook_modal');
      if (existing) existing.remove();

      const words = getSavedWords();
      const modal = document.createElement('div');
      modal.id = '__th_ejoy_notebook_modal';
      modal.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 16px;';

      const box = document.createElement('div');
      box.style.cssText = 'background: #ffffff; border-radius: 14px; width: 440px; max-width: 95vw; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 20px 40px rgba(0,0,0,0.25); overflow: hidden;';

      // Header
      const header = document.createElement('div');
      header.style.cssText = 'padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; background: #f8fafc;';
      header.innerHTML = '<div style="font-size: 14px; font-weight: 800; color: #6d28d9; display: flex; align-items: center; gap: 6px;"><span>📓</span><span>SỔ TAY TỪ VỰNG (' + words.length + ' từ)</span></div>';

      const btnCloseModal = document.createElement('button');
      btnCloseModal.textContent = '✕';
      btnCloseModal.style.cssText = 'background: none; border: none; font-size: 16px; font-weight: bold; color: #64748b; cursor: pointer; padding: 4px;';
      btnCloseModal.onclick = () => { modal.remove(); };
      header.appendChild(btnCloseModal);
      box.appendChild(header);

      // Body list
      const listDiv = document.createElement('div');
      listDiv.style.cssText = 'padding: 12px 16px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 8px;';

      if (words.length === 0) {
        listDiv.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 32px 0; font-size: 13px;">Chưa có từ nào trong Sổ tay.<br>Hãy bấm ⭐ "Lưu Sổ Tay" khi tra từ để lưu lại!</div>';
      } else {
        words.forEach((item) => {
          const row = document.createElement('div');
          row.style.cssText = 'padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; display: flex; align-items: center; justify-content: space-between; gap: 8px;';
          let rowHtml = '<div><strong style="color: #0f172a; font-size: 13.5px;">' + item.word + '</strong>';
          if (item.hv) rowHtml += ' <span style="color: #7c3aed; font-size: 11.5px; font-weight: 600;">[' + item.hv + ']</span>';
          if (item.zh) rowHtml += ' <span style="color: #6d28d9; font-size: 12px; font-weight: 700; font-family: SimSun, serif; background: #ede9fe; padding: 1px 5px; border-radius: 4px;">' + item.zh + '</span>';
          rowHtml += '<div style="color: #059669; font-size: 12px; font-weight: 600; margin-top: 2px;">' + item.meaning + '</div>';
          if (item.context) {
            rowHtml += '<div style="color: #64748b; font-size: 11.5px; font-family: SimSun, serif; margin-top: 3px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">' + item.context + '</div>';
          }
          rowHtml += '</div>';
          row.innerHTML = rowHtml;

          const delBtn = document.createElement('button');
          delBtn.textContent = '🗑️';
          delBtn.style.cssText = 'background: none; border: none; font-size: 13px; cursor: pointer; opacity: 0.6; padding: 4px;';
          delBtn.title = 'Xóa khỏi sổ tay';
          delBtn.onclick = () => {
            const updated = getSavedWords().filter(w => w.id !== item.id);
            localStorage.setItem('__th_ejoy_saved_words', JSON.stringify(updated));
            row.remove();
          };
          row.appendChild(delBtn);
          listDiv.appendChild(row);
        });
      }
      box.appendChild(listDiv);
      modal.appendChild(box);
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
      document.body.appendChild(modal);
    }
  `;
}
