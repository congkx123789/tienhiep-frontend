export interface LocalChapter {
  id?: number | string;
  title: string;
  content: string;
}

export interface LocalBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  chapters: LocalChapter[];
  totalChapters: number;
  addedAt: number;
  lastReadChapterIdx?: number;
  lastReadAt?: number;
}

export interface StorageInfo {
  usage: string;
  quota: string;
}
