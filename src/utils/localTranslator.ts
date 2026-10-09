/**
 * localTranslator.ts — BỘ ĐIỀU PHỐI DỊCH THUẬT NATIVE CORE & SERVER (CROSS-PLATFORM)
 * 100% In-Process Native C++ Plugin / Wasm In-RAM khi offline.
 * Tự động fallback sang Server API (/api/translate) theo cấu hình người dùng.
 * Hỗ trợ đầy đủ Mode 0 (Hán Việt), Mode 7 (Vietphrase), Mode 1-4 và Raw.
 */
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { initNativeCoreWasm, isNativeCoreWasmReady, wasmTranslate } from '../core/wasm';
import BasePointManager from '../core/platform/basePoint';
import { modeTranslator } from './modeTranslator';

export function parseModeNumber(mode: string | number): number {
  const l = String(mode).trim().toLowerCase();
  if (l === '0' || l === 'hanviet') return 0;
  if (l === '7' || l === 'vietphrase' || l === 'fast') return 7;
  const n = parseInt(l, 10);
  return isNaN(n) ? 4 : n;
}

function getCandidateHosts(): string[] {
  let settingsUrl = '', manualUrl = '';
  if (typeof localStorage !== 'undefined') {
    try {
      const s = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      if (s?.serverUrl) settingsUrl = s.serverUrl.trim().replace(/\/+$/, '');
    } catch { }
    try {
      const m = localStorage.getItem('manual_api_base_url');
      if (m) manualUrl = m.trim().replace(/\/+$/, '');
    } catch { }
  }
  return Array.from(new Set([
    settingsUrl, manualUrl,
    BasePointManager.getBaseUrl(),
    'http://127.0.0.1:5051',
    'http://localhost:5051',
  ].filter(Boolean)));
}

async function fetchServerTranslation(text: string, mode: string): Promise<{ result: string; host: string }> {
  const hosts = getCandidateHosts(), isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/api/translate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode }), signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json(), trans = json.translation || (Array.isArray(json.translations) ? json.translations[0] : '');
        if (trans && trans !== text) return { result: trans, host };
      }
    } catch (_) { }
    if (isNative) {
      try {
        const capRes = await CapacitorHttp.post({
          url: `${host}/api/translate`, headers: { 'Content-Type': 'application/json' },
          data: { text, mode }, connectTimeout: 3500, readTimeout: 5000,
        });
        if (capRes.status === 200 && capRes.data) {
          const resData = typeof capRes.data === 'string' ? JSON.parse(capRes.data) : capRes.data;
          const trans = resData.translation || (Array.isArray(resData.translations) ? resData.translations[0] : '');
          if (trans && trans !== text) return { result: trans, host };
        }
      } catch (_) { }
    }
  }
  return { result: '', host: '' };
}

async function fetchServerTranslationBatch(texts: string[], mode: string): Promise<string[]> {
  const hosts = getCandidateHosts(), isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/api/translate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, mode }), signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.translations) && json.translations.length === texts.length) return json.translations;
      }
    } catch (_) { }
    if (isNative) {
      try {
        const capRes = await CapacitorHttp.post({
          url: `${host}/api/translate`, headers: { 'Content-Type': 'application/json' },
          data: { texts, mode }, connectTimeout: 5000, readTimeout: 8000,
        });
        if (capRes.status === 200 && capRes.data) {
          const resData = typeof capRes.data === 'string' ? JSON.parse(capRes.data) : capRes.data;
          if (Array.isArray(resData.translations) && resData.translations.length === texts.length) return resData.translations;
        }
      } catch (_) { }
    }
  }
  return [];
}

class LocalTranslatorEngine {
  private cache = new Map<string, string>();
  public isLoaded = false;
  public isLoading = false;
  public lastUsedEngine = 'Native Core';

  constructor() {
    if (typeof window !== 'undefined') {
      this.initNative().catch(() => {});
      this.loadDictionaries().catch(() => {});
    }
  }

  async initNative(): Promise<void> {
    const cap = (typeof window !== 'undefined' && (window as any).Capacitor);
    if (cap?.Plugins?.NativeCore?.initCore) {
      try {
        await cap.Plugins.NativeCore.initCore();
      } catch (_) {}
    }
  }

  async loadDictionaries(): Promise<void> {
    if (this.isLoaded && isNativeCoreWasmReady()) return;
    this.isLoading = true;
    try {
      await initNativeCoreWasm();
      this.isLoaded = true;
    } finally {
      this.isLoading = false;
    }
  }

  translateOffline(text: string): string {
    return wasmTranslate(text) || text;
  }

  async translate(text: string, mode: string = '4'): Promise<string> {
    if (!text || !text.trim()) return '';
    if (mode === 'raw' || mode === 'none' || mode === 'original') return text;

    const trimmed = text.trim();
    const modeNum = parseModeNumber(mode);
    const cacheKey = `${modeNum}:${trimmed}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    // 1. Thử Native C++ Plugin trên iOS/Android
    const cap = (typeof window !== 'undefined' && (window as any).Capacitor);
    if (cap?.Plugins?.NativeCore?.translate) {
      try {
        const res = await cap.Plugins.NativeCore.translate({ text: trimmed, mode: modeNum });
        if (res?.result && res.result !== trimmed) {
          this.lastUsedEngine = 'Native C++ Plugin (XCFramework)';
          this.saveCache(cacheKey, res.result);
          return res.result;
        }
      } catch (_) {}
    }

    // 2. Thử Multi-Mode Engine In-RAM (Hỗ trợ Mode 1-4, Anime, Tiên Hiệp, Âu Mỹ)
    if (!isNativeCoreWasmReady()) await this.loadDictionaries();
    await modeTranslator.ensureModeLoaded(modeNum);
    const modeResult = modeTranslator.translateWithMode(trimmed, modeNum, (t) => wasmTranslate(t));
    if (modeResult && modeResult !== trimmed) {
      this.lastUsedEngine = 'Native In-RAM Multi-Mode Engine';
      this.saveCache(cacheKey, modeResult);
      return modeResult;
    }

    // 3. Fallback sang WASM In-RAM
    const translated = wasmTranslate(trimmed);
    if (translated && translated !== trimmed) {
      this.lastUsedEngine = 'Native Wasm In-RAM';
      this.saveCache(cacheKey, translated);
      return translated;
    }

    // 4. Fallback sang Server API theo URL người dùng
    const serverRes = await fetchServerTranslation(trimmed, String(modeNum));
    if (serverRes.result) {
      this.lastUsedEngine = `Máy Chủ (${serverRes.host})`;
      this.saveCache(cacheKey, serverRes.result);
      return serverRes.result;
    }

    return trimmed;
  }

  async translateBatch(sentences: string[], mode: string = '4'): Promise<string[]> {
    if (!sentences || sentences.length === 0) return [];
    if (mode === 'raw' || mode === 'none' || mode === 'original') return sentences;

    const cap = (typeof window !== 'undefined' && (window as any).Capacitor);
    const hasNative = Boolean(cap?.Plugins?.NativeCore?.translate);
    const modeNum = parseModeNumber(mode);

    const results: string[] = new Array(sentences.length);
    const unhitIndices: number[] = [];
    const unhitTexts: string[] = [];

    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      if (!s || !s.trim()) { results[i] = s; continue; }
      const trimmed = s.trim();
      const cacheKey = `${modeNum}:${trimmed}`;
      if (this.cache.has(cacheKey)) {
        results[i] = this.cache.get(cacheKey)!;
      } else {
        unhitIndices.push(i);
        unhitTexts.push(trimmed);
      }
    }

    if (unhitTexts.length === 0) return results;
    await modeTranslator.ensureModeLoaded(modeNum);

    // Dịch các câu chưa cache qua Native Core hoặc Wasm
    for (let k = 0; k < unhitIndices.length; k++) {
      const idx = unhitIndices[k], text = unhitTexts[k];
      let res = '';
      if (hasNative) {
        try {
          const nr = await cap.Plugins.NativeCore.translate({ text, mode: modeNum });
          if (nr?.result && nr.result !== text) res = nr.result;
        } catch (_) {}
      }
      if (!res && isNativeCoreWasmReady()) {
        const mr = modeTranslator.translateWithMode(text, modeNum, (t) => wasmTranslate(t));
        if (mr && mr !== text) res = mr;
        else {
          const wr = wasmTranslate(text);
          if (wr && wr !== text) res = wr;
        }
      }
      if (res) {
        this.saveCache(`${modeNum}:${text}`, res);
        results[idx] = res;
      }
    }

    // Với câu chưa xử lý, gửi batch lên server API
    const remainingIndices = unhitIndices.filter(idx => !results[idx]);
    if (remainingIndices.length > 0) {
      const remTexts = remainingIndices.map(idx => sentences[idx].trim());
      const sTrans = await fetchServerTranslationBatch(remTexts, String(modeNum));
      if (sTrans.length === remTexts.length) {
        for (let m = 0; m < remainingIndices.length; m++) {
          const idx = remainingIndices[m];
          this.saveCache(`${modeNum}:${sentences[idx].trim()}`, sTrans[m]);
          results[idx] = sTrans[m];
        }
      }
    }

    for (let n = 0; n < sentences.length; n++) {
      if (!results[n]) results[n] = sentences[n];
    }
    return results;
  }

  translateSentence(text: string, mode: string = '4'): string {
    if (!text || !text.trim() || mode === 'raw') return text || '';
    const trimmed = text.trim();
    const modeNum = parseModeNumber(mode);
    const cacheKey = `${modeNum}:${trimmed}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;
    if (isNativeCoreWasmReady()) {
      const w = wasmTranslate(trimmed);
      if (w && w !== trimmed) {
        this.saveCache(cacheKey, w);
        return w;
      }
    }
    return trimmed;
  }

  private saveCache(key: string, val: string): void {
    if (this.cache.size > 2000) {
      const first = this.cache.keys().next().value;
      if (first) this.cache.delete(first);
    }
    this.cache.set(key, val);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const localTranslator = new LocalTranslatorEngine();
export default localTranslator;
