import React from 'react';
import { 
  Globe, 
  Server, 
  Zap, 
  Key, 
  Pin, 
  PinOff 
} from 'lucide-react';
import { TranslationSettingsState, ToolItem } from '../TranslationSettings.types';

interface ToolsTabProps {
  settings: TranslationSettingsState;
  updateSetting: (key: keyof TranslationSettingsState, value: any) => void;
  tools: ToolItem[];
  pinnedTools: string[];
  isAutoTranslate: boolean;
  onToolAction: (actionId: string) => void;
  onTogglePin: (toolId: string) => void;
  onClose: () => void;
}

export const ToolsTab: React.FC<ToolsTabProps> = ({
  settings,
  updateSetting,
  tools,
  pinnedTools,
  isAutoTranslate,
  onToolAction,
  onTogglePin,
  onClose,
}) => {
  return (
    <>
      {/* Language Overview */}
      <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Nguồn</span>
          <span className="text-sm text-slate-200 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Trung Quốc (CN)
          </span>
        </div>
        <Globe className="w-5 h-5 text-indigo-400 opacity-50" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Đích</span>
          <span className="text-sm text-slate-200 font-semibold flex items-center gap-1.5">
            Tiếng Việt (VN) <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </span>
        </div>
      </div>

      {/* Engine Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5" /> Bộ Dịch (Engine)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button 
            type="button"
            onClick={() => updateSetting('engineType', 'browser')}
            className={`p-3 rounded-xl border flex flex-col gap-1 items-start transition-all ${settings.engineType === 'browser' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-100' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
          >
            <span className="font-bold text-sm">Offline Local</span>
            <span className="text-[10px] opacity-70 text-left">Dịch ngay trên máy bạn. Tốc độ cao, không cần mạng.</span>
          </button>
          <button 
            type="button"
            onClick={() => updateSetting('engineType', 'server')}
            className={`p-3 rounded-xl border flex flex-col gap-1 items-start transition-all ${settings.engineType === 'server' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-100' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
          >
            <span className="font-bold text-sm">Cloud AI</span>
            <span className="text-[10px] opacity-70 text-left">Dịch siêu mượt qua Server mạnh mẽ. Yêu cầu VIP.</span>
          </button>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Chế Độ Dịch (4 Phiên Bản C++ Mới & Cổ Điển)
        </label>
        <select 
          value={settings.mode}
          onChange={(e) => updateSetting('mode', e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
        >
          <optgroup label="⚡ Phiên Bản C++ CMLM Mới (Zero-Dependencies, 6ms)">
            <option value="4">Mode 4: Hybrid Chuẩn AI (Trung &gt; Nhật &gt; Anh - Khuyên dùng)</option>
            <option value="1">Mode 1: Tiên Hiệp / Cổ Trang (Ưu tiên Names Trung)</option>
            <option value="2">Mode 2: Anime / Manga Nhật Bản (Romaji Japanese Names)</option>
            <option value="3">Mode 3: Phương Tây / Hiện Đại (English Names)</option>
          </optgroup>
          <optgroup label="📚 Từ Điển Truyền Thống">
            <option value="vietphrase">Vietphrase (Dịch Thô)</option>
            <option value="hanviet">Hán Việt (Âm Hán Việt)</option>
          </optgroup>
          {settings.engineType === 'server' && (
            <optgroup label="👑 Cloud Server Python Fallback">
              <option value="fast">👑 Dịch Nhanh (Server AI)</option>
              <option value="advanced">👑 Nâng Cao (Server AI)</option>
            </optgroup>
          )}
        </select>
      </div>

      {/* Server Config */}
      {settings.engineType === 'server' && (
        <div className="flex flex-col gap-3 p-4 bg-indigo-900/10 rounded-xl border border-indigo-500/20">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide">Server API URL</label>
            <input 
              type="text" 
              value={settings.serverUrl}
              onChange={(e) => updateSetting('serverUrl', e.target.value)}
              placeholder="https://cong123779-tienhiep-api.hf.space"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1">
              <Key className="w-3 h-3" /> VIP Key (Tuỳ chọn)
            </label>
            <input 
              type="password" 
              value={settings.vipKey}
              onChange={(e) => updateSetting('vipKey', e.target.value)}
              placeholder="Nhập mã VIP nếu có"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Action Tools */}
      <div className="flex flex-col gap-3 pt-4 border-t border-white/10 mt-2">
        <div className="flex items-center justify-between">
           <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Kho Tiện Ích Web</label>
           <span className="text-[10px] text-slate-500 font-semibold bg-white/5 px-2 py-0.5 rounded-full">Bấm ghim để ghim ở dưới</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {tools.map(tool => {
             const isPinned = pinnedTools.includes(tool.id);
             
             const colorClasses: Record<string, string> = {
               fuchsia: isAutoTranslate ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 border-fuchsia-400/50 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)]' : 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/20',
               emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20',
               blue: 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20',
               orange: 'bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20',
               slate: 'bg-slate-500/10 border-slate-500/30 text-slate-300 hover:bg-slate-500/20',
               red: 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20',
               violet: 'bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20',
               zinc: 'bg-zinc-500/10 border-zinc-500/30 text-zinc-300 hover:bg-zinc-500/20'
             };

             return (
               <div key={tool.id} className="relative flex group">
                 <button 
                   type="button"
                   onClick={() => { onToolAction(tool.id); onClose(); }}
                   className={`flex-1 p-2.5 rounded-l-xl border-y border-l flex items-center gap-2 font-bold text-xs transition-all ${colorClasses[tool.color] || colorClasses.zinc}`}
                 >
                   {tool.icon} <span className="truncate">{tool.name}</span>
                 </button>
                 <button
                   type="button"
                   onClick={() => onTogglePin(tool.id)}
                   className={`px-2.5 rounded-r-xl border-y border-r border-l-0 flex items-center justify-center transition-all ${isPinned ? 'bg-indigo-500/30 border-indigo-500/50 text-indigo-300 shadow-[inset_0_0_10px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/10'}`}
                   title={isPinned ? 'Bỏ ghim khỏi thanh công cụ' : 'Ghim ra thanh công cụ'}
                 >
                   {isPinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
                 </button>
               </div>
             );
          })}
        </div>
      </div>
    </>
  );
};
