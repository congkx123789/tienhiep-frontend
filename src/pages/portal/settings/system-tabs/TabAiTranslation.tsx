import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { TranslationSettings } from '../Settings.types';

interface TabAiTranslationProps {
  translationSettings: TranslationSettings;
  updateTranslationSetting: (key: string, value: any) => void;
}

export const TabAiTranslation: React.FC<TabAiTranslationProps> = ({
  translationSettings,
  updateTranslationSetting,
}) => {
  return (
    <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
      <div className="border-b border-[#1f1f3a]/60 pb-3">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-400" /> Cấu hình Dịch thuật & Cloud AI
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Cấu hình máy chủ dịch thuật và khóa VIP cho các chế độ dịch máy nâng cao.
        </p>
      </div>

      <div className="space-y-4">
        {/* Engine Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Bộ Dịch (Engine)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => updateTranslationSetting('engineType', 'browser')}
              className={`p-4 rounded-xl border flex flex-col gap-1 items-start transition-all text-left ${
                translationSettings.engineType === 'browser' 
                  ? 'bg-purple-600/20 border-purple-500 text-purple-200' 
                  : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:bg-white/[0.02]'
              }`}
            >
              <span className="font-bold text-sm text-white">Offline Local</span>
              <span className="text-[10px] opacity-70">Dịch ngay trên trình duyệt/máy của bạn. Tốc độ cao, không cần mạng.</span>
            </button>
            <button 
              type="button"
              onClick={() => updateTranslationSetting('engineType', 'server')}
              className={`p-4 rounded-xl border flex flex-col gap-1 items-start transition-all text-left ${
                translationSettings.engineType === 'server' 
                  ? 'bg-purple-600/20 border-purple-500 text-purple-200' 
                  : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:bg-white/[0.02]'
              }`}
            >
              <span className="font-bold text-sm text-white">Cloud AI Server</span>
              <span className="text-[10px] opacity-70">Dịch siêu mượt qua Server đám mây mạnh mẽ. Yêu cầu VIP key.</span>
            </button>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Chế Độ Dịch (Mode)
          </label>
          <select 
            value={translationSettings.mode}
            onChange={(e) => updateTranslationSetting('mode', e.target.value)}
            className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-purple-500 transition-colors"
          >
            <optgroup label="⚡ Phiên Bản C++ CMLM Mới (Zero-Dependencies, 6ms)">
              <option value="4">Mode 4: Hybrid Chuẩn AI (Trung &gt; Nhật &gt; Anh - Khuyên dùng)</option>
              <option value="1">Mode 1: Tiên Hiệp / Cổ Trang (Ưu tiên Names Trung)</option>
              <option value="2">Mode 2: Anime / Manga Nhật Bản (Romaji Japanese Names)</option>
              <option value="3">Mode 3: Phương Tây / Hiện Đại (English Names)</option>
            </optgroup>
            <optgroup label="📚 Từ Điển Truyền Thống">
              <option value="vietphrase">Vietphrase (Dịch Thô Local)</option>
              <option value="hanviet">Hán Việt (Âm Hán Việt Local)</option>
            </optgroup>
            {translationSettings.engineType === 'server' && (
              <optgroup label="👑 Cloud Server Python Fallback">
                <option value="fast">👑 Dịch Nhanh (Server AI)</option>
                <option value="advanced">👑 Nâng Cao (Server AI)</option>
                <option value="advanced_hanviet">👑 Nâng Cao Hán-Việt (Server AI)</option>
              </optgroup>
            )}
          </select>
        </div>

        {/* Server API URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Server API URL
          </label>
          <input 
            type="text" 
            value={translationSettings.serverUrl}
            onChange={(e) => updateTranslationSetting('serverUrl', e.target.value)}
            placeholder="https://cong123779-tienhiep-api.hf.space"
            className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* VIP Key */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
            VIP Key / API Key Dịch Thuật
          </label>
          <input 
            type="password" 
            value={translationSettings.vipKey}
            onChange={(e) => updateTranslationSetting('vipKey', e.target.value)}
            placeholder="Nhập mã VIP / API Key của bạn để sử dụng Cloud AI"
            className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 transition-colors"
          />
          <p className="text-[10px] text-slate-500">
            Mã này được gửi kèm trong header yêu cầu dịch thuật tới server. Bạn có thể mua VIP key hoặc tạo ở trang API Developer.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-purple-300 leading-relaxed">
        <strong>💡 Gợi ý:</strong> Cài đặt dịch thuật này sẽ áp dụng trực tiếp cho tất cả các chương truyện khi bạn đọc bằng Trình duyệt nguồn thô hoặc nhập truyện offline.
      </div>
    </div>
  );
};
