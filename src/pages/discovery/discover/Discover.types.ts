export interface HeroBook {
  id: number;
  title: string;
  title_vietphrase: string;
  author: string;
  author_hanviet: string;
  categories: string;
  cover: string;
  description: string;
  urls?: any[];
}

export interface CommentItem {
  id: number;
  user: string;
  avatar: string;
  source: string;
  comment: string;
  time: string;
}

export interface LeaderboardItem {
  id: number;
  title: string;
  author: string;
  trend: 'up' | 'down' | 'none';
  diff: number;
}

export interface StatsState {
  total: number;
  duplicates: number;
}
