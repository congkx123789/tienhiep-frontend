import React from 'react';
import { useBrowser } from '../../contexts/BrowserContext';
import { isElectron, isNativeApp } from '../../utils/electron';
import { BrowserHeader } from '../../components/browser/BrowserHeader';
import { BrowserViewports } from '../../components/browser/BrowserViewports';
import { BrowserModals } from './BrowserModals';
import { ReaderQuickTools } from '../../components/reader';

export const BrowserOverlay: React.FC = () => {
  const browser = useBrowser();

  const {
    tabs, setTabs, activeTabId, setActiveTabId, activeTab,
    urlInput, setUrlInput, isTabSwitcherOpen, setIsTabSwitcherOpen,
    isTabConfigOpen, setIsTabConfigOpen, isBookmarksOpen, setIsBookmarksOpen,
    bookmarks, history, autoStates, isTranslationSettingsOpen,
    setIsTranslationSettingsOpen, pinnedTools, togglePin, handleTool,
    activeAudioObj, handleGlobalNextChapter, handleGlobalPrevChapter,
    stopAudio, isVisible, setIsVisible, setIsNavMenuOpen,
    handleNavigate, handleNavigateBack, handleNavigateForward,
    handleReload, toggleDesktopMode, toggleDirectMode,
    handleOpenNewTab, closeTab, closeOtherTabs, closeAll,
    translateAllTabTitles, removeBookmark, toastInfo, setToastInfo
  } = browser;

  return (
    <>
      {isVisible && (
        <div
          className="fixed inset-0 z-[200000] flex flex-col w-full h-full overflow-hidden bg-slate-950 animate-fade-in"
          style={isElectron ? { WebkitAppRegion: 'no-drag' } as any : {}}
        >
          <BrowserHeader
            activeTab={activeTab}
            tabsCount={tabs?.length || 0}
            urlInput={urlInput}
            setUrlInput={setUrlInput}
            onNavigate={handleNavigate}
            onNavigateBack={handleNavigateBack}
            onNavigateForward={handleNavigateForward}
            onReload={handleReload}
            onOpenTabSwitcher={() => setIsTabSwitcherOpen(true)}
            onOpenTabConfig={() => setIsTabConfigOpen(true)}
            onOpenSettings={() => setIsTranslationSettingsOpen(true)}
            onTool={(toolId) => handleTool(toolId, activeTabId)}
            autoTranslateActive={!!autoStates?.[activeTabId]}
            pinnedTools={pinnedTools || []}
            isDesktopMode={activeTab?.isDesktopMode}
            onToggleDesktopMode={() => toggleDesktopMode(activeTabId)}
            isDirectMode={activeTab?.isDirectMode}
            onToggleDirectMode={() => toggleDirectMode(activeTabId)}
            onCloseBrowser={() => setIsVisible(false)}
            onOpenNavMenu={() => setIsNavMenuOpen(true)}
          />

          <BrowserViewports
            tabs={tabs || []}
            activeTabId={activeTabId}
            onNavigate={handleNavigate}
            onOpenBookmarks={() => setIsBookmarksOpen(true)}
            bookmarksCount={bookmarks?.length || 0}
            onTabLoaded={(tabId) => {
              setTabs?.((prev: any[]) => prev.map(t => t.id === tabId ? { ...t, isLoading: false } : t));
            }}
            onToggleDirectMode={() => toggleDirectMode(activeTabId)}
            onReloadTab={(tabId) => {
              setTabs?.((prev: any[]) => prev.map(t => t.id === tabId ? { ...t, refreshKey: (t.refreshKey || 0) + 1, isLoading: true } : t));
            }}
          />

          {activeTab && activeTab.url && activeTab.url !== 'about:newtab' && (
            <ReaderQuickTools
              onToolAction={(action: string, payload?: any) => handleTool(action, activeTabId, payload)}
              isAudioPlaying={!!activeAudioObj}
              isAutoTranslateActive={!!autoStates?.[activeTabId]}
            />
          )}
        </div>
      )}

      <BrowserModals
        tabs={tabs || []}
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
        bookmarks={bookmarks || []}
        history={history || []}
        toastInfo={toastInfo}
        setToastInfo={setToastInfo}
        activeAudioObj={activeAudioObj}
        onCloseAudio={stopAudio}
        onNextChapter={handleGlobalNextChapter}
        onPrevChapter={handleGlobalPrevChapter}
        openNewTab={handleOpenNewTab}
        closeTab={closeTab}
        closeOtherTabs={closeOtherTabs}
        closeAll={closeAll}
        translateAllTabTitles={translateAllTabTitles}
        onNavigate={handleNavigate}
        onTool={(toolId) => handleTool(toolId, activeTabId)}
        autoTranslateActive={!!autoStates?.[activeTabId]}
        pinnedTools={pinnedTools || []}
        togglePin={togglePin}
        removeBookmark={removeBookmark}
      />
    </>
  );
};
