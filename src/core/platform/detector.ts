/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  detector.ts — RUNTIME PLATFORM DETECTOR (CROSS-PLATFORM MONOREPO)
 * ═════════════════════════════════════════════════════════════════════════════
 *  Tự động nhận diện nền tảng thực thi:
 *  - 'electron': Máy tính để bàn (Windows / Linux / macOS)
 *  - 'android': Ứng dụng điện thoại Android (Capacitor / Android WebView)
 *  - 'ios': Ứng dụng iPhone / iPad (Capacitor / iOS WKWebView)
 *  - 'web': Trình duyệt web thông thường
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { PlatformType, OSType } from '../../types';

let mockPlatform: PlatformType | null = null;
let mockOS: OSType | null = null;

/**
 * Giả lập môi trường thực thi dùng cho Unit Test và E2E Test
 * @param platform 'web' | 'android' | 'ios' | 'electron' hoặc null để reset
 * @param os Tùy chọn giả lập hệ điều hành cụ thể
 */
export const setMockPlatform = (platform: PlatformType | null, os: OSType | null = null): void => {
  mockPlatform = platform;
  mockOS = os;
};

/**
 * Nhận diện chính xác hệ điều hành thực thi (iOS, Android, Windows, Linux, macOS, Web)
 */
export const detectOS = (): OSType => {
  if (mockOS) return mockOS;
  if (mockPlatform === 'ios') return 'ios';
  if (mockPlatform === 'android') return 'android';

  // 1. Kiểm tra Electron process.platform
  if (typeof window !== 'undefined') {
    const procPlatform = (window as any).process?.platform;
    if (procPlatform === 'win32') return 'windows';
    if (procPlatform === 'linux') return 'linux';
    if (procPlatform === 'darwin') return 'macos';
  }

  // 2. Kiểm tra Capacitor Native
  const cap = typeof window !== 'undefined' ? (window as any).Capacitor : undefined;
  if (cap && typeof cap.getPlatform === 'function') {
    const p = cap.getPlatform();
    if (p === 'ios') return 'ios';
    if (p === 'android') return 'android';
  }

  // 3. Kiểm tra User Agent / Navigator Platform
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    const np = (navigator.platform || '').toLowerCase();
    if (/iphone|ipad|ipod/.test(ua) || np.includes('iphone') || np.includes('ipad')) return 'ios';
    if (ua.includes('android') || np.includes('android')) return 'android';
    if (ua.includes('windows') || np.includes('win')) return 'windows';
    if (ua.includes('macintosh') || np.includes('mac')) return 'macos';
    if (ua.includes('linux') || np.includes('linux')) return 'linux';
  }

  return mockPlatform === 'electron' ? 'linux' : 'web';
};

/**
 * Trả về nền tảng đang thực thi hoặc nền tảng được mock
 */
export const detectPlatform = (): PlatformType => {
  if (mockPlatform) {
    return mockPlatform;
  }

  // 1. Kiểm tra Electron Desktop
  if (
    typeof window !== 'undefined' &&
    ((window as any).electron ||
      (window as any).process?.versions?.electron ||
      navigator?.userAgent?.toLowerCase()?.includes('electron'))
  ) {
    return 'electron';
  }

  // 2. Kiểm tra Capacitor Native (Android / iOS)
  const cap = typeof window !== 'undefined' ? (window as any).Capacitor : undefined;
  if (cap && typeof cap.getPlatform === 'function') {
    const platform = cap.getPlatform();
    if (platform === 'android') return 'android';
    if (platform === 'ios') return 'ios';
  }

  // 3. Fallback kiểm tra User-Agent
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) return 'android';
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  }

  // 4. Mặc định là Web Browser
  return 'web';
};

export const getPlatform = (): PlatformType => detectPlatform();
export const getOS = (): OSType => detectOS();
export const isElectron = (): boolean => detectPlatform() === 'electron';
export const isAndroid = (): boolean => detectPlatform() === 'android';
export const isIOS = (): boolean => detectPlatform() === 'ios';
export const isWindows = (): boolean => detectOS() === 'windows';
export const isLinux = (): boolean => detectOS() === 'linux';
export const isMacOS = (): boolean => detectOS() === 'macos';
export const isMobile = (): boolean => isAndroid() || isIOS();
export const isWeb = (): boolean => detectPlatform() === 'web';
export const isNativeApp = (): boolean => isElectron() || isAndroid() || isIOS();

/**
 * Cung cấp chi tiết ma trận năng lực (Capability Matrix) theo từng nền tảng
 */
export interface PlatformCapabilities {
  platform: PlatformType;
  supportsOfflineEpub: boolean;
  supportsBackgroundAudio: boolean;
  supportsNativeShareIntent: boolean;
  supportsDirectFileSystem: boolean;
  requiresNotchSafeArea: boolean;
  hasVirtualKeyboard: boolean;
  allowsGoogleAdSense: boolean;
  preferredAudioEngine: 'cpp_native_daemon' | 'capacitor_media' | 'web_audio_api';
}

export const getPlatformCapabilities = (): PlatformCapabilities => {
  const p = detectPlatform();
  return {
    platform: p,
    supportsOfflineEpub: p === 'android' || p === 'ios' || p === 'electron',
    supportsBackgroundAudio: p === 'android' || p === 'ios',
    supportsNativeShareIntent: p === 'android' || p === 'ios',
    supportsDirectFileSystem: p === 'electron' || p === 'android' || p === 'ios',
    requiresNotchSafeArea: p === 'android' || p === 'ios',
    hasVirtualKeyboard: p === 'android' || p === 'ios',
    allowsGoogleAdSense: p === 'web',
    preferredAudioEngine:
      p === 'electron' || p === 'android'
        ? 'cpp_native_daemon'
        : p === 'ios'
        ? 'capacitor_media'
        : 'web_audio_api',
  };
};

// Cung cấp các biến tương thích ngược & trạng thái tĩnh
export const CURRENT_PLATFORM: PlatformType = detectPlatform();
export const CURRENT_OS: OSType = detectOS();
export const IS_ELECTRON: boolean = CURRENT_PLATFORM === 'electron';
export const IS_ANDROID: boolean = CURRENT_PLATFORM === 'android';
export const IS_IOS: boolean = CURRENT_PLATFORM === 'ios';
export const IS_WINDOWS: boolean = CURRENT_OS === 'windows';
export const IS_LINUX: boolean = CURRENT_OS === 'linux';
export const IS_MACOS: boolean = CURRENT_OS === 'macos';
export const IS_MOBILE: boolean = IS_ANDROID || IS_IOS;
export const IS_WEB: boolean = CURRENT_PLATFORM === 'web';
export const IS_PRODUCTION: boolean = (import.meta as any).env?.PROD ?? false;
