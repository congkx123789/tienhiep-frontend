import axios, { AxiosInstance } from 'axios';
import { SERVER_CONFIG, getCandidateServers } from '../constants/endpoints';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

// =====================================================
// MULTI-SERVER CONFIG (Điều phối từ apiEndpoints.ts)
// =====================================================
const HEALTH_TIMEOUT = SERVER_CONFIG.HEALTH_TIMEOUT_MS;
const CACHE_KEY = SERVER_CONFIG.CACHE_KEY;
const CACHE_DURATION = SERVER_CONFIG.CACHE_DURATION_MS;

// Ping một server, trả về true nếu còn sống
async function pingServer(url: string, timeoutMs: number = HEALTH_TIMEOUT): Promise<boolean> {
  if (!url) return true;
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  if (isNative) {
    try {
      const res = await CapacitorHttp.get({
        url: `${url}/health`,
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      });
      if (res.status === 200) return true;
    } catch (_) { }
    try {
      const res2 = await CapacitorHttp.get({
        url: `${url}/api/health`,
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      });
      return res2.status === 200;
    } catch (_) {
      return false;
    }
  }

  try {
    const res = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) return true;
  } catch { }
  try {
    const res2 = await fetch(`${url}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res2.ok;
  } catch {
    return false;
  }
}

function isSafeLocalUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('127.0.0.1') ||
    lower.includes('localhost')
  );
}

// Tìm server tốt nhất với cơ chế ưu tiên 100% Local On-Device / In-RAM Engine
export async function getBestServer(): Promise<string> {
  const isCapacitorNative =
    typeof window !== 'undefined' &&
    Boolean((window as any).Capacitor?.isNativePlatform?.());

  // 1. Dọn dẹp triệt để bất kỳ URL remote/không hợp lệ nào trong localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached && !isSafeLocalUrl(cached)) {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(`${CACHE_KEY}_expiry`);
      }
      const customStr = localStorage.getItem('translationSettings');
      if (customStr) {
        const parsed = JSON.parse(customStr);
        if (parsed.serverUrl && !isSafeLocalUrl(parsed.serverUrl)) {
          parsed.serverUrl = SERVER_CONFIG.LOCAL_HOST;
          localStorage.setItem('translationSettings', JSON.stringify(parsed));
        }
      }
      const manualBase = localStorage.getItem('manual_api_base_url');
      if (manualBase && !isSafeLocalUrl(manualBase)) {
        localStorage.removeItem('manual_api_base_url');
      }
    } catch (_) { }
  }

  // 2. Kiểm tra custom server nội bộ an toàn (chỉ cho phép localhost / 127.0.0.1)
  try {
    const custom = JSON.parse(localStorage.getItem('translationSettings') || '{}')?.serverUrl;
    if (custom && isSafeLocalUrl(custom) && (await pingServer(custom, 1000))) {
      return custom;
    }
  } catch { }

  // 3. Luôn ưu tiên Local Engine 127.0.0.1:5051 nếu không phải di động native
  if (!isCapacitorNative && (await pingServer(SERVER_CONFIG.LOCAL_HOST, 800))) {
    return SERVER_CONFIG.LOCAL_HOST;
  }

  // Với Android Emulator: thử thêm emulator host (10.0.2.2:5051)
  if (isCapacitorNative) {
    if (await pingServer(SERVER_CONFIG.EMULATOR_HOST, 1000)) {
      return SERVER_CONFIG.EMULATOR_HOST;
    }
  }

  // Web Mode nếu có cùng origin phục vụ API:
  if (!isCapacitorNative && typeof window !== 'undefined') {
    if (window.location.port !== '3000' && window.location.port !== '3532' && window.location.port !== '5173') {
      return window.location.origin;
    }
  }

  // 4. Kiểm tra cache trong localStorage
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached && isSafeLocalUrl(cached)) {
      const expiry = localStorage.getItem(`${CACHE_KEY}_expiry`);
      if (expiry && Date.now() < parseInt(expiry, 10)) {
        return cached;
      }
    }
  } catch (e) { }

  // 5. Ping danh sách ứng cử viên nội bộ
  const candidates = getCandidateServers(isCapacitorNative);
  for (const srv of candidates) {
    if (isSafeLocalUrl(srv) && (await pingServer(srv, 1000))) {
      try {
        localStorage.setItem(CACHE_KEY, srv);
        localStorage.setItem(`${CACHE_KEY}_expiry`, String(Date.now() + CACHE_DURATION));
      } catch (e) { }
      return srv;
    }
  }

  // 6. Luôn mặc định về LOCAL_HOST (127.0.0.1:5051) On-Device
  return SERVER_CONFIG.LOCAL_HOST;
}

export const SERVERS = {
  get LOCAL() {
    return SERVER_CONFIG.LOCAL_HOST;
  },
  get REMOTE() {
    return SERVER_CONFIG.REMOTE_HOST;
  },
  get HF() {
    return SERVER_CONFIG.HF_HOST;
  },
  get TUNNEL() {
    return SERVER_CONFIG.REMOTE_HOST;
  },
};

// Tạo Axios instance
export const api: AxiosInstance = axios.create({
  timeout: 15000,
});

// Request Interceptor: đính kèm Bearer token, X-VIP-Key và động hóa baseURL
api.interceptors.request.use(async (config) => {
  if (!config.baseURL) {
    config.baseURL = await getBestServer();
  }

  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const vipKey = localStorage.getItem('vip_key') || 'LYVUHA_ADMIN_2026';
    if (config.headers && !config.headers['X-VIP-Key']) {
      config.headers['X-VIP-Key'] = vipKey;
    }
  } catch (e) { }

  return config;
});

// Response Interceptor: xử lý tự động failover
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.code === 'ERR_NETWORK' && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(`${CACHE_KEY}_expiry`);
        const fallback = await getBestServer();
        originalRequest.baseURL = fallback;
        return api(originalRequest);
      } catch (e) {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const getFastestServer = getBestServer;

export function resetServerCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(`${CACHE_KEY}_expiry`);
  } catch (_) { }
}

export async function requestApi<T = any>(endpoint: string, options: any = {}): Promise<T> {
  const res = await api.request({ url: endpoint, ...options });
  return res.data;
}

export { SERVER_CONFIG, getCandidateServers, isSafeLocalUrl };
export default api;
