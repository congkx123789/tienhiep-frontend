import React from 'react';
import { 
  Sparkles, 
  Tv, 
  RefreshCw, 
  Check, 
  PlayCircle, 
  Crown, 
  ArrowRight 
} from 'lucide-react';
interface VipGateAdViewProps {
  toolName?: string;
  description?: string;
  durationMinutes: number;
  adWatching: boolean;
  adTimer: number;
  adFinished: boolean;
  onStartWatchAd: () => void;
  onClaimAdReward: () => void;
  onGoToPlans: () => void;
  adSlot?: React.ReactNode;
}

export const VipGateAdView: React.FC<VipGateAdViewProps> = ({
  toolName,
  description,
  durationMinutes,
  adWatching,
  adTimer,
  adFinished,
  onStartWatchAd,
  onClaimAdReward,
  onGoToPlans,
  adSlot,
}) => {
  return (
    <div className="space-y-4">
      {/* Box giới thiệu Tool */}
      <div className="p-4 rounded-2xl bg-[#14142b] border border-amber-500/20 relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-0.5">{toolName}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {description || 'Tính năng này yêu cầu quyền mở khóa để phục vụ trải nghiệm tốt nhất.'}
            </p>
          </div>
        </div>
      </div>

      {/* Lựa chọn 1: Xem Quảng Cáo Mở Khóa Tạm Thời (Miễn phí) */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121226] to-[#181834] border border-brand-500/30 shadow-lg relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Tv className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Lựa chọn Miễn Phí
            </span>
          </div>
          <span className="text-[11px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
            Mở khóa {durationMinutes} phút
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-3">
          Xem 1 quảng cáo tài trợ ngắn (15 giây) để mở khóa ngay lập tức và tiếp tục tác vụ.
        </p>

        {adWatching ? (
          <div className="space-y-3 bg-[#0a0a14] p-3 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400 flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${!adFinished ? 'animate-spin text-amber-400' : ''}`} />
                {adFinished ? 'Đã hoàn tất tài trợ!' : `Đang xem tài trợ: ${adTimer}s`}
              </span>
              <span className="text-amber-400 font-mono text-[11px]">
                {adFinished ? '100%' : `${Math.round(((15 - adTimer) / 15) * 100)}%`}
              </span>
            </div>

            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000"
                style={{ width: `${((15 - adTimer) / 15) * 100}%` }}
              />
            </div>

            <div className="p-3.5 bg-gradient-to-br from-[#101026] via-[#151532] to-[#1a1a3a] rounded-xl border border-indigo-500/30 text-center space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/5 pb-2">
                <span className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" /> Đối Tác Tài Trợ Tiên Hiệp AI
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold uppercase">
                  {adFinished ? 'Hoàn tất' : `Đang phát (${adTimer}s)`}
                </span>
              </div>
              <div className="py-2 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center text-white mb-2 shadow-lg shadow-indigo-500/30 animate-pulse">
                  <Tv className="w-5 h-5" />
                </div>
                <h5 className="text-xs font-bold text-white">Tiên Hiệp AI Neural Studio & Local Translation</h5>
                <p className="text-[11px] text-slate-300 max-w-sm mt-0.5 leading-relaxed">
                  Công nghệ chuyển ngữ tiên hiệp & tổng hợp giọng đọc C++ siêu tốc 18x thời gian thực.
                </p>
              </div>
              {adSlot ? adSlot : (
                <div className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-center text-[10px] text-slate-400">
                  ⚡ Đối tác tài trợ hệ sinh thái Tiên Hiệp AI
                </div>
              )}
              <p className="text-[10px] text-slate-400 italic">
                {adFinished
                  ? '🎉 Bạn đã xem đủ thời lượng tài trợ! Bấm nút bên dưới để nhận 30 phút VIP miễn phí.'
                  : `Đang phát thông điệp tài trợ... Còn ${adTimer} giây nữa để mở khóa.`}
              </p>
            </div>

            {adFinished ? (
              <button
                type="button"
                onClick={onClaimAdReward}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 animate-bounce"
              >
                <Check className="w-4 h-4" /> Mở Khóa Thành Công - Dùng Ngay!
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full py-2.5 bg-white/5 text-slate-500 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed"
              >
                Vui lòng đợi {adTimer} giây nữa...
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartWatchAd}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
          >
            <PlayCircle className="w-4 h-4" /> Xem Quảng Cáo 15s Để Mở Khóa Ngay
          </button>
        )}
      </div>

      {/* Lựa chọn 2: Nâng cấp VIP */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1a140a] to-[#251b0d] border border-amber-500/40 relative">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Crown className="w-4 h-4" /> Trải Nghiệm Hoàn Hảo VIP
          </span>
          <span className="text-[10px] bg-amber-400/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-400/30">
            KHUYÊN DÙNG
          </span>
        </div>
        <p className="text-xs text-slate-300 mb-3">
          Tắt 100% quảng cáo, mở khóa tất cả các công cụ vĩnh viễn và ưu tiên tốc độ cao.
        </p>
        <button
          type="button"
          onClick={onGoToPlans}
          className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-[#0b0b14] font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
        >
          <span>Xem Bảng Gói Nâng Cấp VIP</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
