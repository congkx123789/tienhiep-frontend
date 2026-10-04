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
  title: string;
  title_vietphrase?: string;
  author?: string;
  author_hanviet?: string;
  cover?: string;
  sourceUrl?: string;
  tabId?: string;
  currentChapterTitle?: string;
  currentChapterContent?: string;
  initialParaIdx?: number;
  startSentenceIdx?: number;
  startSnippet?: string;
  isChapter?: boolean;
  description?: string;
  chapterIdx?: number;
  paragraphs?: string[];
  book?: {
    id: number | string;
    title?: string;
    title_vietphrase?: string;
    author?: string;
    author_hanviet?: string;
    cover?: string;
    chapters_max?: number;
  };
  onBoundary?: (charIdx: number, sentenceText: string, sentenceId: number) => void;
  /** online = web reader (iframe), offline = local epub/file, webview = electron webview */
  playType?: 'online' | 'offline' | 'webview';
}
