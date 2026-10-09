import { localTranslator } from '../../utils/localTranslator';
import { TranslationResult } from '../../types';

export const translateService = {
  translateText: async (text: string, mode: string = 'cmlm'): Promise<TranslationResult> => {
    const translation = await localTranslator.translate(text, mode);
    return {
      translation,
      text,
      engine: 'native_core_cmlm',
      status: 'success'
    };
  },

  translateVietphrase: async (text: string): Promise<TranslationResult> => {
    const translation = await localTranslator.translate(text, 'vietphrase');
    return {
      translation,
      text,
      engine: 'native_core_vietphrase',
      status: 'success'
    };
  },

  getModels: async () => {
    return { models: ['cmlm_native_onnx', 'vietphrase_trie_native', 'hanviet_chardict'] };
  },
};

export default translateService;
