/**
 * modeTranslator.ts — BỘ ĐIỀU PHỐI DỊCH THUẬT THEO CHẾ ĐỘ (MODE 1-4, ANIME, TIÊN HIỆP, ÂU MỸ)
 * Tự động ánh xạ tên riêng & danh từ đặc trưng theo từng phong cách dịch.
 * Đảm bảo Mode 2 (Anime) dịch "鸣人" -> "Naruto", Mode 3 -> tên tiếng Anh, Mode 1 -> tên Tiên Hiệp.
 */

// Bảng từ điển tên riêng cốt lõi nạp sẵn trên RAM (Tức thì, 0ms)
const CORE_ANIME_MAP = new Map<string, string>([

]);

const CORE_WESTERN_MAP = new Map<string, string>([

]);

const CORE_XIANXIA_MAP = new Map<string, string>([

]);

class ModeTranslator {
  private animeMap: Map<string, string> = new Map(CORE_ANIME_MAP);
  private westernMap: Map<string, string> = new Map(CORE_WESTERN_MAP);
  private xianxiaMap: Map<string, string> = new Map(CORE_XIANXIA_MAP);
  private hanvietMap: Map<string, string> = new Map();
  private loadedModes = new Set<string>();
  private isFetching = false;

  constructor() {
    if (typeof window !== 'undefined') {
      setTimeout(() => this.preloadDictionaries(), 500);
    }
  }

  private async loadDictContent(urlPath: string): Promise<string> {
    if (typeof window === 'undefined') {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const candidates = [
          path.resolve(process.cwd(), 'public', urlPath),
          path.resolve(process.cwd(), 'frontend', 'public', urlPath),
          path.resolve(process.cwd(), 'dist-web', urlPath),
          path.resolve(__dirname, '../../../public', urlPath),
        ];
        for (const c of candidates) {
          if (fs.existsSync(c)) return fs.readFileSync(c, 'utf8');
        }
      } catch (_) {}
    }
    const prefixes = ['', './', '/', `${(typeof window !== 'undefined' && window.location?.origin) || ''}/`];
    for (const p of prefixes) {
      try {
        const fullUrl = `${p}${urlPath.replace(/^\//, '')}`;
        const res = await fetch(fullUrl);
        if (res.ok) return await res.text();
      } catch (_) { }
    }
    return '';
  }

  public async ensureModeLoaded(modeNum: number): Promise<void> {
    const key = String(modeNum);
    if (this.loadedModes.has(key)) return;
    if (!this.loadedModes.has('hv')) {
      const hvData = await this.loadDictContent('models/dict/HanViet.txt');
      if (hvData) this.parseIntoMap(hvData, this.hanvietMap);
      const famData = await this.loadDictContent('models/dict/Family_Names.txt');
      if (famData) this.parseIntoMap(famData, this.hanvietMap);
      this.loadedModes.add('hv');
    }
    if (modeNum === 2) {
      const data = await this.loadDictContent('models/dict/name_japan/Japanese_Names.txt');
      if (data) this.parseIntoMap(data, this.animeMap);
      const single = await this.loadDictContent('models/dict/name_japan/Japanese_Single_Names.txt');
      if (single) this.parseIntoMap(single, this.animeMap);
      this.loadedModes.add('2');
    } else if (modeNum === 3) {
      const data = await this.loadDictContent('models/dict/name_english/English_Names.txt');
      if (data) this.parseIntoMap(data, this.westernMap);
      this.loadedModes.add('3');
    } else if (modeNum === 1) {
      const data = await this.loadDictContent('models/dict/hanviet/Names_Trung.txt');
      if (data) this.parseIntoMap(data, this.xianxiaMap);
      this.loadedModes.add('1');
    } else if (modeNum === 4) {
      await Promise.all([this.ensureModeLoaded(1), this.ensureModeLoaded(2), this.ensureModeLoaded(3)]);
      this.loadedModes.add('4');
    }
  }

  public async preloadDictionaries(): Promise<void> {
    if (this.isFetching) return;
    this.isFetching = true;
    try {
      await Promise.all([this.ensureModeLoaded(2), this.ensureModeLoaded(3), this.ensureModeLoaded(1)]);
    } catch (_) { } finally {
      this.isFetching = false;
    }
  }

  private parseIntoMap(content: string, targetMap: Map<string, string>): void {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const eq = line.indexOf('=');
      if (eq > 0) {
        const k = line.slice(0, eq).trim();
        const v = line.slice(eq + 1).trim();
        if (k && v) {
          if (!targetMap.has(k)) targetMap.set(k, v);
          if (/[·•.]/.test(k)) {
            const noDot = k.replace(/[·•.]/g, '');
            if (noDot && !targetMap.has(noDot)) targetMap.set(noDot, v);
          }
        }
      }
    }
  }

  public translateWithMode(
    text: string,
    modeNum: number,
    fallbackTranslate: (t: string) => string
  ): string {
    if (!text || !text.trim()) return '';
    const trimmed = text.trim();

    let targetDict: Map<string, string> | null = null;
    if (modeNum === 2) targetDict = this.animeMap;
    else if (modeNum === 3) targetDict = this.westernMap;
    else if (modeNum === 1) targetDict = this.xianxiaMap;
    else if (modeNum === 4) {
      targetDict = new Map([...this.xianxiaMap, ...this.animeMap, ...this.westernMap]);
    }

    // Khớp từ điển theo thuật toán Longest-Match-First (Forward Maximum Matching)
    let result = '';
    let i = 0;
    let unmatched = '';

    const flushUnmatched = () => {
      if (unmatched) {
        let trans = fallbackTranslate(unmatched);
        if (!trans || trans === unmatched) {
          let hv = '';
          for (const ch of unmatched) {
            const h = this.hanvietMap.get(ch);
            if (h) hv += (hv ? ' ' : '') + h;
            else hv += ch;
          }
          if (hv) trans = hv;
        }
        if (result && !result.endsWith(' ') && !trans.startsWith(' ')) result += ' ';
        result += trans;
        unmatched = '';
      }
    };

    while (i < trimmed.length) {
      let matched = false;
      const maxLen = Math.min(25, trimmed.length - i);
      for (let len = maxLen; len >= 1; len--) {
        const sub = trimmed.slice(i, i + len);
        if (targetDict.has(sub)) {
          flushUnmatched();
          const repl = targetDict.get(sub)!;
          if (result && !result.endsWith(' ') && !repl.startsWith(' ')) result += ' ';
          result += repl;
          i += len;
          matched = true;
          break;
        }
      }
      if (!matched) {
        unmatched += trimmed[i];
        i++;
      }
    }
    flushUnmatched();

    return result.replace(/\s+/g, ' ').trim() || fallbackTranslate(trimmed) || trimmed;
  }
}

export const modeTranslator = new ModeTranslator();
