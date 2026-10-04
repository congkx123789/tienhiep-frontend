import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReaderLayout from '../../../layouts/ReaderLayout';
import { useReaderSettings } from '../../../contexts/ReaderSettingsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import { useBrowser } from '../../../contexts/BrowserContext';
import { useUsageTracker } from '../../../hooks/useUsageTracker';
import { Loader } from 'lucide-react';
import { CircularProgress } from '../../../components/common/CircularProgress';
import Footer from '../../../components/common/Footer';
import { ParagraphContextMenu, ParagraphMenuState } from '../local-reader/components/ParagraphContextMenu';
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
    rawContent,
    setContent,
    loading,
    translating,
    loadingProgress,
    bookDetails
  } = useReaderChapter({
    bookId,
    chapterIdx,
    user,
    t,
    activeAudioObj,
    setActiveAudioObj
  });

  React.useEffect(() => {
    const handleChapterChanged = (e: any) => {
      const detail = e.detail;
      if (detail && String(detail.bookId) === String(bookId) && detail.chapterIdx) {
        if (String(detail.chapterIdx) !== String(chapterIdx)) {
          navigate(`/book/${bookId}/read/${detail.chapterIdx}`, { replace: true });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('global-chapter-changed', handleChapterChanged);
    return () => window.removeEventListener('global-chapter-changed', handleChapterChanged);
  }, [bookId, chapterIdx, navigate]);

  const [paragraphMenu, setParagraphMenu] = React.useState<ParagraphMenuState | null>(null);

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

  const rawParagraphs = useMemo(() => {
    return rawContent ? rawContent.split(/\n+/).map(p => p.trim()).filter(Boolean) : [];
  }, [rawContent]);

  const handleParagraphClick = (
    e: React.MouseEvent | { clientX: number; clientY: number },
    pIdx: number,
    translatedText: string
  ) => {
    const rawText = rawParagraphs[pIdx] || translatedText;
    setParagraphMenu({
      pIdx,
      translatedText,
      rawText,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleSaveParagraphEdit = (pIdx: number, newText: string) => {
    const paragraphs = content.split(/\n+/);
    if (paragraphs[pIdx] !== undefined) {
      paragraphs[pIdx] = newText;
      setContent(paragraphs.join('\n\n'));
    }
  };

  const readingTime = getReadingTime();
  const currChap = parseInt(chapterIdx || '1');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b14] flex flex-col items-center justify-center p-6 text-slate-300">
        <div className="p-8 rounded-3xl bg-[#12122b]/80 border border-purple-500/20 shadow-2xl backdrop-blur-xl flex flex-col items-center max-w-sm w-full">
          <CircularProgress
            progress={loadingProgress}
            size={96}
            strokeWidth={7}
            subtitle={translating ? "Đang dịch AI chương truyện..." : (t.reader?.loadingChapter || "Đang tải chương truyện...")}
            detail={bookTitle ? `${bookTitle} • Chương ${currChap}` : undefined}
            gradientStart="#818cf8"
            gradientEnd="#c084fc"
          />
          <div className="mt-4 flex items-center gap-2 text-xs text-purple-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>{translating ? "Đang xử lý phân đoạn câu & từ điển..." : "Đang kết nối máy chủ dữ liệu..."}</span>
          </div>
        </div>
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
      <div className="space-y-8 relative">
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
          className={`text-xl md:text-2xl font-black mb-2 border-b border-slate-500/10 pb-4 text-center transition-all duration-300 ${isPlayingTitle ? 'text-amber-400 bg-amber-500/15 py-1.5 px-4 rounded-xl shadow-lg ring-1 ring-amber-400/40' : ''
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
          onParagraphClick={handleParagraphClick}
          onParagraphDoubleClick={handleParagraphDoubleClick}
        />

        <ReaderBottomNav
          chapterIdx={currChap}
          maxChapters={bookDetails?.chapters_max || chaptersList.length || 50}
          onPrevChapter={() => currChap > 1 && navigate(`/book/${bookId}/read/${currChap - 1}`)}
          onNextChapter={() => currChap < (bookDetails?.chapters_max || chaptersList.length || 50) && navigate(`/book/${bookId}/read/${currChap + 1}`)}
          t={t}
        />

        {/* Footer chân trang */}
        <div className="pt-6">
          <Footer />
        </div>

        {/* Popup menu công cụ đoạn văn: Phát TTS, So sánh song ngữ, Sửa câu, Tra cứu, Báo lỗi, Copy */}
        <ParagraphContextMenu
          menu={paragraphMenu}
          translateMode="cmlm"
          onClose={() => setParagraphMenu(null)}
          onPlayFromHere={handleParagraphDoubleClick}
          onSaveParagraphEdit={handleSaveParagraphEdit}
        />
      </div>
    </ReaderLayout>
  );
}
