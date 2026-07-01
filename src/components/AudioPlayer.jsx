import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Music, Volume2, Settings, Minimize2, SkipForward, SkipBack, Loader, BookOpen, Timer } from 'lucide-react';
import api from '../services/api';


export default function AudioPlayer({ book, onClose, onNextChapter, onPrevChapter }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Sleep Timer state
  const [sleepTimer, setSleepTimer] = useState(0); // 0 (off), 15, 30, 45, 60 minutes
  const [timeLeftMin, setTimeLeftMin] = useState(0);
  const sleepTimerRef = useRef(null);


  // TTS Engine selection ('browser' | 'matcha')
  const [ttsEngine, setTtsEngine] = useState(() => {
    return localStorage.getItem('local_tts_engine') || 'browser';
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

  const logTrace = (msg) => {
    console.log(`[TTS Trace] ${msg}`);
    if (window.electron && typeof window.electron.logDebug === 'function') {
      window.electron.logDebug(msg);
    }
  };

  // Draggable State for Audio Player Panel (direct DOM/RAF method with left-bottom anchoring and dynamic bounding)
  const playerElRef = useRef(null);
  const _initPos = (() => {
    try {
      const saved = localStorage.getItem('audio_player_pos_v4');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })();
  const positionRef = useRef(_initPos);
  const [position, setPosition] = useState(_initPos);
  const draggedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const prevBookIdRef = useRef(null);
  const playerSize = useRef({ width: 340, height: 260 });
  const playerOffset = useRef({ x: 0, y: 0 });
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

    // Moving right (dx > 0) increases left (x)
    const newLeft = Math.max(0, Math.min(rawLeft, window.innerWidth  - playerSize.current.width));
    // Moving down (dy > 0) decreases bottom (y) - clamp top edge to stop exactly below the 56px header
    const maxBottom = Math.max(0, window.innerHeight - playerSize.current.height - 56);
    const newBottom = Math.max(0, Math.min(rawBottom, maxBottom));

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

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend',  onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend',  onUp);
      document.body.classList.remove('global-dragging');
    };
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

    // 1. Thử ping /health trước với timeout 1 giây
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const response = await fetch('http://127.0.0.1:8001/health', { signal: controller.signal });
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
            const checkRes = await fetch('http://127.0.0.1:8001/health', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (checkRes.ok) {
              logTrace("[ensureLocalEngineRunning] Engine chạy ngầm đã khởi động thành công và phản hồi!");
              
              // Đồng bộ cấu hình thiết bị phần cứng sau khi khởi động thành công
              const pref = localStorage.getItem('tts_device_pref') || 'auto';
              fetch('http://127.0.0.1:8001/set_device', {
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

  // Đồng bộ cấu hình CPU/GPU (device) từ localStorage với Local TTS Server khi khởi động trình phát
  useEffect(() => {
    const pref = localStorage.getItem('tts_device_pref') || 'auto';
    fetch('http://127.0.0.1:8001/set_device', {
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
    stopSpeaking();
  };

  const handleSaveApiKey = (val) => {
    setMatchaApiKey(val);
    localStorage.setItem('local_tts_api_key', val);
    stopSpeaking();
  };

  const handleSaveVoice = (val) => {
    setMatchaVoice(val);
    localStorage.setItem('local_tts_voice', val);
    stopSpeaking();
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

  // Restart speech when book, engine, voice, or selectedVoiceName changes
  useEffect(() => {
    if (book) {
      speakContent();
    }
    return () => {
      stopSpeaking();
    };
  }, [book, ttsEngine, selectedVoiceName, matchaVoice]);

  const fetchMatchaAudio = async (idx, retryCount = 2) => {
    if (idx >= sentencesRef.current.length) return null;
    
    // Check cache
    if (audioCacheRef.current[idx]) {
      return audioCacheRef.current[idx];
    }

    const text = sentencesRef.current[idx];
    logTrace(`[fetchMatchaAudio] Bắt đầu tải câu idx=${idx} (Độ dài: ${text.length} ký tự): "${text.substring(0, 30)}..."`);
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        let audioUrl;
        
        if (ttsEngine === 'local') {
          // Gọi API offline chạy cục bộ
          const response = await fetch('http://127.0.0.1:8001/synthesize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: text,
              speed: 1.0 // Client control playbackRate
            })
          });
          
          if (!response.ok) {
            throw new Error(`Local engine HTTP error: ${response.status}`);
          }
          
          const blob = await response.blob();
          audioUrl = URL.createObjectURL(blob);
        } else {
          // Gọi API Matcha Đám mây (Cloud)
          const res = await api.post('/v1/audio/speech', {
            input: text,
            speed: 1.0,
            voice: matchaVoice
          }, {
            responseType: 'blob',
            headers: {
              'Authorization': `Bearer ${matchaApiKey}`
            }
          });
          audioUrl = URL.createObjectURL(res.data);
        }

        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        audio.load();
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

  const prefetchMatchaSentence = (idx) => {
    if (idx >= sentencesRef.current.length || idx < 0) return;
    if (audioCacheRef.current[idx] || prefetchQueueRef.current.has(idx)) return;

    logTrace(`[prefetch] Thêm câu idx=${idx} vào hàng đợi tải trước`);
    prefetchQueueRef.current.add(idx);
    fetchMatchaAudio(idx)
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
        onNextChapter();
      }
      return;
    }

    currentSentenceIdxRef.current = idx;
    evictCache(idx);
    
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
            })
            .catch(e => {
              logTrace(`[playMatcha] Gọi phát câu Seamless idx=${nextIdx} THẤT BẠI: ${e.message}`);
            });

          currentSentenceIdxRef.current = nextIdx;
          setProgress(Math.round((nextIdx / sentencesRef.current.length) * 100));
          evictCache(nextIdx);
          for (let offset = 1; offset <= 15; offset++) {
            prefetchMatchaSentence(nextIdx + offset);
          }
          return;
        }
      }
      logTrace(`[playMatcha] Câu tiếp theo idx=${nextIdx} chưa có cache hoặc hết chương. Gọi playMatchaSentence(${nextIdx}) bình thường.`);
      playMatchaSentence(currentIdx + 1, mySessionId);
    };

    const setupListeners = (aud, currentIdx) => {
      aud.onplay = () => {
        if (mySessionId !== playSessionIdRef.current) {
          logTrace(`[playMatcha] Hủy sự kiện onplay của idx=${currentIdx} vì lệch phiên phát.`);
          try { aud.pause(); } catch(e){}
          return;
        }
        logTrace(`[playMatcha] [Audio Event] Đang phát câu idx=${currentIdx} (Tốc độ mong muốn: ${rateRef.current}x, Tốc độ thực tế: ${aud.playbackRate}x)`);
        setIsPlaying(true);
        aud.playbackRate = rateRef.current;
        aud.defaultPlaybackRate = rateRef.current;

        // Emit onBoundary for AI Audio (since it's chunked by sentence)
        if (typeof book?.onBoundary === 'function') {
          let estimatedCharIdx = 0;
          for(let i=0; i<currentIdx; i++) {
             estimatedCharIdx += (sentencesRef.current[i] || '').length + 1;
          }
          book.onBoundary(estimatedCharIdx, sentencesRef.current[currentIdx] || '');
        }

        updateSmoothProgress(aud, currentIdx);
      };

      aud.onplaying = () => {
        if (mySessionId !== playSessionIdRef.current) {
          try { aud.pause(); } catch(e){}
          return;
        }
        aud.playbackRate = rateRef.current;
        aud.defaultPlaybackRate = rateRef.current;
      };

      aud.onpause = () => {
        logTrace(`[playMatcha] [Audio Event] Tạm dừng câu idx=${currentIdx}`);
        setIsPlaying(false);
      };

      aud.onended = () => {
        logTrace(`[playMatcha] [Audio Event] Đã phát xong câu idx=${currentIdx} (onended)`);
        triggerNext(currentIdx);
      };

      aud.ontimeupdate = () => {
        const nextIdx = currentIdx + 1;
        const nextAudio = audioCacheRef.current[nextIdx];
        // Nếu câu tiếp theo đã có sẵn cache, tự động gối đầu sớm trước 0.15 giây để đọc mượt mà không khựng
        if (nextAudio && aud.duration && (aud.duration - aud.currentTime <= 0.15)) {
          triggerNext(currentIdx);
        }
        updateSmoothProgress(aud, currentIdx);
      };

      aud.onerror = (e) => {
        logTrace(`[playMatcha] [Audio Event] LỖI phát âm thanh ở câu idx=${currentIdx}: ${e.message || 'Unknown error'}`);
        if (mySessionId !== playSessionIdRef.current || currentIdx !== currentSentenceIdxRef.current) return;
        
        setIsLoading(true);
        
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
            if (oldAudio.src) URL.revokeObjectURL(oldAudio.src);
          } catch(err) {}
          delete audioCacheRef.current[currentIdx];
        }
        
        // Chờ 1 giây rồi tự động tải lại và phát tiếp tục
        logTrace(`[playMatcha] Sẽ thử tải lại và phát lại câu idx=${currentIdx} sau 1 giây...`);
        setTimeout(() => {
          if (mySessionId === playSessionIdRef.current && currentIdx === currentSentenceIdxRef.current) {
            playMatchaSentence(currentIdx, mySessionId);
          }
        }, 1000);
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
        if ((ttsEngine === 'local' || ttsEngine === 'matcha') && 
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
        audio.playbackRate = rateRef.current;
        audio.defaultPlaybackRate = rateRef.current;
      })
      .catch(e => {
        logTrace(`[playMatcha] audio.play() câu idx=${idx} bị ngắt hoặc chặn: ${e.message}`);
        // Chốt chặn phiên phát (Session Lock) & Chốt chặn chỉ số câu
        if (mySessionId !== playSessionIdRef.current || idx !== currentSentenceIdxRef.current) return;
        
        setIsLoading(true);
        
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

        logTrace(`[playMatcha] Thử phát lại câu idx=${idx} sau 1 giây do lỗi play.catch...`);
        setTimeout(() => {
          if (mySessionId === playSessionIdRef.current && idx === currentSentenceIdxRef.current) {
            playMatchaSentence(idx, mySessionId);
          }
        }, 1000);
      });

    // Prefetch next 15 sentences in the background!
    for (let offset = 1; offset <= 15; offset++) {
      prefetchMatchaSentence(idx + offset);
    }
  };

  const speakContent = async () => {
    stopSpeaking();

    const titleText = book.title_vietphrase || book.title || '';
    const authorText = book.author_hanviet || book.author || '';
    const mainText = book.description_vietphrase || book.description || '';

    if (!titleText && !mainText) return;

    let textToSpeak = "";
    if (book.isChapter) {
      textToSpeak = `${titleText}. ${mainText}`;
    } else {
      textToSpeak = `Giới thiệu tác phẩm: ${titleText}. Tác giả: ${authorText}. Tóm tắt cốt truyện: ${mainText}. Hết phần tóm tắt.`;
    }

    // Phân đoạn văn bản tự nhiên theo dòng và câu để đảm bảo highlight hiển thị chuẩn xác
    const paragraphs = textToSpeak.split(/[\n\r]+/);
    const rawSentences = [];
    
    // Biểu thức chính quy phát hiện câu hợp lệ (phải có ít nhất 1 chữ cái hoặc chữ số)
    const validTextRegex = /[a-zA-Z0-9áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/i;

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;
      
      if (trimmedPara.length <= 400) {
        if (validTextRegex.test(trimmedPara)) {
          rawSentences.push(trimmedPara);
        }
      } else {
        // Nếu đoạn văn quá dài, phân tách theo dấu ngắt câu để tránh timeout máy chủ
        const sentences = trimmedPara.split(/([.!?。！？])/);
        let currentChunk = "";
        for (let i = 0; i < sentences.length; i++) {
          const part = sentences[i];
          if (['.', '!', '?', '。', '！', '？'].includes(part)) {
            currentChunk += part;
          } else {
            if (currentChunk.trim() && currentChunk.length + part.length > 400) {
              if (validTextRegex.test(currentChunk.trim())) {
                rawSentences.push(currentChunk.trim());
              }
              currentChunk = part;
            } else {
              currentChunk += part;
            }
          }
        }
        if (currentChunk.trim() && validTextRegex.test(currentChunk.trim())) {
          rawSentences.push(currentChunk.trim());
        }
      }
    }

    if (rawSentences.length === 0) return;

    if (ttsEngine === 'matcha' || ttsEngine === 'local') {
      if (ttsEngine === 'matcha' && !matchaApiKey) {
        // Just stop and wait for key
        return;
      }

      if (ttsEngine === 'local') {
        setIsLoading(true);
        const isRunning = await ensureLocalEngineRunning();
        if (!isRunning) {
          logTrace("[speakContent] Không khởi động được engine local. Tự động chuyển dự phòng sang Trình duyệt.");
          setIsLoading(false);
          setTtsEngine('browser');
          localStorage.setItem('local_tts_engine', 'browser');
          // Gọi lại speakContent để phát bằng trình duyệt
          setTimeout(() => speakContent(), 100);
          return;
        }
      }
      
      sentencesRef.current = rawSentences;
      const startIdx = book.startSentenceIdx || 0;
      currentSentenceIdxRef.current = startIdx;
      audioCacheRef.current = {};
      prefetchQueueRef.current = new Set();

      // Bật trạng thái Loading để người dùng biết hệ thống đang chuẩn bị bộ đệm
      setIsLoading(true);

      // Kích hoạt tải trước (Prefetch) 15 câu đầu tiên ngay lập tức trong nền
      for (let offset = 0; offset <= 15; offset++) {
        prefetchMatchaSentence(startIdx + offset);
      }

      // Trì hoãn 800ms để hệ thống sinh sẵn 3-5 câu đệm ban đầu, giúp x4/x24 mượt mà
      const currentSessionId = playSessionIdRef.current;
      setTimeout(() => {
        if (currentSessionId === playSessionIdRef.current) {
          playMatchaSentence(startIdx, currentSessionId);
        }
      }, 800);
    } else {
      // Browser Synthesis Engine
      if (!synthRef.current) return;
      
      let browserTextToSpeak = textToSpeak;
      let sliceOffset = 0;
      const startIdx = book.startSentenceIdx || 0;
      if (startIdx > 0 && startIdx < rawSentences.length) {
        browserTextToSpeak = rawSentences.slice(startIdx).join(". ");
        for (let i = 0; i < startIdx; i++) {
          sliceOffset += rawSentences[i].length + 2; // +2 for ". "
        }
      }

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
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
        if (book.isChapter && onNextChapter) {
          onNextChapter();
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted') {
          console.error("Speech Synthesis Error:", e);
          setIsPlaying(false);
        }
      };

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const idx = event.charIndex + sliceOffset;
          if (typeof book.onBoundary === 'function') {
            book.onBoundary(idx);
          }
          const totalLen = textToSpeak.length;
          if (totalLen > 0) {
            setProgress(Math.min(100, Math.round((idx / totalLen) * 100)));
          }
        }
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    }
  };

  const togglePlay = () => {
    logTrace(`[User Action] Nhấn nút Tạm dừng/Phát tiếp (togglePlay)`);
    if (ttsEngine === 'matcha' || ttsEngine === 'local') {
      if (isLoading) {
        logTrace(`[User Action] Đang Loading, bỏ qua hành động togglePlay.`);
        return;
      }
      if (audioRef.current) {
        if (isPlaying) {
          logTrace(`[User Action] Tạm dừng âm thanh đang phát.`);
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          logTrace(`[User Action] Tiếp tục phát âm thanh.`);
          audioRef.current.play();
          setIsPlaying(true);
        }
      } else {
        // Nếu đã chia câu rồi thì chỉ việc tiếp tục phát câu hiện tại
        if (sentencesRef.current.length > 0) {
          const currentIdx = currentSentenceIdxRef.current;
          logTrace(`[User Action] Tiếp tục chuỗi câu từ idx=${currentIdx}. Bật Loading và chuẩn bị đệm.`);
          setIsLoading(true);
          
          // Kích hoạt prefetch trước câu hiện tại và 15 câu tiếp theo
          for (let offset = 0; offset <= 15; offset++) {
            prefetchMatchaSentence(currentIdx + offset);
          }

          // Trì hoãn 600ms để nạp lại đệm trước khi tiếp tục
          const currentSessionId = playSessionIdRef.current;
          setTimeout(() => {
            if (currentSessionId === playSessionIdRef.current) {
              playMatchaSentence(currentIdx, currentSessionId);
            }
          }, 600);
        } else {
          logTrace(`[User Action] Chưa chia câu. Bắt đầu phân tách văn bản và phát.`);
          speakContent();
        }
      }
    } else {
      if (!synthRef.current) return;
      if (isPlaying) {
        synthRef.current.pause();
        setIsPlaying(false);
      } else {
        if (synthRef.current.paused) {
          synthRef.current.resume();
          setIsPlaying(true);
        } else {
          speakContent();
        }
      }
    }
  };

  const stopSpeaking = () => {
    logTrace(`[stopSpeaking] Dừng phát toàn bộ và giải phóng tài nguyên. Session mới: ${playSessionIdRef.current + 1}`);
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

  const skipForward = () => {
    if (ttsEngine === 'matcha' || ttsEngine === 'local') {
      const nextIdx = currentSentenceIdxRef.current + 1;
      if (nextIdx < sentencesRef.current.length) {
        playMatchaSentence(nextIdx);
      } else if (book.isChapter && onNextChapter) {
        onNextChapter();
      }
    } else {
      // Browser speech synthesis basic skip forward
      const nextProgress = Math.min(90, progress + 10);
      const textToSpeak = (book.isChapter ? `${book.title_vietphrase}. ${book.description}` : book.description) || "";
      const nextIndex = Math.floor((nextProgress / 100) * textToSpeak.length);
      
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
      synthRef.current.speak(utterance);
    }
  };

  const skipBackward = () => {
    if (ttsEngine === 'matcha' || ttsEngine === 'local') {
      const prevIdx = currentSentenceIdxRef.current - 1;
      if (prevIdx >= 0) {
        playMatchaSentence(prevIdx);
      }
    } else {
      const prevProgress = Math.max(0, progress - 10);
      const textToSpeak = (book.isChapter ? `${book.title_vietphrase}. ${book.description}` : book.description) || "";
      const prevIndex = Math.floor((prevProgress / 100) * textToSpeak.length);

      stopSpeaking();
      const utterance = new SpeechSynthesisUtterance(textToSpeak.slice(prevIndex));
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
        const idx = prevIndex + event.charIndex;
        const totalLen = textToSpeak.length;
        setProgress(Math.min(100, Math.round((idx / totalLen) * 100)));
      };
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    }
  };

  // Click handler to jump to a sentence by clicking on the progress bar
  const handleSeekBarClick = (e) => {
    if (!sentencesRef.current || sentencesRef.current.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const targetIdx = Math.floor(percentage * sentencesRef.current.length);
    if (targetIdx >= 0 && targetIdx < sentencesRef.current.length) {
      logTrace(`[SeekBar] Seeking directly to sentence index: ${targetIdx}`);
      playMatchaSentence(targetIdx);
    }
  };

  const totalSentences = sentencesRef.current?.length || 0;
  const currentSentenceDisplay = Math.min(currentSentenceIdxRef.current + 1, totalSentences);

  const getSafeStyle = () => {
    if (!position) return {};
    
    const el = playerElRef.current;
    const targetWidth = isMinimized ? 240 : 340;
    const targetHeight = isMinimized ? 52 : (showSettings ? 385 : 210);
    const currentHeight = el ? el.offsetHeight : targetHeight;
    
    // Clamp coordinates on first render and subsequent renders to prevent out-of-bounds rendering
    const safeLeft = Math.max(0, Math.min(position.x, window.innerWidth - targetWidth));
    const maxSafeBottom = Math.max(0, window.innerHeight - currentHeight - 56);
    const safeBottom = Math.max(0, Math.min(position.y, maxSafeBottom));
    
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
        style={{ ...dragStyle, minWidth: 240, WebkitAppRegion: 'no-drag' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-[100000] bg-[#121225]/97 border border-purple-500/40 rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-2 cursor-grab active:cursor-grabbing hover:border-purple-400 transition-colors duration-200 select-none"
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
            disabled={isLoading}
            className="p-1 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-all active:scale-95 disabled:opacity-40"
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
      className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto z-[100000] bg-[#121225]/97 border-t sm:border border-purple-500/30 backdrop-blur-md rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl flex flex-col gap-3.5 w-full sm:max-w-sm sm:w-[340px] animate-in fade-in slide-in-from-bottom-5 duration-300 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Header Bar */}
      <div className="flex justify-between items-center select-none pb-1.5 border-b border-white/5">
        <span className="text-[9px] text-purple-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
          <Volume2 className="w-3.5 h-3.5" /> 
          {book.isChapter ? 'ĐANG ĐỌC CHƯƠNG...' : 'ĐANG NGHE TÓM TẮT...'}
        </span>
        <div className="flex items-center gap-1.5">
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-purple-600/20 text-purple-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            title="Cấu hình giọng đọc"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
            title="Thu nhỏ"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Info */}
      <div className="flex gap-4 items-center">
        {book.cover ? (
          <img
            src={book.cover}
            alt="cover"
            className={`w-12 h-16 object-cover rounded-lg border border-white/10 shadow-md shrink-0 bg-[#0f0f1a] ${isPlaying ? 'animate-pulse' : ''}`}
            onError={(e) => { e.target.remove(); }}
          />
        ) : (
          <div className={`w-12 h-16 rounded-lg border border-white/10 bg-[#0f0f1a] flex items-center justify-center text-slate-500 shrink-0 ${isPlaying ? 'ring-2 ring-purple-500/40' : ''}`}>
            <Music className="w-5 h-5 text-purple-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-white text-xs font-bold truncate">{book.title_vietphrase || book.title}</h4>
          <p className="text-[10px] text-slate-500 truncate mt-0.5">✍ Tác giả: {book.author_hanviet || book.author || '—'}</p>
          
          {/* Click-seekable Progress Bar */}
          <div 
            onClick={handleSeekBarClick}
            className="w-full bg-[#0b0b14] rounded-full h-2 mt-2.5 relative overflow-hidden cursor-pointer group"
            title="Click để tua câu nhanh"
          >
            <div 
              className="bg-gradient-to-r from-purple-600 to-violet-500 h-full rounded-full transition-all duration-300 relative"
              style={{ width: `${progress}%` }}
            >
              {/* Thumb dot */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity -mr-1" />
            </div>
          </div>
          
          {/* Time & Sentence displays */}
          <div className="flex justify-between items-center text-[8px] text-slate-400 mt-1.5 font-mono">
            <span>{formatTime(currentTimeSec)}</span>
            {totalSentences > 0 ? (
              <span className="text-slate-500 font-sans">Câu {currentSentenceDisplay}/{totalSentences}</span>
            ) : (
              <span className="text-slate-500">{progress}%</span>
            )}
            <span>{formatTime(totalTimeSec)}</span>
          </div>
        </div>
      </div>

      {/* Speech Settings Sub-panel */}
      {showSettings && (
        <div className="bg-[#0b0b14]/75 border border-white/5 rounded-xl p-3 text-[10px] space-y-3 animate-in fade-in duration-200">
          {/* Engine Selector */}
          <div className="space-y-1">
            <label className="text-slate-400 font-bold block">Động cơ đọc (TTS Engine):</label>
            <div className="grid grid-cols-3 gap-1 bg-[#121225] p-1 rounded-lg border border-[#1f1f3a]">
              <button
                type="button"
                onClick={() => handleSaveEngine('browser')}
                className={`py-1 rounded-md text-[8px] font-bold transition-all ${ttsEngine === 'browser' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Trình duyệt
              </button>
              <button
                type="button"
                onClick={() => handleSaveEngine('matcha')}
                className={`py-1 rounded-md text-[8px] font-bold transition-all ${ttsEngine === 'matcha' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Matcha (Cloud)
              </button>
              <button
                type="button"
                onClick={() => handleSaveEngine('local')}
                className={`py-1 rounded-md text-[8px] font-bold transition-all ${ttsEngine === 'local' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Local (Offline)
              </button>
            </div>
          </div>

          {ttsEngine === 'local' && (
            <div className="bg-[#121225] border border-[#1f1f3a] p-2.5 rounded-lg space-y-1">
              <span className="text-[10px] text-purple-400 font-bold block">⚡ Động Cơ Ngoại Tuyến (Offline)</span>
              <p className="text-[9px] text-slate-400 leading-tight">
                Đang chạy trực tiếp model Matcha36-Vocos10 siêu nén trên máy của bạn. Không tốn tiền API, bảo mật và tốc độ cao.
              </p>
            </div>
          )}

          {ttsEngine === 'matcha' && (
            <>
              {/* Matcha Voice */}
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Giọng đọc AI (Matcha):</label>
                <select
                  value={matchaVoice}
                  onChange={(e) => handleSaveVoice(e.target.value)}
                  className="w-full bg-[#121225] border border-[#1f1f3a] text-slate-200 p-2 rounded-lg outline-none focus:border-purple-500"
                >
                  <option value="the_gioi_hoan_my">Thế Giới Hoàn Mỹ (Giọng Nam)</option>
                  <option value="vi_female">Giọng Nữ miền Bắc (Beta)</option>
                </select>
              </div>

              {/* Matcha API Key */}
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">API Key (sk-tc-...):</label>
                <input
                  type="password"
                  value={matchaApiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  placeholder="Nhập API key của bạn để sử dụng"
                  className="w-full bg-[#121225] border border-[#1f1f3a] text-slate-200 px-2.5 py-1.5 rounded-lg outline-none focus:border-purple-500 text-xs"
                />
                <span className="text-[8px] text-slate-500 block leading-tight">
                  Lấy khóa API tại tab <strong>API Developer</strong>.
                </span>
              </div>
            </>
          )}

          {ttsEngine === 'browser' && (
            /* Browser Voice Selector */
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Giọng đọc (Voice):</label>
              <select
                value={selectedVoiceName}
                onChange={(e) => setSelectedVoiceName(e.target.value)}
                className="w-full bg-[#121225] border border-[#1f1f3a] text-slate-200 p-2 rounded-lg outline-none focus:border-purple-500"
              >
                {voices.length > 0 ? (
                  voices.map((v, i) => (
                    <option key={i} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))
                ) : (
                  <option value="">Không có giọng nói hệ thống (Hãy dùng Local)</option>
                )}
              </select>
            </div>
          )}

          {/* Speed & Sleep Timer settings (PITCH REMOVED) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Speed selection */}
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Tốc độ ({rate}x):</label>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.05"
                value={rate}
                onChange={(e) => handleSaveRate(parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-[#121225]"
              />
            </div>
            
            {/* Sleep Timer Selection */}
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />
                Hẹn giờ: {sleepTimer > 0 ? `${timeLeftMin}p` : 'Tắt'}
              </label>
              <select
                value={sleepTimer}
                onChange={(e) => setSleepTimer(parseInt(e.target.value))}
                className="w-full bg-[#121225] border border-[#1f1f3a] text-slate-200 p-1.5 rounded-lg outline-none focus:border-purple-500"
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

      {/* Control Buttons (Chương trước, Câu trước, Play/Pause, Câu tiếp, Chương sau) */}
      <div className="flex items-center justify-center gap-1 border-t border-white/5 pt-2">
        {/* Chương trước */}
        <button
          onClick={onPrevChapter}
          disabled={!onPrevChapter}
          className="p-2 text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Chương trước"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>

        {/* Câu trước */}
        <button
          onClick={skipBackward}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Câu trước"
        >
          <SkipBack className="w-4.5 h-4.5" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="p-3 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-full shadow-lg transition-all disabled:opacity-40 mx-2"
        >
          {isLoading ? (
            <Loader className="w-5.5 h-5.5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5.5 h-5.5" />
          ) : (
            <Play className="w-5.5 h-5.5 fill-current translate-x-[1px]" />
          )}
        </button>

        {/* Câu tiếp */}
        <button
          onClick={skipForward}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Câu tiếp"
        >
          <SkipForward className="w-4.5 h-4.5" />
        </button>

        {/* Chương sau */}
        <button
          onClick={onNextChapter}
          disabled={!onNextChapter}
          className="p-2 text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Chương sau"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm8.5-6L18 18V6z"/></svg>
        </button>
      </div>
    </div>
  );
}
