/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  basePoint.ts — ĐIỂM CHỐT ĐIỀU PHỐI HOST & BASE POINT (CROSS-PLATFORM)
 * ═════════════════════════════════════════════════════════════════════════════
 *  ĐIỀU PHỐI TẬP TRUNG BASE URL CHO TOÀN BỘ NỀN TẢNG (100% ON-DEVICE / IN-RAM):
 *  - Mobile (iOS/Android): http://127.0.0.1:5051 (Local In-RAM Engine)
 *  - Desktop (Windows/Linux/macOS): http://127.0.0.1:5051 (100% Offline Local Engine / native-core)
 *  - Web: window.location.origin hoặc localhost:5051
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { CURRENT_PLATFORM, detectOS, IS_PRODUCTION } from './detector';
import { BasePointConfig, PlatformType, OSType } from '../../types';
import { SERVER_CONFIG } from '../../constants/endpoints/serverConfig';

export const BASE_POINT_CONFIG: BasePointConfig = {
  DEFAULT_PORT: SERVER_CONFIG.DEFAULT_PORT,
  LOCAL_HOST: SERVER_CONFIG.LOCAL_HOST,
  EMULATOR_HOST: SERVER_CONFIG.EMULATOR_HOST,
  HF_HOST: SERVER_CONFIG.HF_HOST,
  REMOTE_HOST: SERVER_CONFIG.REMOTE_HOST,
  WIFI_HOST: SERVER_CONFIG.WIFI_HOST,
  HEALTH_TIMEOUT_MS: SERVER_CONFIG.HEALTH_TIMEOUT_MS,
  CACHE_KEY: SERVER_CONFIG.CACHE_KEY,
  CACHE_DURATION_MS: SERVER_CONFIG.CACHE_DURATION_MS,
};

/**
 * Cấu hình chuẩn phân định rõ ràng theo từng Hệ điều hành (100% On-Device Local)
 */
export const OS_ENDPOINTS: Record<OSType, string> = {
  ios: SERVER_CONFIG.LOCAL_HOST,
  android: SERVER_CONFIG.LOCAL_HOST,
  windows: SERVER_CONFIG.LOCAL_HOST,
  linux: SERVER_CONFIG.LOCAL_HOST,
  macos: SERVER_CONFIG.LOCAL_HOST,
  web: typeof window !== 'undefined'
    ? (window.location.port === '5051' ? window.location.origin : `http://${window.location.hostname || '127.0.0.1'}:5051`)
    : SERVER_CONFIG.LOCAL_HOST,
};

const DEV_ENDPOINTS: Record<PlatformType, string> = {
  web: OS_ENDPOINTS.web,
  electron: BASE_POINT_CONFIG.LOCAL_HOST,
  android: SERVER_CONFIG.LOCAL_HOST,
  ios: SERVER_CONFIG.LOCAL_HOST,
};

/**
 * Kiểm tra địa chỉ server có thuộc danh sách an toàn hợp lệ (Chỉ chấp nhận Local/In-RAM)
 */
export function isAcceptableServerUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('127.0.0.1') ||
    lower.includes('localhost')
  );
}

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
      if (stored && isAcceptableServerUrl(stored)) {
        return stored;
      } else if (stored) {
        localStorage.removeItem('manual_api_base_url');
      }
    }

    // 2. Kiểm tra server tốt nhất đã được khám phá
    if (typeof localStorage !== 'undefined') {
      const best = localStorage.getItem(BASE_POINT_CONFIG.CACHE_KEY);
      if (best && isAcceptableServerUrl(best)) {
        return best;
      } else if (best) {
        localStorage.removeItem(BASE_POINT_CONFIG.CACHE_KEY);
      }
    }

    // 3. Chế độ Production Cloud
    if (IS_PRODUCTION && CURRENT_PLATFORM === 'web' && typeof window !== 'undefined' && !window.location.origin.includes('localhost')) {
      return window.location.origin;
    }

    // 4. Phân bổ theo Hệ điều hành runtime (100% On-Device Local 127.0.0.1)
    const activeOs = detectOS();
    return OS_ENDPOINTS[activeOs] || DEV_ENDPOINTS[CURRENT_PLATFORM] || BASE_POINT_CONFIG.LOCAL_HOST;
  }

  public static getCurrentOS(): OSType {
    return detectOS();
  }

  public static getOsEndpoint(os?: OSType): string {
    return OS_ENDPOINTS[os || detectOS()] || BASE_POINT_CONFIG.LOCAL_HOST;
  }

  public static getApiPrefix(): string {
    return '';
  }
}

export default BasePointManager;

