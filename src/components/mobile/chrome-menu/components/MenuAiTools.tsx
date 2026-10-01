import React from 'react';
import { 
  BrainCircuit, 
  Languages, 
  Volume2, 
  ShieldAlert 
} from 'lucide-react';

interface MenuAiToolsProps {
  onOpenTranslationSettings?: () => void;
  isAutoTranslate: boolean;
  onToggleTranslate: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  cleanAdsActive: boolean;
  onToggleCleanAds: () => void;
  onClose: () => void;
}

export const MenuAiTools: React.FC<MenuAiToolsProps> = ({
  onOpenTranslationSettings,
  isAutoTranslate,
  onToggleTranslate,
  isAudioPlaying,
  onToggleAudio,
  cleanAdsActive,
  onToggleCleanAds,
  onClose,
}) => {
  return (
    <>
      <div className="h-px bg-white/5 my-1" />

      {/* Tiện ích Đọc Truyện & AI */}
      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        Tiện ích Đọc & Dịch AI
      </div>

      {/* Bảng công cụ & Cài đặt dịch */}
      <button
        type="button"
        onClick={() => { if (onOpenTranslationSettings) onOpenTranslationSettings(); onClose(); }}
        className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <span>Bảng công cụ & Cài đặt dịch</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300">
          MỞ
        </span>
      </button>

      {/* Auto Translate Toggle */}
      <button
        type="button"
        onClick={() => { onToggleTranslate(); onClose(); }}
        className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <Languages className={`w-4 h-4 ${isAutoTranslate ? 'text-pink-400' : 'text-slate-400'}`} />
          <span>Dịch thuật AI (Tự động)</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isAutoTranslate ? 'bg-pink-600/30 text-pink-300' : 'bg-white/5 text-slate-500'
        }`}>
          {isAutoTranslate ? 'BẬT' : 'TẮT'}
        </span>
      </button>

      {/* Auto TTS Read Toggle */}
      <button
        type="button"
        onClick={() => { onToggleAudio(); onClose(); }}
        className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <Volume2 className={`w-4 h-4 ${isAudioPlaying ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>Đọc giọng nói TTS</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isAudioPlaying ? 'bg-amber-600/30 text-amber-300' : 'bg-white/5 text-slate-500'
        }`}>
          {isAudioPlaying ? 'ĐANG PHÁT' : 'TẮT'}
        </span>
      </button>

      {/* Clean Ads Toggle */}
      <button
        type="button"
        onClick={() => { onToggleCleanAds(); onClose(); }}
        className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <ShieldAlert className={`w-4 h-4 ${cleanAdsActive ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>Chặn QC & Pop-up rác</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          cleanAdsActive ? 'bg-emerald-600/30 text-emerald-300' : 'bg-white/5 text-slate-500'
        }`}>
          {cleanAdsActive ? 'BẬT' : 'TẮT'}
        </span>
      </button>
    </>
  );
};
