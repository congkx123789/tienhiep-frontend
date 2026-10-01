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

let activeWorkingServer: string | null = (typeof localStorage !== 'undefined' && localStorage.getItem('best_tienhiep_server')) || null;

export async function executeTranslate(texts: string[], mode: string = 'vietphrase', userVipKey: string = 'VIP2026'): Promise<string[]> {
  const candidateServers: string[] = [];
  if (activeWorkingServer) candidateServers.push(activeWorkingServer);
  if (!candidateServers.includes(SERVER_CONFIG.LOCAL_HOST)) candidateServers.push(SERVER_CONFIG.LOCAL_HOST);
  if (isCapacitor && !candidateServers.includes(SERVER_CONFIG.EMULATOR_HOST)) {
    candidateServers.push(SERVER_CONFIG.EMULATOR_HOST);
  }

  try {
    const stored = localStorage.getItem('translationSettings');
    if (stored) {
      const s = JSON.parse(stored);
      if (s.serverUrl && !s.serverUrl.includes('lyvuha.com') && !candidateServers.includes(s.serverUrl)) {
        candidateServers.unshift(s.serverUrl);
      }
    }
  } catch (e) {}

  candidateServers.push('https://cong123779-tienhiep-api.hf.space');

  for (const srv of candidateServers) {
    try {
      const isCloud = srv.includes('hf.space');
      const timeoutMs = isCloud ? 8000 : 3000;
      const res = await fetch(`${srv}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-VIP-Key': userVipKey || 'VIP2026' },
        body: JSON.stringify({ texts, mode: String(mode || '1'), vip_key: userVipKey || 'VIP2026' }),
        signal: AbortSignal.timeout(timeoutMs)
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
      console.warn(`[Translate Engine] Failed on ${srv}, trying next:`, err);
    }
  }

  try {
    await localTranslator.loadDictionaries();
    return texts.map(t => localTranslator.translateSentence(t, mode));
  } catch (err) {
    return texts;
  }
}

export const ensureVietnameseText = async (rawTitle: string, rawText: string) => {
  let title = rawTitle || 'Chương đọc';
  let text = rawText || '';
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
  if (!url) return '';
  if (url.startsWith('about:')) return url;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('google.') || host === 'goo.gl') {
      if (!parsed.searchParams.has('igu')) parsed.searchParams.set('igu', '1');
      return parsed.toString();
    }
    if (host.includes('youtube.com') && !host.includes('m.youtube.com')) {
      parsed.hostname = 'm.youtube.com';
      return parsed.toString();
    }
  } catch (e) {
    if (url.includes('google.') && !url.includes('igu=1')) {
      return url.includes('?') ? `${url}&igu=1` : `${url}?igu=1`;
    }
  }
  return url;
};
