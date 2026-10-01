import React from 'react';
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
  Copy 
} from 'lucide-react';
import { TranslationSettingsModalProps, ToolItem } from './TranslationSettings.types';
import { useTranslationSettings } from './useTranslationSettings';
import { ToolsTab } from './components/ToolsTab';
import { AdvancedTab } from './components/AdvancedTab';
import { HistoryTab } from './components/HistoryTab';

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
      className="fixed inset-0 z-[200050] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-[#181824] border border-indigo-500/30 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div className="flex items-center justify-between p-2.5 border-b border-white/10 bg-white/5">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            <button 
              type="button"
              onClick={() => setActiveTab('tools')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'tools' ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <BrainCircuit className="w-3.5 h-3.5" /> Tiện Ích
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('advanced')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'advanced' ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Settings className="w-3.5 h-3.5" /> Nâng Cao
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'history' ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <History className="w-3.5 h-3.5" /> Lịch Sử
            </button>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors mr-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(85vh - 65px)' }}>
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
        </div>
      </div>
    </div>
  );
}

export * from './TranslationSettings.types';
