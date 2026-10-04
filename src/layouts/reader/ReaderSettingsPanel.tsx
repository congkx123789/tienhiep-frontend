import React from 'react';
import { ZoomIn, ZoomOut, Check } from 'lucide-react';

interface ReaderSettingsPanelProps {
  showSettingsPanel: boolean;
  theme: string;
  setTheme: (t: string) => void;
  fontSize: number;
  decreaseFontSize: () => void;
  increaseFontSize: () => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  lineHeight: string;
  setLineHeight: (lh: string) => void;
}

export const ReaderSettingsPanel: React.FC<ReaderSettingsPanelProps> = ({
  showSettingsPanel,
  theme,
  setTheme,
  fontSize,
  decreaseFontSize,
  increaseFontSize,
  fontFamily,
  setFontFamily,
  lineHeight,
  setLineHeight,
}) => {
  return (
    <div 
      className={`reader-overlay fixed bottom-0 left-0 right-0 z-40 bg-[#0f0f1a]/95 border-t border-[#2d2d6b]/50 p-6 text-slate-100 transition-all duration-300 flex flex-col gap-4 max-w-2xl mx-auto rounded-t-2xl shadow-2xl ${
        showSettingsPanel ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Background themes */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Màu nền</span>
        <div className="flex gap-3">
          {[
            { id: 'light', name: 'Sáng', bg: 'bg-white border-slate-300' },
            { id: 'sepia', name: 'Giấy cổ', bg: 'bg-[#f4ecd8] border-[#5c4033]/20' },
            { id: 'green', name: 'Bảo vệ mắt', bg: 'bg-[#dfedd6] border-[#2e4a3e]/20' },
            { id: 'dark', name: 'Tối', bg: 'bg-[#0b0b14] border-[#1f1f3a]' }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${t.bg} ${
                theme === t.id ? 'scale-110 border-brand-500 shadow-md' : 'opacity-80'
              }`}
              title={t.name}
            >
              {theme === t.id && (
                <Check className={`w-4 h-4 ${t.id === 'light' ? 'text-black' : t.id === 'sepia' ? 'text-[#5c4033]' : t.id === 'green' ? 'text-[#2e4a3e]' : 'text-white'}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font size adjustments */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cỡ chữ</span>
        <div className="flex items-center gap-3">
          <button 
            onClick={decreaseFontSize}
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 rounded-lg transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold w-8 text-center">{fontSize}px</span>
          <button 
            onClick={increaseFontSize}
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 rounded-lg transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Font Family Selection */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Font chữ</span>
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 text-xs">
          {[{ id: 'sans', name: 'Không chân' }, { id: 'serif', name: 'Có chân' }, { id: 'mono', name: 'Đơn cách' }].map(f => (
            <button key={f.id} onClick={() => setFontFamily(f.id)} className={`px-3 py-1.5 rounded-md font-bold transition-all ${fontFamily === f.id ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400'}`}>
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Line heights adjustments */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Giãn dòng</span>
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 text-xs">
          {[{ id: 'normal', name: 'Thường' }, { id: 'relaxed', name: 'Rộng' }, { id: 'loose', name: 'Rất rộng' }].map(lh => (
            <button key={lh.id} onClick={() => setLineHeight(lh.id)} className={`px-3 py-1.5 rounded-md font-bold transition-all ${lineHeight === lh.id ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400'}`}>
              {lh.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
