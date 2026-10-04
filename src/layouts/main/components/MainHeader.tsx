import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Crown, Terminal, MessageSquare, Bell, Minus, Square, X, Menu } from 'lucide-react';
import { FlagIcon } from './FlagIcon';
import { NavItem } from '../MainLayout.types';

interface MainHeaderProps {
  desktopNavItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
  logout: () => void;
  lang: string;
  setLang: (lang: string) => void;
  t: any;
  isElectron: boolean;
  isLinux: boolean;
  isWindowMaximized: boolean;
  showLogConsole: boolean;
  onToggleLogConsole: () => void;
  unreadMsgCount: number;
  unreadNotifCount: number;
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  desktopNavItems, activeTab, onTabChange, user, logout,
  lang, setLang, t, isElectron, isLinux, isWindowMaximized,
  showLogConsole, onToggleLogConsole, unreadMsgCount, unreadNotifCount,
  onOpenAuth, onOpenNotifications, mobileMenuOpen, onToggleMobileMenu
}) => {
  const navigate = useNavigate();
  const win = typeof window !== 'undefined' ? (window as any) : {};
  const dragRef = useRef<{ startScreenX: number; startScreenY: number } | null>(null);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (!isElectron || e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea, [data-no-drag]')) return;

    dragRef.current = { startScreenX: e.screenX, startScreenY: e.screenY };

    const handleMouseMove = (moveEv: MouseEvent) => {
      if (!dragRef.current) return;
      const deltaX = moveEv.screenX - dragRef.current.startScreenX;
      const deltaY = moveEv.screenY - dragRef.current.startScreenY;
      dragRef.current = { startScreenX: moveEv.screenX, startScreenY: moveEv.screenY };
      if (deltaX !== 0 || deltaY !== 0) {
        win.electron?.moveWindow?.(deltaX, deltaY);
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleHeaderDoubleClick = (e: React.MouseEvent) => {
    if (!isElectron) return;
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea, [data-no-drag]')) return;
    win.electron?.maximize?.();
  };

  return (
    <header 
      className={`relative bg-[#1c183a] border-b border-indigo-950/30 shadow-lg sticky top-0 z-[100000] overflow-hidden ${isElectron ? 'select-none cursor-default' : ''}`}
      style={isElectron ? { WebkitAppRegion: 'drag' } : {}}
      onMouseDown={handleHeaderMouseDown}
      onDoubleClick={handleHeaderDoubleClick}
    >
      <div 
        className="max-w-[2200px] mx-auto px-3 sm:px-5 lg:px-8 h-14 flex items-center justify-between gap-2 sm:gap-3"
        style={{ paddingRight: isElectron ? '175px' : undefined, WebkitAppRegion: isElectron ? 'drag' : undefined }}
      >
        {/* LEFT: Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 shrink-0 hover:opacity-90 active:scale-95 transition-all"
          style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}
        >
          <img src="/favicon.png" className="w-9 h-9 object-contain rounded-lg shadow-md border border-white/10" alt="Tiên Hiệp AI Logo" />
          <span className="text-lg font-extrabold text-white leading-tight tracking-wider hidden lg:inline">
            {t.title}
          </span>
        </button>

        {/* CENTER: Desktop tabs */}
        <nav 
          className="hidden sm:flex items-center bg-[#0f0f26]/60 rounded-full p-1 border border-white/5 text-[11px] font-bold gap-0.5 overflow-hidden shrink min-w-0"
          style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}
        >
          {desktopNavItems.map(({ key, icon: Icon, label }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                title={label}
                className={`flex items-center whitespace-nowrap shrink-0 gap-1.5 px-2.5 py-1.5 rounded-full transition-all relative ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className={isActive ? 'inline' : 'hidden'}>
                  {label}
                </span>
                {key === 'settings' && user?.require_password_change === 1 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* RIGHT: Language + Auth */}
        <div 
          className="flex items-center gap-1.5 sm:gap-2 shrink-0 pr-1 z-10" 
          style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}
        >
          <div className="hidden lg:flex bg-[#0f0f26]/60 rounded-full p-0.5 border border-white/5 text-[9px] font-bold">
            {['vi', 'en', 'zh'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                title={l.toUpperCase()}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-full transition-all ${lang === l ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <FlagIcon langCode={l} />
                <span className="hidden 2xl:inline">{l.toUpperCase()}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/vip')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-sm shadow-amber-500/10 shrink-0 cursor-pointer"
            title="Ủng hộ VIP & Mở khóa tool"
          >
            <Crown className="w-3.5 h-3.5 fill-current text-amber-400" />
            <span className="hidden xl:inline">{user?.vip_status === 1 ? '👑 VIP' : 'Ủng Hộ VIP'}</span>
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              {isElectron && (
                <button
                  onClick={onToggleLogConsole}
                  className={`p-1.5 hover:bg-white/5 rounded-lg transition-colors relative ${
                    showLogConsole ? 'text-purple-400 bg-purple-600/10' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Xem Nhật Ký Log"
                >
                  <Terminal className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => navigate('/messages')}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors relative"
                title="Tin nhắn riêng"
              >
                <MessageSquare className="w-4 h-4" />
                {unreadMsgCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-black px-0.5 shadow-md">
                    {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                  </span>
                )}
              </button>

              <button
                onClick={onOpenNotifications}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors relative"
                title="Thông báo thư hữu"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-black px-0.5 shadow-md animate-pulse">
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate('/settings')}
                title={user.display_name || user.username}
                className="text-slate-200 text-xs font-bold hover:text-purple-400 transition-colors flex items-center gap-1.5 bg-[#0f0f26]/40 p-1 2xl:px-2.5 2xl:py-1 rounded-full border border-white/5 hover:border-purple-500/30 transition-all shrink-0"
              >
                {user.avatar ? (
                  <img src={user.avatar} className="w-5 h-5 rounded-full object-cover shrink-0" alt="avatar" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-purple-600/50 flex items-center justify-center text-[9px] font-black shrink-0 text-white">
                    {user.username ? user.username[0].toUpperCase() : 'U'}
                  </span>
                )}
                <span className="hidden 2xl:inline truncate max-w-[90px]">{user.display_name || user.username}</span>
                {user.require_password_change === 1 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                )}
              </button>

              <button
                onClick={logout}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-all shrink-0"
            >
              {t.login}
            </button>
          )}

          <button
            onClick={onToggleMobileMenu}
            className={`sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              mobileMenuOpen
                ? 'bg-purple-600/30 text-purple-200 border-purple-500/50 shadow-sm'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
            style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}
            title={mobileMenuOpen ? "Đóng Menu" : "Mở Menu"}
          >
            {mobileMenuOpen ? (
              <>
                <X className="w-3.5 h-3.5 text-purple-300" />
                <span>Đóng</span>
              </>
            ) : (
              <>
                <Menu className="w-3.5 h-3.5" />
                <span>Menu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isElectron && (
        <div className="absolute right-0 top-0 bottom-0 flex items-stretch h-14 z-[100002]" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="h-5 w-px bg-white/10 self-center mr-1" />
          <button
            onClick={() => win.electron?.minimize?.()}
            className="flex items-center justify-center w-11 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Thu nhỏ"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => win.electron?.maximize?.()}
            className="flex items-center justify-center w-11 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title={isWindowMaximized ? "Thu nhỏ cửa sổ" : "Phóng to"}
          >
            {isWindowMaximized ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="8" width="12" height="12" rx="1.5" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => win.electron?.close?.()}
            className="flex items-center justify-center w-11 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
            title="Đóng ứng dụng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
