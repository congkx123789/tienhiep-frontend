import { SERVER_CONFIG } from '../../../constants/endpoints';
import BasePointManager from '../../../core/platform/basePoint';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

let currentWorkingTtsHost: string = BasePointManager.getBaseUrl() || SERVER_CONFIG.LOCAL_HOST;

export async function detectBestTtsHost(): Promise<string> {
  const base = BasePointManager.getBaseUrl();
  currentWorkingTtsHost = base || SERVER_CONFIG.LOCAL_HOST;
  return currentWorkingTtsHost;
}

detectBestTtsHost().catch(() => { });

export function getLocalTtsHost(): string {
  if (typeof window !== 'undefined' && (window as any).electron) return SERVER_CONFIG.LOCAL_HOST;
  return currentWorkingTtsHost || BasePointManager.getBaseUrl() || SERVER_CONFIG.LOCAL_HOST;
}

export const isSpeechSynthesisAvailable = (): boolean => {
  // Chặn hoàn toàn Apple / System SpeechSynthesis theo yêu cầu
  return false;
};

export function cancelSpeechSynthesis(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch { }
  }
}

export function speakWithSpeechSynthesis(
  _text: string,
  _rate: number = 1.0,
  _volume: number = 1.0,
  _onEnd?: () => void,
  _onError?: () => void
): boolean {
  // CHẶN HOÀN TOÀN: Không sử dụng giọng đọc Apple/Siri của iPhone
  return false;
}

export const logTrace = (msg: string) => {
  console.log(`[TTS Trace] ${msg}`);
  if (typeof window !== 'undefined' && (window as any).electron && typeof (window as any).electron.logDebug === 'function') {
    (window as any).electron.logDebug(msg);
  }
};

export async function ensureLocalEngineRunning(ttsEngine: string): Promise<boolean> {
  if (ttsEngine !== 'local') return true;
  const host = await detectBestTtsHost();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(`${host}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      logTrace(`[ensureLocalEngineRunning] Local TTS Server (${host}) đang chạy và phản hồi tốt.`);
      return true;
    }
  } catch {
    logTrace(`[ensureLocalEngineRunning] Không phản hồi ping /health từ ${host}.`);
  }

  if (typeof window !== 'undefined' && (window as any).electron && typeof (window as any).electron.startBackend === 'function') {
    try {
      logTrace("[ensureLocalEngineRunning] Gửi yêu cầu khởi chạy engine chạy ngầm...");
      await (window as any).electron.startBackend();
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 800);
          const checkRes = await fetch(`${host}/health`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (checkRes.ok) {
            logTrace("[ensureLocalEngineRunning] Engine chạy ngầm đã khởi động thành công!");
            const pref = localStorage.getItem('tts_device_pref') || 'auto';
            fetch(`${host}/set_device`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ device: pref })
            }).catch(() => { });
            return true;
          }
        } catch { }
      }
    } catch (err: any) {
      logTrace(`[ensureLocalEngineRunning] Lỗi khi gọi khởi chạy: ${err?.message}`);
    }
  }

  if (typeof window !== 'undefined' && (window as any).Capacitor && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform()) {
    return true;
  }
  return false;
}

declare global {
  interface Window {
    __tienhiep_active_audio?: HTMLAudioElement | null;
  }
}

export function stopAllGlobalAudio(): void {
  cancelSpeechSynthesis();
  if (typeof window !== 'undefined' && window.__tienhiep_active_audio) {
    try {
      const a = window.__tienhiep_active_audio;
      a.onplay = null;
      a.onplaying = null;
      a.onpause = null;
      a.onended = null;
      a.ontimeupdate = null;
      a.onerror = null;
      a.pause();
      a.src = '';
    } catch { }
    window.__tienhiep_active_audio = null;
  }
}

export function cleanupAudioElement(aud: HTMLAudioElement | null): void {
  if (!aud) return;
  try {
    aud.onplay = null;
    aud.onplaying = null;
    aud.onpause = null;
    aud.onended = null;
    aud.ontimeupdate = null;
    aud.onerror = null;
    aud.pause();
    if (aud.src && aud.src.startsWith('blob:')) URL.revokeObjectURL(aud.src);
    aud.src = '';
  } catch { }
  if (typeof window !== 'undefined' && window.__tienhiep_active_audio === aud) {
    window.__tienhiep_active_audio = null;
  }
}

export function findStartSentenceIndex(sentences: string[], book: any): number {
  if (!sentences || sentences.length === 0) return 0;
  const snippet = (book?.startSnippet || book?.startParagraphSnippet || '').trim();
  if (snippet && snippet.length >= 4) {
    const cleanSnip = snippet.replace(/^[“"'\s«『「]+|[”"'\s»』」]+$/gu, '').slice(0, 30).toLowerCase();
    const foundIdx = sentences.findIndex(s => s.toLowerCase().includes(cleanSnip));
    if (foundIdx !== -1) return foundIdx;
  }
  return Math.max(0, Math.min(book?.startSentenceIdx || 0, sentences.length - 1));
}

export async function fetchAudioBlob(
  textToSend: string,
  _ttsEngine: string,
  _matchaVoice: string,
  _matchaApiKey: string,
  rate: number,
  _api: any
): Promise<string> {
  let cleanText = (textToSend || '').trim().replace(/^[“"'\s«『「]+|[”"'\s»』」]+$/gu, '').trim();
  if (cleanText && !/[.!?…:;]$/.test(cleanText)) cleanText += '.';
  if (!cleanText) return '';

  // 1. Thử gọi Native Core TTS qua C++ Plugin (Matcha ONNX + Vocos trên iOS/Android)
  const cap = typeof window !== 'undefined' && (window as any).Capacitor;
  if (cap?.Plugins?.NativeCore?.synthesizeTTS) {
    try {
      const res = await cap.Plugins.NativeCore.synthesizeTTS({ text: cleanText, speed: rate || 1.0 });
      if (res?.audioBase64) {
        const binStr = atob(res.audioBase64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        return URL.createObjectURL(blob);
      }
    } catch (_) {}
  }

  let settingsServer = '';
  let manualServer = '';
  if (typeof localStorage !== 'undefined') {
    try {
      const s = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      if (s?.serverUrl) settingsServer = s.serverUrl.trim().replace(/\/+$/, '');
    } catch { }
    try {
      const m = localStorage.getItem('manual_api_base_url');
      if (m) manualServer = m.trim().replace(/\/+$/, '');
    } catch { }
  }

  const hosts = Array.from(new Set([
    settingsServer,
    manualServer,
    BasePointManager.getBaseUrl(),
    getLocalTtsHost(),
    'http://127.0.0.1:5051',
    'http://localhost:5051'
  ].filter(Boolean)));

  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/api/tts/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, speed: rate || 1.0 }),
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 100) return URL.createObjectURL(blob);
      }
    } catch { }

    if (isNative) {
      try {
        const capRes = await CapacitorHttp.post({
          url: `${host}/api/tts/speak`,
          headers: { 'Content-Type': 'application/json' },
          data: { text: cleanText, speed: rate || 1.0 },
          responseType: 'blob',
          connectTimeout: 4000,
          readTimeout: 8000,
        });
        if (capRes.status === 200 && capRes.data) {
          if (typeof capRes.data === 'string' && capRes.data.length > 50) {
            const byteChars = atob(capRes.data);
            const byteNums = new Uint8Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
              byteNums[i] = byteChars.charCodeAt(i);
            }
            const blob = new Blob([byteNums], { type: 'audio/wav' });
            return URL.createObjectURL(blob);
          }
        }
      } catch (_) { }
    }
  }

  return '';
}

export { splitAndMergeSentences } from '../../../utils/sentenceSplitter';

