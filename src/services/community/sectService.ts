import api from '../../core/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { Sect, SectChatMessage } from '../../types';

export const sectService = {
  getSects: async (params: { q?: string; page?: number; limit?: number } = {}) => {
    const res = await api.get(API_ENDPOINTS.SECTS.LIST, { params });
    return res.data;
  },

  getMySect: async () => {
    const res = await api.get(API_ENDPOINTS.SECTS.MY_SECT);
    return res.data;
  },

  getSectDetail: async (sectId: number | string) => {
    const res = await api.get(API_ENDPOINTS.SECTS.DETAIL(sectId));
    return res.data;
  },

  createSect: async (data: { name: string; description: string }) => {
    const res = await api.post(API_ENDPOINTS.SECTS.CREATE, data);
    return res.data;
  },

  joinSect: async (sectId: number | string) => {
    const res = await api.post(API_ENDPOINTS.SECTS.JOIN, { sect_id: sectId });
    return res.data;
  },

  leaveSect: async (sectId: number | string) => {
    const res = await api.post(API_ENDPOINTS.SECTS.LEAVE, { sect_id: sectId });
    return res.data;
  },

  getJoinRequests: async (sectId?: number | string) => {
    const res = await api.get(API_ENDPOINTS.SECTS.REQUESTS_LIST, { params: { sect_id: sectId } });
    return res.data;
  },

  respondJoinRequest: async (requestId: number | string, action: 'accept' | 'reject') => {
    const res = await api.post(API_ENDPOINTS.SECTS.REQUESTS_RESPOND, { request_id: requestId, action });
    return res.data;
  },

  getLibraryBooks: async (sectId?: number | string) => {
    const res = await api.get(API_ENDPOINTS.SECTS.LIBRARY_LIST, { params: { sect_id: sectId } });
    return res.data;
  },

  getChatGroups: async (sectId?: number | string) => {
    const res = await api.get(API_ENDPOINTS.SECTS.CHAT_GROUPS, { params: { sect_id: sectId } });
    return res.data;
  },

  getChatHistory: async (sectId?: number | string, limit: number = 50) => {
    const res = await api.get(API_ENDPOINTS.SECTS.CHAT_HISTORY, { params: { sect_id: sectId, limit } });
    return res.data;
  },

  sendChatMessage: async (data: { message: string; sect_id?: number | string; channel_id?: number | string }) => {
    const res = await api.post(API_ENDPOINTS.SECTS.CHAT_SEND, data);
    return res.data;
  },
};

export default sectService;
