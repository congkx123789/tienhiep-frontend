import React, { useState, useEffect } from 'react';
import {
  X,
  BrainCircuit,
  Settings,
  History,
  Wand2,
  Volume2,
  ArrowDownToLine,
  ArrowRightToLine,
  Moon,
  ShieldX,
  GaugeCircle,
  Copy,
  Smartphone,
  Monitor,
  Cpu
} from 'lucide-react';
import { TranslationSettingsModalProps, ToolItem } from './TranslationSettings.types';
import { useTranslationSettings } from './useTranslationSettings';
import { ToolsTab } from './components/ToolsTab';
import { AdvancedTab } from './components/AdvancedTab';
import { HistoryTab } from './components/HistoryTab';
import { TranslationAndTtsTester } from './components/TranslationAndTtsTester';

export default function TranslationSettingsModal(props: TranslationSettingsModalProps) {
  const {
    isOpen,
    onClose,
    onToolAction,
    isAutoTranslate,
    pinnedTools,
    onTogglePin,
    history = [],
    onNavigate
  } = props;

  const {
    activeTab,
    setActiveTab,
    settings,
    updateSetting,
  } = useTranslationSettings(isOpen);

  // Phát hiện chế độ thiết bị
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const ALL_TOOLS: ToolItem[] = [
    { id: 'translate', name: isAutoTranslate ? 'Đang Auto-Dịch' : 'Bật Auto-Dịch', icon: <Wand2 className="w-4 h-4" />, color: 'fuchsia' },
    { id: 'audio', name: 'Nghe Audio', icon: <Volume2 className="w-4 h-4" />, color: 'emerald' },
    { id: 'scroll', name: 'Tự Cuộn', icon: <ArrowDownToLine className="w-4 h-4" />, color: 'blue' },
    { id: 'next', name: 'Tới Chương', icon: <ArrowRightToLine className="w-4 h-4" />, color: 'orange' },
    { id: 'dark_mode', name: 'Chế Độ Tối', icon: <Moon className="w-4 h-4" />, color: 'slate' },
    { id: 'clean_ads', name: 'Lọc Quảng Cáo', icon: <ShieldX className="w-4 h-4" />, color: 'red' },
    { id: 'force_translate', name: 'Dịch Tức Thì', icon: <GaugeCircle className="w-4 h-4" />, color: 'violet' },
    { id: 'copy_text', name: 'Copy Chữ', icon: <Copy className="w-4 h-4" />, color: 'zinc' },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200050] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:max-w-md bg-[#12121f] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent top bar */}
        <div className="h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-400/60 to-indigo-500/0 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2.5 bg-[#0f0f1c] shrink-0">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'tools', icon: <BrainCircuit className="w-3.5 h-3.5" />, label: 'Tiện Ích' },
              { id: 'advanced', icon: <Settings className="w-3.5 h-3.5" />, label: 'Nâng Cao' },
              { id: 'test', icon: <Cpu className="w-3.5 h-3.5" />, label: 'Test Dịch/TTS' },
              { id: 'history', icon: <History className="w-3.5 h-3.5" />, label: 'Lịch Sử' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Device mode badge */}
            <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
              isMobile
                ? 'bg-violet-500/15 text-violet-300'
                : 'bg-sky-500/15 text-sky-300'
            }`}>
              {isMobile
                ? <><Smartphone className="w-3 h-3" /> Điện Thoại</>
                : <><Monitor className="w-3 h-3" /> Máy Tính</>
              }
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-white/8 rounded-full transition-colors text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Device mode strip — mobile only (below header) */}
        <div className="sm:hidden flex items-center justify-center gap-1.5 py-1.5 bg-[#0f0f1c] shrink-0">
          <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            isMobile ? 'bg-violet-500/20 text-violet-300' : 'bg-sky-500/20 text-sky-300'
          }`}>
            {isMobile
              ? <><Smartphone className="w-3 h-3" /> Chế độ Điện Thoại</>
              : <><Monitor className="w-3 h-3" /> Chế độ Máy Tính</>
            }
          </div>
        </div>

        {/* Thin separator */}
        <div className="h-px bg-white/[0.04] shrink-0" />

        {/* Content */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(88vh - 90px)' }}>
          {activeTab === 'tools' && (
            <ToolsTab
              settings={settings}
              updateSetting={updateSetting}
              tools={ALL_TOOLS}
              pinnedTools={pinnedTools}
              isAutoTranslate={isAutoTranslate}
              onToolAction={onToolAction}
              onTogglePin={onTogglePin}
              onClose={onClose}
              isMobile={isMobile}
            />
          )}

          {activeTab === 'advanced' && (
            <AdvancedTab
              settings={settings}
              updateSetting={updateSetting}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              history={history}
              onToolAction={onToolAction}
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'test' && (
            <div className="animate-fade-in">
              <TranslationAndTtsTester compact />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export * from './TranslationSettings.types';
