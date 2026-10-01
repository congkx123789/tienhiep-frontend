import api from '../core/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { TranslationResult } from '../../types';

export const translateService = {
  translateText: async (text: string, mode: string = 'cmlm'): Promise<TranslationResult> => {
    const res = await api.post(API_ENDPOINTS.TRANSLATE.CMLM, { text, mode });
    return res.data;
  },

  translateVietphrase: async (text: string): Promise<TranslationResult> => {
    const res = await api.post(API_ENDPOINTS.TRANSLATE.ROOT, { text });
    return res.data;
  },

  getModels: async () => {
    const res = await api.get(API_ENDPOINTS.TRANSLATE.MODELS);
    return res.data;
  },
};

export default translateService;
