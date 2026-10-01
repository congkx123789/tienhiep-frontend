import { useState } from 'react';

export function useElectronUpdater(lang: string) {
  const [updatingApp, setUpdatingApp] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('');

  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);
  const [uninstallStep, setUninstallStep] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [uninstallMsg, setUninstallMsg] = useState('');
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);

  const handleElectronUpdate = async (url: string, filename: string) => {
    const win = window as any;
    if (!win.electron?.downloadAndRunUpdate) return;
    setUpdatingApp(true);
    setUpdateProgress(0);
    setUpdateStatus(lang === 'vi' ? 'Đang kết nối tải bản cập nhật...' : 'Connecting to download update...');
    
    const unsubscribe = win.electron.onUpdateDownloadProgress((data: any) => {
      if (data && typeof data.percent === 'number') {
        setUpdateProgress(data.percent);
        setUpdateStatus(
          lang === 'vi' 
            ? `Đang tải: ${data.percent}% (${(data.downloadedBytes / (1024 * 1024)).toFixed(1)}MB / ${(data.totalBytes / (1024 * 1024)).toFixed(1)}MB)` 
            : `Downloading: ${data.percent}% (${(data.downloadedBytes / (1024 * 1024)).toFixed(1)}MB / ${(data.totalBytes / (1024 * 1024)).toFixed(1)}MB)`
        );
      }
    });
    
    try {
      const res = await win.electron.downloadAndRunUpdate(url, filename);
      if (res?.success) {
        setUpdateStatus(lang === 'vi' ? 'Tải về hoàn tất! Đang khởi chạy gói cài đặt...' : 'Download complete! Launching setup...');
      } else {
        setUpdatingApp(false);
        alert((lang === 'vi' ? 'Lỗi tải cập nhật: ' : 'Error loading update: ') + (res?.error || 'Unknown'));
      }
    } catch (err: any) {
      setUpdatingApp(false);
      alert((lang === 'vi' ? 'Lỗi hệ thống: ' : 'System error: ') + err.message);
    } finally {
      unsubscribe?.();
    }
  };

  const handleElectronPatchUpdate = async (url: string, version: string) => {
    const win = window as any;
    if (!win.electron?.quickPatchUpdate) return;
    setUpdatingApp(true);
    setUpdateProgress(0);
    setUpdateStatus(lang === 'vi' ? 'Đang kết nối tải bản vá...' : 'Connecting to download patch...');
    
    const unsubscribe = win.electron.onUpdateDownloadProgress((data: any) => {
      if (data && typeof data.percent === 'number') {
        setUpdateProgress(data.percent);
        setUpdateStatus(
          lang === 'vi' 
            ? `Đang tải bản vá: ${data.percent}% (${(data.downloadedBytes / (1024 * 1024)).toFixed(2)}MB / ${(data.totalBytes / (1024 * 1024)).toFixed(2)}MB)` 
            : `Downloading patch: ${data.percent}% (${(data.downloadedBytes / (1024 * 1024)).toFixed(2)}MB / ${(data.totalBytes / (1024 * 1024)).toFixed(2)}MB)`
        );
      }
    });
    
    try {
      const res = await win.electron.quickPatchUpdate(url, version);
      if (res?.success) {
        setUpdateStatus(lang === 'vi' ? 'Áp dụng bản vá thành công! Đang khởi động lại ứng dụng...' : 'Patch applied successfully! Restarting...');
      } else {
        setUpdatingApp(false);
        alert((lang === 'vi' ? 'Lỗi cập nhật bản vá: ' : 'Patch update error: ') + (res?.error || 'Unknown'));
      }
    } catch (err: any) {
      setUpdatingApp(false);
      alert((lang === 'vi' ? 'Lỗi hệ thống: ' : 'System error: ') + err.message);
    } finally {
      unsubscribe?.();
    }
  };

  const handleUninstall = async () => {
    const win = window as any;
    if (!win.electron?.uninstallApp) return;
    setShowUninstallConfirm(false);
    setUninstallStep('running');
    setUninstallMsg(lang === 'vi' ? 'Đang gỡ cài đặt...' : 'Uninstalling...');
    try {
      const res = await win.electron.uninstallApp();
      if (res?.success) {
        setUninstallStep('done');
        setUninstallMsg(
          res.platform === 'win32' && res.launched
            ? (lang === 'vi' ? '✅ Trình gỡ cài đặt đã khởi chạy. Ứng dụng sẽ đóng lại...' : '✅ Uninstaller launched. App will close...')
            : (lang === 'vi'
                ? `✅ Đã gỡ đăng ký hệ thống (desktop entries, MIME). Để xóa hoàn toàn, hãy xóa file AppImage và thư mục dữ liệu:\n${res.userDataPath}`
                : `✅ System entries removed (desktop, MIME). To fully uninstall, delete the AppImage file and data folder:\n${res.userDataPath}`)
        );
      } else {
        setUninstallStep('error');
        setUninstallMsg((lang === 'vi' ? '❌ Lỗi: ' : '❌ Error: ') + (res?.error || 'Unknown'));
      }
    } catch (e: any) {
      setUninstallStep('error');
      setUninstallMsg('❌ ' + e.message);
    }
  };

  const handleClearData = async () => {
    const win = window as any;
    if (!win.electron?.clearUserData) return;
    setShowClearDataConfirm(false);
    try {
      const res = await win.electron.clearUserData();
      if (res?.success) {
        alert((lang === 'vi' ? '✅ Đã xóa dữ liệu cục bộ:\n' : '✅ Local data cleared:\n') + (res.cleared?.join(', ') || 'none'));
      } else {
        alert('❌ ' + (res?.error || 'Failed'));
      }
    } catch (e: any) {
      alert('❌ ' + e.message);
    }
  };

  return {
    updatingApp,
    updateProgress,
    updateStatus,
    showUninstallConfirm,
    setShowUninstallConfirm,
    uninstallStep,
    setUninstallStep,
    uninstallMsg,
    showClearDataConfirm,
    setShowClearDataConfirm,
    handleElectronUpdate,
    handleElectronPatchUpdate,
    handleUninstall,
    handleClearData
  };
}
