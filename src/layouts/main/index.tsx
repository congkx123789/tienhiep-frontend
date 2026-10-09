import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { useBrowser } from '../../contexts/BrowserContext';
import { AuthModal, SystemTicker, Footer, SocialDrawer, DownloadIcon } from '../../components';
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
import { BrowserNavSheet } from './components/BrowserNavSheet';
import { useMainLayoutState } from './useMainLayoutState';

export default function MainLayout({ children, hideHeader = false, stats = { total: 931427, duplicates: 0 } }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const { isVisible, setIsVisible, isNavMenuOpen, setIsNavMenuOpen } = useBrowser() || {};
  const {
    isElectron, isLinux, isNativeApp,
    updateInfo, dismissUpdate, updateProgress, updateDownloading, updateDlStatus, handleStartUpdate,
    authOpen, setAuthOpen,
    mobileMenuOpen, setMobileMenuOpen,
    socialOpen, setSocialOpen,
    socialTab, setSocialTab,
    unreadMsgCount, unreadNotifCount,
    isWindowMaximized, showLogConsole, setShowLogConsole,
    missingEngine,
  } = useMainLayoutState(user, lang);

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

  const activeTab = isVisible ? 'browser' : getActiveTab();

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
  ], [lang, t, user, isNativeApp]);

  const bottomNavItems: NavItem[] = useMemo(() => [
    ...(isNativeApp ? [{ key: 'browser', icon: Globe, label: lang === 'vi' ? 'Trình duyệt' : 'Browser' }] : []),
    { key: 'all', icon: Compass, label: t.tabDiscover },
    { key: 'bookshelf', icon: BookMarked, label: t.tabBookshelf },
    { key: 'history', icon: History, label: t.tabHistory },
    { key: 'vip', icon: Crown, label: 'VIP' },
    { key: 'settings', icon: SettingsIcon, label: t.tabSettings },
  ], [lang, t, isNativeApp]);

  const shouldShowHeader = !hideHeader && !isVisible;

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[#0b0b14] text-slate-100">
      {shouldShowHeader && (
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

      {!hideHeader && !isVisible && <SystemTicker />}

      {!hideHeader && !isVisible && (
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
          isBrowserMode={!!isVisible}
        />
      )}

      <BrowserNavSheet
        isOpen={Boolean(isNavMenuOpen)}
        isVisible={Boolean(isVisible)}
        onClose={() => setIsNavMenuOpen && setIsNavMenuOpen(false)}
        bottomNavItems={bottomNavItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <SocialDrawer
        isOpen={socialOpen}
        onClose={() => setSocialOpen(false)}
        defaultTab={socialTab === 'chat' ? 'friends' : socialTab}
      />

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {showLogConsole && (
        <LogConsole onClose={() => setShowLogConsole(false)} />
      )}
    </div>
  );
}
