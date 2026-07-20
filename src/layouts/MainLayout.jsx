import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, Crown, Compass, BookMarked, History,
  Terminal, BookOpen, Settings as SettingsIcon, Menu, X, ChevronDown, MessageSquare, Bell,
  Minus, Square, Globe, Sparkles
} from 'lucide-react';
import DownloadIcon from '../components/DownloadIcon';
import AuthModal from '../components/AuthModal';
import VipModal from '../components/VipModal';
import SystemTicker from '../components/SystemTicker';
import Footer from '../components/Footer';
import SocialDrawer from '../components/SocialDrawer';
import api from '../services/api';
import { useBrowser } from '../contexts/BrowserContext';
import { useAutoUpdate } from '../hooks/useAutoUpdate';

const FlagIcon = ({ langCode }) => {
  if (langCode === 'vi') {
    return (
      <svg className="w-4 h-3 rounded-sm inline-block object-cover shadow-sm mr-1 shrink-0" viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="30" height="20" fill="#da251d" />
        <polygon points="15,4 16.2,8.5 20.7,8.5 17.1,11.2 18.3,15.7 15,13 11.7,15.7 12.9,11.2 9.3,8.5 13.8,8.5" fill="#ffff00" />
      </svg>
    );
  }
  if (langCode === 'en') {
    return (
      <svg className="w-4 h-3 rounded-sm inline-block object-cover shadow-sm mr-1 shrink-0" viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="30" height="20" fill="#b22234" />
        <rect y="1.54" width="30" height="1.54" fill="#ffffff" />
        <rect y="4.62" width="30" height="1.54" fill="#ffffff" />
        <rect y="7.7" width="30" height="1.54" fill="#ffffff" />
        <rect y="10.78" width="30" height="1.54" fill="#ffffff" />
        <rect y="13.86" width="30" height="1.54" fill="#ffffff" />
        <rect y="16.94" width="30" height="1.54" fill="#ffffff" />
        <rect width="13" height="10.8" fill="#3c3b6e" />
        <circle cx="2.5" cy="2.5" r="0.6" fill="#ffffff" />
        <circle cx="6.5" cy="2.5" r="0.6" fill="#ffffff" />
        <circle cx="10.5" cy="2.5" r="0.6" fill="#ffffff" />
        <circle cx="4.5" cy="5.5" r="0.6" fill="#ffffff" />
        <circle cx="8.5" cy="5.5" r="0.6" fill="#ffffff" />
        <circle cx="2.5" cy="8.5" r="0.6" fill="#ffffff" />
        <circle cx="6.5" cy="8.5" r="0.6" fill="#ffffff" />
        <circle cx="10.5" cy="8.5" r="0.6" fill="#ffffff" />
      </svg>
    );
  }
  if (langCode === 'zh') {
    return (
      <svg className="w-4 h-3 rounded-sm inline-block object-cover shadow-sm mr-1 shrink-0" viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="30" height="20" fill="#de2110" />
        <polygon points="5,5 6.2,9 9.8,7.8 7.3,11 8.5,15 5.5,12.5 2.5,15 3.7,11 1.2,7.8 4.8,9" fill="#ffde00" />
      </svg>
    );
  }
  return null;
};

export default function MainLayout({ children, hideHeader = false, stats = { total: 931427, duplicates: 0 } }) {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const isElectron = typeof window !== 'undefined' && !!window.electron;
  const { tabs, isVisible, setIsVisible } = useBrowser() || { tabs: [] };
  const { updateInfo, dismissUpdate, startUpdate } = useAutoUpdate();

  // Update download progress state (for Electron inline update)
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateDownloading, setUpdateDownloading] = useState(false);
  const [updateDlStatus, setUpdateDlStatus] = useState('');

  const handleStartUpdate = async () => {
    if (!updateInfo) return;
    if (!isElectron) { navigate('/downloads'); return; }
    setUpdateDownloading(true);
    setUpdateProgress(0);
    setUpdateDlStatus(lang === 'vi' ? 'Đang kết nối...' : 'Connecting...');
    try {
      const result = await startUpdate((data) => {
        if (data?.percent != null) {
          setUpdateProgress(data.percent);
          setUpdateDlStatus(
            lang === 'vi'
              ? `Đang tải ${data.percent}% (${(data.downloadedBytes/1024/1024).toFixed(1)}MB / ${(data.totalBytes/1024/1024).toFixed(1)}MB)`
              : `Downloading ${data.percent}% (${(data.downloadedBytes/1024/1024).toFixed(1)}MB / ${(data.totalBytes/1024/1024).toFixed(1)}MB)`
          );
        }
      });
      
      if (result && result.success === false) {
        setUpdateDownloading(false);
        alert(lang === 'vi' ? `Lỗi cập nhật: ${result.error}` : `Update error: ${result.error}`);
      } else {
        setUpdateDlStatus(lang === 'vi' ? '✅ Hoàn tất! Đang khởi chạy...' : '✅ Complete! Launching...');
      }
    } catch (e) {
      setUpdateDownloading(false);
      alert('Update error: ' + e.message);
    }
  };

  const [authOpen, setAuthOpen] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [socialTab, setSocialTab] = useState('friends');
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [showLogConsole, setShowLogConsole] = useState(false);

  const [missingEngine, setMissingEngine] = useState(false);

  useEffect(() => {
    if (!isElectron) return;
    window.electron.isMaximized().then(setIsWindowMaximized);
    const unsubscribe = window.electron.onWindowStateChange(setIsWindowMaximized);

    // Kiểm tra trạng thái backend ngay khi mount
    if (window.electron.checkBackendStatus) {
      window.electron.checkBackendStatus().then((status) => {
        if (status && status.error === 'missing_engine') {
          setMissingEngine(true);
        }
      });
    }

    // Lắng nghe thay đổi trạng thái backend
    const unsubscribeBackend = window.electron.onBackendReady(({ ready, error }) => {
      if (!ready && error === 'missing_engine') {
        setMissingEngine(true);
      } else if (ready) {
        setMissingEngine(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeBackend) unsubscribeBackend();
    };
  }, [isElectron]);

  useEffect(() => {
    const handleToggle = () => setShowLogConsole(v => !v);
    const handleOpenAuth = () => setAuthOpen(true);
    
    window.addEventListener('toggle-log-console', handleToggle);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    
    return () => {
      window.removeEventListener('toggle-log-console', handleToggle);
      window.removeEventListener('open-auth-modal', handleOpenAuth);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadMsgCount(0);
      setUnreadNotifCount(0);
      return;
    }
    const fetchUnread = async () => {
      try {
        const res = await api.get('/api/notifications/unread-counts');
        if (res.data) {
          setUnreadMsgCount(res.data.messages || 0);
          setUnreadNotifCount(res.data.notifications || 0);
        }
      } catch (e) {
        // fallback: try old endpoint
        try {
          const res2 = await api.get('/api/notifications/personal');
          if (res2.data && res2.data.notifications) {
            const unread = res2.data.notifications.filter(n => !n.is_read).length;
            setUnreadNotifCount(unread);
          }
        } catch {}
      }
    };
    fetchUnread();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchUnread();
      }
    }, 20000); // Tăng từ 10s lên 20s
    return () => clearInterval(interval);
  }, [user]);

  const getActiveTab = () => {
    if (location.pathname === '/')          return 'all';
    if (location.pathname === '/bookshelf') return 'bookshelf';
    if (location.pathname === '/history')   return 'history';
    if (location.pathname === '/developer') return 'developer';
    if (location.pathname === '/downloads') return 'downloads';
    if (location.pathname === '/embed')     return 'embed';
    if (location.pathname === '/settings')  return 'settings';
    if (location.pathname === '/sects')     return 'sects';
    return 'all';
  };

  const handleTabChange = (tab) => {
    setMobileMenuOpen(false);
    if (tab === 'browser') {
      if (setIsVisible) setIsVisible(true);
      return;
    }
    if (setIsVisible) setIsVisible(false);

    if (tab === 'all')       navigate('/');
    if (tab === 'bookshelf') navigate('/bookshelf');
    if (tab === 'history')   navigate('/history');
    if (tab === 'developer') navigate('/developer');
    if (tab === 'downloads') navigate('/downloads');
    if (tab === 'embed')     navigate('/embed');
    if (tab === 'settings')  navigate('/settings');
    if (tab === 'sects')     navigate('/sects');
  };

  const activeTab = isVisible ? 'browser' : getActiveTab();

  // Bottom nav items (mobile only — 5 main tabs including browser)
  const bottomNavItems = [
    { key: 'browser',   icon: Globe,        label: lang === 'vi' ? 'Trình duyệt' : 'Browser' },
    { key: 'all',       icon: Compass,      label: t.tabDiscover   },
    { key: 'bookshelf', icon: BookMarked,    label: t.tabBookshelf  },
    { key: 'history',   icon: History,       label: t.tabHistory    },
    { key: 'settings',  icon: SettingsIcon,  label: t.tabSettings   },
  ];

  const isAdmin = user && ['admin', 'havucong25', 'congkx123789'].includes(user.username);

  // Desktop tab items (full set)
  const desktopNavItems = [
    { key: 'browser',   icon: Globe,       label: lang === 'vi' ? 'Trình duyệt' : 'Browser' },
    { key: 'all',       icon: Compass,     label: t.tabDiscover  },
    { key: 'bookshelf', icon: BookMarked,  label: t.tabBookshelf },
    { key: 'history',   icon: History,     label: t.tabHistory   },
    ...(user ? [{ key: 'developer', icon: Terminal,    label: lang === 'vi' ? 'API Key & AI' : 'API Key' }] : []),
    { key: 'downloads', icon: DownloadIcon,    label: t.tabDownloads },
    { key: 'embed',     icon: BookOpen,    label: t.tabEmbed     },
    ...(user ? [
      { key: 'sects', icon: Crown, label: lang === 'vi' ? 'Tông Môn' : 'Sects' },
      { key: 'settings', icon: SettingsIcon, label: t.tabSettings }
    ] : []),
  ];


  return (
    <div className={`min-h-screen min-h-[100dvh] flex flex-col bg-[#0b0b14] text-slate-100`}>

      {/* ─── HEADER ─── */}
      {!hideHeader && (
        <header 
          className={`relative bg-[#1c183a] border-b border-indigo-950/30 shadow-lg sticky top-0 z-40 ${isElectron ? 'select-none' : ''}`}
          style={isElectron ? { WebkitAppRegion: 'drag' } : {}}
        >
          <div 
            className="max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-12 h-14 flex items-center justify-between gap-3"
            style={{
              paddingRight: isElectron ? '144px' : undefined
            }}
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
              className="hidden sm:flex bg-[#0f0f26]/60 rounded-full p-1 border border-white/5 text-[11px] font-bold gap-0.5"
              style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}
            >
              {desktopNavItems.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  title={label}
                  className={`flex items-center whitespace-nowrap shrink-0 gap-1 px-2 py-1 lg:gap-1.5 lg:px-3.5 lg:py-1.5 rounded-full transition-all relative ${
                    activeTab === key
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden 2xl:inline">{label}</span>
                  {key === 'settings' && user?.require_password_change === 1 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* RIGHT: Language + Auth */}
            <div className="flex items-center gap-2 shrink-0" style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}>
              {/* Language switcher */}
              <div className="hidden sm:flex bg-[#0f0f26]/60 rounded-full p-0.5 border border-white/5 text-[9px] font-bold">
                {['vi', 'en', 'zh'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    title={l.toUpperCase()}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${lang === l ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <FlagIcon langCode={l} />
                    <span className="hidden 2xl:inline">{l.toUpperCase()}</span>
                  </button>
                ))}
              </div>

              {/* Auth */}
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  {/* Xem Log Console (chỉ Desktop) */}
                  {isElectron && (
                    <button
                      onClick={() => setShowLogConsole(v => !v)}
                      className={`p-1.5 hover:bg-white/5 rounded-lg transition-colors relative ${
                        showLogConsole ? 'text-purple-400 bg-purple-600/10' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Xem Nhật Ký Log"
                    >
                      <Terminal className="w-4 h-4" />
                    </button>
                  )}

                  {/* Tin nhắn riêng */}
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

                  {/* Thông báo thư hữu */}
                  <button
                    onClick={() => { setSocialTab('notifications'); setSocialOpen(true); }}
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
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-all shrink-0"
                >
                  {t.login}
                </button>
              )}

              {/* Mobile Shortcuts */}
              <div className="flex sm:hidden items-center gap-1 mr-1" style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}>
                {user && (
                  <button
                    onClick={() => handleTabChange('sects')}
                    className={`p-1 rounded-lg transition-colors ${activeTab === 'sects' ? 'text-purple-400 bg-purple-600/10' : 'text-slate-400 hover:text-white'}`}
                    title={lang === 'vi' ? 'Tông Môn' : 'Sects'}
                  >
                    <Crown className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleTabChange('downloads')}
                  className={`p-1 rounded-lg transition-colors ${activeTab === 'downloads' ? 'text-purple-400 bg-purple-600/10' : 'text-slate-400 hover:text-white'}`}
                  title={t.tabDownloads}
                >
                  <DownloadIcon className="w-4.5 h-4.5" />
                </button>
                {user && (
                  <>
                    <button
                      onClick={() => navigate('/messages')}
                      className={`p-1 rounded-lg transition-colors relative ${location.pathname === '/messages' ? 'text-purple-400 bg-purple-600/10' : 'text-slate-400 hover:text-white'}`}
                      title="Tin nhắn riêng"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {unreadMsgCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 bg-rose-500 text-white rounded-full flex items-center justify-center text-[7px] font-black px-0.5 shadow-md">
                          {unreadMsgCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => { setSocialTab('notifications'); setSocialOpen(true); }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors relative"
                      title="Thông báo thư hữu"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadNotifCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 bg-amber-500 text-white rounded-full flex items-center justify-center text-[7px] font-black px-0.5 shadow-md animate-pulse">
                          {unreadNotifCount}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Mobile: hamburger (for developer tab not in bottom nav + user menu) */}
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                className="sm:hidden p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Electron Window Controls */}
          {isElectron && (
            <div className="absolute right-0 top-0 bottom-0 flex items-stretch h-14" style={{ WebkitAppRegion: 'no-drag' }}>
              <button
                onClick={() => window.electron.minimize()}
                className="flex items-center justify-center w-12 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Thu nhỏ"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.electron.maximize()}
                className="flex items-center justify-center w-12 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
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
                onClick={() => window.electron.close()}
                className="flex items-center justify-center w-12 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile dropdown menu (for extra items + user info) */}
          {mobileMenuOpen && (
            <div 
              className="sm:hidden border-t border-white/5 bg-[#1c183a] animate-fadeIn"
              style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}
            >
              <div className="px-4 py-3 space-y-1">
                {/* Developer tab (not in bottom nav) */}
                {user && (
                  <button
                    onClick={() => handleTabChange('developer')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === 'developer'
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                    {t.tabDeveloper}
                  </button>
                )}

                {/* Downloads tab */}
                <button
                  onClick={() => handleTabChange('downloads')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'downloads'
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <DownloadIcon className="w-4 h-4" />
                  {t.tabDownloads}
                </button>

                {/* Sects tab (Tông Môn) - only visible if logged in */}
                {user && (
                  <button
                    onClick={() => handleTabChange('sects')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === 'sects'
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    {lang === 'vi' ? 'Tông Môn' : lang === 'en' ? 'Sects' : '宗门'}
                  </button>
                )}

                {/* Language switcher in mobile menu */}
                <div className="h-px bg-white/5 my-2" />
                <div className="px-3 py-1.5">
                  <p className="text-xs text-slate-400 mb-2 font-semibold">
                    {lang === 'vi' ? 'Ngôn ngữ' : lang === 'en' ? 'Language' : '语言'}
                  </p>
                  <div className="flex bg-[#0f0f26]/60 rounded-full p-0.5 border border-white/5 text-xs font-bold w-fit">
                    {['vi', 'en', 'zh'].map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${lang === l ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        <FlagIcon langCode={l} />
                        <span>{l === 'vi' ? 'VI' : l === 'en' ? 'EN' : 'ZH'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* User info on mobile */}
                {user ? (
                  <>
                    <div className="h-px bg-white/5 my-2" />
                    {/* Tin nhắn riêng on mobile */}
                    <button
                      onClick={() => { navigate('/messages'); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-all relative"
                    >
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      {lang === 'vi' ? 'Tin nhắn riêng' : lang === 'en' ? 'Direct Messages' : '私信'}
                      {unreadMsgCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black px-1">
                          {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                        </span>
                      )}
                    </button>

                    {/* Thông báo thư hữu on mobile */}
                    <button
                      onClick={() => { setSocialTab('notifications'); setSocialOpen(true); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-all relative"
                    >
                      <Bell className="w-4 h-4 text-amber-400" />
                      {lang === 'vi' ? 'Thông báo thư hữu' : lang === 'en' ? 'Social Notifications' : '书友通知'}
                      {unreadNotifCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-black px-1">
                          {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                        </span>
                      )}
                    </button>
                    <div className="flex items-center justify-between px-3 py-2 bg-[#0f0f26]/20 rounded-xl border border-white/5 mt-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{user.username}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold shrink-0"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {lang === 'vi' ? 'Đăng xuất' : lang === 'en' ? 'Logout' : '退出'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-3 py-2">
                    <button
                      onClick={() => { setAuthOpen(true); setMobileMenuOpen(false); }}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl text-sm font-bold shadow-md transition-all"
                    >
                      {t.login}
                    </button>
                  </div>
                )}

                {/* Stats on mobile */}
                <div className="flex items-center gap-4 px-3 py-2 text-[10px] text-slate-500">
                  <span>{(stats.total || 931427).toLocaleString()} {lang === 'vi' ? 'truyện' : lang === 'en' ? 'novels' : '本'}</span>
                  <span>•</span>
                  <span>7 {lang === 'vi' ? 'nguồn' : lang === 'en' ? 'sources' : '源'}</span>
                </div>
              </div>
            </div>
          )}
        </header>
      )}

      {!hideHeader && <SystemTicker />}

      {/* ─── MISSING ENGINE BANNER (Electron only) ─── */}
      {!hideHeader && isElectron && missingEngine && (
        <div className="bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-b border-rose-500/30 px-4 py-2.5 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <div className="min-w-0">
              <span className="text-white font-bold text-xs">
                {lang === 'vi'
                  ? '⚠️ LỖI: Không tìm thấy Động Cơ AI Offline (App_Doc_Truyen_Engine)!'
                  : '⚠️ ERROR: Offline AI Engine not found (App_Doc_Truyen_Engine)!'}
              </span>
              <span className="text-rose-200 text-[10px] ml-2 hidden sm:inline">
                {lang === 'vi'
                  ? '— Vui lòng tải động cơ CPU hoặc GPU trong Cài đặt để sử dụng tính năng đọc truyện offline.'
                  : '— Please download the CPU or GPU engine in Settings to use offline reading.'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleTabChange('settings')}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition-all shadow-lg whitespace-nowrap"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              {lang === 'vi' ? 'Đi tới Cài đặt tải ngay' : 'Go to Settings to download'}
            </button>
          </div>
        </div>
      )}

      {/* ─── UPDATE BANNER ─── */}
      {!hideHeader && updateInfo?.hasUpdate && !updateDownloading && (
        <div className="bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-indigo-900/80 border-b border-purple-500/30 px-4 py-2.5 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <span className="text-white font-bold text-xs">
                {lang === 'vi'
                  ? `🎉 Phiên bản mới v${updateInfo.latestVersion} đã có!`
                  : `🎉 New version v${updateInfo.latestVersion} available!`}
              </span>
              {updateInfo.releaseNotes && (
                <span className="text-purple-200 text-[10px] ml-2 hidden sm:inline truncate">
                  — {updateInfo.releaseNotes}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-start-update"
              onClick={handleStartUpdate}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition-all shadow-lg whitespace-nowrap"
            >
              <DownloadIcon className="w-3 h-3" />
              {lang === 'vi'
                ? (isElectron ? 'Cập nhật ngay' : 'Xem tải về')
                : (isElectron ? 'Update Now' : 'View Downloads')}
            </button>
            <button
              onClick={dismissUpdate}
              className="p-1 text-purple-300 hover:text-white transition-colors rounded"
              title={lang === 'vi' ? 'Bỏ qua' : 'Dismiss'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── UPDATE DOWNLOAD OVERLAY (Electron only) ─── */}
      {updateDownloading && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#131324] border border-purple-500/30 rounded-3xl p-7 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <Sparkles className="w-8 h-8 text-purple-400 mx-auto animate-pulse" />
            <h3 className="text-base font-extrabold text-white">
              {lang === 'vi' ? '⬇️ Đang tải cập nhật...' : '⬇️ Downloading update...'}
            </h3>
            <p className="text-[11px] text-slate-300">{updateDlStatus}</p>
            <div className="w-full bg-[#1c1c38] rounded-full h-3 overflow-hidden border border-indigo-950/30">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${updateProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>0%</span>
              <span className="text-purple-400 text-sm font-black">{updateProgress}%</span>
              <span>100%</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {lang === 'vi'
                ? '⚠️ App sẽ tự đóng sau khi tải xong để kích hoạt phiên bản mới.'
                : '⚠️ App will close after download to launch the new version.'}
            </p>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <main className={
        hideHeader
          ? 'w-full flex-1'
          : 'max-w-[2200px] mx-auto px-3 sm:px-6 lg:px-12 py-4 sm:py-6 flex-1 w-full pb-24 sm:pb-6'
      }>
        {children}
      </main>

      {/* ─── FOOTER ─── */}
      {!hideHeader && <Footer />}

      {/* ─── MOBILE BOTTOM NAVIGATION ─── */}
      {!hideHeader && (
        <nav 
          className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1c183a]/95 backdrop-blur-md border-t border-white/8 safe-bottom"
          style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}
        >
          <div className="flex items-stretch h-16">
            {bottomNavItems.map(({ key, icon: Icon, label }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95"
                >
                  {/* Active indicator dot */}
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
                  {/* Badge for settings password warning */}
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
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <VipModal  isOpen={vipOpen}  onClose={() => setVipOpen(false)}  />
      <SocialDrawer isOpen={socialOpen} onClose={() => setSocialOpen(false)} defaultTab={socialTab} />

      {/* Render Log Console Panel */}
      {showLogConsole && (
        <LogConsole onClose={() => setShowLogConsole(false)} />
      )}
    </div>
  );
}

// Component hiển thị Nhật Ký Log Hệ Thống (Desktop)
function LogConsole({ onClose }) {
  const [logs, setLogs] = useState('Đang tải nhật ký...');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = React.useRef(null);

  const fetchLogs = async () => {
    try {
      if (window.electron && window.electron.getLogContent) {
        const content = await window.electron.getLogContent();
        setLogs(content || 'Chưa có nhật ký ghi nhận.');
      } else {
        setLogs('Chỉ hoạt động trên ứng dụng Desktop.');
      }
    } catch (err) {
      setLogs(`Lỗi tải log: ${err.message}`);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa sạch nhật ký hiện tại?')) return;
    try {
      if (window.electron && window.electron.clearLog) {
        const success = await window.electron.clearLog();
        if (success) {
          setLogs('Đã xóa nhật ký cũ.\n');
        } else {
          alert('Xóa log thất bại.');
        }
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const openLogFolder = () => {
    if (window.electron && window.electron.openLogFolder) {
      window.electron.openLogFolder();
    }
  };

  useEffect(() => {
    fetchLogs();
    // Tự động làm mới log mỗi 2 giây
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-80 bg-[#09090f] border-t-2 border-purple-600 shadow-[0_-15px_30px_rgba(0,0,0,0.8)] z-[999] flex flex-col text-slate-200 font-mono text-[11px] animate-slideUp">
      {/* Header bar */}
      <div className="h-10 bg-[#12121f] px-4 flex items-center justify-between border-b border-indigo-950/40 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="font-extrabold text-xs uppercase tracking-wider text-purple-300">Nhật Ký Hệ Thống / Log Console</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchLogs} 
            className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 rounded text-slate-300 hover:text-white transition-all text-[10px] font-bold"
          >
            Làm mới
          </button>
          <button 
            onClick={clearLogs} 
            className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 rounded text-rose-300 hover:text-rose-200 transition-all text-[10px] font-bold"
          >
            Xóa log
          </button>
          <button 
            onClick={openLogFolder} 
            className="px-2.5 py-1 bg-slate-700/40 hover:bg-slate-700/60 rounded text-slate-300 hover:text-white transition-all text-[10px] font-bold"
          >
            Mở thư mục
          </button>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors text-[10px] font-bold">
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={(e) => setAutoScroll(e.target.checked)} 
              className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 w-3 h-3" 
            />
            <span>Cuộn tự động</span>
          </label>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Log body */}
      <div 
        ref={logContainerRef} 
        className="flex-1 p-4 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text bg-[#07070a] border-none outline-none text-slate-300 hover:text-white transition-colors scrollbar-thin"
        style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}
      >
        {logs}
      </div>
    </div>
  );
}
