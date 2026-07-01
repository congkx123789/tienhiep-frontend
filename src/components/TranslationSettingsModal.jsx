import React, { useState, useEffect } from 'react';
import { X, Server, Zap, BrainCircuit, Globe, Key, Volume2, ArrowDownToLine, ArrowRightToLine, Wand2, Moon, ShieldX, Copy, GaugeCircle, Pin, PinOff, Settings } from 'lucide-react';

export default function TranslationSettingsModal({ isOpen, onClose, onToolAction, isAutoTranslate, pinnedTools, onTogglePin }) {
  const [activeTab, setActiveTab] = useState('tools'); // 'tools' or 'advanced'
  const [settings, setSettings] = useState({
    engineType: 'browser', 
    mode: 'vietphrase', 
    serverUrl: 'https://cong123779-tienhiep-api.hf.space',
    vipKey: '',
    scrollSpeed: 30, // ms per pixel, lower is faster
    audioSpeed: 1.0,
    continuousClean: true,
    typewriterEffect: false // Tắt hiệu ứng gõ chữ mặc định để hiện text ngay lập tức
  });

  useEffect(() => {
    const syncSettings = () => {
      const stored = localStorage.getItem('translationSettings');
      if (stored) {
        try {
          let parsed = JSON.parse(stored);
          if (parsed.serverUrl === 'https://tienhiep.lyvuha.com') {
            parsed.serverUrl = 'https://cong123779-tienhiep-api.hf.space';
          }
          if (parsed.engineType === 'browser' && !['vietphrase', 'hanviet'].includes(parsed.mode)) {
            parsed.mode = 'vietphrase';
          }
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {}
      }
    };

    if (isOpen) {
      syncSettings();
    }

    const handleSettingsUpdate = (e) => {
      if (e.detail) {
        setSettings(prev => ({ ...prev, ...e.detail }));
      }
    };

    window.addEventListener('translationSettingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('translationSettingsUpdated', handleSettingsUpdate);
  }, [isOpen]);

  const updateSetting = (key, value) => {
    let newSettings = { ...settings, [key]: value };
    if (key === 'engineType' && value === 'browser') {
      if (['fast', 'advanced', 'advanced_hanviet'].includes(newSettings.mode)) {
        newSettings.mode = 'vietphrase';
      }
    }
    setSettings(newSettings);
    localStorage.setItem('translationSettings', JSON.stringify(newSettings));
    
    // Dispatch event so other components (like AudioPlayer) can update instantly
    window.dispatchEvent(new CustomEvent('translationSettingsUpdated', { detail: newSettings }));
  };

  const ALL_TOOLS = [
    { id: 'translate', name: isAutoTranslate ? 'Đang Auto-Dịch' : 'Bật Auto-Dịch', icon: <Wand2 className="w-4 h-4" />, color: 'fuchsia' },
    { id: 'audio', name: 'Nghe Audio', icon: <Volume2 className="w-4 h-4" />, color: 'emerald' },
    { id: 'scroll', name: 'Tự Cuộn', icon: <ArrowDownToLine className="w-4 h-4" />, color: 'blue' },
    { id: 'next', name: 'Tới Chương', icon: <ArrowRightToLine className="w-4 h-4" />, color: 'orange' },
    { id: 'dark_mode', name: 'Chế Độ Tối', icon: <Moon className="w-4 h-4" />, color: 'slate' },
    { id: 'clean_ads', name: 'Lọc Quảng Cáo', icon: <ShieldX className="w-4 h-4" />, color: 'red' },
    { id: 'force_translate', name: 'Dịch Tức Thì', icon: <GaugeCircle className="w-4 h-4" />, color: 'violet' },
    { id: 'copy_text', name: 'Copy Chữ', icon: <Copy className="w-4 h-4" />, color: 'zinc' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible overlay just to close when clicking outside */}
      <div className="fixed inset-0 z-[9999]" onClick={onClose}></div>
      
      {/* Floating Popup Panel */}
      <div className="absolute right-2 top-12 z-[10000] bg-[#1e1e24]/95 backdrop-blur-md w-[90vw] sm:w-[380px] max-h-[85vh] rounded-2xl border border-indigo-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col origin-top-right animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between p-2 border-b border-white/10 bg-white/5">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('tools')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'tools' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <BrainCircuit className="w-4 h-4" /> Tiện Ích
            </button>
            <button 
              onClick={() => setActiveTab('advanced')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'advanced' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Settings className="w-4 h-4" /> Nâng Cao
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors mr-1">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          
          {activeTab === 'tools' ? (
            <>
              {/* Language Overview */}
          <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Nguồn</span>
              <span className="text-sm text-slate-200 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Trung Quốc (CN)
              </span>
            </div>
            <Globe className="w-5 h-5 text-indigo-400 opacity-50" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Đích</span>
              <span className="text-sm text-slate-200 font-semibold flex items-center gap-1.5">
                Tiếng Việt (VN) <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              </span>
            </div>
          </div>

          {/* Engine Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> Bộ Dịch (Engine)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => updateSetting('engineType', 'browser')}
                className={`p-3 rounded-xl border flex flex-col gap-1 items-start transition-all ${settings.engineType === 'browser' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-100' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
              >
                <span className="font-bold text-sm">Offline Local</span>
                <span className="text-[10px] opacity-70 text-left">Dịch ngay trên máy bạn. Tốc độ cao, không cần mạng.</span>
              </button>
              <button 
                onClick={() => updateSetting('engineType', 'server')}
                className={`p-3 rounded-xl border flex flex-col gap-1 items-start transition-all ${settings.engineType === 'server' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-100' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
              >
                <span className="font-bold text-sm">Cloud AI</span>
                <span className="text-[10px] opacity-70 text-left">Dịch siêu mượt qua Server mạnh mẽ. Yêu cầu VIP.</span>
              </button>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Chế Độ Dịch (Mode)
            </label>
            <select 
              value={settings.mode}
              onChange={(e) => updateSetting('mode', e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            >
              {settings.engineType === 'server' ? (
                <>
                  <option value="vietphrase">Vietphrase (Dịch Thô Server)</option>
                  <option value="hanviet">Hán Việt (Âm Hán Việt Server)</option>
                  <option value="fast">👑 Dịch Nhanh (Server AI)</option>
                  <option value="advanced">👑 Nâng Cao (Server AI)</option>
                  <option value="advanced_hanviet">👑 Nâng Cao Hán-Việt (Server AI)</option>
                </>
              ) : (
                <>
                  <option value="vietphrase">Vietphrase (Dịch Thô Local)</option>
                  <option value="hanviet">Hán Việt (Âm Hán Việt Local)</option>
                </>
              )}
            </select>
          </div>

          {/* Server Config */}
          {settings.engineType === 'server' && (
            <div className="flex flex-col gap-3 p-4 bg-indigo-900/10 rounded-xl border border-indigo-500/20">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide">Server API URL</label>
                <input 
                  type="text" 
                  value={settings.serverUrl}
                  onChange={(e) => updateSetting('serverUrl', e.target.value)}
                  placeholder="https://cong123779-tienhiep-api.hf.space"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1">
                  <Key className="w-3 h-3" /> VIP Key (Tuỳ chọn)
                </label>
                <input 
                  type="password" 
                  value={settings.vipKey}
                  onChange={(e) => updateSetting('vipKey', e.target.value)}
                  placeholder="Nhập mã VIP nếu có"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Action Tools */}
          <div className="flex flex-col gap-3 pt-4 border-t border-white/10 mt-2">
            <div className="flex items-center justify-between">
               <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Kho Tiện Ích Web</label>
               <span className="text-[10px] text-slate-500 font-semibold bg-white/5 px-2 py-0.5 rounded-full">Bấm nút ghim để đưa ra ngoài</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {ALL_TOOLS.map(tool => {
                 const isPinned = pinnedTools.includes(tool.id);
                 
                 // Define color schemes based on color key
                 const colorClasses = {
                   fuchsia: isAutoTranslate ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 border-fuchsia-400/50 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)]' : 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/20',
                   emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20',
                   blue: 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20',
                   orange: 'bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20',
                   slate: 'bg-slate-500/10 border-slate-500/30 text-slate-300 hover:bg-slate-500/20',
                   red: 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20',
                   violet: 'bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20',
                   zinc: 'bg-zinc-500/10 border-zinc-500/30 text-zinc-300 hover:bg-zinc-500/20'
                 };

                 return (
                   <div key={tool.id} className="relative flex group">
                     <button 
                       onClick={() => { onToolAction(tool.id); onClose(); }}
                       className={`flex-1 p-2.5 rounded-l-xl border-y border-l flex items-center gap-2 font-bold text-xs transition-all ${colorClasses[tool.color]}`}
                     >
                       {tool.icon} <span className="truncate">{tool.name}</span>
                     </button>
                     <button
                       onClick={() => onTogglePin(tool.id)}
                       className={`px-2.5 rounded-r-xl border-y border-r border-l-0 flex items-center justify-center transition-all ${isPinned ? 'bg-indigo-500/30 border-indigo-500/50 text-indigo-300 shadow-[inset_0_0_10px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/10'}`}
                       title={isPinned ? 'Bỏ ghim khỏi thanh công cụ' : 'Ghim ra thanh công cụ'}
                     >
                       {isPinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
                     </button>
                   </div>
                 );
              })}
            </div>
          </div>
          </>
          ) : (
          /* ADVANCED TAB */
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Scroll Speed */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
                <span><ArrowDownToLine className="w-3.5 h-3.5 inline mr-1" /> Tốc độ tự cuộn (ms/pixel)</span>
                <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">{settings.scrollSpeed}ms</span>
              </label>
              <input 
                type="range" min="10" max="100" step="5"
                value={settings.scrollSpeed}
                onChange={(e) => updateSetting('scrollSpeed', Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <span className="text-[10px] text-slate-500 text-center">Nhỏ gọn = Cuộn cực nhanh. Lớn = Cuộn chậm.</span>
            </div>

            {/* Audio Speed */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
                <span><Volume2 className="w-3.5 h-3.5 inline mr-1" /> Tốc độ Audio Đọc Truyện</span>
                <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">{settings.audioSpeed}x</span>
              </label>
              <input 
                type="range" min="0.5" max="4.0" step="0.05"
                value={settings.audioSpeed}
                onChange={(e) => updateSetting('audioSpeed', Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Continuous Clean Ads */}
            <div className="flex flex-col gap-3 p-4 bg-red-900/10 rounded-xl border border-red-500/20">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-red-200 flex items-center gap-1.5"><ShieldX className="w-4 h-4"/> Auto-Lọc QC Liên Tục</span>
                  <span className="text-[10px] text-red-300/70">Xóa rác liên tục ngầm định thay vì chỉ 1 lần.</span>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${settings.continuousClean ? 'bg-red-500' : 'bg-slate-700'}`} onClick={() => updateSetting('continuousClean', !settings.continuousClean)}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.continuousClean ? 'left-5' : 'left-1'}`}></div>
                </div>
              </label>
            </div>

            {/* Typewriter Effect */}
            <div className="flex flex-col gap-3 p-4 bg-indigo-900/10 rounded-xl border border-indigo-500/20">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-indigo-200 flex items-center gap-1.5"><Wand2 className="w-4 h-4"/> Hiệu Ứng Gõ Chữ (Typewriter)</span>
                  <span className="text-[10px] text-indigo-300/70">Tắt đi để văn bản dịch hiện ra NGAY LẬP TỨC (tốc độ cao).</span>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${settings.typewriterEffect ? 'bg-indigo-500' : 'bg-slate-700'}`} onClick={() => updateSetting('typewriterEffect', !settings.typewriterEffect)}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.typewriterEffect ? 'left-5' : 'left-1'}`}></div>
                </div>
              </label>
            </div>

            {/* Advanced Audio Rule Note */}
            <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-xs text-indigo-200">
              <strong>💡 Cơ chế Audio Thông Minh:</strong> Khi chế độ đọc Auto-Audio bật, hệ thống sẽ chờ trang web tải và <em>Dịch hoàn tất 100%</em> sang tiếng Việt rồi mới tiến hành trích xuất chữ và phát âm thanh, đảm bảo bạn không bao giờ phải nghe giọng đọc lỗi.
            </div>
          </div>
          )}
        </div>
      </div>
    </>
  );
}
