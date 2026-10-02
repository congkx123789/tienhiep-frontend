import { SERVER_CONFIG } from '../../../constants/endpoints';

let currentWorkingTtsHost: string = (typeof window !== 'undefined' && (window as any).Capacitor && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform())
  ? SERVER_CONFIG.EMULATOR_HOST
  : SERVER_CONFIG.LOCAL_HOST;

export async function detectBestTtsHost(): Promise<string> {
  if (typeof window !== 'undefined' && (window as any).electron) {
    currentWorkingTtsHost = SERVER_CONFIG.LOCAL_HOST;
    return currentWorkingTtsHost;
  }
  const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('best_tienhiep_server') : null;
  if (cached && (cached.includes(':5051') || cached.includes('10.0.2.2') || cached.includes('127.0.0.1'))) {
    currentWorkingTtsHost = cached.replace(/^https:\/\//i, 'http://');
    return currentWorkingTtsHost;
  }
  if (typeof window !== 'undefined' && (window as any).Capacitor && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform()) {
    try {
      const r = await fetch(`${SERVER_CONFIG.LOCAL_HOST}/health`, { signal: AbortSignal.timeout(600) });
      if (r.ok) {
        currentWorkingTtsHost = SERVER_CONFIG.LOCAL_HOST;
        return currentWorkingTtsHost;
      }
    } catch {}

    try {
      const r = await fetch(`${SERVER_CONFIG.EMULATOR_HOST}/health`, { signal: AbortSignal.timeout(600) });
      if (r.ok) {
        currentWorkingTtsHost = SERVER_CONFIG.EMULATOR_HOST;
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
  let cleanText = (textToSend || '').trim().replace(/^[“"'\s«『「]+|[”"'\s»』」]+$/gu, '').trim();
  if (cleanText && !/[.!?…:;]$/.test(cleanText)) cleanText += '.';

  if (ttsEngine === 'local') {
    try {
      const res = await api.post('/synthesize', { text: cleanText, speed: rate || 1.0 }, {
        responseType: 'blob',
        timeout: 8000
      });
      if (res.data && res.data.size > 100) return URL.createObjectURL(res.data);
    } catch {}

    const host = getLocalTtsHost();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${host}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, speed: rate || 1.0 }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) return URL.createObjectURL(await response.blob());
    } catch {
      clearTimeout(timeoutId);
    }

    const res = await api.get('/api/tts/speak', {
      params: { text: cleanText.substring(0, 350), speed: rate || 1.0, voice: 'vi-VN-HoaiMyNeural' },
      responseType: 'blob',
      timeout: 8000
    });
    return URL.createObjectURL(res.data);
  }

  if (ttsEngine === 'matcha') {
    try {
      const res = await api.post('/v1/audio/speech', { input: cleanText, speed: 1.0, voice: matchaVoice }, {
        responseType: 'blob',
        headers: { 'Authorization': `Bearer ${matchaApiKey}` },
        timeout: 8000
      });
      return URL.createObjectURL(res.data);
    } catch {}
  }

  const res = await api.get('/api/tts/speak', {
    params: { text: cleanText.substring(0, 350), speed: rate || 1.0, voice: 'vi-VN-HoaiMyNeural' },
    responseType: 'blob',
    timeout: 8000
  });
  return URL.createObjectURL(res.data);
}

/**
 * Tách và gộp các câu/cụm từ ngắn (< 35 ký tự hoặc 1-4 từ) để nạp vào TTS engine.
 * Matcha-TTS cần đủ ngữ cảnh âm vị (mel context) để flow-matching ODE solver không bị hụt hơi
 * hay đọc cụt lủn. Việc gộp mềm với dấu nối '... ' giúp âm điệu nối liền và tròn vành rõ chữ.
 */
export function splitAndMergeSentences(rawContent: string): string[] {
  if (!rawContent || !rawContent.trim()) return [];
  const parts = rawContent.split(/([.!?。！？\n]+)/);
  const rawList: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const full = (parts[i] + (parts[i + 1] || '')).trim();
    if (full.length > 0 && /[a-zA-Z0-9\u4e00-\u9fa5\u00C0-\u1EF9]/u.test(full)) {
      rawList.push(full);
    }
  }
  if (rawList.length === 0) return [rawContent.trim()];

  const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  const merged: string[] = [];
  let buffer = '';

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!buffer) {
      buffer = item;
    } else {
      const bufWords = countWords(buffer);
      const itemWords = countWords(item);
      // Nối mềm nếu câu đệm hoặc câu mới quá ngắn (<= 3 từ hoặc < 35 ký tự)
      // Giúp Matcha ODE flow-matching có đủ mel acoustic context, phát âm tròn tiếng
      const shouldMerge = (bufWords <= 3 || itemWords <= 3 || buffer.length < 35 || item.length < 25) 
                          && (buffer.length + item.length < 135);
      if (shouldMerge) {
        const cleanBuf = buffer.replace(/[.!?…:;]*$/, '');
        buffer = cleanBuf + '... ' + item;
      } else {
        merged.push(buffer);
        buffer = item;
      }
    }
  }
  if (buffer) {
    // Nếu buffer cuối cùng chỉ có 1 - 2 từ ngắn và đã có câu trước, gộp ngược vào câu trước
    if (merged.length > 0 && (countWords(buffer) <= 2 || buffer.length < 20)) {
      const prev = merged[merged.length - 1];
      if (prev.length + buffer.length < 150) {
        merged[merged.length - 1] = prev.replace(/[.!?…:;]*$/, '') + '... ' + buffer;
      } else {
        merged.push(buffer);
      }
    } else {
      merged.push(buffer);
    }
  }

  return merged;
}

