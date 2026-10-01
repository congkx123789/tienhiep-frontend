export interface AudioPlayerBook {
  id?: string | number;
  title?: string;
  title_vietphrase?: string;
  author_hanviet?: string;
  author?: string;
  description?: string;
  chapterIdx?: number;
  isChapter?: boolean;
  startSentenceIdx?: number;
  startSnippet?: string;
  startParaIdx?: number;
  paragraphs?: string[];
  book?: {
    id: string | number;
    title?: string;
    title_vietphrase?: string;
  };
  onBoundary?: (charIdx: number, sentenceText: string, sentenceId: number) => void;
  playType?: 'online' | 'offline' | 'webview';
}

export interface AudioPlayerProps {
  book: AudioPlayerBook | null;
  onClose: () => void;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export interface PositionState {
  x: number;
  y: number;
}
