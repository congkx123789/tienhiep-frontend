import api from '../../core/api';
import { API_ENDPOINTS } from '../../constants/endpoints';

export const socialService = {
  getFriends: async () => {
    const res = await api.get(API_ENDPOINTS.SOCIAL.FRIENDS);
    return res.data;
  },

  searchUsers: async (q: string) => {
    const res = await api.get(API_ENDPOINTS.SOCIAL.SEARCH_USERS, { params: { q } });
    return res.data;
  },

  getMessages: async (friendId?: number | string) => {
    const res = await api.get(API_ENDPOINTS.SOCIAL.MESSAGES(friendId || ''));
    return res.data;
  },

  sendMessage: async (data: { recipient_id: number | string; message: string }) => {
    const res = await api.post(API_ENDPOINTS.SOCIAL.SEND_MESSAGE, data);
    return res.data;
  },

  getUnreadCounts: async () => {
    const res = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNTS);
    return res.data;
  },
};

export default socialService;
