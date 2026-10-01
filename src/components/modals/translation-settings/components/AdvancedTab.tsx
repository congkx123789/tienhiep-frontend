import React from 'react';
import { 
  ArrowDownToLine, 
  Volume2, 
  ShieldX, 
  Wand2 
} from 'lucide-react';
import { TranslationSettingsState } from '../TranslationSettings.types';

interface AdvancedTabProps {
  settings: TranslationSettingsState;
  updateSetting: (key: keyof TranslationSettingsState, value: any) => void;
}

export const AdvancedTab: React.FC<AdvancedTabProps> = ({
  settings,
  updateSetting,
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Scroll Speed */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
          <span><ArrowDownToLine className="w-3.5 h-3.5 inline mr-1" /> Tốc độ tự cuộn (ms/pixel)</span>
          <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">{settings.scrollSpeed}ms</span>
        </label>
        <input 
          type="range" min="10" max="100" step="5"
          value={settings.scrollSpeed}
          onChange={(e) => updateSetting('scrollSpeed', Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <span className="text-[10px] text-slate-500 text-center">Nhỏ gọn = Cuộn cực nhanh. Lớn = Cuộn chậm.</span>
      </div>

      {/* Audio Speed */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
          <span><Volume2 className="w-3.5 h-3.5 inline mr-1" /> Tốc độ Audio Đọc Truyện</span>
          <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">{settings.audioSpeed}x</span>
        </label>
        <input 
          type="range" min="0.5" max="4.0" step="0.05"
          value={settings.audioSpeed}
          onChange={(e) => updateSetting('audioSpeed', Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
      </div>

      {/* Continuous Clean Ads */}
      <div className="flex flex-col gap-3 p-4 bg-red-900/10 rounded-xl border border-red-500/20">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-red-200 flex items-center gap-1.5"><ShieldX className="w-4 h-4"/> Auto-Lọc QC Liên Tục</span>
            <span className="text-[10px] text-red-300/70">Xóa rác liên tục ngầm định thay vì chỉ 1 lần.</span>
          </div>
          <div 
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${settings.continuousClean ? 'bg-red-500' : 'bg-slate-700'}`} 
            onClick={() => updateSetting('continuousClean', !settings.continuousClean)}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.continuousClean ? 'left-5' : 'left-1'}`} />
          </div>
        </label>
      </div>

      {/* Typewriter Effect */}
      <div className="flex flex-col gap-3 p-4 bg-indigo-900/10 rounded-xl border border-indigo-500/20">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-indigo-200 flex items-center gap-1.5"><Wand2 className="w-4 h-4"/> Hiệu Ứng Gõ Chữ (Typewriter)</span>
            <span className="text-[10px] text-indigo-300/70">Tắt đi để văn bản dịch hiện ra NGAY LẬP TỨC (tốc độ cao).</span>
          </div>
          <div 
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${settings.typewriterEffect ? 'bg-indigo-500' : 'bg-slate-700'}`} 
            onClick={() => updateSetting('typewriterEffect', !settings.typewriterEffect)}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.typewriterEffect ? 'left-5' : 'left-1'}`} />
          </div>
        </label>
      </div>

      {/* Advanced Audio Rule Note */}
      <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-xs text-indigo-200">
        <strong>💡 Cơ chế Audio Thông Minh:</strong> Khi chế độ đọc Auto-Audio bật, hệ thống sẽ chờ trang web tải và <em>Dịch hoàn tất 100%</em> sang tiếng Việt rồi mới tiến hành trích xuất chữ và phát âm thanh, đảm bảo bạn không bao giờ phải nghe giọng đọc lỗi.
      </div>
    </div>
  );
};
