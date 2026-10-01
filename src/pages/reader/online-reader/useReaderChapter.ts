import { useState, useEffect, useCallback } from 'react';
import api from '../../../services';
import { localTranslator } from '../../../utils/localTranslator';
import { ChapterItem } from './Reader.types';

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
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [bookDetails, setBookDetails] = useState<any>(null);

  const fetchChapterContent = useCallback(async () => {
    if (!bookId || !chapterIdx) return;
    setLoading(true);
    try {
      let realTitle = "Vũ Luyện Điên Phong";
      try {
        const bookRes = await api.get(`/api/book/${bookId}`);
        if (bookRes.data) {
          setBookDetails(bookRes.data);
          realTitle = bookRes.data.title_vietphrase || bookRes.data.title_hanviet || bookRes.data.title;
        }
      } catch (err) {
        console.error("Error fetching book details in reader:", err);
      }

      setBookTitle(realTitle);
      setChapterTitle(`Chương ${chapterIdx}: Khai Phong Thần Điện`);

      const list: ChapterItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Chương ${i + 1}: Khai Phong Thần Điện`,
        url_idx: i + 1,
        active: (i + 1) === parseInt(chapterIdx)
      }));
      setChaptersList(list);

      const sampleChinese = `第${chapterIdx}章 开封神殿\n\n武之极，破苍穹，动乾坤！在这片神秘의 개봉신전中，无数强者汇聚。他们为了争夺上古机缘，不惜 blood shed.\n\n杨开迈步走入神殿，神色淡然。他能夠清晰地感受到虚空中波动的强横气息。这一次 exploration，他势在必得。`;
      
      setTranslating(true);
      let finalContent = sampleChinese;
      try {
        const storedSettings = JSON.parse(localStorage.getItem('translationSettings') || '{}');
        const activeMode = storedSettings.mode || '4';
        const transRes = await api.post('/api/translate', {
          texts: sampleChinese.split('\n\n'),
          mode: activeMode
        }, {
          headers: {
            'X-VIP-Key': 'LYVUHA_ADMIN_2026'
          }
        });
        if (transRes.data?.translations) {
          finalContent = transRes.data.translations.join('\n\n');
        }
      } catch (err) {
        console.warn("[Reader] Cloud translation failed, trying offline localTranslator:", err);
        try {
          await localTranslator.loadDictionaries();
          const fallbackTranslations = await Promise.all(
            sampleChinese.split('\n\n').map(text => localTranslator.translate(text, 'cmlm'))
          );
          finalContent = fallbackTranslations.join('\n\n');
        } catch (localErr) {
          console.error("[Reader] Offline translation failed as well:", localErr);
          throw new Error("Cả máy chủ dịch và bộ dịch offline đều thất bại.");
        }
      }
      setContent(finalContent);

      if (activeAudioObj && activeAudioObj.playType === 'online' && activeAudioObj.book?.id === bookId) {
        setActiveAudioObj({
          ...activeAudioObj,
          chapterIdx: parseInt(chapterIdx),
          title_vietphrase: `Chương ${chapterIdx}: Khai Phong Thần Điện`,
          description: finalContent,
          startSentenceIdx: 0
        });
      }

      if (user) {
        await api.post('/api/history/add', {
          book_id: parseInt(bookId),
          last_chapter: `Chương ${chapterIdx}`
        });
      }
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

  return {
    bookTitle,
    chapterTitle,
    chaptersList,
    content,
    loading,
    translating,
    bookDetails
  };
}
