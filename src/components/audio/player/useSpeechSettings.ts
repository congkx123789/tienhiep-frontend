import { useState, useRef } from 'react';
export function useSpeechSettings() {
  const [ttsEngine, setTtsEngine] = useState(() => {
    const saved = localStorage.getItem('local_tts_engine');
    if (saved) return saved;
    return 'local';
  });

  const [matchaApiKey, setMatchaApiKey] = useState(() => localStorage.getItem('local_tts_api_key') || '');
  const [matchaVoice, setMatchaVoice] = useState(() => localStorage.getItem('local_tts_voice') || 'the_gioi_hoan_my');
  const [rate, setRate] = useState(() => {
    try { return JSON.parse(localStorage.getItem('translationSettings') || '{}').audioSpeed || 1.5; } catch { return 1.5; }
  });
  const [volume, setVolume] = useState(() => {
    try { const v = localStorage.getItem('tts_player_volume'); return v !== null ? parseFloat(v) : 1.0; } catch { return 1.0; }
  });
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');

  const rateRef = useRef(rate);
  rateRef.current = rate;

  const handleSaveEngine = (e: string) => {
    setTtsEngine(e);
    localStorage.setItem('local_tts_engine', e);
  };

  const handleSaveVoice = (v: string) => {
    setMatchaVoice(v);
    localStorage.setItem('local_tts_voice', v);
  };

  const handleSaveApiKey = (k: string) => {
    setMatchaApiKey(k);
    localStorage.setItem('local_tts_api_key', k);
  };

  const handleSaveRate = (r: number) => {
    setRate(r);
    try {
      const stored = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      stored.audioSpeed = r;
      localStorage.setItem('translationSettings', JSON.stringify(stored));
    } catch {}
  };

  const handleVolumeChange = (vol: number, audioEl: HTMLAudioElement | null) => {
    setVolume(vol);
    volumeRef.current = vol;
    localStorage.setItem('tts_player_volume', String(vol));
    if (audioEl) audioEl.volume = vol;
  };

  return {
    ttsEngine,
    matchaApiKey,
    matchaVoice,
    rate,
    rateRef,
    volume,
    volumeRef,
    voices,
    setVoices,
    selectedVoiceName,
    setSelectedVoiceName,
    handleSaveEngine,
    handleSaveVoice,
    handleSaveApiKey,
    handleSaveRate,
    handleVolumeChange,
  };
}
