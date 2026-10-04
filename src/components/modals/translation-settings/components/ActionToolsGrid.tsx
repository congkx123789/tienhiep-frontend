import React from 'react';
import { Pin, PinOff } from 'lucide-react';
import { ToolItem } from '../TranslationSettings.types';

interface ActionToolsGridProps {
  tools: ToolItem[];
  pinnedTools: string[];
  isAutoTranslate: boolean;
  onToolAction: (actionId: string) => void;
  onTogglePin: (toolId: string) => void;
  onClose: () => void;
}

export const ActionToolsGrid: React.FC<ActionToolsGridProps> = ({
  tools,
  pinnedTools,
  isAutoTranslate,
  onToolAction,
  onTogglePin,
  onClose,
}) => {
  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kho Tiện Ích Web</label>
        <span className="text-[10px] text-slate-600 bg-white/[0.04] px-2 py-0.5 rounded-full">Nhấn ghim để ghim bên dưới</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {tools.map(tool => {
          const isPinned = pinnedTools.includes(tool.id);

          const bgClasses: Record<string, string> = {
            fuchsia: isAutoTranslate
              ? 'bg-gradient-to-r from-fuchsia-600/80 to-purple-600/80 text-white shadow-[0_0_15px_rgba(192,38,211,0.3)]'
              : 'bg-fuchsia-500/10 text-fuchsia-300 hover:bg-fuchsia-500/18',
            emerald: 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/18',
            blue:    'bg-blue-500/10 text-blue-300 hover:bg-blue-500/18',
            orange:  'bg-orange-500/10 text-orange-300 hover:bg-orange-500/18',
            slate:   'bg-slate-500/10 text-slate-300 hover:bg-slate-500/18',
            red:     'bg-red-500/10 text-red-300 hover:bg-red-500/18',
            violet:  'bg-violet-500/10 text-violet-300 hover:bg-violet-500/18',
            zinc:    'bg-zinc-500/10 text-zinc-300 hover:bg-zinc-500/18',
          };

          return (
            <div key={tool.id} className="relative flex rounded-2xl overflow-hidden group">
              <button
                type="button"
                onClick={() => { onToolAction(tool.id); onClose(); }}
                className={`flex-1 px-3 py-2.5 flex items-center gap-2 font-bold text-xs transition-all ${bgClasses[tool.color] || bgClasses.zinc}`}
              >
                {tool.icon}
                <span className="truncate">{tool.name}</span>
              </button>
              <button
                type="button"
                onClick={() => onTogglePin(tool.id)}
                className={`px-2.5 flex items-center justify-center transition-all ${
                  isPinned
                    ? 'bg-indigo-500/25 text-indigo-300'
                    : 'bg-black/20 text-slate-600 hover:text-slate-300 hover:bg-white/8'
                }`}
                title={isPinned ? 'Bỏ ghim' : 'Ghim ra thanh công cụ'}
              >
                {isPinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
