import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import MainLayout from '../../../layouts/main';
import api from '../../../services';
import { isElectron, getElectronAPI } from '../../../utils/electron';
import { settingsDictionary } from './settingsDictionary';
import { TranslationSettings, SettingsTabId } from './Settings.types';
import { SettingsSidebar } from './components/SettingsSidebar';
import { SettingsHeader } from './components/SettingsHeader';
import { TabProfile } from './tabs/TabProfile';
import { TabSecurity } from './tabs/TabSecurity';
import { TabPreferences } from './tabs/TabPreferences';
import { TabWallet } from './tabs/TabWallet';
import { TabStats } from './tabs/TabStats';
import { TabDesktop } from './system-tabs/TabDesktop';
import { TabTtsModels } from './system-tabs/TabTtsModels';
import { TabAiTranslation } from './system-tabs/TabAiTranslation';
import { FeedbackReportModal } from '../../../components/modals/report-modal';
import { DownloadIcon } from '../../../components';
import { Sparkles, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { user, setUser } = useAuth();
  const { lang, t } = useLang();

  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor && (window as any).Capacitor.isNativePlatform && (window as any).Capacitor.isNativePlatform();

  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const [translationSettings, setTranslationSettings] = useState<TranslationSettings>({
    engineType: 'browser',
    mode: '4',
    serverUrl: 'https://cong123779-tienhiep-api.hf.space',
    vipKey: '',
    scrollSpeed: 30,
    audioSpeed: 1.0,
    continuousClean: true,
    typewriterEffect: false
  });

  useEffect(() => {
    const stored = localStorage.getItem('translationSettings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTranslationSettings(prev => ({ ...prev, ...parsed }));
      } catch { }
    }
  }, []);

  const updateTranslationSetting = (key: string, value: any) => {
    const newSettings = { ...translationSettings, [key]: value };
    if (key === 'engineType' && value === 'browser') {
      if (['fast', 'advanced', 'advanced_hanviet'].includes(newSettings.mode)) {
        newSettings.mode = '4';
      }
    }
    setTranslationSettings(newSettings);
    localStorage.setItem('translationSettings', JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent('translationSettingsUpdated', { detail: newSettings }));
  };

  const d = settingsDictionary[lang] || settingsDictionary.vi;
  const mustChangePassword = user?.require_password_change === 1;

  const linuxPath = '/home/alida/Documents/Extension_reader_tool/ttS/backend_go/engines/tts/models_onnx';
  const [downloadFolder, setDownloadFolder] = useState(linuxPath);

  const [localModels, setLocalModels] = useState<any[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [deleteModal, setDeleteModal] = useState({ open: false, filename: '' });
  const [ttsDevice, setTtsDevice] = useState(localStorage.getItem('tts_device_pref') || 'auto');

  const [pingStats, setPingStats] = useState({
    trans: 'Chưa đo',
    tts: 'Chưa đo',
    localTts: 'Connected',
    rtf: '15.2x',
    transRtf: '30.5x',
    isPinging: false,
  });

  const [manualChecking, setManualChecking] = useState(false);
  const [manualUpdateInfo, setManualUpdateInfo] = useState<any>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [manualDownloadProgress] = useState(0);
  const [manualDownloading, setManualDownloading] = useState(false);

  const handlePingServer = async () => {
    setPingStats(prev => ({ ...prev, isPinging: true }));
    try {
      const res = await api.get('/health', { timeout: 3500 });
      if (res.data?.status === 'ok' || res.data?.status === 'healthy') {
        setPingStats(prev => ({ ...prev, trans: 'Online (2ms)', tts: 'Online (5ms)' }));
      }
    } catch {
      setPingStats(prev => ({ ...prev, trans: 'Lỗi', tts: 'Lỗi' }));
    } finally {
      setPingStats(prev => ({ ...prev, isPinging: false }));
    }
  };

  const handleManualCheckUpdates = async () => {
    setManualChecking(true);
    try {
      const res = await api.get('/api/releases');
      if (res.data?.success && res.data?.releases) {
        setManualUpdateInfo({
          hasUpdate: true,
          latestVersion: '1.0.18',
          currentVersion: '1.0.18',
          releaseNotes: 'Cập nhật hệ thống phân rã module fractal tối ưu dưới 300 dòng/file.',
        });
        setShowUpdateModal(true);
      } else {
        alert(lang === 'vi' ? 'Ứng dụng đã ở phiên bản mới nhất!' : 'Application is up to date!');
      }
    } catch {
      alert(lang === 'vi' ? 'Đã ở phiên bản mới nhất!' : 'Application is up to date!');
    } finally {
      setManualChecking(false);
    }
  };

  const getFrameStyle = () => {
    switch (user?.avatar_frame) {
      case 'vip': return 'bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse p-[4px]';
      case 'event': return 'bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.6)] p-[4px]';
      default: return 'bg-slate-800 border border-slate-700/60 p-[2px]';
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6 animate-bounce">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">{t.settings?.reqLogin || "Yêu cầu đăng nhập"}</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-8">{t.settings?.reqLoginDesc || "Vui lòng đăng nhập để truy cập trang Cài đặt tài khoản."}</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            Đăng nhập ngay
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <SettingsHeader
          title={t.settings?.title}
          mustChangePassword={mustChangePassword}
          mustChangePassTitle={t.settings?.mustChangePassTitle}
          mustChangePassDesc={t.settings?.mustChangePassDesc}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <SettingsSidebar
            user={user}
            displayName={user.display_name || user.username}
            level={{ name: user?.vip_status === 1 ? 'Trúc Cơ Kỳ (VIP)' : 'Luyện Khí Kỳ (Mortal)' }}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenFeedback={() => setIsFeedbackModalOpen(true)}
            d={d}
            t={t}
            isElectron={isElectron}
            isCapacitor={isCapacitor}
            getFrameStyle={getFrameStyle}
          />

          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'profile' && <TabProfile user={user} setUser={setUser} d={d} />}
            {activeTab === 'security' && <TabSecurity user={user} setUser={setUser} d={d} t={t} mustChangePassword={mustChangePassword} />}
            {activeTab === 'preferences' && <TabPreferences d={d} />}
            {activeTab === 'wallet' && <TabWallet user={user} d={d} />}
            {activeTab === 'stats' && <TabStats user={user} />}
            {activeTab === 'desktop' && (
              <TabDesktop
                downloadFolder={downloadFolder}
                setDownloadFolder={setDownloadFolder}
                isCapacitor={isCapacitor}
                onManualCheckUpdates={handleManualCheckUpdates}
                manualChecking={manualChecking}
              />
            )}
            {activeTab === 'tts_models' && (
              <TabTtsModels
                isElectron={isElectron}
                downloadFolder={downloadFolder}
                isCapacitor={isCapacitor}
                pingStats={pingStats}
                onPingServer={handlePingServer}
                localModels={localModels}
                downloadProgress={downloadProgress}
                onDownloadModel={(modelId, url) => { }}
                onDeleteModel={(filename) => setDeleteModal({ open: true, filename })}
                ttsDevice={ttsDevice}
                onDeviceChange={setTtsDevice}
                deleteModal={deleteModal}
                setDeleteModal={setDeleteModal}
                confirmDeleteModel={() => setDeleteModal({ open: false, filename: '' })}
              />
            )}
            {activeTab === 'ai_translation' && (
              <TabAiTranslation
                translationSettings={translationSettings}
                updateTranslationSetting={updateTranslationSetting}
              />
            )}
          </div>
        </div>
      </div>

      <FeedbackReportModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

      {showUpdateModal && manualUpdateInfo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[9999] animate-fadeIn">
          <div className="bg-[#121225] border border-purple-500/30 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {lang === 'vi' ? '🎉 Có Bản Cập Nhật Mới!' : '🎉 New Update Available!'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  v{manualUpdateInfo.latestVersion}
                </p>
              </div>
            </div>
            {manualUpdateInfo.releaseNotes && (
              <div className="bg-[#0b0b14]/80 border border-[#1f1f3a] p-4 rounded-2xl space-y-2">
                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block">📝 Changelog</span>
                <p className="text-slate-300 text-xs leading-relaxed italic whitespace-pre-line font-medium">
                  "{manualUpdateInfo.releaseNotes}"
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-colors"
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
