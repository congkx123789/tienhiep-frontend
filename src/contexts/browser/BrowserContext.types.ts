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
}
