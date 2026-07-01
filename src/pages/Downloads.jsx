import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Laptop, CheckCircle2, Terminal, 
  ChevronRight, Copy, Check, Info, FileText, ArrowRight, HelpCircle,
  Settings, Save, RefreshCw, AlertCircle
} from 'lucide-react';
import DownloadIcon from '../components/DownloadIcon';

const ChromeIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="21.17" y1="8" x2="12" y2="8" />
    <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
    <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
  </svg>
);

const WindowsIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12L3 12" strokeWidth="1.5" />
    <path d="M12 2L12 22" strokeWidth="1.5" />
    <path d="M3 5.41L10.33 4.41V11.58H3V5.41Z" fill="currentColor" opacity="0.2" />
    <path d="M11.67 4.23L21 3V11.58H11.67V4.23Z" fill="currentColor" opacity="0.2" />
    <path d="M3 12.42H10.33V19.59L3 18.59V12.42Z" fill="currentColor" opacity="0.2" />
    <path d="M11.67 12.42H21V21L11.67 19.77V12.42Z" fill="currentColor" opacity="0.2" />
    <path d="M3 5.41L10.33 4.41V11.58H3V5.41ZM11.67 4.23L21 3V11.58H11.67V4.23ZM3 12.42H10.33V19.59L3 18.59V12.42ZM11.67 12.42H21V21L11.67 19.77V12.42Z" />
  </svg>
);

export default function Downloads() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedSudo, setCopiedSudo] = useState(false);
  const isElectron = typeof window !== 'undefined' && !!window.electron;

  // Dynamic Releases State
  const [releases, setReleases] = useState({
    extension: {
      version: '1.0.0',
      download_url: '/downloads/tts_extension.zip',
      file_size: '10.7 MB',
      release_notes: 'Cập nhật dịch nhanh và tối ưu hóa Chrome Extension Helper'
    },
    desktop_linux: {
      version: '0.0.0',
      download_url: 'https://huggingface.co/datasets/Cong123779/tienhiep-data/resolve/main/downloads/TienHiepAI-0.0.0.AppImage',
      file_size: '116 MB',
      release_notes: 'Phiên bản AppImage beta dành cho Linux'
    },
    desktop_windows: {
      version: '0.0.0',
      download_url: '#',
      file_size: '0 MB',
      release_notes: 'Bản Windows chính thức sắp ra mắt'
    }
  });

  // Admin form state
  const [adminPlat, setAdminPlat] = useState('extension');
  const [adminVersion, setAdminVersion] = useState('');
  const [adminUrl, setAdminUrl] = useState('');
  const [adminSize, setAdminSize] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Electron local update states
  const [updatingApp, setUpdatingApp] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('');

  // Uninstall states
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);
  const [uninstallStep, setUninstallStep] = useState('idle'); // idle | running | done | error
  const [uninstallMsg, setUninstallMsg] = useState('');
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);

  const handleElectronUpdate = async (url, filename) => {
    if (!window.electron || !window.electron.downloadAndRunUpdate) return;
    setUpdatingApp(true);
    setUpdateProgress(0);
    setUpdateStatus(lang === 'vi' ? 'Đang kết nối tải bản cập nhật...' : 'Connecting to download update...');
    
    // Subscribe to progress events
    const unsubscribe = window.electron.onUpdateDownloadProgress((data) => {
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
      const res = await window.electron.downloadAndRunUpdate(url, filename);
      if (res && res.success) {
        setUpdateStatus(lang === 'vi' ? 'Tải về hoàn tất! Đang khởi chạy gói cài đặt...' : 'Download complete! Launching setup...');
      } else {
        setUpdatingApp(false);
        alert((lang === 'vi' ? 'Lỗi tải cập nhật: ' : 'Error loading update: ') + (res.error || 'Unknown'));
      }
    } catch (err) {
      setUpdatingApp(false);
      alert((lang === 'vi' ? 'Lỗi hệ thống: ' : 'System error: ') + err.message);
    } finally {
      unsubscribe();
    }
  };

  const handleElectronPatchUpdate = async (url, version) => {
    if (!window.electron || !window.electron.quickPatchUpdate) return;
    setUpdatingApp(true);
    setUpdateProgress(0);
    setUpdateStatus(lang === 'vi' ? 'Đang kết nối tải bản vá...' : 'Connecting to download patch...');
    
    // Subscribe to progress events
    const unsubscribe = window.electron.onUpdateDownloadProgress((data) => {
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
      const res = await window.electron.quickPatchUpdate(url, version);
      if (res && res.success) {
        setUpdateStatus(lang === 'vi' ? 'Áp dụng bản vá thành công! Đang khởi động lại ứng dụng...' : 'Patch applied successfully! Restarting...');
      } else {
        setUpdatingApp(false);
        alert((lang === 'vi' ? 'Lỗi cập nhật bản vá: ' : 'Patch update error: ') + (res.error || 'Unknown'));
      }
    } catch (err) {
      setUpdatingApp(false);
      alert((lang === 'vi' ? 'Lỗi hệ thống: ' : 'System error: ') + err.message);
    } finally {
      unsubscribe();
    }
  };

  const handleUninstall = async () => {
    if (!window.electron?.uninstallApp) return;
    setShowUninstallConfirm(false);
    setUninstallStep('running');
    setUninstallMsg(lang === 'vi' ? 'Đang gỡ cài đặt...' : 'Uninstalling...');
    try {
      const res = await window.electron.uninstallApp();
      if (res?.success) {
        if (res.platform === 'win32' && res.launched) {
          setUninstallStep('done');
          setUninstallMsg(lang === 'vi' ? '✅ Trình gỡ cài đặt đã khởi chạy. Ứng dụng sẽ đóng lại...' : '✅ Uninstaller launched. App will close...');
        } else if (res.platform === 'linux') {
          setUninstallStep('done');
          setUninstallMsg(
            lang === 'vi'
              ? `✅ Đã gỡ đăng ký hệ thống (desktop entries, MIME). Để xóa hoàn toàn, hãy xóa file AppImage và thư mục dữ liệu:\n${res.userDataPath}`
              : `✅ System entries removed (desktop, MIME). To fully uninstall, delete the AppImage file and data folder:\n${res.userDataPath}`
          );
        }
      } else {
        setUninstallStep('error');
        setUninstallMsg((lang === 'vi' ? '❌ Lỗi: ' : '❌ Error: ') + (res?.error || 'Unknown'));
      }
    } catch (e) {
      setUninstallStep('error');
      setUninstallMsg('❌ ' + e.message);
    }
  };

  const handleClearData = async () => {
    if (!window.electron?.clearUserData) return;
    setShowClearDataConfirm(false);
    try {
      const res = await window.electron.clearUserData();
      if (res?.success) {
        alert(
          (lang === 'vi' ? '✅ Đã xóa dữ liệu cục bộ:\n' : '✅ Local data cleared:\n') +
          (res.cleared?.join(', ') || 'none')
        );
      } else {
        alert('❌ ' + (res?.error || 'Failed'));
      }
    } catch (e) {
      alert('❌ ' + e.message);
    }
  };

  // Selected versions state
  const [selectedLinuxVersion, setSelectedLinuxVersion] = useState('');
  const [selectedWindowsVersion, setSelectedWindowsVersion] = useState('');

  // Lấy tất cả các bản release (bao gồm cả patch)
  const getAllReleases = (platformData) => {
    if (!platformData) return [];
    const history = platformData.history || [];
    const mainRelease = {
      version: platformData.version,
      download_url: platformData.download_url,
      patch_url: platformData.patch_url,
      file_size: platformData.file_size,
      release_notes: platformData.release_notes
    };
    
    // Gom cả mainRelease và history
    const all = [mainRelease, ...history];
    
    // Lọc trùng
    const unique = [];
    const seen = new Set();
    
    for (const r of all) {
      if (!r.version || !r.download_url || r.download_url === '#') continue;
      if (seen.has(r.version)) continue;
      seen.add(r.version);
      unique.push(r);
    }
    
    return unique;
  };

  // Fetch from backend
  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      const res = await api.get('/api/releases');
      if (res.data && res.data.success && res.data.releases) {
        setReleases(prev => ({
          ...prev,
          ...res.data.releases
        }));
        
        // Cập nhật dropdown trỏ về bản cài đặt mới nhất thực tế có
        if (res.data.releases.desktop_linux) {
          const linuxList = getAllReleases(res.data.releases.desktop_linux);
          if (linuxList.length > 0) {
            setSelectedLinuxVersion(linuxList[0].version);
          } else {
            setSelectedLinuxVersion(res.data.releases.desktop_linux.version);
          }
        }
        
        if (res.data.releases.desktop_windows) {
          const winList = getAllReleases(res.data.releases.desktop_windows);
          if (winList.length > 0) {
            setSelectedWindowsVersion(winList[0].version);
          } else {
            setSelectedWindowsVersion(res.data.releases.desktop_windows.version);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load releases from API:", e);
    }
  };

  // Sync admin form fields
  useEffect(() => {
    const platData = releases[adminPlat];
    if (platData) {
      setAdminVersion(platData.version || '');
      setAdminUrl(platData.download_url || '');
      setAdminSize(platData.file_size || '');
      setAdminNotes(platData.release_notes || '');
    }
  }, [adminPlat, releases]);

  const handleUpdateRelease = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setStatusMsg('');
    try {
      const res = await api.post('/api/releases/update', {
        platform: adminPlat,
        version: adminVersion,
        download_url: adminUrl,
        file_size: adminSize,
        release_notes: adminNotes
      });
      if (res.data && res.data.success) {
        setStatusMsg("Cập nhật phiên bản thành công!");
        fetchReleases();
      } else {
        setStatusMsg("Thất bại: " + (res.data.error || "Không rõ nguyên nhân"));
      }
    } catch (err) {
      setStatusMsg("Lỗi: " + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleAutoFillFromBuildFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let platform = 'extension';
    if (file.name.endsWith('.exe')) {
      platform = 'desktop_windows';
    } else if (file.name.endsWith('.AppImage')) {
      platform = 'desktop_linux';
    } else if (file.name.endsWith('.zip')) {
      platform = 'extension';
    }

    const versionMatch = file.name.match(/(\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : '1.0.0';

    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize = `${sizeInMB.toFixed(0)} MB`;

    const cleanName = file.name.replace(/\s+/g, '-');
    let downloadUrl = '';
    if (platform === 'extension') {
      downloadUrl = '/downloads/tts_extension.zip';
    } else {
      downloadUrl = `https://huggingface.co/datasets/Cong123779/tienhiep-data/resolve/main/downloads/${cleanName}`;
    }

    setAdminPlat(platform);
    setAdminVersion(version);
    setAdminSize(formattedSize);
    setAdminUrl(downloadUrl);
    setAdminNotes(`Bản cài đặt chính thức v${version} tối ưu hóa hiệu năng, sửa lỗi và cập nhật từ điển.`);
    setStatusMsg(`Đã tự động điền từ tệp: ${file.name}`);
  };

  // Local translations
  const content = {
    vi: {
      title: "Tải App & Extension",
      subtitle: "Đồng bộ trải nghiệm đọc truyện và dịch thuật AI tối ưu trên mọi nền tảng trình duyệt và máy tính.",
      extensionTitle: "Chrome Extension Helper",
      extensionDesc: "Tiện ích tích hợp trực tiếp vào trình duyệt giúp tự động lấy chương, dịch nhanh tiếng Trung và đồng bộ lịch sử đọc với Web App.",
      extensionBtn: "Tải tiện ích (.ZIP)",
      extensionStepHeader: "Các bước cài đặt thủ công (Developer Mode)",
      extSteps: [
        "Tải tệp tin tts_extension.zip bằng nút bên trên và giải nén ra một thư mục riêng biệt.",
        "Mở trình duyệt Chrome hoặc Edge, truy cập đường dẫn quản lý tiện ích: chrome://extensions/",
        "Gạt nút kích hoạt Chế độ nhà phát triển (Developer mode) ở góc trên bên phải màn hình.",
        "Click chọn Tải tiện ích đã giải nén (Load unpacked) ở góc trên bên trái.",
        "Chọn thư mục đã giải nén ở Bước 1. Biểu tượng Tiên Hiệp AI sẽ xuất hiện trên thanh công cụ!"
      ],
      appTitle: "Linux Client (AppImage)",
      appDesc: "Ứng dụng chuyên dụng cho hệ điều hành Linux, tối ưu hiệu năng dịch thuật, lưu trữ sách ngoại tuyến (Offline) và tự động cập nhật từ điển.",
      appBtnLinux: "Tải bản Linux (.AppImage)",
      appStepHeader: "Cách chạy thủ công",
      appSteps: [
        "Tải file cài đặt TienHiepAI-0.0.0.AppImage về máy tính.",
        "Cấp quyền thực thi và chạy file bằng lệnh:"
      ],
      copyTooltip: "Sao chép lệnh",
      copiedTooltip: "Đã sao chép!",
      noteTitle: "⚠️ Lưu ý đồng bộ",
      noteText: "Vui lòng đăng nhập trên App/Ext bằng cùng tài khoản của trang Web để số liệu dịch thuật và tổng thời gian đọc được đồng bộ hóa chuẩn xác nhất."
    },
    en: {
      title: "Download App & Extension",
      subtitle: "Synchronize your reading experience and AI translations across all browsers and desktop platforms.",
      extensionTitle: "Chrome Extension Helper",
      extensionDesc: "Integrate directly into your browser to automatically capture chapters, translate Chinese instantly, and sync reading history with the Web App.",
      extensionBtn: "Download Extension (.ZIP)",
      extensionStepHeader: "Manual Installation Steps (Developer Mode)",
      extSteps: [
        "Download the tts_extension.zip using the button above and extract it into a separate folder.",
        "Open Chrome or Edge and navigate to the extension manager: chrome://extensions/",
        "Toggle on the Developer mode switch at the top-right corner of the window.",
        "Click the Load unpacked button at the top-left corner.",
        "Select the folder extracted in Step 1. The Tien Hiep AI icon will appear on your toolbar!"
      ],
      appTitle: "Linux Client (AppImage)",
      appDesc: "Specialized desktop application for Linux translation performance, offline book storage, and automatic local dictionary updates.",
      appBtnLinux: "Download for Linux (.AppImage)",
      appStepHeader: "Manual Run Instructions",
      appSteps: [
        "Download the TienHiepAI-0.0.0.AppImage file to your computer.",
        "Grant execution permission using the command below:"
      ],
      copyTooltip: "Copy command",
      copiedTooltip: "Copied!",
      noteTitle: "⚠️ Sync Warning",
      noteText: "Please log in on all clients using the same account as the web portal to ensure translation metrics and reading logs sync perfectly."
    },
    zh: {
      title: "下载中心",
      subtitle: "在所有浏览器和电脑平台上同步您的阅读体验与 AI 翻译记录。",
      extensionTitle: "Chrome 辅助插件",
      extensionDesc: "直接嵌入浏览器以自动抓取章节、快速翻译中文，并与网页版同步阅读进度和统计数据。",
      extensionBtn: "下载插件包 (.ZIP)",
      extensionStepHeader: "手动安装步骤 (开发者模式)",
      extSteps: [
        "使用上方按钮下载 tts_extension.zip 并解压到一个独立的文件夹中。",
        "打开 Chrome 或 Edge 浏览器，访问插件管理器：chrome://extensions/",
        "开启右上角的 开发者模式 (Developer mode) 开关。",
        "点击左上角的 加载已解压的扩展程序 (Load unpacked) 按钮。",
        "选择您在步骤1中解压的文件夹，仙侠 AI 图标即会出现在浏览器工具栏上！"
      ],
      appTitle: "Linux 客户端 (AppImage)",
      appDesc: "专为 Linux 打造的桌面客户端，提供极佳的翻译性能、离线书籍缓存以及自动本地词库更新。",
      appBtnLinux: "下载 Linux 版 (.AppImage)",
      appStepHeader: "手动运行指南",
      appSteps: [
        "将 TienHiepAI-0.0.0.AppImage 文件下载到您的电脑中。",
        "使用以下命令赋予可执行权限："
      ],
      copyTooltip: "复制命令",
      copiedTooltip: "已复制！",
      noteTitle: "⚠️ 重要提示",
      noteText: "浏览器插件和电脑桌面端均通过您的账号进行数据同步。请确保在所有客户端上登录相同的账号，以便精确统计您的翻译字符数和总阅读时长。"
    }
  };

  const winList = getAllReleases(releases.desktop_windows);
  const linuxList = getAllReleases(releases.desktop_linux);

  const activeLinuxRelease = linuxList.find(r => r.version === selectedLinuxVersion) || linuxList[0] || releases.desktop_linux;
  const activeWindowsRelease = winList.find(r => r.version === selectedWindowsVersion) || winList[0] || releases.desktop_windows;

  const t = content[lang] || content.vi;
  const manualRunCmd = `chmod +x ${activeLinuxRelease.download_url.substring(activeLinuxRelease.download_url.lastIndexOf('/') + 1) || 'TienHiepAI.AppImage'} && ./${activeLinuxRelease.download_url.substring(activeLinuxRelease.download_url.lastIndexOf('/') + 1) || 'TienHiepAI.AppImage'}`;
  
  // Custom Linux Sudo One-liner Command requested by user
  const sudoInstallCmd = `sudo curl -L -o /usr/local/bin/tienhiep-ai "${activeLinuxRelease.download_url}" && sudo chmod +x /usr/local/bin/tienhiep-ai`;

  const handleCopy = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAdmin = false; // Hidden as requested by user

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 py-4 sm:py-6">
        
        {/* Header Section */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex p-3 bg-purple-600/10 rounded-full border border-purple-500/20 text-purple-400 mb-2 animate-bounce">
            <DownloadIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-200 to-purple-300 tracking-wide uppercase">
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed sm:text-base">
            {t.subtitle}
          </p>
        </div>

        {/* Sync alert banner */}
        <div className="bg-[#191635]/40 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 flex gap-4 items-start shadow-md">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.noteTitle}</h4>
            <p className="text-slate-300 text-xs leading-relaxed">{t.noteText}</p>
          </div>
        </div>

        {/* ─── ADMIN RELEASE PANEL ─── */}
        {isAdmin && (
          <div className="bg-[#1a122c] border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full filter blur-xl" />
            
            <div className="flex items-center gap-3 border-b border-purple-500/20 pb-3">
              <Settings className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">🛠️ Bảng Điều Khiển Phiên Bản (Admin Console)</h3>
                <p className="text-[10px] text-purple-300">Cập nhật link tải và ghi chú phát hành hiển thị trực tiếp trên trang Web.</p>
              </div>
            </div>

            {/* Auto-detect Build File Block */}
            <div className="p-4 bg-purple-950/20 border border-purple-500/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-left">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">⚡ Tự động điền thông tin tệp</h4>
                <p className="text-[10px] text-purple-300">Chọn file build (.exe, .AppImage, .zip) để hệ thống tự phân tích phiên bản, dung lượng và sinh URL HuggingFace.</p>
              </div>
              <label className="cursor-pointer bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5 whitespace-nowrap">
                <Laptop className="w-3.5 h-3.5" />
                <span>Chọn Tệp Build...</span>
                <input 
                  type="file" 
                  accept=".exe,.AppImage,.zip"
                  onChange={handleAutoFillFromBuildFile}
                  className="hidden" 
                />
              </label>
            </div>

            <form onSubmit={handleUpdateRelease} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Nền tảng (Platform)</label>
                <select
                  value={adminPlat}
                  onChange={(e) => setAdminPlat(e.target.value)}
                  className="bg-[#0b0b14] border border-[#3b2d54] text-xs rounded-xl p-3 text-slate-300 outline-none cursor-pointer focus:border-purple-500"
                >
                  <option value="extension">Chrome Extension Helper</option>
                  <option value="desktop_linux">Linux Desktop (AppImage)</option>
                  <option value="desktop_windows">Windows Desktop Client</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Số phiên bản (Version)</label>
                <input
                  type="text"
                  placeholder="e.g. 1.0.2"
                  value={adminVersion}
                  onChange={(e) => setAdminVersion(e.target.value)}
                  className="bg-[#0b0b14] border border-[#3b2d54] text-xs rounded-xl p-3 text-slate-200 outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Dung lượng tệp (Size)</label>
                <input
                  type="text"
                  placeholder="e.g. 10.7 MB / 116 MB"
                  value={adminSize}
                  onChange={(e) => setAdminSize(e.target.value)}
                  className="bg-[#0b0b14] border border-[#3b2d54] text-xs rounded-xl p-3 text-slate-200 outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Đường dẫn tải xuống (Download URL)</label>
                <input
                  type="text"
                  placeholder="e.g. https://... or local file path"
                  value={adminUrl}
                  onChange={(e) => setAdminUrl(e.target.value)}
                  className="bg-[#0b0b14] border border-[#3b2d54] text-xs rounded-xl p-3 text-slate-200 outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Ghi chú phát hành (Release Notes)</label>
                <textarea
                  rows="2"
                  placeholder="Viết các tính năng mới cập nhật..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="bg-[#0b0b14] border border-[#3b2d54] text-xs rounded-xl p-3 text-slate-200 outline-none focus:border-purple-500 font-sans"
                  required
                />
              </div>

              <div className="md:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg transition-all text-xs"
                >
                  {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Lưu Cập Nhật Phiên Bản</span>
                </button>

                {statusMsg && (
                  <div className="flex items-center gap-2 text-xs font-bold text-yellow-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{statusMsg}</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Main Grid: Extension vs Linux Client vs Windows Client */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Chrome Extension */}
          <div className="bg-[#121225]/80 border border-[#1f1f3a]/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative hover:border-emerald-500/20 hover:shadow-emerald-950/5 transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full filter blur-xl opacity-50 group-hover:bg-emerald-500/10 transition-colors" />
            <div className="space-y-5">
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 group-hover:scale-115 transition-transform">
                  <ChromeIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t.extensionTitle}</h3>
                  <span className="inline-block text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase mt-0.5">
                    v{releases.extension.version} • Verified
                  </span>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed min-h-[50px]">
                {t.extensionDesc}
              </p>

              <div>
                <a 
                  href={releases.extension.download_url}
                  download="tts_extension.zip"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold px-5 py-3 rounded-xl shadow-lg transition-all text-xs text-center"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>{t.extensionBtn}</span>
                </a>
                <p className="text-center text-[9px] text-slate-500 mt-2">
                  ZIP Format • Size: ~{releases.extension.file_size}
                </p>
              </div>

              {/* Release Notes */}
              <div className="bg-[#0b0b14]/50 border border-emerald-500/10 p-3 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">📝 Changelog</span>
                <p className="text-slate-300 text-[11px] leading-relaxed italic">
                  "{releases.extension.release_notes}"
                </p>
              </div>

              {/* Steps Guide */}
              <div className="border-t border-[#1f1f3a]/50 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> {t.extensionStepHeader}
                </h4>
                <ol className="space-y-3 text-[11px] text-slate-400 list-none pl-0">
                  {t.extSteps.map((step, idx) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="w-4.5 h-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

            </div>
          </div>

          {/* Card 2: Linux Client (AppImage) */}
          <div className="bg-[#121225]/80 border border-[#1f1f3a]/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative hover:border-purple-500/20 hover:shadow-purple-950/5 transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-bl-full filter blur-xl opacity-50 group-hover:bg-purple-500/10 transition-colors" />
            <div className="space-y-5">

              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400 group-hover:scale-115 transition-transform">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t.appTitle}</h3>
                  <div className="flex flex-wrap gap-1.5 items-center mt-1">
                    <span className="inline-block text-[9px] font-black tracking-widest text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase">
                      v{activeLinuxRelease.version} • Linux Beta
                    </span>
                    {linuxList.length > 1 && (
                      <select 
                        value={selectedLinuxVersion}
                        onChange={(e) => setSelectedLinuxVersion(e.target.value)}
                        className="bg-[#0b0b14] border border-[#1f1f3a] text-purple-400 font-extrabold text-[10px] rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                      >
                        {linuxList.map((r) => (
                          <option key={r.version} value={r.version}>
                            v{r.version}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed min-h-[50px]">
                {t.appDesc}
              </p>

              <div>
              <div>
                {isElectron ? (
                  // Trong App Electron:
                  activeLinuxRelease.patch_url ? (
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleElectronPatchUpdate(activeLinuxRelease.patch_url, activeLinuxRelease.version)}
                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-98 text-white font-extrabold px-5 py-3 rounded-xl shadow-lg transition-all text-xs text-center cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>⚡ Cập nhật nhanh lên v{activeLinuxRelease.version} (Khuyên dùng)</span>
                      </button>
                      <button 
                        onClick={() => {
                          const url = activeLinuxRelease.download_url;
                          const filename = url.substring(url.lastIndexOf('/') + 1) || 'TienHiepAI.AppImage';
                          handleElectronUpdate(url, filename);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-300 font-extrabold px-5 py-2.5 rounded-xl border border-slate-700 transition-all text-[11px] text-center cursor-pointer"
                      >
                        <DownloadIcon className="w-3.5 h-3.5" />
                        <span>Tải bộ cài Full Setup (v1.0.6)</span>
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        const url = activeLinuxRelease.download_url;
                        if (!url || url === '#') {
                          alert(lang === 'vi' ? 'Liên kết tải xuống không khả dụng.' : 'Download link is not available.');
                          return;
                        }
                        const filename = url.substring(url.lastIndexOf('/') + 1) || 'TienHiepAI.AppImage';
                        handleElectronUpdate(url, filename);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-extrabold px-5 py-3 rounded-xl shadow-lg transition-all text-xs text-center cursor-pointer"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      <span>Tải bản Linux (.AppImage)</span>
                    </button>
                  )
                ) : (
                  // Trên Web trình duyệt: chỉ tải bộ cài đặt full (download_url)
                  <div className="space-y-2">
                    <a 
                      href={activeLinuxRelease.download_url}
                      className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-extrabold px-5 py-3 rounded-xl shadow-lg transition-all text-xs text-center"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      <span>Tải bản Linux (.AppImage)</span>
                    </a>
                    {/* Chỉ hiển thị note lưu ý nếu bản tải về là bộ nền tảng v1.0.6 cũ và version chọn là bản vá */}
                    {activeLinuxRelease.download_url.includes('1.0.6') && activeLinuxRelease.patch_url && (
                      <p className="text-[10px] text-amber-400 leading-normal bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl text-center">
                        💡 <b>Lưu ý:</b> v{activeLinuxRelease.version} là bản nâng cấp nhanh. Bạn đang tải <b>bộ cài nền tảng v1.0.6</b>, sau khi mở app nó sẽ tự động update lên v{activeLinuxRelease.version} trong 3 giây.
                      </p>
                    )}
                  </div>
                )}
                <p className="text-center text-[9px] text-slate-500 mt-2">
                  AppImage Format • Size: ~{activeLinuxRelease.file_size}
                </p>
              </div>
              </div>

              {/* Release Notes */}
              <div className="bg-[#0b0b14]/50 border border-purple-500/10 p-3 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">📝 Changelog</span>
                <p className="text-slate-300 text-[11px] leading-relaxed italic">
                  "{activeLinuxRelease.release_notes}"
                </p>
              </div>

              {/* Linux terminal command setup */}
              <div className="border-t border-[#1f1f3a]/50 pt-4 space-y-4">
                {/* Custom Sudo Installer Requested by User */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" /> ⚡ Cài đặt nhanh bằng lệnh SUDO
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Mở Terminal và dán lệnh sau để tải, cấp quyền và cài đặt ứng dụng chạy trực tiếp:
                  </p>
                  <div className="flex items-center justify-between gap-2 bg-[#0b0b14] border border-amber-500/30 rounded-xl px-3 py-2 font-mono text-[9px] text-amber-300 w-full overflow-x-auto select-all shadow-inner">
                    <span className="truncate">{sudoInstallCmd}</span>
                    <button 
                      onClick={() => handleCopy(sudoInstallCmd, setCopiedSudo)}
                      className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors shrink-0"
                      title={copiedSudo ? t.copiedTooltip : t.copyTooltip}
                    >
                      {copiedSudo ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold">
                    💡 Sau khi chạy, bạn chỉ cần gõ <span className="text-purple-400 font-mono">tienhiep-ai</span> tại Terminal để mở app bất cứ lúc nào!
                  </p>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-[#1f1f3a]/30">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> {t.appStepHeader}
                  </h4>
                  <ol className="space-y-2 text-[11px] text-slate-400 list-none pl-0">
                    <li className="flex gap-2 items-start">
                      <span className="w-4.5 h-4.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                        1
                      </span>
                      <span className="leading-relaxed">{t.appSteps[0]}</span>
                    </li>
                    <li className="flex gap-2 items-start w-full">
                      <span className="w-4.5 h-4.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                        2
                      </span>
                      <div className="flex-1 space-y-1 min-w-0">
                        <span className="leading-relaxed">{t.appSteps[1]}</span>
                        <div className="flex items-center justify-between gap-2 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl px-3 py-1.5 font-mono text-[9px] text-purple-300 w-full overflow-x-auto select-all">
                          <span className="truncate">{manualRunCmd}</span>
                          <button 
                            onClick={() => handleCopy(manualRunCmd, setCopiedCmd)}
                            className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors shrink-0"
                            title={copiedCmd ? t.copiedTooltip : t.copyTooltip}
                          >
                            {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>

            </div>
          </div>

          {/* Card 3: Windows Client */}
          <div className="bg-[#121225]/80 border border-[#1f1f3a]/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative hover:border-blue-500/20 hover:shadow-blue-950/5 transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full filter blur-xl opacity-50 group-hover:bg-blue-500/10 transition-colors" />
            <div className="space-y-5">
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 group-hover:scale-115 transition-transform">
                  <WindowsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Windows Client</h3>
                  <div className="flex flex-wrap gap-1.5 items-center mt-1">
                    <span className={`inline-block text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase ${
                      activeWindowsRelease.download_url !== '#' 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-slate-500 bg-slate-500/10'
                    }`}>
                      {activeWindowsRelease.download_url !== '#' ? `v${activeWindowsRelease.version} • Stable` : 'Coming Soon'}
                    </span>
                    {winList.length > 1 && (
                      <select 
                        value={selectedWindowsVersion}
                        onChange={(e) => setSelectedWindowsVersion(e.target.value)}
                        className="bg-[#0b0b14] border border-[#1f1f3a] text-blue-400 font-extrabold text-[10px] rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                      >
                        {winList.map((r) => (
                          <option key={r.version} value={r.version}>
                            v{r.version}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed min-h-[50px]">
                Ứng dụng máy tính dành cho hệ điều hành Windows. Đầy đủ tính năng tối ưu hóa dịch thuật, lưu trữ sách, chạy mượt mà trên Win 10/11.
              </p>

              <div>
                {activeWindowsRelease.download_url !== '#' ? (
                  isElectron ? (
                    activeWindowsRelease.patch_url ? (
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleElectronPatchUpdate(activeWindowsRelease.patch_url, activeWindowsRelease.version)}
                          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-extrabold px-5 py-3 rounded-xl shadow-lg transition-all text-xs text-center cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>⚡ Cập nhật nhanh lên v{activeWindowsRelease.version} (Khuyên dùng)</span>
                        </button>
                        <button 
                          onClick={() => {
                            const url = activeWindowsRelease.download_url;
                            const filename = url.substring(url.lastIndexOf('/') + 1) || 'TienHiepAI-Setup.exe';
                            handleElectronUpdate(url, filename);
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-300 font-extrabold px-5 py-2.5 rounded-xl border border-slate-700 transition-all text-[11px] text-center cursor-pointer"
                        >
                          <DownloadIcon className="w-3.5 h-3.5" />
                          <span>Tải bộ cài Full Setup (v1.0.6)</span>
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          const url = activeWindowsRelease.download_url;
                          if (!url || url === '#') {
                            alert(lang === 'vi' ? 'Liên kết tải xuống không khả dụng.' : 'Download link is not available.');
                            return;
                          }
                          const filename = url.substring(url.lastIndexOf('/') + 1) || 'TienHiepAI-Setup.exe';
                          handleElectronUpdate(url, filename);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-extrabold px-5 py-3 rounded-xl shadow-lg transition-all text-xs text-center cursor-pointer"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        <span>Tải bản Windows (.EXE Setup)</span>
                      </button>
                    )
                  ) : (
                    // Trên Web trình duyệt: chỉ tải bộ cài đặt full (download_url)
                    <div className="space-y-2">
                      <a 
                        href={activeWindowsRelease.download_url}
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-extrabold px-5 py-3 rounded-xl shadow-lg transition-all text-xs text-center"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        <span>Tải bản Windows (.EXE Setup)</span>
                      </a>
                      {/* Chỉ hiển thị note lưu ý nếu bản tải về là bộ nền tảng v1.0.6 cũ và version chọn là bản vá */}
                      {activeWindowsRelease.download_url.includes('1.0.6') && activeWindowsRelease.patch_url && (
                        <p className="text-[10px] text-amber-400 leading-normal bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl text-center">
                          💡 <b>Lưu ý:</b> v{activeWindowsRelease.version} là bản nâng cấp nhanh. Bạn đang tải <b>bộ cài nền tảng v1.0.6</b>, sau khi mở app nó sẽ tự động update lên v{activeWindowsRelease.version} trong 3 giây.
                        </p>
                      )}
                    </div>
                  )
                ) : (
                  <button 
                    disabled
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-800/40 border border-slate-700/30 text-slate-500 font-bold px-5 py-3 rounded-xl text-xs text-center cursor-not-allowed"
                  >
                    <WindowsIcon className="w-4 h-4 opacity-40" />
                    <span>Bản Windows (Sắp ra mắt)</span>
                  </button>
                )}
                <p className="text-center text-[9px] text-slate-500 mt-2">
                  Format: EXE Setup • Size: ~{activeWindowsRelease.file_size}
                </p>
              </div>

              {/* Release Notes */}
              <div className="bg-[#0b0b14]/50 border border-blue-500/10 p-3 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">📝 Changelog</span>
                <p className="text-slate-300 text-[11px] leading-relaxed italic">
                  "{activeWindowsRelease.release_notes}"
                </p>
              </div>

              {/* Instructions */}
              <div className="border-t border-[#1f1f3a]/50 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Hướng dẫn cài đặt
                </h4>
                <ol className="space-y-3 text-[11px] text-slate-400 list-none pl-0">
                  <li className="flex gap-2 items-start">
                    <span className="w-4.5 h-4.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span className="leading-relaxed">Tải tệp tin cài đặt Windows (khi phát hành chính thức).</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="w-4.5 h-4.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span className="leading-relaxed">Chạy file installer `.exe` và làm theo các bước hướng dẫn trên màn hình.</span>
                  </li>
                </ol>
              </div>

            </div>
          </div>

        </div>

        {/* ── ELECTRON APP MANAGEMENT ── (Chỉ hiển thị trong app Electron) */}
        {isElectron && (
          <div className="bg-[#121225]/80 border border-rose-500/10 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full filter blur-2xl" />
            <div className="flex items-start gap-3 border-b border-rose-500/10 pb-4">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 shrink-0 mt-0.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07"/><path d="M4.93 4.93A10 10 0 0 0 19.07 19.07"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  {lang === 'vi' ? '⚙️ Quản lý Ứng dụng' : '⚙️ App Management'}
                </h3>
                <p className="text-[10px] text-rose-300/70 mt-0.5">
                  {lang === 'vi' 
                    ? 'Gỡ cài đặt hoặc xóa dữ liệu cục bộ của ứng dụng.' 
                    : 'Uninstall or clear local app data.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Uninstall */}
              <div className="bg-rose-950/20 border border-rose-500/10 rounded-2xl p-4 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                    {lang === 'vi' ? '🗑️ Gỡ cài đặt ứng dụng' : '🗑️ Uninstall Application'}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {lang === 'vi'
                      ? 'Xóa các desktop entry, MIME handler đã đăng ký. Trên Windows sẽ chạy trình gỡ cài đặt NSIS.'
                      : 'Removes desktop entries and MIME handlers. On Windows, launches the NSIS uninstaller.'}
                  </p>
                </div>
                <button
                  id="btn-uninstall-app"
                  onClick={() => setShowUninstallConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  {lang === 'vi' ? 'Gỡ cài đặt...' : 'Uninstall...'}
                </button>
              </div>

              {/* Clear Data */}
              <div className="bg-amber-950/20 border border-amber-500/10 rounded-2xl p-4 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    {lang === 'vi' ? '🧹 Xóa dữ liệu cục bộ' : '🧹 Clear Local Data'}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {lang === 'vi'
                      ? 'Xóa file cấu hình (app_config.json) và log debug. Tài khoản, sách và models KHÔNG bị xóa.'
                      : 'Deletes app_config.json and debug logs. Account, books, and models are NOT affected.'}
                  </p>
                </div>
                <button
                  id="btn-clear-userdata"
                  onClick={() => setShowClearDataConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  {lang === 'vi' ? 'Xóa dữ liệu...' : 'Clear Data...'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {updatingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#131324] border border-[#2d2d6b] rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white">
              {lang === 'vi' ? 'Tự Động Cập Nhật Phiên Bản' : 'Automatic Version Update'}
            </h3>
            <p className="text-xs text-slate-300">
              {updateStatus}
            </p>
            
            {/* Progress bar container */}
            <div className="w-full bg-[#1c1c38] rounded-full h-3 border border-indigo-950/30 overflow-hidden relative">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-inner" 
                style={{ width: `${updateProgress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span>0%</span>
              <span className="text-purple-400 text-sm font-black">{updateProgress}%</span>
              <span>100%</span>
            </div>
            
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {lang === 'vi' 
                ? '⚠️ Lưu ý: Ứng dụng sẽ tự động đóng sau khi hoàn tất để kích hoạt trình cài đặt/phiên bản mới.'
                : '⚠️ Note: The application will close automatically after completion to launch the new installer/version.'}
            </p>
          </div>
        </div>
      )}

      {/* ── UNINSTALL CONFIRM MODAL ── */}
      {showUninstallConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#131324] border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </div>
            <h3 className="text-base font-extrabold text-white">
              {lang === 'vi' ? '⚠️ Xác nhận Gỡ cài đặt' : '⚠️ Confirm Uninstall'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'vi'
                ? 'Thao tác này sẽ xóa các desktop entries và MIME handler đã đăng ký với hệ thống. Bạn có chắc chắn muốn tiếp tục không?'
                : 'This will remove registered desktop entries and MIME handlers from your system. Are you sure you want to continue?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUninstallConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800/60 border border-slate-700/30 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700/40 transition-all"
              >
                {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                onClick={handleUninstall}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition-all active:scale-95 shadow-lg"
              >
                {lang === 'vi' ? 'Gỡ cài đặt' : 'Uninstall'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLEAR DATA CONFIRM MODAL ── */}
      {showClearDataConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#131324] border border-amber-500/30 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 className="text-base font-extrabold text-white">
              {lang === 'vi' ? '🗑️ Xóa dữ liệu cục bộ' : '🗑️ Clear Local Data'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'vi'
                ? 'Sẽ xóa file cấu hình (app_config.json) và log debug. Dữ liệu tài khoản và models sẽ không bị xóa.'
                : 'Will delete config file (app_config.json) and debug logs. Account data and models will NOT be deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearDataConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800/60 border border-slate-700/30 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700/40 transition-all"
              >
                {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold rounded-xl transition-all active:scale-95 shadow-lg"
              >
                {lang === 'vi' ? 'Xóa dữ liệu' : 'Clear Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── UNINSTALL RESULT MODAL ── */}
      {(uninstallStep === 'running' || uninstallStep === 'done' || uninstallStep === 'error') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`bg-[#131324] border rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl ${
            uninstallStep === 'error' ? 'border-rose-500/30' : 
            uninstallStep === 'done' ? 'border-emerald-500/30' : 'border-indigo-500/30'
          }`}>
            {uninstallStep === 'running' ? (
              <div className="w-10 h-10 mx-auto border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
            ) : (
              <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl ${
                uninstallStep === 'done' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'
              }`}>
                {uninstallStep === 'done' ? '✅' : '❌'}
              </div>
            )}
            <h3 className="text-sm font-extrabold text-white">
              {uninstallStep === 'running' 
                ? (lang === 'vi' ? 'Đang xử lý...' : 'Processing...') 
                : (lang === 'vi' ? 'Kết quả' : 'Result')}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{uninstallMsg}</p>
            {uninstallStep !== 'running' && (
              <button
                onClick={() => { setUninstallStep('idle'); setUninstallMsg(''); }}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/30 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700/40 transition-all"
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
