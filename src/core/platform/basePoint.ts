/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  basePoint.ts — ĐIỂM CHỐT ĐIỀU PHỐI HOST & BASE POINT (CROSS-PLATFORM)
 * ═════════════════════════════════════════════════════════════════════════════
 *  ĐIỀU PHỐI TẬP TRUNG BASE URL CHO TOÀN BỘ NỀN TẢNG:
 *  - Web: window.location.origin hoặc localhost:5051
 *  - Electron: http://127.0.0.1:5051 (Offline Local Engine)
 *  - Android: http://10.0.2.2:5051 (Emulator) hoặc adb reverse http://127.0.0.1:5051
 *  - Cloud Server: https://cong123779-tienhiep-api.hf.space
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { CURRENT_PLATFORM, IS_PRODUCTION } from './detector';
import { BasePointConfig, PlatformType } from '../../types';

export const BASE_POINT_CONFIG: BasePointConfig = {
  DEFAULT_PORT: 5051,
  LOCAL_HOST: 'http://127.0.0.1:5051',
  EMULATOR_HOST: 'http://10.0.2.2:5051',
  REMOTE_HOST: 'https://cong123779-tienhiep-api.hf.space',
  HEALTH_TIMEOUT_MS: 1500,
  CACHE_KEY: 'best_tienhiep_server',
  CACHE_DURATION_MS: 10 * 60 * 1000,
};

const DEV_ENDPOINTS: Record<PlatformType, string> = {
  web: typeof window !== 'undefined' && window.location.origin.includes('localhost')
    ? 'http://127.0.0.1:5051'
    : (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5051'),
  electron: BASE_POINT_CONFIG.LOCAL_HOST,
  android: BASE_POINT_CONFIG.LOCAL_HOST, // Ưu tiên ADB reverse, fallback 10.0.2.2
  ios: BASE_POINT_CONFIG.LOCAL_HOST,
};

export class BasePointManager {
  private static overrideHost: string | null = null;

  public static setManualHost(host: string | null): void {
    this.overrideHost = host;
    if (typeof localStorage !== 'undefined') {
      if (host) {
        localStorage.setItem('manual_api_base_url', host);
      } else {
        localStorage.removeItem('manual_api_base_url');
      }
    }
  }

  public static getBaseUrl(): string {
    // 1. Kiểm tra override thủ công
    if (this.overrideHost) {
      return this.overrideHost;
    }
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('manual_api_base_url');
      if (stored) return stored;
    }

    // 2. Chế độ Production Cloud
    if (IS_PRODUCTION && CURRENT_PLATFORM === 'web' && typeof window !== 'undefined' && !window.location.origin.includes('localhost')) {
      return window.location.origin;
    }

    // 3. Chế độ Dev / Native theo từng Platform
    return DEV_ENDPOINTS[CURRENT_PLATFORM] || BASE_POINT_CONFIG.LOCAL_HOST;
  }

  public static getApiPrefix(): string {
    return '';
  }
}

export default BasePointManager;
