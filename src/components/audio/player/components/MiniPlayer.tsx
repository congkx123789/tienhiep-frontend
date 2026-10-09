import React from 'react';
import { Volume2, Play, Pause, X, Loader } from 'lucide-react';
import { AudioPlayerBook } from '../AudioPlayer.types';

interface MiniPlayerProps {
  book: AudioPlayerBook;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  totalSentences: number;
  currentSentenceDisplay: number;
  playerElRef: React.RefObject<HTMLDivElement>;
  dragStyle: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onExpand: () => void;
  onTogglePlay: () => void;
  onClose: () => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  book,
  isPlaying,
  isLoading,
  progress,
  totalSentences,
  currentSentenceDisplay,
  playerElRef,
  dragStyle,
  onMouseDown,
  onTouchStart,
  onExpand,
  onTogglePlay,
  onClose,
  onPrevChapter,
  onNextChapter,
}) => {
  return (
    <div 
      ref={playerElRef}
      style={{ ...dragStyle, minWidth: 260, WebkitAppRegion: 'no-drag' as any }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className={`fixed bottom-24 ${dragStyle.left ? '' : 'left-1/2 -translate-x-1/2'} z-[210000] bg-[#121225]/97 border border-purple-500/40 rounded-2xl px-3.5 py-2 shadow-2xl flex items-center gap-2.5 cursor-grab active:cursor-grabbing hover:border-purple-400 transition-colors duration-200 select-none max-w-[92vw]`}
    >
      {/* Click background to expand */}
      <div 
        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
        onClick={onExpand}
      >
        <div className="flex items-center justify-center bg-purple-600 rounded-full w-8 h-8 shrink-0">
          {isLoading ? (
            <Loader className="w-4 h-4 text-white animate-spin" />
          ) : isPlaying ? (
            <div className="flex gap-[2px] items-center h-3.5">
              <div className="w-[2px] h-2.5 bg-white animate-pulse" />
              <div className="w-[2px] h-3.5 bg-white animate-pulse" style={{ animationDelay: '0.15s' }} />
              <div className="w-[2px] h-2 bg-white animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-white font-bold block truncate max-w-[110px]">
            {book.title_vietphrase || book.title}
          </span>
          <span className="text-[8.5px] text-purple-300 font-medium block truncate">
            {totalSentences > 0 ? `Đoạn ${currentSentenceDisplay}/${totalSentences} (${progress}%)` : `${progress}%`}
          </span>
        </div>
      </div>

      {/* Minimized Controls */}
      <div className="flex items-center gap-1 shrink-0 no-drag" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
        {onPrevChapter && (
          <button onClick={(e) => { e.stopPropagation(); onPrevChapter(); }} className="p-1 text-slate-400 hover:text-white transition-colors" title="Chương trước">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
            </svg>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
          className="p-1.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-full transition-all active:scale-95 touch-manipulation cursor-pointer select-none"
          title={isPlaying ? "Tạm dừng" : "Phát tiếp"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current translate-x-[0.5px]" />}
        </button>
        {onNextChapter && (
          <button onClick={(e) => { e.stopPropagation(); onNextChapter(); }} className="p-1 text-slate-400 hover:text-white transition-colors" title="Chương tiếp">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zm8.5-6L18 18V6z"/>
            </svg>
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-white ml-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
