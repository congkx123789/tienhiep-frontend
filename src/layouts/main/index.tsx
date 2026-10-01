import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { useBrowser } from '../../contexts/BrowserContext';
import { useAutoUpdate } from '../../hooks/useAutoUpdate';
import { api } from '../../services';
import { AuthModal, VipGateModal, SystemTicker, Footer, SocialDrawer, DownloadIcon } from '../../components';
import {
  Compass, BookMarked, History, Terminal, BookOpen,
  Settings as SettingsIcon, Crown, Globe
} from 'lucide-react';
import { MainLayoutProps, NavItem } from './MainLayout.types';
import { MainHeader } from './components/MainHeader';
import { MobileMenuDrawer } from './components/MobileMenuDrawer';
import { BottomNav } from './components/BottomNav';
import { SystemBanners } from './components/SystemBanners';
import { LogConsole } from './components/LogConsole';

export default function MainLayout({ children, hideHeader = false, stats = { total: 931427, duplicates: 0 } }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const win = typeof window !== 'undefined' ? (window as any) : {};
  const isElectron = Boolean(win.electron);
  const isLinux = typeof navigator !== 'undefined' && /linux/i.test(navigator.userAgent);
  const isNativeApp = Boolean(win.electron || win.Capacitor?.isNativePlatform?.());

  const { isVisible, setIsVisible } = useBrowser() || { tabs: [] };
  const { updateInfo, dismissUpdate, startUpdate } = useAutoUpdate();

  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateDownloading, setUpdateDownloading] = useState(false);
  const [updateDlStatus, setUpdateDlStatus] = useState('');

  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [socialTab, setSocialTab] = useState<'friends' | 'search' | 'notifications' | 'chat'>('friends');
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [showLogConsole, setShowLogConsole] = useState(false);
  const [missingEngine, setMissingEngine] = useState(false);

  useEffect(() => {
    if (!isElectron) return;
    win.electron.isMaximized().then(setIsWindowMaximized);
    const unsubscribe = win.electron.onWindowStateChange(setIsWindowMaximized);

    if (win.electron.checkBackendStatus) {
      win.electron.checkBackendStatus().then((status: any) => {
        if (status?.error === 'missing_engine') setMissingEngine(true);
      });
    }

    const unsubscribeBackend = win.electron.onBackendReady(({ ready, error }: any) => {
      if (!ready && error === 'missing_engine') setMissingEngine(true);
      else if (ready) setMissingEngine(false);
    });

    return () => {
      unsubscribe?.();
      unsubscribeBackend?.();
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
      } catch {
        try {
          const res2 = await api.get('/api/notifications/personal');
          if (res2.data?.notifications) {
            setUnreadNotifCount(res2.data.notifications.filter((n: any) => !n.is_read).length);
          }
        } catch {}
      }
    };
    fetchUnread();
    const interval = setInterval(() => {
      if (!document.hidden) fetchUnread();
    }, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const handleStartUpdate = async () => {
    if (!updateInfo) return;
    if (!isElectron) { navigate('/downloads'); return; }
    setUpdateDownloading(true);
    setUpdateProgress(0);
    setUpdateDlStatus(lang === 'vi' ? 'Đang kết nối...' : 'Connecting...');
    try {
      const result = await startUpdate((data: any) => {
        if (data?.percent != null) {
          setUpdateProgress(data.percent);
          setUpdateDlStatus(
            lang === 'vi'
              ? `Đang tải ${data.percent}% (${(data.downloadedBytes/1024/1024).toFixed(1)}MB / ${(data.totalBytes/1024/1024).toFixed(1)}MB)`
              : `Downloading ${data.percent}% (${(data.downloadedBytes/1024/1024).toFixed(1)}MB / ${(data.totalBytes/1024/1024).toFixed(1)}MB)`
          );
        }
      });
      if (result?.success === false) {
        setUpdateDownloading(false);
        alert(lang === 'vi' ? `Lỗi cập nhật: ${result.error}` : `Update error: ${result.error}`);
      } else {
        setUpdateDlStatus(lang === 'vi' ? '✅ Hoàn tất! Đang khởi chạy...' : '✅ Complete! Launching...');
      }
    } catch (e: any) {
      setUpdateDownloading(false);
      alert('Update error: ' + e.message);
    }
  };

  const getActiveTab = () => {
    const p = location.pathname;
    if (p === '/') return 'all';
    if (p === '/bookshelf') return 'bookshelf';
    if (p === '/history') return 'history';
    if (p === '/developer') return 'developer';
    if (p === '/downloads') return 'downloads';
    if (p === '/embed') return 'embed';
    if (p === '/settings') return 'settings';
    if (p === '/sects') return 'sects';
    if (p === '/vip') return 'vip';
    return 'all';
  };

  const handleTabChange = (tab: string) => {
    setMobileMenuOpen(false);
    if (tab === 'browser') {
      if (setIsVisible) setIsVisible(true);
      return;
    }
    if (setIsVisible) setIsVisible(false);
    if (tab === 'all') navigate('/');
    else navigate(`/${tab}`);
  };

  const activeTab = (isNativeApp && isVisible) ? 'browser' : getActiveTab();

  const desktopNavItems: NavItem[] = useMemo(() => [
    ...(isNativeApp ? [{ key: 'browser', icon: Globe, label: lang === 'vi' ? 'Trình duyệt' : 'Browser' }] : []),
    { key: 'all', icon: Compass, label: t.tabDiscover },
    { key: 'bookshelf', icon: BookMarked, label: t.tabBookshelf },
    { key: 'history', icon: History, label: t.tabHistory },
    ...(user ? [{ key: 'developer', icon: Terminal, label: lang === 'vi' ? 'API Key & AI' : 'API Key' }] : []),
    { key: 'downloads', icon: DownloadIcon, label: t.tabDownloads },
    { key: 'embed', icon: BookOpen, label: t.tabEmbed },
    ...(user ? [{ key: 'sects', icon: Crown, label: lang === 'vi' ? 'Tông Môn' : 'Sects' }] : []),
    { key: 'vip', icon: Crown, label: lang === 'vi' ? 'Ủng Hộ VIP' : 'VIP' },
    { key: 'settings', icon: SettingsIcon, label: t.tabSettings },
  ], [isNativeApp, lang, t, user]);

  const bottomNavItems: NavItem[] = useMemo(() => [
    ...(isNativeApp ? [{ key: 'browser', icon: Globe, label: lang === 'vi' ? 'Trình duyệt' : 'Browser' }] : []),
    { key: 'all', icon: Compass, label: t.tabDiscover },
    { key: 'bookshelf', icon: BookMarked, label: t.tabBookshelf },
    { key: 'history', icon: History, label: t.tabHistory },
    { key: 'vip', icon: Crown, label: 'VIP' },
    { key: 'settings', icon: SettingsIcon, label: t.tabSettings },
  ], [isNativeApp, lang, t]);

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[#0b0b14] text-slate-100">
      {!hideHeader && (
        <MainHeader
          desktopNavItems={desktopNavItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          user={user}
          logout={logout}
          lang={lang}
          setLang={(l) => setLang(l as any)}
          t={t}
          isElectron={isElectron}
          isLinux={isLinux}
          isWindowMaximized={isWindowMaximized}
          showLogConsole={showLogConsole}
          onToggleLogConsole={() => setShowLogConsole(v => !v)}
          unreadMsgCount={unreadMsgCount}
          unreadNotifCount={unreadNotifCount}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenNotifications={() => { setSocialTab('notifications'); setSocialOpen(true); }}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(v => !v)}
        />
      )}

      {!hideHeader && mobileMenuOpen && (
        <MobileMenuDrawer
          user={user}
          logout={logout}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenAuth={() => setAuthOpen(true)}
          onClose={() => setMobileMenuOpen(false)}
          lang={lang}
          setLang={(l) => setLang(l as any)}
          t={t}
          unreadMsgCount={unreadMsgCount}
          unreadNotifCount={unreadNotifCount}
          onOpenNotifications={() => { setSocialTab('notifications'); setSocialOpen(true); }}
          stats={stats}
        />
      )}

      {!hideHeader && <SystemTicker />}

      {!hideHeader && (
        <SystemBanners
          isElectron={isElectron}
          missingEngine={missingEngine}
          updateInfo={updateInfo}
          updateDownloading={updateDownloading}
          updateProgress={updateProgress}
          updateDlStatus={updateDlStatus}
          lang={lang}
          onGoToSettings={() => handleTabChange('settings')}
          onStartUpdate={handleStartUpdate}
          onDismissUpdate={dismissUpdate}
        />
      )}

      <main className={
        hideHeader
          ? 'w-full flex-1'
          : 'max-w-[2200px] mx-auto px-3 sm:px-6 lg:px-12 py-4 sm:py-6 flex-1 w-full pb-24 sm:pb-6'
      }>
        {children}
      </main>

      {!hideHeader && <Footer />}

      {!hideHeader && (
        <BottomNav
          bottomNavItems={bottomNavItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          user={user}
          isElectron={isElectron}
        />
      )}

      <SocialDrawer 
        isOpen={socialOpen} 
        onClose={() => setSocialOpen(false)} 
        defaultTab={socialTab === 'chat' ? 'friends' : socialTab} 
      />

      {showLogConsole && (
        <LogConsole onClose={() => setShowLogConsole(false)} />
      )}
    </div>
  );
}
