import React, { useState } from 'react';
import { Zap, ChevronDown, Check } from 'lucide-react';

export interface ModeItem {
  id: string;
  name: string;
  desc: string;
  badge?: string;
}

export interface ModeGroup {
  category: string;
  items: ModeItem[];
}

export const BASE_MODE_GROUPS: ModeGroup[] = [
  {
    category: '📖 Chế Độ Hiển Thị & Nguyên Bản',
    items: [
      { id: 'raw', name: 'Nguyên Bản (Tắt Dịch)', desc: 'Giữ nguyên văn bản gốc, không qua bộ dịch', badge: 'Gốc' },
    ]
  },
  {
    category: '⚡ Phiên Bản C++ CMLM Mới (Zero-Dependencies, 6ms)',
    items: [
      { id: '4', name: 'Mode 4: Hybrid Chuẩn AI', desc: 'Trung > Nhật > Anh (Khuyên dùng)', badge: 'Khuyên dùng' },
      { id: '1', name: 'Mode 1: Tiên Hiệp / Cổ Trang', desc: 'Ưu tiên Names Trung Quốc cổ trang' },
      { id: '2', name: 'Mode 2: Anime / Manga', desc: 'Romaji Japanese Names Nhật Bản' },
      { id: '3', name: 'Mode 3: Phương Tây / Hiện Đại', desc: 'English & Modern Names' },
    ]
  },
  {
    category: '📚 Từ Điển Truyền Thống',
    items: [
      { id: 'vietphrase', name: 'Vietphrase (Dịch Thô)', desc: 'Thuật toán từ điển VietPhrase truyền thống' },
      { id: 'hanviet', name: 'Hán Việt (Âm Hán Việt)', desc: 'Phiên âm âm Hán Việt thuần túy' },
    ]
  }
];

export const SERVER_MODE_GROUP: ModeGroup = {
  category: '⚡ Native Core Server (Local LAN)',
  items: [
    { id: 'fast', name: '⚡ Dịch Nhanh (Native Engine)', desc: 'Tốc độ cao qua Native Core C++' },
    { id: 'advanced', name: '⚡ CMLM NAT (Local AI Engine)', desc: 'Dịch ngữ cảnh chuyên sâu trên máy' },
  ]
};

interface ModeSelectorProps {
  currentMode: string | number;
  engineType: string;
  onSelectMode: (modeId: string) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  engineType,
  onSelectMode,
}) => {
  const [isModeOpen, setIsModeOpen] = useState(false);

  const allGroups = engineType === 'server'
    ? [...BASE_MODE_GROUPS, SERVER_MODE_GROUP]
    : BASE_MODE_GROUPS;

  const currentModeItem = allGroups.flatMap(g => g.items).find(i => String(i.id) === String(currentMode));
  const currentModeName = currentModeItem ? currentModeItem.name : `Mode ${currentMode}`;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-amber-400" /> Chế Độ Dịch
      </label>

      <button
        type="button"
        onClick={() => setIsModeOpen(prev => !prev)}
        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left ${
          isModeOpen
            ? 'bg-indigo-500/20 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]'
            : 'bg-white/[0.04] hover:bg-white/[0.07] text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-xs truncate block">{currentModeName}</span>
            <span className="text-[10px] text-slate-400 truncate block">Nhấn để thay đổi chế độ dịch</span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isModeOpen ? 'rotate-180 text-indigo-400' : ''}`} />
      </button>

      {isModeOpen && (
        <div className="flex flex-col gap-3 p-3 bg-[#0b0b16] rounded-2xl max-h-[280px] overflow-y-auto shadow-2xl animate-in fade-in duration-150">
          {allGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <span className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-wider block px-1">
                {group.category}
              </span>
              <div className="space-y-1">
                {group.items.map(item => {
                  const isSelected = String(currentMode) === String(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { onSelectMode(item.id); setIsModeOpen(false); }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-500/20 text-white'
                          : 'hover:bg-white/[0.04] text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">{item.name}</span>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-extrabold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">{item.desc}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-white/10'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
