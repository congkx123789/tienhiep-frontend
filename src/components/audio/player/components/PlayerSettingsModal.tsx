import React from 'react';
import { Timer, Zap, Volume2, Gauge } from 'lucide-react';

interface PlayerSettingsModalProps {
  ttsEngine?: string;
  matchaVoice?: string;
  matchaApiKey?: string;
  selectedVoiceName?: string;
  voices?: any[];
  rate: number;
  volume: number;
  sleepTimer: number;
  timeLeftMin: number;
  onSaveEngine?: (engine: string) => void;
  onSaveVoice?: (voice: string) => void;
  onSaveApiKey?: (key: string) => void;
  onSelectVoiceName?: (voiceName: string) => void;
  onSaveRate: (rate: number) => void;
  onVolumeChange: (vol: number) => void;
  onSetSleepTimer: (timer: number) => void;
}

export const PlayerSettingsModal: React.FC<PlayerSettingsModalProps> = ({
  ttsEngine = 'local',
  rate,
  volume,
  sleepTimer,
  timeLeftMin,
  onSaveRate,
  onVolumeChange,
  onSetSleepTimer,
}) => {
  return (
    <div className="bg-[#07080e]/95 border border-purple-500/20 rounded-xl p-2.5 text-[9px] space-y-2.5 animate-in fade-in duration-150 max-h-[220px] overflow-y-auto shadow-xl">
      {/* Engine Status Badge (Single High-Performance Neural Voice) */}
      <div className="bg-gradient-to-r from-purple-950/40 to-[#121225] border border-purple-500/30 p-2 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
          <div>
            <span className="text-[9.5px] text-purple-300 font-bold block">
              Matcha-TTS C++ (Giọng Đơn Chuẩn)
            </span>
            <span className="text-[8px] text-slate-400">
              Flow-Matching INT8 + Vocos • Độ trễ ~20ms
            </span>
          </div>
        </div>
        <span className="text-[8px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
          Sẵn sàng
        </span>
      </div>

      {/* Speed & Volume settings */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#121225]/80 border border-white/5 p-2 rounded-lg space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-bold flex items-center gap-1 text-[8.5px]">
              <Gauge className="w-2.5 h-2.5 text-purple-400" /> Tốc độ:
            </label>
            <span className="text-purple-300 font-mono font-bold">{rate.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.05"
            value={rate}
            onChange={(e) => onSaveRate(parseFloat(e.target.value))}
            className="w-full accent-purple-500 bg-[#1f1f3a] h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        <div className="bg-[#121225]/80 border border-white/5 p-2 rounded-lg space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-bold flex items-center gap-1 text-[8.5px]">
              <Volume2 className="w-2.5 h-2.5 text-purple-400" /> Âm lượng:
            </label>
            <span className="text-purple-300 font-mono font-bold">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-purple-500 bg-[#1f1f3a] h-1.5 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Sleep Timer */}
      <div className="bg-[#121225]/80 border border-white/5 p-2 rounded-lg space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-slate-300 font-bold flex items-center gap-1 text-[8.5px]">
            <Timer className="w-2.5 h-2.5 text-purple-400" /> Hẹn giờ ngủ:
          </label>
          <span className="text-purple-300 font-mono font-bold">
            {sleepTimer > 0 ? `${timeLeftMin} phút` : 'Tắt'}
          </span>
        </div>
        <select
          value={sleepTimer}
          onChange={(e) => onSetSleepTimer(parseInt(e.target.value, 10))}
          className="w-full bg-[#0a0a14] border border-white/10 text-slate-200 p-1.5 rounded-lg outline-none text-[8.5px] cursor-pointer"
        >
          <option value={0}>Không hẹn giờ</option>
          <option value={15}>15 phút</option>
          <option value={30}>30 phút</option>
          <option value={45}>45 phút</option>
          <option value={60}>60 phút</option>
        </select>
      </div>
    </div>
  );
};
