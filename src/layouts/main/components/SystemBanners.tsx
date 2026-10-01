import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { DownloadIcon } from '../../../components';

interface SystemBannersProps {
  isElectron: boolean;
  missingEngine: boolean;
  updateInfo: any;
  updateDownloading: boolean;
  updateProgress: number;
  updateDlStatus: string;
  lang: string;
  onGoToSettings: () => void;
  onStartUpdate: () => void;
  onDismissUpdate: () => void;
}

export const SystemBanners: React.FC<SystemBannersProps> = ({
  isElectron,
  missingEngine,
  updateInfo,
  updateDownloading,
  updateProgress,
  updateDlStatus,
  lang,
  onGoToSettings,
  onStartUpdate,
  onDismissUpdate
}) => {
  return (
    <>
      {/* ─── MISSING ENGINE BANNER (Electron only) ─── */}
      {isElectron && missingEngine && (
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
              onClick={onGoToSettings}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition-all shadow-lg whitespace-nowrap"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              {lang === 'vi' ? 'Đi tới Cài đặt tải ngay' : 'Go to Settings to download'}
            </button>
          </div>
        </div>
      )}

      {/* ─── UPDATE BANNER ─── */}
      {updateInfo?.hasUpdate && !updateDownloading && (
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
              onClick={onStartUpdate}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition-all shadow-lg whitespace-nowrap"
            >
              <DownloadIcon className="w-3 h-3" />
              {lang === 'vi'
                ? (isElectron ? 'Cập nhật ngay' : 'Xem tải về')
                : (isElectron ? 'Update Now' : 'View Downloads')}
            </button>
            <button
              onClick={onDismissUpdate}
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
    </>
  );
};
