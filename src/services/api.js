import axios from 'axios';

// =====================================================
// MULTI-SERVER CONFIG
// Thêm bất kỳ server nào vào đây theo thứ tự ưu tiên
// Frontend sẽ tự động chọn server nhanh nhất còn sống
// =====================================================
const SERVERS = import.meta.env.PROD ? [
  'https://cong123779-tienhiep-api.hf.space',
  'https://api-tienhiep.lyvuha.com'
] : [''];  // Dev: rỗng → vite proxy

const HEALTH_TIMEOUT = 1200;   // 1.2s timeout để ping health check nhanh
const CACHE_KEY = 'best_tienhiep_server';
const CACHE_DURATION = 10 * 60 * 1000; // Cache server tốt trong 10 phút

// Ping một server, trả về true nếu còn sống
async function pingServer(url, timeoutMs = HEALTH_TIMEOUT) {
  if (!url) return true; // dev mode
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
async function getBestServer() {
  // Web Mode (cả Prod trên Vercel và Dev trên local browser):
  // Luôn trả về rỗng để sử dụng cùng nguồn (same-origin proxy: Vercel rewrites trong prod, Vite proxy trong dev)
  if (!window.electron && !window.Capacitor) {
    return '';
  }

  // 1. Nếu chạy trong Electron: ưu tiên hàng đầu là Local Engine (cổng 8001) chạy offline
  if (window.electron) {
    const localServer = 'http://127.0.0.1:5051';
    const isLocalAlive = await pingServer(localServer, 300); // chỉ timeout 300ms cho local
    if (isLocalAlive) {
      return localServer;
    }
  }

  // 2. Kiểm tra cache trong localStorage
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached && cached.includes(':8001')) {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(`${CACHE_KEY}_expiry`);
    } else {
      const expiry = localStorage.getItem(`${CACHE_KEY}_expiry`);
      if (cached && expiry && Date.now() < parseInt(expiry, 10)) {
        return cached;
      }
    }
  } catch (e) { }

  // 3. Nếu chưa có cache hoặc cache hết hạn: ping song song các server để chọn server tốt nhất
  const servers = [
    'https://cong123779-tienhiep-api.hf.space',
    'https://api-tienhiep.lyvuha.com'
  ];

  // Ping song song, trả về server nào phản hồi OK đầu tiên
  const pingPromises = servers.map(async (srv) => {
    const alive = await pingServer(srv, 1200);
    if (alive) return srv;
    throw new Error('Dead');
  });

  try {
    const bestSrv = await Promise.any(pingPromises);

    // Lưu vào cache
    try {
      localStorage.setItem(CACHE_KEY, bestSrv);
      localStorage.setItem(`${CACHE_KEY}_expiry`, (Date.now() + CACHE_DURATION).toString());
    } catch (e) { }

    return bestSrv;
  } catch (err) {
    // Nếu tất cả server đều không phản hồi trong 1.2s, fallback về HuggingFace làm mặc định
    return 'https://cong123779-tienhiep-api.hf.space';
  }
}

// Tạo axios instance động theo server đang dùng
const api = axios.create({
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor: gắn baseURL động, JWT token và chống Cloudflare Cache
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('accessToken');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Thay vào đó, chèn 1 biến cố định v=2 để XÓA SỔ bộ nhớ đệm cũ của Cloudflare (vì lúc nãy Cloudflare đã lỡ lưu bản lỗi).
  if (config.method === 'get') {
    config.params = {
      ...config.params,
      v: 2
    };
  }


  // Gắn baseURL của server tốt nhất
  if (!config.baseURL) {
    const server = await getBestServer();
    config.baseURL = server;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor response: nếu server lỗi → xóa cache → retry lần sau sẽ dùng server khác
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.code === 'ERR_NETWORK' || error.response?.status >= 500) {
      try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(`${CACHE_KEY}_expiry`);
      } catch (e) { }
    }

    // Nếu lỗi 401 (Unauthorized) và chưa thử refresh
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url && !originalRequest.url.includes('/api/auth/refresh')) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const server = await getBestServer();
          // Gọi trực tiếp axios tránh vòng lặp interceptor
          const refreshRes = await axios.post(`${server}/api/auth/refresh`, {
            refresh_token: refreshToken
          });
          if (refreshRes.data && refreshRes.data.access_token) {
            const newToken = refreshRes.data.access_token;
            localStorage.setItem('accessToken', newToken);
            document.cookie = `accessToken=${newToken}; path=/; max-age=604800; SameSite=Lax`;

            // Cập nhật token trong headers và thử lại request gốc
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
        } catch (refreshErr) {
          console.error("Axios interceptor token refresh failed:", refreshErr);
          // Xóa tokens nếu refresh token không còn hợp lệ
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax";
          if (window.electron && typeof window.electron.storeDelete === 'function') {
            window.electron.storeDelete('accessToken');
            window.electron.storeDelete('refreshToken');
            window.electron.storeDelete('user');
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export { getBestServer, SERVERS };
export default api;
