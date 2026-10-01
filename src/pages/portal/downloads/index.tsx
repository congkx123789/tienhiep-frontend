import React from 'react';
import MainLayout from '../../../layouts/main';
import { useLang } from '../../../contexts/LangContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useDownloadsData } from './useDownloadsData';
import { useElectronUpdater } from './useElectronUpdater';
import { ExtensionSection } from './components/ExtensionSection';
import { DesktopSection } from './components/DesktopSection';
import { MobileAppSection } from './components/MobileAppSection';
import { AdminReleaseModal } from './components/AdminReleaseModal';

export default function Downloads() {
  const { lang } = useLang();
  const { user } = useAuth();
  const isElectron = typeof window !== 'undefined' && Boolean((window as any).electron);

  const {
    releases,
    selectedLinuxVersion,
    setSelectedLinuxVersion,
    selectedWindowsVersion,
    setSelectedWindowsVersion,
    adminPlat,
    setAdminPlat,
    adminVersion,
    setAdminVersion,
    adminUrl,
    setAdminUrl,
    adminSize,
    setAdminSize,
    adminNotes,
    setAdminNotes,
    updating,
    statusMsg,
    getAllReleases,
    handleUpdateRelease,
    handleAutoFillFromBuildFile
  } = useDownloadsData();

  const {
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
  } = useElectronUpdater(lang);

  const content: any = {
    vi: {
      title: "Tải App & Extension",
      subtitle: "Đồng bộ trải nghiệm đọc truyện và dịch thuật AI tối ưu trên mọi nền tảng trình duyệt, máy tính và di động.",
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
      apkTitle: "Mobile App (Android & iOS)",
      apkDesc: "Ứng dụng di động dành cho Android & iOS, tối ưu hóa giao diện đọc truyện trên điện thoại, đồng bộ tủ sách, không giật lag và tiết kiệm pin.",
      apkBtn: "Tải bản Android (.APK)",
      ipaBtn: "Tải bản iOS (.IPA)",
      noteTitle: "⚠️ Lưu ý đồng bộ",
      noteText: "Vui lòng đăng nhập trên App/Ext bằng cùng tài khoản của trang Web để số liệu dịch thuật và tổng thời gian đọc được đồng bộ hóa chuẩn xác nhất."
    },
    en: {
      title: "Download App & Extension",
      subtitle: "Synchronize your reading experience and AI translations across all browsers, desktop, and mobile platforms.",
      extensionTitle: "Chrome Extension Helper",
      extensionDesc: "Integrate directly into your browser to automatically capture chapters, translate Chinese instantly, and sync reading history with the Web App.",
      extensionBtn: "Download Extension (.ZIP)",
      extensionStepHeader: "Manual Installation Steps (Developer Mode)",
      extSteps: [
        "Download the tts_extension.zip using the button above and extract it into a separate folder.",
        "Open Chrome or Edge and navigate to chrome://extensions/",
        "Toggle on Developer mode switch.",
        "Click Load unpacked button.",
        "Select the extracted folder."
      ],
      appTitle: "Linux Client (AppImage)",
      appDesc: "Specialized desktop application for Linux translation performance, offline book storage, and automatic local dictionary updates.",
      appBtnLinux: "Download for Linux (.AppImage)",
      appStepHeader: "Manual Run Instructions",
      apkTitle: "Mobile App (Android & iOS)",
      apkDesc: "Dedicated mobile app optimized for Android & iOS reading, bookmark synchronization, high-speed chapter loading, and zero lag.",
      apkBtn: "Download for Android (.APK)",
      ipaBtn: "Download for iOS (.IPA)",
      noteTitle: "⚠️ Sync Warning",
      noteText: "Please log in on all clients using the same account as the web portal to ensure translation metrics and reading logs sync perfectly."
    }
  };

  const c = content[lang] || content.vi;
  const isAdmin = user && ['admin', 'havucong25', 'congkx123789'].includes(user.username);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-10 py-6 sm:py-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
            {c.title}
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {c.subtitle}
          </p>
        </div>

        <ExtensionSection
          extension={releases.extension}
          content={c}
          lang={lang}
        />

        <DesktopSection
          desktopLinux={releases.desktop_linux}
          desktopWindows={releases.desktop_windows}
          selectedLinuxVersion={selectedLinuxVersion}
          setSelectedLinuxVersion={setSelectedLinuxVersion}
          selectedWindowsVersion={selectedWindowsVersion}
          setSelectedWindowsVersion={setSelectedWindowsVersion}
          getAllReleases={getAllReleases}
          isElectron={isElectron}
          updatingApp={updatingApp}
          updateProgress={updateProgress}
          updateStatus={updateStatus}
          onElectronUpdate={handleElectronUpdate}
          onElectronPatchUpdate={handleElectronPatchUpdate}
          onOpenUninstallConfirm={() => { setUninstallStep('idle'); setShowUninstallConfirm(true); }}
          onOpenClearDataConfirm={() => setShowClearDataConfirm(true)}
          content={c}
          lang={lang}
        />

        <MobileAppSection
          androidApk={releases.android_apk}
          iosIpa={releases.ios_ipa}
          content={c}
        />

        {isAdmin && (
          <AdminReleaseModal
            adminPlat={adminPlat}
            setAdminPlat={setAdminPlat}
            adminVersion={adminVersion}
            setAdminVersion={setAdminVersion}
            adminUrl={adminUrl}
            setAdminUrl={setAdminUrl}
            adminSize={adminSize}
            setAdminSize={setAdminSize}
            adminNotes={adminNotes}
            setAdminNotes={setAdminNotes}
            updating={updating}
            statusMsg={statusMsg}
            onUpdateRelease={handleUpdateRelease}
            onAutoFill={handleAutoFillFromBuildFile}
          />
        )}
      </div>

      {showUninstallConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#131324] border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-white">Xác nhận gỡ cài đặt ứng dụng?</h3>
            <p className="text-xs text-slate-400">Thao tác này sẽ gỡ bỏ các liên kết hệ thống và file cấu hình ứng dụng.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowUninstallConfirm(false)} className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Hủy</button>
              <button onClick={handleUninstall} className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold">Gỡ bỏ</button>
            </div>
          </div>
        </div>
      )}

      {showClearDataConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#131324] border border-amber-500/30 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-white">Xóa toàn bộ cache dữ liệu?</h3>
            <p className="text-xs text-slate-400">Các file tạm và cache cục bộ sẽ bị xóa để giải phóng dung lượng.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowClearDataConfirm(false)} className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Hủy</button>
              <button onClick={handleClearData} className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
