// Browser Helper Functions & Translation Utilities
import { SERVER_CONFIG } from '../../constants/endpoints';
import { localTranslator } from '../../utils/localTranslator';
import { Capacitor } from '@capacitor/core';

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

let activeWorkingServer: string | null = (typeof localStorage !== 'undefined' && localStorage.getItem('best_tienhiep_server')) || null;

export async function executeTranslate(texts: string[], mode: string = '4', userVipKey: string = 'VIP2026'): Promise<string[]> {
  try {
    const stored = localStorage.getItem('translationSettings');
    if (stored) {
      const s = JSON.parse(stored);
      mode = (s.mode && s.mode !== 'vietphrase') ? String(s.mode) : '4';
    }
  } catch (e) {}

  const mLower = String(mode).toLowerCase().trim();
  if (mLower === 'raw' || mLower === 'none' || mLower === '0' || mLower === 'original') {
    return texts;
  }

  // 1. Thử qua Axios API trung tâm (tự động điều phối server tốt nhất, token và retry)
  try {
    const res = await api.post('/api/translate', {
      texts,
      mode: String(mode || '4'),
      vip_key: userVipKey || 'VIP2026'
    }, { timeout: 12000 });
    if (res.data?.translations && Array.isArray(res.data.translations) && res.data.translations.length === texts.length) {
      return res.data.translations;
    }
  } catch (apiErr) {
    console.warn('[Translate API] Axios error, trying candidate fallbacks:', apiErr);
  }

  // 2. Dự phòng thủ công qua danh sách candidate servers
  const candidateServers: string[] = [];
  if (activeWorkingServer) candidateServers.push(activeWorkingServer);
  if (!candidateServers.includes(SERVER_CONFIG.LOCAL_HOST)) candidateServers.push(SERVER_CONFIG.LOCAL_HOST);
  if (isCapacitor && !candidateServers.includes(SERVER_CONFIG.EMULATOR_HOST)) candidateServers.push(SERVER_CONFIG.EMULATOR_HOST);
  if (!candidateServers.includes(SERVER_CONFIG.REMOTE_HOST)) candidateServers.push(SERVER_CONFIG.REMOTE_HOST);

  for (const srv of candidateServers) {
    try {
      const res = await fetch(`${srv}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-VIP-Key': userVipKey || 'VIP2026' },
        body: JSON.stringify({ texts, mode: String(mode || '4'), vip_key: userVipKey || 'VIP2026' }),
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.translations && json.translations.length === texts.length) {
          activeWorkingServer = srv;
          try { localStorage.setItem('best_tienhiep_server', srv); } catch(e) {}
          return json.translations;
        }
      }
    } catch (err) {
      console.warn(`[Translate Engine] Failed on ${srv}:`, err);
    }
  }

  return texts;
}

export const ensureVietnameseText = async (rawTitle: string, rawText: string) => {
  let title = rawTitle || 'Chương đọc';
  let text = rawText || '';

  try {
    const stored = localStorage.getItem('translationSettings');
    if (stored) {
      const s = JSON.parse(stored);
      const m = String(s.mode || '').toLowerCase().trim();
      if (m === 'raw' || m === 'none' || m === '0' || m === 'original') {
        return { title, text };
      }
    }
  } catch (e) {}

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
  } catch (err) {}
  return { title, text };
};

export const normalizeUrlForIframe = (url?: string): string => {
  if (!url || url === 'http://localhost' || url === 'http://localhost/' || url.startsWith('http://localhost:5173') || url.startsWith('http://127.0.0.1:5173') || url.startsWith('http://localhost:3532') || url.startsWith('http://127.0.0.1:3532')) return 'about:newtab';
  if (url.startsWith('about:')) return url;
  if (url.includes('/api/iframe_proxy')) {
    // Sửa nếu url proxy bị dính https:// hoặc hash
    return url.replace(/^https:\/\/(10\.0\.2\.2|127\.0\.0\.1|localhost):5051/i, 'http://$1:5051').replace('/#/', '/');
  }

  let baseServer = '';
  const isElectronApp = typeof window !== 'undefined' && ((window as any).electron || (navigator && navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')));

  if (isElectronApp) {
    baseServer = SERVER_CONFIG.LOCAL_HOST;
  } else if (typeof localStorage !== 'undefined') {
    const cached = localStorage.getItem('best_tienhiep_server');
    if (cached) {
      if (cached.includes(':5051') || cached.includes('10.0.2.2') || cached.includes('127.0.0.1')) {
        baseServer = cached.replace(/^https:\/\//i, 'http://');
      } else if (!cached.includes(':8001') && !cached.includes('lyvuha.com')) {
        baseServer = cached;
      }
    }
  }
  if (!baseServer && activeWorkingServer) {
    baseServer = activeWorkingServer;
  }
  if (!baseServer && typeof window !== 'undefined') {
    const isNative = (window as any).Capacitor?.isNativePlatform?.();
    baseServer = isNative ? (activeWorkingServer || SERVER_CONFIG.EMULATOR_HOST) : window.location.origin;
  }
  if (!baseServer) baseServer = SERVER_CONFIG.LOCAL_HOST;

  // Đảm bảo tuyệt đối không dùng HTTPS cho cổng 5051 hoặc IP local
  if (baseServer.includes(':5051') || baseServer.includes('10.0.2.2') || baseServer.includes('127.0.0.1') || baseServer.includes('localhost')) {
    baseServer = baseServer.replace(/^https:\/\//i, 'http://');
  }
  baseServer = baseServer.split('#')[0].split('?')[0];
  if (baseServer.endsWith('/')) baseServer = baseServer.slice(0, -1);

  if (url.includes('google.') && url.includes('search')) {
    try {
      const parsed = new URL(url);
      if (!parsed.searchParams.has('igu')) parsed.searchParams.set('igu', '1');
      return parsed.toString();
    } catch (_) {
      return url.includes('?') ? `${url}&igu=1` : `${url}?igu=1`;
    }
  }

  return `${baseServer}/api/iframe_proxy?url=${encodeURIComponent(url)}`;
};

