import React, { useState } from 'react';
import { Sliders, Bell, Compass } from 'lucide-react';

interface TabPreferencesProps {
  d: Record<string, string>;
}

export const TabPreferences: React.FC<TabPreferencesProps> = ({ d }) => {
  const [readerConf, setReaderConf] = useState({
    fontSize: parseInt(localStorage.getItem('reader_fontSize') || '16', 10) || 16,
    fontFamily: localStorage.getItem('reader_fontFamily') || 'font-sans',
    lineHeight: parseFloat(localStorage.getItem('reader_lineHeight') || '1.6') || 1.6,
    theme: localStorage.getItem('reader_theme') || 'dark',
  });

  const [favTags, setFavTags] = useState(['玄幻', '仙侠', '科幻']);
  const [notifications, setNotifications] = useState({
    newChapter: true,
    replies: true,
  });

  const updateReaderConf = (patch: Partial<typeof readerConf>) => {
    const updated = { ...readerConf, ...patch };
    setReaderConf(updated);
    if (patch.fontSize) localStorage.setItem('reader_fontSize', String(patch.fontSize));
    if (patch.fontFamily) localStorage.setItem('reader_fontFamily', patch.fontFamily);
    if (patch.lineHeight) localStorage.setItem('reader_lineHeight', String(patch.lineHeight));
    if (patch.theme) localStorage.setItem('reader_theme', patch.theme);
  };

  const toggleTag = (tag: string) => {
    setFavTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="border-b border-[#1f1f3a]/60 pb-3">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-purple-400" /> {d.readingConf}
        </h3>
        <p className="text-xs text-slate-400 mt-1">Cấu hình được tự động lưu lên đám mây và đồng bộ giữa các thiết bị di động/máy tính.</p>
      </div>

      {/* Reader Settings Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Font Size */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.fontSize} ({readerConf.fontSize}px)</label>
            <input 
              type="range" 
              min="12" 
              max="32" 
              step="1"
              value={readerConf.fontSize}
              onChange={(e) => updateReaderConf({ fontSize: parseInt(e.target.value, 10) })}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Font Family */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.fontFamily}</label>
            <select 
              value={readerConf.fontFamily}
              onChange={(e) => updateReaderConf({ fontFamily: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-slate-300 outline-none"
            >
              <option value="font-sans">Sans-serif (Hiện đại)</option>
              <option value="font-serif">Serif (Cổ điển)</option>
              <option value="font-mono">Monospace (Lập trình viên)</option>
            </select>
          </div>

          {/* Line Height */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.lineHeight}</label>
            <div className="grid grid-cols-3 gap-2">
              {[1.4, 1.6, 1.8].map(lh => (
                <button
                  key={lh}
                  type="button"
                  onClick={() => updateReaderConf({ lineHeight: lh })}
                  className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                    readerConf.lineHeight === lh
                      ? 'bg-purple-600/25 border-purple-500 text-purple-300'
                      : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:text-white'
                  }`}
                >
                  {lh === 1.4 ? d.lineNormal : lh === 1.6 ? d.lineMedium : d.lineWide}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Bg */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.themeBg}</label>
            <div className="grid grid-cols-3 gap-2">
              {['light', 'dark', 'sepia'].map(th => (
                <button
                  key={th}
                  type="button"
                  onClick={() => updateReaderConf({ theme: th })}
                  className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                    readerConf.theme === th
                      ? 'bg-purple-600/25 border-purple-500 text-purple-300'
                      : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:text-white'
                  }`}
                >
                  {th === 'light' ? d.themeLight : th === 'dark' ? d.themeDark : d.themeSepia}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Preview Area */}
        <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-2xl p-4 flex flex-col justify-between space-y-4">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Xem trước hiển thị đọc</span>
          <div 
            className={`p-4 rounded-xl border flex-1 transition-all ${
              readerConf.theme === 'light' 
                ? 'bg-slate-100 text-slate-900 border-slate-200' 
                : readerConf.theme === 'sepia' 
                  ? 'bg-[#f4eccf] text-[#433422] border-[#e4d6a7]' 
                  : 'bg-[#0d0d1e] text-slate-200 border-purple-500/20'
            }`}
            style={{ 
              fontSize: `${readerConf.fontSize}px`, 
              lineHeight: readerConf.lineHeight 
            }}
          >
            <h5 className="font-extrabold mb-2 text-sm">Chương 1: Khởi Đầu Mới</h5>
            <p className={`text-[0.75em] ${readerConf.fontFamily}`}>
              Thế giới này rộng lớn vô cùng. Võ giả rèn luyện khí huyết, đột phá xiềng xích nhân loại, bước lên con đường võ đạo đỉnh phong...
            </p>
          </div>
        </div>
      </div>

      <div className="w-full border-t border-[#1f1f3a]/60 my-4" />

      {/* Favorite Tag Preferences */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.favCategories}</label>
        <div className="flex flex-wrap gap-2">
          {["玄幻", "都市", "言情", "女生", "科幻", "修真", "仙侠", "武侠", "历史", "网游", "同人", "其他"].map(tag => {
            const tagLabel = tag === "玄幻" ? "Huyền Huyễn" : tag === "都市" ? "Đô Thị" : tag === "言情" ? "Ngôn Tình" : tag === "科幻" ? "Khoa Huyễn" : tag === "仙侠" ? "Tiên Hiệp" : tag === "修真" ? "Tu Chân" : tag;
            const isSelected = favTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  isSelected 
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md' 
                    : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:text-white'
                }`}
              >
                {tagLabel} {isSelected && '✓'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full border-t border-[#1f1f3a]/60 my-4" />

      {/* Notification Settings */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.notificationSettings}</label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-[#0b0b14]/50 border border-[#1f1f3a] rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-200 font-bold">{d.notifyNewChapters}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotifications(prev => ({...prev, newChapter: !prev.newChapter}))}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                notifications.newChapter ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                notifications.newChapter ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#0b0b14]/50 border border-[#1f1f3a] rounded-xl">
            <div className="flex items-center gap-3">
              <Compass className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-200 font-bold">{d.notifyReplies}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotifications(prev => ({...prev, replies: !prev.replies}))}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                notifications.replies ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                notifications.replies ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
