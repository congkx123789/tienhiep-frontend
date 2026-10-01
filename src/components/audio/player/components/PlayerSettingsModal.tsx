import React from 'react';
import { Timer } from 'lucide-react';

interface PlayerSettingsModalProps {
  ttsEngine: string;
  matchaVoice: string;
  matchaApiKey: string;
  selectedVoiceName: string;
  voices: any[];
  rate: number;
  volume: number;
  sleepTimer: number;
  timeLeftMin: number;
  onSaveEngine: (engine: string) => void;
  onSaveVoice: (voice: string) => void;
  onSaveApiKey: (key: string) => void;
  onSelectVoiceName: (voiceName: string) => void;
  onSaveRate: (rate: number) => void;
  onVolumeChange: (vol: number) => void;
  onSetSleepTimer: (timer: number) => void;
}

export const PlayerSettingsModal: React.FC<PlayerSettingsModalProps> = ({
  ttsEngine,
  matchaVoice,
  matchaApiKey,
  selectedVoiceName,
  voices,
  rate,
  volume,
  sleepTimer,
  timeLeftMin,
  onSaveEngine,
  onSaveVoice,
  onSaveApiKey,
  onSelectVoiceName,
  onSaveRate,
  onVolumeChange,
  onSetSleepTimer,
}) => {
  return (
    <div className="bg-[#07080e]/95 border border-white/10 rounded-xl p-2 text-[9px] space-y-2 animate-in fade-in duration-150 max-h-[180px] overflow-y-auto">
      {/* Engine Selector */}
      <div className="space-y-1">
        <label className="text-slate-400 font-bold block text-[8.5px]">Động cơ đọc (TTS Engine):</label>
        <div className="grid grid-cols-3 gap-1 bg-[#121225] p-0.5 rounded-lg border border-[#1f1f3a]">
          <button
            type="button"
            onClick={() => onSaveEngine('browser')}
            className={`py-1 rounded text-[9.5px] font-bold transition-all ${ttsEngine === 'browser' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Trình duyệt
          </button>
          <button
            type="button"
            onClick={() => onSaveEngine('matcha')}
            className={`py-1 rounded text-[9.5px] font-bold transition-all ${ttsEngine === 'matcha' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Matcha (AI)
          </button>
          <button
            type="button"
            onClick={() => onSaveEngine('local')}
            className={`py-1 rounded text-[9.5px] font-bold transition-all ${ttsEngine === 'local' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Local C++
          </button>
        </div>
      </div>

      {ttsEngine === 'local' && (
        <div className="bg-[#121225] border border-[#1f1f3a] p-1.5 rounded-lg">
          <span className="text-[9px] text-purple-400 font-bold block">⚡ Matcha Offline (C++)</span>
          <p className="text-[8px] text-slate-400 leading-tight">
            Chạy trực tiếp trên thiết bị, không tốn data API.
          </p>
        </div>
      )}

      {ttsEngine === 'matcha' && (
        <>
          <div className="space-y-0.5">
            <label className="text-slate-400 font-bold block text-[8.5px]">Giọng đọc Matcha:</label>
            <select
              value={matchaVoice}
              onChange={(e) => onSaveVoice(e.target.value)}
              className="w-full bg-[#121225] border border-[#1f1f3a] text-slate-200 p-1.5 rounded-lg outline-none text-[9px]"
            >
              <option value="the_gioi_hoan_my">Thế Giới Hoàn Mỹ (Nam)</option>
              <option value="vi_female">Nữ miền Bắc (Beta)</option>
            </select>
          </div>

          <div className="space-y-0.5">
            <label className="text-slate-400 font-bold block text-[8.5px]">API Key:</label>
            <input
              type="password"
              value={matchaApiKey}
              onChange={(e) => onSaveApiKey(e.target.value)}
              placeholder="sk-tc-..."
              className="w-full bg-[#121225] border border-[#1f1f3a] text-slate-200 px-2 py-1 rounded-lg outline-none text-[9px]"
            />
          </div>
        </>
      )}

      {ttsEngine === 'browser' && (
        <div className="space-y-0.5">
          <label className="text-slate-400 font-bold block text-[8.5px]">Giọng đọc (Voice):</label>
          <select
            value={selectedVoiceName}
            onChange={(e) => onSelectVoiceName(e.target.value)}
            className="w-full bg-[#121225] border border-[#1f1f3a] text-slate-200 p-1.5 rounded-lg outline-none text-[9px]"
          >
            {voices.length > 0 ? (
              voices.map((v, i) => (
                <option key={i} value={v.name}>{v.name} ({v.lang})</option>
              ))
            ) : (
              <option value="">Giọng mặc định</option>
            )}
          </select>
        </div>
      )}

      {/* Speed & Volume settings */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <label className="text-slate-400 font-bold block text-[8.5px]">Tốc độ ({rate}x):</label>
          <input
            type="range"
            min="0.5"
            max="3.5"
            step="0.05"
            value={rate}
            onChange={(e) => onSaveRate(parseFloat(e.target.value))}
            className="w-full accent-purple-500 bg-[#121225]"
          />
        </div>
        
        <div className="space-y-0.5">
          <label className="text-slate-400 font-bold block text-[8.5px]">Âm lượng ({Math.round(volume * 100)}%):</label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-purple-500 bg-[#121225]"
          />
        </div>
      </div>

      {/* Sleep Timer */}
      <div className="space-y-0.5">
        <label className="text-slate-400 font-bold block flex items-center gap-1 text-[8.5px]">
          <Timer className="w-3 h-3" />
          Hẹn giờ: {sleepTimer > 0 ? `${timeLeftMin}p` : 'Tắt'}
        </label>
        <select
          value={sleepTimer}
          onChange={(e) => onSetSleepTimer(parseInt(e.target.value))}
          className="w-full bg-[#121225] border border-[#1f1f3a] text-slate-200 p-1 rounded-lg outline-none text-[9px]"
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
