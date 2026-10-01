import { SERVER_CONFIG } from '../../../constants/endpoints';

let currentWorkingTtsHost = (typeof window !== 'undefined' && (window as any).Capacitor && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform())
  ? SERVER_CONFIG.EMULATOR_HOST
  : SERVER_CONFIG.LOCAL_HOST;

export async function detectBestTtsHost(): Promise<string> {
  if (typeof window !== 'undefined' && (window as any).electron) {
    currentWorkingTtsHost = SERVER_CONFIG.LOCAL_HOST;
    return currentWorkingTtsHost;
  }
  if (typeof window !== 'undefined' && (window as any).Capacitor && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform()) {
    try {
      const r = await fetch(`${SERVER_CONFIG.EMULATOR_HOST}/health`, { signal: AbortSignal.timeout(600) });
      if (r.ok) {
        currentWorkingTtsHost = SERVER_CONFIG.EMULATOR_HOST;
        return currentWorkingTtsHost;
      }
    } catch {}

    try {
      const r = await fetch(`${SERVER_CONFIG.LOCAL_HOST}/health`, { signal: AbortSignal.timeout(400) });
      if (r.ok) {
        currentWorkingTtsHost = SERVER_CONFIG.LOCAL_HOST;
        return currentWorkingTtsHost;
      }
    } catch {}

    return currentWorkingTtsHost;
  }
  return SERVER_CONFIG.LOCAL_HOST;
}

detectBestTtsHost().catch(() => {});

export function getLocalTtsHost(): string {
  if (typeof window !== 'undefined' && (window as any).electron) return SERVER_CONFIG.LOCAL_HOST;
  if (typeof window !== 'undefined' && (window as any).Capacitor && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform()) {
    return currentWorkingTtsHost;
  }
  return SERVER_CONFIG.LOCAL_HOST;
}

export const isSpeechSynthesisAvailable = (): boolean => {
  return typeof window !== 'undefined' &&
         typeof window.SpeechSynthesisUtterance !== 'undefined' &&
         !!window.speechSynthesis;
};

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
            }).catch(() => {});
            return true;
          }
        } catch {}
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

export async function fetchAudioBlob(
  textToSend: string,
  ttsEngine: string,
  matchaVoice: string,
  matchaApiKey: string,
  rate: number,
  api: any
): Promise<string> {
  if (ttsEngine === 'local') {
    const host = getLocalTtsHost();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    try {
      const response = await fetch(`${host}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend, speed: 1.0 }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return URL.createObjectURL(await response.blob());
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }
  if (ttsEngine === 'matcha') {
    const res = await api.post('/v1/audio/speech', { input: textToSend, speed: 1.0, voice: matchaVoice }, {
      responseType: 'blob',
      headers: { 'Authorization': `Bearer ${matchaApiKey}` }
    });
    return URL.createObjectURL(res.data);
  }
  const res = await api.get('/api/tts/speak', {
    params: { text: textToSend.substring(0, 350), speed: rate || 1.0, voice: 'vi-VN-HoaiMyNeural' },
    responseType: 'blob',
    timeout: 3500
  });
  return URL.createObjectURL(res.data);
}

