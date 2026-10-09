import React, { createContext, useContext, useCallback, useState } from 'react';
import { useTabManager } from './useTabManager';
import { useBrowserAudio } from './useBrowserAudio';
import { useWebviewSync } from './useWebviewSync';
import { BrowserContextValue } from './BrowserContext.types';

export const BrowserContext = createContext<BrowserContextValue | null>(null);
export const useBrowser = () => useContext(BrowserContext) as BrowserContextValue || ({} as BrowserContextValue);

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
    navigateTab, navigateTabBack, navigateTabForward, reloadTab,
    addToHistory, clearBrowserHistory, deleteBrowserHistoryItem,
    addBookmark, removeBookmark, translateAllTabTitles,
    toggleDesktopMode, toggleDirectMode
  } = tabManager;

  const audioController = useBrowserAudio(tabs, setTabs);
  const {
    activeAudioObj,
    setActiveAudioObj,
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
    openNewTab,
    navigateTab,
    setUrlInput
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
    reloadTab(activeTabId);
    sendWebviewMessage(activeTabId, { action: 'RELOAD_PAGE' });
  }, [activeTabId, reloadTab, sendWebviewMessage]);

  const handleNavigateBack = useCallback(() => {
    if (!activeTabId) return;
    const targetUrl = navigateTabBack(activeTabId);
    if (!targetUrl) {
      sendWebviewMessage(activeTabId, { action: 'NAVIGATE_BACK' });
      const wv = document.getElementById('global-wv-' + activeTabId) as any;
      if (wv && wv.contentWindow) {
        try { wv.contentWindow.history.back(); } catch (e) {}
      }
    }
  }, [activeTabId, navigateTabBack, sendWebviewMessage]);

  const handleNavigateForward = useCallback(() => {
    if (!activeTabId) return;
    const targetUrl = navigateTabForward(activeTabId);
    if (!targetUrl) {
      sendWebviewMessage(activeTabId, { action: 'NAVIGATE_FORWARD' });
      const wv = document.getElementById('global-wv-' + activeTabId) as any;
      if (wv && wv.contentWindow) {
        try { wv.contentWindow.history.forward(); } catch (e) {}
      }
    }
  }, [activeTabId, navigateTabForward, sendWebviewMessage]);

  const [isVisible, setIsVisible] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const handleOpenInBrowser = useCallback((targetUrl: string, inNewTab: boolean = false, isPrivate: boolean = false) => {
    setIsVisible(true);
    openInBrowser(targetUrl, inNewTab, isPrivate);
  }, [openInBrowser]);

  const handleOpenNewTab = useCallback((isPrivate: boolean = false, initialUrl: string = 'about:newtab') => {
    setIsVisible(true);
    return openNewTab(isPrivate, initialUrl);
  }, [openNewTab]);

  React.useEffect(() => {
    const handleEvent = (e: any) => {
      const url = e.detail?.url;
      if (url) {
        setIsVisible(true);
        openInBrowser(url, e.detail?.inNewTab || false, e.detail?.isPrivate || false);
      }
    };
    window.addEventListener('open-in-browser', handleEvent);
    return () => window.removeEventListener('open-in-browser', handleEvent);
  }, [openInBrowser]);

  const contextValue: BrowserContextValue = {
    // Tabs & State
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    activeTab,
    urlInput,
    setUrlInput,
    isTabSwitcherOpen,
    setIsTabSwitcherOpen,
    isTabConfigOpen,
    setIsTabConfigOpen,
    isBookmarksOpen,
    setIsBookmarksOpen,
    bookmarks,
    addBookmark,
    removeBookmark,
    history,
    addToHistory,
    clearBrowserHistory,
    deleteBrowserHistoryItem,

    // Actions & Navigation
    openInBrowser: handleOpenInBrowser,
    openNewTab: handleOpenNewTab,
    handleOpenNewTab,
    closeTab,
    closeOtherTabs,
    closeAll,
    navigateTab,
    navigateTabBack,
    navigateTabForward,
    reloadTab,
    translateAllTabTitles,
    toggleDesktopMode,
    toggleDirectMode,
    handleNavigate,
    handleNavigateBack,
    handleNavigateForward,
    handleReload,

    // Webview Sync & Tools
    autoStates,
    toastInfo,
    setToastInfo,
    isTranslationSettingsOpen,
    setIsTranslationSettingsOpen,
    paragraphMenu,
    setParagraphMenu,
    pinnedTools,
    togglePin,
    handleTool,
    sendWebviewMessage,

    // Audio & TTS
    activeAudioObj,
    setActiveAudioObj,
    startAudioFromContent,
    stopAudio,
    handleGlobalNextChapter,
    handleGlobalPrevChapter,

    // Visibility & Shell
    isVisible,
    setIsVisible,
    isNavMenuOpen,
    setIsNavMenuOpen
  };

  return (
    <BrowserContext.Provider value={contextValue}>
      {children}
    </BrowserContext.Provider>
  );
};

export * from './BrowserContext.types';
export * from './browserHelpers';
export * from './useTabManager';
export * from './useBrowserAudio';
export * from './useWebviewSync';
