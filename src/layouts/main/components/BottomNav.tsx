import React from 'react';
import { NavItem } from '../MainLayout.types';

interface BottomNavProps {
  bottomNavItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
  isElectron: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  bottomNavItems,
  activeTab,
  onTabChange,
  user,
  isElectron
}) => {
  return (
    <nav 
      className="sm:hidden fixed bottom-0 left-0 right-0 z-[100001] bg-[#1c183a]/95 backdrop-blur-md border-t border-white/8 safe-bottom select-none"
      style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}
    >
      <div className="flex items-stretch h-16">
        {bottomNavItems.map(({ key, icon: Icon, label }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95"
            >
              {isActive && (
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500 nav-active" />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-purple-400' : 'text-slate-500'
                }`}
              />
              <span
                className={`text-[9px] font-bold transition-colors ${
                  isActive ? 'text-purple-400' : 'text-slate-600'
                }`}
              >
                {label}
              </span>
              {key === 'settings' && user?.require_password_change === 1 && (
                <span className="absolute top-2.5 right-[calc(50%-10px)] flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
