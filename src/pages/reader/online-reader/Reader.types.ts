export interface ChapterItem {
  id: number;
  title: string;
  url_idx: number;
  active: boolean;
}

export interface SourceItem {
  site: string;
  url: string | null;
  isSearch: boolean;
  isChinese: boolean;
}

export interface SearchMenuState {
  site: string;
  isChinese: boolean;
}

export interface ReadingTimeInfo {
  minutes: number;
  seconds: number;
  wordCount: number;
}
