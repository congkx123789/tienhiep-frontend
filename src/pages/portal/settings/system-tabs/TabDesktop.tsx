import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Laptop, RefreshCw } from 'lucide-react';
import { isElectron, getElectronAPI } from '../../../../utils/electron';

interface TabDesktopProps {
  downloadFolder: string;
  setDownloadFolder: (folder: string) => void;
  isCapacitor: boolean;
  onManualCheckUpdates: () => void;
  manualChecking: boolean;
}

export const TabDesktop: React.FC<TabDesktopProps> = ({
  downloadFolder,
  setDownloadFolder,
  isCapacitor,
  onManualCheckUpdates,
  manualChecking,
}) => {
  const navigate = useNavigate();
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [systemInfoLoading, setSystemInfoLoading] = useState(false);

  useEffect(() => {
    if (isElectron || isCapacitor) {
      setSystemInfoLoading(true);
      if (isElectron) {
        const api = getElectronAPI();
        if (api && api.getSystemInfo) {
          api.getSystemInfo().then((info: any) => setSystemInfo(info)).finally(() => setSystemInfoLoading(false));
        } else {
          setSystemInfoLoading(false);
        }
      } else if (isCapacitor) {
        const ua = navigator.userAgent;
        const androidVersionMatch = ua.match(/Android\s([0-9\.]+)/);
        const androidVersion = androidVersionMatch ? `Android ${androidVersionMatch[1]}` : 'Android OS';
        setSystemInfo({
          platform: androidVersion,
          arch: ua.includes('arm64') || ua.includes('aarch64') ? 'arm64' : (ua.includes('x86_64') ? 'x86_64' : 'arm'),
          cpuCount: navigator.hardwareConcurrency || 'N/A',
          freeMemoryGB: 'N/A',
          totalMemoryGB: (navigator as any).deviceMemory || 'N/A',
          version: '1.0.18 (Capacitor Mobile)'
        });
        setSystemInfoLoading(false);
      }
    }
  }, [isCapacitor]);

  const handleTestSystemAudio = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-[#1f1f3a]/60 pb-3">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Laptop className="w-5 h-5 text-purple-400" /> {isElectron ? 'Cấu Hình Phiên Bản Desktop' : (isCapacitor ? 'Cấu Hình Thiết Bị Android' : 'Cấu hình Desktop & Tải Bản Desktop')}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isElectron ? 'Đồng bộ ngoại tuyến, tối ưu tài nguyên phần cứng và điều khiển nâng cao.' : (isCapacitor ? 'Đồng bộ cấu hình, tối ưu tài nguyên thiết bị di động Android của bạn.' : 'Đồng bộ ngoại tuyến, tối ưu tài nguyên phần cứng và điều khiển nâng cao.')}
          </p>
        </div>

        {(isElectron || isCapacitor) ? (
          <div className="space-y-6">
            <div className="bg-[#0b0b14]/50 border border-[#1f1f3a] p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider block">Thư mục tải sách ngoại tuyến (Offline Download Folder)</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={downloadFolder} 
                  readOnly
                  className="flex-1 px-4 py-2.5 bg-[#05050a] border border-[#1f1f3a] rounded-xl text-xs text-slate-300 outline-none"
                />
                {!isCapacitor && (
                  <button 
                    type="button"
                    onClick={async () => {
                      const api = getElectronAPI();
                      if (api && api.selectDirectory) {
                        const folder = await api.selectDirectory('Chọn thư mục lưu trữ sách');
                        if (folder) {
                          setDownloadFolder(folder);
                          localStorage.setItem('electron_downloadFolder', folder);
                          alert(`Đã đổi thư mục lưu trữ thành: ${folder}`);
                        }
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-colors shrink-0"
                  >
                    Chọn thư mục
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500">Các chương truyện được tải xuống sẽ được lưu trữ cục bộ tại đường dẫn này để đọc khi không có mạng.</p>
            </div>

            {/* System Info */}
            <div className="bg-[#0b0b14]/50 border border-[#1f1f3a] p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider block">Thông số hệ thống (System Information)</h4>
              {systemInfoLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  Đang lấy thông số phần cứng...
                </div>
              ) : systemInfo ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-[#05050a] border border-[#1f1f3a]/60 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Hệ điều hành</span>
                    <span className="text-xs font-extrabold text-white capitalize">{systemInfo.platform} ({systemInfo.arch})</span>
                  </div>
                  <div className="p-3 bg-[#05050a] border border-[#1f1f3a]/60 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Số nhân CPU</span>
                    <span className="text-xs font-extrabold text-white">{systemInfo.cpuCount} Core</span>
                  </div>
                  <div className="p-3 bg-[#05050a] border border-[#1f1f3a]/60 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Bộ nhớ RAM</span>
                    <span className="text-xs font-extrabold text-white">{systemInfo.freeMemoryGB} GB trống / {systemInfo.totalMemoryGB} GB</span>
                  </div>
                  <div className="p-3 bg-[#05050a] border border-[#1f1f3a]/60 rounded-xl col-span-2 sm:col-span-3">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">
                      {isElectron ? 'Phiên bản Ứng dụng Desktop' : 'Phiên bản Ứng dụng Android'}
                    </span>
                    <span className="text-xs font-extrabold text-purple-400">
                      {isElectron ? `v${systemInfo.version} - Chạy bằng Electron & Node.js` : `v${systemInfo.version} - Chạy bằng Capacitor & WebKit`}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-red-400">Không tìm thấy API Electron Main Process.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const api = getElectronAPI();
                  if (api && api.openExternal) api.openExternal('https://tienhiep.lyvuha.com/');
                  else window.open('https://tienhiep.lyvuha.com/', '_blank');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
              >
                Mở Trang Chủ
              </button>
              <button
                type="button"
                onClick={handleTestSystemAudio}
                className="px-4 py-2 bg-[#7c3aed]/20 hover:bg-[#7c3aed]/30 text-[#a78bfa] font-bold text-xs rounded-xl border border-[#7c3aed]/30 transition-colors"
              >
                Kiểm Tra Âm Thanh Hệ Thống
              </button>
              <button
                type="button"
                onClick={onManualCheckUpdates}
                disabled={manualChecking}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${manualChecking ? 'animate-spin' : ''}`} />
                <span>{manualChecking ? 'Đang kiểm tra...' : 'Kiểm tra bản cập nhật'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 max-w-xl mx-auto space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-900/20 text-purple-400 border border-purple-500/20 rounded-full">
              <Laptop className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-extrabold text-white">Bạn đang truy cập bản Web Trình Duyệt</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Phiên bản Desktop mang lại khả năng xử lý âm thanh **Matcha-TTS** mượt mà, lưu trữ ngoại tuyến toàn bộ kho truyện và tự động cuộn màn hình tối ưu hơn.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button 
                type="button"
                onClick={() => navigate('/downloads')}
                className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-8 py-3 rounded-xl text-xs transition-colors shadow-lg shadow-purple-600/25 cursor-pointer"
              >
                Tải Về Bản Desktop Cho Windows (.exe)
              </button>
              <button
                type="button"
                onClick={onManualCheckUpdates}
                disabled={manualChecking}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold px-6 py-3 rounded-xl text-xs transition-colors border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${manualChecking ? 'animate-spin' : ''}`} />
                <span>Kiểm tra phiên bản mới</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
