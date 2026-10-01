import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Loader } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  onTogglePlay: () => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onSeekRelative: (offset: number) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  isLoading,
  onTogglePlay,
  onPrevChapter,
  onNextChapter,
  onSkipForward,
  onSkipBackward,
  onSeekRelative,
}) => {
  return (
    <div className="flex items-center justify-center gap-1 border-t border-white/5 pt-1.5 no-drag">
      {/* Chương trước */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrevChapter && onPrevChapter(); }}
        disabled={!onPrevChapter}
        className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        title="Chương trước"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
        </svg>
      </button>

      {/* Tua lùi (-3 đoạn) */}
      <button
        onClick={(e) => { e.stopPropagation(); onSeekRelative(-3); }}
        className="px-1.5 py-0.5 text-slate-400 hover:text-purple-300 transition-colors text-[8px] font-bold active:scale-90 bg-white/5 hover:bg-purple-500/10 rounded"
        title="Tua lùi 3 đoạn / câu"
      >
        -3 đoạn
      </button>

      {/* Câu trước */}
      <button
        onClick={(e) => { e.stopPropagation(); onSkipBackward(); }}
        className="p-1 text-slate-300 hover:text-white transition-colors active:scale-90"
        title="Đoạn trước"
      >
        <SkipBack className="w-3.5 h-3.5" />
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
        className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white rounded-full shadow-[0_0_15px_rgba(147,51,234,0.6)] transition-all mx-2 touch-manipulation cursor-pointer select-none"
        title={isPlaying ? "Tạm dừng" : "Phát tiếp"}
      >
        {isLoading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 fill-current translate-x-[0.5px]" />
        )}
      </button>

      {/* Câu tiếp */}
      <button
        onClick={(e) => { e.stopPropagation(); onSkipForward(); }}
        className="p-1 text-slate-300 hover:text-white transition-colors active:scale-90"
        title="Đoạn tiếp"
      >
        <SkipForward className="w-3.5 h-3.5" />
      </button>

      {/* Tua tới (+3 đoạn) */}
      <button
        onClick={(e) => { e.stopPropagation(); onSeekRelative(3); }}
        className="px-1.5 py-0.5 text-slate-400 hover:text-purple-300 transition-colors text-[8px] font-bold active:scale-90 bg-white/5 hover:bg-purple-500/10 rounded"
        title="Tua tới 3 đoạn / câu"
      >
        +3 đoạn
      </button>

      {/* Chương sau */}
      <button
        onClick={(e) => { e.stopPropagation(); onNextChapter && onNextChapter(); }}
        disabled={!onNextChapter}
        className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        title="Chương sau"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zm8.5-6L18 18V6z"/>
        </svg>
      </button>
    </div>
  );
};
