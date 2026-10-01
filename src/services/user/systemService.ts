import api from '../core/api';
import { API_ENDPOINTS } from '../../constants/endpoints';

export const systemService = {
  chatAi: async (message: string) => {
    const res = await api.post(API_ENDPOINTS.SYSTEM.AI_CHAT, { message });
    return res.data;
  },

  getReleases: async () => {
    const res = await api.get(API_ENDPOINTS.SYSTEM.RELEASES_LATEST);
    return res.data;
  },

  sendFeedback: async (feedback: { content: string; email?: string }) => {
    const res = await api.post(API_ENDPOINTS.SYSTEM.FEEDBACK, feedback);
    return res.data;
  },

  logError: async (errorData: any) => {
    try {
      const res = await api.post(API_ENDPOINTS.SYSTEM.LOGS_ERROR, errorData);
      return res.data;
    } catch {
      return null;
    }
  },

  getMetrics: async () => {
    const res = await api.get(API_ENDPOINTS.MONITORING.METRICS);
    return res.data;
  },
};

export default systemService;
