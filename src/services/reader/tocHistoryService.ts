// tocHistoryService.ts — Write-Behind Queue & Per-Page TOC History Service
export interface PageTocRecord {
  url: string;
  domain: string;
  chapterTitle: string;
  tocLevel: number;
  tocPath?: string;
  chunkIdx: number;
  sentenceIdx: number;
  granularity: number;
  anchorSnippet: string;
  readProgress: number;
  updatedAt?: string;
}

const LOCAL_STORAGE_PREFIX = '__tienhiep_toc_record_';
const PENDING_QUEUE_KEY = '__tienhiep_toc_pending_queue';

let flushTimer: any = null;
let pendingMap = new Map<string, PageTocRecord>();

// Khởi tạo nạp lại các bản ghi chưa gửi từ session trước nếu có
try {
  const savedPending = localStorage.getItem(PENDING_QUEUE_KEY);
  if (savedPending) {
    const parsed = JSON.parse(savedPending);
    if (Array.isArray(parsed)) {
      parsed.forEach((it: PageTocRecord) => {
        if (it?.url) pendingMap.set(it.url, it);
      });
    }
  }
} catch {}

const cleanUrlKey = (rawUrl: string): string => {
  try {
    const u = new URL(rawUrl);
    return u.origin + u.pathname;
  } catch {
    return (rawUrl || '').split('#')[0].split('?')[0];
  }
};

/**
 * Ghi bản ghi TOC tức thì vào Local Cache (0ms) và xếp hàng đẩy lên Backend
 */
export function recordPageToc(record: PageTocRecord): void {
  if (!record || !record.url) return;
  const key = cleanUrlKey(record.url);
  const normalized: PageTocRecord = {
    ...record,
    url: key,
    tocLevel: record.tocLevel || 4,
    granularity: record.granularity || 1,
    anchorSnippet: (record.anchorSnippet || '').slice(0, 80),
    updatedAt: new Date().toISOString()
  };

  // 1. Ghi tức thì vào localStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(normalized));
  } catch {}

  // 2. Đưa vào Write-Behind Queue
  pendingMap.set(key, normalized);
  try {
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(Array.from(pendingMap.values())));
  } catch {}

  // 3. Đặt lịch Debounce Flush (2.5 giây không ghi mới sẽ gửi lên Backend)
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushPendingTocQueue();
  }, 2500);
}

/**
 * Lấy bản ghi TOC từ Local Cache (ưu tiên cực nhanh)
 */
export function getLocalPageToc(url: string): PageTocRecord | null {
  if (!url) return null;
  const key = cleanUrlKey(url);
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return pendingMap.get(key) || null;
}

/**
 * Đồng bộ toàn bộ hàng đợi TOC lên Backend
 */
export async function flushPendingTocQueue(): Promise<void> {
  if (pendingMap.size === 0) return;
  const items = Array.from(pendingMap.values());

  for (const item of items) {
    try {
      const endpoints = ['http://127.0.0.1:5051/api/user/toc-history', '/api/user/toc-history'];
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: item.url,
              domain: item.domain,
              chapter_title: item.chapterTitle,
              toc_level: item.tocLevel,
              toc_path: item.tocPath || '',
              chunk_idx: item.chunkIdx,
              sentence_idx: item.sentenceIdx,
              granularity: item.granularity,
              anchor_snippet: item.anchorSnippet,
              read_progress: item.readProgress
            })
          });
          if (res.ok) {
            pendingMap.delete(item.url);
            break;
          }
        } catch {}
      }
    } catch {}
  }

  try {
    if (pendingMap.size === 0) {
      localStorage.removeItem(PENDING_QUEUE_KEY);
    } else {
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(Array.from(pendingMap.values())));
    }
  } catch {}
}

/**
 * Truy vấn bản ghi từ Backend kèm fallback local cache
 */
export async function fetchRemotePageToc(url: string): Promise<PageTocRecord | null> {
  const local = getLocalPageToc(url);
  if (!url) return local;
  const key = cleanUrlKey(url);

  try {
    const endpoints = [
      `http://127.0.0.1:5051/api/user/toc-history?url=${encodeURIComponent(key)}`,
      `/api/user/toc-history?url=${encodeURIComponent(key)}`
    ];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep);
        if (res.ok) {
          const data = await res.json();
          if (data?.item) {
            const remote = data.item;
            const converted: PageTocRecord = {
              url: remote.url,
              domain: remote.domain,
              chapterTitle: remote.chapter_title,
              tocLevel: remote.toc_level,
              tocPath: remote.toc_path,
              chunkIdx: remote.chunk_idx,
              sentenceIdx: remote.sentence_idx,
              granularity: remote.granularity,
              anchorSnippet: remote.anchor_snippet,
              readProgress: remote.read_progress,
              updatedAt: remote.updated_at
            };
            try {
              localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(converted));
            } catch {}
            return converted;
          }
        }
      } catch {}
    }
  } catch {}

  return local;
}

// Lắng nghe đóng tab hoặc chuyển trang để flush ngay
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushPendingTocQueue();
  });
}
