import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReaderLayout from '../../../layouts/ReaderLayout';
import { useReaderSettings } from '../../../contexts/ReaderSettingsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import { useBrowser } from '../../../contexts/BrowserContext';
import { useUsageTracker } from '../../../hooks/useUsageTracker';
import { Loader } from 'lucide-react';
import { useReaderChapter } from './useReaderChapter';
import { useReaderTtsSync } from './useReaderTtsSync';
import { ReaderSourcesBar } from './components/ReaderSourcesBar';
import { ReaderContent } from './components/ReaderContent';
import { ReaderBottomNav } from './components/ReaderBottomNav';
import { SourceItem } from './Reader.types';

export default function Reader() {
  const { bookId, chapterIdx } = useParams<{ bookId: string; chapterIdx: string }>();
  const navigate = useNavigate();
  const { theme, fontSize, fontFamily, lineHeight } = useReaderSettings();
  const { user } = useAuth();
  const { t } = useLang();
  const { openInBrowser, activeAudioObj, setActiveAudioObj } = useBrowser();

  useUsageTracker('web', 'read');

  const {
    bookTitle,
    chapterTitle,
    chaptersList,
    content,
    loading,
    translating,
    bookDetails
  } = useReaderChapter({
    bookId,
    chapterIdx,
    user,
    t,
    activeAudioObj,
    setActiveAudioObj
  });

  const {
    autoScrollTts,
    handleToggleAutoScroll,
    isCurrentChapterPlaying,
    currentSpokenCharIdx,
    currentSpokenSentenceId,
    audioSpeed,
    getReadingTime,
    handleTTSPlay
  } = useReaderTtsSync({
    bookId,
    chapterIdx,
    bookTitle,
    chapterTitle,
    content,
    activeAudioObj,
    setActiveAudioObj
  });

  const defaultSourceNames = useMemo(() => [
    { name: 'Ixdzs', isChinese: true },
    { name: 'Biquge', isChinese: true },
    { name: '41nr', isChinese: true },
    { name: 'Quanben', isChinese: true },
    { name: 'Hjwzw', isChinese: true },
    { name: 'Fanqie', isChinese: true },
    { name: 'Metruyenchu', isChinese: false },
    { name: 'TruyenFull', isChinese: false },
    { name: 'Vcomi', isChinese: false }
  ], []);

  const allSourcesToRender: SourceItem[] = useMemo(() => {
    const parsedSources = bookDetails?.parsed_sources || [];
    return defaultSourceNames.map(ds => {
      const found = parsedSources.find((u: any) => u.source?.toLowerCase() === ds.name.toLowerCase());
      return {
        site: found ? found.source : ds.name,
        url: found ? found.url : null,
        isSearch: !found,
        isChinese: ds.isChinese
      };
    });
  }, [bookDetails, defaultSourceNames]);

  const handleParagraphDoubleClick = (pIdx: number, text: string) => {
    const paragraphs = content.split(/\n+/);
    const validTextRegex = /\p{L}|\p{N}/u;
    let sentenceCountBefore = chapterTitle ? 1 : 0;
    for (let pi = 0; pi < pIdx && pi < paragraphs.length; pi++) {
      const p = paragraphs[pi].trim();
      if (!p) continue;
      const parts = p.split(/([.!?。！？]+["”'’」]?\s*)/);
      let cur = "";
      for (let i = 0; i < parts.length; i++) {
        cur += parts[i];
        if (/[.!?。！？]/.test(parts[i]) || cur.length > 250) {
          if (cur.trim() && validTextRegex.test(cur.trim())) {
            sentenceCountBefore++;
          }
          cur = "";
        }
      }
      if (cur.trim() && validTextRegex.test(cur.trim())) {
        sentenceCountBefore++;
      }
    }

    setActiveAudioObj({
      title_vietphrase: chapterTitle,
      author_hanviet: bookTitle,
      description: content,
      isChapter: true,
      startSentenceIdx: sentenceCountBefore,
      startSnippet: text ? text.trim().slice(0, 40) : '',
      startParaIdx: pIdx,
      paragraphs: paragraphs,
      book: { id: bookId, title: bookTitle, title_vietphrase: bookTitle },
      chapterIdx: parseInt(chapterIdx || '1'),
      playType: 'online'
    });
  };

  const readingTime = getReadingTime();
  const currChap = parseInt(chapterIdx || '1');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b14] flex flex-col items-center justify-center text-slate-500">
        <Loader className="w-8 h-8 animate-spin text-brand-500 mb-3" />
        <span>{t.reader?.loadingChapter || "Đang tải chương truyện..."}</span>
      </div>
    );
  }

  const isPlayingTitle = isCurrentChapterPlaying && (currentSpokenSentenceId === 0 || currentSpokenCharIdx < (chapterTitle.length + 2));

  return (
    <ReaderLayout
      bookTitle={bookTitle}
      currentChapter={chapterTitle}
      chaptersList={chaptersList}
      onSelectChapter={(chap: any) => navigate(`/book/${bookId}/read/${chap.url_idx}`)}
    >
      <div className="space-y-8">
        <ReaderSourcesBar
          allSourcesToRender={allSourcesToRender}
          isCurrentChapterPlaying={isCurrentChapterPlaying}
          activeAudioObj={activeAudioObj}
          bookId={bookId}
          chapterIdx={chapterIdx}
          bookTitle={bookTitle}
          bookDetails={bookDetails}
          autoScrollTts={autoScrollTts}
          onToggleAutoScroll={handleToggleAutoScroll}
          onTTSPlay={handleTTSPlay}
          openInBrowser={openInBrowser}
          t={t}
        />

        <h2
          id="s-0"
          data-sid="0"
          className={`text-xl md:text-2xl font-black mb-2 border-b border-slate-500/10 pb-4 text-center transition-all duration-300 ${
            isPlayingTitle ? 'text-amber-400 bg-amber-500/15 py-1.5 px-4 rounded-xl shadow-lg ring-1 ring-amber-400/40' : ''
          }`}
        >
          {chapterTitle}
        </h2>

        {readingTime && (
          <div className="text-center text-[10px] text-slate-400 mb-6 flex justify-center items-center gap-2">
            <span>⏱️ Thời gian đọc: ~{readingTime.minutes} phút {readingTime.seconds} giây (tốc độ {audioSpeed.toFixed(1)}x)</span>
            <span>•</span>
            <span>📝 {readingTime.wordCount} từ</span>
          </div>
        )}

        {translating && (
          <div className="text-slate-400 text-xs text-center py-2 animate-pulse">
            {t.comparingText || "Đang đồng bộ hóa bản dịch..."}
          </div>
        )}

        <ReaderContent
          content={content}
          chapterTitle={chapterTitle}
          fontSize={fontSize}
          fontFamily={fontFamily}
          lineHeight={lineHeight}
          isCurrentChapterPlaying={isCurrentChapterPlaying}
          currentSpokenSentenceId={currentSpokenSentenceId}
          onParagraphDoubleClick={handleParagraphDoubleClick}
        />

        <ReaderBottomNav
          chapterIdx={currChap}
          onPrevChapter={() => currChap > 1 && navigate(`/book/${bookId}/read/${currChap - 1}`)}
          onNextChapter={() => currChap < 50 && navigate(`/book/${bookId}/read/${currChap + 1}`)}
          t={t}
        />
      </div>
    </ReaderLayout>
  );
}
