import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Crown, Compass, BookMarked, History,
  Settings as SettingsIcon, MessageSquare, Bell, Terminal
} from 'lucide-react';
import { DownloadIcon } from '../../../components';
import { FlagIcon } from './FlagIcon';

interface MobileMenuDrawerProps {
  user: any;
  logout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAuth: () => void;
  onClose: () => void;
  lang: string;
  setLang: (lang: string) => void;
  t: any;
  unreadMsgCount: number;
  unreadNotifCount: number;
  onOpenNotifications: () => void;
  stats: { total: number; duplicates: number };
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  user,
  logout,
  activeTab,
  onTabChange,
  onOpenAuth,
  onClose,
  lang,
  setLang,
  t,
  unreadMsgCount,
  unreadNotifCount,
  onOpenNotifications,
  stats
}) => {
  const navigate = useNavigate();

  return (
    <div className="sm:hidden fixed inset-x-0 top-14 bottom-0 z-[100001] bg-[#0c0c1a]/98 backdrop-blur-2xl border-t border-white/10 overflow-y-auto animate-fadeIn shadow-2xl flex flex-col justify-between">
      <div className="p-4 space-y-4">
        {/* User Profile Card */}
        {user ? (
          <div className="p-3.5 bg-gradient-to-r from-purple-900/30 to-indigo-900/20 rounded-2xl border border-purple-500/20 shadow-inner flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {user.avatar ? (
                <img src={user.avatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/50 shrink-0" alt="avatar" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-sm font-black text-white shrink-0 shadow-md">
                  {user.username ? user.username[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white truncate">{user.display_name || user.username}</p>
                  {user.vip_status === 1 && (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">VIP</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">{user.email || 'Thành viên Tiên Hiệp AI'}</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); onClose(); }}
              className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all shrink-0"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-3 bg-[#13132b] rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Chưa đăng nhập</p>
              <p className="text-[11px] text-slate-400">Đăng nhập để lưu tủ sách & đồng bộ</p>
            </div>
            <button
              onClick={() => { onOpenAuth(); onClose(); }}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all shrink-0"
            >
              {t.login}
            </button>
          </div>
        )}

        {/* Section 1: Main Navigation */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1.5">
            {lang === 'vi' ? 'Điều Hướng Chính' : 'Main Navigation'}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onTabChange('all')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-[#15152e]/60 text-slate-300 hover:bg-[#1f1f42] border border-white/5'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0 text-purple-400" />
              <span className="truncate">{t.tabDiscover}</span>
            </button>

            <button
              onClick={() => onTabChange('bookshelf')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'bookshelf'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-[#15152e]/60 text-slate-300 hover:bg-[#1f1f42] border border-white/5'
              }`}
            >
              <BookMarked className="w-4 h-4 shrink-0 text-indigo-400" />
              <span className="truncate">{t.tabBookshelf}</span>
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-[#15152e]/60 text-slate-300 hover:bg-[#1f1f42] border border-white/5'
              }`}
            >
              <History className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate">{t.tabHistory}</span>
            </button>

            <button
              onClick={() => onTabChange('settings')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-[#15152e]/60 text-slate-300 hover:bg-[#1f1f42] border border-white/5'
              }`}
            >
              <SettingsIcon className="w-4 h-4 shrink-0 text-cyan-400" />
              <span className="truncate">{t.tabSettings}</span>
            </button>
          </div>
        </div>

        {/* Section 2: Community & Tools */}
        <div className="space-y-1 pt-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1.5">
            {lang === 'vi' ? 'Tiện Ích & Tông Môn' : 'Features & Sects'}
          </p>
          
          <button
            onClick={() => onTabChange('vip')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all mb-1 ${
              activeTab === 'vip'
                ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/10 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10'
                : 'bg-[#15152e]/60 text-amber-300/90 hover:bg-[#1f1f42] border border-amber-500/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>{lang === 'vi' ? 'Ủng Hộ VIP & Mở Khóa Tool' : 'VIP & Tools'}</span>
            </div>
            <span className="text-[9px] bg-gradient-to-r from-amber-500 to-yellow-400 text-[#0b0b14] px-1.5 py-0.5 rounded font-black uppercase">
              HOT
            </span>
          </button>

          {user && (
            <button
              onClick={() => onTabChange('sects')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'sects'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-[#15152e]/40 text-slate-300 hover:bg-[#1f1f42] border border-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>{lang === 'vi' ? 'Tông Môn' : lang === 'en' ? 'Sects' : '宗门'}</span>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">Cộng đồng</span>
            </button>
          )}

          {user && (
            <button
              onClick={() => { navigate('/messages'); onClose(); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-[#15152e]/40 text-slate-300 hover:bg-[#1f1f42] border border-white/5 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>{lang === 'vi' ? 'Tin nhắn riêng' : lang === 'en' ? 'Direct Messages' : '私信'}</span>
              </div>
              {unreadMsgCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black px-1.5">
                  {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                </span>
              )}
            </button>
          )}

          {user && (
            <button
              onClick={() => { onOpenNotifications(); onClose(); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-[#15152e]/40 text-slate-300 hover:bg-[#1f1f42] border border-white/5 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>{lang === 'vi' ? 'Thông báo thư hữu' : lang === 'en' ? 'Social Notifications' : '书友通知'}</span>
              </div>
              {unreadNotifCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-black px-1.5">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>
          )}

          {user && (
            <button
              onClick={() => onTabChange('developer')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'developer'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'bg-[#15152e]/40 text-slate-300 hover:bg-[#1f1f42] border border-white/5'
              }`}
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>{t.tabDeveloper}</span>
            </button>
          )}

          <button
            onClick={() => onTabChange('downloads')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'downloads'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'bg-[#15152e]/40 text-slate-300 hover:bg-[#1f1f42] border border-white/5'
            }`}
          >
            <DownloadIcon className="w-4 h-4 text-sky-400" />
            <span>{t.tabDownloads}</span>
          </button>
        </div>

        {/* Section 3: Language Selector */}
        <div className="pt-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1.5">
            {lang === 'vi' ? 'Ngôn Ngữ Ứng Dụng' : 'Language'}
          </p>
          <div className="grid grid-cols-3 gap-1.5 bg-[#0f0f26]/80 p-1 rounded-2xl border border-white/5">
            {[
              { code: 'vi', name: 'Tiếng Việt' },
              { code: 'en', name: 'English' },
              { code: 'zh', name: '中文' }
            ].map(({ code, name }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  lang === code
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <FlagIcon langCode={code} />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer Footer Status */}
      <div className="p-4 border-t border-white/5 bg-[#080812] flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{(stats.total || 931427).toLocaleString()} {lang === 'vi' ? 'truyện' : 'novels'}</span>
          <span>•</span>
          <span>7 {lang === 'vi' ? 'nguồn' : 'sources'}</span>
        </div>
        <span className="font-mono text-[10px] text-slate-600">v1.0.18</span>
      </div>
    </div>
  );
};
