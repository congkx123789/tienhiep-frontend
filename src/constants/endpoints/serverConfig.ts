/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  serverConfig.ts — CẤU HÌNH MÁY CHỦ & ĐIỀU PHỐI MÔI TRƯỜNG CHẠY
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { OSType } from '../../types';

export const SERVER_CONFIG = {
  DEFAULT_PORT: 5051,
  LOCAL_HOST: 'http://127.0.0.1:5051',
  EMULATOR_HOST: 'http://10.0.2.2:5051',
  HF_HOST: 'http://127.0.0.1:5051',
  REMOTE_HOST: 'http://127.0.0.1:5051',
  WIFI_HOST: 'http://127.0.0.1:5051',
  HEALTH_TIMEOUT_MS: 1500,
  CACHE_KEY: 'best_tienhiep_server',
  CACHE_DURATION_MS: 10 * 60 * 1000,
} as const;

/**
 * Cấu hình chuẩn phân định theo từng hệ điều hành (100% On-Device / Local In-RAM)
 */
export const OS_PROFILES: Record<OSType, { endpoint: string; defaultPort: number; description: string; isLocalOnDevice: boolean }> = {
  ios: {
    endpoint: SERVER_CONFIG.LOCAL_HOST,
    defaultPort: 5051,
    description: 'iOS Native App (100% Standalone On-Device / 127.0.0.1:5051)',
    isLocalOnDevice: true,
  },
  android: {
    endpoint: SERVER_CONFIG.LOCAL_HOST,
    defaultPort: 5051,
    description: 'Android Native App (100% Standalone On-Device / 127.0.0.1:5051)',
    isLocalOnDevice: true,
  },
  windows: {
    endpoint: SERVER_CONFIG.LOCAL_HOST,
    defaultPort: 5051,
    description: 'Windows Desktop Local C++/Go Daemon (native-core)',
    isLocalOnDevice: true,
  },
  linux: {
    endpoint: SERVER_CONFIG.LOCAL_HOST,
    defaultPort: 5051,
    description: 'Linux Desktop Native UNIX Socket / HTTP Daemon (native-core)',
    isLocalOnDevice: true,
  },
  macos: {
    endpoint: SERVER_CONFIG.LOCAL_HOST,
    defaultPort: 5051,
    description: 'macOS Desktop Local Engine (native-core)',
    isLocalOnDevice: true,
  },
  web: {
    endpoint: SERVER_CONFIG.LOCAL_HOST,
    defaultPort: 5051,
    description: 'Web Browser Local Origin / HTTP Daemon',
    isLocalOnDevice: true,
  },
};

/**
 * Lấy danh sách máy chủ ứng cử viên: 100% Độc lập On-Device (Zero Remote / Zero LAN)
 */
export const getCandidateServers = (_isCapacitor: boolean = false): string[] => {
  return [
    SERVER_CONFIG.LOCAL_HOST,
  ];
};
