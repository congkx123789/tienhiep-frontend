import React, { useState } from 'react';
import MainLayout from '../../../layouts/main';
import { useReaderSettings } from '../../../contexts/ReaderSettingsContext';
import { useLang } from '../../../contexts/LangContext';
import { useBrowser } from '../../../contexts/BrowserContext';
import { useUsageTracker } from '../../../hooks/useUsageTracker';
import { useLocalBooks } from './useLocalBooks';
import { useLocalTtsSync } from './useLocalTtsSync';
import { LocalBookShelf } from './components/LocalBookShelf';
import { LocalReadingView } from './components/LocalReadingView';
import { LocalImportModal } from './components/LocalImportModal';
import { LocalTocDrawer } from './components/LocalTocDrawer';

export default function LocalReader() {
  const { fontSize, fontFamily, lineHeight } = useReaderSettings();
  const { lang } = useLang();
  const { activeAudioObj, setActiveAudioObj } = useBrowser();

  useUsageTracker('web', 'read');

  const [showImportModal, setShowImportModal] = useState(false);
  const [showToc, setShowToc] = useState(false);

  const {
    localBooks,
    activeBook,
    setActiveBook,
    activeChapterIdx,
    setActiveChapterIdx,
    storageInfo,
    isEditMode,
    setIsEditMode,
    selectedBookIds,
    handleSelectBook,
    handleSaveProgress,
    handleDeleteBook,
    handleToggleSelectBook,
    handleSelectAll,
    handleDeleteSelected,
    handleClearAllData,
    loadBooks
  } = useLocalBooks(lang);

  const {
    autoScrollTts,
    handleToggleAutoScroll,
    isCurrentChapterPlaying,
    currentSpokenSentenceId,
    audioSpeed,
    getReadingTime,
    handleTTSPlay,
    handleParagraphDoubleClick
  } = useLocalTtsSync({
    activeBook,
    activeChapterIdx,
    activeAudioObj,
    setActiveAudioObj
  });

  const handlePrevChapter = () => {
    if (!activeBook || activeChapterIdx <= 0) return;
    const nextIdx = activeChapterIdx - 1;
    setActiveChapterIdx(nextIdx);
    handleSaveProgress(activeBook, nextIdx);
  };

  const handleNextChapter = () => {
    if (!activeBook || activeChapterIdx >= activeBook.chapters.length - 1) return;
    const nextIdx = activeChapterIdx + 1;
    setActiveChapterIdx(nextIdx);
    handleSaveProgress(activeBook, nextIdx);
  };

  const readingTime = getReadingTime();

  return (
    <MainLayout hideHeader={Boolean(activeBook)}>
      {!activeBook ? (
        <LocalBookShelf
          localBooks={localBooks}
          storageInfo={storageInfo}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          selectedBookIds={selectedBookIds}
          onToggleSelectBook={handleToggleSelectBook}
          onSelectAll={handleSelectAll}
          onDeleteSelected={handleDeleteSelected}
          onSelectBook={handleSelectBook}
          onDeleteBook={handleDeleteBook}
          onOpenImportModal={() => setShowImportModal(true)}
          onClearAllData={handleClearAllData}
        />
      ) : (
        <LocalReadingView
          activeBook={activeBook}
          activeChapterIdx={activeChapterIdx}
          fontSize={fontSize}
          fontFamily={fontFamily}
          lineHeight={lineHeight}
          isCurrentChapterPlaying={isCurrentChapterPlaying}
          currentSpokenSentenceId={currentSpokenSentenceId}
          autoScrollTts={autoScrollTts}
          audioSpeed={audioSpeed}
          readingTime={readingTime}
          onBackToShelf={() => setActiveBook(null)}
          onOpenToc={() => setShowToc(true)}
          onOpenSettings={() => {}}
          onTTSPlay={handleTTSPlay}
          onToggleAutoScroll={handleToggleAutoScroll}
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
          onParagraphDoubleClick={handleParagraphDoubleClick}
        />
      )}

      <LocalImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(newBook) => {
          loadBooks();
          handleSelectBook(newBook);
        }}
      />

      {activeBook && (
        <LocalTocDrawer
          isOpen={showToc}
          onClose={() => setShowToc(false)}
          activeBook={activeBook}
          activeChapterIdx={activeChapterIdx}
          onSelectChapter={(idx) => {
            setActiveChapterIdx(idx);
            handleSaveProgress(activeBook, idx);
          }}
        />
      )}
    </MainLayout>
  );
}
