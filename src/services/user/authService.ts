import api from '../../core/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { AuthResponse } from '../../types';

export const authService = {
  login: async (credentials: { username?: string; email?: string; password?: string }): Promise<AuthResponse> => {
    const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return res.data;
  },

  register: async (userData: { username: string; email?: string; password?: string }): Promise<AuthResponse> => {
    const res = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    return res.data;
  },

  getMe: async (): Promise<AuthResponse> => {
    const res = await api.get(API_ENDPOINTS.AUTH.ME);
    return res.data;
  },

  logout: async () => {
    try {
      const res = await api.post(API_ENDPOINTS.AUTH.LOGOUT);
      return res.data;
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
    }
  },

  updateProfile: async (data: Record<string, any>) => {
    const res = await api.post(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data);
    return res.data;
  },

  changePassword: async (data: { old_password?: string; new_password?: string }) => {
    const res = await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
    return res.data;
  },

  getSessions: async () => {
    const res = await api.get(API_ENDPOINTS.AUTH.SESSIONS);
    return res.data;
  },

  revokeSession: async (sessionId: string) => {
    const res = await api.post(API_ENDPOINTS.AUTH.SESSIONS_REVOKE, { session_id: sessionId });
    return res.data;
  },
};

export default authService;
