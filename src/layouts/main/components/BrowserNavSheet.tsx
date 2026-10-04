import React from 'react';
import { NavItem } from '../MainLayout.types';

interface BrowserNavSheetProps {
  isOpen: boolean;
  isVisible: boolean;
  onClose: () => void;
  bottomNavItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BrowserNavSheet: React.FC<BrowserNavSheetProps> = ({
  isOpen,
  isVisible,
  onClose,
  bottomNavItems,
  activeTab,
  onTabChange,
}) => {
  if (!isOpen || !isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="sm:hidden fixed inset-0 z-[100010] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[100011] bg-[#1c183a] border-t border-white/10 rounded-t-2xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/8">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Điều hướng</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>
        <nav className="flex items-stretch h-16">
          {bottomNavItems.map(({ key, icon: Icon, label }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { onTabChange(key); onClose(); }}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95"
              >
                {isActive && (
                  <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500" />
                )}
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className={`text-[9px] font-bold transition-colors ${isActive ? 'text-purple-400' : 'text-slate-500'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
        {/* safe area padding cho iPhone */}
        <div className="h-safe-bottom pb-4" />
      </div>
    </>
  );
};
