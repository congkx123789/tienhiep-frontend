import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services';
import { useAutoUpdate } from '../../hooks/useAutoUpdate';

export function useMainLayoutState(user: any, lang: string) {
  const navigate = useNavigate();
  const win = typeof window !== 'undefined' ? (window as any) : {};
  const isElectron = Boolean(win.electron);
  const isLinux = typeof navigator !== 'undefined' && /linux/i.test(navigator.userAgent);
  const isNativeApp = Boolean(win.electron || win.Capacitor?.isNativePlatform?.());

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

  return {
    isElectron, isLinux, isNativeApp,
    updateInfo, dismissUpdate, updateProgress, updateDownloading, updateDlStatus, handleStartUpdate,
    authOpen, setAuthOpen,
    mobileMenuOpen, setMobileMenuOpen,
    socialOpen, setSocialOpen,
    socialTab, setSocialTab,
    unreadMsgCount, unreadNotifCount,
    isWindowMaximized, showLogConsole, setShowLogConsole,
    missingEngine,
  };
}
