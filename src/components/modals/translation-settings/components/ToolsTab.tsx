import React from 'react';
import {
  Globe,
  Server,
  Key,
  Smartphone,
  Monitor
} from 'lucide-react';
import { TranslationSettingsState, ToolItem } from '../TranslationSettings.types';
import { ModeSelector } from './ModeSelector';
import { ActionToolsGrid } from './ActionToolsGrid';

interface ToolsTabProps {
  settings: TranslationSettingsState;
  updateSetting: (key: keyof TranslationSettingsState, value: any) => void;
  tools: ToolItem[];
  pinnedTools: string[];
  isAutoTranslate: boolean;
  onToolAction: (actionId: string) => void;
  onTogglePin: (toolId: string) => void;
  onClose: () => void;
  isMobile?: boolean;
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
  isMobile,
}) => {
  return (
    <>
      {/* Language Overview — borderless */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] rounded-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Nguồn</span>
          <span className="text-sm text-slate-200 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" /> Trung Quốc (CN)
          </span>
        </div>
        <Globe className="w-5 h-5 text-indigo-400/40" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Đích</span>
          <span className="text-sm text-slate-200 font-semibold flex items-center gap-1.5">
            Tiếng Việt (VN) <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          </span>
        </div>
      </div>

      {/* Device mode indicator (inline) */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
          isMobile ? 'bg-violet-500/10 text-violet-400' : 'bg-sky-500/10 text-sky-400'
        }`}>
          {isMobile ? <><Smartphone className="w-3 h-3" /> Điện Thoại</> : <><Monitor className="w-3 h-3" /> Máy Tính</>}
        </div>
        <span className="text-[10px] text-slate-600">— Giao diện tối ưu cho thiết bị của bạn</span>
      </div>

      {/* Engine Selection — no borders, use background contrast */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5" /> Bộ Dịch (Engine)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => updateSetting('engineType', 'browser')}
            className={`p-3 rounded-2xl flex flex-col gap-1 items-start transition-all ${
              settings.engineType === 'browser'
                ? 'bg-indigo-500/25 text-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.07]'
            }`}
          >
            <span className="font-bold text-sm">Offline Local</span>
            <span className="text-[10px] opacity-60 text-left leading-relaxed">Dịch ngay trên máy bạn. Tốc độ cao, không cần mạng.</span>
          </button>
          <button
            type="button"
            onClick={() => updateSetting('engineType', 'server')}
            className={`p-3 rounded-2xl flex flex-col gap-1 items-start transition-all ${
              settings.engineType === 'server'
                ? 'bg-indigo-500/25 text-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.07]'
            }`}
          >
            <span className="font-bold text-sm">Native Core (LAN)</span>
            <span className="text-[10px] opacity-60 text-left leading-relaxed">Dịch C++ CMLM NAT & Flat Trie qua server nội bộ (3ms).</span>
          </button>
        </div>
      </div>

      {/* Mode Selection */}
      <ModeSelector
        currentMode={settings.mode}
        engineType={settings.engineType}
        onSelectMode={(modeId) => updateSetting('mode', modeId)}
      />

      {/* Server Config — no border */}
      {settings.engineType === 'server' && (
        <div className="flex flex-col gap-3 p-4 bg-indigo-500/[0.06] rounded-2xl">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide">Server API URL</label>
            <input
              type="text"
              value={settings.serverUrl}
              onChange={(e) => updateSetting('serverUrl', e.target.value)}
              placeholder="http://127.0.0.1:5051"
              className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
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
              className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
            />
          </div>
        </div>
      )}

      {/* Action Tools */}
      <ActionToolsGrid
        tools={tools}
        pinnedTools={pinnedTools}
        isAutoTranslate={isAutoTranslate}
        onToolAction={onToolAction}
        onTogglePin={onTogglePin}
        onClose={onClose}
      />
    </>
  );
};
