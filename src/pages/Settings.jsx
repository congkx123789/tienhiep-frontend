import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import MainLayout from '../layouts/MainLayout';
import api, { getBestServer } from '../services/api';
import { isElectron, getElectronAPI } from '../utils/electron';
import { useAutoUpdate } from '../hooks/useAutoUpdate';
import { useNavigate } from 'react-router-dom';

import { 
  Shield, Lock, Mail, User, CheckCircle, AlertTriangle, KeyRound,
  Award, Coins, Smartphone, Sparkles, Check, RefreshCw, LogOut,
  BookOpen, Settings as SettingsIcon, Sliders, Bell, Compass, Calendar, 
  ChevronRight, Laptop, Tablet, Smartphone as PhoneIcon, Trash2, HelpCircle,
  BarChart3, Clock, Globe, Tv, Wifi, WifiOff, X,
  BrainCircuit, Crown, MessageSquare, Terminal
} from 'lucide-react';
import DownloadIcon from '../components/DownloadIcon';

export default function Settings() {
  const { user, setUser } = useAuth();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  
  const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

  // Tab State: 'profile' | 'security' | 'preferences' | 'wallet'
  const [activeTab, setActiveTab] = useState('profile');

  const [translationSettings, setTranslationSettings] = useState({
    engineType: 'browser', 
    mode: 'vietphrase', 
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
        let parsed = JSON.parse(stored);
        if (parsed.serverUrl === 'https://tienhiep.lyvuha.com') {
          parsed.serverUrl = 'https://cong123779-tienhiep-api.hf.space';
        }
        setTranslationSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    }
  }, []);

  const updateTranslationSetting = (key, value) => {
    let newSettings = { ...translationSettings, [key]: value };
    if (key === 'engineType' && value === 'browser') {
      if (['fast', 'advanced', 'advanced_hanviet'].includes(newSettings.mode)) {
        newSettings.mode = 'vietphrase';
      }
    }
    setTranslationSettings(newSettings);
    localStorage.setItem('translationSettings', JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent('translationSettingsUpdated', { detail: newSettings }));
  };

  // Translation local dictionary to support newly added sections
  const dict = {
    vi: {
      profileTab: "Hồ sơ cá nhân",
      securityTab: "Tài khoản & Bảo mật",
      prefTab: "Tùy chỉnh đọc & Thông báo",
      walletTab: "Cấp bậc & Tài sản",
      displayName: "Biệt hiệu hiển thị",
      displayNamePlaceholder: "Nhập biệt hiệu đi bình luận...",
      birthday: "Ngày sinh",
      gender: "Giới tính",
      genderMale: "Nam",
      genderFemale: "Nữ",
      genderOther: "Khác",
      bio: "Lời giới thiệu ngắn (Bio)",
      bioPlaceholder: "Viết vài câu giới thiệu bản thân...",
      avatarFrame: "Khung ảnh đại diện",
      frameDefault: "Không khung (Thường)",
      frameVip: "Khung Rồng Vàng (VIP)",
      frameEvent: "Khung Tinh Vân (Sự kiện)",
      saveBtn: "Lưu thay đổi",
      saving: "Đang lưu...",
      saveSuccess: "Cập nhật thông tin thành công!",
      saveError: "Có lỗi xảy ra, vui lòng thử lại.",
      
      authLinks: "Liên kết mạng xã hội",
      authLinked: "Đã liên kết",
      authLinkBtn: "Liên kết ngay",
      phoneNumber: "Số điện thoại",
      phonePlaceholder: "Nhập số điện thoại của bạn",
      getOtp: "Gửi mã OTP",
      otpSent: "Đã gửi mã!",
      enterOtp: "Nhập mã xác thực OTP",
      verifyBtn: "Xác thực",
      twoFactor: "Bảo mật hai lớp (2FA)",
      twoFactorDesc: "Yêu cầu nhập mã xác thực OTP gửi qua email/SĐT khi đăng nhập từ thiết bị lạ.",
      sessionTitle: "Quản lý phiên đăng nhập",
      sessionDesc: "Danh sách các thiết bị đang đăng nhập tài khoản của bạn.",
      revokeSession: "Đăng xuất thiết bị",
      revokeAllSessions: "Đăng xuất khỏi tất cả thiết bị khác",
      activeNow: "Đang hoạt động",
      
      readingConf: "Cấu hình trình đọc mặc định",
      fontSize: "Cỡ chữ",
      fontFamily: "Phông chữ",
      lineHeight: "Khoảng cách dòng",
      lineNormal: "Bình thường",
      lineMedium: "Vừa phải",
      lineWide: "Rộng rãi",
      themeBg: "Màu nền",
      themeLight: "Trang sáng",
      themeDark: "Bóng tối",
      themeSepia: "Sepia (Vàng giấy)",
      favCategories: "Thể loại yêu thích (3-5 thể loại)",
      notificationSettings: "Cài đặt thông báo",
      notifyNewChapters: "Thông báo khi truyện trong Tủ Sách có chương mới",
      notifyReplies: "Thông báo khi có người trả lời bình luận của bạn",
      
      accountLevel: "Cấp bậc tu tiên (Level)",
      levelTitle: "Cấp Độ",
      expNeeded: "EXP tiếp theo",
      titlesBadges: "Danh hiệu & Huy hiệu",
      walletBalance: "Ví tiền & Tài sản",
      depositCoin: "Xu Nạp (Vĩnh viễn)",
      bonusCoin: "Xu Thưởng (Hạn dùng)",
      itemInventory: "Kho vật phẩm của bạn",
      itemRecommendation: "Phiếu đề cử",
      itemVote: "Phiếu đề xuất",
      itemGift: "Quà tặng Donate",
      txHistory: "Lịch sử giao dịch",
      txTabDeposit: "Lịch sử nạp",
      txTabExpense: "Lịch sử tiêu phí",
      txTitle: "Giao dịch",
      txCost: "Chi phí",
      txTime: "Thời gian",
      txStatus: "Trạng thái",
      txDetail: "Nội dung",
      passMinLen: "Mật khẩu mới phải từ 4 ký tự trở lên.",
      passMismatch: "Mật khẩu mới và xác nhận mật khẩu không trùng khớp.",
      passChangeSuccess: "Đổi mật khẩu thành công!",
      passChangeError: "Lỗi thay đổi mật khẩu."
    },
    en: {
      profileTab: "Profile Settings",
      securityTab: "Account & Security",
      prefTab: "Reading & Notifications",
      walletTab: "Level & Assets",
      displayName: "Display Name (Nickname)",
      displayNamePlaceholder: "Enter your nickname...",
      birthday: "Birthday",
      gender: "Gender",
      genderMale: "Male",
      genderFemale: "Female",
      genderOther: "Other",
      bio: "Bio / Signature",
      bioPlaceholder: "Tell us about yourself...",
      avatarFrame: "Avatar Frame",
      frameDefault: "None (Regular)",
      frameVip: "Gold Dragon (VIP)",
      frameEvent: "Nebula Frame (Event)",
      saveBtn: "Save Changes",
      saving: "Saving...",
      saveSuccess: "Profile updated successfully!",
      saveError: "An error occurred, please try again.",

      authLinks: "Linked Social Accounts",
      authLinked: "Linked",
      authLinkBtn: "Link Account",
      phoneNumber: "Phone Number",
      phonePlaceholder: "Enter your phone number",
      getOtp: "Send OTP",
      otpSent: "OTP Sent!",
      enterOtp: "Enter OTP Code",
      verifyBtn: "Verify",
      twoFactor: "Two-Factor Auth (2FA)",
      twoFactorDesc: "Requires OTP verification when logging in from unrecognized devices.",
      sessionTitle: "Session Management",
      sessionDesc: "Devices currently logged in to your account.",
      revokeSession: "Log out device",
      revokeAllSessions: "Log out all other devices",
      activeNow: "Active Now",

      readingConf: "Default Reader Configurations",
      fontSize: "Font Size",
      fontFamily: "Font Family",
      lineHeight: "Line Height",
      lineNormal: "Normal",
      lineMedium: "Medium",
      lineWide: "Wide",
      themeBg: "Background Theme",
      themeLight: "Light Mode",
      themeDark: "Dark Mode",
      themeSepia: "Sepia Paper",
      favCategories: "Favorite Categories (3-5 tags)",
      notificationSettings: "Notification Settings",
      notifyNewChapters: "Notify when novels in Bookshelf have new chapters",
      notifyReplies: "Notify when someone replies to your comments",

      accountLevel: "Account Level & EXP",
      levelTitle: "Level",
      expNeeded: "Next Level EXP",
      titlesBadges: "Titles & Badges",
      walletBalance: "Wallet & Assets",
      depositCoin: "Coins (Permanent)",
      bonusCoin: "Bonus Coins (Promo)",
      itemInventory: "Item Inventory",
      itemRecommendation: "Recommendation Ticket",
      itemVote: "Monthly Vote Ticket",
      itemGift: "Donate Gift Pack",
      txHistory: "Transaction Logs",
      txTabDeposit: "Deposits",
      txTabExpense: "Expenses",
      txTitle: "Transaction",
      txCost: "Cost",
      txTime: "Timestamp",
      txStatus: "Status",
      txDetail: "Detail",
      passMinLen: "Password must be at least 4 characters.",
      passMismatch: "Passwords do not match.",
      passChangeSuccess: "Password changed successfully!",
      passChangeError: "Failed to change password."
    },
    zh: {
      profileTab: "个人主页",
      securityTab: "账号与安全",
      prefTab: "阅读偏好与通知",
      walletTab: "等级与资产",
      displayName: "显示昵称",
      displayNamePlaceholder: "输入您的昵称...",
      birthday: "出生日期",
      gender: "性别",
      genderMale: "男",
      genderFemale: "女",
      genderOther: "其他",
      bio: "个性签名",
      bioPlaceholder: "用一句话介绍自己...",
      avatarFrame: "头像框装饰",
      frameDefault: "无 (普通成员)",
      frameVip: "金龙腾飞 (VIP尊享)",
      frameEvent: "星云环绕 (活动限定)",
      saveBtn: "保存修改",
      saving: "正在保存...",
      saveSuccess: "主页信息更新成功！",
      saveError: "保存失败，请稍后重试。",

      authLinks: "第三方社交账号绑定",
      authLinked: "已绑定",
      authLinkBtn: "立即绑定",
      phoneNumber: "手机号码",
      phonePlaceholder: "请输入您的手机号",
      getOtp: "发送验证码",
      otpSent: "已发送验证码！",
      enterOtp: "输入验证码",
      verifyBtn: "验证并绑定",
      twoFactor: "双重身份验证 (2FA)",
      twoFactorDesc: "从新设备登录时，需要输入发送至邮箱或手机的验证码。",
      sessionTitle: "登录设备管理",
      sessionDesc: "当前登录您账号的活跃设备列表。",
      revokeSession: "退出该设备",
      revokeAllSessions: "下线其他所有设备",
      activeNow: "当前在线",

      readingConf: "默认阅读器样式配置",
      fontSize: "字体大小",
      fontFamily: "字体类型",
      lineHeight: "行间距",
      lineNormal: "默认",
      lineMedium: "中等",
      lineWide: "宽松",
      themeBg: "阅读背景",
      themeLight: "明亮",
      themeDark: "极夜",
      themeSepia: "复古羊皮纸",
      favCategories: "感兴趣的分类 (3-5个)",
      notificationSettings: "系统通知推送",
      notifyNewChapters: "书架收藏的小说更新时推送通知",
      notifyReplies: "我的评论收到回复时推送通知",

      accountLevel: "修仙境界等级 (Level)",
      levelTitle: "境界等级",
      expNeeded: "突破境界所需EXP",
      titlesBadges: "获得徽章与称号",
      walletBalance: "书币钱包与资产",
      depositCoin: "充值代币 (永久)",
      bonusCoin: "赠送代币 (限时)",
      itemInventory: "我的道具背包",
      itemRecommendation: "推荐票",
      itemVote: "月票",
      itemGift: "投喂打赏礼包",
      txHistory: "交易与消费明细",
      txTabDeposit: "充值记录",
      txTabExpense: "消费记录",
      txTitle: "明细",
      txCost: "花费/金额",
      txTime: "时间",
      txStatus: "状态",
      txDetail: "描述",
      passMinLen: "密码长度不能少于4位。",
      passMismatch: "两次输入的密码不一致。",
      passChangeSuccess: "修改密码成功！",
      passChangeError: "修改密码失败。"
    }
  };

  const d = dict[lang] || dict.vi;

  // PROFILE STATE
  const [displayName, setDisplayName] = useState(user?.display_name || user?.username || '');
  const [birthday, setBirthday] = useState(user?.birthday || '1998-01-01');
  const [gender, setGender] = useState(user?.gender || 'male');
  const [bio, setBio] = useState(user?.bio || 'Ta là một người mê đọc truyện dịch AI...');
  const [avatarFrame, setAvatarFrame] = useState(user?.avatar_frame || 'default');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // SECURITY STATE
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const [phone, setPhone] = useState(user?.phone || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(!!user?.phone);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor === 1);

  // ÉP CỨNG ĐƯỜNG DẪN LINUX, BỎ QUA BỘ NHỚ ĐỆM CŨ
  const linuxPath = '/home/alida/Documents/Extension_reader_tool/ttS/matcha36_vocos10_standalone/models';
  const [downloadFolder, setDownloadFolder] = useState(linuxPath);
  
  useEffect(() => {
    if (isElectron) {
      const api = getElectronAPI();
      if (api && api.getModelsPath) {
        api.getModelsPath().then(p => {
          setDownloadFolder(p);
          localStorage.setItem('electron_downloadFolder', p);
        }).catch(err => {
          console.error("Failed to get models path:", err);
        });
      } else {
        localStorage.setItem('electron_downloadFolder', linuxPath);
      }
    } else if (isCapacitor) {
      setDownloadFolder("Bộ nhớ trong (Sandboxed App Storage)");
      localStorage.setItem('electron_downloadFolder', "Bộ nhớ trong (Sandboxed App Storage)");
    } else {
      localStorage.setItem('electron_downloadFolder', linuxPath);
    }
  }, []);
  const [systemInfo, setSystemInfo] = useState(null);
  const [systemInfoLoading, setSystemInfoLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({}); // { filename: percent }
  const [engineDlProgress, setEngineDlProgress] = useState(null); // { type, percent }
  const [engineInstalled, setEngineInstalled] = useState(false);
  const [localModels, setLocalModels] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, filename: '' });
  const [ttsDevice, setTtsDevice] = useState(localStorage.getItem('tts_device_pref') || 'auto');

  // MANUAL UPDATE STATES & HANDLERS
  const [manualChecking, setManualChecking] = useState(false);
  const [manualUpdateInfo, setManualUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [manualDownloadProgress, setManualDownloadProgress] = useState(0);
  const [manualDownloading, setManualDownloading] = useState(false);
  const [manualDlStatus, setManualDlStatus] = useState('');

  const handleManualCheckUpdates = async () => {
    setManualChecking(true);
    setManualUpdateInfo(null);
    try {
      if (isElectron) {
        const api = getElectronAPI();
        if (api && api.checkForUpdate) {
          const result = await api.checkForUpdate();
          if (result && result.success) {
            if (result.hasUpdate) {
              setManualUpdateInfo(result);
              setShowUpdateModal(true);
            } else {
              alert(lang === 'vi' ? 'Ứng dụng của bạn đã ở phiên bản mới nhất!' : 'Your application is already at the latest version!');
            }
          } else {
            alert(lang === 'vi' ? 'Không thể kết nối đến máy chủ cập nhật.' : 'Cannot connect to update server.');
          }
        }
      } else if (isCapacitor) {
        alert(lang === 'vi' ? 'Ứng dụng di động Android đang chạy phiên bản mới nhất!' : 'Android mobile app is running the latest version!');
      } else {
        // Trên web
        const res = await api.get('/api/releases');
        if (res.data?.success && res.data?.releases) {
          const releases = res.data.releases;
          const latestRelease = releases.desktop_linux || releases.desktop_windows;
          if (latestRelease) {
            const latestVersion = latestRelease.version;
            const currentVersion = '1.0.1'; // web version reference
            
            const parseV = (v) => (v || '0.0.0').replace(/^v/, '').split('.').map(Number);
            const [lMaj, lMin, lPat] = parseV(latestVersion);
            const [cMaj, cMin, cPat] = parseV(currentVersion);
            const hasNewer = lMaj > cMaj || (lMaj === cMaj && lMin > cMin) || (lMaj === cMaj && lMin === cMin && lPat > cPat);
            
            if (hasNewer) {
              setManualUpdateInfo({
                hasUpdate: true,
                latestVersion,
                currentVersion,
                downloadUrl: latestRelease.download_url,
                releaseNotes: latestRelease.release_notes,
                platform: 'web'
              });
              setShowUpdateModal(true);
            } else {
              alert(lang === 'vi' ? 'Hệ thống đã ở phiên bản mới nhất!' : 'System is already at the latest version!');
            }
          }
        }
      }
    } catch (e) {
      alert((lang === 'vi' ? 'Lỗi kiểm tra cập nhật: ' : 'Error checking update: ') + e.message);
    } finally {
      setManualChecking(false);
    }
  };

  const handleStartManualUpdate = async () => {
    if (!manualUpdateInfo) return;
    if (!isElectron) {
      window.location.href = '/downloads';
      return;
    }
    setManualDownloading(true);
    setManualDownloadProgress(0);
    setManualDlStatus(lang === 'vi' ? 'Đang tải bản cập nhật...' : 'Downloading update...');
    try {
      const { downloadUrl, latestVersion } = manualUpdateInfo;
      const isWin = downloadUrl?.includes('windows') || downloadUrl?.includes('win');
      const filename = isWin
        ? `TienHiepAI-Setup-${latestVersion}.exe`
        : `TienHiepAI-${latestVersion}.AppImage`;

      const api = getElectronAPI();
      const unsubscribe = api.onUpdateDownloadProgress((data) => {
        if (data && typeof data.percent === 'number') {
          setManualDownloadProgress(data.percent);
          setManualDlStatus(
            lang === 'vi'
              ? `Đang tải: ${data.percent}% (${(data.downloadedBytes / (1024 * 1024)).toFixed(1)}MB / ${(data.totalBytes / (1024 * 1024)).toFixed(1)}MB)`
              : `Downloading: ${data.percent}% (${(data.downloadedBytes / (1024 * 1024)).toFixed(1)}MB / ${(data.totalBytes / (1024 * 1024)).toFixed(1)}MB)`
          );
        }
      });

      const res = await api.downloadAndRunUpdate(downloadUrl, filename);
      unsubscribe();
      if (res && res.success) {
        setManualDlStatus(lang === 'vi' ? '✅ Tải xong! Đang khởi chạy installer...' : '✅ Complete! Launching installer...');
      } else {
        setManualDownloading(false);
        alert((lang === 'vi' ? 'Lỗi: ' : 'Error: ') + (res.error || 'Unknown'));
      }
    } catch (err) {
      setManualDownloading(false);
      alert((lang === 'vi' ? 'Lỗi hệ thống: ' : 'System error: ') + err.message);
    }
  };

  const fetchLocalModels = async () => {
    if (isElectron) {
      const api = getElectronAPI();
      if (api && api.listModels) {
        const models = await api.listModels(downloadFolder);
        setLocalModels(models);
      }
    } else if (isCapacitor) {
      setLocalModels([
        { name: 'Matcha-TTS (Cloud/Server API)', sizeMB: 19.2 },
        { name: 'Vocos Vocoder (Cloud/Server API)', sizeMB: 13.0 }
      ]);
    }
  };

  useEffect(() => {
    if (activeTab === 'tts_models') {
      if (isElectron) {
        fetchLocalModels();
      }
      handlePingServer();

      // Tự động thăm dò (Poll) kiểm tra kết nối mỗi 4 giây khi đang mở tab settings động cơ
      const interval = setInterval(() => {
        handlePingServer();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab, downloadFolder]);

  // Lắng nghe tín hiệu backend-ready từ Electron → tự ping ngay khi Python server sẵn sàng
  useEffect(() => {
    if (!isElectron) return;
    const api = getElectronAPI();
    if (!api || !api.onBackendReady) return;
    const unsub = api.onBackendReady(({ ready }) => {
      if (ready) {
        fetchLocalModels();
        handlePingServer();
      }
    });
    return () => { if (unsub) unsub(); };
  }, [isElectron]);


  // Social account connection mocks
  const [socials, setSocials] = useState({
    google: true,
    facebook: false,
    github: false,
    apple: false
  });

  // Logged-in active session list
  const [sessions, setSessions] = useState([]);

  // PREFERENCES STATE
  const [readerConf, setReaderConf] = useState({
    fontSize: parseInt(localStorage.getItem('reader_fontSize')) || 16,
    fontFamily: localStorage.getItem('reader_fontFamily') || 'font-sans',
    lineHeight: parseFloat(localStorage.getItem('reader_lineHeight')) || 1.6,
    theme: localStorage.getItem('reader_theme') || 'dark'
  });
  const [favTags, setFavTags] = useState(['玄幻', '仙侠', '科幻']);
  const [notifications, setNotifications] = useState({
    newChapter: true,
    replies: true
  });

  // WALLET & LEVEL STATE
  const [level, setLevel] = useState({
    name: user?.vip_status === 1 ? 'Trúc Cơ Kỳ (VIP)' : 'Luyện Khí Kỳ (Mortal)',
    exp: 720,
    maxExp: 1000,
    rank: user?.vip_status === 1 ? 'Chân Nhân' : 'Tán Tu'
  });
  const [badges, setBadges] = useState([
    { id: 1, title: 'Tân Thủ', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', icon: '🌱' },
    { id: 2, title: 'VIP Độc Giả', color: 'bg-amber-500/10 text-amber-400 border-amber-500/25', icon: '👑', active: user?.vip_status === 1 },
    { id: 3, title: 'Mọt Sách', color: 'bg-purple-500/10 text-purple-400 border-purple-500/25', icon: '📚' }
  ]);
  const [wallet, setWallet] = useState({
    coins: 125000,
    bonus: 2500,
    tickets: 5,
    votes: 3,
    gifts: 2
  });
  const [txTab, setTxTab] = useState('deposit');
  const [depositLogs, setDepositLogs] = useState([
    { id: 101, detail: 'Nạp qua MB Bank QR', amount: 50000, time: '2026-06-09 10:23', status: 'success' },
    { id: 102, detail: 'Nạp qua PayOS cổng tự động', amount: 100000, time: '2026-06-05 14:02', status: 'success' }
  ]);
  const [expenseLogs, setExpenseLogs] = useState([
    { id: 201, detail: 'Đăng ký VIP Gói Tháng', amount: -50000, time: '2026-06-09 10:25', status: 'success' },
    { id: 202, detail: 'Mua quà tặng Donate chương', amount: -15000, time: '2026-06-01 20:11', status: 'success' }
  ]);

  // Overall page messaging
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // STATS STATE
  const [stats, setStats] = useState(null);
  const [readingHistory, setReadingHistory] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0 phút';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const fetchSessions = async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/auth/sessions');
      if (res.data && res.data.success) {
        const curToken = localStorage.getItem('refreshToken');
        const activeOnly = res.data.sessions.filter(s => s.status === 'active');
        const mapped = activeOnly.map(s => ({
          id: s.id,
          device: `${s.os} (${s.browser})`,
          ip: s.ip_address,
          current: s.token === curToken,
          location: s.device_type === 'Desktop' ? 'Máy tính' : 'Điện thoại',
          token: s.token
        }));
        setSessions(mapped);
      }
    } catch (e) {
      console.error("Lỗi khi tải danh sách thiết bị:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile' && user) {
      fetchSessions();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === 'stats') {
      const fetchStatsAndHistory = async () => {
        setStatsLoading(true);
        try {
          const [statsRes, historyRes] = await Promise.all([
            api.get('/api/user/stats'),
            api.get('/api/user/history')
          ]);
          // API trả về {success, stats:{...}, recent_actions:[...]}
          setStats(statsRes.data?.stats || statsRes.data || null);
          // API trả về {history:[...], success}
          setReadingHistory(historyRes.data?.history || historyRes.data || []);
        } catch (e) {
          console.error("Lỗi khi tải thống kê & lịch sử:", e);
        } finally {
          setStatsLoading(false);
        }
      };
      fetchStatsAndHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'desktop' && (isElectron || isCapacitor)) {
      const fetchSystemInfo = async () => {
        setSystemInfoLoading(true);
        try {
          if (isElectron) {
            const api = getElectronAPI();
            if (api && api.getSystemInfo) {
              const info = await api.getSystemInfo();
              setSystemInfo(info);
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
              totalMemoryGB: navigator.deviceMemory || 'N/A',
              version: '1.0.18 (Capacitor Mobile)'
            });
          }
        } catch (e) {
          console.error("Lỗi khi tải thông tin hệ thống:", e);
        } finally {
          setSystemInfoLoading(false);
        }
      };
      fetchSystemInfo();
    }
  }, [activeTab]);

  useEffect(() => {
    if (isElectron) {
      const api = getElectronAPI();
      if (api && api.onDownloadProgress) {
        return api.onDownloadProgress((data) => {
          setDownloadProgress(prev => ({
            ...prev,
            [data.filename]: data.percent
          }));
        });
      }
    }
  }, []);

  const handleDownloadModel = async (modelId, url) => {
    if (isCapacitor) {
      alert("Mô hình AI trên ứng dụng di động được kết nối và xử lý trực tiếp qua Máy Chủ Cloud AI hoặc Server local của bạn để tối ưu pin và hiệu năng thiết bị di động.");
      return;
    }
    if (!isElectron) {
      alert("Tính năng tải trực tiếp Model siêu tốc độ chỉ hỗ trợ trên ứng dụng Desktop (.exe). Vui lòng tải app Desktop để dùng!");
      return;
    }
    
    try {
      const api = getElectronAPI();
      const filename = url.split('/').pop() || `${modelId}.onnx`;
      setDownloadProgress(prev => ({ ...prev, [filename]: 0 }));
      
      const res = await api.downloadModel(url, downloadFolder, filename);
      if (res.success) {
        // Tự động kích hoạt model trên API server Python
        try {
          await fetch('http://127.0.0.1:8001/reload_model', { method: 'POST' });
        } catch (e) {
          console.warn("API server chưa bật hoặc lỗi kết nối, tải thành công nhưng chưa kích hoạt được.");
        }
        
        // Remove from progress
        setDownloadProgress(prev => {
          const newP = { ...prev };
          delete newP[filename];
          return newP;
        });
        
        // Cập nhật lại kho model local & ping trạng thái
        await fetchLocalModels();
        await handlePingServer();
      } else {
        // Nếu backend báo lỗi
        console.error(`Lỗi tải: ${res.error}`);
        setDownloadProgress(prev => {
          const newP = { ...prev };
          delete newP[filename];
          return newP;
        });
      }
    } catch (e) {
      console.error(`Lỗi hệ thống: ${e.message || e}`);
      const filename = url.split('/').pop() || `${modelId}.onnx`;
      setDownloadProgress(prev => {
        const newP = { ...prev };
        delete newP[filename];
        return newP;
      });
    }
  };

  const handleDeleteModel = (filename) => {
    setDeleteModal({ open: true, filename });
  };

  const confirmDeleteModel = async () => {
    const filename = deleteModal.filename;
    setDeleteModal({ open: false, filename: '' });
    if (isElectron) {
      const api = getElectronAPI();
      if (api && api.deleteModel) {
        const filePath = `${downloadFolder}/${filename}`.replace(/\/\//g, '/');
        const res = await api.deleteModel(filePath);
        if (res.success) {
          await fetchLocalModels();
          try {
            await fetch('http://127.0.0.1:8001/reload_model', { method: 'POST' });
          } catch (e) {}
          await handlePingServer();
        }
      }
    }
  };

  const handleDeviceChange = (device) => {
    setTtsDevice(device);
    localStorage.setItem('tts_device_pref', device);
    // Gửi cấu hình cho Local TTS Server
    fetch('http://127.0.0.1:8001/set_device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device })
    }).catch(() => {});
  };

  // Check if engine binary exists on mount
  useEffect(() => {
    if (!isElectron) return;
    const api = getElectronAPI();
    if (!api || !api.checkBackendStatus) return;
    api.checkBackendStatus().then((status) => {
      // If backend is running OR error is NOT missing_engine, engine exists
      if (status && status.error !== 'missing_engine') {
        setEngineInstalled(true);
      } else {
        setEngineInstalled(false);
      }
    }).catch(() => {});
  }, [isElectron, engineDlProgress]);

  const handleDownloadEngine = async (type) => {
    if (!isElectron) return;
    const api = getElectronAPI();
    if (!api || !api.downloadEngine) return;
    
    const isWin = window.navigator.userAgent.indexOf('Windows') !== -1;
    const filename = isWin ? 'App_Doc_Truyen_Engine.exe' : 'App_Doc_Truyen_Engine';
    
    setEngineDlProgress({ type, percent: 0 });
    
    let unsubscribeProgress;
    if (api.onDownloadProgress) {
      unsubscribeProgress = api.onDownloadProgress((data) => {
        if (data.filename === filename) {
          setEngineDlProgress({ type, percent: data.percent });
        }
      });
    }
    
    try {
      if (api.stopBackend) {
        await api.stopBackend();
      }
      
      const res = await api.downloadEngine(type);
      if (res.success) {
        setEngineInstalled(true);
        alert("Đã tải và cài đặt Động cơ " + (type === 'gpu' ? 'GPU (CUDA)' : 'CPU-only') + " thành công!");
        if (api.startBackend) {
          await api.startBackend();
        }
        setTimeout(async () => {
          await fetchLocalModels();
          await handlePingServer();
        }, 3000);
      } else {
        alert("Lỗi khi tải động cơ: " + (res.error || "Không rõ nguyên nhân"));
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi tải động cơ: " + e.message);
    } finally {
      if (unsubscribeProgress) unsubscribeProgress();
      setEngineDlProgress(null);
    }
  };

  const handleTestSystemAudio = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime); // 440Hz A4
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 1);
    alert('Đã phát âm thanh Beep test hệ thống (1 giây). Nếu bạn nghe thấy tiếng "Bíp", loa và thẻ âm thanh đang hoạt động tốt.');
  };

  const [pingStats, setPingStats] = useState({ trans: '14ms', transRtf: '500x', tts: '23ms', rtf: '1.2x', localTts: 'Disconnected', isPinging: false });

  const handlePingServer = async () => {
      const apiEl = isElectron ? getElectronAPI() : null;
      const logToApp = (msg) => {
        if (apiEl && apiEl.logDebug) {
          apiEl.logDebug(msg);
        }
        console.log(msg);
      };

      logToApp(`[Ping Check] Bắt đầu kiểm tra kết nối (Ping)... Trạng thái trình duyệt: navigator.onLine = ${navigator.onLine}, UserAgent = ${navigator.userAgent}`);
      setPingStats({ trans: 'Pinging...', transRtf: '...', tts: 'Pinging...', rtf: '...', localTts: 'Pinging...', isPinging: true });
      
      const pingTranslation = async () => {
        logToApp("[Ping Check] [Dịch thuật] Khởi tạo tiến trình...");
        try {
          const transText = "Thiên địa sơ khai, vạn vật hỗn độn. Lâm Động từ từ mở mắt ra, nhìn thấy một tia sáng le lói từ chân trời.";
          logToApp(`[Ping Check] [Dịch thuật] Đang thực hiện warmup request (Timeout 4s)...`);
          try {
            await api.post('/translate', {
              texts: ["Khởi động hệ thống dịch"],
              mode: "advanced",
              vip_key: "VIP_SERVER"
            }, { signal: AbortSignal.timeout(4000) });
            logToApp(`[Ping Check] [Dịch thuật] Warmup hoàn tất.`);
          } catch (e) {
            logToApp(`[Ping Check] [Dịch thuật] Warmup bỏ qua hoặc lỗi nhẹ: ${e.message}`);
          }
          
          logToApp(`[Ping Check] [Dịch thuật] Đang gửi request dịch chính thức (Timeout 8s)...`);
          const t0 = performance.now();
          const response = await api.post('/translate', {
            texts: [transText],
            mode: "advanced",
            vip_key: "VIP_SERVER"
          }, { signal: AbortSignal.timeout(8000) });
          const transTime = performance.now() - t0;
          
          logToApp(`[Ping Check] [Dịch thuật] Đã nhận phản hồi sau ${Math.round(transTime)}ms. HTTP status: ${response.status}`);
          const readingDuration = transText.length / 15;
          const transDuration = transTime / 1000;
          const transRtfValue = readingDuration / transDuration;
          
          const result = {
            trans: `${Math.round(transTime)}ms`,
            transRtf: `${transRtfValue.toFixed(1)}x`
          };
          logToApp(`[Ping Check] [Dịch thuật] Thành công. RTF = ${result.transRtf}. Dữ liệu thô JSON nhận được: ${JSON.stringify(response.data)}`);
          return result;
        } catch (e) {
          const errorInfo = {
            message: e.message,
            code: e.code,
            status: e.response ? e.response.status : null,
            data: e.response ? e.response.data : null,
            stack: e.stack
          };
          logToApp(`[Ping Check] [Dịch thuật] THẤT BẠI! Chi tiết cấu trúc lỗi hệ thống: ${JSON.stringify(errorInfo)}`);
          return { trans: 'Timeout', transRtf: 'Lỗi' };
        }
      };
      
      const pingTTS = async () => {
        logToApp("[Ping Check] [Cloud TTS] Khởi tạo tiến trình...");
        try {
          const ttsInput = "Thiên địa sơ khai, vạn vật hỗn độn. Lâm Động từ từ mở mắt ra.";
          logToApp(`[Ping Check] [Cloud TTS] Đang thực hiện warmup request (Timeout 4s)...`);
          try {
            await api.post('/v1/audio/speech', {
              model: "matcha-tts",
              input: "Khởi động",
              voice: "ngao_the_cuu_trong_thien",
              response_format: "wav",
              speed: 1.0,
              vip_key: "VIP_SERVER"
            }, { responseType: 'arraybuffer', signal: AbortSignal.timeout(4000) });
            logToApp(`[Ping Check] [Cloud TTS] Warmup hoàn tất.`);
          } catch (e) {
            logToApp(`[Ping Check] [Cloud TTS] Warmup bỏ qua hoặc lỗi nhẹ: ${e.message}`);
          }
          
          logToApp(`[Ping Check] [Cloud TTS] Đang gửi request tạo âm thanh chính thức (Timeout 8s)...`);
          const t1 = performance.now();
          const response = await api.post('/v1/audio/speech', {
            model: "matcha-tts",
            input: ttsInput,
            voice: "ngao_the_cuu_trong_thien",
            response_format: "wav",
            speed: 1.0,
            vip_key: "VIP_SERVER"
          }, { responseType: 'arraybuffer', signal: AbortSignal.timeout(8000) });
          
          const ttsTime = performance.now() - t1;
          logToApp(`[Ping Check] [Cloud TTS] Đã nhận phản hồi sau ${Math.round(ttsTime)}ms. HTTP status: ${response.status}`);
          
          const audioBuffer = response.data;
          logToApp(`[Ping Check] [Cloud TTS] Dữ liệu nhị phân nhận được: ${audioBuffer ? audioBuffer.byteLength : 0} bytes. Đang giải mã Audio Data...`);
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const decoded = await audioContext.decodeAudioData(audioBuffer.slice(0)); // clone buffer
          const durationSeconds = decoded.duration;
          const rtf = durationSeconds / (ttsTime / 1000);
          
          const result = {
            tts: `${Math.round(ttsTime)}ms`,
            rtf: `${rtf.toFixed(2)}x`
          };
          logToApp(`[Ping Check] [Cloud TTS] Thành công. RTF = ${result.rtf}, Độ dài âm thanh = ${durationSeconds.toFixed(3)}s. Headers: ${JSON.stringify(response.headers)}`);
          return result;
        } catch (e) {
          const errorInfo = {
            message: e.message,
            code: e.code,
            status: e.response ? e.response.status : null,
            data: e.response ? (e.response.data instanceof ArrayBuffer ? '[ArrayBuffer]' : e.response.data) : null,
            stack: e.stack
          };
          logToApp(`[Ping Check] [Cloud TTS] THẤT BẠI! Chi tiết cấu trúc lỗi hệ thống: ${JSON.stringify(errorInfo)}`);
          return { tts: 'Timeout', rtf: 'Timeout' };
        }
      };
      
      const pingLocalTTS = async () => {
        logToApp("[Ping Check] [Local TTS] Khởi tạo tiến trình...");
        try {
          logToApp(`[Ping Check] [Local TTS] Đang kết nối tới http://127.0.0.1:8001/health (Timeout 8s)...`);
          const localT0 = performance.now();
          const localRes = await fetch('http://127.0.0.1:8001/health', {
            method: 'GET',
            signal: AbortSignal.timeout(8000)
          });
          const localTime = performance.now() - localT0;
          logToApp(`[Ping Check] [Local TTS] Đã nhận phản hồi sau ${Math.round(localTime)}ms. HTTP status: ${localRes.status}`);
          
          if (localRes.ok) {
            const data = await localRes.json();
            let resultText = '';
            if (data.status === 'need_model') {
              resultText = `Connected (Chưa có Model) - ${Math.round(localTime)}ms`;
            } else {
              resultText = `Connected (${data.device}) - ${Math.round(localTime)}ms`;
            }
            logToApp(`[Ping Check] [Local TTS] Thành công: ${resultText}. Dữ liệu thô JSON nhận được: ${JSON.stringify(data)}`);
            return { localTts: resultText };
          } else {
            let errText = '';
            try { errText = await localRes.text(); } catch (_) {}
            logToApp(`[Ping Check] [Local TTS] Lỗi phản hồi HTTP không OK. Status = ${localRes.status}. Chi tiết phản hồi: ${errText}`);
            return { localTts: 'Lỗi Cổng' };
          }
        } catch (e) {
          const errorInfo = {
            message: e.message,
            stack: e.stack
          };
          logToApp(`[Ping Check] [Local TTS] THẤT BẠI! Chi tiết lỗi: ${JSON.stringify(errorInfo)}`);
          return { localTts: 'Disconnected' };
        }
      };
      
      // Run all pings in parallel
      const [transRes, ttsRes, localTtsRes] = await Promise.all([
        pingTranslation(),
        pingTTS(),
        pingLocalTTS()
      ]);
      
      logToApp(`[Ping Check] ✅ Hoàn tất tất cả kiểm tra ping.`);
      
      setPingStats({
        trans: transRes.trans,
        transRtf: transRes.transRtf,
        tts: ttsRes.tts,
        rtf: ttsRes.rtf,
        localTts: localTtsRes.localTts,
        isPinging: false
      });
    };



  const mustChangePassword = user?.require_password_change === 1 || user?.require_password_change === true;

  // Sync preference state changes with localStorage
  useEffect(() => {
    localStorage.setItem('reader_fontSize', readerConf.fontSize);
    localStorage.setItem('reader_fontFamily', readerConf.fontFamily);
    localStorage.setItem('reader_lineHeight', readerConf.lineHeight);
    localStorage.setItem('reader_theme', readerConf.theme);
  }, [readerConf]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage('');
    setProfileError('');
    try {
      // API request to save details
      const res = await api.post('/api/auth/update-profile', {
        display_name: displayName,
        birthday: birthday,
        gender: gender,
        bio: bio,
        avatar: avatar,
        avatar_frame: avatarFrame
      });
      setProfileMessage(d.saveSuccess);
      const updatedUser = {
        ...user,
        display_name: displayName,
        birthday: birthday,
        gender: gender,
        bio: bio,
        avatar: avatar,
        avatar_frame: avatarFrame
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error(err);
      // Fallback optimistic save
      const updatedUser = {
        ...user,
        display_name: displayName,
        birthday: birthday,
        gender: gender,
        bio: bio,
        avatar: avatar,
        avatar_frame: avatarFrame
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfileMessage(d.saveSuccess);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 4) {
      setPassError(d.passMinLen);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError(d.passMismatch);
      return;
    }

    setChangePassLoading(true);
    try {
      const payload = {
        new_password: newPassword
      };
      if (!mustChangePassword) {
        payload.old_password = oldPassword;
      }

      const res = await api.post('/api/auth/change-password', payload);
      setPassSuccess(res.data.message || d.passChangeSuccess);
      
      if (user) {
        const updatedUser = { ...user, require_password_change: 0 };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.response?.data?.error || d.passChangeError);
    } finally {
      setChangePassLoading(false);
    }
  };

  const handleSendOtp = () => {
    if (!phone) {
      alert("Vui lòng nhập số điện thoại trước.");
      return;
    }
    setOtpSent(true);
    alert("Hệ thống đã giả lập mã OTP gửi tới " + phone + ". Nhập 123456 để xác thực.");
  };

  const handleVerifyOtp = () => {
    if (otp === '123456') {
      setPhoneVerified(true);
      setOtpSent(false);
      alert("Xác thực số điện thoại thành công!");
    } else {
      alert("Mã OTP không chính xác. Thử lại với 123456.");
    }
  };

  const toggle2FA = () => {
    if (!phoneVerified) {
      alert("Bạn phải liên kết số điện thoại trước khi bật 2FA.");
      return;
    }
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const revokeSession = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn đăng xuất thiết bị này không?")) return;
    try {
      const res = await api.post('/api/auth/sessions/revoke', { session_id: id });
      if (res.data && res.data.success) {
        fetchSessions();
      }
    } catch (e) {
      console.error("Lỗi khi hủy phiên đăng nhập:", e);
      alert("Không thể đăng xuất thiết bị. Vui lòng thử lại sau.");
    }
  };

  const revokeAllSessions = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn đăng xuất tất cả các thiết bị khác không?")) return;
    try {
      const otherSessions = sessions.filter(s => !s.current);
      await Promise.all(otherSessions.map(s => 
        api.post('/api/auth/sessions/revoke', { session_id: s.id })
      ));
      fetchSessions();
    } catch (e) {
      console.error("Lỗi khi đăng xuất tất cả thiết bị khác:", e);
      alert("Lỗi khi thực hiện đăng xuất hàng loạt.");
    }
  };

  const toggleTag = (tag) => {
    setFavTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const formatCurrency = (val) => {
    const num = Number(val);
    if (isNaN(num)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
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

  // Get current avatar frame border style
  const getFrameStyle = () => {
    switch (avatarFrame) {
      case 'vip':
        return 'bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse p-[4px]';
      case 'event':
        return 'bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.6)] p-[4px]';
      default:
        return 'bg-slate-800 border border-slate-700/60 p-[2px]';
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-purple-400 animate-spin-slow" /> {t.settings?.title || "⚙️ Cài đặt Tài khoản"}
          </h2>
          <p className="text-slate-400 text-xs mt-1">Quản lý hồ sơ, ví tài sản, cấp bậc tu tiên, bảo mật hai lớp và cấu hình trình đọc đám mây.</p>
        </div>

        {mustChangePassword && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-300 text-sm shadow-lg shadow-amber-500/5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">{t.settings?.mustChangePassTitle || "Yêu cầu đặt mật khẩu mới"}</strong>
              {t.settings?.mustChangePassDesc || "Đây là lần đầu tiên bạn đăng nhập bằng Google. Vui lòng thiết lập mật khẩu riêng cho tài khoản để có thể đăng nhập trực tiếp bằng Email sau này."}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel Sidebar Tabs (horizontal scrollable on mobile) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-5 flex flex-col items-center text-center shadow-xl">
              <div className="relative mb-4">
                <div className={`rounded-full ${getFrameStyle()} flex items-center justify-center`}>
                  <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-[#0b0b14] text-white text-3xl font-black relative shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 to-brand-500/30" />
                    {user.avatar ? (
                      <img src={user.avatar} className="w-full h-full object-cover relative z-10" alt="avatar" />
                    ) : (
                      <span className="relative z-10">{user.username ? user.username[0].toUpperCase() : 'U'}</span>
                    )}
                  </div>
                </div>
                {user.vip_status === 1 && (
                  <span className="absolute -bottom-1 -right-1 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0b0b14] font-black text-[9px] rounded-full uppercase tracking-wider shadow-[0_2px_8px_rgba(245,158,11,0.4)] border border-yellow-300 z-20">
                    VIP
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-white text-base truncate max-w-full">{displayName || user.username}</h3>
              <p className="text-purple-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{level.name}</p>

              <div className="w-full border-t border-white/5 my-4" />

              <div className="w-full text-left space-y-2.5">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Tên đăng nhập</span>
                  <span className="text-xs text-slate-200 font-bold">@{user.username}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Mã ID kết bạn</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-amber-300 font-mono font-bold tracking-widest">
                      #{user.user_code || user.id}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(user.user_code || String(user.id)); alert('Đã sao chép mã ID!'); }}
                      className="text-[9px] text-slate-500 hover:text-purple-400 transition-colors"
                      title="Sao chép mã ID"
                    >📋</button>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-0.5">Chia sẻ mã này để bạn bè thêm bạn</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{t.settings?.emailLabel || "Địa chỉ Email"}</span>
                  <span className="text-xs text-slate-300 truncate block">{user.email || 'Chưa thiết lập'}</span>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible no-scrollbar">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
                  activeTab === 'profile' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <User className="w-4 h-4" /> {d.profileTab}
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
                  activeTab === 'security' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Shield className="w-4 h-4" /> {d.securityTab}
              </button>
              <button 
                onClick={() => setActiveTab('preferences')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
                  activeTab === 'preferences' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Sliders className="w-4 h-4" /> {d.prefTab}
              </button>
              <button 
                onClick={() => setActiveTab('wallet')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
                  activeTab === 'wallet' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Coins className="w-4 h-4" /> {d.walletTab}
              </button>
              <button 
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
                  activeTab === 'stats' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Thống kê & Lịch sử
              </button>
              <button 
                onClick={() => setActiveTab('desktop')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
                  activeTab === 'desktop' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Laptop className="w-4 h-4" /> {isElectron ? 'Cấu hình Desktop' : (isCapacitor ? 'Cấu hình Android' : 'Tải Bản Desktop')}
              </button>
              <button 
                onClick={() => setActiveTab('tts_models')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
                  activeTab === 'tts_models' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Tv className="w-4 h-4" /> Quản lý Giọng AI
              </button>
              <button 
                onClick={() => setActiveTab('ai_translation')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
                  activeTab === 'ai_translation' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <BrainCircuit className="w-4 h-4" /> Cấu hình Dịch & AI
              </button>

              <div className="hidden lg:block w-full border-t border-white/5 my-1" />

              <button 
                onClick={() => navigate('/sects')}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left text-slate-400 hover:text-white hover:bg-white/[0.03]"
              >
                <Crown className="w-4 h-4 text-amber-400" /> Tông Môn (Sects)
              </button>
              <button 
                onClick={() => navigate('/messages')}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left text-slate-400 hover:text-white hover:bg-white/[0.03]"
              >
                <MessageSquare className="w-4 h-4 text-purple-400" /> Hộp thư đàm đạo
              </button>
              <button 
                onClick={() => navigate('/developer')}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left text-slate-400 hover:text-white hover:bg-white/[0.03]"
              >
                <Terminal className="w-4 h-4 text-blue-400" /> API Keys & Developer
              </button>
            </div>

          </div>

          {/* Right Panel Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* TAB 1: PROFILE CUSTOMIZATION */}
            {activeTab === 'profile' && (
              <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-6">
                <div className="border-b border-[#1f1f3a]/60 pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-400" /> {d.profileTab}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Thông tin hiển thị khi đi viết đánh giá, lời giới thiệu bản thân.</p>
                </div>

                {profileMessage && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> {profileMessage}
                  </div>
                )}

                <form onSubmit={handleProfileSave} className="space-y-4">
                  {/* Thay đổi ảnh đại diện */}
                  <div className="bg-[#0b0b14]/60 p-4 border border-[#1f1f3a]/60 rounded-xl space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ảnh Đại Diện (Avatar)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Avatar Preview */}
                      <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-[#05050a] text-white border border-purple-500/30 shrink-0">
                        {avatar ? (
                          <img src={avatar} className="w-full h-full object-cover" alt="Avatar Preview" onError={(e) => { e.target.src = ''; }} />
                        ) : (
                          <span className="text-xl font-bold">{user.username ? user.username[0].toUpperCase() : 'U'}</span>
                        )}
                      </div>
                      
                      {/* URL Input */}
                      <div className="flex-1 w-full space-y-1.5">
                        <input 
                          type="text" 
                          placeholder="Dán liên kết hình ảnh (https://...) tại đây"
                          value={avatar}
                          onChange={(e) => setAvatar(e.target.value)}
                          className="w-full px-4 py-2 bg-[#05050a] border border-[#1f1f3a] rounded-xl text-xs text-slate-200 outline-none focus:border-purple-500 transition-colors"
                        />
                        <span className="text-[10px] text-slate-500 block">Hoặc chọn một trong các nhân vật đại diện dễ thương bên dưới:</span>
                      </div>
                    </div>

                    {/* Presets List */}
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1.5">
                      {[
                        { name: 'Nghịch Thiên', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=NghichThien' },
                        { name: 'Kiếm Hồn', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KiemHon' },
                        { name: 'Thần Thú', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ThanThu' },
                        { name: 'Yêu Tộc', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YeuToc' },
                        { name: 'Thư Sinh', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=ThuSinh' },
                        { name: 'Tử Yên', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=TuYen' },
                        { name: 'Tiêu Dao', url: 'https://api.dicebear.com/7.x/micah/svg?seed=TieuDao' }
                      ].map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(p.url)}
                          className={`p-1 bg-[#05050a] border rounded-lg hover:border-purple-500 hover:scale-105 transition-all flex flex-col items-center gap-1 ${
                            avatar === p.url ? 'border-purple-500 bg-purple-500/10' : 'border-[#1f1f3a]'
                          }`}
                          title={p.name}
                        >
                          <img src={p.url} className="w-8 h-8 rounded-full" alt={p.name} />
                          <span className="text-[8px] text-slate-500 truncate max-w-full">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.displayName}</label>
                      <input 
                        type="text" 
                        placeholder={d.displayNamePlaceholder}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.avatarFrame}</label>
                      <select 
                        value={avatarFrame}
                        onChange={(e) => setAvatarFrame(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-slate-300 outline-none focus:border-purple-500"
                      >
                        <option value="default">{d.frameDefault}</option>
                        <option value="vip" disabled={user?.vip_status !== 1}>{d.frameVip} {!user?.vip_status && '🔒'}</option>
                        <option value="event">{d.frameEvent}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.birthday}</label>
                      <input 
                        type="date" 
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-slate-300 outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.gender}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['male', 'female', 'other'].map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                              gender === g
                                ? 'bg-purple-600/25 border-purple-500 text-purple-300'
                                : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:text-white'
                            }`}
                          >
                            {g === 'male' ? d.genderMale : g === 'female' ? d.genderFemale : d.genderOther}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.bio}</label>
                    <textarea 
                      rows={3}
                      placeholder={d.bioPlaceholder}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full p-4 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-slate-300 outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    {savingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    {d.saveBtn}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: SECURITY & TWO-FACTOR AUTH */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                
                {/* Password Change */}
                <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#1f1f3a]/60 pb-3">
                    <KeyRound className="w-5 h-5 text-brand-400" />
                    <h4 className="font-extrabold text-white text-sm">{t.settings?.changePassTitle || "Đổi Mật Khẩu"}</h4>
                  </div>

                  {passError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                      {passError}
                    </div>
                  )}

                  {passSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> {passSuccess}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {!mustChangePassword && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{t.settings?.currentPassLabel || "Mật khẩu hiện tại"}</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="password"
                            placeholder={t.settings?.currentPassPlaceholder || "Nhập mật khẩu hiện tại"}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{t.settings?.newPassLabel || "Mật khẩu mới"}</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="password"
                            placeholder={t.settings?.newPassPlaceholder || "Tối thiểu 4 ký tự"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{t.settings?.confirmPassLabel || "Xác nhận mật khẩu mới"}</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="password"
                            placeholder={t.settings?.confirmPassPlaceholder || "Xác nhận mật khẩu mới"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={changePassLoading}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
                    >
                      {changePassLoading ? (t.settings?.updating || 'Đang cập nhật...') : (t.settings?.updateBtn || 'Cập nhật Mật khẩu')}
                    </button>
                  </form>
                </div>

                {/* OTP & Phone Number Link */}
                <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#1f1f3a]/60 pb-3">
                    <Smartphone className="w-5 h-5 text-purple-400" />
                    <h4 className="font-extrabold text-white text-sm">{d.phoneNumber} & Xác thực OTP</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.phoneNumber}</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder={d.phonePlaceholder}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={phoneVerified}
                          className="flex-1 px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none disabled:opacity-60 focus:border-purple-500"
                        />
                        {!phoneVerified && (
                          <button 
                            type="button"
                            onClick={handleSendOtp}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-[10px] shrink-0"
                          >
                            {otpSent ? 'Gửi lại' : d.getOtp}
                          </button>
                        )}
                      </div>
                    </div>

                    {otpSent && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.enterOtp}</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Mã 6 số (123456)"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none text-center font-mono tracking-widest focus:border-purple-500"
                          />
                          <button 
                            type="button"
                            onClick={handleVerifyOtp}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-[10px] shrink-0"
                          >
                            {d.verifyBtn}
                          </button>
                        </div>
                      </div>
                    )}

                    {phoneVerified && (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mt-6">
                        <CheckCircle className="w-4 h-4" /> Đã liên kết & xác thực OTP số điện thoại!
                      </div>
                    )}
                  </div>

                  {/* 2FA Toggle */}
                  <div className="flex items-center justify-between p-4 bg-[#0b0b14]/50 border border-[#1f1f3a] rounded-xl mt-2">
                    <div className="space-y-1 max-w-[80%]">
                      <strong className="text-xs text-white block">{d.twoFactor}</strong>
                      <span className="text-[10px] text-slate-400 block leading-relaxed">{d.twoFactorDesc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggle2FA}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        twoFactorEnabled ? 'bg-purple-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Third party links */}
                <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="border-b border-[#1f1f3a]/60 pb-3">
                    <h4 className="font-extrabold text-white text-sm">{d.authLinks}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Liên kết OAuth để đăng nhập nhanh bằng 1 click chuột.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Google */}
                    <div className="flex items-center justify-between p-3.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span className="text-base">🔴</span> Google
                      </div>
                      <span className="text-[10px] text-emerald-400 font-extrabold uppercase flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {d.authLinked}
                      </span>
                    </div>
                    {/* Github */}
                    <div className="flex items-center justify-between p-3.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span className="text-base">🐙</span> GitHub
                      </div>
                      <button 
                        onClick={() => setSocials(prev => ({...prev, github: true}))}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all uppercase ${
                          socials.github 
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                            : 'text-slate-400 bg-white/5 border border-white/10 hover:text-white'
                        }`}
                      >
                        {socials.github ? d.authLinked : d.authLinkBtn}
                      </button>
                    </div>
                    {/* Facebook */}
                    <div className="flex items-center justify-between p-3.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span className="text-base">🔵</span> Facebook
                      </div>
                      <button 
                        onClick={() => setSocials(prev => ({...prev, facebook: true}))}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all uppercase ${
                          socials.facebook 
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                            : 'text-slate-400 bg-white/5 border border-white/10 hover:text-white'
                        }`}
                      >
                        {socials.facebook ? d.authLinked : d.authLinkBtn}
                      </button>
                    </div>
                    {/* Apple */}
                    <div className="flex items-center justify-between p-3.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span className="text-base">🍏</span> Apple ID
                      </div>
                      <button 
                        onClick={() => setSocials(prev => ({...prev, apple: true}))}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all uppercase ${
                          socials.apple 
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                            : 'text-slate-400 bg-white/5 border border-white/10 hover:text-white'
                        }`}
                      >
                        {socials.apple ? d.authLinked : d.authLinkBtn}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Session management */}
                <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1f1f3a]/60 pb-3">
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{d.sessionTitle}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">{d.sessionDesc}</p>
                    </div>
                    {sessions.length > 1 && (
                      <button 
                        onClick={revokeAllSessions}
                        className="text-red-400 hover:text-red-300 font-extrabold text-[10px] transition-colors"
                      >
                        {d.revokeAllSessions}
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {sessions.map(s => (
                      <div key={s.id} className="flex justify-between items-center p-3.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-600/10 border border-purple-500/25 rounded-lg text-purple-400">
                            {s.device.includes('iPhone') ? <PhoneIcon className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{s.device}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">IP: {s.ip} · {s.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {s.current ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-black uppercase rounded">
                              {d.activeNow}
                            </span>
                          ) : (
                            <button 
                              onClick={() => revokeSession(s.id)}
                              className="p-1.5 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400 hover:bg-red-500/20 transition-all"
                              title={d.revokeSession}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: READING PREFERENCES & CLOUD SYNC */}
            {activeTab === 'preferences' && (
              <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-6">
                <div className="border-b border-[#1f1f3a]/60 pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-purple-400" /> {d.readingConf}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Cấu hình được tự động lưu lên đám mây và đồng bộ giữa các thiết bị di động/máy tính.</p>
                </div>

                {/* Reader Settings Config */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* Font Size */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.fontSize} ({readerConf.fontSize}px)</label>
                      <input 
                        type="range" 
                        min="12" 
                        max="32" 
                        step="1"
                        value={readerConf.fontSize}
                        onChange={(e) => setReaderConf(prev => ({...prev, fontSize: parseInt(e.target.value)}))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    {/* Font Family */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.fontFamily}</label>
                      <select 
                        value={readerConf.fontFamily}
                        onChange={(e) => setReaderConf(prev => ({...prev, fontFamily: e.target.value}))}
                        className="w-full px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-slate-300 outline-none"
                      >
                        <option value="font-sans">Sans-serif (Hiện đại)</option>
                        <option value="font-serif">Serif (Cổ điển)</option>
                        <option value="font-mono">Monospace (Lập trình viên)</option>
                      </select>
                    </div>

                    {/* Line Height */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.lineHeight}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[1.4, 1.6, 1.8].map(lh => (
                          <button
                            key={lh}
                            type="button"
                            onClick={() => setReaderConf(prev => ({...prev, lineHeight: lh}))}
                            className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                              readerConf.lineHeight === lh
                                ? 'bg-purple-600/25 border-purple-500 text-purple-300'
                                : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:text-white'
                            }`}
                          >
                            {lh === 1.4 ? d.lineNormal : lh === 1.6 ? d.lineMedium : d.lineWide}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Theme Bg */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.themeBg}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['light', 'dark', 'sepia'].map(th => (
                          <button
                            key={th}
                            type="button"
                            onClick={() => setReaderConf(prev => ({...prev, theme: th}))}
                            className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                              readerConf.theme === th
                                ? 'bg-purple-600/25 border-purple-500 text-purple-300'
                                : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:text-white'
                            }`}
                          >
                            {th === 'light' ? d.themeLight : th === 'dark' ? d.themeDark : d.themeSepia}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Settings Preview Area */}
                  <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-2xl p-4 flex flex-col justify-between space-y-4">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Xem trước hiển thị đọc</span>
                    <div 
                      className={`p-4 rounded-xl border flex-1 transition-all ${
                        readerConf.theme === 'light' 
                          ? 'bg-slate-100 text-slate-900 border-slate-200' 
                          : readerConf.theme === 'sepia' 
                            ? 'bg-[#f4eccf] text-[#433422] border-[#e4d6a7]' 
                            : 'bg-[#0d0d1e] text-slate-200 border-purple-500/20'
                      }`}
                      style={{ 
                        fontSize: `${readerConf.fontSize}px`, 
                        lineHeight: readerConf.lineHeight 
                      }}
                    >
                      <h5 className="font-extrabold mb-2 text-sm">Chương 1: Khởi Đầu Mới</h5>
                      <p className={`text-[0.75em] ${readerConf.fontFamily}`}>
                        Thế giới này rộng lớn vô cùng. Võ giả rèn luyện khí huyết, đột phá xiềng xích nhân loại, bước lên con đường võ đạo đỉnh phong...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full border-t border-[#1f1f3a]/60 my-4" />

                {/* Favorite Tag Preferences */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.favCategories}</label>
                  <div className="flex flex-wrap gap-2">
                    {["玄幻", "都市", "言情", "女生", "科幻", "修真", "仙侠", "武侠", "历史", "网游", "同人", "其他"].map(tag => {
                      const tagLabel = tag === "玄幻" ? "Huyền Huyễn" : tag === "都市" ? "Đô Thị" : tag === "言情" ? "Ngôn Tình" : tag === "科幻" ? "Khoa Huyễn" : tag === "仙侠" ? "Tiên Hiệp" : tag === "修真" ? "Tu Chân" : tag;
                      const isSelected = favTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            isSelected 
                              ? 'bg-purple-600 border-purple-500 text-white shadow-md' 
                              : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:text-white'
                          }`}
                        >
                          {tagLabel} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full border-t border-[#1f1f3a]/60 my-4" />

                {/* Notification Settings */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.notificationSettings}</label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-[#0b0b14]/50 border border-[#1f1f3a] rounded-xl">
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-slate-200 font-bold">{d.notifyNewChapters}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifications(prev => ({...prev, newChapter: !prev.newChapter}))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          notifications.newChapter ? 'bg-purple-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            notifications.newChapter ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-[#0b0b14]/50 border border-[#1f1f3a] rounded-xl">
                      <div className="flex items-center gap-3">
                        <Compass className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-slate-200 font-bold">{d.notifyReplies}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifications(prev => ({...prev, replies: !prev.replies}))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          notifications.replies ? 'bg-purple-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            notifications.replies ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: WALLET & LEVEL GAMIFICATION */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                
                {/* Level Tu Tiên */}
                <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-[#1f1f3a]/60 pb-3">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400 animate-pulse" /> {d.accountLevel}
                    </h3>
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black uppercase">
                      {level.rank}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">{d.levelTitle}: <strong className="text-white font-extrabold">{level.name}</strong></span>
                      <span className="text-slate-400 font-mono">{level.exp} / {level.maxExp} EXP</span>
                    </div>

                    {/* Animated EXP bar */}
                    <div className="w-full bg-[#0b0b14] h-3.5 rounded-full overflow-hidden border border-[#1f1f3a] p-0.5">
                      <div 
                        className="bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-600 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(level.exp / level.maxExp) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block italic leading-relaxed">
                      💡 {d.expNeeded}: {level.maxExp - level.exp} EXP. Đọc thêm truyện mỗi ngày hoặc ủng hộ dịch giả để thăng cấp cảnh giới nhanh hơn!
                    </span>
                  </div>

                  {/* Badges and Titles Grid */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.titlesBadges}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {badges.map(b => (
                        <div 
                          key={b.id} 
                          className={`p-3 rounded-xl border text-center space-y-1 ${b.color} relative overflow-hidden transition-all hover:scale-102`}
                        >
                          <span className="text-lg block">{b.icon}</span>
                          <strong className="text-[10px] font-bold block whitespace-nowrap">{b.title}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ví Tiền & Vật Phẩm */}
                <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="border-b border-[#1f1f3a]/60 pb-3">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Coins className="w-5 h-5 text-purple-400" /> {d.walletBalance}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Coin nạp */}
                    <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-4 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{d.depositCoin}</span>
                        <strong className="text-lg text-emerald-400 font-black font-mono">{wallet.coins.toLocaleString()}</strong>
                      </div>
                      <span className="text-2xl">🪙</span>
                    </div>

                    {/* Xu thưởng */}
                    <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-4 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{d.bonusCoin}</span>
                        <strong className="text-lg text-amber-400 font-black font-mono">{wallet.bonus.toLocaleString()}</strong>
                      </div>
                      <span className="text-2xl">🎁</span>
                    </div>
                  </div>

                  {/* Kho Vật Phẩm (Inventory) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.itemInventory}</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-3 text-center space-y-1">
                        <span className="text-xl block">🎫</span>
                        <strong className="text-[10px] text-white block">{d.itemRecommendation}</strong>
                        <span className="text-xs text-purple-400 font-black font-mono">x{wallet.tickets}</span>
                      </div>
                      <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-3 text-center space-y-1">
                        <span className="text-xl block">⚡</span>
                        <strong className="text-[10px] text-white block">{d.itemVote}</strong>
                        <span className="text-xs text-purple-400 font-black font-mono">x{wallet.votes}</span>
                      </div>
                      <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-3 text-center space-y-1">
                        <span className="text-xl block">💎</span>
                        <strong className="text-[10px] text-white block">{d.itemGift}</strong>
                        <span className="text-xs text-purple-400 font-black font-mono">x{wallet.gifts}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction history logs */}
                <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-[#1f1f3a]/60 pb-3">
                    <h3 className="text-sm font-extrabold text-white">{d.txHistory}</h3>
                    <div className="flex gap-1 bg-[#0b0b14] border border-[#1f1f3a] rounded-lg p-0.5">
                      <button
                        onClick={() => setTxTab('deposit')}
                        className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                          txTab === 'deposit' 
                            ? 'bg-purple-600 text-white' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {d.txTabDeposit}
                      </button>
                      <button
                        onClick={() => setTxTab('expense')}
                        className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                          txTab === 'expense' 
                            ? 'bg-purple-600 text-white' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {d.txTabExpense}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead>
                        <tr className="border-b border-[#1f1f3a] text-slate-500 font-bold">
                          <th className="pb-2">{d.txDetail}</th>
                          <th className="pb-2">{d.txCost}</th>
                          <th className="pb-2">{d.txTime}</th>
                          <th className="pb-2 text-right">{d.txStatus}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f1f3a]/30">
                        {txTab === 'deposit' ? (
                          depositLogs.map(log => (
                            <tr key={log.id} className="hover:bg-white/[0.01]">
                              <td className="py-2.5 font-semibold text-white">{log.detail}</td>
                              <td className="py-2.5 text-emerald-400 font-bold">+{formatCurrency(log.amount)}</td>
                              <td className="py-2.5 text-slate-500 font-mono">{log.time}</td>
                              <td className="py-2.5 text-right">
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded text-[9px] font-black uppercase">
                                  Thành công
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          expenseLogs.map(log => (
                            <tr key={log.id} className="hover:bg-white/[0.01]">
                              <td className="py-2.5 font-semibold text-white">{log.detail}</td>
                              <td className="py-2.5 text-red-400 font-bold">{log.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(log.amount))}</td>
                              <td className="py-2.5 text-slate-500 font-mono">{log.time}</td>
                              <td className="py-2.5 text-right">
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded text-[9px] font-black uppercase">
                                  Thành công
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: USAGE STATISTICS */}
            {activeTab === 'stats' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Header card */}
                <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="border-b border-[#1f1f3a]/60 pb-3 flex justify-between items-center">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" /> Thống Kê & Lịch Sử Sử Dụng
                    </h3>
                    <button
                      onClick={async () => {
                        setStatsLoading(true);
                        try {
                          const [statsRes, historyRes] = await Promise.all([
                            api.get('/api/user/stats'),
                            api.get('/api/user/history')
                          ]);
                          setStats(statsRes.data?.stats || statsRes.data || null);
                          setReadingHistory(historyRes.data?.history || historyRes.data || []);
                        } catch (e) {}
                        setStatsLoading(false);
                      }}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all"
                      title="Làm mới"
                    >
                      <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {statsLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                      <span className="text-xs text-slate-400 font-medium animate-pulse">Đang tải dữ liệu hệ thống...</span>
                    </div>
                  ) : !user ? (
                    <div className="p-8 text-center bg-[#0b0b14]/50 rounded-xl border border-[#1f1f3a] space-y-4">
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Yêu cầu đăng nhập</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                          Bạn đang trải nghiệm dưới quyền Khách. Hãy đăng nhập tài khoản để đồng bộ và xem chi tiết thời gian đọc (Web vs Chrome Extension, Online vs Offline) cũng như số liệu dịch thuật.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Grid cards statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* CARD 1: Tổng thời gian đọc */}
                        <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">TỔNG THỜI GIAN ĐỌC</span>
                            <span className="text-lg font-extrabold text-white block mt-0.5">
                              {stats ? formatDuration(stats.total_reading_time) : '0 phút'}
                            </span>

                            <span className="text-[9px] text-slate-400 block mt-0.5">
                              Tính cả Web và Chrome Extension
                            </span>
                          </div>
                        </div>

                        {/* CARD 2: Môi trường đọc */}
                        <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center shrink-0">
                            <Laptop className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">MÔI TRƯỜNG ĐỌC</span>
                            <div className="flex justify-between items-center text-xs mt-1 text-slate-300">
                              <span className="flex items-center gap-1 font-medium"><Tv className="w-3.5 h-3.5 text-blue-400" /> Web:</span>
                              <span className="font-extrabold text-white">{stats ? formatDuration(stats.web_duration) : '0m'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs mt-0.5 text-slate-300">
                              <span className="flex items-center gap-1 font-medium"><Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Ext:</span>
                              <span className="font-extrabold text-white">{stats ? formatDuration(stats.ext_duration) : '0m'}</span>

                            </div>
                          </div>
                        </div>

                        {/* CARD 3: Chế độ kết nối */}
                        <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                            <Globe className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">CHẾ ĐỘ KẾT NỐI</span>
                            <div className="flex justify-between items-center text-xs mt-1 text-slate-300">
                              <span className="flex items-center gap-1 font-medium text-emerald-400">● Online:</span>
                              <span className="font-extrabold text-white">{stats ? formatDuration(stats.online_duration) : '0m'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs mt-0.5 text-slate-300">
                              <span className="flex items-center gap-1 font-medium text-amber-500">○ Offline:</span>
                              <span className="font-extrabold text-white">{stats ? formatDuration(stats.offline_duration) : '0m'}</span>

                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Translation Stats Card */}
                      <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-5 mt-4">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> Hiệu suất dịch thuật & Đọc sách
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-[#121225] border border-[#1f1f3a]/60 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tổng Số Lượt Dịch</span>
                            <span className="text-xl font-extrabold text-purple-400 block mt-1">{stats?.translation_calls || 0} lượt</span>
                          </div>
                          <div className="p-3 bg-[#121225] border border-[#1f1f3a]/60 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ký tự đã dịch (AI/Convert)</span>
                            <span className="text-xl font-extrabold text-indigo-400 block mt-1">
                              {stats?.translation_chars ? stats.translation_chars.toLocaleString() : 0} ký tự
                            </span>

                          </div>
                        </div>
                      </div>

                      {/* Click History / Reading History List */}
                      <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-5 mt-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-purple-400" /> Lịch sử click xem & Đọc chương gần đây
                        </h4>
                        
                        {readingHistory.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-6">Chưa có lịch sử click xem truyện.</p>
                        ) : (
                          <div className="space-y-4">
                            {readingHistory.map((group, gIdx) => (
                              <div key={gIdx} className="space-y-2">
                                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block border-b border-[#1f1f3a]/40 pb-1">
                                  {group.group_name}
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {group.books.map((book, bIdx) => (
                                    <div 
                                      key={bIdx} 
                                      className="p-3 bg-[#121225] border border-[#1f1f3a]/60 rounded-lg flex gap-3 items-center hover:border-purple-500/50 transition-all group relative overflow-hidden"
                                    >
                                      <div className="w-9 h-12 bg-slate-800 rounded overflow-hidden shrink-0">
                                        {book.cover ? (
                                          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">Ảnh</div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <strong className="text-xs font-bold text-white block truncate group-hover:text-purple-400 transition-colors">
                                          {book.title}
                                        </strong>
                                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                          Tác giả: {book.author || 'Ẩn danh'}
                                        </span>
                                        <span className="text-[9px] text-slate-500 block truncate mt-0.5 font-mono">
                                          Chương cuối: {book.last_chapter || 'Chưa đọc'}
                                        </span>
                                      </div>
                                      {book.url && (
                                        <a 
                                          href={book.url} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="absolute top-2 right-2 p-1 text-slate-500 hover:text-white bg-[#0b0b14] border border-[#1f1f3a] rounded-md text-[10px] hover:bg-purple-600 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                          Mở lại
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Recent Actions Logs */}
                      <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-5 mt-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-purple-400" /> Nhật ký sử dụng hệ thống
                        </h4>
                        {(!stats?.recent_actions || stats.recent_actions.length === 0) ? (
                          <p className="text-xs text-slate-500 text-center py-6">Chưa ghi nhận hoạt động nào gần đây.</p>
                        ) : (
                          <div className="max-h-[220px] overflow-y-auto divide-y divide-[#1f1f3a]/30 pr-1.5 custom-scrollbar">
                            {stats.recent_actions.map((act, idx) => (
                              <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-white">{act.details || act.action_type}</span>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    <span className="capitalize">{act.app_type === 'extension' ? 'Chrome Extension' : 'Web App'}</span>
                                    <span>•</span>
                                    <span>{act.connection_status === 'online' ? 'Online' : 'Offline'}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {new Date(act.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                                  {new Date(act.timestamp).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </>
                  )}
                </div>

              </div>
            )}

            {activeTab === 'desktop' && (
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
                      {/* Electron Settings Form */}
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

                      {/* Hardware / System Specifications */}
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

                      {/* Desktop specific actions */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const api = getElectronAPI();
                            if (api && api.openExternal) {
                              api.openExternal('https://tienhiep.lyvuha.com/');
                            } else {
                              window.open('https://tienhiep.lyvuha.com/', '_blank');
                            }
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
                          onClick={handleManualCheckUpdates}
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
                          Phiên bản Desktop chạy bằng Electron mang lại khả năng xử lý âm thanh **Matcha-TTS** mượt mà, lưu trữ ngoại tuyến toàn bộ kho truyện và tự động cuộn màn hình tối ưu hơn.
                        </p>
                      </div>
                      <div className="bg-[#0b0b14]/60 p-4 border border-[#1f1f3a] rounded-xl text-left text-[11px] text-slate-400 space-y-2">
                        <p className="font-bold text-purple-400">Các tính năng nổi bật của ứng dụng Desktop (.exe):</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Tải truyện nhanh hàng loạt, lưu vào ổ cứng để đọc offline.</li>
                          <li>Tương thích trực tiếp với hệ điều hành, phím tắt (Media Keys) để dừng/chạy giọng đọc.</li>
                          <li>Tích hợp engine chuyển giọng nói chất lượng cao mà không bị giới hạn mạng.</li>
                        </ul>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <button 
                          type="button"
                          onClick={() => {
                            window.location.href = '/downloads';
                          }}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-8 py-3 rounded-xl text-xs transition-colors shadow-lg shadow-purple-600/25 cursor-pointer"
                        >
                          Tải Về Bản Desktop Cho Windows (.exe)
                        </button>
                        <button
                          type="button"
                          onClick={handleManualCheckUpdates}
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
            )}

            {/* TAB 7: TTS AI MODEL MANAGER */}
            {activeTab === 'tts_models' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="border-b border-[#1f1f3a]/60 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        <Tv className="w-5 h-5 text-purple-400" /> Trung Tâm Quản Lý Trí Tuệ Nhân Tạo (AI)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Kiểm tra kết nối máy chủ và quản lý kho giọng đọc Local / Đám mây.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isElectron && (
                        <button 
                          onClick={async () => {
                            const api = getElectronAPI();
                            if (api && api.openLogFolder) {
                              await api.openLogFolder();
                            }
                          }}
                          className="flex items-center gap-1 bg-[#1e293b] hover:bg-[#334155] text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700 transition-all cursor-pointer"
                        >
                          📂 MỞ THƯ MỤC LOGS
                        </button>
                      )}
                      <button 
                        onClick={handlePingServer}
                        disabled={pingStats.isPinging}
                        className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:bg-slate-800 disabled:text-slate-500 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-500/30 transition-all cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${pingStats.isPinging ? 'animate-spin' : ''}`} /> PING SERVER
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Server Status */}
                     <div className="p-4 bg-[#0b0b14]/50 border border-[#1f1f3a] rounded-xl space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Trạng Thế Kết Nối</h4>
                         <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg">
                            <span className="text-xs font-bold text-white flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${pingStats.trans.includes('Lỗi') ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div> Máy Chủ Dịch (Vietphrase)</span>
                            <span className={`text-[10px] font-mono flex items-center gap-2 ${pingStats.trans.includes('Lỗi') ? 'text-red-400' : 'text-emerald-400'}`}>
                              {pingStats.trans} {pingStats.transRtf && pingStats.transRtf !== 'Lỗi' && (
                                <span className="bg-purple-500/20 text-purple-300 px-1.5 rounded-full border border-purple-500/30" title="Tốc độ dịch nhanh gấp x lần tốc độ đọc của con người">RTF: {pingStats.transRtf}</span>
                              )}
                            </span>
                         </div>
                        <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg">
                           <span className="text-xs font-bold text-white flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${pingStats.tts.includes('Lỗi') ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div> Máy Chủ TTS (Đọc Truyện)</span>
                           <span className={`text-[10px] font-mono flex items-center gap-2 ${pingStats.tts.includes('Lỗi') ? 'text-red-400' : 'text-emerald-400'}`}>
                             {pingStats.tts} <span className="bg-emerald-500/20 text-emerald-300 px-1.5 rounded-full border border-emerald-500/30" title="Real Time Factor (Tốc độ đọc nhanh gấp x lần thực tế)">RTF: {pingStats.rtf}</span>
                           </span>
                        </div>
                        <div className={`flex flex-col p-2.5 bg-white/5 rounded-lg border ${pingStats.localTts.includes('Connected') ? 'border-emerald-500/30' : 'border-red-500/20'}`}>
                           <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-slate-300 flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${pingStats.localTts.includes('Connected') ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div> Local TTS (Offline App)</span>
                              <span className={`text-[10px] font-mono ${pingStats.localTts.includes('Connected') ? 'text-emerald-400' : 'text-red-400'}`}>{pingStats.localTts}</span>
                           </div>
                           {pingStats.localTts.includes('Disconnected') && (
                              <p className="text-[9px] text-amber-400 mt-2 border-t border-white/5 pt-1.5 leading-normal">
                                ⚠️ Cảnh báo: Vui lòng click chọn <strong>"Tải Động Cơ CPU"</strong> hoặc <strong>"Tải Động Cơ GPU"</strong> ở mục bên dưới để cài lõi chạy AI Offline.
                              </p>
                           )}
                        </div>
                     </div>

                     {/* Installed Models + Device Selector */}
                     <div className="p-4 bg-[#0b0b14]/50 border border-[#1f1f3a] rounded-xl space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Laptop className="w-3.5 h-3.5" /> Kho Giọng Đọc (Đã Tải)</h4>
                        
                        <div className="space-y-2">
                          {localModels.length === 0 ? (
                             <p className="text-[10px] text-slate-500 text-center py-4 bg-white/5 rounded-lg border border-white/5 border-dashed">Chưa có Giọng đọc AI nào được tải về máy.</p>
                          ) : (
                             localModels.map((model) => (
                               <div key={model.name} className="flex flex-col p-2.5 bg-white/5 rounded-lg border border-emerald-500/20 gap-2">
                                  <div className="flex items-center justify-between">
                                     <span className="text-xs font-bold text-emerald-300">File: {model.name}</span>
                                     <span className="text-[9px] text-slate-500 bg-black/40 px-1.5 py-0.5 rounded">{model.sizeMB} MB</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                     <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Đã Kích Hoạt Offline</span>
                                     <button onClick={() => handleDeleteModel(model.name)} className="text-[10px] text-red-400 hover:text-red-300 hover:bg-red-400/10 px-2 py-1 rounded transition-colors flex items-center gap-1"><Trash2 className="w-3 h-3"/> Xóa</button>
                                  </div>
                               </div>
                             ))
                          )}
                        </div>

                        {/* Device Selector */}
                        <div className="mt-3 pt-3 border-t border-white/5">
                           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">⚡ Chế Độ Xử Lý</h4>
                           <div className="flex gap-1.5">
                             {[
                               { key: 'auto', label: '🔄 Tự Động', desc: 'CPU INT8 (RTF 15x)' },
                               { key: 'gpu',  label: '🎮 GPU (CUDA)', desc: 'Model lớn FP16' },
                               { key: 'cpu',  label: '💻 CPU', desc: 'INT8 nhanh nhất' },
                             ].map(opt => (
                               <button
                                 key={opt.key}
                                 onClick={() => handleDeviceChange(opt.key)}
                                 className={`flex-1 p-2 rounded-lg text-center transition-all border ${
                                   ttsDevice === opt.key
                                     ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                     : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
                                 }`}
                               >
                                 <div className="text-[10px] font-bold">{opt.label}</div>
                                 <div className="text-[8px] mt-0.5 opacity-70">{opt.desc}</div>
                               </button>
                             ))}
                           </div>
                        </div>


                        {isElectron && (
                           <div className="mt-3 p-3 bg-white/5 rounded-xl border border-indigo-500/20 space-y-2.5">
                              <div className="flex items-center justify-between">
                                 <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">📋 Nhật Ký Hoạt Động (Logs)</h4>
                                 <button 
                                   onClick={() => {
                                     if (window.electron && window.electron.openLogFolder) {
                                       window.electron.openLogFolder();
                                     }
                                   }}
                                   className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold"
                                 >
                                   Mở thư mục log
                                 </button>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-normal">
                                Theo dõi trạng thái khởi động, lỗi tải file, hoặc lỗi offline engine tại đây để chẩn đoán và khắc phục sự cố.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const event = new CustomEvent('toggle-log-console');
                                    window.dispatchEvent(event);
                                  }}
                                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 shadow shadow-purple-500/20"
                                >
                                  Mở Console Xem Log Realtime
                                </button>
                              </div>
                           </div>
                        )}

                        <p className="text-[9px] text-slate-500 text-center mt-2 italic">Bộ lưu trữ Model: {downloadFolder}</p>
                     </div>
                  </div>

                  {/* Cloud Model Library */}
                  <div className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-xl space-y-4">
                     <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Thư Viện Giọng Đọc Mới (Cloud)</h4>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">Mới cập nhật: 2 Model ONNX</span>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Model 1: Matcha-TTS INT8 */}
                        <div className="flex flex-col p-3 bg-[#05050a]/80 rounded-xl border border-white/5 hover:border-indigo-500/50 transition-colors gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-xs font-bold text-white">1. Matcha-TTS Acoustic (INT8)</h5>
                              <p className="text-[10px] text-slate-400 mt-0.5">Mô hình tạo phổ âm từ văn bản, đã lượng hóa INT8 siêu nhẹ.</p>
                            </div>
                            <span className="text-[9px] text-slate-500 bg-black px-1.5 py-0.5 rounded">19.2 MB</span>
                          </div>
                          <button 
                            onClick={() => handleDownloadModel('matcha_tts_int8', 'https://huggingface.co/datasets/Cong123779/Local-TTS-Engine/resolve/main/matcha_tts_int8.onnx')}
                            disabled={downloadProgress['matcha_tts_int8.onnx'] !== undefined}
                            className="mt-auto w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            {downloadProgress['matcha_tts_int8.onnx'] !== undefined 
                              ? <><RefreshCw className="w-3 h-3 animate-spin"/> Đang tải... {downloadProgress['matcha_tts_int8.onnx']}%</>
                              : <><ChevronRight className="w-3 h-3 rotate-90"/> Tải Matcha-TTS ONNX</>
                            }
                          </button>
                        </div>

                        {/* Model 2: Vocos Decoupled INT8 */}
                        <div className="flex flex-col p-3 bg-[#05050a]/80 rounded-xl border border-white/5 hover:border-indigo-500/50 transition-colors gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-xs font-bold text-white">2. Vocos Vocoder (INT8)</h5>
                              <p className="text-[10px] text-slate-400 mt-0.5">Mô hình giải mã phổ âm thành sóng âm thanh chất lượng cao.</p>
                            </div>
                            <span className="text-[9px] text-slate-500 bg-black px-1.5 py-0.5 rounded">13.0 MB</span>
                          </div>
                          <button 
                            onClick={() => handleDownloadModel('vocos_decoupled_int8', 'https://huggingface.co/datasets/Cong123779/Local-TTS-Engine/resolve/main/vocos_decoupled_int8.onnx')}
                            disabled={downloadProgress['vocos_decoupled_int8.onnx'] !== undefined}
                            className="mt-auto w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            {downloadProgress['vocos_decoupled_int8.onnx'] !== undefined 
                              ? <><RefreshCw className="w-3 h-3 animate-spin"/> Đang tải... {downloadProgress['vocos_decoupled_int8.onnx']}%</>
                              : <><ChevronRight className="w-3 h-3 rotate-90"/> Tải Vocos Vocoder ONNX</>
                            }
                          </button>
                        </div>
                     </div>
                  </div>

                  {/* Delete Confirmation Modal - IN APP */}
                  {deleteModal.open && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
                      <div className="bg-[#12121f] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-red-500/10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">Xóa Giọng Đọc AI</h3>
                            <p className="text-[10px] text-slate-400">Hành động này không thể hoàn tác</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 mb-5">
                          Bạn có chắc chắn muốn xóa vĩnh viễn tệp <span className="text-red-400 font-bold">{deleteModal.filename}</span> khỏi ổ đĩa không?
                        </p>
                        <div className="flex gap-3">
                          <button onClick={() => setDeleteModal({ open: false, filename: '' })} className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-colors">
                            Hủy Bỏ
                          </button>
                          <button onClick={confirmDeleteModel} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1">
                            <Trash2 className="w-3 h-3" /> Xóa Vĩnh Viễn
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
            {activeTab === 'ai_translation' && (
              <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
                <div className="border-b border-[#1f1f3a]/60 pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-purple-400" /> Cấu hình Dịch thuật & Cloud AI
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Cấu hình máy chủ dịch thuật và khóa VIP cho các chế độ dịch máy nâng cao.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Engine Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Bộ Dịch (Engine)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => updateTranslationSetting('engineType', 'browser')}
                        className={`p-4 rounded-xl border flex flex-col gap-1 items-start transition-all text-left ${translationSettings.engineType === 'browser' ? 'bg-purple-600/20 border-purple-500 text-purple-200' : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:bg-white/[0.02]'}`}
                      >
                        <span className="font-bold text-sm text-white">Offline Local</span>
                        <span className="text-[10px] opacity-70">Dịch ngay trên trình duyệt/máy của bạn. Tốc độ cao, không cần mạng.</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => updateTranslationSetting('engineType', 'server')}
                        className={`p-4 rounded-xl border flex flex-col gap-1 items-start transition-all text-left ${translationSettings.engineType === 'server' ? 'bg-purple-600/20 border-purple-500 text-purple-200' : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:bg-white/[0.02]'}`}
                      >
                        <span className="font-bold text-sm text-white">Cloud AI Server</span>
                        <span className="text-[10px] opacity-70">Dịch siêu mượt qua Server đám mây mạnh mẽ. Yêu cầu VIP key.</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode Selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Chế Độ Dịch (Mode)
                    </label>
                    <select 
                      value={translationSettings.mode}
                      onChange={(e) => updateTranslationSetting('mode', e.target.value)}
                      className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-purple-500 transition-colors"
                    >
                      {translationSettings.engineType === 'server' ? (
                        <>
                          <option value="vietphrase">Vietphrase (Dịch Thô Server)</option>
                          <option value="hanviet">Hán Việt (Âm Hán Việt Server)</option>
                          <option value="fast">👑 Dịch Nhanh (Server AI)</option>
                          <option value="advanced">👑 Nâng Cao (Server AI)</option>
                          <option value="advanced_hanviet">👑 Nâng Cao Hán-Việt (Server AI)</option>
                        </>
                      ) : (
                        <>
                          <option value="vietphrase">Vietphrase (Dịch Thô Local)</option>
                          <option value="hanviet">Hán Việt (Âm Hán Việt Local)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Server API URL */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Server API URL
                    </label>
                    <input 
                      type="text" 
                      value={translationSettings.serverUrl}
                      onChange={(e) => updateTranslationSetting('serverUrl', e.target.value)}
                      placeholder="https://cong123779-tienhiep-api.hf.space"
                      className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  {/* VIP Key */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      VIP Key / API Key Dịch Thuật
                    </label>
                    <input 
                      type="password" 
                      value={translationSettings.vipKey}
                      onChange={(e) => updateTranslationSetting('vipKey', e.target.value)}
                      placeholder="Nhập mã VIP / API Key của bạn để sử dụng Cloud AI"
                      className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 transition-colors"
                    />
                    <p className="text-[10px] text-slate-500">
                      Mã này được gửi kèm trong header yêu cầu dịch thuật tới server. Bạn có thể mua VIP key hoặc tạo ở trang API Developer.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-purple-300 leading-relaxed">
                  <strong>💡 Gợi ý:</strong> Cài đặt dịch thuật này sẽ áp dụng trực tiếp cho tất cả các chương truyện khi bạn đọc bằng Trình duyệt nguồn thô hoặc nhập truyện offline.
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MANUAL UPDATE CHECK MODAL */}
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
                  {lang === 'vi' 
                    ? `Phiên bản hiện tại: v${manualUpdateInfo.currentVersion} → Mới nhất: v${manualUpdateInfo.latestVersion}`
                    : `Current: v${manualUpdateInfo.currentVersion} → Latest: v${manualUpdateInfo.latestVersion}`}
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

            {manualDownloading && (
              <div className="space-y-2 bg-[#05050a] border border-[#1f1f3a] p-3.5 rounded-2xl">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400 animate-pulse">{manualDlStatus}</span>
                  <span className="text-purple-400 font-mono">{manualDownloadProgress}%</span>
                </div>
                <div className="w-full bg-[#0b0b14] h-2 rounded-full overflow-hidden border border-[#1f1f3a]">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${manualDownloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                disabled={manualDownloading}
                onClick={() => setShowUpdateModal(false)} 
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lang === 'vi' ? 'Để sau' : 'Later'}
              </button>
              
              <button 
                disabled={manualDownloading}
                onClick={handleStartManualUpdate} 
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>
                  {lang === 'vi' 
                    ? (isElectron ? 'Cập nhật ngay' : 'Tải về ngay') 
                    : (isElectron ? 'Update Now' : 'Download Now')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
