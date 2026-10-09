// Browser Context Types
export interface BrowserTab {
  id: string;
  url: string;
  initialUrl?: string;
  title: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isPrivate?: boolean;
  favicon?: string;
  lastAccessed?: number;
  historyStack?: string[];
  historyIndex?: number;
  refreshKey?: number;
  isDesktopMode?: boolean;
  isDirectMode?: boolean;
}

export interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitedAt: number;
}

export interface ToastInfo {
  message: string;
  type?: 'info' | 'warning' | 'success';
}

export interface ActiveAudioBook {
  title?: string;
  title_vietphrase?: string;
  author?: string;
  author_hanviet?: string;
  cover?: string;
  sourceUrl?: string;
  tabId?: string;
  currentChapterTitle?: string;
  currentChapterContent?: string;
  initialParaIdx?: number;
  startParaIdx?: number;
  startSentenceIdx?: number;
  startSnippet?: string;
  isChapter?: boolean;
  description?: string;
  chapterIdx?: number;
  paragraphs?: string[];
  playType?: 'online' | 'offline' | 'webview';
  book?: {
    id: number | string;
    title?: string;
    title_vietphrase?: string;
    author?: string;
    author_hanviet?: string;
    cover?: string;
    chapters_max?: number;
    onBoundary?: (charIdx: number, sentenceText: string, sentenceId: number) => void;
    granularity?: number;
    tocLevel?: number;
    anchorSnippet?: string;
    playType?: 'online' | 'offline' | 'webview';
  };
}

export interface BrowserContextValue {
  tabs: BrowserTab[];
  setTabs: React.Dispatch<React.SetStateAction<BrowserTab[]>>;
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  activeTab: BrowserTab | undefined;
  urlInput: string;
  setUrlInput: (url: string) => void;
  isTabSwitcherOpen: boolean;
  setIsTabSwitcherOpen: (open: boolean) => void;
  isTabConfigOpen: boolean;
  setIsTabConfigOpen: (open: boolean) => void;
  isBookmarksOpen: boolean;
  setIsBookmarksOpen: (open: boolean) => void;
  bookmarks: BookmarkItem[];
  addBookmark: (url: string, title: string) => void;
  removeBookmark: (bookmarkId: string) => void;
  history: HistoryItem[];
  addToHistory: (url: string, title?: string) => void;
  clearBrowserHistory: () => void;
  deleteBrowserHistoryItem: (id: string) => void;
  openInBrowser: (targetUrl: string, inNewTab?: boolean, isPrivate?: boolean) => void;
  openNewTab: (isPrivate?: boolean, initialUrl?: string) => string;
  handleOpenNewTab: (isPrivate?: boolean, initialUrl?: string) => string;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (keepTabId: string) => void;
  closeAll: () => void;
  navigateTab: (tabId: string, url: string) => void;
  navigateTabBack: (tabId: string) => string | undefined;
  navigateTabForward: (tabId: string) => string | undefined;
  reloadTab: (tabId: string) => void;
  translateAllTabTitles: () => Promise<void>;
  toggleDesktopMode: (tabId?: string) => void;
  toggleDirectMode: (tabId?: string) => void;
  handleNavigate: (url: string) => void;
  handleNavigateBack: () => void;
  handleNavigateForward: () => void;
  handleReload: () => void;
  autoStates: Record<string, boolean>;
  toastInfo: ToastInfo | null;
  setToastInfo: React.Dispatch<React.SetStateAction<ToastInfo | null>>;
  isTranslationSettingsOpen: boolean;
  setIsTranslationSettingsOpen: (open: boolean) => void;
  paragraphMenu: any;
  setParagraphMenu: any;
  pinnedTools: string[];
  togglePin: (toolId: string) => void;
  handleTool: (toolId: string, tabId: string, payload?: any) => void;
  sendWebviewMessage: (tabId: string, payload: any) => void;
  activeAudioObj: ActiveAudioBook | null;
  setActiveAudioObj: React.Dispatch<React.SetStateAction<ActiveAudioBook | null>>;
  startAudioFromContent: (tabId: string, rawTitle: string, rawText: string, initialParaIdx?: number) => Promise<void>;
  stopAudio: (tabId?: string) => void;
  handleGlobalNextChapter: (tabId?: string) => Promise<void>;
  handleGlobalPrevChapter: (tabId?: string) => Promise<void>;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  isNavMenuOpen: boolean;
  setIsNavMenuOpen: (open: boolean) => void;
}
