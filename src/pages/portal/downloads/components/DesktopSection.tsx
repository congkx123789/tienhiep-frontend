import React, { useState } from 'react';
import { Laptop, Terminal, Copy, Check, Info, ChevronDown } from 'lucide-react';
import { DownloadIcon } from '../../../../components';
import { WindowsIcon } from './PlatformIcons';
import { ReleaseItem } from '../Downloads.types';

interface DesktopSectionProps {
  desktopLinux: ReleaseItem;
  desktopWindows: ReleaseItem;
  selectedLinuxVersion: string;
  setSelectedLinuxVersion: (v: string) => void;
  selectedWindowsVersion: string;
  setSelectedWindowsVersion: (v: string) => void;
  getAllReleases: (plat?: ReleaseItem) => ReleaseItem[];
  isElectron: boolean;
  updatingApp: boolean;
  updateProgress: number;
  updateStatus: string;
  onElectronUpdate: (url: string, filename: string) => void;
  onElectronPatchUpdate: (url: string, version: string) => void;
  onOpenUninstallConfirm: () => void;
  onOpenClearDataConfirm: () => void;
  content: any;
  lang: string;
}

export const DesktopSection: React.FC<DesktopSectionProps> = ({
  desktopLinux,
  desktopWindows,
  selectedLinuxVersion,
  setSelectedLinuxVersion,
  selectedWindowsVersion,
  setSelectedWindowsVersion,
  getAllReleases,
  isElectron,
  updatingApp,
  updateProgress,
  updateStatus,
  onElectronUpdate,
  onElectronPatchUpdate,
  onOpenUninstallConfirm,
  onOpenClearDataConfirm,
  content,
  lang
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [showLinuxSteps, setShowLinuxSteps] = useState(false);

  const linuxList = getAllReleases(desktopLinux);
  const currentLinuxRelease = linuxList.find(r => r.version === selectedLinuxVersion) || desktopLinux;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText('chmod +x TienHiepAI-*.AppImage && ./TienHiepAI-*.AppImage');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Linux Card */}
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-purple-500/40 transition-all">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-md">
              <Laptop className="w-7 h-7" />
            </div>
            {linuxList.length > 1 ? (
              <select
                value={selectedLinuxVersion}
                onChange={(e) => setSelectedLinuxVersion(e.target.value)}
                className="bg-[#0b0b14] border border-white/10 text-[11px] font-bold text-purple-300 rounded-full px-2.5 py-1 outline-none cursor-pointer"
              >
                {linuxList.map((r) => (
                  <option key={r.version} value={r.version}>
                    v{r.version} • {r.file_size}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                v{currentLinuxRelease.version} • {currentLinuxRelease.file_size}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-white group-hover:text-purple-300 transition-colors">
              {content.appTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {currentLinuxRelease.release_notes || content.appDesc}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {isElectron ? (
              <button
                onClick={() => onElectronUpdate(currentLinuxRelease.download_url, `TienHiepAI-${currentLinuxRelease.version}.AppImage`)}
                disabled={updatingApp}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-98 text-white font-extrabold text-xs transition-all shadow-lg"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>{updatingApp ? (lang === 'vi' ? 'Đang cập nhật...' : 'Updating...') : (lang === 'vi' ? 'Cập nhật trực tiếp trên App' : 'Inline App Update')}</span>
              </button>
            ) : (
              <a
                href={currentLinuxRelease.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-extrabold text-xs transition-all shadow-lg shadow-purple-600/20"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>{content.appBtnLinux}</span>
              </a>
            )}

            {currentLinuxRelease.patch_url && isElectron && (
              <button
                onClick={() => onElectronPatchUpdate(currentLinuxRelease.patch_url!, currentLinuxRelease.version)}
                disabled={updatingApp}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-600/30 transition-all"
              >
                <span>⚡ {lang === 'vi' ? 'Tải nhanh bản vá (Patch ~5MB)' : 'Fast Patch Update (~5MB)'}</span>
              </button>
            )}
          </div>

          {updatingApp && (
            <div className="p-3 bg-[#0a0a14] rounded-xl border border-purple-500/30 space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-300 font-bold">
                <span>{updateStatus}</span>
                <span>{updateProgress}%</span>
              </div>
              <div className="w-full bg-[#1c1c38] rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-200" style={{ width: `${updateProgress}%` }} />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => setShowLinuxSteps(v => !v)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                {content.appStepHeader}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLinuxSteps ? 'rotate-180' : ''}`} />
            </button>

            {showLinuxSteps && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#090912] border border-white/5 space-y-2">
                <p className="text-[10px] text-slate-400">Lệnh terminal chạy file AppImage:</p>
                <div className="flex items-center justify-between bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 font-mono text-[10px] text-indigo-300">
                  <span className="truncate">chmod +x TienHiepAI-*.AppImage && ./TienHiepAI-*.AppImage</span>
                  <button onClick={handleCopyCommand} className="ml-2 hover:text-white" title="Sao chép">
                    {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {isElectron && (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
            <button onClick={onOpenClearDataConfirm} className="text-slate-400 hover:text-amber-400 transition-colors">
              Xóa cache cục bộ
            </button>
            <button onClick={onOpenUninstallConfirm} className="text-rose-400 hover:text-rose-300 font-bold transition-colors">
              Gỡ cài đặt App
            </button>
          </div>
        )}
      </div>

      {/* Windows Card */}
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-purple-500/40 transition-all">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-md">
              <WindowsIcon className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
              v{desktopWindows.version} • {desktopWindows.file_size}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-white group-hover:text-purple-300 transition-colors">
              Windows Client (.EXE)
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {desktopWindows.release_notes || "Bản cài đặt Windows Installer chính thức tối ưu đồ họa DirectX / GPU tăng tốc và đọc truyện ngoại tuyến."}
            </p>
          </div>

          <div className="pt-2">
            <a
              href={desktopWindows.download_url}
              download
              className={`w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-extrabold text-xs transition-all ${
                desktopWindows.download_url === '#'
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-500 active:scale-98 text-white shadow-lg shadow-sky-600/20'
              }`}
            >
              <DownloadIcon className="w-4 h-4" />
              <span>{desktopWindows.download_url === '#' ? 'Sắp ra mắt' : 'Tải bản Windows (.EXE)'}</span>
            </a>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-500">
          <span>Hỗ trợ Windows 10, Windows 11 (64-bit)</span>
        </div>
      </div>
    </div>
  );
};
