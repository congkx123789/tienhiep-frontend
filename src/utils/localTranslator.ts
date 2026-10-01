/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  localTranslator.ts — BỘ ĐIỀU PHỐI DỊCH THUẬT GỌI BACKEND ENGINE SIÊU TỐC
 * ═════════════════════════════════════════════════════════════════════════════
 *  ĐÃ DỌN SẠCH LOGIC NẠP TỪ ĐIỂN TĨNH NẶNG NỀ:
 *  - 100% bản dịch được ủy thác cho Go Core & C++ CMLM NAT Engine (~6ms).
 *  - Không fetch file .txt dung lượng lớn qua web.
 *  - Giữ lại cache trong RAM (LRU) để tránh gọi lặp lại cùng một câu.
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { api } from '../services';

class LocalTranslatorEngine {
  private cache: Map<string, string>;
  public isLoaded: boolean;
  public isLoading: boolean;

  constructor() {
    this.cache = new Map();
    this.isLoaded = true;
    this.isLoading = false;
  }

  // Khởi tạo tức thì, không cần fetch file từ điển lớn
  async loadDictionaries(): Promise<void> {
    this.isLoaded = true;
    this.isLoading = false;
  }

  /**
   * Dịch một đoạn văn bản hoặc câu tiếng Trung sang Tiếng Việt
   * @param text Văn bản tiếng Trung cần dịch
   * @param mode Chế độ dịch: 'cmlm' | 'vietphrase' | 'hanviet'
   */
  async translate(text: string, mode: string = 'cmlm'): Promise<string> {
    if (!text || !text.trim()) return '';

    const cacheKey = `${mode}:${text.trim()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const res = await api.post('/api/translate/cmlm', { text, mode });
      const result = res.data?.result || res.data?.translation || res.data?.text || text;
      
      // Giới hạn kích thước cache 2000 câu
      if (this.cache.size > 2000) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, result);
      return result;
    } catch (err: any) {
      console.warn('[Translator] Lỗi gọi Backend Engine, trả về văn bản gốc:', err.message);
      return text;
    }
  }

  /**
   * Dịch hàng loạt câu (Batch Translation)
   */
  async translateBatch(sentences: string[], mode: string = 'cmlm'): Promise<string[]> {
    if (!sentences || sentences.length === 0) return [];
    return Promise.all(sentences.map((s) => this.translate(s, mode)));
  }

  translateSentence(text: string, mode: string = 'cmlm'): string {
    if (!text || !text.trim()) return '';
    const cacheKey = `${mode}:${text.trim()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    this.translate(text, mode).catch(() => {});
    return text;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const localTranslator = new LocalTranslatorEngine();
export default localTranslator;
