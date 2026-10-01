// Master BrowserProvider and useBrowser hook
import React, { createContext, useContext, useCallback } from 'react';
import { useTabManager } from './useTabManager';
import { useBrowserAudio } from './useBrowserAudio';
import { useWebviewSync } from './useWebviewSync';
import { BrowserHeader, BrowserViewports, BrowserModals } from './components';

export const BrowserContext = createContext<any>(null);
export const useBrowser = () => useContext(BrowserContext);

export const BrowserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tabManager = useTabManager();
  const {
    tabs, setTabs,
    activeTabId, setActiveTabId,
    activeTab,
    urlInput, setUrlInput,
    isTabSwitcherOpen, setIsTabSwitcherOpen,
    isTabConfigOpen, setIsTabConfigOpen,
    isBookmarksOpen, setIsBookmarksOpen,
    bookmarks, history,
    openNewTab, openInBrowser, closeTab, closeOtherTabs, closeAll,
    addToHistory, addBookmark, removeBookmark, translateAllTabTitles
  } = tabManager;

  const audioController = useBrowserAudio(tabs, setTabs);
  const {
    activeAudioObj,
    sendWebviewMessage,
    handleGlobalNextChapter,
    handleGlobalPrevChapter,
    startAudioFromContent,
    stopAudio
  } = audioController;

  const webviewSync = useWebviewSync(
    tabs,
    setTabs,
    activeTabId,
    sendWebviewMessage,
    startAudioFromContent,
    addToHistory
  );
  const {
    autoStates,
    toastInfo, setToastInfo,
    isTranslationSettingsOpen, setIsTranslationSettingsOpen,
    pinnedTools, togglePin,
    handleTool
  } = webviewSync;

  const handleNavigate = useCallback((url: string) => {
    openInBrowser(url);
  }, [openInBrowser]);

  const handleReload = useCallback(() => {
    if (!activeTabId) return;
    const wv = document.getElementById('global-wv-' + activeTabId) as any;
    if (wv) {
      if (wv.tagName?.toLowerCase() === 'iframe') {
        const src = wv.src;
        wv.src = 'about:blank';
        setTimeout(() => { wv.src = src; }, 50);
      } else if (wv.reload) {
        wv.reload();
      }
    }
  }, [activeTabId]);

  const contextValue = {
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    openInBrowser,
    openNewTab,
    closeTab,
    closeAll,
    bookmarks,
    addBookmark,
    removeBookmark,
    history,
    addToHistory,
    autoStates,
    handleTool,
    activeAudioObj,
    startAudioFromContent,
    stopAudio,
    sendWebviewMessage
  };

  return (
    <BrowserContext.Provider value={contextValue}>
      <div className="flex flex-col w-full h-full overflow-hidden bg-slate-950">
        <BrowserHeader
          activeTab={activeTab}
          tabsCount={tabs.length}
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          onNavigate={handleNavigate}
          onReload={handleReload}
          onOpenTabSwitcher={() => setIsTabSwitcherOpen(true)}
          onOpenTabConfig={() => setIsTabConfigOpen(true)}
          onOpenSettings={() => setIsTranslationSettingsOpen(true)}
          onTool={(toolId) => handleTool(toolId, activeTabId)}
          autoTranslateActive={!!autoStates[activeTabId]}
          pinnedTools={pinnedTools}
        />

        <BrowserViewports
          tabs={tabs}
          activeTabId={activeTabId}
          onNavigate={handleNavigate}
          onOpenBookmarks={() => setIsBookmarksOpen(true)}
          bookmarksCount={bookmarks.length}
        />

        <BrowserModals
          tabs={tabs}
          activeTabId={activeTabId}
          setActiveTabId={setActiveTabId}
          isTabConfigOpen={isTabConfigOpen}
          setIsTabConfigOpen={setIsTabConfigOpen}
          isTabSwitcherOpen={isTabSwitcherOpen}
          setIsTabSwitcherOpen={setIsTabSwitcherOpen}
          isBookmarksOpen={isBookmarksOpen}
          setIsBookmarksOpen={setIsBookmarksOpen}
          isTranslationSettingsOpen={isTranslationSettingsOpen}
          setIsTranslationSettingsOpen={setIsTranslationSettingsOpen}
          bookmarks={bookmarks}
          history={history}
          toastInfo={toastInfo}
          setToastInfo={setToastInfo}
          activeAudioObj={activeAudioObj}
          onCloseAudio={stopAudio}
          onNextChapter={handleGlobalNextChapter}
          onPrevChapter={handleGlobalPrevChapter}
          openNewTab={openNewTab}
          closeTab={closeTab}
          closeOtherTabs={closeOtherTabs}
          closeAll={closeAll}
          translateAllTabTitles={translateAllTabTitles}
          onNavigate={handleNavigate}
          onTool={(toolId) => handleTool(toolId, activeTabId)}
          autoTranslateActive={!!autoStates[activeTabId]}
          pinnedTools={pinnedTools}
          togglePin={togglePin}
          removeBookmark={removeBookmark}
        />

        {children}
      </div>
    </BrowserContext.Provider>
  );
};

export * from './BrowserContext.types';
export * from './browserHelpers';
export * from './useTabManager';
export * from './useBrowserAudio';
export * from './useWebviewSync';
