import { SERVER_CONFIG } from '../../constants/endpoints';
import BasePointManager from '../../core/platform/basePoint';
import { localTranslator } from '../../utils/localTranslator';
import { createTranslateScript } from '../../utils/webview-injected';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

export const isCapacitor = Capacitor.isNativePlatform();

const translationTextCache = new Map<string, string>();
const CACHE_MAX_KEYS = 20000;

export function getCachedTranslation(text: string, mode: string): string | undefined {
  return translationTextCache.get(`${mode}::${text}`);
}

export function setCachedTranslation(text: string, mode: string, translated: string) {
  if (translationTextCache.size > CACHE_MAX_KEYS) {
    const firstKey = translationTextCache.keys().next().value;
    if (firstKey) translationTextCache.delete(firstKey);
  }
  translationTextCache.set(`${mode}::${text}`, translated);
}

export function chineseNumberToArabic(chStr: string): string {
  if (!chStr) return '';
  if (/^\d+$/.test(chStr)) return chStr;
  const digits: Record<string, number> = { '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
  const units: Record<string, number> = { '十': 10, '百': 100, '千': 1000, '万': 10000 };
  let result = 0;
  let current = 0;
  for (let i = 0; i < chStr.length; i++) {
    const char = chStr[i];
    if (digits[char] !== undefined) {
      current = digits[char];
    } else if (units[char] !== undefined) {
      const u = units[char];
      if (current === 0 && u === 10) current = 1;
      result += (current || 1) * u;
      current = 0;
    }
  }
  result += current;
  return result > 0 ? String(result) : chStr;
}

export function cleanNovelTabTitle(title?: string): string {
  if (!title || typeof title !== 'string') return 'Tab mới';
  let t = title.trim();
  t = t.replace(/\s*[-_|\s]+(69书吧|69shu|UU看书|uukanshu|起点中文网|起点中文|笔趣阁|八一中文网|番茄小说|飞卢小说网|纵横中文网|晋江文学城|truyenfull|tangthuvien|tàng thư viện|metruyenchu|đọc truyện online|手机版|wap).*$/i, '');
  t = t.replace(/\s*\(\d+\/\d+\)\s*$/i, '');
  t = t.replace(/\s*[-_|\s]+$/, '');

  t = t.replace(/第\s*([0-9一二两三四五六七八九十百千万]+)\s*章/g, (_, p1) => 'Chương ' + chineseNumberToArabic(p1) + ':');
  t = t.replace(/第\s*([0-9一二两三四五六七八九十百千万]+)\s*节/g, (_, p1) => 'Tiết ' + chineseNumberToArabic(p1) + ':');
  t = t.replace(/第\s*([0-9一二两三四五六七八九十百千万]+)\s*回/g, (_, p1) => 'Hồi ' + chineseNumberToArabic(p1) + ':');
  t = t.replace(/第\s*([0-9一二两三四五六七八九十百千万]+)\s*卷/g, (_, p1) => 'Quyển ' + chineseNumberToArabic(p1) + ':');
  t = t.replace(/\s*:\s*/g, ': ');
  return t.trim() || 'Trang web';
}

import api from '../../services/core/api';

let activeWorkingServer: string | null = null;
try {
  const c = typeof localStorage !== 'undefined' ? localStorage.getItem('best_tienhiep_server') : null;
  if (c && (c.includes(':5051') || c.includes('127.0.0.1') || c.includes('localhost') || c.includes('10.0.2.2'))) {
    activeWorkingServer = c;
  }
} catch (_) {}

export async function executeTranslate(texts: string[], mode: string = '4', userVipKey: string = 'VIP2026'): Promise<string[]> {
  if (!texts || texts.length === 0) return [];

  try {
    const stored = localStorage.getItem('translationSettings');
    if (stored) {
      const s = JSON.parse(stored);
      if (s.mode) {
        mode = String(s.mode);
      }
    }
  } catch (e) { }

  const mLower = String(mode).toLowerCase().trim();
  if (mLower === 'raw' || mLower === 'none' || mLower === 'original') {
    return texts;
  }

  return await localTranslator.translateBatch(texts, mode);
}

export const ensureVietnameseText = async (rawTitle: string, rawText: string) => {
  let title = rawTitle || 'Chương đọc';
  let text = rawText || '';

  try {
    const stored = localStorage.getItem('translationSettings');
    if (stored) {
      const s = JSON.parse(stored);
      const m = String(s.mode || '').toLowerCase().trim();
      if (m === 'raw' || m === 'none' || m === 'original') {
        return { title, text };
      }
    }
  } catch (e) { }

  const chineseRegex = /[\u4e00-\u9fa5]/;
  if (!chineseRegex.test(title) && !chineseRegex.test(text)) return { title, text };

  try {
    const toTranslate: string[] = [];
    const mapping: Array<{ type: 'title' | 'para'; idx?: number }> = [];
    if (chineseRegex.test(title)) {
      toTranslate.push(title);
      mapping.push({ type: 'title' });
    }
    const paras = text.split('\n');
    paras.forEach((p, idx) => {
      if (chineseRegex.test(p)) {
        toTranslate.push(p);
        mapping.push({ type: 'para', idx });
      }
    });

    if (toTranslate.length > 0) {
      const translated = await executeTranslate(toTranslate);
      mapping.forEach((m, idx) => {
        const transVal = translated[idx];
        if (transVal) {
          if (m.type === 'title') title = transVal;
          else if (m.type === 'para' && m.idx !== undefined) paras[m.idx] = transVal;
        }
      });
      text = paras.join('\n');
    }
  } catch (err) { }
  return { title, text };
};

export const normalizeUrlForIframe = (url?: string, tabId?: string): string => {
  if (!url || url === 'http://localhost' || url === 'http://localhost/' || url.startsWith('http://localhost:5173') || url.startsWith('http://127.0.0.1:5173') || url.startsWith('http://localhost:3532') || url.startsWith('http://127.0.0.1:3532') || url.startsWith('chrome') || url.startsWith('chrome-error')) return 'about:newtab';
  if (url.startsWith('about:')) return url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return 'about:newtab';

  // Giải mã nếu URL đã bị lồng proxy
  if (url.includes('/api/iframe_proxy?url=') || url.includes('/iframe_proxy?url=')) {
    try {
      const match = url.match(/[\?&]url=([^&]+)/);
      if (match && match[1]) {
        url = decodeURIComponent(match[1]);
      }
    } catch (_) { }
  }

  // Tự động phân giải các domain tiểu thuyết đã chết hoặc bị DNS Poisoning sang mirror sống tốt
  url = url.replace(/^https?:\/\/(www\.|m\.)?uukanshu\.com(\/|$)/i, 'https://uukanshu.cc$2');
  url = url.replace(/^https?:\/\/(www\.|m\.)?biquge\.com(\/|$)/i, 'https://www.b520.cc$2');

  // Khắc phục đường dẫn tương đối vô tình bị resolve theo host backend
  if (url.includes('/n/')) {
    url = url.replace(/^https?:\/\/[^\/]+\/n\//, 'https://www.quanben5.com/n/');
  }

  let baseServer = '';
  const isElectronApp = typeof window !== 'undefined' && ((window as any).electron || (navigator && navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')));

  if (isElectronApp) {
    baseServer = SERVER_CONFIG.LOCAL_HOST;
  } else {
    baseServer = BasePointManager.getBaseUrl();
  }

  // Đảm bảo tuyệt đối không dùng HTTPS cho cổng 5051 hoặc IP local
  if (baseServer.includes(':5051') || baseServer.includes('10.0.2.2') || baseServer.includes('127.0.0.1') || baseServer.includes('localhost')) {
    baseServer = baseServer.replace(/^https:\/\//i, 'http://');
  }
  baseServer = baseServer.split('#')[0].split('?')[0];
  if (baseServer.endsWith('/')) baseServer = baseServer.slice(0, -1);

  if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
    try {
      const parsed = new URL(url);
      let videoId = parsed.searchParams.get('v');
      if (!videoId && url.includes('youtu.be/')) {
        videoId = parsed.pathname.replace(/^\//, '');
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (_) { }
  }

  if (url.includes('google.') && (url.includes('search') || url.includes('igu=1') || url.includes('google.com'))) {
    try {
      const parsed = new URL(url);
      if (!parsed.searchParams.has('igu')) parsed.searchParams.set('igu', '1');
      return parsed.toString();
    } catch (_) {
      return url.includes('?') ? `${url}&igu=1` : `${url}?igu=1`;
    }
  }

  const tabParam = tabId ? `&tabId=${encodeURIComponent(tabId)}` : '';
  return `${baseServer}/api/iframe_proxy?url=${encodeURIComponent(url)}${tabParam}`;
};

export function injectTranslateScriptToTab(tabId: string, sendWebviewMessage: (id: string, p: any) => void): void {
  const scriptCode = `window.__TIENHIEP_TAB_ID__ = "${tabId}";\n` + createTranslateScript(false);
  sendWebviewMessage(tabId, { action: 'INJECT_SCRIPT', script: scriptCode });
  const wv = document.getElementById('global-wv-' + tabId) as HTMLIFrameElement | null;
  if (wv?.contentDocument && !wv.contentDocument.getElementById('__tienhiep_injected_script')) {
    try {
      const script = wv.contentDocument.createElement('script');
      script.id = '__tienhiep_injected_script';
      script.textContent = scriptCode;
      (wv.contentDocument.head || wv.contentDocument.documentElement || wv.contentDocument.body).appendChild(script);
    } catch (_) { }
  }
}

