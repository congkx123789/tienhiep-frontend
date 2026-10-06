import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { registerDialogListener, ConfirmState } from '../../../services/dialogService';

export const GlobalConfirmModal: React.FC = () => {
  const [dialog, setDialog] = useState<ConfirmState | null>(null);

  useEffect(() => {
    return registerDialogListener((state) => {
      setDialog(state);
    });
  }, []);

  // Hỗ trợ phím tắt bàn phím: ESC để hủy, Enter để xác nhận
  useEffect(() => {
    if (!dialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dialog.resolve(false);
      } else if (e.key === 'Enter') {
        dialog.resolve(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog]);

  if (!dialog) return null;

  const isDanger = dialog.type === 'danger';
  const isWarning = dialog.type === 'warning';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-[#121225] border border-[#1f1f3a] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp text-left"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            isDanger 
              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
              : isWarning
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
          }`}>
            {isDanger ? (
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            ) : isWarning ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Info className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-base font-black text-white tracking-wide">
              {dialog.title}
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {dialog.message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => dialog.resolve(false)}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            {dialog.cancelText}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => dialog.resolve(true)}
            className={`px-6 py-2.5 rounded-xl text-white text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer ${
              isDanger
                ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
            }`}
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
