import React, { useState } from 'react';
import { Search, Globe, Shield, Sparkles, BookOpen, Compass, ExternalLink, Flame } from 'lucide-react';

export default function ChromeMobileNewTab({ onNavigate, isPrivate = false, onTogglePrivate }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    if (q.startsWith('http://') || q.startsWith('https://')) {
      onNavigate(q);
    } else if (q.includes('.') && !q.includes(' ')) {
      onNavigate(`https://${q}`);
    } else {
      onNavigate(`https://www.google.com/search?q=${encodeURIComponent(q)}`);
    }
  };

  const SHORTCUTS = [
    { name: 'Google', icon: '🔍', url: 'https://www.google.com', color: 'from-blue-500 to-indigo-600', isExternal: true },
    { name: 'Truyện Full', icon: '📖', url: 'https://truyenfull.vn', color: 'from-emerald-500 to-teal-600', isExternal: false },
    { name: '69 Thư Ba', icon: '📚', url: 'https://www.69shuba.com/', color: 'from-amber-500 to-orange-600', isExternal: false },
    { name: 'YouTube', icon: '🎬', url: 'https://m.youtube.com', color: 'from-red-500 to-rose-600', isExternal: true },
    { name: 'TikTok', icon: '📱', url: 'https://www.tiktok.com', color: 'from-neutral-900 to-zinc-700', isExternal: true },
    { name: 'Hoàng Kim Ốc', icon: '📖', url: 'https://m.hjwzw.com', color: 'from-emerald-500 to-teal-600', isExternal: false },
    { name: 'Bút Thú Các', icon: '⚡', url: 'https://www.b520.cc', color: 'from-purple-500 to-violet-600', isExternal: false },
    { name: 'UU Đọc Sách', icon: '📗', url: 'https://uukanshu.cc', color: 'from-cyan-500 to-blue-600', isExternal: false },
    { name: 'Phiêu Thiên', icon: '☁️', url: 'https://www.ptwxz.com', color: 'from-sky-500 to-indigo-600', isExternal: false },
  ];

  return (
    <div className={`w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center justify-between p-4 transition-colors duration-300 ${
      isPrivate ? 'bg-[#121214] text-slate-200' : 'bg-gradient-to-b from-[#181824] via-[#121216] to-[#0d0d10] text-white'
    }`}>
      <div className="w-full max-w-md flex flex-col items-center pt-8 pb-4">
        {/* Brand / Logo */}
        {isPrivate ? (
          <div className="flex flex-col items-center gap-3 text-center mb-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-purple-950/50 border-2 border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-purple-200 tracking-wide">Chế độ Ẩn danh (Private)</h2>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Bạn có thể duyệt web riêng tư. Các trang web xem trong tab này sẽ <span className="text-purple-300 font-semibold">không được lưu vào lịch sử</span>.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 mb-6 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              Tiên Hiệp AI Browser
            </h1>
            <p className="text-[11px] text-slate-400">Trình duyệt Đọc Truyện & Đa Phương Tiện Chuẩn Mobile</p>
          </div>
        )}

        {/* Smart Search Bar */}
        <form onSubmit={handleSearch} className="w-full relative mb-6">
          <div className={`flex items-center gap-2 px-3.5 py-3 rounded-2xl border transition-all duration-200 shadow-md ${
            isPrivate 
              ? 'bg-[#1e1e24] border-purple-500/30 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20' 
              : 'bg-white/10 border-white/15 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/25'
          }`}>
            <Search className={`w-4 h-4 shrink-0 ${isPrivate ? 'text-purple-400' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={isPrivate ? "Tìm kiếm ẩn danh hoặc nhập URL..." : "Tìm trên Google hoặc nhập URL..."}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none min-w-0"
              autoFocus={false}
            />
            {searchTerm && (
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-transform active:scale-95 shrink-0"
              >
                Đi
              </button>
            )}
          </div>
        </form>

        {/* Shortcuts Grid (Speed Dial) */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lối tắt nhanh</span>
            {onTogglePrivate && (
              <button
                type="button"
                onClick={onTogglePrivate}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                {isPrivate ? '🌐 Về Tab Thường' : '🕶️ Chuyển Tab Ẩn Danh'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {SHORTCUTS.map(sc => (
              <button
                key={sc.name}
                type="button"
                onClick={() => onNavigate(sc.url)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 active:scale-95 group ${
                  isPrivate
                    ? 'bg-[#1a1a20] border-white/5 hover:border-purple-500/30 hover:bg-purple-950/20'
                    : 'bg-white/5 border-white/10 hover:border-indigo-500/30 hover:bg-white/10'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${sc.color} flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform`}>
                  {sc.icon}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate max-w-[85px]">
                    {sc.name}
                  </span>
                  {sc.isExternal && (
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                      Chuẩn Mobile
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-md py-4 text-center border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-center gap-2">
        <span>🛡️ Tự động chặn quảng cáo & pop-up rác</span>
        <span>•</span>
        <span>⚡ Co giãn Mobile Responsive</span>
      </div>
    </div>
  );
}
