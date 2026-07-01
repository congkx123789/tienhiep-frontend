/**
 * useAutoUpdate.js
 * Hook kiểm tra phiên bản mới tự động khi app khởi động.
 * Hoạt động trong cả Electron (dùng IPC) và Web (dùng API trực tiếp).
 *
 * Ưu tiên Quick Patch (~1.5MB) khi có sẵn, fallback sang Full Update (~95MB Setup.exe).
 *
 * Returns:
 *   updateInfo    — { hasUpdate, currentVersion, latestVersion, downloadUrl, patchUrl, fileSize, releaseNotes }
 *   dismissUpdate — fn để ẩn banner (lưu vào session)
 *   startUpdate   — fn để bắt đầu tải (Electron) hoặc mở link (Web)
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Phiên bản web hiện tại — đồng bộ với package.json version
// Khi release mới, cập nhật dòng này hoặc đọc từ meta tag
const WEB_APP_VERSION = '1.0.25';

function parseVersion(v = '0.0.0') {
  return (v || '0.0.0').replace(/^v/, '').split('.').map(Number);
}

function isNewerVersion(latest, current) {
  const [lMaj, lMin, lPat] = parseVersion(latest);
  const [cMaj, cMin, cPat] = parseVersion(current);
  return (
    lMaj > cMaj ||
    (lMaj === cMaj && lMin > cMin) ||
    (lMaj === cMaj && lMin === cMin && lPat > cPat)
  );
}

export function useAutoUpdate() {
  const [updateInfo, setUpdateInfo] = useState(null);      // null | object
  const [checking, setChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isElectron = typeof window !== 'undefined' && !!window.electron;

  const checkForUpdate = useCallback(async () => {
    // Chỉ chạy 1 lần mỗi session — tránh spam API
    const checkedKey = `update_checked_${new Date().toDateString()}`;
    if (sessionStorage.getItem(checkedKey)) return;

    setChecking(true);
    try {
      if (isElectron && window.electron?.checkForUpdate) {
        // ── Electron: dùng IPC (main process fetch, không bị CORS) ──
        const result = await window.electron.checkForUpdate();
        if (result?.success && result.hasUpdate) {
          setUpdateInfo(result);
        }
      } else {
        // ── Web: gọi API trực tiếp ──
        const res = await api.get('/api/releases');
        if (!res.data?.success || !res.data?.releases) return;

        const releases = res.data.releases;

        // Web dùng desktop_linux làm reference version
        const latestRelease = releases.desktop_linux || releases.desktop_windows;
        if (!latestRelease) return;

        const latestVersion = latestRelease.version;
        const currentVersion = WEB_APP_VERSION;

        if (isNewerVersion(latestVersion, currentVersion)) {
          setUpdateInfo({
            hasUpdate: true,
            currentVersion,
            latestVersion,
            downloadUrl: null, // Web không tự download, dẫn đến trang Downloads
            patchUrl: null,
            releaseNotes: latestRelease.release_notes,
            platform: 'web'
          });
        }
      }
    } catch (e) {
      // Silent fail — không spam user khi offline
      console.warn('[AutoUpdate] Check skipped:', e.message);
    } finally {
      setChecking(false);
      sessionStorage.setItem(checkedKey, '1');
    }
  }, [isElectron]);

  // Chạy check khi component mount (delay 3s để không block render đầu tiên)
  useEffect(() => {
    const timer = setTimeout(checkForUpdate, 3000);
    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  const dismissUpdate = useCallback(() => {
    setDismissed(true);
    // Lưu vào sessionStorage để không hiện lại trong session này
    if (updateInfo) {
      sessionStorage.setItem(`dismissed_v${updateInfo.latestVersion}`, '1');
    }
  }, [updateInfo]);

  const startUpdate = useCallback(async (onProgress) => {
    if (!updateInfo) return;

    if (isElectron) {
      const { patchUrl, downloadUrl, latestVersion } = updateInfo;

      // ── Ưu tiên Quick Patch (chỉ ~1.5MB) ──
      if (patchUrl && window.electron?.quickPatchUpdate) {
        console.log('[AutoUpdate] Using Quick Patch:', patchUrl);
        if (onProgress) {
          const unsub = window.electron.onUpdateDownloadProgress(onProgress);
          const result = await window.electron.quickPatchUpdate(patchUrl, latestVersion);
          unsub();
          return result;
        }
        return window.electron.quickPatchUpdate(patchUrl, latestVersion);
      }

      // ── Fallback: Full Setup.exe (silent install) ──
      if (downloadUrl && window.electron?.downloadAndRunUpdate) {
        const isWin = downloadUrl?.includes('windows') || downloadUrl?.includes('win');
        const filename = isWin
          ? `TienHiepAI-Setup-${latestVersion}.exe`
          : `TienHiepAI-${latestVersion}.AppImage`;

        console.log('[AutoUpdate] Using Full Update:', downloadUrl);
        if (onProgress) {
          const unsub = window.electron.onUpdateDownloadProgress(onProgress);
          const result = await window.electron.downloadAndRunUpdate(downloadUrl, filename);
          unsub();
          return result;
        }
        return window.electron.downloadAndRunUpdate(downloadUrl, filename);
      }
    } else {
      // Web: navigate đến trang Downloads
      window.location.href = '/downloads';
    }
  }, [updateInfo, isElectron]);

  // Nếu user đã dismiss version này trước đó trong session
  const wasDismissed = updateInfo
    ? !!sessionStorage.getItem(`dismissed_v${updateInfo.latestVersion}`)
    : false;

  return {
    updateInfo: (dismissed || wasDismissed) ? null : updateInfo,
    checking,
    dismissUpdate,
    startUpdate,
  };
}
