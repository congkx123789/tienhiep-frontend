import React, { useState } from 'react';
import { Volume2, Settings, Minimize2, X, Music, Timer } from 'lucide-react';
import { AudioPlayerProps } from './AudioPlayer.types';
import { useDraggablePlayer } from './useDraggablePlayer';
import { usePlayerSpeech } from './usePlayerSpeech';
import { useSleepTimer } from './useSleepTimer';
import { MiniPlayer } from './components/MiniPlayer';
import { PlayerSettingsModal } from './components/PlayerSettingsModal';
import { PlayerControls } from './components/PlayerControls';

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  book,
  onClose,
  onNextChapter,
  onPrevChapter,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const speech = usePlayerSpeech(book, onNextChapter);
  const { sleepTimer, setSleepTimer, timeLeftMin } = useSleepTimer(speech.isPlaying, speech.stopSpeaking);

  const cycleSleepTimer = () => {
    const steps = [0, 15, 30, 45, 60];
    const nextIdx = (steps.indexOf(sleepTimer) + 1) % steps.length;
    setSleepTimer(steps[nextIdx]);
  };

  const {
    playerElRef,
    dragStyle,
    handleMouseDown,
    handleTouchStart,
    draggedRef,
  } = useDraggablePlayer(isMinimized, showSettings);

  if (!book) return null;

  const handleClose = () => {
    speech.stopSpeaking();
    onClose();
  };

  if (isMinimized) {
    return (
      <MiniPlayer
        book={book}
        isPlaying={speech.isPlaying}
        isLoading={speech.isLoading}
        progress={speech.progress}
        totalSentences={speech.totalSentences}
        currentSentenceDisplay={speech.currentSentenceDisplay}
        playerElRef={playerElRef}
        dragStyle={dragStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onExpand={() => {
          if (draggedRef.current) {
            draggedRef.current = false;
            return;
          }
          setIsMinimized(false);
        }}
        onTogglePlay={speech.togglePlay}
        onClose={handleClose}
        onPrevChapter={onPrevChapter}
        onNextChapter={onNextChapter}
      />
    );
  }

  return (
    <div
      ref={playerElRef}
      style={{ ...dragStyle, WebkitAppRegion: 'no-drag' as any }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`fixed bottom-24 ${dragStyle.left ? '' : 'left-1/2 -translate-x-1/2'} z-[100050] bg-[#0d0e17]/95 border border-purple-500/40 backdrop-blur-xl rounded-2xl p-2.5 sm:p-3 shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex flex-col gap-2 w-[340px] max-w-[92vw] animate-in fade-in slide-in-from-bottom-3 duration-250 cursor-grab active:cursor-grabbing select-none`}
    >
      {/* Header Bar */}
      <div className="flex justify-between items-center select-none pb-1 border-b border-white/5">
        <span className="text-[8.5px] text-purple-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-purple-400 shrink-0" />
          <span className="truncate max-w-[140px]">
            {book.isChapter ? 'ĐANG ĐỌC CHƯƠNG...' : 'NGHE TÓM TẮT...'}
          </span>
        </span>
        <div className="flex items-center gap-1 no-drag" onTouchStart={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={cycleSleepTimer}
            className={`px-1.5 py-0.5 rounded-md transition-colors flex items-center gap-1 text-[8.5px] font-bold ${sleepTimer > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            title={`Hẹn giờ tắt: ${sleepTimer > 0 ? timeLeftMin + ' phút còn lại' : 'Bấm để hẹn giờ'}`}
          >
            <Timer className="w-3.5 h-3.5" />
            {sleepTimer > 0 ? <span>{timeLeftMin}p</span> : <span>Hẹn giờ</span>}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded-md transition-colors ${showSettings ? 'bg-purple-600/30 text-purple-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            title="Cấu hình giọng đọc"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-slate-400 hover:bg-white/5 hover:text-white rounded-md transition-colors"
            title="Thu nhỏ thanh mini"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors"
            title="Đóng trình phát"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Info */}
      <div className="flex gap-2.5 items-center">
        {(book as any).cover ? (
          <img
            src={(book as any).cover}
            alt="cover"
            className={`w-9 h-12 object-cover rounded-lg border border-white/10 shadow-sm shrink-0 bg-[#07080e] ${speech.isPlaying ? 'animate-pulse' : ''}`}
            onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className={`w-9 h-12 rounded-lg border border-white/10 bg-[#07080e] flex items-center justify-center text-slate-500 shrink-0 ${speech.isPlaying ? 'ring-1.5 ring-purple-500/40' : ''}`}>
            <Music className="w-4 h-4 text-purple-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-white text-[11px] font-bold truncate leading-tight">
            {book.title_vietphrase || book.title}
          </h4>
          <p className="text-[9px] text-slate-400 truncate mt-0.5">
            ✍ {book.author_hanviet || book.author || '—'}
          </p>

          {/* Click & Touch-seekable Progress Bar */}
          <div
            onClick={speech.handleSeekBarClick}
            onTouchStart={speech.handleSeekBarTouch}
            onTouchMove={speech.handleSeekBarTouch}
            className="w-full bg-[#07080e] rounded-full h-2 mt-1.5 relative overflow-hidden cursor-pointer group no-drag touch-none"
            title="Click hoặc vuốt để tua câu nhanh"
          >
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-150 relative pointer-events-none"
              style={{ width: `${speech.progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md transition-opacity -mr-1" />
            </div>
          </div>

          {/* Progress display */}
          <div className="flex justify-between items-center text-[8.5px] mt-1 font-medium select-none">
            <span className="text-purple-300 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
              Đoạn {speech.currentSentenceDisplay}
            </span>
            <span className="text-slate-400 font-mono text-[8px]">
              {speech.progress}%
            </span>
            <span className="text-slate-400 font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
              Tổng {speech.totalSentences} đoạn
            </span>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <PlayerSettingsModal
          ttsEngine={speech.ttsEngine}
          matchaVoice={speech.matchaVoice}
          matchaApiKey={speech.matchaApiKey}
          selectedVoiceName={speech.selectedVoiceName}
          voices={speech.voices}
          rate={speech.rate}
          volume={speech.volume}
          sleepTimer={sleepTimer}
          timeLeftMin={timeLeftMin}
          onSaveEngine={speech.handleSaveEngine}
          onSaveVoice={speech.handleSaveVoice}
          onSaveApiKey={speech.handleSaveApiKey}
          onSelectVoiceName={speech.setSelectedVoiceName}
          onSaveRate={speech.handleSaveRate}
          onVolumeChange={speech.handleVolumeChange}
          onSetSleepTimer={setSleepTimer}
        />
      )}

      {/* Controls */}
      <PlayerControls
        isPlaying={speech.isPlaying}
        isLoading={speech.isLoading}
        onTogglePlay={speech.togglePlay}
        onPrevChapter={onPrevChapter}
        onNextChapter={onNextChapter}
        onSkipForward={speech.skipForward}
        onSkipBackward={speech.skipBackward}
        onSeekRelative={(offset) => speech.seekToSentence(speech.currentSentenceDisplay - 1 + offset)}
      />
    </div>
  );
};

export default AudioPlayer;
