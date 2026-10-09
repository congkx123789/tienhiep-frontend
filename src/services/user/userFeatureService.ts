import api from '../../core/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ReaderPreferences } from '../../types';

export const userFeatureService = {
  getPreferences: async (): Promise<ReaderPreferences> => {
    const res = await api.get(API_ENDPOINTS.USER.PREFERENCES);
    return res.data;
  },

  updatePreferences: async (preferences: Partial<ReaderPreferences>) => {
    const res = await api.post(API_ENDPOINTS.USER.PREFERENCES, preferences);
    return res.data;
  },

  getBookshelf: async (params?: { q?: string }) => {
    const res = await api.get(API_ENDPOINTS.BOOKSHELF.LIST, { params });
    return res.data;
  },

  addToBookshelf: async (book: any) => {
    const res = await api.post(API_ENDPOINTS.BOOKSHELF.ADD, book);
    return res.data;
  },

  removeFromBookshelf: async (param: number | string | { book_id?: number | string; url?: string }) => {
    const payload = typeof param === 'object'
      ? param
      : (typeof param === 'string' && (param.startsWith('http://') || param.startsWith('https://')))
        ? { url: param }
        : { book_id: param };
    const res = await api.post(API_ENDPOINTS.BOOKSHELF.REMOVE, payload);
    return res.data;
  },

  getHistory: async (params?: { q?: string }) => {
    const res = await api.get(API_ENDPOINTS.HISTORY.LIST, { params });
    return res.data;
  },

  addToHistory: async (item: any) => {
    const res = await api.post(API_ENDPOINTS.HISTORY.ADD, item);
    return res.data;
  },

  removeFromHistory: async (payload: { book_id?: number | string; url?: string }) => {
    const res = await api.post(API_ENDPOINTS.HISTORY.REMOVE, payload);
    return res.data;
  },

  clearHistory: async () => {
    const res = await api.post(API_ENDPOINTS.HISTORY.CLEAR);
    return res.data;
  },

  getVocabulary: async () => {
    const res = await api.get(API_ENDPOINTS.VOCABULARY.LIST);
    return res.data;
  },

  addVocabulary: async (vocab: { hanzi: string; vietphrase: string; pinyin?: string; explanation?: string }) => {
    const res = await api.post(API_ENDPOINTS.VOCABULARY.ADD, vocab);
    return res.data;
  },

  deleteVocabulary: async (vocabId: number | string) => {
    const res = await api.post(API_ENDPOINTS.VOCABULARY.DELETE, { id: vocabId });
    return res.data;
  },

  getStats: async () => {
    const res = await api.get(API_ENDPOINTS.USER.STATS);
    return res.data;
  },
};

export default userFeatureService;
