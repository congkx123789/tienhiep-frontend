import { useCallback } from 'react';
import { ActiveAudioBook } from './BrowserContext.types';
import { ensureVietnameseText } from './browserHelpers';
import api from '../../services';
import { getLocalBooksFromDB, saveLocalBookToDB } from '../../pages/reader/local-reader/localDb';
import { getAccountItem, setAccountItem } from '../../utils/accountStorage';

export function useBrowserAudioChapter(
  activeAudioObjRef: React.MutableRefObject<ActiveAudioBook | null>,
  setActiveAudioObj: React.Dispatch<React.SetStateAction<ActiveAudioBook | null>>,
  sendWebviewMessage: (tabId: string, payload: any) => void
) {
  const handleGlobalNextChapter = useCallback(async (tabId?: string) => {
    const current = activeAudioObjRef.current;
    if (!current) return;

    const playType = (current as any)?.playType;
    const targetTabId = tabId || current?.tabId;

    if (playType === 'offline' && current.book?.id) {
      try {
        const localBooks = await getLocalBooksFromDB();
        const book = localBooks.find(b => b.id === current.book.id);
        if (book && Array.isArray(book.chapters)) {
          const nextIdx = (typeof current.chapterIdx === 'number' ? current.chapterIdx : 0) + 1;
          if (nextIdx < book.chapters.length) {
            const nextChap = book.chapters[nextIdx];
            const { title: transTitle, text: transContent } = await ensureVietnameseText(
              nextChap.title,
              nextChap.content
            );
            const contentToPlay = transContent || nextChap.content;
            const titleToPlay = transTitle || nextChap.title;

            await saveLocalBookToDB({ ...book, lastReadChapterIdx: nextIdx });

            setActiveAudioObj({
              ...current,
              title: titleToPlay,
              title_vietphrase: titleToPlay,
              currentChapterTitle: titleToPlay,
              description: contentToPlay,
              chapterIdx: nextIdx,
              startSentenceIdx: 0,
              paragraphs: contentToPlay.split(/\n+/),
              isChapter: true,
              playType: 'offline'
            });

            window.dispatchEvent(new CustomEvent('local-chapter-changed', {
              detail: { bookId: book.id, chapterIdx: nextIdx }
            }));
            return;
          }
        }
      } catch (err) {
        console.error('Lỗi tự động chuyển chương offline:', err);
      }
    }

    if ((playType === 'online' || !playType) && current.book?.id) {
      const bookId = current.book.id;
      const curIdx = typeof current.chapterIdx === 'number' ? current.chapterIdx : 1;
      const nextIdx = curIdx + 1;
      const maxChapters = current.book?.chapters_max || 999999;

      if (nextIdx <= maxChapters) {
        try {
          const chapRes = await api.get('/api/chapter/content', {
            params: { book_id: bookId, chapter_idx: nextIdx }
          });

          if (chapRes.data && (chapRes.data.content || chapRes.data.raw_chinese || chapRes.data.translated_content)) {
            const rawTitle = chapRes.data.title || `Chương ${nextIdx}`;
            const rawText = chapRes.data.translated_content || chapRes.data.content || chapRes.data.raw_chinese || '';

            const { title: transTitle, text: transContent } = await ensureVietnameseText(rawTitle, rawText);
            const contentToPlay = transContent || rawText;
            const titleToPlay = transTitle || rawTitle;

            setActiveAudioObj({
              ...current,
              title: titleToPlay,
              title_vietphrase: titleToPlay,
              currentChapterTitle: titleToPlay,
              description: contentToPlay,
              chapterIdx: nextIdx,
              startSentenceIdx: 0,
              paragraphs: contentToPlay.split(/\n+/),
              isChapter: true,
              playType: 'online'
            });

            try {
              const histItem = {
                book_id: bookId,
                title: current.book?.title_vietphrase || current.book?.title || 'Truyện',
                author: current.book?.author_hanviet || current.book?.author,
                cover: current.book?.cover,
                last_chapter: titleToPlay,
                last_read_at: new Date().toISOString(),
                url: `/book/${bookId}/read/${nextIdx}`
              };
              const curList = getAccountItem<any[]>('tienhiep_local_reading_history', []);
              const updated = [histItem, ...curList.filter((b: any) => b.book_id !== bookId)];
              setAccountItem('tienhiep_local_reading_history', updated);

              api.post('/api/user/history', {
                book_id: bookId,
                chapter_title: titleToPlay,
                chapter_url: `/book/${bookId}/read/${nextIdx}`
              }).catch(() => {});
            } catch (hErr) {}

            window.dispatchEvent(new CustomEvent('global-chapter-changed', {
              detail: { bookId, chapterIdx: nextIdx, chapterTitle: titleToPlay }
            }));
            return;
          }
        } catch (err) {
          console.error('Lỗi tải chương tiếp theo online:', err);
        }
      }
    }

    if (targetTabId && (playType === 'webview' || targetTabId)) {
      try { sessionStorage.setItem('__tienhiep_tts_active_' + targetTabId, 'true'); } catch(e) {}
      sendWebviewMessage(targetTabId, { action: 'TRIGGER_NEXT', delay: 0 });
    }
  }, [activeAudioObjRef, setActiveAudioObj, sendWebviewMessage]);

  const handleGlobalPrevChapter = useCallback(async (tabId?: string) => {
    const current = activeAudioObjRef.current;
    if (!current) return;

    const playType = (current as any)?.playType;
    const targetTabId = tabId || current?.tabId;

    if (playType === 'offline' && current.book?.id) {
      try {
        const localBooks = await getLocalBooksFromDB();
        const book = localBooks.find(b => b.id === current.book.id);
        if (book && Array.isArray(book.chapters)) {
          const prevIdx = (typeof current.chapterIdx === 'number' ? current.chapterIdx : 1) - 1;
          if (prevIdx >= 0) {
            const prevChap = book.chapters[prevIdx];
            const { title: transTitle, text: transContent } = await ensureVietnameseText(
              prevChap.title,
              prevChap.content
            );
            const contentToPlay = transContent || prevChap.content;
            const titleToPlay = transTitle || prevChap.title;

            await saveLocalBookToDB({ ...book, lastReadChapterIdx: prevIdx });

            setActiveAudioObj({
              ...current,
              title: titleToPlay,
              title_vietphrase: titleToPlay,
              currentChapterTitle: titleToPlay,
              description: contentToPlay,
              chapterIdx: prevIdx,
              startSentenceIdx: 0,
              paragraphs: contentToPlay.split(/\n+/),
              isChapter: true,
              playType: 'offline'
            });

            window.dispatchEvent(new CustomEvent('local-chapter-changed', {
              detail: { bookId: book.id, chapterIdx: prevIdx }
            }));
            return;
          }
        }
      } catch (err) {
        console.error('Lỗi lùi chương offline:', err);
      }
    }

    if ((playType === 'online' || !playType) && current.book?.id) {
      const bookId = current.book.id;
      const curIdx = typeof current.chapterIdx === 'number' ? current.chapterIdx : 1;
      const prevIdx = curIdx - 1;

      if (prevIdx >= 1) {
        try {
          const chapRes = await api.get('/api/chapter/content', {
            params: { book_id: bookId, chapter_idx: prevIdx }
          });

          if (chapRes.data && (chapRes.data.content || chapRes.data.raw_chinese || chapRes.data.translated_content)) {
            const rawTitle = chapRes.data.title || `Chương ${prevIdx}`;
            const rawText = chapRes.data.translated_content || chapRes.data.content || chapRes.data.raw_chinese || '';

            const { title: transTitle, text: transContent } = await ensureVietnameseText(rawTitle, rawText);
            const contentToPlay = transContent || rawText;
            const titleToPlay = transTitle || rawTitle;

            setActiveAudioObj({
              ...current,
              title: titleToPlay,
              title_vietphrase: titleToPlay,
              currentChapterTitle: titleToPlay,
              description: contentToPlay,
              chapterIdx: prevIdx,
              startSentenceIdx: 0,
              paragraphs: contentToPlay.split(/\n+/),
              isChapter: true,
              playType: 'online'
            });

            window.dispatchEvent(new CustomEvent('global-chapter-changed', {
              detail: { bookId, chapterIdx: prevIdx, chapterTitle: titleToPlay }
            }));
            return;
          }
        } catch (err) {
          console.error('Lỗi lùi chương online:', err);
        }
      }
    }

    if (targetTabId) {
      sendWebviewMessage(targetTabId, { action: 'TRIGGER_PREV' });
    }
  }, [activeAudioObjRef, setActiveAudioObj, sendWebviewMessage]);

  return { handleGlobalNextChapter, handleGlobalPrevChapter };
}
