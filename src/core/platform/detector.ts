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

import { PlatformType } from '../../types';

export const detectPlatform = (): PlatformType => {
  // 1. Kiểm tra Electron Desktop
  if (
    typeof window !== 'undefined' &&
    ((window as any).electron ||
      (window as any).process?.versions?.electron ||
      navigator.userAgent.toLowerCase().includes('electron'))
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

export const CURRENT_PLATFORM: PlatformType = detectPlatform();
export const IS_ELECTRON: boolean = CURRENT_PLATFORM === 'electron';
export const IS_ANDROID: boolean = CURRENT_PLATFORM === 'android';
export const IS_IOS: boolean = CURRENT_PLATFORM === 'ios';
export const IS_MOBILE: boolean = IS_ANDROID || IS_IOS;
export const IS_WEB: boolean = CURRENT_PLATFORM === 'web';
export const IS_PRODUCTION: boolean = (import.meta as any).env?.PROD ?? false;
