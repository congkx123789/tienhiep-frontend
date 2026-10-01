export interface BookshelfBook {
  id: number | string;
  book_id?: number;
  title: string;
  title_vietphrase?: string;
  author?: string;
  author_hanviet?: string;
  cover?: string;
  url?: string;
  site_count?: number;
  description?: string;
  last_chapter?: string;
  updated_at?: string;
}

export interface ComparisonDetail {
  title?: string;
  desc?: string;
}

export interface ComparisonData {
  fast: ComparisonDetail;
  advanced: ComparisonDetail;
  vietphrase: ComparisonDetail;
  hanviet: ComparisonDetail;
}
