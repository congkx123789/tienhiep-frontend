/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  serverConfig.ts — CẤU HÌNH MÁY CHỦ & ĐIỀU PHỐI MÔI TRƯỜNG CHẠY
 * ═════════════════════════════════════════════════════════════════════════════
 */

export const SERVER_CONFIG = {
  DEFAULT_PORT: 5051,
  LOCAL_HOST: 'http://127.0.0.1:5051',
  EMULATOR_HOST: 'http://10.0.2.2:5051',
  REMOTE_HOST: 'https://cong123779-tienhiep-api.hf.space',
  HEALTH_TIMEOUT_MS: 1500,
  CACHE_KEY: 'best_tienhiep_server',
  CACHE_DURATION_MS: 10 * 60 * 1000, // 10 phút lưu cache server khả dụng
} as const;

/**
 * Lấy danh sách máy chủ ứng cử viên ưu tiên theo môi trường thực thi
 * @param isCapacitor - Ứng dụng chạy trên thiết bị di động Capacitor / Android
 * @returns Danh sách URL server ứng cử viên
 */
export const getCandidateServers = (isCapacitor: boolean = false): string[] => {
  return isCapacitor
    ? [SERVER_CONFIG.LOCAL_HOST, SERVER_CONFIG.EMULATOR_HOST, SERVER_CONFIG.REMOTE_HOST]
    : [SERVER_CONFIG.LOCAL_HOST, SERVER_CONFIG.REMOTE_HOST];
};
