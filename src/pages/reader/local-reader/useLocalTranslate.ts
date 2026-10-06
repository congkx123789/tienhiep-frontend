/**
 * useLocalTranslate.ts — Hook dịch thuật PROGRESSIVE cho Local Reader
 * ─────────────────────────────────────────────────────────────────────
 * Chiến lược: chia content thành từng CHUNK nhỏ (10 đoạn/chunk),
 * dịch lần lượt và emit ngay sau mỗi chunk → TTS có thể bắt đầu đọc
 * ngay sau khi chunk đầu tiên sẵn sàng, không cần chờ toàn bộ.
 *
 * Nếu content ngắn (≤ SMALL_BATCH_SIZE đoạn) → gửi 1 batch duy nhất
 * như trước để tránh overhead.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { LocalBook } from './LocalReader.types';
import { localTranslator } from '../../../utils/localTranslator';
import api from '../../../services/core/api';

export type TranslateMode = 'raw' | 'vietphrase' | 'cmlm' | 'hanviet';

/** Số đoạn tối đa gửi trong 1 API call */
const CHUNK_SIZE = 12;
/** Nếu ≤ ngưỡng này → gửi 1 batch, không progressive */
const SMALL_BATCH_SIZE = 20;

function getInitialMode(): TranslateMode {
  try {
    const stored = JSON.parse(localStorage.getItem('translationSettings') || '{}');
    const m = stored.mode as string;
    if (m === 'raw' || m === 'vietphrase' || m === 'cmlm' || m === 'hanviet') return m;
  } catch { /* ignore */ }
  return 'cmlm';
}

/** Dịch 1 mảng đoạn văn qua backend API, fallback offline */
async function translateChunk(
  paragraphs: string[],
  mode: string,
  signal: AbortSignal
): Promise<string[]> {
  // Backend API — nhanh (C++ CMLM engine)
  try {
    const res = await api.post(
      '/api/translate',
      { texts: paragraphs, mode },
      { headers: { 'X-VIP-Key': 'LYVUHA_ADMIN_2026' }, signal, timeout: 2500 }
    );
    if (res.data?.translations && Array.isArray(res.data.translations)) {
      return res.data.translations;
    }
  } catch (err: any) {
    if (err.name === 'CanceledError' || err.name === 'AbortError') throw err;
    console.warn('[LocalTranslate] API unreachable, fallback offline local:', err.message);
  }

  // Offline fallback — localTranslator (100% Local Trie)
  await localTranslator.loadDictionaries();
  return localTranslator.translateBatch(paragraphs, mode);
}

export function useLocalTranslate(
  activeBook: LocalBook | null,
  activeChapterIdx: number
) {
  const [translateMode, setTranslateModeState] = useState<TranslateMode>(getInitialMode);
  const [translatedContent, setTranslatedContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  /** 0-100: tiến độ dịch theo chunk */
  const [translateProgress, setTranslateProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const rawContent = activeBook?.chapters[activeChapterIdx]?.content ?? '';

  const setTranslateMode = useCallback((mode: TranslateMode) => {
    setTranslateModeState(mode);
    try {
      const stored = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      localStorage.setItem('translationSettings', JSON.stringify({ ...stored, mode }));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!rawContent) {
      setTranslatedContent('');
      setTranslateProgress(0);
      return;
    }

    // Raw mode — trả nguyên bản gốc ngay lập tức
    if (translateMode === 'raw') {
      setTranslatedContent(rawContent);
      setIsTranslating(false);
      setTranslateProgress(100);
      return;
    }

    // Hủy request trước nếu đang chạy
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    let cancelled = false;
    const paragraphs = rawContent.split(/\n+/).filter(p => p.trim());

    setIsTranslating(true);
    setTranslateProgress(0);
    // Hiện ngay nội dung raw để user không thấy trang trắng
    setTranslatedContent(rawContent);

    const doTranslate = async () => {
      // ── Nội dung ngắn: gửi 1 batch duy nhất ──────────────────────────
      if (paragraphs.length <= SMALL_BATCH_SIZE) {
        setTranslateProgress(10);
        const results = await translateChunk(paragraphs, translateMode, signal);
        if (!cancelled) {
          setTranslatedContent(results.join('\n\n'));
          setTranslateProgress(100);
        }
        return;
      }

      // ── Nội dung dài: Progressive chunk-by-chunk ──────────────────────
      const chunks: string[][] = [];
      for (let i = 0; i < paragraphs.length; i += CHUNK_SIZE) {
        chunks.push(paragraphs.slice(i, i + CHUNK_SIZE));
      }

      const translatedChunks: string[] = paragraphs.slice(); // bắt đầu = raw
      const totalChunks = chunks.length;

      for (let ci = 0; ci < chunks.length; ci++) {
        if (cancelled || signal.aborted) break;

        const chunkResult = await translateChunk(chunks[ci], translateMode, signal);
        if (cancelled || signal.aborted) break;

        // Thay thế chunk đã dịch vào vị trí đúng
        const startIdx = ci * CHUNK_SIZE;
        chunkResult.forEach((translated, j) => {
          translatedChunks[startIdx + j] = translated;
        });

        const progress = Math.round(((ci + 1) / totalChunks) * 100);
        setTranslateProgress(progress);
        // Emit ngay sau mỗi chunk để TTS bắt đầu sớm
        setTranslatedContent(translatedChunks.join('\n\n'));
      }
    };

    doTranslate()
      .catch((err: any) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError' || cancelled) return;
        console.error('[LocalTranslate] Translation failed:', err);
        // Giữ raw content thay vì màn hình trắng
        if (!cancelled) setTranslatedContent(rawContent);
      })
      .finally(() => {
        if (!cancelled) {
          setIsTranslating(false);
          setTranslateProgress(100);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [rawContent, translateMode]);

  const updateParagraph = useCallback((pIdx: number, newText: string) => {
    setTranslatedContent(prev => {
      const paras = prev.split(/\n+/);
      if (pIdx >= 0 && pIdx < paras.length) {
        paras[pIdx] = newText;
        return paras.join('\n\n');
      }
      return prev;
    });
  }, []);

  return { translateMode, setTranslateMode, translatedContent, isTranslating, translateProgress, updateParagraph };
}

