import React from 'react';
import { ArrowLeft, BookOpen, Play, Pause, Eye, Languages, Loader2 } from 'lucide-react';
import { LocalBook } from '../../LocalReader.types';
import { TranslateMode } from '../../useLocalTranslate';

const TRANSLATE_MODES: { mode: TranslateMode; label: string }[] = [
  { mode: 'raw',        label: '原' },
  { mode: 'hanviet',    label: 'HV' },
  { mode: 'vietphrase', label: 'VP' },
  { mode: 'cmlm',       label: 'AI' },
];

interface LocalReaderHeaderProps {
  activeBook: LocalBook;
  isCurrentChapterPlaying: boolean;
  autoScrollTts: boolean;
  translateMode: TranslateMode;
  isTranslating: boolean;
  translateProgress: number;
  onBackToShelf: () => void;
  onOpenToc: () => void;
  onTTSPlay: () => void;
  onToggleAutoScroll: () => void;
  onChangeTranslateMode: (mode: TranslateMode) => void;
}

export const LocalReaderHeader: React.FC<LocalReaderHeaderProps> = ({
  activeBook,
  isCurrentChapterPlaying,
  autoScrollTts,
  translateMode,
  isTranslating,
  translateProgress,
  onBackToShelf,
  onOpenToc,
  onTTSPlay,
  onToggleAutoScroll,
  onChangeTranslateMode,
}) => {
  return (
    <>
      {/* ── Top Floating Control Bar ── */}
      <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4 sticky top-0 bg-[#0b0b14]/95 backdrop-blur-md z-20 pt-2">
        <button
          onClick={onBackToShelf}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121225] border border-white/5 hover:bg-white/5 text-slate-300 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> <span>Tủ sách</span>
        </button>

        <button
          onClick={onOpenToc}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121225] border border-white/5 text-purple-300 text-xs font-bold truncate max-w-[180px]"
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="truncate">{activeBook.title}</span>
        </button>

        {/* TTS + AutoScroll */}
        <div className="flex items-center gap-1 bg-[#12122b] border border-purple-500/10 p-1 rounded-xl shadow-md">
          <button
            onClick={onTTSPlay}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isCurrentChapterPlaying
                ? 'bg-purple-600 text-white'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            {isCurrentChapterPlaying ? <Pause className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
            <span>{isCurrentChapterPlaying ? 'Dừng' : 'Audio AI'}</span>
          </button>

          <button
            onClick={onToggleAutoScroll}
            className={`p-1.5 rounded-lg transition-all ${
              autoScrollTts ? 'text-purple-400 bg-purple-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
            title={autoScrollTts ? "Tắt tự động cuộn" : "Bật tự động cuộn"}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Translate Mode Bar ── */}
      <div className="flex items-center justify-center gap-1.5">
        <Languages className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <div className="flex items-center gap-1 bg-[#12122b] border border-white/5 p-1 rounded-xl">
          {TRANSLATE_MODES.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => onChangeTranslateMode(mode)}
              className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all duration-150 ${
                translateMode === mode
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {isTranslating && (
          <span className="flex items-center gap-1 text-[10px] text-purple-400 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> {translateProgress}%
          </span>
        )}
      </div>

      {/* ── Thanh tiến độ dịch ── */}
      {isTranslating && translateProgress < 100 && (
        <div className="relative h-1 w-full rounded-full bg-white/5 overflow-hidden -mt-6">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${translateProgress}%`,
              background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
        </div>
      )}
    </>
  );
};
