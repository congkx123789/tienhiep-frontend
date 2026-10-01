export interface ParsedSource {
  site: string;
  url: string;
}

export interface BookInfo {
  id: number;
  title: string;
  title_hanviet?: string;
  title_vietphrase?: string;
  author?: string;
  author_hanviet?: string;
  author_english?: string;
  description?: string;
  description_vietphrase?: string;
  description_english?: string;
  cover?: string;
  categories?: string;
  categories_vietphrase?: string;
  categories_english?: string;
  urls?: string;
  word_count_max?: number;
  parsed_sources?: { source: string; url: string }[];
}

export interface ChapterItem {
  id: number;
  title: string;
  url_idx: number;
}

export interface CommentItem {
  id: number;
  user: string;
  avatar: string;
  rating: number;
  text: string;
  time: string;
  likes: number;
}
