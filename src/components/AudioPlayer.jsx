import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Music, Volume2, Settings, Minimize2, SkipForward, SkipBack, Loader, BookOpen, Timer } from 'lucide-react';
import api from '../services/api';

// Resolve đúng địa chỉ host cho Local TTS server
// - Electron/Web: 127.0.0.1:5051 (hoặc 127.0.0.1:8001 nếu chạy ONNX riêng)
// - Capacitor Android: 127.0.0.1:5051 (adb reverse) hoặc 10.0.2.2:5051 (host loopback emulator)
let currentWorkingTtsHost = 'http://127.0.0.1:5051';

async function detectBestTtsHost() {
  if (typeof window !== 'undefined' && window.electron) return 'http://127.0.0.1:5051';
  if (typeof window !== 'undefined' && window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
    try {
      const r = await fetch('http://127.0.0.1:5051/health', { signal: AbortSignal.timeout(400) });
      if (r.ok) {
        currentWorkingTtsHost = 'http://127.0.0.1:5051';
        return currentWorkingTtsHost;
      }
    } catch (e) {}
    try {
      const r = await fetch('http://10.0.2.2:5051/health', { signal: AbortSignal.timeout(500) });
      if (r.ok) {
        currentWorkingTtsHost = 'http://10.0.2.2:5051';
        return currentWorkingTtsHost;
      }
    } catch (e) {}
    try {
      const r = await fetch('http://127.0.0.1:8001/health', { signal: AbortSignal.timeout(300) });
      if (r.ok) {
        currentWorkingTtsHost = 'http://127.0.0.1:8001';
        return currentWorkingTtsHost;
      }
    } catch (e) {}
    return currentWorkingTtsHost;
  }
  return 'http://127.0.0.1:5051';
}

function getLocalTtsHost() {
  if (typeof window !== 'undefined' && window.electron) return 'http://127.0.0.1:5051';
  if (typeof window !== 'undefined' && window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
    return currentWorkingTtsHost;
  }
  return 'http://127.0.0.1:5051';
}

const isSpeechSynthesisAvailable = () => {
  return typeof window !== 'undefined' &&
         typeof window.SpeechSynthesisUtterance !== 'undefined' &&
         !!window.speechSynthesis;
};

export default function AudioPlayer({ book, onClose, onNextChapter, onPrevChapter }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Sleep Timer state
  const [sleepTimer, setSleepTimer] = useState(0); // 0 (off), 15, 30, 45, 60 minutes
  const [timeLeftMin, setTimeLeftMin] = useState(0);
  const sleepTimerRef = useRef(null);


  // TTS Engine selection ('local' | 'browser' | 'matcha')
  const [ttsEngine, setTtsEngine] = useState(() => {
    const saved = localStorage.getItem('local_tts_engine');
    if (saved) return saved;
    const isNativeApp = typeof window !== 'undefined' && (!!window.electron || (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()));
    if (isNativeApp) return 'browser'; // Mặc định an toàn trên mobile webview là browser nếu chưa cấu hình
    return 'local';
  });

  // API Key for Matcha-TTS
  const [matchaApiKey, setMatchaApiKey] = useState(() => {
    return localStorage.getItem('local_tts_api_key') || '';
  });

  // Voice for Matcha-TTS
  const [matchaVoice, setMatchaVoice] = useState(() => {
    return localStorage.getItem('local_tts_voice') || 'the_gioi_hoan_my';
  });

  // Browser TTS parameters
  const [rate, setRate] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      return stored.audioSpeed || 1.5;
    } catch { return 1.5; }
  });
  const [pitch, setPitch] = useState(1.0);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  
  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [rtfSpeedText, setRtfSpeedText] = useState('Đang đo...');
  const rtfHistoryRef = useRef([]);

  // Time progress state
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [totalTimeSec, setTotalTimeSec] = useState(0);

  const formatTime = (sec) => {
    if (!sec || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const audioRef = useRef(null);
  
  // Refs for segmented sentence queue player (Matcha-TTS)
  const sentencesRef = useRef([]);
  const currentSentenceIdxRef = useRef(0);
  const audioCacheRef = useRef({});
  const prefetchQueueRef = useRef(new Set());
  const playSessionIdRef = useRef(0);
  const triggeredIndicesRef = useRef(new Set());
  const rateRef = useRef(rate);
  rateRef.current = rate;
  const sentenceRetryCountRef = useRef({});

  // Watchdog & Playback State Recovery Refs
  const userPausedRef = useRef(false);
  const lastPlaybackProgressTimeRef = useRef(Date.now());
  const lastPlaybackPositionRef = useRef(0);
  const triggerNextRef = useRef(null);

  const logTrace = (msg) => {
    console.log(`[TTS Trace] ${msg}`);
    if (window.electron && typeof window.electron.logDebug === 'function') {
      window.electron.logDebug(msg);
    }
  };

  // Draggable State for Audio Player Panel (direct DOM/RAF method with left-bottom anchoring and dynamic bounding)
  const playerElRef = useRef(null);
  const _initPos = (() => {
    // Luôn để null khi khởi tạo để AudioPlayer mặc định luôn căn giữa màn hình theo CSS, tránh bị lệch do tọa độ cũ
    return null;
  })();
  const positionRef = useRef(_initPos);
  const [position, setPosition] = useState(_initPos);
  const draggedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const playerSize = useRef({ width: 290, height: 145 });
  const rafRef = useRef(null);

  // Direct DOM Drag Logic (Stores left and bottom offsets)
  const startDrag = (clientX, clientY) => {
    const el = playerElRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    playerSize.current = { width: rect.width, height: rect.height };
    // Store left and bottom offsets
    playerOffset.current = { 
      x: rect.left, 
      y: window.innerHeight - rect.bottom 
    };
    dragStart.current = { x: clientX, y: clientY };
    isDraggingRef.current = true;
    draggedRef.current = false;
    el.style.transition = 'none'; // Disable transition during drag
    
    // Add global dragging class to body to bypass Electron titlebar drag interception
    document.body.classList.add('global-dragging');
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) draggedRef.current = true;

    // Calculate raw coordinate targets
    const rawLeft = playerOffset.current.x + dx;
    const rawBottom = playerOffset.current.y - dy;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const minBottom = isMobile ? 76 : 16;

    // Moving right (dx > 0) increases left (x)
    const newLeft = Math.max(10, Math.min(rawLeft, window.innerWidth  - playerSize.current.width - 10));
    // Moving down (dy > 0) decreases bottom (y) - clamp top edge to stop exactly below the 56px header
    const maxBottom = Math.max(minBottom, window.innerHeight - playerSize.current.height - 56);
    const newBottom = Math.max(minBottom, Math.min(rawBottom, maxBottom));

    setPosition({ x: newLeft, y: newBottom });
    positionRef.current = { x: newLeft, y: newBottom };

    // Active Offset Correction: Adjust dragStart when cursor pushes past boundaries
    // to prevent sticky dead zones on screen edges
    const clampLeftDiff = rawLeft - newLeft;
    const clampBottomDiff = rawBottom - newBottom;
    if (clampLeftDiff !== 0) {
      dragStart.current.x += clampLeftDiff;
    }
    if (clampBottomDiff !== 0) {
      dragStart.current.y -= clampBottomDiff;
    }
  };

  const endDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    
    // Remove global dragging class from body
    document.body.classList.remove('global-dragging');

    const pos = positionRef.current;
    if (pos && draggedRef.current) {
      localStorage.setItem('audio_player_pos_v4', JSON.stringify(pos));
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input') || e.target.closest('.no-drag')) return;
    startDrag(e.clientX, e.clientY);
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input') || e.target.closest('.no-drag')) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    const onMouseMove = (e) => moveDrag(e.clientX, e.clientY);
    const onTouchMove = (e) => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); };
    const onUp = () => endDrag();

    const handleWindowResize = () => {
      setPosition(prev => {
        if (!prev) return prev;
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
        const minBottom = isMobile ? 76 : 16;
        const maxLeft = Math.max(10, window.innerWidth - playerSize.current.width - 10);
        const maxBottom = Math.max(minBottom, window.innerHeight - playerSize.current.height - 56);
        const newLeft = Math.max(10, Math.min(prev.x, maxLeft));
        const newBottom = Math.max(minBottom, Math.min(prev.y, maxBottom));
        if (newLeft !== prev.x || newBottom !== prev.y) {
          positionRef.current = { x: newLeft, y: newBottom };
          return { x: newLeft, y: newBottom };
        }
        return prev;
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend',  onUp);
    window.addEventListener('resize',    handleWindowResize);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend',  onUp);
      window.removeEventListener('resize',    handleWindowResize);
      document.body.classList.remove('global-dragging');
    };
  }, []);

  // Đảm bảo tọa độ khởi tạo trên mobile không bị chìm dưới thanh Bottom Navigation
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isMobile && position && (position.y < 76 || position.y === undefined)) {
      const fixedPos = { ...position, y: 76 };
      setPosition(fixedPos);
      positionRef.current = fixedPos;
      try { localStorage.setItem('audio_player_pos_v4', JSON.stringify(fixedPos)); } catch {}
    }
  }, []);

  // Sleep Timer countdown logic
  useEffect(() => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    if (sleepTimer > 0 && isPlaying) {
      setTimeLeftMin(sleepTimer);
      sleepTimerRef.current = setInterval(() => {
        setTimeLeftMin((prev) => {
          if (prev <= 1) {
            // Stop playing and clear
            setIsPlaying(false);
            stopSpeaking();
            clearInterval(sleepTimerRef.current);
            sleepTimerRef.current = null;
            setSleepTimer(0);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
    }

    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [sleepTimer, isPlaying]);

  // Duration Estimation Logic (Sử dụng tốc độ 1.0x làm gốc / hệ quy chiếu chuẩn)
  useEffect(() => {
    const sentences = sentencesRef.current;
    if (!sentences || sentences.length === 0) { setTotalTimeSec(0); setCurrentTimeSec(0); return; }
    const CHARS_PER_SEC_AT_1X = 11.2;
    const totalChars = sentences.reduce((acc, s) => acc + (s?.length || 0), 0);
    const total = totalChars / CHARS_PER_SEC_AT_1X;
    setTotalTimeSec(total);
    // Ước tính vị trí giây hiện tại khi không phát
    if (!isPlaying) {
      const idx = currentSentenceIdxRef.current;
      const currentChars = sentences.slice(0, idx).reduce((acc, s) => acc + (s?.length || 0), 0);
      setCurrentTimeSec(currentChars / CHARS_PER_SEC_AT_1X);
    }
  }, [progress, isPlaying]);



  // Auto-fetch API key if logged in and not present
  useEffect(() => {
    const handleSettingsUpdate = (e) => {
      if (e.detail && e.detail.audioSpeed) {
        setRate(e.detail.audioSpeed);
      }
    };
    window.addEventListener('translationSettingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('translationSettingsUpdated', handleSettingsUpdate);
  }, []);

  const ensureLocalEngineRunning = async () => {
    if (ttsEngine !== 'local') return true;
    const host = await detectBestTtsHost();

    // 1. Thử ping /health trước với timeout 1 giây
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const response = await fetch(`${host}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        logTrace("[ensureLocalEngineRunning] Local TTS Server đang chạy và phản hồi tốt.");
        return true;
      }
    } catch (e) {
      logTrace("[ensureLocalEngineRunning] Không phản hồi ping /health. Đang kích hoạt tự động...");
    }

    // 2. Nếu không phản hồi và ở trong Electron, gọi kích hoạt backend
    if (window.electron && typeof window.electron.startBackend === 'function') {
      try {
        logTrace("[ensureLocalEngineRunning] Gửi yêu cầu khởi chạy engine chạy ngầm...");
        await window.electron.startBackend();
        
        // 3. Vòng lặp kiểm tra ping tối đa 15 giây
        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 800);
            const checkRes = await fetch(`${host}/health`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (checkRes.ok) {
              logTrace("[ensureLocalEngineRunning] Engine chạy ngầm đã khởi động thành công và phản hồi!");
              
              // Đồng bộ cấu hình thiết bị phần cứng sau khi khởi động thành công
              const pref = localStorage.getItem('tts_device_pref') || 'auto';
              fetch(`${host}/set_device`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device: pref })
              }).catch(() => {});
              
              return true;
            }
          } catch (err) {
            // Tiếp tục kiểm tra
          }
        }
        logTrace("[ensureLocalEngineRunning] Hết thời gian chờ kích hoạt engine ngầm (15 giây).");
      } catch (err) {
        logTrace(`[ensureLocalEngineRunning] Lỗi khi gọi khởi chạy: ${err.message}`);
      }
    }
    
    return false;
  };

  // Đồng bộ cấu hình CPU/GPU (device) từ localStorage với Local TTS Server khi khởi động trình phát (chỉ trên Native App)
  useEffect(() => {
    const isNativeApp = window.electron || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (!isNativeApp) return;

    const host = getLocalTtsHost();
    const pref = localStorage.getItem('tts_device_pref') || 'auto';
    fetch(`${host}/set_device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device: pref })
    }).catch(() => {});

    // Kích hoạt engine tự động nếu người dùng chọn Local Engine
    if (ttsEngine === 'local') {
      ensureLocalEngineRunning();
    }
  }, [ttsEngine]);

  useEffect(() => {
    if (ttsEngine === 'matcha' && !matchaApiKey) {
      api.get('/api/developer/keys').then(res => {
        if (res.data && res.data.keys && res.data.keys.length > 0) {
          const key = res.data.keys[0].api_key;
          setMatchaApiKey(key);
          localStorage.setItem('local_tts_api_key', key);
        }
      }).catch(e => {
        console.log("No user developer keys found (probably not logged in or doesn't have keys)");
      });
    }
  }, [ttsEngine, matchaApiKey]);

  // Load browser speech voices on mount
  useEffect(() => {
    if (!isSpeechSynthesisAvailable()) return;
    const loadVoices = () => {
      if (!synthRef.current) return;
      const allVoices = synthRef.current.getVoices();
      setVoices(allVoices);
      
      // Default to Vietnamese or first found voice
      const viVoice = allVoices.find(v => v.lang.includes('vi') || v.lang.includes('VI'));
      if (viVoice) {
        setSelectedVoiceName(viVoice.name);
      } else if (allVoices.length > 0) {
        setSelectedVoiceName(allVoices[0].name);
      }
    };

    loadVoices();
    if (synthRef.current && synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      stopSpeaking();
    };
  }, []);

  // Save selected settings to localStorage on change
  const handleSaveEngine = (engine) => {
    setTtsEngine(engine);
    localStorage.setItem('local_tts_engine', engine);
  };

  const handleSaveApiKey = (val) => {
    setMatchaApiKey(val);
    localStorage.setItem('local_tts_api_key', val);
  };

  const handleSaveVoice = (val) => {
    setMatchaVoice(val);
    localStorage.setItem('local_tts_voice', val);
  };

  const handleSaveRate = (val) => {
    setRate(val);
    try {
      const stored = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      stored.audioSpeed = val;
      localStorage.setItem('translationSettings', JSON.stringify(stored));
      window.dispatchEvent(new CustomEvent('translationSettingsUpdated', { detail: stored }));
    } catch (e) {
      console.error(e);
    }
  };

  // Real-time speed adjustment (does not restart Matcha playback!)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    if (audioCacheRef.current) {
      Object.values(audioCacheRef.current).forEach(audio => {
        if (audio instanceof Audio) {
          audio.playbackRate = rate;
        }
      });
    }
  }, [rate]);

  // Restart speech ONLY when chapter/book signature ACTUALLY changes
  const lastBookSignatureRef = useRef('');

  useEffect(() => {
    if (!book) {
      stopSpeaking();
      lastBookSignatureRef.current = '';
      return;
    }

    const currentSig = `${book.id || ''}_${book.chapterIdx ?? ''}_${book.tabId || ''}_${(book.title_vietphrase || book.title || '').trim()}_${(book.description || '').trim().slice(0, 100)}`;

    // Nếu nội dung chương/sách vẫn giống hệt chương đang phát, KHÔNG dừng, KHÔNG reset
    if (lastBookSignatureRef.current === currentSig) {
      return;
    }

    // Sang chương mới hoặc sách mới thực sự -> Bắt đầu phát chương mới từ câu 0
    lastBookSignatureRef.current = currentSig;
    userPausedRef.current = false;
    speakContent();
  }, [book?.id, book?.chapterIdx, book?.tabId, book?.title, book?.title_vietphrase, book?.description]);

  // Điều chỉnh giọng đọc hoặc Engine khi người dùng chủ động đổi trong Menu Cài đặt
  const lastVoiceSettingsRef = useRef({ engine: ttsEngine, voice: matchaVoice, browserVoice: selectedVoiceName, rate });
  useEffect(() => {
    if (
      lastVoiceSettingsRef.current.engine !== ttsEngine ||
      lastVoiceSettingsRef.current.voice !== matchaVoice ||
      lastVoiceSettingsRef.current.browserVoice !== selectedVoiceName ||
      lastVoiceSettingsRef.current.rate !== rate
    ) {
      logTrace(`[TTS Config Changed] Đổi cấu hình TTS: engine=${ttsEngine}, voice=${matchaVoice}/${selectedVoiceName}, rate=${rate}`);
      lastVoiceSettingsRef.current = { engine: ttsEngine, voice: matchaVoice, browserVoice: selectedVoiceName, rate };
      
      // Dọn sạch toàn bộ cache cũ để nạp mới theo giọng/engine/tốc độ mới ngay lập tức
      if (audioCacheRef.current) {
        Object.values(audioCacheRef.current).forEach(a => {
          if (a) {
            cleanupAudio(a);
            if (a.src && a.src.startsWith('blob:')) URL.revokeObjectURL(a.src);
          }
        });
        audioCacheRef.current = {};
      }
      prefetchQueueRef.current = new Set();
      triggeredIndicesRef.current.clear();

      if (sentencesRef.current.length > 0 && isPlaying) {
        seekToSentence(currentSentenceIdxRef.current);
      }
    }
  }, [ttsEngine, matchaVoice, selectedVoiceName, rate]);

  // Active Playback Watchdog: Tự động giám sát, phát hiện và khôi phục khi audio bị đứng/đơ/nghẽn bất thường
  useEffect(() => {
    const watchdogInterval = setInterval(() => {
      // Bỏ qua nếu người dùng chủ động bấm Tạm dừng
      if (userPausedRef.current) return;
      if (ttsEngine !== 'matcha' && ttsEngine !== 'local') return;
      if (!sentencesRef.current || sentencesRef.current.length === 0) return;
      
      const currentIdx = currentSentenceIdxRef.current;
      if (currentIdx >= sentencesRef.current.length) return;

      const activeAudio = audioRef.current;
      const now = Date.now();

      // TH1: Audio tồn tại nhưng bị paused bất thường (trong khi user không hề bấm tạm dừng)
      if (activeAudio && activeAudio.paused && !activeAudio.ended && !isLoading) {
        logTrace(`[Watchdog] Phát hiện audio câu idx=${currentIdx} bị paused bất thường. Đang tự động khôi phục play()...`);
        activeAudio.play().catch(err => {
          logTrace(`[Watchdog] Khôi phục play() lỗi: ${err.message}. Nạp lại câu...`);
          playMatchaSentence(currentIdx, playSessionIdRef.current);
        });
        return;
      }

      // TH2: Audio đã kết thúc (ended) hoặc sắp hết nhưng Chromium nuốt chửng sự kiện onended
      if (activeAudio && (activeAudio.ended || (activeAudio.duration && activeAudio.currentTime >= activeAudio.duration - 0.05))) {
        if (!triggeredIndicesRef.current.has(currentIdx)) {
          logTrace(`[Watchdog] Phát hiện audio câu idx=${currentIdx} đã kết thúc nhưng triggerNext chưa chạy. Tự động kích hoạt chuyển câu...`);
          if (typeof triggerNextRef.current === 'function') {
            triggerNextRef.current(currentIdx);
          }
        } else {
          logTrace(`[Watchdog] Câu idx=${currentIdx} đã ended nhưng luồng bị kẹt. Cưỡng chế chuyển sang câu idx=${currentIdx + 1}...`);
          cleanupAudio(activeAudio);
          audioRef.current = null;
          playMatchaSentence(currentIdx + 1, playSessionIdRef.current);
        }
        return;
      }

      // TH3: Audio đang play nhưng currentTime bị đứng im quá 3.5 giây (Chromium audio context/buffer freeze)
      if (activeAudio && !activeAudio.paused && !activeAudio.ended && !isLoading) {
        const timeDiff = now - lastPlaybackProgressTimeRef.current;
        if (timeDiff > 3500) {
          logTrace(`[Watchdog] Âm thanh bị kẹt khung hình (${timeDiff}ms). Tự động reset và phát lại câu idx=${currentIdx}...`);
          lastPlaybackProgressTimeRef.current = now;
          cleanupAudio(activeAudio);
          audioRef.current = null;
          playMatchaSentence(currentIdx, playSessionIdRef.current);
          return;
        }
      }

      // TH4: Không có activeAudio, không isLoading nhưng đang trong trạng thái isPlaying (bị rỗng luồng)
      if (!activeAudio && !isLoading && isPlaying) {
        logTrace(`[Watchdog] Phát hiện luồng âm thanh rỗng ở câu idx=${currentIdx}. Tự động khôi phục phát tiếp...`);
        playMatchaSentence(currentIdx, playSessionIdRef.current);
      }
    }, 1200);

    return () => clearInterval(watchdogInterval);
  }, [ttsEngine, isLoading, isPlaying]);

  const fetchMatchaAudio = async (idx, targetSessionId = null, retryCount = 2) => {
    const expectedSession = targetSessionId !== null ? targetSessionId : playSessionIdRef.current;
    if (idx >= sentencesRef.current.length) return null;
    
    // Check cache
    if (audioCacheRef.current[idx]) {
      return audioCacheRef.current[idx];
    }

    const rawText = sentencesRef.current[idx] || '';
    let textToSend = rawText.trim();
    // Bỏ ngoặc kép thừa ở đầu/cuối câu để mô hình TTS không bị nghẹn, nuốt âm hay bỏ qua
    const cleanWord = textToSend.replace(/^[“"'\s«『「]+|[”"'\s»』」]+$/gu, '').trim();
    if (cleanWord) {
      textToSend = cleanWord;
    }
    // Đảm bảo có dấu ngắt câu để mô hình TTS phát âm chuẩn và rõ ràng
    if (textToSend && !/[.!?…:;]$/.test(textToSend)) {
      textToSend += '.';
    }
    logTrace(`[fetchMatchaAudio] Bắt đầu tải câu idx=${idx} (Độ dài: ${textToSend.length} ký tự): "${textToSend.substring(0, 30)}..."`);
    
    // Nếu câu toàn chữ Hán chưa kịp dịch sang tiếng Việt, gửi cho server để sinh âm thanh êm 0.2s tự động lướt qua
    const isPureChinese = /^[\u4e00-\u9fa5\s.,!?:;…""'']+$/u.test(textToSend);
    if (isPureChinese && ttsEngine === 'local') {
      logTrace(`[fetchMatchaAudio] Câu tiếng Trung idx=${idx}: "${textToSend.substring(0, 20)}...", gửi tới server để sinh âm thanh lướt nhanh.`);
    }

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        let audioUrl;
        
        if (ttsEngine === 'local') {
          // Gọi API offline chạy cục bộ với Timeout 2.5 giây chống treo
          const host = getLocalTtsHost();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          let response;
          try {
            response = await fetch(`${host}/synthesize`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: textToSend,
                speed: 1.0 // Client control playbackRate
              }),
              signal: controller.signal
            });
          } finally {
            clearTimeout(timeoutId);
          }
          
          if (!response.ok) {
            throw new Error(`Local engine HTTP error: ${response.status}`);
          }
          
          const blob = await response.blob();
          audioUrl = URL.createObjectURL(blob);
        } else if (ttsEngine === 'matcha') {
          // Gọi API Matcha Đám mây (Cloud)
          const res = await api.post('/v1/audio/speech', {
            input: textToSend,
            speed: 1.0,
            voice: matchaVoice
          }, {
            responseType: 'blob',
            headers: {
              'Authorization': `Bearer ${matchaApiKey}`
            }
          });
          audioUrl = URL.createObjectURL(res.data);
        } else {
          // TTS Stream cho engine Browser trên môi trường không có SpeechSynthesisUtterance (như Android WebView)
          // 1. Ưu tiên gọi backend endpoint /api/tts/speak (Edge-TTS AI Neural Voice chất lượng cao, có CORS header đầy đủ)
          let blob = null;
          try {
            const res = await api.get('/api/tts/speak', {
              params: {
                text: textToSend.substring(0, 350),
                speed: rateRef.current || 1.0,
                voice: 'vi-VN-HoaiMyNeural'
              },
              responseType: 'blob',
              timeout: 3500
            });
            if (res && res.data && res.data.size > 100) {
              blob = res.data;
            }
          } catch(apiErr) {
            logTrace(`[fetchMatchaAudio] Gọi /api/tts/speak qua api thất bại: ${apiErr.message}`);
          }

          if (blob) {
            audioUrl = URL.createObjectURL(blob);
          } else {
            // 2. Dự phòng: Google TTS qua CapacitorHttp Native (Bypass hoàn toàn CORS trên Android)
            try {
              if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp) {
                const textParam = encodeURIComponent(textToSend.substring(0, 200));
                const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${textParam}`;
                const capRes = await window.Capacitor.Plugins.CapacitorHttp.get({
                  url: googleUrl,
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Referer': 'https://translate.google.com/'
                  },
                  responseType: 'blob'
                });
                if (capRes && capRes.data) {
                  let base64Data = capRes.data;
                  if (typeof base64Data === 'string') {
                    if (!base64Data.startsWith('data:')) {
                      base64Data = `data:audio/mpeg;base64,${base64Data}`;
                    }
                    audioUrl = base64Data;
                  }
                }
              }
            } catch (capErr) {
              logTrace(`[fetchMatchaAudio] CapacitorHttp Google fallback lỗi: ${capErr.message}`);
            }
          }

          if (!audioUrl) {
            throw new Error(`Không thể nạp âm thanh cho câu idx=${idx}`);
          }
        }

        // Kiểm tra xem phiên phát có bị hủy trong quá trình fetch không
        if (expectedSession !== playSessionIdRef.current) {
          logTrace(`[fetchMatchaAudio] Bỏ qua lưu cache câu idx=${idx} vì phiên đã thay đổi (${expectedSession} vs ${playSessionIdRef.current})`);
          if (audioUrl) {
            try { URL.revokeObjectURL(audioUrl); } catch(e){}
          }
          return null;
        }

        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        audio.load();

        if (expectedSession !== playSessionIdRef.current) {
          cleanupAudio(audio);
          if (audioUrl) {
            try { URL.revokeObjectURL(audioUrl); } catch(e){}
          }
          return null;
        }

        audioCacheRef.current[idx] = audio;
        logTrace(`[fetchMatchaAudio] Tải THÀNH CÔNG câu idx=${idx} sau ${attempt + 1} lần thử`);
        return audio;
      } catch (err) {
        logTrace(`[fetchMatchaAudio] Thử tải câu idx=${idx} lần ${attempt + 1} THẤT BẠI: ${err.message}`);
        if (attempt === retryCount) {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const prefetchMatchaSentence = (idx, targetSessionId = null) => {
    const expectedSession = targetSessionId !== null ? targetSessionId : playSessionIdRef.current;
    if (idx >= sentencesRef.current.length || idx < 0) return;
    if (audioCacheRef.current[idx] || prefetchQueueRef.current.has(idx)) return;

    logTrace(`[prefetch] Thêm câu idx=${idx} vào hàng đợi tải trước (Session: ${expectedSession})`);
    prefetchQueueRef.current.add(idx);
    fetchMatchaAudio(idx, expectedSession)
      .then(() => {
        prefetchQueueRef.current.delete(idx);
        logTrace(`[prefetch] Đã tải trước xong câu idx=${idx}`);
      })
      .catch(err => {
        logTrace(`[prefetch] Tải trước câu idx=${idx} THẤT BẠI: ${err.message}`);
        prefetchQueueRef.current.delete(idx);
      });
  };

  const evictCache = (currentIdx) => {
    const minKeep = currentIdx - 5;
    const maxKeep = currentIdx + 30;
    if (audioCacheRef.current) {
      Object.keys(audioCacheRef.current).forEach((keyStr) => {
        const keyIdx = parseInt(keyStr);
        if (keyIdx < minKeep || keyIdx > maxKeep) {
          const audio = audioCacheRef.current[keyIdx];
          if (audio) {
            try {
              audio.pause();
              if (audio.src) {
                URL.revokeObjectURL(audio.src);
              }
            } catch (e) {}
            delete audioCacheRef.current[keyIdx];
            prefetchQueueRef.current.delete(keyIdx);
          }
        }
      });
    }
  };

  const cleanupAudio = (aud) => {
    if (!aud) return;
    try {
      aud.onplay = null;
      aud.onplaying = null;
      aud.onpause = null;
      aud.onended = null;
      aud.ontimeupdate = null;
      aud.onerror = null;
      aud.pause();
    } catch (e) {}
  };

  const emitBoundary = (currentIdx) => {
    if (typeof book?.onBoundary === 'function' && sentencesRef.current && sentencesRef.current[currentIdx]) {
      let estimatedCharIdx = 0;
      for (let i = 0; i < currentIdx; i++) {
        estimatedCharIdx += (sentencesRef.current[i] || '').length + 1;
      }
      book.onBoundary(estimatedCharIdx, sentencesRef.current[currentIdx] || '', currentIdx);
    }
  };

  const updateSmoothProgress = (aud, currentIdx) => {
    const sentences = sentencesRef.current;
    if (!sentences || sentences.length === 0) return;
    
    const CHARS_PER_SEC_AT_1X = 11.2;

    // Tính tổng số giây đã đọc của các câu trước tại tốc độ gốc 1.0x
    const preChars = sentences.slice(0, currentIdx).reduce((acc, s) => acc + (s?.length || 0), 0);
    const preTime = preChars / CHARS_PER_SEC_AT_1X;

    // aud.currentTime là giây trên file âm thanh gốc (luôn là 1.0x track duration)
    let activeChunkTime = 0;
    if (aud) {
      activeChunkTime = aud.currentTime || 0;
    }
    
    // Tổng thời lượng chương ước tính ở tốc độ gốc 1.0x
    const totalChars = sentences.reduce((acc, s) => acc + (s?.length || 0), 0);
    const totalTime = totalChars / CHARS_PER_SEC_AT_1X;
    
    const currentTotalSec = preTime + activeChunkTime;
    
    setCurrentTimeSec(Math.min(totalTime, currentTotalSec));
    setProgress(Math.min(100, Math.round((currentTotalSec / Math.max(1, totalTime)) * 100)));
  };

  const playMatchaSentence = async (idx, sessionId = null) => {
    const mySessionId = sessionId !== null ? sessionId : playSessionIdRef.current;
    logTrace(`[playMatcha] Gọi phát câu idx=${idx} (Session ID: ${mySessionId})`);
    
    if (idx >= sentencesRef.current.length) {
      logTrace(`[playMatcha] Đã phát hết tất cả các câu trong chương. Chuyển chương tiếp theo...`);
      if (mySessionId !== playSessionIdRef.current) return;
      setIsPlaying(false);
      setProgress(100);
      if (book.isChapter && onNextChapter) {
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { message: '📖 Đã đọc xong chương. Đang tự động chuyển sang chương tiếp theo...', type: 'info' }
        }));
        onNextChapter();
      }
      return;
    }

    currentSentenceIdxRef.current = idx;
    evictCache(idx);
    emitBoundary(idx);
    
    // Calculate progress as fraction of played sentences
    setProgress(Math.round((idx / sentencesRef.current.length) * 100));

    // Define triggerNext and setupListeners at the beginning of the playback phase so they can be reused.
    const triggerNext = (currentIdx) => {
      if (triggeredIndicesRef.current.has(currentIdx)) return;
      
      // Chốt chặn phiên phát (Session Lock) & Chốt chặn chỉ số câu
      if (mySessionId !== playSessionIdRef.current || currentIdx !== currentSentenceIdxRef.current) {
        logTrace(`[playMatcha] Bỏ qua triggerNext của câu idx=${currentIdx} vì lệch phiên hoặc lệch chỉ số.`);
        return;
      }
      
      triggeredIndicesRef.current.add(currentIdx);
      logTrace(`[playMatcha] Kích hoạt triggerNext chuyển từ idx=${currentIdx} sang câu tiếp theo.`);

      const nextIdx = currentIdx + 1;
      const curSentence = (sentencesRef.current[currentIdx] || '').trim();
      const isShortWord = curSentence.length <= 15 || /[!?;:…]$/.test(curSentence);
      const breathPauseMs = isShortWord ? 280 : 0;

      const executeNext = () => {
        if (mySessionId !== playSessionIdRef.current || userPausedRef.current) return;

        if (nextIdx < sentencesRef.current.length) {
          const nextAudio = audioCacheRef.current[nextIdx];
          if (nextAudio) {
            logTrace(`[playMatcha] Câu tiếp theo idx=${nextIdx} ĐÃ CÓ trong cache. Tiến hành chuyển đổi liền mạch (Seamless)...`);
            if (audioRef.current) {
              cleanupAudio(audioRef.current);
            }
            audioRef.current = nextAudio;
            nextAudio.playbackRate = rateRef.current;
            nextAudio.defaultPlaybackRate = rateRef.current;
            
            setupListeners(nextAudio, nextIdx);

            nextAudio.play()
              .then(() => {
                if (mySessionId !== playSessionIdRef.current) {
                  logTrace(`[playMatcha] Hủy phát câu tiếp theo idx=${nextIdx} vì lệch phiên.`);
                  try { nextAudio.pause(); } catch(e){}
                  return;
                }
                logTrace(`[playMatcha] Phát thành công câu tiếp theo idx=${nextIdx} qua chế độ Seamless`);
                nextAudio.playbackRate = rateRef.current;
                nextAudio.defaultPlaybackRate = rateRef.current;
                lastPlaybackProgressTimeRef.current = Date.now();
                lastPlaybackPositionRef.current = nextAudio.currentTime;
              })
              .catch(e => {
                logTrace(`[playMatcha] Gọi phát câu Seamless idx=${nextIdx} THẤT BẠI: ${e.message}. Tự động kích hoạt khôi phục...`);
                if (mySessionId !== playSessionIdRef.current || userPausedRef.current) return;
                setTimeout(() => {
                  if (mySessionId === playSessionIdRef.current && !userPausedRef.current) {
                    logTrace(`[playMatcha] Tự động thử lại phát câu idx=${nextIdx}...`);
                    playMatchaSentence(nextIdx, mySessionId);
                  }
                }, 300);
              });

            currentSentenceIdxRef.current = nextIdx;
            emitBoundary(nextIdx);
            setProgress(Math.round((nextIdx / sentencesRef.current.length) * 100));
            evictCache(nextIdx);
            for (let offset = 1; offset <= 2; offset++) {
              prefetchMatchaSentence(nextIdx + offset);
            }
            return;
          }
        }
        logTrace(`[playMatcha] Câu tiếp theo idx=${nextIdx} chưa có cache hoặc hết chương. Gọi playMatchaSentence(${nextIdx}) bình thường.`);
        playMatchaSentence(currentIdx + 1, mySessionId);
      };

      if (breathPauseMs > 0) {
        setTimeout(executeNext, breathPauseMs);
      } else {
        executeNext();
      }
    };

    triggerNextRef.current = triggerNext;

    const setupListeners = (aud, currentIdx) => {
      aud.onplay = () => {
        if (mySessionId !== playSessionIdRef.current) {
          logTrace(`[playMatcha] Hủy sự kiện onplay của idx=${currentIdx} vì lệch phiên phát.`);
          try { aud.pause(); } catch(e){}
          return;
        }
        logTrace(`[playMatcha] [Audio Event] Đang phát câu idx=${currentIdx} (Tốc độ mong muốn: ${rateRef.current}x, Tốc độ thực tế: ${aud.playbackRate}x)`);
        delete sentenceRetryCountRef.current[currentIdx];
        setIsLoading(false);
        setIsPlaying(true);
        aud.playbackRate = rateRef.current;
        aud.defaultPlaybackRate = rateRef.current;
        lastPlaybackProgressTimeRef.current = Date.now();
        lastPlaybackPositionRef.current = aud.currentTime;

        // Emit onBoundary for AI Audio
        emitBoundary(currentIdx);

        updateSmoothProgress(aud, currentIdx);
      };

      aud.onplaying = () => {
        if (mySessionId !== playSessionIdRef.current) {
          try { aud.pause(); } catch(e){}
          return;
        }
        setIsLoading(false);
        setIsPlaying(true);
        aud.playbackRate = rateRef.current;
        aud.defaultPlaybackRate = rateRef.current;
        lastPlaybackProgressTimeRef.current = Date.now();
        lastPlaybackPositionRef.current = aud.currentTime;
      };

      aud.oncanplay = () => {
        if (!userPausedRef.current && mySessionId === playSessionIdRef.current) {
          setIsLoading(false);
        }
      };

      aud.oncanplaythrough = () => {
        if (!userPausedRef.current && mySessionId === playSessionIdRef.current) {
          setIsLoading(false);
        }
      };

      aud.onwaiting = () => {
        logTrace(`[playMatcha] [Audio Event] Đang chờ nạp đệm dữ liệu (onwaiting) ở câu idx=${currentIdx}`);
        if (!userPausedRef.current && mySessionId === playSessionIdRef.current && aud.readyState < 2) {
          setIsLoading(true);
        }
      };

      aud.onstalled = () => {
        logTrace(`[playMatcha] [Audio Event] Âm thanh bị nghẽn (onstalled) ở câu idx=${currentIdx}. Tự động chuẩn bị hồi phục...`);
        if (!userPausedRef.current && mySessionId === playSessionIdRef.current) {
          setTimeout(() => {
            if (!userPausedRef.current && mySessionId === playSessionIdRef.current && aud.paused && !aud.ended) {
              logTrace(`[playMatcha] Tự động kick-start lại audio bị stalled ở câu idx=${currentIdx}`);
              aud.play().catch(e => logTrace(`[playMatcha] Kick-start stalled thất bại: ${e.message}`));
            }
          }, 500);
        }
      };

      aud.onpause = () => {
        logTrace(`[playMatcha] [Audio Event] Tạm dừng câu idx=${currentIdx} (userPaused: ${userPausedRef.current})`);
        if (userPausedRef.current) {
          setIsPlaying(false);
        } else {
          logTrace(`[playMatcha] Phát hiện audio bị dừng ngoài ý muốn! Tự động khôi phục sau 350ms...`);
          setTimeout(() => {
            if (!userPausedRef.current && mySessionId === playSessionIdRef.current && aud.paused && !aud.ended) {
              logTrace(`[playMatcha] Tự động khôi phục phát lại câu idx=${currentIdx}`);
              aud.play().catch(err => {
                logTrace(`[playMatcha] Tự động khôi phục lỗi: ${err.message}. Nạp lại câu...`);
                playMatchaSentence(currentIdx, mySessionId);
              });
            }
          }, 350);
        }
      };

      aud.onended = () => {
        logTrace(`[playMatcha] [Audio Event] Đã phát xong câu idx=${currentIdx} (onended)`);
        triggerNext(currentIdx);
      };

      aud.ontimeupdate = () => {
        if (Math.abs(aud.currentTime - lastPlaybackPositionRef.current) > 0.05) {
          lastPlaybackPositionRef.current = aud.currentTime;
          lastPlaybackProgressTimeRef.current = Date.now();
        }
        const nextIdx = currentIdx + 1;
        const nextAudio = audioCacheRef.current[nextIdx];
        const curSentence = (sentencesRef.current[currentIdx] || '').trim();
        const isShortWord = curSentence.length <= 15 || /[!?;:…]$/.test(curSentence);
        // Tuyệt đối KHÔNG gối đầu nếu là câu ngắn (duration <= 1.4s hoặc chuỗi <= 15 ký tự).
        // Cho câu ngắn phát 100% trọn vẹn đến khi aud.onended nổ để không nuốt âm!
        if (nextAudio && aud.duration && aud.duration > 1.4 && !isShortWord && (aud.duration - aud.currentTime <= 0.08)) {
          triggerNext(currentIdx);
        }
        updateSmoothProgress(aud, currentIdx);
      };

      aud.onerror = (e) => {
        logTrace(`[playMatcha] [Audio Event] LỖI phát âm thanh ở câu idx=${currentIdx}: ${e.message || 'Unknown error'}`);
        if (mySessionId !== playSessionIdRef.current || currentIdx !== currentSentenceIdxRef.current) return;
        
        // Tự động giải phóng và ngắt các sự kiện của câu bị lỗi để tránh lồng giọng
        if (audioCacheRef.current[currentIdx]) {
          try {
            const oldAudio = audioCacheRef.current[currentIdx];
            oldAudio.pause();
            oldAudio.onplay = null;
            oldAudio.onplaying = null;
            oldAudio.onpause = null;
            oldAudio.onerror = null;
            oldAudio.onended = null;
            oldAudio.ontimeupdate = null;
            if (oldAudio.src && oldAudio.src.startsWith('blob:')) URL.revokeObjectURL(oldAudio.src);
          } catch(err) {}
          delete audioCacheRef.current[currentIdx];
        }

        const retryCount = (sentenceRetryCountRef.current[currentIdx] || 0) + 1;
        sentenceRetryCountRef.current[currentIdx] = retryCount;

        if (retryCount <= 2) {
          logTrace(`[playMatcha] Thử tải lại câu idx=${currentIdx} lần ${retryCount}/2 sau 500ms...`);
          setTimeout(() => {
            if (mySessionId === playSessionIdRef.current && currentIdx === currentSentenceIdxRef.current && !userPausedRef.current) {
              playMatchaSentence(currentIdx, mySessionId);
            }
          }, 500);
        } else {
          // Thử 2 lần vẫn lỗi: Triệt tiêu vòng xoay, cảnh báo và tự động nhảy tiếp sang câu kế tiếp!
          logTrace(`[playMatcha] Câu idx=${currentIdx} thử ${retryCount} lần thất bại. Tự động bỏ qua và đọc câu tiếp theo.`);
          setIsLoading(false);
          delete sentenceRetryCountRef.current[currentIdx];
          window.dispatchEvent(new CustomEvent('app-toast', {
            detail: { message: '⚠️ Âm thanh câu hiện tại bị gián đoạn. Đang tiếp tục câu tiếp theo...', type: 'warning' }
          }));
          if (currentIdx + 1 < sentencesRef.current.length) {
            playMatchaSentence(currentIdx + 1, mySessionId);
          } else {
            setIsPlaying(false);
            if (book.isChapter && onNextChapter) onNextChapter();
          }
        }
      };
    };

    // If active audio is playing, pause it and clear listeners
    if (audioRef.current) {
      logTrace(`[playMatcha] Đang phát dở câu cũ. Giải phóng audio cũ.`);
      cleanupAudio(audioRef.current);
      audioRef.current = null;
    }

    let audio = audioCacheRef.current[idx];
    if (!audio) {
      logTrace(`[playMatcha] Câu idx=${idx} chưa có trong cache. Bật Loading và chờ tải...`);
      setIsLoading(true);
      try {
        audio = await fetchMatchaAudio(idx);
        
        // Chốt chặn phiên phát (Session Lock) & Chốt chặn chỉ số câu
        if (mySessionId !== playSessionIdRef.current || idx !== currentSentenceIdxRef.current) {
          logTrace(`[playMatcha] Hủy phát câu idx=${idx} vì phiên hoặc chỉ số câu đã thay đổi trong khi chờ tải.`);
          if (audio) {
            try { audio.pause(); } catch(e){}
            if (audio.src) URL.revokeObjectURL(audio.src);
          }
          return;
        }
      } catch (err) {
        logTrace(`[playMatcha] LỖI tải câu idx=${idx} từ server: ${err.message}`);
        if (mySessionId !== playSessionIdRef.current) return;
        setIsLoading(false);

        // Fallback to browser system TTS if local server or cloud is unreachable/erroring
        const hasBrowserVoices = isSpeechSynthesisAvailable() && synthRef.current && synthRef.current.getVoices().length > 0;
        if ((ttsEngine === 'local' || ttsEngine === 'matcha') && hasBrowserVoices &&
            (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch') || err.message.includes('status') || err.message.includes('HTTP') || err.message.includes('error'))) {
          logTrace(`[playMatcha] Engine ${ttsEngine} lỗi hoặc không có phản hồi. Tự động chuyển đổi dự phòng sang Trình duyệt (Browser Speech) để phát tiếp.`);
          setTtsEngine('browser');
          localStorage.setItem('local_tts_engine', 'browser');
          
          setTimeout(() => {
            if (mySessionId === playSessionIdRef.current) {
              const textToSpeak = sentencesRef.current.slice(idx).join(". ");
              const utterance = new SpeechSynthesisUtterance(textToSpeak);
              if (selectedVoiceName) {
                const voiceObj = voices.find(v => v.name === selectedVoiceName);
                if (voiceObj) utterance.voice = voiceObj;
              }
              utterance.rate = rate;
              utterance.pitch = pitch;
              utterance.onstart = () => setIsPlaying(true);
              utterance.onend = () => {
                setIsPlaying(false);
                if (book.isChapter && onNextChapter) onNextChapter();
              };
              utterance.onboundary = (event) => {
                 const approxCharIdx = event.charIndex;
                 const textLen = textToSpeak.length;
                 setProgress(Math.min(100, Math.round((approxCharIdx / textLen) * 100)));
              };
              utteranceRef.current = utterance;
              synthRef.current.speak(utterance);
            }
          }, 100);
          return;
        } else if (!hasBrowserVoices) {
          logTrace(`[playMatcha] Lỗi engine và không có voice trình duyệt để fallback. Sẽ giữ nguyên Local Engine.`);
        }

        // Chỉ phát tiếp câu sau nếu đây vẫn là câu hiện hành trong đúng phiên
        if (idx === currentSentenceIdxRef.current) {
          logTrace(`[playMatcha] Bỏ qua câu lỗi idx=${idx}, nhảy tiếp sang câu idx=${idx + 1}`);
          playMatchaSentence(idx + 1, mySessionId);
        }
        return;
      }
    }

    if (mySessionId !== playSessionIdRef.current) {
      logTrace(`[playMatcha] Hủy phát câu idx=${idx} do lệch phiên phát sau khi tải xong cache.`);
      return;
    }
    if (!audio) {
      logTrace(`[playMatcha] Câu idx=${idx} không có âm thanh hợp lệ. Tự động lướt tiếp sang câu idx=${idx + 1}`);
      setIsLoading(false);
      if (idx === currentSentenceIdxRef.current) {
        playMatchaSentence(idx + 1, mySessionId);
      }
      return;
    }
    setIsLoading(false);
    audioRef.current = audio;
    audio.playbackRate = rateRef.current;
    audio.defaultPlaybackRate = rateRef.current;

    setupListeners(audio, idx);

    logTrace(`[playMatcha] Bắt đầu gọi audio.play() cho câu idx=${idx}`);
    audio.play()
      .then(() => {
        if (mySessionId !== playSessionIdRef.current) {
          logTrace(`[playMatcha] Hủy audio.play() của câu idx=${idx} do lệch phiên phát sau khi gọi.`);
          try { audio.pause(); } catch(e){}
          return;
        }
        logTrace(`[playMatcha] audio.play() thành công cho câu idx=${idx}`);
        setIsLoading(false);
        setIsPlaying(true);
        audio.playbackRate = rateRef.current;
        audio.defaultPlaybackRate = rateRef.current;
        lastPlaybackProgressTimeRef.current = Date.now();
        lastPlaybackPositionRef.current = audio.currentTime;
      })
      .catch(e => {
        logTrace(`[playMatcha] audio.play() câu idx=${idx} bị ngắt hoặc chặn: ${e.message}`);
        // Chốt chặn phiên phát (Session Lock) & Chốt chặn chỉ số câu
        if (mySessionId !== playSessionIdRef.current || idx !== currentSentenceIdxRef.current) return;
        
        setIsLoading(false);
        if (userPausedRef.current) {
          setIsPlaying(false);
        }
        
        // Tự động giải phóng và ngắt các sự kiện của câu bị lỗi
        if (audioCacheRef.current[idx]) {
          try {
            const oldAudio = audioCacheRef.current[idx];
            oldAudio.pause();
            oldAudio.onplay = null;
            oldAudio.onplaying = null;
            oldAudio.onpause = null;
            oldAudio.onerror = null;
            oldAudio.onended = null;
            oldAudio.ontimeupdate = null;
            if (oldAudio.src) URL.revokeObjectURL(oldAudio.src);
          } catch(err) {}
          delete audioCacheRef.current[idx];
        }

        if (e.name === 'NotAllowedError') {
          logTrace(`[playMatcha] Autoplay bị hạn chế. Nhấn nút Play để phát tiếp.`);
          setIsPlaying(false);
          return;
        }

        if (!userPausedRef.current) {
          logTrace(`[playMatcha] Tự động thử lại phát câu idx=${idx} sau 600ms do play.catch...`);
          setTimeout(() => {
            if (mySessionId === playSessionIdRef.current && idx === currentSentenceIdxRef.current && !userPausedRef.current) {
              playMatchaSentence(idx, mySessionId);
            }
          }, 600);
        }
      });

    // Prefetch next 15 sentences in the background!
    for (let offset = 1; offset <= 15; offset++) {
      prefetchMatchaSentence(idx + offset);
    }
  };

  const speakContent = async (overrideEngine = null) => {
    stopSpeaking();
    userPausedRef.current = false;
    lastPlaybackProgressTimeRef.current = Date.now();

    const activeEngine = overrideEngine || ttsEngine;

    let titleText = (book.title_vietphrase || book.title || '').trim();
    const authorText = book.author_hanviet || book.author || '';
    const mainText = (book.description_vietphrase || book.description || '').trim();

    if (!titleText && !mainText) return;

    // Kiểm tra tính nhất quán: Nếu nội dung đã là tiếng Việt nhưng tiêu đề vẫn còn chữ Hán
    const mainIsVietnamese = /[a-zA-Z0-9\u00C0-\u1EF9]/.test(mainText.slice(0, 300));
    const titleHasChinese = /[\u4e00-\u9fa5]/.test(titleText);
    if (mainIsVietnamese && titleHasChinese) {
      logTrace(`[speakContent] Tiêu đề chứa chữ Hán trong khi nội dung đã dịch tiếng Việt. Tự động chuyển tiêu đề thành 'Chương truyện'.`);
      titleText = "Chương truyện";
    }

    let textToSpeak = "";
    if (book.isChapter) {
      const cleanTitle = titleText.trim();
      const titleWithPunct = /[.!?。！？]$/.test(cleanTitle) ? cleanTitle : `${cleanTitle}.`;
      if (cleanTitle && mainText) {
        // Bắt buộc phân tách bằng \n\n để tiêu đề và câu đầu truyện KHÔNG bị gộp dính làm một
        textToSpeak = `${titleWithPunct}\n\n${mainText.trim()}`;
      } else {
        textToSpeak = (cleanTitle || mainText).trim();
      }
    } else {
      textToSpeak = `Giới thiệu tác phẩm: ${titleText}. Tác giả: ${authorText}. Tóm tắt cốt truyện: ${mainText}. Hết phần tóm tắt.`;
    }

    // Phân đoạn văn bản tự nhiên theo dòng và câu để đảm bảo highlight hiển thị chuẩn xác
    const paragraphs = textToSpeak.split(/[\n\r]+/);
    const rawSentences = [];
    
    // Biểu thức chính quy phát hiện câu hợp lệ (phải có ít nhất 1 chữ cái hoặc chữ số, hỗ trợ toàn bộ Unicode tiếng Việt)
    const validTextRegex = /\p{L}|\p{N}/u;

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;
      
      const parts = trimmedPara.split(/([.!?。！？]+["”'’」]?\s*)/);
      let cur = "";
      for (let i = 0; i < parts.length; i++) {
        cur += parts[i];
        if (/[.!?。！？]/.test(parts[i]) || cur.length > 250) {
          if (cur.trim() && validTextRegex.test(cur.trim())) {
            rawSentences.push(cur.trim());
          }
          cur = "";
        }
      }
      if (cur.trim() && validTextRegex.test(cur.trim())) {
        rawSentences.push(cur.trim());
      }
    }

    if (rawSentences.length === 0) return;

    sentencesRef.current = rawSentences;
    let startIdx = 0;
    if (book.startSnippet) {
      const cleanSnippet = book.startSnippet.replace(/^["“'‘\s]+|["”'’\s]+$/g, '').slice(0, 30).toLowerCase();
      const matchIdx = rawSentences.findIndex(s => {
        const cleanS = s.toLowerCase();
        return cleanS.includes(cleanSnippet) || cleanSnippet.includes(cleanS.slice(0, 20));
      });
      if (matchIdx !== -1) {
        startIdx = matchIdx;
      }
    }
    if (startIdx === 0 && typeof book.startParaIdx === 'number' && book.paragraphs && book.paragraphs[book.startParaIdx]) {
      const paraText = book.paragraphs[book.startParaIdx].trim().toLowerCase().slice(0, 30);
      const matchIdx = rawSentences.findIndex(s => {
        const cleanS = s.toLowerCase();
        return cleanS.includes(paraText) || paraText.includes(cleanS.slice(0, 20));
      });
      if (matchIdx !== -1) {
        startIdx = matchIdx;
      }
    }
    if (startIdx === 0 && typeof book.startSentenceIdx === 'number') {
      startIdx = Math.max(0, Math.min(book.startSentenceIdx, rawSentences.length - 1));
    }
    currentSentenceIdxRef.current = startIdx;

    const useSentenceQueue = (activeEngine === 'matcha' || activeEngine === 'local' || (activeEngine === 'browser' && !isSpeechSynthesisAvailable()));

    if (useSentenceQueue) {
      if (activeEngine === 'matcha' && !matchaApiKey) {
        logTrace("[speakContent] Không có API Key Matcha. Tự động chuyển dự phòng sang Trình duyệt.");
        setIsLoading(false);
        setTtsEngine('browser');
        localStorage.setItem('local_tts_engine', 'browser');
        speakContent('browser');
        return;
      }

      if (activeEngine === 'local') {
        setIsLoading(true);
        const isRunning = await ensureLocalEngineRunning();
        if (!isRunning) {
          logTrace("[speakContent] Không khởi động được engine local. Tự động chuyển dự phòng sang Trình duyệt.");
          setIsLoading(false);
          setTtsEngine('browser');
          localStorage.setItem('local_tts_engine', 'browser');
          speakContent('browser');
          return;
        }
      }
      
      audioCacheRef.current = {};
      prefetchQueueRef.current = new Set();
      triggeredIndicesRef.current.clear();

      // Bật ngay highlight câu đầu tiên để người dùng thấy phản hồi tức thì
      emitBoundary(startIdx);

      if (activeEngine === 'local') {
        const host = getLocalTtsHost();
        fetch(`${host}/reset_prompt`, { method: 'POST' }).catch(() => {});
      }

      // Bật trạng thái Loading để người dùng biết hệ thống đang chuẩn bị bộ đệm
      setIsLoading(true);

      const currentSessionId = playSessionIdRef.current;

      // ƯU TIÊN TUYỆT ĐỐI: Nạp và phát ngay lập tức câu startIdx trong 0ms (Không để hàng đợi mạng bị chiếm)
      playMatchaSentence(startIdx, currentSessionId);

      // Sau 250ms chỉ nhẹ nhàng tải trước tối đa 2 câu kế tiếp
      setTimeout(() => {
        if (currentSessionId === playSessionIdRef.current && !userPausedRef.current) {
          prefetchMatchaSentence(startIdx + 1, currentSessionId);
          prefetchMatchaSentence(startIdx + 2, currentSessionId);
        }
      }, 250);
    } else {
      // Browser Synthesis Engine (Khi môi trường có SpeechSynthesisUtterance)
      if (!synthRef.current) {
        synthRef.current = window.speechSynthesis;
      }
      if (!synthRef.current) return;
      
      let browserTextToSpeak = textToSpeak;
      let sliceOffset = 0;
      if (startIdx > 0 && startIdx < rawSentences.length) {
        browserTextToSpeak = rawSentences.slice(startIdx).join(". ");
        for (let i = 0; i < startIdx; i++) {
          sliceOffset += rawSentences[i].length + 2; // +2 for ". "
        }
      }

      // Xóa sạch utterance cũ đang pending trong hàng đợi
      try {
        synthRef.current.cancel();
      } catch (err) {}

      const utterance = new SpeechSynthesisUtterance(browserTextToSpeak);
      
      if (selectedVoiceName) {
        const voiceObj = voices.find(v => v.name === selectedVoiceName);
        if (voiceObj) {
          utterance.voice = voiceObj;
        }
      } else {
        utterance.lang = 'vi-VN';
      }

      utterance.rate = rate;
      utterance.pitch = pitch;

      utterance.onstart = () => {
        setIsLoading(false);
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsLoading(false);
        setIsPlaying(false);
        setProgress(100);
        if (book.isChapter && onNextChapter) {
          onNextChapter();
        }
      };

      utterance.onerror = (e) => {
        setIsLoading(false);
        if (e.error !== 'interrupted') {
          console.error("Speech Synthesis Error:", e);
          setIsPlaying(false);
        }
      };

      utterance.onboundary = (event) => {
        if (event.name === 'word' || event.name === 'sentence') {
          const idx = event.charIndex + sliceOffset;
          let cum = 0;
          let matchedSentence = '';
          for (let si = 0; si < rawSentences.length; si++) {
            const nextCum = cum + rawSentences[si].length + 2;
            if (idx >= cum && idx < nextCum) {
              matchedSentence = rawSentences[si];
              currentSentenceIdxRef.current = si;
              break;
            }
            cum = nextCum;
          }
          if (typeof book.onBoundary === 'function') {
            book.onBoundary(idx, matchedSentence, currentSentenceIdxRef.current);
          }
          const totalLen = textToSpeak.length;
          if (totalLen > 0) {
            setProgress(Math.min(100, Math.round((idx / totalLen) * 100)));
          }
        }
      };

      utteranceRef.current = utterance;
      try {
        synthRef.current.speak(utterance);
        // Ngăn chặn trạng thái bị paused ngầm trên Chrome / Android WebView
        if (synthRef.current.paused) {
          synthRef.current.resume();
        }
        setIsPlaying(true);
      } catch (err) {
        console.error("Speech Synthesis speak error:", err);
      }
    }
  };

  const togglePlay = () => {
    logTrace(`[User Action] Nhấn nút Tạm dừng/Phát tiếp (togglePlay)`);
    const useSentenceQueue = (ttsEngine === 'matcha' || ttsEngine === 'local' || (ttsEngine === 'browser' && !isSpeechSynthesisAvailable()));

    if (useSentenceQueue) {
      if (isLoading) {
        logTrace(`[User Action] Đang Loading, người dùng bấm dừng lại.`);
        userPausedRef.current = true;
        setIsLoading(false);
        setIsPlaying(false);
        if (audioRef.current) {
          cleanupAudio(audioRef.current);
          audioRef.current = null;
        }
        return;
      }
      if (isPlaying) {
        logTrace(`[User Action] Tạm dừng âm thanh đang phát.`);
        userPausedRef.current = true;
        if (audioRef.current) {
          try { audioRef.current.pause(); } catch(e){}
        }
        setIsPlaying(false);
      } else {
        logTrace(`[User Action] Tiếp tục phát âm thanh.`);
        userPausedRef.current = false;
        lastPlaybackProgressTimeRef.current = Date.now();
        emitBoundary(currentSentenceIdxRef.current);
        
        const currentAudio = audioRef.current;
        if (currentAudio && !currentAudio.ended && currentAudio.currentTime > 0 && currentAudio.currentTime < currentAudio.duration) {
          currentAudio.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
              logTrace(`[togglePlay] resume audio thất bại: ${err.message}. Phát lại câu...`);
              playMatchaSentence(currentSentenceIdxRef.current);
            });
        } else {
          // Audio đã kết thúc hoặc chưa có: Phát câu hiện tại từ đầu
          if (sentencesRef.current.length > 0) {
            const currentIdx = currentSentenceIdxRef.current;
            triggeredIndicesRef.current.delete(currentIdx);
            if (currentAudio) {
              cleanupAudio(currentAudio);
              audioRef.current = null;
            }
            setIsLoading(true);
            playMatchaSentence(currentIdx);
          } else {
            speakContent();
          }
        }
      }
    } else {
      if (!synthRef.current) {
        synthRef.current = window.speechSynthesis;
      }
      if (!synthRef.current) return;
      if (isPlaying) {
        userPausedRef.current = true;
        try { synthRef.current.pause(); } catch(e){}
        setIsPlaying(false);
      } else {
        userPausedRef.current = false;
        lastPlaybackProgressTimeRef.current = Date.now();
        if (synthRef.current.paused && synthRef.current.speaking) {
          try { synthRef.current.resume(); } catch(e){}
          setIsPlaying(true);
        } else {
          speakContent();
        }
      }
    }
  };

  const stopSpeaking = () => {
    logTrace(`[stopSpeaking] Dừng phát toàn bộ và giải phóng tài nguyên. Session mới: ${playSessionIdRef.current + 1}`);
    userPausedRef.current = true;
    playSessionIdRef.current += 1;
    triggeredIndicesRef.current.clear();
    if (audioRef.current) {
      cleanupAudio(audioRef.current);
      audioRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    // Clean up cache object URLs to avoid memory leaks
    if (audioCacheRef.current) {
      Object.values(audioCacheRef.current).forEach(audio => {
        try {
          if (audio.src) {
            URL.revokeObjectURL(audio.src);
          }
        } catch (e) {}
      });
      audioCacheRef.current = {};
    }
    if (prefetchQueueRef.current) {
      prefetchQueueRef.current.clear();
    }
    sentencesRef.current = [];
    currentSentenceIdxRef.current = 0;
    
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    stopSpeaking();
    onClose && onClose();
  };

  // Lắng nghe sự kiện tua/nhảy đoạn toàn cục (Tap-to-read từ webview hoặc component khác)
  useEffect(() => {
    const handleGlobalSeek = (e) => {
      if (!e.detail) return;
      logTrace(`[Event: global-tts-seek] Nhận yêu cầu: ${JSON.stringify(e.detail)}`);

      // 1. Khớp chính xác theo chuỗi snippet của đoạn được tap / tâm ngắm chỉ định
      if (e.detail.sentenceSnippet || e.detail.sentenceText) {
        const rawSnippet = (e.detail.sentenceSnippet || e.detail.sentenceText).trim();
        const cleanSnippet = rawSnippet.replace(/^["“'‘\s]+|["”'’\s]+$/g, '').slice(0, 30).toLowerCase();
        if (cleanSnippet.length >= 3 && sentencesRef.current?.length > 0) {
          const matchIdx = sentencesRef.current.findIndex(s => {
            const cleanS = s.toLowerCase();
            return cleanS.includes(cleanSnippet) || cleanSnippet.includes(cleanS.slice(0, 20));
          });
          if (matchIdx !== -1) {
            logTrace(`[Event: global-tts-seek] Tìm thấy khớp chính xác theo snippet: idx=${matchIdx} ("${cleanSnippet}")`);
            seekToSentence(matchIdx);
            return;
          }
        }
      }

      // 2. Tìm theo paraIdx thông qua mapping danh sách paragraphs của book
      if (typeof e.detail.paraIdx === 'number' && sentencesRef.current?.length > 0) {
        const targetParaIdx = e.detail.paraIdx;
        if (book?.paragraphs && Array.isArray(book.paragraphs) && book.paragraphs[targetParaIdx]) {
          const targetParaText = book.paragraphs[targetParaIdx].trim().toLowerCase().slice(0, 30);
          if (targetParaText.length >= 3) {
            const matchIdx = sentencesRef.current.findIndex(s => {
              const cleanS = s.toLowerCase();
              return cleanS.includes(targetParaText) || targetParaText.includes(cleanS.slice(0, 20));
            });
            if (matchIdx !== -1) {
              logTrace(`[Event: global-tts-seek] Khớp đoạn paraIdx=${targetParaIdx} với câu sentenceIdx=${matchIdx}`);
              seekToSentence(matchIdx);
              return;
            }
          }
        }
      }

      // 3. Fallback theo sentenceIdx hoặc paraIdx trực tiếp
      if (typeof e.detail.sentenceIdx === 'number') {
        logTrace(`[Event: global-tts-seek] Nhảy trực tiếp đến câu idx=${e.detail.sentenceIdx}`);
        seekToSentence(e.detail.sentenceIdx);
      } else if (typeof e.detail.paraIdx === 'number') {
        const total = sentencesRef.current?.length || 0;
        if (total > 0) {
          const targetIdx = Math.max(0, Math.min(e.detail.paraIdx + (book?.title_vietphrase ? 1 : 0), total - 1));
          seekToSentence(targetIdx);
        }
      }
    };
    window.addEventListener('global-tts-seek', handleGlobalSeek);
    return () => window.removeEventListener('global-tts-seek', handleGlobalSeek);
  }, [book?.paragraphs, book?.title_vietphrase]);

  // Hàm điều hướng câu thông minh: dọn dẹp âm thanh cũ ngay lập tức và tăng Session ID để chống chồng chéo giọng
  const seekToSentence = (targetIdx) => {
    if (!sentencesRef.current || sentencesRef.current.length === 0) return;
    
    // Kẹp biên dưới: không thể tua lùi nhỏ hơn câu 0
    if (targetIdx < 0) {
      targetIdx = 0;
    }
    
    // Kẹp biên trên: tua vượt quá số câu trong chương sẽ kích hoạt chuyển chương sau
    if (targetIdx >= sentencesRef.current.length) {
      logTrace(`[seekToSentence] targetIdx=${targetIdx} >= ${sentencesRef.current.length}. Tự động chuyển chương kế tiếp.`);
      if (book.isChapter && onNextChapter) {
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { message: '📖 Đã đọc xong chương. Đang tự động chuyển sang chương tiếp theo...', type: 'info' }
        }));
        onNextChapter();
      }
      return;
    }

    userPausedRef.current = false;
    lastPlaybackProgressTimeRef.current = Date.now();
    currentSentenceIdxRef.current = targetIdx;

    // ĐÁNH DẤU ĐÚNG CHỖ NGAY LẬP TỨC TRÊN TRANG TRUYỆN!
    emitBoundary(targetIdx);
    setProgress(Math.round((targetIdx / sentencesRef.current.length) * 100));

    const useSentenceQueue = (ttsEngine === 'matcha' || ttsEngine === 'local' || (ttsEngine === 'browser' && !isSpeechSynthesisAvailable()));

    if (useSentenceQueue) {
      // 1. Dọn dẹp dứt khoát audio cũ đang phát để không bị lồng tiếng / vấp tiếng
      if (audioRef.current) {
        cleanupAudio(audioRef.current);
        audioRef.current = null;
      }
      // 2. Tăng Session ID để vô hiệu hóa tất cả các fetch đang bay trên mạng
      playSessionIdRef.current += 1;
      const newSessionId = playSessionIdRef.current;
      triggeredIndicesRef.current.clear();

      setIsLoading(true);

      // 3. ƯU TIÊN TUYỆT ĐỐI: Tải và phát ngay lập tức câu targetIdx được chỉ định
      playMatchaSentence(targetIdx, newSessionId);

      // 4. Chỉ tải trước 2 câu kế tiếp sau khi đã khởi động tải câu chính 200ms
      setTimeout(() => {
        if (newSessionId === playSessionIdRef.current && !userPausedRef.current) {
          prefetchMatchaSentence(targetIdx + 1, newSessionId);
          prefetchMatchaSentence(targetIdx + 2, newSessionId);
        }
      }, 200);
    } else {
      if (!isSpeechSynthesisAvailable()) return;
      // Browser TTS seeking
      const textToSpeak = (book.isChapter ? `${book.title_vietphrase}. ${book.description}` : book.description) || "";
      const approxCharPerSentence = textToSpeak.length / (sentencesRef.current.length || 1);
      const nextIndex = Math.floor(targetIdx * approxCharPerSentence);

      stopSpeaking();
      const utterance = new SpeechSynthesisUtterance(textToSpeak.slice(nextIndex));
      if (selectedVoiceName) {
        const voiceObj = voices.find(v => v.name === selectedVoiceName);
        if (voiceObj) utterance.voice = voiceObj;
      }
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        if (book.isChapter && onNextChapter) onNextChapter();
      };
      utterance.onboundary = (event) => {
        const idx = nextIndex + event.charIndex;
        const totalLen = textToSpeak.length;
        setProgress(Math.min(100, Math.round((idx / totalLen) * 100)));
      };
      utteranceRef.current = utterance;
      try {
        synthRef.current.speak(utterance);
        if (synthRef.current.paused) synthRef.current.resume();
        setIsPlaying(true);
      } catch (e) {}
    }
  };

  const skipForward = () => {
    seekToSentence(currentSentenceIdxRef.current + 1);
  };

  const skipBackward = () => {
    seekToSentence(currentSentenceIdxRef.current - 1);
  };

  // Click & Touch handler để tua câu nhanh (hỗ trợ cả chạm vuốt trên mobile mà không kích hoạt kéo panel)
  const calculateSeekTarget = (clientX, rect) => {
    if (!sentencesRef.current || sentencesRef.current.length === 0) return -1;
    const clickX = clientX - rect.left;
    const width = rect.width;
    if (width <= 0) return -1;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    return Math.min(sentencesRef.current.length - 1, Math.floor(percentage * sentencesRef.current.length));
  };

  const handleSeekBarClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const targetIdx = calculateSeekTarget(e.clientX, rect);
    if (targetIdx >= 0) {
      logTrace(`[SeekBar Click] Tua trực tiếp đến câu idx=${targetIdx}`);
      seekToSentence(targetIdx);
    }
  };

  const handleSeekBarTouch = (e) => {
    e.stopPropagation();
    const touch = e.touches[0] || (e.changedTouches && e.changedTouches[0]);
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const targetIdx = calculateSeekTarget(touch.clientX, rect);
    if (targetIdx >= 0) {
      logTrace(`[SeekBar Touch] Vuốt tua trên mobile đến câu idx=${targetIdx}`);
      seekToSentence(targetIdx);
    }
  };

  const totalSentences = sentencesRef.current?.length || 0;
  const currentSentenceDisplay = Math.min(currentSentenceIdxRef.current + 1, totalSentences);

  const getSafeStyle = () => {
    if (!position) return {};
    
    const el = playerElRef.current;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const targetWidth = isMinimized ? 240 : (isMobile ? Math.min(320, window.innerWidth - 20) : 320);
    const targetHeight = isMinimized ? 52 : (showSettings ? 385 : 210);
    const currentHeight = el ? el.offsetHeight : targetHeight;
    
    // Clamp coordinates on first render and subsequent renders to prevent out-of-bounds rendering
    // Trên mobile, thanh Bottom Nav cao 64px, nên minSafeBottom phải ít nhất 76px để luôn nổi trên thanh đáy
    const minSafeBottom = isMobile ? 76 : 16;
    const safeLeft = Math.max(10, Math.min(position.x, window.innerWidth - targetWidth - 10));
    const maxSafeBottom = Math.max(minSafeBottom, window.innerHeight - currentHeight - 56);
    const safeBottom = Math.max(minSafeBottom, Math.min(position.y, maxSafeBottom));
    
    return {
      left: `${safeLeft}px`,
      bottom: `${safeBottom}px`,
      top: 'auto',
      right: 'auto',
      position: 'fixed',
      WebkitAppRegion: 'no-drag'
    };
  };

  const dragStyle = position ? getSafeStyle() : {};

  if (isMinimized) {
    return (
      <div 
        ref={playerElRef}
        style={{ ...dragStyle, minWidth: 260, WebkitAppRegion: 'no-drag' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100050] bg-[#121225]/97 border border-purple-500/40 rounded-2xl px-3.5 py-2 shadow-2xl flex items-center gap-2.5 cursor-grab active:cursor-grabbing hover:border-purple-400 transition-colors duration-200 select-none max-w-[92vw]"
      >
        {/* Click background to expand */}
        <div 
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
          onClick={() => { if (draggedRef.current) { draggedRef.current = false; return; } setIsMinimized(false); }}
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
            {totalTimeSec > 0 && (
              <span className="text-[8px] text-purple-400 font-mono">
                {formatTime(currentTimeSec)} / {formatTime(totalTimeSec)}
              </span>
            )}
          </div>
        </div>

        {/* Minimized Controls */}
        <div className="flex items-center gap-1 shrink-0 no-drag" onMouseDown={e => e.stopPropagation()}>
          {onPrevChapter && (
            <button onClick={(e) => { e.stopPropagation(); onPrevChapter(); }} className="p-1 text-slate-400 hover:text-white transition-colors" title="Chương trước">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            onTouchEnd={(e) => { e.stopPropagation(); }}
            className="p-1.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-full transition-all active:scale-95 touch-manipulation cursor-pointer select-none"
            title={isPlaying ? "Tạm dừng" : "Phát tiếp"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current translate-x-[0.5px]" />}
          </button>
          {onNextChapter && (
            <button onClick={(e) => { e.stopPropagation(); onNextChapter(); }} className="p-1 text-slate-400 hover:text-white transition-colors" title="Chương tiếp">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm8.5-6L18 18V6z"/></svg>
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); handleClose(); }} 
            className="p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-white ml-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={playerElRef}
      style={{ ...dragStyle, WebkitAppRegion: 'no-drag' }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100050] bg-[#0d0e17]/95 border border-purple-500/40 backdrop-blur-xl rounded-2xl p-2.5 sm:p-3 shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex flex-col gap-2 w-[340px] max-w-[92vw] animate-in fade-in slide-in-from-bottom-3 duration-250 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Header Bar */}
      <div className="flex justify-between items-center select-none pb-1 border-b border-white/5">
        <span className="text-[8.5px] text-purple-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-purple-400 shrink-0" /> 
          <span className="truncate max-w-[140px]">{book.isChapter ? 'ĐANG ĐỌC CHƯƠNG...' : 'NGHE TÓM TẮT...'}</span>
        </span>
        <div className="flex items-center gap-0.5">
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
        {book.cover ? (
          <img
            src={book.cover}
            alt="cover"
            className={`w-9 h-12 object-cover rounded-lg border border-white/10 shadow-sm shrink-0 bg-[#07080e] ${isPlaying ? 'animate-pulse' : ''}`}
            onError={(e) => { e.target.remove(); }}
          />
        ) : (
          <div className={`w-9 h-12 rounded-lg border border-white/10 bg-[#07080e] flex items-center justify-center text-slate-500 shrink-0 ${isPlaying ? 'ring-1.5 ring-purple-500/40' : ''}`}>
            <Music className="w-4 h-4 text-purple-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-white text-[11px] font-bold truncate leading-tight">{book.title_vietphrase || book.title}</h4>
          <p className="text-[9px] text-slate-400 truncate mt-0.5">✍ {book.author_hanviet || book.author || '—'}</p>
          
          {/* Click & Touch-seekable Progress Bar */}
          <div 
            onClick={handleSeekBarClick}
            onTouchStart={handleSeekBarTouch}
            onTouchMove={handleSeekBarTouch}
            className="w-full bg-[#07080e] rounded-full h-2 mt-1.5 relative overflow-hidden cursor-pointer group no-drag touch-none"
            title="Click hoặc vuốt để tua câu nhanh"
          >
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-150 relative pointer-events-none"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md transition-opacity -mr-1" />
            </div>
          </div>
          
          {/* Time & Sentence displays */}
          <div className="flex justify-between items-center text-[7.5px] text-slate-400 mt-1 font-mono">
            <span>{formatTime(currentTimeSec)}</span>
            {totalSentences > 0 ? (
              <span className="text-purple-300/80 font-sans font-semibold">Câu {currentSentenceDisplay}/{totalSentences}</span>
            ) : (
              <span className="text-slate-400">{progress}%</span>
            )}
            <span>{formatTime(totalTimeSec)}</span>
          </div>
        </div>
      </div>

      {/* Speech Settings Sub-panel */}
      {showSettings && (
        <div className="bg-[#07080e]/95 border border-white/10 rounded-xl p-2 text-[9px] space-y-2 animate-in fade-in duration-150 max-h-[180px] overflow-y-auto">
          {/* Engine Selector */}
          <div className="space-y-1">
            <label className="text-slate-400 font-bold block text-[8.5px]">Động cơ đọc (TTS Engine):</label>
            <div className="grid grid-cols-3 gap-1 bg-[#121225] p-0.5 rounded-lg border border-[#1f1f3a]">
              <button
                type="button"
                onClick={() => handleSaveEngine('browser')}
                className={`py-1 rounded text-[9.5px] font-bold transition-all ${ttsEngine === 'browser' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Trình duyệt
              </button>
              <button
                type="button"
                onClick={() => handleSaveEngine('matcha')}
                className={`py-1 rounded text-[9.5px] font-bold transition-all ${ttsEngine === 'matcha' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Matcha (AI)
              </button>
              <button
                type="button"
                onClick={() => handleSaveEngine('local')}
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
                  onChange={(e) => handleSaveVoice(e.target.value)}
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
                  onChange={(e) => handleSaveApiKey(e.target.value)}
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
                onChange={(e) => setSelectedVoiceName(e.target.value)}
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

          {/* Speed & Sleep Timer settings */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-slate-400 font-bold block text-[8.5px]">Tốc độ ({rate}x):</label>
              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.05"
                value={rate}
                onChange={(e) => handleSaveRate(parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-[#121225]"
              />
            </div>
            
            <div className="space-y-0.5">
              <label className="text-slate-400 font-bold block flex items-center gap-1 text-[8.5px]">
                <Timer className="w-3 h-3" />
                Hẹn giờ: {sleepTimer > 0 ? `${timeLeftMin}p` : 'Tắt'}
              </label>
              <select
                value={sleepTimer}
                onChange={(e) => setSleepTimer(parseInt(e.target.value))}
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
        </div>
      )}

      {/* Control Buttons (Chương trước, Tua -10s, Câu trước, Play/Pause, Câu tiếp, Tua +10s, Chương sau) */}
      <div className="flex items-center justify-center gap-1 border-t border-white/5 pt-1.5 no-drag">
        {/* Chương trước */}
        <button
          onClick={(e) => { e.stopPropagation(); onPrevChapter && onPrevChapter(); }}
          disabled={!onPrevChapter}
          className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          title="Chương trước"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>

        {/* Tua lùi ~10s (-2 câu) */}
        <button
          onClick={(e) => { e.stopPropagation(); seekToSentence(currentSentenceIdxRef.current - 2); }}
          className="px-1 py-0.5 text-slate-400 hover:text-purple-300 transition-colors text-[8.5px] font-bold font-mono active:scale-90"
          title="Tua lùi ~10 giây (-2 câu)"
        >
          -10s
        </button>

        {/* Câu trước */}
        <button
          onClick={(e) => { e.stopPropagation(); skipBackward(); }}
          className="p-1 text-slate-300 hover:text-white transition-colors active:scale-90"
          title="Câu trước"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          onTouchEnd={(e) => { e.stopPropagation(); }}
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
          onClick={(e) => { e.stopPropagation(); skipForward(); }}
          className="p-1 text-slate-300 hover:text-white transition-colors active:scale-90"
          title="Câu tiếp"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Tua tới ~10s (+2 câu) */}
        <button
          onClick={(e) => { e.stopPropagation(); seekToSentence(currentSentenceIdxRef.current + 2); }}
          className="px-1 py-0.5 text-slate-400 hover:text-purple-300 transition-colors text-[8.5px] font-bold font-mono active:scale-90"
          title="Tua tới ~10 giây (+2 câu)"
        >
          +10s
        </button>

        {/* Chương sau */}
        <button
          onClick={(e) => { e.stopPropagation(); onNextChapter && onNextChapter(); }}
          disabled={!onNextChapter}
          className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          title="Chương sau"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm8.5-6L18 18V6z"/></svg>
        </button>
      </div>
    </div>
  );
}
