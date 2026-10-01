import React from 'react';
import { ShieldAlert, Trash2, History } from 'lucide-react';
import { WebHistoryItem } from '../TranslationSettings.types';

interface HistoryTabProps {
  history?: WebHistoryItem[];
  onToolAction: (actionId: string) => void;
  onNavigate: (url: string) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  history = [],
  onToolAction,
  onNavigate,
}) => {
  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Security & Clean Operations */}
      <div className="flex flex-col gap-2 p-4 bg-orange-950/20 rounded-xl border border-orange-500/20">
        <span className="text-xs font-bold text-orange-400 uppercase tracking-wide flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4" /> Bảo mật & Dữ liệu
        </span>
        
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            type="button"
            onClick={() => { if (confirm('Xóa sạch lịch sử duyệt web?')) onToolAction('clear_history'); }}
            className="p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-[10px] font-bold text-red-300 hover:bg-red-500/25 flex flex-col items-center gap-1 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Lịch Sử</span>
          </button>
          <button
            type="button"
            onClick={() => onToolAction('clear_cache')}
            className="p-2 rounded-lg bg-orange-500/15 border border-orange-500/30 text-[10px] font-bold text-orange-300 hover:bg-orange-500/25 flex flex-col items-center gap-1 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Cache</span>
          </button>
          <button
            type="button"
            onClick={() => onToolAction('clear_cookies')}
            className="p-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-[10px] font-bold text-yellow-300 hover:bg-yellow-500/25 flex flex-col items-center gap-1 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Cookies</span>
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" /> Đã ghé thăm gần đây
        </label>
        
        <div className="flex flex-col gap-1.5 max-h-[40vh] overflow-y-auto pr-1 no-scrollbar">
          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-semibold">
              Chưa có lịch sử duyệt web.
            </div>
          ) : (
            history.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigate(item.url)}
                className="w-full text-left p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all flex flex-col gap-0.5 group"
              >
                <span className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200 truncate w-full">
                  {item.title}
                </span>
                <span className="text-[10px] text-slate-500 font-mono truncate w-full">
                  {item.url}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
