import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Volume2, Globe, CheckCircle2, 
  Loader2, Cpu, Play, Square, Bot, Layers
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { localTranslator } from '../../../../utils/localTranslator';
import { fetchAudioBlob } from '../../../audio/player/ttsEngineHelper';
import BasePointManager from '../../../../core/platform/basePoint';

const TEST_MODES = [
  { id: '4', label: 'Mode 4 (Hybrid)' }, { id: '1', label: 'Mode 1 (Cổ Trang)' },
  { id: '2', label: 'Mode 2 (Anime)' }, { id: '3', label: 'Mode 3 (Âu Mỹ)' },
  { id: 'vietphrase', label: 'Vietphrase' }, { id: 'hanviet', label: 'Hán Việt' },
  { id: 'raw', label: 'Nguyên Bản' },
];

export const TranslationAndTtsTester: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [platform, setPlatform] = useState('Đang phát hiện...');
  const [transInput, setTransInput] = useState('第一章 穿越仙界，天道渺渺，修仙之路漫漫。');
  const [transResult, setTransResult] = useState(''), [isTranslating, setIsTranslating] = useState(false);
  const [transLatency, setTransLatency] = useState<number | null>(null);
  const [transEngineName, setTransEngineName] = useState('Native Multi-Mode Engine');
  const [transError, setTransError] = useState('');
  const [testMode, setTestMode] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem('translationSettings') || '{}').mode || '4'; } catch { return '4'; }
  });

  const [ttsInput, setTtsInput] = useState('Tiên Hiệp AI xin chào đạo hữu. Chúc đạo hữu đọc truyện vui vẻ.');
  const [isPlaying, setIsPlaying] = useState(false), [ttsLatency, setTtsLatency] = useState<number | null>(null);
  const [ttsEngineUsed, setTtsEngineUsed] = useState('Matcha C++ Native Engine'), [ttsError, setTtsError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).electron) setPlatform('Electron Desktop');
      else if (Capacitor.isNativePlatform()) {
        const p = Capacitor.getPlatform();
        setPlatform(p === 'ios' ? 'Apple iOS (iPhone / iPad)' : 'Android APK');
      } else setPlatform('Web Browser');
    }

    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const MODE_SAMPLES: Record<string, string> = {
    '2': '鸣人与草帽路飞并肩作战，索隆拔出了名刀。',
    '1': '李七夜淡然一笑，这一剑破碎了苍穹！',
    '3': '哈利波特与夏洛克·福尔摩斯在伦敦相遇。',
    '4': '叶天帝踏碎九天十地，逆转乾坤。',
    'vietphrase': '天下第一武道会正式开启。',
    'hanviet': '天地玄黄，宇宙洪荒。',
    'raw': '第一章 穿越仙界，天道渺渺。'
  };

  const handleTestTranslate = async (modeOverride?: string) => {
    const activeMode = modeOverride || testMode;
    let textToTranslate = transInput.trim();
    if (modeOverride && MODE_SAMPLES[modeOverride] && (!textToTranslate || Object.values(MODE_SAMPLES).includes(textToTranslate))) {
      textToTranslate = MODE_SAMPLES[modeOverride];
      setTransInput(textToTranslate);
    }
    if (!textToTranslate) return;

    setIsTranslating(true);
    setTransError('');
    setTransResult('');
    const start = performance.now();
    try {
      if (activeMode === 'raw') {
        setTransLatency(Math.max(1, Math.round((performance.now() - start) * 10) / 10));
        setTransResult(textToTranslate);
        setTransEngineName('Nguyên Bản (Tắt Dịch)');
        return;
      }

      const translated = await localTranslator.translate(textToTranslate, activeMode);

      setTransLatency(Math.max(1, Math.round((performance.now() - start) * 10) / 10));
      if (translated) {
        setTransResult(translated);
        const modeLabel = TEST_MODES.find(m => m.id === activeMode)?.label || `Mode ${activeMode}`;
        setTransEngineName(`${localTranslator.lastUsedEngine || 'Lõi Dịch'} (${modeLabel})`);
      } else {
        setTransError('Không thể tạo bản dịch cục bộ. Vui lòng thử đổi sang chế độ khác.');
      }
    } catch (err: any) {
      setTransError(err?.message || 'Lỗi dịch thuật cục bộ.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTestTts = async () => {
    if (!ttsInput.trim()) return;
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    setTtsError('');
    const start = performance.now();

    try {
      const audioUrl = await fetchAudioBlob(ttsInput.trim(), 'local', 'the_gioi_hoan_my', '', 1.0, null);
      if (audioUrl) {
        setTtsLatency(Math.max(1, Math.round(performance.now() - start)));
        setTtsEngineUsed('Matcha C++ Native Engine (24kHz WAV)');
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setTtsError('Lỗi giải mã audio buffer từ Native Engine.');
          setIsPlaying(false);
        };
        await audio.play();
        setIsPlaying(true);
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Fallback sang Web Speech API On-Device (Hỗ trợ 100% trên iOS WKWebView / Safari / Chrome)
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(ttsInput.trim());
        utter.lang = 'vi-VN';
        utter.rate = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang.startsWith('vi') || v.lang.includes('VIE'));
        if (viVoice) utter.voice = viVoice;
        utter.onstart = () => {
          setTtsLatency(Math.max(1, Math.round(performance.now() - start)));
          setTtsEngineUsed('On-Device iOS/Web Voice (vi-VN)');
          setIsPlaying(true);
        };
        utter.onend = () => setIsPlaying(false);
        utter.onerror = (e) => {
          setTtsError('Lỗi phát giọng đọc: ' + (e.error || 'không xác định'));
          setIsPlaying(false);
        };
        window.speechSynthesis.speak(utter);
      } else {
        setTtsLatency(Math.max(1, Math.round(performance.now() - start)));
        setTtsEngineUsed('On-Device Audio Player');
        setTtsError('Không tìm thấy trình phát giọng đọc cục bộ khả dụng.');
        setIsPlaying(false);
      }
    } catch (err: any) {
      setTtsError(err?.message || 'Lỗi phát giọng đọc.');
      setIsPlaying(false);
    }
  };

  return (
    <div className={`flex flex-col gap-4 text-slate-200 ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* 1. System & Engine Overview */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Môi Trường: <span className="text-indigo-300">{platform}</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Local On-Device Engine
          </span>
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" /> Cỗ máy Dịch thuật C++
            </span>
            <span className="text-purple-300 font-semibold font-mono">CMLM NAT + HanLP (native-core/translation)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-amber-400" /> Cỗ máy Giọng đọc C++
            </span>
            <span className="text-amber-300 font-semibold font-mono">Matcha TTS ONNX + Vocos (native-core/tts)</span>
          </div>
        </div>
      </div>

      {/* 2. Quick Translate Tester */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-violet-400" /> Thử Nghiệm Dịch Thuật C++ Local
          </label>
          <span className="text-[10px] text-slate-400 font-mono">Mode: {testMode}</span>
        </div>

        {/* Mode selector pills */}
        <div className="flex flex-wrap gap-1 pt-0.5 pb-0.5">
          {TEST_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setTestMode(m.id);
                handleTestTranslate(m.id);
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                testMode === m.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={transInput}
            onChange={(e) => setTransInput(e.target.value)}
            placeholder="Nhập câu tiếng Trung..."
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500 font-serif"
          />
          <button
            type="button"
            onClick={() => handleTestTranslate()}
            disabled={isTranslating}
            className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 disabled:opacity-50"
          >
            {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Dịch Ngay
          </button>
        </div>

        {transResult && (
          <div className="mt-1 p-2.5 rounded-xl bg-violet-950/30 border border-violet-500/30 text-xs">
            <div className="flex items-center justify-between text-[10px] text-violet-400 mb-1 font-semibold">
              <span>Bản dịch Tiếng Việt:</span>
              {transLatency !== null && <span>⚡ {transLatency}ms • {transEngineName}</span>}
            </div>
            <p className="text-violet-100 font-medium leading-relaxed">{transResult}</p>
          </div>
        )}
        {transError && <p className="text-[11px] text-rose-400 mt-0.5">⚠️ {transError}</p>}
      </div>

      {/* 3. Quick TTS Audio Tester */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
        <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Thử Nghiệm Giọng Đọc C++ Matcha TTS Local
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={ttsInput}
            onChange={(e) => setTtsInput(e.target.value)}
            placeholder="Nhập câu tiếng Việt để đọc..."
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleTestTts}
            className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 ${
              isPlaying ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            {isPlaying ? (
              <><Square className="w-3.5 h-3.5 fill-current" /> Dừng</>
            ) : (
              <><Play className="w-3.5 h-3.5 fill-current" /> Phát Thử</>
            )}
          </button>
        </div>

        {ttsLatency !== null && (
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>🔊 Trạng thái: {isPlaying ? 'Đang phát âm thanh' : 'Sẵn sàng'}</span>
            <span>⚡ Khởi động: {ttsLatency}ms • {ttsEngineUsed}</span>
          </div>
        )}
        {ttsError && <p className="text-[11px] text-rose-400 mt-0.5">⚠️ {ttsError}</p>}
      </div>
    </div>
  );
};
