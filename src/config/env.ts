/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  env.ts — CENTRAL ENVIRONMENT & BASE SERVER COORDINATOR (APP & WEB)
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { SERVER_CONFIG, getCandidateServers } from '../constants/endpoints';

export const isCapacitorPlatform = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    Boolean((window as any).Capacitor?.isNativePlatform?.())
  );
};

export const isElectronPlatform = (): boolean => {
  return typeof window !== 'undefined' && Boolean((window as any).electron);
};

export const getInitialBaseUrl = (): string => {
  if (isElectronPlatform()) {
    return SERVER_CONFIG.LOCAL_HOST;
  }
  if (isCapacitorPlatform()) {
    return SERVER_CONFIG.LOCAL_HOST;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    if (window.location.port && window.location.port !== '5051') {
      return SERVER_CONFIG.LOCAL_HOST;
    }
    return window.location.origin;
  }
  return SERVER_CONFIG.LOCAL_HOST;
};

export const ENV = {
  DEFAULT_PORT: SERVER_CONFIG.DEFAULT_PORT,
  LOCAL_HOST: SERVER_CONFIG.LOCAL_HOST,
  EMULATOR_HOST: SERVER_CONFIG.EMULATOR_HOST,
  REMOTE_HOST: SERVER_CONFIG.REMOTE_HOST,
  TIMEOUT_MS: 15000,
  HEALTH_TIMEOUT_MS: SERVER_CONFIG.HEALTH_TIMEOUT_MS,
  CACHE_KEY: SERVER_CONFIG.CACHE_KEY,
  CACHE_DURATION_MS: SERVER_CONFIG.CACHE_DURATION_MS,
};

export { getCandidateServers };
export default ENV;
