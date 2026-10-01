export interface HistoryBookItem {
  book_id?: number;
  url?: string;
  title: string;
  author: string;
  cover?: string;
  last_chapter?: string;
  read_date?: string;
}

export interface HistoryGroup {
  group_name: string;
  books: HistoryBookItem[];
}

export interface BrowserHistoryItem {
  id: string | number;
  title?: string;
  url: string;
  domain?: string;
  time?: string;
  date?: string;
}
