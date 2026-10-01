import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { BasePointManager } from '../platform/basePoint';
import { CURRENT_PLATFORM } from '../platform/detector';

export const apiClient: AxiosInstance = axios.create({
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Platform': CURRENT_PLATFORM,
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (!config.baseURL) {
      config.baseURL = `${BasePointManager.getBaseUrl()}${BasePointManager.getApiPrefix()}`;
    }
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

// Hàm gọi request chuẩn dùng trực tiếp cấu trúc từ ENDPOINTS
export async function requestApi<T>(
  endpointDef: { path: string; method: string } | { path: string },
  options: AxiosRequestConfig = {}
): Promise<T> {
  const method = (endpointDef as any).method || 'GET';
  const response = await apiClient.request<T>({
    url: endpointDef.path,
    method: method,
    ...options,
  });
  return response as unknown as T;
}

export default apiClient;
