import { useState, useEffect, useCallback } from 'react';
import api from '../../../services';
import { localTranslator } from '../../../utils/localTranslator';
import { ChapterItem } from './Reader.types';
import { getAccountItem, setAccountItem } from '../../../utils/accountStorage';

interface UseReaderChapterProps {
  bookId?: string;
  chapterIdx?: string;
  user: any;
  t: any;
  activeAudioObj: any;
  setActiveAudioObj: (obj: any) => void;
}

export function useReaderChapter({
  bookId,
  chapterIdx,
  user,
  t,
  activeAudioObj,
  setActiveAudioObj
}: UseReaderChapterProps) {
  const [bookTitle, setBookTitle] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chaptersList, setChaptersList] = useState<ChapterItem[]>([]);
  const [rawContent, setRawContent] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(15);
  const [bookDetails, setBookDetails] = useState<any>(null);

  const fetchChapterContent = useCallback(async () => {
    if (!bookId || !chapterIdx) return;
    setLoading(true);
    setLoadingProgress(15);
    try {
      let realTitle = "Tác phẩm tiên hiệp";
      let maxChapters = 100;
      try {
        const bookRes = await api.get(`/api/book/${bookId}`);
        if (bookRes.data) {
          setBookDetails(bookRes.data);
          realTitle = bookRes.data.title_vietphrase || bookRes.data.title_hanviet || bookRes.data.title;
          if (bookRes.data.chapters_max > 0) {
            maxChapters = bookRes.data.chapters_max;
          }
        }
      } catch (err) {
        console.error("Error fetching book details in reader:", err);
      }

      setLoadingProgress(30);
      setBookTitle(realTitle);

      const curIdx = parseInt(chapterIdx) || 1;
      let realChapterTitle = `Chương ${curIdx}: Phong khởi vân dũng`;
      let chineseText = `第${curIdx}章 风起云涌\n\n天地不仁，以万物为刍狗。浩瀚仙穹之下，万族林立，诸圣争锋。\n\n清风掠过苍茫古林，草木簌簌作响。修行之路漫长且艰险，唯有向道之心坚若磐石，方能破开天渊桎梏，成就万古至尊。`;
      let preTranslated = '';

      // Gọi API chapter content thật từ server
      try {
        const chapRes = await api.get('/api/chapter/content', {
          params: { book_id: bookId, chapter_idx: curIdx }
        });
        if (chapRes.data && chapRes.data.success) {
          if (chapRes.data.title) realChapterTitle = chapRes.data.title;
          if (chapRes.data.raw_chinese || chapRes.data.content) {
            chineseText = chapRes.data.raw_chinese || chapRes.data.content;
          }
          if (chapRes.data.translated_content) {
            preTranslated = chapRes.data.translated_content;
          }
          if (chapRes.data.max_chapters > 0) {
            maxChapters = chapRes.data.max_chapters;
          }
        }
      } catch (cErr) {
        console.warn("Could not load /api/chapter/content:", cErr);
      }

      setChapterTitle(realChapterTitle);

      // Tải danh sách chương thực từ API
      try {
        const chapListRes = await api.get(`/api/book/${bookId}/chapters`, { params: { lang: 'vi' } });
        if (chapListRes.data?.chapters && Array.isArray(chapListRes.data.chapters)) {
          setChaptersList(chapListRes.data.chapters.map((ch: any) => ({
            ...ch,
            active: ch.url_idx === curIdx || ch.id === curIdx
          })));
        } else {
          throw new Error('no chapters array');
        }
      } catch {
        // Fallback: danh sách đánh số
        const totalToDisplay = Math.min(Math.max(maxChapters, 1), 2000);
        setChaptersList(Array.from({ length: totalToDisplay }, (_, i) => ({
          id: i + 1,
          title: `Chương ${i + 1}`,
          url_idx: i + 1,
          active: (i + 1) === curIdx
        })));
      }

      setRawContent(chineseText);

      
      const storedSettings = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      const activeMode = String(storedSettings.mode || '4');
      const isRawMode = activeMode === 'raw' || activeMode === 'none' || activeMode === '0';

      let finalContent = chineseText;

      if (!isRawMode) {
        setTranslating(true);
        setLoadingProgress(50);
        try {
          const transRes = await api.post('/api/translate', {
            texts: chineseText.split('\n\n'),
            mode: activeMode
          }, {
            headers: {
              'X-VIP-Key': 'LYVUHA_ADMIN_2026'
            }
          });
          setLoadingProgress(85);
          if (transRes.data?.translations) {
            finalContent = transRes.data.translations.join('\n\n');
          }
        } catch (err) {
          console.warn("[Reader] Cloud translation failed, trying offline localTranslator:", err);
          try {
            setLoadingProgress(60);
            await localTranslator.loadDictionaries();
            setLoadingProgress(75);
            const fallbackTranslations = await Promise.all(
              chineseText.split('\n\n').map(text => localTranslator.translate(text, 'cmlm'))
            );
            finalContent = fallbackTranslations.join('\n\n');
          } catch (localErr) {
            console.error("[Reader] Offline translation failed as well:", localErr);
            finalContent = preTranslated || chineseText;
          }
        }
      }
      setLoadingProgress(95);
      setContent(finalContent);

      if (activeAudioObj && activeAudioObj.playType === 'online' && activeAudioObj.book?.id === bookId) {
        setActiveAudioObj({
          ...activeAudioObj,
          chapterIdx: curIdx,
          title_vietphrase: realChapterTitle,
          description: finalContent,
          startSentenceIdx: 0
        });
      }

      // Lưu lịch sử đọc cục bộ phân tách theo tài khoản
      try {
        const localItem = {
          book_id: parseInt(bookId),
          last_chapter: `Chương ${curIdx}`,
          chapter_title: realChapterTitle,
          timestamp: new Date().toISOString()
        };
        const curLocalHistory = getAccountItem<any[]>('tienhiep_local_reading_history', []);
        const updatedLocal = [localItem, ...curLocalHistory.filter(h => h.book_id !== localItem.book_id)].slice(0, 100);
        setAccountItem('tienhiep_local_reading_history', updatedLocal);
      } catch (err) {}

      if (user) {
        await api.post('/api/history/add', {
          book_id: parseInt(bookId),
          last_chapter: `Chương ${curIdx}`
        });
      }
      setLoadingProgress(100);
    } catch (e) {
      console.error(e);
      setContent(t.reader?.errorLoadingChapter || "Lỗi tải nội dung chương hoặc không kết nối được máy chủ dịch.");
    } finally {
      setLoading(false);
      setTranslating(false);
    }
  }, [bookId, chapterIdx, user, t, activeAudioObj, setActiveAudioObj]);

  useEffect(() => {
    fetchChapterContent();
  }, [fetchChapterContent]);

  useEffect(() => {
    const handleSettingsUpdated = () => {
      fetchChapterContent();
    };
    window.addEventListener('translationSettingsUpdated', handleSettingsUpdated);
    return () => window.removeEventListener('translationSettingsUpdated', handleSettingsUpdated);
  }, [fetchChapterContent]);

  return {
    bookTitle,
    chapterTitle,
    chaptersList,
    content,
    rawContent,
    setContent,
    loading,
    translating,
    loadingProgress,
    bookDetails
  };
}
