import { useState, useEffect, useRef } from 'react';
import { 
  Sliders, X, ChevronLeft, ChevronRight, ArrowUp, 
  Bookmark, BookmarkPlus, Play, Pause, Sparkles, Volume2, 
  Moon, Trash2, Check, Type, 
  Target, Compass, Timer, ShieldCheck, SkipBack, SkipForward,
  RotateCcw, History, CheckCircle2, RefreshCw
} from 'lucide-react';

export default function ReaderQuickTools({ 
  activeTabId, 
  isAutoTranslate, 
  onToolAction, 
  isAudioPlaying,
  darkModeActive,
  cleanAdsActive
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('__tienhiep_reader_bookmarks') || '[]');
    } catch {
      return [];
    }
  });
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      return settings.scrollSpeed || 25;
    } catch {
      return 25;
    }
  });
  const [nextDelay, setNextDelay] = useState(() => {
    try {
      return Number(localStorage.getItem('__tienhiep_auto_next_delay') || 5);
    } catch {
      return 5;
    }
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showNextRuleSettings, setShowNextRuleSettings] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);
  const [customSelector, setCustomSelector] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [ruleFeedback, setRuleFeedback] = useState('');
  const menuRef = useRef(null);

  const handleNextWithDelay = (delay = nextDelay) => {
    if (onToolAction) {
      onToolAction('next_with_delay', { delay });
      setIsOpen(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isOpen && onToolAction) {
      onToolAction('get_next_rule').then(data => {
        if (isMounted && data) {
          setCurrentRule(data);
          if (data.rule) {
            setCustomSelector(data.rule.selector || '');
            setCustomUrl(data.rule.customUrl || '');
          } else {
            setCustomSelector('');
            setCustomUrl('');
          }
          // Nạp cài đặt riêng cho tên miền trang web hiện tại (host)
          if (data.host) {
            try {
              const siteKey = `__tienhiep_site_settings_${data.host}`;
              const siteSettings = JSON.parse(localStorage.getItem(siteKey) || '{}');
              if (siteSettings.scrollSpeed !== undefined) setScrollSpeed(siteSettings.scrollSpeed);
              if (siteSettings.nextDelay !== undefined) setNextDelay(siteSettings.nextDelay);
            } catch (e) {}
          }
        }
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [isOpen, activeTabId]);

  // Lưu bookmarks vào localStorage
  const saveBookmarksToStorage = (newList) => {
    setBookmarks(newList);
    localStorage.setItem('__tienhiep_reader_bookmarks', JSON.stringify(newList));
  };

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Xử lý Đánh dấu vị trí hiện tại
  const handleSaveBookmark = async () => {
    if (!onToolAction) return;
    try {
      const data = await onToolAction('bookmark_save');
      if (data && data.url) {
        const newBm = {
          id: Date.now(),
          title: data.title || 'Chương đọc',
          url: data.url,
          scrollY: data.scrollY || 0,
          percent: data.percent || 0,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit' })
        };
        // Giữ tối đa 15 bookmark gần nhất
        const updated = [newBm, ...bookmarks.filter(b => b.url !== data.url || Math.abs(b.scrollY - newBm.scrollY) > 200)].slice(0, 15);
        saveBookmarksToStorage(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Save bookmark error:', err);
    }
  };

  // Nhảy đến vị trí bookmark
  const handleJumpToBookmark = (bm) => {
    if (onToolAction) {
      onToolAction('bookmark_jump', bm);
    }
  };

  // Xóa 1 bookmark
  const handleDeleteBookmark = (id, e) => {
    e.stopPropagation();
    const updated = bookmarks.filter(b => b.id !== id);
    saveBookmarksToStorage(updated);
  };

  // Bật/Tắt cuộn tự động
  const handleToggleAutoScroll = async () => {
    if (!onToolAction) return;
    const newState = !isAutoScrolling;
    setIsAutoScrolling(newState);
    onToolAction('toggle_scroll', { enabled: newState, speed: scrollSpeed });
  };

  // Thay đổi tốc độ cuộn (lưu chung & lưu riêng theo từng trang web)
  const handleChangeSpeed = (newSpeed) => {
    setScrollSpeed(newSpeed);
    try {
      const settings = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      settings.scrollSpeed = newSpeed;
      localStorage.setItem('translationSettings', JSON.stringify(settings));

      if (currentRule?.host) {
        const siteKey = `__tienhiep_site_settings_${currentRule.host}`;
        const siteSettings = JSON.parse(localStorage.getItem(siteKey) || '{}');
        siteSettings.scrollSpeed = newSpeed;
        localStorage.setItem(siteKey, JSON.stringify(siteSettings));
      }
    } catch (err) {
      console.debug(err);
    }

    if (isAutoScrolling && onToolAction) {
      onToolAction('set_scroll_speed', newSpeed);
    }
  };

  // Thay đổi thời gian đếm ngược chuyển chương
  const handleChangeDelay = (newDelay) => {
    setNextDelay(newDelay);
    try {
      localStorage.setItem('__tienhiep_auto_next_delay', String(newDelay));
      if (currentRule?.host) {
        const siteKey = `__tienhiep_site_settings_${currentRule.host}`;
        const siteSettings = JSON.parse(localStorage.getItem(siteKey) || '{}');
        siteSettings.nextDelay = newDelay;
        localStorage.setItem(siteKey, JSON.stringify(siteSettings));
      }
    } catch (err) {
      console.debug(err);
    }
  };

  // Dạy nút chương sau bằng chuột trên web
  const handleTeachNext = () => {
    setIsOpen(false);
    if (onToolAction) {
      onToolAction('teach_next');
    }
  };

  // Lưu quy tắc selector hoặc url cho truyện này
  const handleSaveRule = async () => {
    if (!onToolAction) return;
    const ruleData = {
      selector: customSelector.trim(),
      customUrl: customUrl.trim(),
      pattern: customUrl.trim() ? 'direct_url' : (customSelector.trim() ? 'selector' : 'auto_increment')
    };
    await onToolAction('save_next_rule', ruleData);
    setRuleFeedback('Đã lưu quy tắc mới vào danh sách!');
    setTimeout(() => setRuleFeedback(''), 2500);
    try {
      const refreshed = await onToolAction('get_next_rule');
      if (refreshed) setCurrentRule(refreshed);
    } catch (err) {
      console.debug(err);
    }
  };

  // Chọn một quy tắc khác trong danh sách đã lưu (ưu tiên đưa lên đầu)
  const handleSelectRule = async (ruleId) => {
    if (!onToolAction) return;
    await onToolAction('select_next_rule', { ruleId });
    setRuleFeedback('Đã chọn quy tắc ưu tiên!');
    setTimeout(() => setRuleFeedback(''), 2000);
    try {
      const refreshed = await onToolAction('get_next_rule');
      if (refreshed) {
        setCurrentRule(refreshed);
        if (refreshed.rule) {
          setCustomSelector(refreshed.rule.selector || '');
          setCustomUrl(refreshed.rule.customUrl || '');
        }
      }
    } catch (err) {
      console.debug(err);
    }
  };

  // Xóa 1 quy tắc cụ thể
  const handleDeleteRule = async (ruleId = null) => {
    if (!onToolAction) return;
    await onToolAction('delete_next_rule', { ruleId });
    setRuleFeedback(ruleId ? 'Đã xóa quy tắc!' : 'Đã xóa quy tắc!');
    setTimeout(() => setRuleFeedback(''), 2000);
    try {
      const refreshed = await onToolAction('get_next_rule');
      if (refreshed) {
        setCurrentRule(refreshed);
        if (refreshed.rule) {
          setCustomSelector(refreshed.rule.selector || '');
          setCustomUrl(refreshed.rule.customUrl || '');
        } else {
          setCustomSelector('');
          setCustomUrl('');
        }
      }
    } catch (err) {
      console.debug(err);
    }
  };

  // Xóa sạch toàn bộ quy tắc đã lưu của trang web này (Clear All)
  const handleClearAllRules = async () => {
    if (!onToolAction) return;
    await onToolAction('clear_all_next_rules');
    setCustomSelector('');
    setCustomUrl('');
    setRuleFeedback('Đã xóa sạch tất cả quy tắc của trang web này!');
    setTimeout(() => setRuleFeedback(''), 2500);
    try {
      const refreshed = await onToolAction('get_next_rule');
      if (refreshed) setCurrentRule(refreshed);
    } catch (err) {
      console.debug(err);
    }
  };

  // Thử chuyển chương bằng một quy tắc cụ thể trong danh sách
  const handleTestSpecificRule = async (ruleId) => {
    if (!onToolAction) return;
    if (ruleId) {
      await onToolAction('select_next_rule', { ruleId });
      const refreshed = await onToolAction('get_next_rule');
      if (refreshed) setCurrentRule(refreshed);
    }
    onToolAction('next');
  };

  // Test thử chuyển chương sau với quy tắc hiện tại
  const handleTestNext = () => {
    if (onToolAction) {
      onToolAction('next');
    }
  };

  return (
    <>
      {/* ═══ NÚT NỔI LỀ TRÁI: VỀ CHƯƠNG TRƯỚC ═══ */}
      <div className="fixed left-3 bottom-24 z-[9990] select-none">
        <button
          onClick={() => onToolAction && onToolAction('prev')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-950/85 hover:bg-slate-900 text-slate-300 hover:text-white transition-all duration-200 active:scale-90 border border-white/15 hover:border-indigo-500/50 shadow-[0_6px_20px_rgba(0,0,0,0.5)] backdrop-blur-md group"
          title="Về chương trước (|<)"
        >
          <SkipBack className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        </button>
      </div>

      {/* ═══ CỤM NỔI LỀ PHẢI: CHỈ ĐỊNH & SANG CHƯƠNG SAU ═══ */}
      <div className="fixed right-3 bottom-24 z-[9990] flex flex-col items-center gap-2 select-none">
        {/* Chỉ định nút Chương Sau [ 🎯 ] */}
        <button
          onClick={() => onToolAction && onToolAction('teach_next')}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-950/85 hover:bg-amber-950/90 text-amber-400 hover:text-amber-200 transition-all duration-200 active:scale-90 border border-amber-400/40 hover:border-amber-300 shadow-[0_6px_20px_rgba(0,0,0,0.5)] backdrop-blur-md group"
          title="Chỉ định nút / URL Chương Sau (Bấm nút trên web để dạy)"
        >
          <Target className="w-4 h-4 transition-transform group-hover:scale-110" />
        </button>

        {/* Sang chương tiếp theo [ >| ] */}
        <button
          onClick={() => onToolAction && onToolAction('next')}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white transition-all duration-200 active:scale-90 border border-indigo-400/50 shadow-[0_6px_24px_rgba(99,102,241,0.5)] backdrop-blur-md group"
          title="Sang chương tiếp theo (>|)"
        >
          <SkipForward className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* ═══ GÓC DƯỚI PHẢI: NÚT DẤU TRANG & POPUP TIỆN ÍCH ═══ */}
      <div ref={menuRef} className="fixed right-3 bottom-6 z-[9995] flex flex-col items-end select-none">
      {/* ═══ BẢNG ĐIỀU KHIỂN NỔI (POPUP MENU) ═══ */}
      {isOpen && (
        <div className="mb-3 w-84 max-h-[82vh] overflow-y-auto no-scrollbar bg-slate-950/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex flex-col gap-3.5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 text-slate-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">Tiện Ích Đọc Truyện</h4>
                <p className="text-[10px] text-slate-400">Điều khiển & Đánh dấu trang</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nhóm 1: Điều hướng & Chuyển chương */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              Chuyển Chương & Vị Trí
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onToolAction && onToolAction('prev')}
                className="flex items-center justify-center gap-1 py-2 px-2.5 bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-medium rounded-xl border border-white/10 text-slate-200 transition-all"
                title="Về chương trước"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-indigo-400" /> Trước
              </button>
              <button
                onClick={() => onToolAction && onToolAction('scroll_top')}
                className="flex items-center justify-center gap-1 py-2 px-2.5 bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-medium rounded-xl border border-white/10 text-slate-300 transition-all"
                title="Cuộn lên đỉnh chương"
              >
                <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> Lên Đỉnh
              </button>
              <button
                onClick={() => onToolAction && onToolAction('next')}
                className="flex items-center justify-center gap-1 py-2 px-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 active:scale-95 text-xs font-medium rounded-xl border border-indigo-500/40 text-indigo-200 transition-all"
                title="Sang chương sau ngay lập tức"
              >
                Sau <ChevronRight className="w-3.5 h-3.5 text-indigo-300" />
              </button>
            </div>

            {/* Hẹn Giờ Chuyển Chương (Cài đặt số giây ẩn) */}
            <div className="flex flex-col gap-1.5 bg-white/5 p-2 rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1 font-semibold text-amber-300">
                  <Timer className="w-3.5 h-3.5 text-amber-400" /> Hẹn Giờ Chuyển Chương
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{nextDelay}s</span>
              </div>
              <div className="flex items-center gap-1">
                {[3, 5, 10, 15].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => handleChangeDelay(sec)}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                      nextDelay === sec
                        ? 'bg-amber-500/25 border-amber-400/50 text-amber-300 shadow-sm'
                        : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleNextWithDelay(nextDelay)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-amber-600/30 to-amber-700/30 hover:from-amber-600/50 hover:to-amber-700/50 active:scale-95 text-xs font-semibold rounded-lg border border-amber-500/40 text-amber-200 transition-all shadow-sm"
                title={`Bắt đầu đếm ngược ${nextDelay} giây và chuyển sang chương tiếp theo`}
              >
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>Bắt đầu đếm ngược ({nextDelay}s) sang chương</span>
              </button>
            </div>
          </div>

          {/* Nhóm Quy Tắc Sang Chương (Từng Truyện & Domain) */}
          <div className="flex flex-col gap-1.5 bg-gradient-to-br from-indigo-950/50 to-slate-900/60 p-2.5 rounded-xl border border-indigo-500/25">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-cyan-400" /> Quy Tắc Sang Chương
              </span>
              {currentRule?.history && currentRule.history.length > 0 ? (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {currentRule.history.length} quy tắc đã lưu
                </span>
              ) : currentRule?.rule ? (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  Đã lưu quy tắc
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Tự động (+1 URL)
                </span>
              )}
            </div>

            {/* Nút chính: Chỉ định nút trực tiếp trên trang */}
            <button
              onClick={handleTeachNext}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-indigo-600/40 to-purple-600/40 hover:from-indigo-600/60 hover:to-purple-600/60 active:scale-95 text-xs font-semibold rounded-xl border border-indigo-400/30 text-indigo-100 shadow-sm transition-all"
              title="Click chọn trực tiếp nút Chương Sau trên trang web để lưu vĩnh viễn cho truyện này"
            >
              <Target className="w-3.5 h-3.5 text-amber-300" />
              <span>Chỉ Định Nút Chương Sau (Dạy Nút)</span>
            </button>

            {/* Xem & chỉnh sửa chi tiết URL / Selector */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                onClick={() => setShowNextRuleSettings(!showNextRuleSettings)}
                className="text-[10px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <Sliders className="w-3 h-3" />
                <span>
                  {showNextRuleSettings 
                    ? 'Thu gọn cài đặt' 
                    : `Cài đặt & Lịch sử (${currentRule?.history?.length || (currentRule?.rule ? 1 : 0)} quy tắc)...`}
                </span>
              </button>
              {(currentRule?.history?.length > 0 || currentRule?.rule) && (
                <button
                  onClick={handleClearAllRules}
                  className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5 transition-colors"
                  title="Xóa tất cả quy tắc đã lưu của trang web/truyện này"
                >
                  <Trash2 className="w-3 h-3" /> Xóa tất cả
                </button>
              )}
            </div>

            {/* Bảng chi tiết cài đặt quy tắc URL / Selector & Danh sách lịch sử từ mới nhất đến cũ nhất */}
            {showNextRuleSettings && (
              <div className="flex flex-col gap-2.5 pt-2.5 border-t border-indigo-500/20 text-left animate-in fade-in duration-150">
                <div className="text-[11px] text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center justify-between">
                  <span className="text-slate-400">Trang / Truyện:</span>
                  <span className="text-amber-300 font-mono font-semibold truncate max-w-[190px]">{currentRule?.novelKey || currentRule?.host || 'Trang hiện tại'}</span>
                </div>

                {/* Danh sách quy tắc đã lưu (MỚI NHẤT ➔ CŨ NHẤT) */}
                {currentRule?.history && currentRule.history.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-amber-300 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <History className="w-3 h-3 text-amber-400" />
                        Danh sách quy tắc (Ưu tiên Mới ➔ Cũ)
                      </span>
                      <span className="text-[9px] text-slate-400 lowercase font-normal">
                        thử / chọn cái khác
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
                      {currentRule.history.map((ruleItem, idx) => {
                        const isPrimary = idx === 0;
                        return (
                          <div
                            key={ruleItem.id || idx}
                            className={`p-2 rounded-lg border transition-all text-xs flex flex-col gap-1 ${
                              isPrimary
                                ? 'bg-amber-950/25 border-amber-400/40 shadow-sm'
                                : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isPrimary ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40' : 'bg-white/10 text-slate-400'
                                }`}>
                                  #{idx + 1} {isPrimary ? '(Ưu tiên #1)' : ''}
                                </span>
                                {isPrimary && (
                                  <span className="text-[9px] text-emerald-300 font-medium bg-emerald-500/20 px-1 rounded">
                                    Đang dùng
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {!isPrimary && (
                                  <button
                                    onClick={() => handleSelectRule(ruleItem.id)}
                                    className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/30 transition-all active:scale-95"
                                    title="Chọn quy tắc này làm ưu tiên hàng đầu"
                                  >
                                    Chọn cái này
                                  </button>
                                )}
                                <button
                                  onClick={() => handleTestSpecificRule(ruleItem.id)}
                                  className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 transition-all active:scale-95 flex items-center gap-0.5"
                                  title="Thử chuyển ngay bằng quy tắc này xem có chạy được không"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" /> Thử
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(ruleItem.id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Xóa quy tắc này"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Chi tiết nội dung quy tắc */}
                            <div className="text-[11px] font-mono truncate text-slate-300">
                              {ruleItem.customUrl ? (
                                <span className="text-cyan-300">URL: {ruleItem.customUrl}</span>
                              ) : ruleItem.selector ? (
                                <span className="text-amber-200">Selector: {ruleItem.selector}</span>
                              ) : ruleItem.text ? (
                                <span className="text-emerald-300">Chữ nút: "{ruleItem.text}"</span>
                              ) : (
                                <span className="text-slate-400">Quy tắc tự học</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CSS Selector Input */}
                <div className="flex flex-col gap-1 pt-1 border-t border-white/10">
                  <label className="text-[11px] font-semibold text-indigo-200 flex items-center gap-1">
                    <span>Thêm Selector CSS mới:</span>
                  </label>
                  <input
                    type="text"
                    value={customSelector}
                    onChange={(e) => setCustomSelector(e.target.value)}
                    placeholder="#next_url, .btn-next, a.next"
                    className="w-full bg-slate-900/90 border border-indigo-500/40 focus:border-amber-400 focus:bg-slate-950 focus:ring-1 focus:ring-amber-400/50 rounded-lg px-3 py-1.5 text-xs text-amber-200 placeholder-slate-500 outline-none font-mono transition-all selection:bg-indigo-600 selection:text-white"
                  />
                </div>

                {/* Direct Next URL Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-indigo-200 flex items-center gap-1">
                    <span>Hoặc Thêm URL chương mới:</span>
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://.../chap-2.html"
                    className="w-full bg-slate-900/90 border border-indigo-500/40 focus:border-cyan-400 focus:bg-slate-950 focus:ring-1 focus:ring-cyan-400/50 rounded-lg px-3 py-1.5 text-xs text-cyan-200 placeholder-slate-500 outline-none font-mono transition-all selection:bg-indigo-600 selection:text-white"
                  />
                </div>

                {ruleFeedback && (
                  <div className="text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-lg py-1 px-2.5 font-semibold text-center animate-in fade-in">
                    {ruleFeedback}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleSaveRule}
                    className="flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-xs font-bold text-white rounded-lg border border-emerald-400/50 shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" /> Lưu Quy Tắc
                  </button>
                  <button
                    onClick={handleTestNext}
                    className="flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-xs font-bold text-white rounded-lg border border-indigo-400/50 shadow-sm transition-all"
                    title="Thử chuyển ngay sang chương sau để kiểm tra"
                  >
                    <ChevronRight className="w-3.5 h-3.5" /> Thử Chuyển
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nhóm 2: Đánh dấu vị trí đọc (Bookmarks) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-fuchsia-400" /> Vị Trí Đọc (Dấu Trang)
              </span>
              <button
                onClick={handleSaveBookmark}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  saveSuccess 
                    ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                    : 'bg-fuchsia-600/20 hover:bg-fuchsia-600/40 text-fuchsia-300 border border-fuchsia-500/30 active:scale-95'
                }`}
              >
                {saveSuccess ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                {saveSuccess ? 'Đã lưu!' : 'Đánh dấu'}
              </button>
            </div>

            {/* Danh sách bookmarks gần đây */}
            <div className="max-h-24 overflow-y-auto no-scrollbar flex flex-col gap-1 bg-black/20 p-1.5 rounded-xl border border-white/5">
              {bookmarks.length === 0 ? (
                <div className="py-2 text-center text-[10px] text-slate-500 italic">
                  Chưa có vị trí nào được đánh dấu. Hãy bấm "Đánh dấu" ở trên!
                </div>
              ) : (
                bookmarks.slice(0, 4).map(bm => (
                  <div
                    key={bm.id}
                    onClick={() => handleJumpToBookmark(bm)}
                    className="flex items-center justify-between p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors group text-left"
                  >
                    <div className="flex-1 min-w-0 pr-1.5">
                      <p className="text-[11px] font-medium text-slate-200 truncate">{bm.title}</p>
                      <p className="text-[9px] text-slate-400 flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">{bm.percent}%</span>
                        <span>•</span>
                        <span>{bm.time} ({bm.date})</span>
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteBookmark(bm.id, e)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-60 group-hover:opacity-100 shrink-0"
                      title="Xóa dấu trang này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Nhóm 3: Cuộn tự động thông minh (Auto Scroll) */}
          <div className="flex flex-col gap-1.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                Cuộn Tự Động
              </span>
              <button
                onClick={handleToggleAutoScroll}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  isAutoScrolling
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {isAutoScrolling ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                {isAutoScrolling ? 'Dừng Cuộn' : 'Bật Cuộn'}
              </button>
            </div>

            {/* Điều chỉnh tốc độ cuộn */}
            <div className="flex items-center justify-between gap-1 pt-1">
              <span className="text-[10px] text-slate-400">Tốc độ:</span>
              <div className="flex items-center gap-1">
                {[
                  { label: 'Chậm', speed: 45 },
                  { label: 'Vừa', speed: 25 },
                  { label: 'Nhanh', speed: 12 }
                ].map(item => (
                  <button
                    key={item.speed}
                    onClick={() => handleChangeSpeed(item.speed)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                      scrollSpeed === item.speed
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Nhóm 4: Tiện ích đọc nhanh (Quick Toggles) */}
          <div className="grid grid-cols-5 gap-1 pt-1 border-t border-white/10">
            {/* Dịch */}
            <button
              onClick={() => onToolAction && onToolAction('translate')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                isAutoTranslate 
                  ? 'bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/40 shadow-[0_0_10px_rgba(217,70,239,0.3)]' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-transparent'
              }`}
              title="Dịch trang / Bật Auto Dịch"
            >
              <Sparkles className="w-3.5 h-3.5 mb-1" />
              <span className="text-[9px] font-medium">{isAutoTranslate ? 'Đang dịch' : 'Dịch'}</span>
            </button>

            {/* Audio TTS */}
            <button
              onClick={() => onToolAction && onToolAction('audio')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                isAudioPlaying 
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-transparent'
              }`}
              title="Nghe đọc giọng AI"
            >
              <Volume2 className="w-3.5 h-3.5 mb-1" />
              <span className="text-[9px] font-medium">Đọc AI</span>
            </button>

            {/* Cỡ chữ */}
            <button
              onClick={() => onToolAction && onToolAction('font_size_cycle')}
              className="flex flex-col items-center justify-center p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all border border-transparent"
              title="Thay đổi cỡ chữ (Nhỏ - Vừa - To)"
            >
              <Type className="w-3.5 h-3.5 mb-1 text-cyan-400" />
              <span className="text-[9px] font-medium">Cỡ chữ</span>
            </button>

            {/* Chế độ tối */}
            <button
              onClick={() => onToolAction && onToolAction('dark_mode')}
              className="flex flex-col items-center justify-center p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all border border-transparent"
              title="Bật/Tắt chế độ tối (Bóng tối)"
            >
              <Moon className="w-3.5 h-3.5 mb-1 text-amber-300" />
              <span className="text-[9px] font-medium">Tối/Sáng</span>
            </button>

            {/* Chặn Quảng Cáo */}
            <button
              onClick={() => onToolAction && onToolAction('clean_ads')}
              className="flex flex-col items-center justify-center p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all border border-transparent"
              title="Bật/Tắt chặn quảng cáo & popup tự hiện"
            >
              <ShieldCheck className="w-3.5 h-3.5 mb-1 text-emerald-400" />
              <span className="text-[9px] font-medium">Chặn QC</span>
            </button>
          </div>
        </div>
      )}

        {/* Nút mở rộng Menu Dấu Trang & Tiện Ích */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-300 active:scale-95 border backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.5)] ${
            isOpen
              ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.5)]'
              : isAutoScrolling
              ? 'bg-amber-600 text-white border-amber-400 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'bg-slate-950/85 hover:bg-fuchsia-950/80 text-fuchsia-300 hover:text-white border-fuchsia-500/30'
          }`}
          title="Mở menu Tiện ích, Hẹn giờ & Dấu trang"
        >
          <Bookmark className="w-3.5 h-3.5 fill-fuchsia-400/20" />
          <span className="text-[11px] font-bold">Dấu Trang</span>
          <Sliders className="w-3 h-3 opacity-70" />

          {/* Badge trạng thái nếu đang dịch hoặc đang cuộn */}
          {(isAutoTranslate || isAutoScrolling) && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-fuchsia-500 border border-slate-900"></span>
            </span>
          )}
        </button>
      </div>
    </>
  );
}
