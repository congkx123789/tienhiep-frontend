import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Crown, ExternalLink, Sparkles } from 'lucide-react';

// GoogleAd: Hiển thị quảng cáo AdSense cho user thường kèm link tài trợ chuẩn
// VIP → tự động ẩn hoàn toàn
// Kèm CTA nhỏ nhắc user mua VIP để tắt quảng cáo
interface GoogleAdProps {
  slot?: string;
  format?: string;
  responsive?: string;
  className?: string;
  onUpgradeClick?: () => void;
  sponsorUrl?: string;
  sponsorTitle?: string;
  sponsorDesc?: string;
}

export default function GoogleAd({ 
  slot = 'default-slot', 
  format = 'auto', 
  responsive = 'true', 
  className = '', 
  onUpgradeClick,
  sponsorUrl = 'https://tienhiep.lyvuha.com/',
  sponsorTitle = 'Tiên Hiệp AI Cloud & Neural TTS Engine',
  sponsorDesc = 'Nền tảng dịch truyện chữ siêu tốc & giọng đọc AI tự nhiên hàng đầu.'
}: GoogleAdProps) {
  const { user, loading } = useAuth();
  const [adLoaded, setAdLoaded] = useState(false);

  const isNativeOrElectron = typeof window !== 'undefined' && (
    !!(window as any).electron ||
    ((window as any).Capacitor && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform() === true)
  );

  useEffect(() => {
    if (!isNativeOrElectron && !loading && (!user || user.vip_status !== 1)) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (e) {
        console.error('AdSense push error:', e);
      }
    }
  }, [user, loading, isNativeOrElectron]);

  // VIP → không hiển thị gì cả
  if (loading || (user && user.vip_status === 1)) {
    return null;
  }

  // Trong app Electron hoặc Mobile: Hiển thị banner tài trợ / VIP nội bộ với link chuẩn
  if (isNativeOrElectron) {
    return (
      <div className={`ad-container my-3 w-full ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/30 text-center gap-2.5">
          <div className="flex items-center gap-2.5 text-left">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white">Ủng Hộ Tiên Hiệp AI VIP</p>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">TÀI TRỢ</span>
              </div>
              <p className="text-[10px] text-slate-400">Mở khóa toàn bộ công cụ AI & máy chủ vận hành mượt mà</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={sponsorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 text-[10px] font-bold rounded-xl flex items-center gap-1 transition-all"
            >
              <span>Chi tiết</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-[#0b0b14] text-[11px] font-extrabold rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all whitespace-nowrap"
              >
                Nâng cấp VIP
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const client = (import.meta as any).env?.VITE_ADSENSE_CLIENT || 'ca-pub-9548504602542886';

  return (
    <div className={`ad-container my-3 w-full ${className}`}>
      {/* Header CTA & Nhãn quảng cáo */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-widest text-slate-500 font-extrabold">ADVERTISEMENT</span>
          <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">ca-pub-9548504602542886</span>
        </div>
        {onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors group"
          >
            <Crown className="w-3 h-3 group-hover:scale-110 transition-transform" />
            Tắt QC với VIP
          </button>
        )}
      </div>

      {/* Khung hiển thị quảng cáo AdSense kết hợp Sponsor Link Card */}
      <div className="flex flex-col items-center justify-center w-full min-h-[90px] md:min-h-[140px] bg-gradient-to-br from-[#101026] via-[#121228] to-[#171734] border border-dashed border-[#2d2d50] rounded-2xl relative overflow-hidden p-3 group">
        <ins
          className="adsbygoogle w-full"
          style={{ display: 'block', minHeight: '60px' }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive}
        />

        {/* Sponsor Banner & Verified Ad Link */}
        <div className="w-full mt-2 pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-left">
            <span className="p-1 rounded bg-indigo-500/20 text-indigo-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-200">{sponsorTitle}</span>
                <span className="text-[8px] font-extrabold bg-indigo-500/20 text-indigo-300 px-1 rounded uppercase">Đối tác</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">{sponsorDesc}</p>
            </div>
          </div>

          <a
            href={sponsorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[10px] font-bold rounded-lg shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95"
            title="Mở link quảng cáo đối tác"
          >
            <span>Xem Link Quảng Cáo</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

