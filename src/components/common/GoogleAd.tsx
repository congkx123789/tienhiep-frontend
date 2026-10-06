import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Crown, ExternalLink, Sparkles, ArrowRight } from 'lucide-react';

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
  const [googleAdFilled, setGoogleAdFilled] = useState(false);
  const insRef = useRef<HTMLModElement>(null);

  const isNativeOrElectron = typeof window !== 'undefined' && (
    !!(window as any).electron ||
    ((window as any).Capacitor && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform() === true)
  );

  useEffect(() => {
    if (!isNativeOrElectron && !loading && (!user || user.vip_status !== 1)) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.debug('AdSense push notice:', e);
      }

      // Kiểm tra xem Google AdSense có bơm quảng cáo iframe thật vào không
      const checkTimer = setTimeout(() => {
        if (insRef.current) {
          const hasIframe = insRef.current.querySelector('iframe') !== null;
          const status = insRef.current.getAttribute('data-ad-status');
          if (hasIframe && status !== 'unfilled') {
            setGoogleAdFilled(true);
          }
        }
      }, 1500);

      return () => clearTimeout(checkTimer);
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
    <div className={`ad-container my-3.5 w-full ${className}`}>
      {/* Header CTA & Nhãn quảng cáo */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold">NHÀ TÀI TRỢ & ĐỐI TÁC</span>
          <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">{client}</span>
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
      <div className="flex flex-col items-center justify-center w-full bg-gradient-to-br from-[#121225] via-[#15152e] to-[#1a1738] border border-[#2b2b52] rounded-2xl relative overflow-hidden p-3.5 shadow-lg group">
        {/* Google AdSense container - chỉ bung kích thước khi có iframe quảng cáo thực sự */}
        <ins
          ref={insRef}
          className={`adsbygoogle w-full ${googleAdFilled ? 'block mb-3' : 'hidden'}`}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive}
        />

        {/* Banner Đối Tác Tài Trợ - Luôn sắc nét, đầy đủ thông tin, không để ô đen rỗng */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100">{sponsorTitle}</span>
                <span className="text-[8px] font-extrabold bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 px-1.5 py-0.5 rounded uppercase">Đối tác</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{sponsorDesc}</p>
            </div>
          </div>

          <a
            href={sponsorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-95"
            title="Mở liên kết đối tác tài trợ"
          >
            <span>Khám Phá Ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

