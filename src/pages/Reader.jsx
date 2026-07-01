import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReaderLayout from '../layouts/ReaderLayout';
import { useReaderSettings } from '../contexts/ReaderSettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import api from '../services/api';
import AudioPlayer from '../components/AudioPlayer';
import GoogleAd from '../components/GoogleAd';
import { ChevronLeft, ChevronRight, Volume2, Play, Pause, Loader, ExternalLink, Search, X, Target, Eye } from 'lucide-react';
import { useUsageTracker } from '../hooks/useUsageTracker';
import { isElectron } from '../utils/electron';
import { useBrowser } from '../contexts/BrowserContext';

import { localTranslator } from '../utils/localTranslator';

export default function Reader() {
  const { bookId, chapterIdx } = useParams();
  const { theme, fontSize, fontFamily, lineHeight } = useReaderSettings();
  const { user } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  // Track active reading time on the web platform
  useUsageTracker('web', 'read');

  const [bookTitle, setBookTitle] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chaptersList, setChaptersList] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [bookDetails, setBookDetails] = useState(null);

  // Search menu states for sources without direct link in reader
  const [searchMenu, setSearchMenu] = useState(null); // { site, isChinese }
  const [customKeyword, setCustomKeyword] = useState('miễn phí đọc mới nhất');
  const [embedUrl, setEmbedUrl] = useState(null);

  const { activeAudioObj, setActiveAudioObj } = useBrowser();

  const [autoScrollTts, setAutoScrollTts] = useState(() => {
    return localStorage.getItem('tts_auto_scroll') !== 'false';
  });

  const [currentSpokenCharIdx, setCurrentSpokenCharIdx] = useState(-1);

  const [audioSpeed, setAudioSpeed] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      return stored.audioSpeed || 1.5;
    } catch { return 1.5; }
  });

  useEffect(() => {
    const handleSpeedChange = (e) => {
      if (e.detail?.audioSpeed) {
        setAudioSpeed(e.detail.audioSpeed);
      }
    };
    window.addEventListener('translationSettingsUpdated', handleSpeedChange);
    return () => window.removeEventListener('translationSettingsUpdated', handleSpeedChange);
  }, []);

  const handleToggleAutoScroll = () => {
    const newVal = !autoScrollTts;
    setAutoScrollTts(newVal);
    localStorage.setItem('tts_auto_scroll', newVal ? 'true' : 'false');
  };

  const isCurrentChapterPlaying = activeAudioObj && 
                                  String(activeAudioObj.book?.id) === String(bookId) && 
                                  activeAudioObj.chapterIdx === parseInt(chapterIdx);

  const getReadingTime = () => {
    if (!content) return null;
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const totalSeconds = Math.round((wordCount / (150 * audioSpeed)) * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { minutes, seconds, wordCount };
  };

  const wasPlayingRef = useRef(false);

  useEffect(() => {
    fetchChapterContent();
  }, [bookId, chapterIdx]);

  // Sync spoken character highlight globally
  useEffect(() => {
    const handleBoundary = (e) => {
      setCurrentSpokenCharIdx(e.detail.charIdx);
    };
    window.addEventListener('global-tts-boundary', handleBoundary);
    return () => window.removeEventListener('global-tts-boundary', handleBoundary);
  }, []);

  // Auto-scroll to highlighted sentence
  useEffect(() => {
    if (isCurrentChapterPlaying && currentSpokenCharIdx > 0 && autoScrollTts) {
      const activeEl = document.getElementById('active-tts-sentence');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentSpokenCharIdx, isCurrentChapterPlaying, autoScrollTts]);

  // Sync online chapter view changes from global TTS
  useEffect(() => {
    const handleGlobalTtsChange = (e) => {
      if (e.detail && e.detail.bookId === bookId) {
        const nextIdx = e.detail.chapterIdx;
        if (autoScrollTts && nextIdx !== parseInt(chapterIdx)) {
          navigate(`/book/${bookId}/read/${nextIdx}`);
        }
      }
    };
    window.addEventListener('global-tts-chapter-changed', handleGlobalTtsChange);
    return () => window.removeEventListener('global-tts-chapter-changed', handleGlobalTtsChange);
  }, [bookId, chapterIdx, autoScrollTts]);

  useEffect(() => {
    const webview = document.getElementById('embedded-webview');
    if (webview) {
      const handleNewWindow = (e) => {
        e.preventDefault();
        setEmbedUrl(e.url || e.targetUrl);
      };
      webview.addEventListener('new-window', handleNewWindow);
      // For newer Electron versions if new-window is not fired
      const handleWillNavigate = (e) => {
        if (e.url !== embedUrl) {
          setEmbedUrl(e.url);
        }
      };
      // We don't prevent will-navigate as we want it to navigate, but we sync embedUrl just in case.
      return () => {
        webview.removeEventListener('new-window', handleNewWindow);
      };
    }
  }, [embedUrl]);



  const fetchChapterContent = async () => {
    setLoading(true);
    try {
      let realTitle = "Vũ Luyện Điên Phong";
      try {
        const bookRes = await api.get(`/api/book/${bookId}`);
        if (bookRes.data) {
          setBookDetails(bookRes.data);
          realTitle = bookRes.data.title_vietphrase || bookRes.data.title_hanviet || bookRes.data.title;
        }
      } catch (err) {
        console.error("Error fetching book details in reader:", err);
      }

      setBookTitle(realTitle);
      setChapterTitle(`Chương ${chapterIdx}: Khai Phong Thần Điện`);

      // Mock chapters list for sidebar
      const list = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Chương ${i + 1}: Khai Phong Thần Điện`,
        url_idx: i + 1,
        active: (i + 1) === parseInt(chapterIdx)
      }));
      setChaptersList(list);

      // Fetch sample Chinese content to run translator
      const sampleChinese = `第${chapterIdx}章 开封神殿\n\n武之极，破苍穹，动乾坤！在这片神秘의 개봉신전中，无数强者汇聚。他们为了争夺上古机缘，不惜 blood shed.\n\n杨开迈步走入神殿，神色淡然。他能夠清晰地感受到虚空中波动的强横气息。这一次 exploration，他势在必得。`;
      
      // Call translate endpoint
      setTranslating(true);
      let finalContent = sampleChinese;
      try {
        const transRes = await api.post('/translate', {
          texts: sampleChinese.split('\n\n'),
          mode: 'fast'
        }, {
          headers: {
            'X-VIP-Key': 'LYVUHA_ADMIN_2026' // Use fallback key for testing translation
          }
        });
        if (transRes.data && transRes.data.translations) {
          finalContent = transRes.data.translations.join('\n\n');
        }
      } catch (err) {
        console.warn("[Reader] Cloud translation failed, trying offline localTranslator:", err);
        try {
          await localTranslator.loadDictionaries();
          const fallbackTranslations = sampleChinese.split('\n\n').map(t => localTranslator.translateSentence(t, 'advanced'));
          finalContent = fallbackTranslations.join('\n\n');
        } catch (localErr) {
          console.error("[Reader] Offline translation failed as well:", localErr);
          throw new Error("Cả máy chủ dịch và bộ dịch offline đều thất bại.");
        }
      }
      setContent(finalContent);

      // Autoplay next chapter if TTS was active
      if (activeAudioObj && activeAudioObj.playType === 'online' && activeAudioObj.book?.id === bookId) {
        setActiveAudioObj({
          ...activeAudioObj,
          chapterIdx: parseInt(chapterIdx),
          title_vietphrase: `Chương ${chapterIdx}: Khai Phong Thần Điện`,
          description: finalContent,
          startSentenceIdx: 0 // Reset to 0 for the new chapter
        });
      }



      // Record reading history
      if (user) {
        await api.post('/api/history/add', {
          book_id: parseInt(bookId),
          last_chapter: `Chương ${chapterIdx}`
        });
      }
    } catch (e) {
      console.error(e);
      setContent(t.reader?.errorLoadingChapter || "Lỗi tải nội dung chương hoặc không kết nối được máy chủ dịch.");
    } finally {
      setLoading(false);
      setTranslating(false);
    }
  };

  const handleSelectChapter = (chap) => {
    navigate(`/book/${bookId}/read/${chap.url_idx}`);
  };

  const handlePrevChapter = () => {
    const prevIdx = parseInt(chapterIdx) - 1;
    if (prevIdx >= 1) {
      navigate(`/book/${bookId}/read/${prevIdx}`);
    }
  };

  const handleNextChapter = () => {
    const nextIdx = parseInt(chapterIdx) + 1;
    if (nextIdx <= 50) {
      navigate(`/book/${bookId}/read/${nextIdx}`);
    }
  };

  const handleTTSPlay = () => {
    if (isCurrentChapterPlaying) {
      stopAudio();
    } else {
      setActiveAudioObj({
        title_vietphrase: chapterTitle,
        author_hanviet: bookTitle,
        description: content,
        isChapter: true,
        onBoundary: (charIdx) => {
          setCurrentSpokenCharIdx(charIdx);
        },
        book: { id: bookId, title: bookTitle, title_vietphrase: bookTitle },
        chapterIdx: parseInt(chapterIdx),
        playType: 'online'
      });
    }
  };

  const stopAudio = () => {
    setActiveAudioObj(null);
    setCurrentSpokenCharIdx(-1);
  };

  const handleParagraphDoubleClick = (pIdx, text) => {
    const paragraphs = content.split(/\n+/);
    let charIdx = 0;
    for (let i = 0; i < pIdx; i++) {
      charIdx += paragraphs[i].length + 1;
    }

    const textBefore = content.slice(0, charIdx);
    const paragraphsBefore = textBefore.split(/[\n\r]+/);
    const rawSentencesBefore = [];
    const validTextRegex = /[a-zA-Z0-9áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/i;
    
    if (chapterTitle) {
      rawSentencesBefore.push(chapterTitle);
    }
    
    let isFirst = true;
    for (const para of paragraphsBefore) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;
      
      const sentences = trimmedPara.split(/([.!?。！？])/);
      let currentChunk = "";
      for (let i = 0; i < sentences.length; i++) {
        const part = sentences[i];
        if (['.', '!', '?', '。', '！', '？'].includes(part)) {
          currentChunk += part;
        } else {
          if (!part.trim()) continue;
          const limit = isFirst ? 120 : 300;
          if (currentChunk.trim() && currentChunk.length + part.length > limit) {
            if (validTextRegex.test(currentChunk.trim())) {
              rawSentencesBefore.push(currentChunk.trim());
              isFirst = false;
            }
            currentChunk = part;
          } else {
            currentChunk += part;
          }
        }
      }
      if (currentChunk.trim() && validTextRegex.test(currentChunk.trim())) {
        rawSentencesBefore.push(currentChunk.trim());
        isFirst = false;
      }
    }

    const startSentenceIdx = rawSentencesBefore.length;

    setActiveAudioObj({
      title_vietphrase: chapterTitle,
      author_hanviet: bookTitle,
      description: content,
      isChapter: true,
      onBoundary: (charIdx) => {
        setCurrentSpokenCharIdx(charIdx);
      },
      book: { id: bookId, title: bookTitle, title_vietphrase: bookTitle },
      chapterIdx: parseInt(chapterIdx),
      playType: 'online',
      startSentenceIdx: startSentenceIdx
    });
  };

  // Highlight spoken text sentence by character boundary index
  const renderHighlightedContent = () => {
    const paragraphs = content.split(/\n+/);
    
    let accumulatedLength = 0;
    const prefixLen = chapterTitle.length + 2;
    const adjustedIdx = currentSpokenCharIdx - prefixLen;

    return paragraphs.map((para, pIdx) => {
      const startOfPara = accumulatedLength;
      accumulatedLength += para.length + 1;
      const endOfPara = accumulatedLength;

      const isActivePara = isCurrentChapterPlaying && 
                           adjustedIdx >= startOfPara && 
                           adjustedIdx < endOfPara;

      let paraContent = para;
      if (isActivePara) {
        const localAdjustedIdx = adjustedIdx - startOfPara;
        
        let startSentenceIdx = 0;
        for (let i = localAdjustedIdx; i >= 0; i--) {
          if (['.', '?', '!', '\n'].includes(para[i])) {
            startSentenceIdx = i + 1;
            break;
          }
        }
        
        let endSentenceIdx = para.length;
        for (let i = localAdjustedIdx; i < para.length; i++) {
          if (['.', '?', '!', '\n'].includes(para[i])) {
            endSentenceIdx = i + 1;
            break;
          }
        }

        const before = para.slice(0, startSentenceIdx);
        const active = para.slice(startSentenceIdx, endSentenceIdx);
        const after = para.slice(endSentenceIdx);

        paraContent = (
          <>
            {before}
            <span id="active-tts-sentence" className="bg-purple-500/20 text-purple-200 border-b-2 border-purple-500 px-1 py-0.5 rounded transition-all duration-300">
              {active}
            </span>
            {after}
          </>
        );
      }

      return (
        <p 
          key={pIdx} 
          onDoubleClick={() => handleParagraphDoubleClick(pIdx, para)}
          className="cursor-pointer hover:bg-purple-500/5 px-2 py-1 rounded transition-colors duration-150 relative group"
          title="Nháy đúp để đọc từ đoạn này"
        >
          {paraContent}
        </p>
      );
    });
  };

  // Map font class names
  const getFontClass = () => {
    if (fontFamily === 'serif') return 'font-serif';
    if (fontFamily === 'mono') return 'font-mono';
    return 'font-sans';
  };

  // Map line heights class names
  const getLineHeightClass = () => {
    if (lineHeight === 'loose') return 'leading-loose';
    if (lineHeight === 'relaxed') return 'leading-relaxed';
    return 'leading-normal';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b14] flex flex-col items-center justify-center text-slate-500">
        <Loader className="w-8 h-8 animate-spin text-brand-500 mb-3" />
        <span>{t.reader?.loadingChapter || "Đang tải chương truyện..."}</span>
      </div>
    );
  }

  const defaultSourceNames = [
    { name: 'Ixdzs', isChinese: true },
    { name: 'Biquge', isChinese: true },
    { name: '41nr', isChinese: true },
    { name: 'Quanben', isChinese: true },
    { name: 'Hjwzw', isChinese: true },
    { name: 'Fanqie', isChinese: true },
    { name: 'Metruyenchu', isChinese: false },
    { name: 'TruyenFull', isChinese: false },
    { name: 'Vcomi', isChinese: false }
  ];

  const parsedSources = bookDetails?.parsed_sources || [];

  const allSourcesToRender = defaultSourceNames.map(ds => {
    const found = parsedSources.find(u => u.source.toLowerCase() === ds.name.toLowerCase());
    if (found) {
      return { site: found.source, url: found.url, isSearch: false, isChinese: ds.isChinese };
    } else {
      return { site: ds.name, url: null, isSearch: true, isChinese: ds.isChinese };
    }
  });

  const openUrl = (url) => {
    if (isElectron) {
      setEmbedUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const triggerSearch = (engine, language) => {
    if (!searchMenu) return;
    const { site } = searchMenu;
    let query = '';
    const bookTitleStr = bookDetails?.title || bookTitle || '';
    const bookAuthorStr = bookDetails?.author || '';
    const bookTitleVi = bookDetails?.title_vietphrase || bookTitle || '';
    const bookAuthorVi = bookDetails?.author_hanviet || '';

    if (language === 'vi') {
      query = `${bookTitleVi.trim()} ${bookAuthorVi.trim()} ${site} ${customKeyword}`.trim();
    } else {
      query = `${bookTitleStr.trim()} ${bookAuthorStr.trim()} ${site} ${customKeyword}`.trim();
    }

    let searchUrl = '';
    if (engine === 'baidu') {
      searchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
    } else {
      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
    openInBrowser(searchUrl);
    setSearchMenu(null);
  };

  return (
    <ReaderLayout
      bookTitle={bookTitle}
      currentChapter={chapterTitle}
      chaptersList={chaptersList}
      onSelectChapter={handleSelectChapter}
    >
        <div className="space-y-8">
        {/* Floating TTS Widget & Original Sources Link */}
        <div className="flex flex-col gap-4 border-b border-slate-500/10 pb-4 reader-overlay">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase mr-1">Nguồn truyện:</span>
              {allSourcesToRender.map((src, idx) => {
                let logoColor = 'bg-emerald-500 text-white';
                if (src.site.toLowerCase().includes('biquge') || src.site.toLowerCase().includes('full') || src.site.toLowerCase().includes('truyenfull')) {
                  logoColor = 'bg-sky-500 text-white';
                } else if (src.site.toLowerCase().includes('faloo') || src.site.toLowerCase().includes('vcomi') || src.site.toLowerCase().includes('fanqie')) {
                  logoColor = 'bg-orange-500 text-white';
                } else if (src.site.toLowerCase().includes('quanben') || src.site.toLowerCase().includes('hjwzw')) {
                  logoColor = 'bg-purple-500 text-white';
                }

                if (src.isSearch) {
                  return (
                    <button 
                      key={idx} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchMenu(prev => prev?.site === src.site ? null : { site: src.site, isChinese: src.isChinese });
                      }}
                      className={`inline-flex items-center gap-1 bg-[#0b0b14]/20 border border-dashed border-[#1f1f3a]/80 hover:border-purple-500/50 rounded-lg px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200 transition-all ${
                        searchMenu?.site === src.site ? 'border-purple-500 text-white bg-purple-950/20' : ''
                      }`}
                      title={`Không có link trực tiếp. Click để tìm kiếm trên Google/Baidu cho ${src.site}`}
                    >
                      <span className={`w-3 h-3 rounded flex items-center justify-center text-[7px] font-extrabold ${logoColor} opacity-60`}>
                        {src.site[0]}
                      </span>
                      {src.site}
                      <Search className="w-2.5 h-2.5 text-slate-500 ml-0.5" />
                    </button>
                  );
                }

                return (
                  <a 
                    key={idx}
                    href={src.url}
                    onClick={(e) => {
                      e.preventDefault();
                      openInBrowser(src.url);
                    }}
                    className="cursor-pointer inline-flex items-center gap-1 bg-purple-950/20 hover:bg-purple-900/40 border border-purple-500/25 hover:border-purple-500/45 text-purple-300 rounded-lg px-2 py-0.5 text-[11px] font-black transition-all hover:scale-[1.02]"
                    title={`Đi tới ${src.site} gốc`}
                  >
                    <span className={`w-3 h-3 rounded flex items-center justify-center text-[8px] font-extrabold ${logoColor}`}>
                      {src.site[0]}
                    </span>
                    {src.site}
                    <ExternalLink className="w-2.5 h-2.5 text-purple-400 ml-0.5" />
                  </a>
                );
              })}
            </div>

            <div className="flex items-center gap-1 bg-[#12122b]/50 border border-purple-500/10 p-1 rounded-xl shadow-md">
              <button 
                onClick={handleTTSPlay}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isCurrentChapterPlaying 
                    ? 'bg-purple-600 border border-purple-600 text-white shadow shadow-purple-500/25' 
                    : 'border-transparent text-slate-300 hover:bg-white/5'
                }`}
              >
                {isCurrentChapterPlaying ? <Pause className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                <span>{isCurrentChapterPlaying ? (t.reader?.pauseBtn || "Dừng đọc AI") : (t.reader?.playBtn || "Đọc Audio AI")}</span>
              </button>

              {activeAudioObj && (
                <>
                  <button
                    onClick={() => {
                      const isSameBook = String(activeAudioObj.book?.id) === String(bookId);
                      if (isSameBook) {
                        if (activeAudioObj.chapterIdx !== parseInt(chapterIdx)) {
                          navigate(`/book/${bookId}/read/${activeAudioObj.chapterIdx}`);
                        } else {
                          const activeEl = document.getElementById('active-tts-sentence');
                          if (activeEl) {
                            activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }
                      } else {
                        alert("Đang phát ở sách khác: " + (activeAudioObj.book?.title || "Không rõ"));
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                    title="Quay lại vị trí/chương đang đọc"
                  >
                    <Target className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={handleToggleAutoScroll}
                    className={`p-1.5 rounded-lg transition-all ${
                      autoScrollTts ? 'text-purple-400 bg-purple-500/10' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title={autoScrollTts ? "Tắt tự động cuộn trang" : "Bật tự động cuộn trang"}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search Dropdown Modal */}
          {searchMenu && (
            <div className="relative z-35 p-3.5 bg-[#0c0d1e]/98 border border-purple-500/45 rounded-xl shadow-2xl backdrop-blur-xl text-slate-200 text-xs space-y-3 max-w-md animate-slideUp">
              <div className="flex justify-between items-center border-b border-purple-500/10 pb-1.5">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-purple-300 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-purple-400" /> Tìm kiếm nguồn {searchMenu.site}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSearchMenu(null); }}
                  className="p-0.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Keyword Customizer */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Từ khóa phụ bổ sung</label>
                <input 
                  type="text" 
                  value={customKeyword}
                  onChange={(e) => setCustomKeyword(e.target.value)}
                  placeholder="miễn phí, mới nhất, raw..."
                  className="w-full px-2.5 py-1.5 bg-[#080814] border border-[#1f1f3a] rounded-lg text-slate-200 outline-none focus:border-purple-500/70 transition-colors text-[10px]"
                />
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-1 gap-1.5">
                <button 
                  onClick={() => triggerSearch('google', 'vi')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition-all"
                >
                  <span className="flex items-center gap-1.5">🇻🇳 Tìm Google Tiếng Việt</span>
                  <span className="text-[9px] text-purple-200 italic font-medium">Tên dịch + Tác giả Việt</span>
                </button>
                
                <button 
                  onClick={() => triggerSearch('google', 'zh')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-all"
                >
                  <span className="flex items-center gap-1.5">🇨🇳 Tìm Google Tiếng Trung</span>
                  <span className="text-[9px] text-blue-200 italic font-medium">Tên gốc + Tác giả Trung</span>
                </button>

                <button 
                  onClick={() => triggerSearch('baidu', 'zh')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#121225] border border-[#1f1f3a] hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold transition-all"
                >
                  <span className="flex items-center gap-1.5">🇨🇳 Tìm Baidu Tiếng Trung (Raw)</span>
                  <span className="text-[9px] text-slate-500 italic font-medium">Tên gốc + Tác giả Trung</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <h2 className="text-xl md:text-2xl font-black mb-2 border-b border-slate-500/10 pb-4 text-center">
          {chapterTitle}
        </h2>

        {getReadingTime() && (
          <div className="text-center text-[10px] text-slate-400 mb-6 flex justify-center items-center gap-2">
            <span>⏱️ Thời gian đọc: ~{getReadingTime().minutes} phút {getReadingTime().seconds} giây (tốc độ {audioSpeed.toFixed(1)}x)</span>
            <span>•</span>
            <span>📝 {getReadingTime().wordCount} từ</span>
          </div>
        )}

        {translating && (
          <div className="text-slate-400 text-xs text-center py-2 animate-pulse">
            {t.comparingText || "Đang đồng bộ hóa bản dịch..."}
          </div>
        )}

        {/* Text paragraph content rendered to chosen sizes/fonts */}
        <div 
          style={{ fontSize: `${fontSize}px` }}
          className={`whitespace-pre-line break-words text-justify select-text focus:outline-none ${getFontClass()} ${getLineHeightClass()}`}
        >
          {renderHighlightedContent()}
        </div>

        {/* Quảng cáo AdSense thân thiện, ẩn đối với VIP */}
        <GoogleAd slot="reader-bottom" />

        {/* Navigation bottom bar */}
        <div className="flex justify-between items-center gap-4 pt-12 border-t border-slate-500/10 reader-overlay">
          <button 
            onClick={handlePrevChapter}
            disabled={parseInt(chapterIdx) <= 1}
            className="flex items-center gap-1.5 px-5 py-3 border border-slate-500/20 rounded-xl hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> {t.reader?.prevChapter || "Chương trước"}
          </button>
          
          <button 
            onClick={handleNextChapter}
            disabled={parseInt(chapterIdx) >= 50}
            className="flex items-center gap-1.5 px-5 py-3 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-xl hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all"
          >
            {t.reader?.nextChapter || "Chương sau"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        </div>

    </ReaderLayout>
  );
}
