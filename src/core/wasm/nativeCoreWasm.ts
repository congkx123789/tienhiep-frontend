/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  nativeCoreWasm.ts — BỘ NẠP LÕI NATIVE-CORE TRỰC TIẾP TRÊN RAM (100% IN-PROCESS)
 * ═════════════════════════════════════════════════════════════════════════════
 *  - Nạp native-core.wasm trực tiếp vào bộ nhớ RAM của ứng dụng.
 *  - 100% Offline: Bóc tách chương, chuẩn hóa văn bản & dịch thuật Trie MaxMatch.
 *  - Zero Network, Zero Server, chạy hoàn toàn độc lập khi điện thoại ngoài trời.
 * ═════════════════════════════════════════════════════════════════════════════
 */

declare global {
  interface Window {
    Go?: any;
    __NativeCore_IsReady?: () => boolean;
    __NativeCore_Translate?: (text: string) => string;
    __NativeCore_ExtractChapter?: (html: string, url: string) => string;
    __NativeCore_SanitizeWeb?: (html: string, url: string) => string;
    __NativeCore_Normalize?: (text: string) => string;
    __NativeCore_SplitSentences?: (text: string) => string;
    __NativeCore_ParseTxt?: (rawText: string, title?: string) => string;
    __NativeCore_ParseEpub?: (base64Str: string) => string;
  }
}

let isInitialized = false;
let isInitializing = false;
let initPromise: Promise<boolean> | null = null;

export async function initNativeCoreWasm(): Promise<boolean> {
  if (isInitialized && window.__NativeCore_IsReady?.()) {
    return true;
  }
  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      if (typeof window === 'undefined') return false;

      // Đợi script wasm_exec.js sẵn sàng nếu đang nạp
      if (!window.Go) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = './wasm_exec.js';
          script.onload = () => resolve();
          script.onerror = () => {
            const fallbackScript = document.createElement('script');
            fallbackScript.src = '/wasm_exec.js';
            fallbackScript.onload = () => resolve();
            fallbackScript.onerror = () => resolve();
            document.head.appendChild(fallbackScript);
          };
          document.head.appendChild(script);
        });
      }

      if (!window.Go) {
        console.warn('[native-core.wasm] wasm_exec.js chưa khả dụng trong môi trường này.');
        isInitializing = false;
        return false;
      }

      const go = new window.Go();
      let wasmBuffer: ArrayBuffer | null = null;
      const candidates = [
        '/native-core.wasm',
        './native-core.wasm',
        `${window.location?.origin || ''}/native-core.wasm`,
      ];
      for (const p of candidates) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            wasmBuffer = await res.arrayBuffer();
            break;
          }
        } catch (_) {}
      }

      if (!wasmBuffer) {
        console.warn('[native-core.wasm] Không thể nạp file WASM từ các đường dẫn cục bộ.');
        isInitializing = false;
        return false;
      }

      const result = await WebAssembly.instantiate(wasmBuffer, go.importObject);

      // Chạy Go runtime ở tiến trình nền bên trong RAM
      go.run(result.instance);

      isInitialized = true;
      isInitializing = false;
      console.log('🎉 [native-core.wasm] Nạp thành công vào RAM! Sẵn sàng chạy 100% In-Process Offline.');
      return true;
    } catch (err) {
      console.error('[native-core.wasm] Lỗi nạp WebAssembly:', err);
      isInitializing = false;
      return false;
    }
  })();

  return initPromise;
}

export function isNativeCoreWasmReady(): boolean {
  if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.NativeCore) {
    return true;
  }
  return Boolean(isInitialized && window.__NativeCore_IsReady && window.__NativeCore_IsReady());
}

export function wasmTranslate(text: string): string {
  if (!text || !text.trim()) return '';
  if (isNativeCoreWasmReady() && window.__NativeCore_Translate) {
    try {
      return window.__NativeCore_Translate(text);
    } catch (_) { }
  }
  return text;
}

export function wasmExtractChapter(html: string, url: string = ''): any {
  if (!html) return null;
  if (isNativeCoreWasmReady() && window.__NativeCore_ExtractChapter) {
    try {
      const jsonStr = window.__NativeCore_ExtractChapter(html, url);
      return JSON.parse(jsonStr);
    } catch (_) { }
  }
  return null;
}

export function wasmNormalize(text: string): string {
  if (!text) return '';
  const cap = typeof window !== 'undefined' && (window as any).Capacitor;
  if (cap?.Plugins?.NativeCore?.normalizeTTS) {
    try {
      // Async call cached if needed, fallback to direct
    } catch (_) {}
  }
  if (isNativeCoreWasmReady() && window.__NativeCore_Normalize) {
    try {
      return window.__NativeCore_Normalize(text);
    } catch (_) { }
  }
  return text.trim();
}

export function wasmSplitSentences(text: string): string[] {
  if (!text) return [];
  if (isNativeCoreWasmReady() && window.__NativeCore_SplitSentences) {
    try {
      const jsonStr = window.__NativeCore_SplitSentences(text);
      return JSON.parse(jsonStr);
    } catch (_) { }
  }
  return text.split(/[.!?。！？…\n]+/).map(s => s.trim()).filter(Boolean);
}

export function wasmSanitizeWeb(html: string, url: string = ''): string {
  if (!html) return '';
  if (isNativeCoreWasmReady() && window.__NativeCore_SanitizeWeb) {
    try {
      return window.__NativeCore_SanitizeWeb(html, url);
    } catch (_) { }
  }
  return html;
}

export function wasmParseTxt(rawText: string, title?: string): any {
  if (!rawText) return null;
  if (isNativeCoreWasmReady() && window.__NativeCore_ParseTxt) {
    try {
      const jsonStr = window.__NativeCore_ParseTxt(rawText, title);
      return JSON.parse(jsonStr);
    } catch (_) { }
  }
  return null;
}

export function wasmParseEpub(base64Data: string): any {
  if (!base64Data) return null;
  if (isNativeCoreWasmReady() && window.__NativeCore_ParseEpub) {
    try {
      const jsonStr = window.__NativeCore_ParseEpub(base64Data);
      return JSON.parse(jsonStr);
    } catch (_) { }
  }
  return null;
}
