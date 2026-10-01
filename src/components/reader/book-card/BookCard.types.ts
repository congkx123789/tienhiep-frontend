/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  BookCard.types.ts
 * ═════════════════════════════════════════════════════════════════════════════
 */

export interface BookItem {
  id: string | number;
  title?: string;
  title_vietphrase?: string;
  title_hanviet?: string;
  author?: string;
  author_english?: string;
  author_hanviet?: string;
  description?: string;
  description_english?: string;
  description_vietphrase?: string;
  cover?: string;
  categories?: string;
  categories_english?: string;
  categories_vietphrase?: string;
  site_count?: number;
  word_count_max?: number;
  chapters_max?: number;
  urls?: string;
  [key: string]: any;
}

export interface BookCardProps {
  book: BookItem;
  isFav?: boolean;
  onToggleFav?: (id: string | number) => void;
  onCompare?: (id: string | number) => void;
  onRead?: (book: BookItem) => void;
  onPlayTrailer?: (book: BookItem) => void;
  onSearchAuthor?: (author: string) => void;
  onSearchCategory?: (cat: string) => void;
}
