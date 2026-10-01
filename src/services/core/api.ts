import axios, { AxiosInstance } from 'axios';
import { SERVER_CONFIG, getCandidateServers } from '../../constants/endpoints';

// =====================================================
// MULTI-SERVER CONFIG (Điều phối từ apiEndpoints.ts)
// =====================================================
const HEALTH_TIMEOUT = SERVER_CONFIG.HEALTH_TIMEOUT_MS;
const CACHE_KEY = SERVER_CONFIG.CACHE_KEY;
const CACHE_DURATION = SERVER_CONFIG.CACHE_DURATION_MS;

// Ping một server, trả về true nếu còn sống
async function pingServer(url: string, timeoutMs: number = HEALTH_TIMEOUT): Promise<boolean> {
  if (!url) return true;
  try {
    const res = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Tìm server tốt nhất với cơ chế cache và fallback thông minh
export async function getBestServer(): Promise<string> {
  const isCapacitorNative =
    typeof window !== 'undefined' &&
    Boolean((window as any).Capacitor?.isNativePlatform?.());

  // Web Mode (cả Prod trên Vercel và Dev trên local browser):
  if (!(window as any).electron && !isCapacitorNative) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  // 1. Nếu chạy trong Electron: ưu tiên hàng đầu là Local Engine chạy offline
  if ((window as any).electron) {
    const localServer = SERVER_CONFIG.LOCAL_HOST;
    const isLocalAlive = await pingServer(localServer, 1500);
    if (isLocalAlive) {
      return localServer;
    }
  } else if (isCapacitorNative) {
    // Với Android Capacitor: thử localhost (hỗ trợ adb reverse) và emulator host
    if (await pingServer(SERVER_CONFIG.LOCAL_HOST, 1200)) {
      return SERVER_CONFIG.LOCAL_HOST;
    }
    if (await pingServer(SERVER_CONFIG.EMULATOR_HOST, 2000)) {
      return SERVER_CONFIG.EMULATOR_HOST;
    }
  }

  // 2. Kiểm tra cache trong localStorage
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached && (cached.includes(':8001') || cached.includes('lyvuha.com'))) {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(`${CACHE_KEY}_expiry`);
    } else {
      const expiry = localStorage.getItem(`${CACHE_KEY}_expiry`);
      if (cached && expiry && Date.now() < parseInt(expiry, 10)) {
        return cached;
      }
    }
  } catch (e) {}

  // 3. Nếu chưa có cache hoặc cache hết hạn: ping server ứng cử viên
  const candidates = getCandidateServers(isCapacitorNative);

  for (const srv of candidates) {
    if (await pingServer(srv, 1500)) {
      try {
        localStorage.setItem(CACHE_KEY, srv);
        localStorage.setItem(`${CACHE_KEY}_expiry`, String(Date.now() + CACHE_DURATION));
      } catch (e) {}
      return srv;
    }
  }

  // Fallback an toàn
  return isCapacitorNative ? SERVER_CONFIG.EMULATOR_HOST : SERVER_CONFIG.LOCAL_HOST;
}

export const SERVERS = {
  get LOCAL() {
    return SERVER_CONFIG.LOCAL_HOST;
  },
  get REMOTE() {
    return SERVER_CONFIG.REMOTE_HOST;
  },
};

// Tạo Axios instance
export const api: AxiosInstance = axios.create({
  timeout: 15000,
});

// Request Interceptor: đính kèm Bearer token và động hóa baseURL
api.interceptors.request.use(async (config) => {
  if (!config.baseURL) {
    config.baseURL = await getBestServer();
  }

  try {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}

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

export { SERVER_CONFIG, getCandidateServers };
export default api;
