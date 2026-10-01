import api from '../core/api';
import { API_ENDPOINTS } from '../../constants/endpoints';

export const ttsService = {
  speak: (text: string, voice: string = 'nam_mien_bac', speed: number = 1.0) => {
    return `${API_ENDPOINTS.TTS.SPEAK}?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&speed=${speed}`;
  },

  resetPrompt: async () => {
    const res = await api.post(API_ENDPOINTS.TTS.RESET_PROMPT);
    return res.data;
  },

  setDevice: async (device: 'cpu' | 'cuda') => {
    const res = await api.post(API_ENDPOINTS.TTS.SET_DEVICE, { device });
    return res.data;
  },

  reloadModel: async () => {
    const res = await api.post(API_ENDPOINTS.TTS.RELOAD_MODEL);
    return res.data;
  },
};

export default ttsService;
