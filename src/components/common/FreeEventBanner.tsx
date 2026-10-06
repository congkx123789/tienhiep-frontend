import React, { useState } from 'react';
import { useVipGate } from '../../contexts/VipGateContext';
import { Sparkles, Gift, X } from 'lucide-react';

export const FreeEventBanner: React.FC = () => {
  const { systemEvent, quotaInfo } = useVipGate();
  const [dismissed, setDismissed] = useState(false);

  // Chỉ hiển thị khi có sự kiện Free toàn bộ và người dùng chưa bấm tắt
  if (!systemEvent.isFreeEventActive || dismissed) {
    return null;
  }

  return (
    <div className="relative z-40 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between border-b border-amber-300/40 animate-fadeIn">
      <div className="flex items-center gap-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-amber-300">
          <Gift className="h-3 w-3" />
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-extrabold uppercase tracking-wide bg-slate-950/10 px-1.5 py-0.5 rounded text-[10px]">
            Sự Kiện Đặc Biệt
          </span>
          <span className="font-bold text-slate-900">
            {systemEvent.eventName || 'Tri Ân Đạo Hữu'}
          </span>
          <span className="text-slate-800 text-[11px] hidden sm:inline">
            — Hệ thống đang mở khóa <strong className="text-slate-950 underline">MIỄN PHÍ TOÀN BỘ</strong> tính năng Giọng đọc AI C++ & Dịch AI CMLM cho mọi độc giả!
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-2">
        <div className="hidden md:flex items-center gap-1 text-[11px] bg-slate-950/10 px-2 py-0.5 rounded-full font-medium">
          <Sparkles className="h-3 w-3 text-amber-900" />
          <span>Hạn mức hôm nay: Không giới hạn</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-slate-950/10 rounded-full transition-colors text-slate-800 hover:text-slate-950"
          title="Đóng thông báo"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default FreeEventBanner;
