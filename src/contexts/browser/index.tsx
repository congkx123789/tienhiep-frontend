import React, { createContext, useContext, useCallback, useState } from 'react';
import { useTabManager } from './useTabManager';
import { useBrowserAudio } from './useBrowserAudio';
import { useWebviewSync } from './useWebviewSync';
import { BrowserHeader, BrowserViewports, BrowserModals } from './components';
import ReaderQuickTools from '../../components/reader/ReaderQuickTools';
import { ParagraphContextMenu } from '../../pages/reader/local-reader/components/ParagraphContextMenu';
import { isElectron, isNativeApp } from '../../utils/electron';

export const BrowserContext = createContext<any>(null);
export const useBrowser = () => useContext(BrowserContext) || {};

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
    addToHistory, addBookmark, removeBookmark, translateAllTabTitles,
    toggleDesktopMode, toggleDirectMode
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
    addToHistory,
    stopAudio,
    activeAudioObj,
    openNewTab
  );
  const {
    autoStates,
    toastInfo, setToastInfo,
    isTranslationSettingsOpen, setIsTranslationSettingsOpen,
    paragraphMenu, setParagraphMenu,
    pinnedTools, togglePin,
    handleTool
  } = webviewSync;

  const handleNavigate = useCallback((url: string) => {
    openInBrowser(url);
  }, [openInBrowser]);

  const handleReload = useCallback(() => {
    if (!activeTabId) return;
    setTabs(prev => prev.map(t => t.id === activeTabId ? {
      ...t,
      refreshKey: (t.refreshKey || 0) + 1,
      isLoading: true
    } : t));
    sendWebviewMessage(activeTabId, { action: 'RELOAD_PAGE' });
  }, [activeTabId, setTabs, sendWebviewMessage]);

  const handleNavigateBack = useCallback(() => {
    if (!activeTabId) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.historyStack && (tab.historyIndex ?? 0) > 0) {
      const newIdx = (tab.historyIndex ?? 0) - 1;
      const prevUrl = tab.historyStack[newIdx];
      setTabs(prev => prev.map(t => t.id === activeTabId ? {
        ...t,
        url: prevUrl,
        initialUrl: prevUrl,
        historyIndex: newIdx,
        canGoBack: newIdx > 0,
        canGoForward: true,
        isLoading: true
      } : t));
      return;
    }
    sendWebviewMessage(activeTabId, { action: 'NAVIGATE_BACK' });
    const wv = document.getElementById('global-wv-' + activeTabId) as any;
    if (wv && wv.contentWindow) {
      try { wv.contentWindow.history.back(); } catch (e) {}
    }
  }, [activeTabId, tabs, setTabs, sendWebviewMessage]);

  const handleNavigateForward = useCallback(() => {
    if (!activeTabId) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.historyStack && (tab.historyIndex ?? 0) < tab.historyStack.length - 1) {
      const newIdx = (tab.historyIndex ?? 0) + 1;
      const nextUrl = tab.historyStack[newIdx];
      setTabs(prev => prev.map(t => t.id === activeTabId ? {
        ...t,
        url: nextUrl,
        initialUrl: nextUrl,
        historyIndex: newIdx,
        canGoBack: true,
        canGoForward: newIdx < (t.historyStack?.length ?? 1) - 1,
        isLoading: true
      } : t));
      return;
    }
    sendWebviewMessage(activeTabId, { action: 'NAVIGATE_FORWARD' });
    const wv = document.getElementById('global-wv-' + activeTabId) as any;
    if (wv && wv.contentWindow) {
      try { wv.contentWindow.history.forward(); } catch (e) {}
    }
  }, [activeTabId, tabs, setTabs, sendWebviewMessage]);

  const [isVisible, setIsVisible] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const handleOpenInBrowser = useCallback((targetUrl: string, inNewTab: boolean = false, isPrivate: boolean = false) => {
    if (!isNativeApp) {
      // Trên Web thông thường: Không có chế độ trình duyệt nhúng, mở trực tiếp ra New Tab trình duyệt
      if (targetUrl && targetUrl !== 'about:newtab') {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    // Trên Native App (Electron, Android, iOS): Sử dụng trình duyệt nội bộ tích hợp
    setIsVisible(true);
    openInBrowser(targetUrl, inNewTab, isPrivate);
  }, [openInBrowser]);

  const handleOpenNewTab = useCallback((isPrivate: boolean = false, initialUrl: string = 'about:newtab') => {
    if (!isNativeApp) {
      if (initialUrl && initialUrl !== 'about:newtab') {
        window.open(initialUrl, '_blank', 'noopener,noreferrer');
      }
      return '';
    }
    setIsVisible(true);
    return openNewTab(isPrivate, initialUrl);
  }, [openNewTab]);

  const contextValue = {
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    openInBrowser: handleOpenInBrowser,
    openNewTab: handleOpenNewTab,
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
    sendWebviewMessage,
    isVisible,
    setIsVisible,
    isNavMenuOpen,
    setIsNavMenuOpen
  };

  return (
    <BrowserContext.Provider value={contextValue}>
      <div className="w-full min-h-screen bg-[#0b0b14] flex flex-col">
        {isNativeApp && isVisible && (
          <div
            className="fixed top-14 inset-x-0 bottom-0 z-[100] flex flex-col w-full overflow-hidden bg-slate-950 animate-fade-in"
            style={isElectron ? { WebkitAppRegion: 'no-drag' } as any : {}}
          >
            <BrowserHeader
              activeTab={activeTab}
              tabsCount={tabs.length}
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
              autoTranslateActive={!!autoStates[activeTabId]}
              pinnedTools={pinnedTools}
              isDesktopMode={activeTab?.isDesktopMode}
              onToggleDesktopMode={() => toggleDesktopMode(activeTabId)}
              isDirectMode={activeTab?.isDirectMode}
              onToggleDirectMode={() => toggleDirectMode(activeTabId)}
              onCloseBrowser={() => setIsVisible(false)}
              onOpenNavMenu={() => setIsNavMenuOpen(true)}
            />

            <BrowserViewports
              tabs={tabs}
              activeTabId={activeTabId}
              onNavigate={handleNavigate}
              onOpenBookmarks={() => setIsBookmarksOpen(true)}
              bookmarksCount={bookmarks.length}
              onTabLoaded={(tabId) => {
                setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isLoading: false } : t));
              }}
            />

            {activeTab && activeTab.url && activeTab.url !== 'about:newtab' && (
              <ReaderQuickTools
                onToolAction={(action: string, payload?: any) => handleTool(action, activeTabId, payload)}
                isAudioPlaying={!!activeAudioObj}
                isAutoTranslateActive={!!autoStates[activeTabId]}
              />
            )}

          </div>
        )}

        <div className="w-full flex-1 flex flex-col">
          {children}
        </div>

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
          openNewTab={handleOpenNewTab}
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
      </div>
    </BrowserContext.Provider>
  );
};

export * from './BrowserContext.types';
export * from './browserHelpers';
export * from './useTabManager';
export * from './useBrowserAudio';
export * from './useWebviewSync';
