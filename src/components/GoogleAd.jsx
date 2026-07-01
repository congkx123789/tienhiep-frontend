import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function GoogleAd({ slot, format = 'auto', responsive = 'true', className = '' }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Nếu không phải VIP, gọi lệnh push quảng cáo của Google AdSense
    if (!loading && (!user || user.vip_status !== 1)) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense push error:", e);
      }
    }
  }, [user, loading]);

  if (loading || (user && user.vip_status === 1)) {
    return null; // Không hiển thị gì đối với người dùng VIP
  }

  // Lấy client ID từ VITE_ADSENSE_CLIENT hoặc mặc định là ca-pub-9548504602542886
  const client = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-9548504602542886';

  return (
    <div className={`ad-container my-6 flex flex-col items-center justify-center w-full min-h-[100px] md:min-h-[200px] bg-[#121225]/20 border border-dashed border-[#1f1f3a]/60 rounded-2xl relative overflow-hidden ${className}`}>
      <span className="absolute top-2 right-3 text-[9px] uppercase tracking-wider text-slate-600 font-extrabold select-none">ADVERTISEMENT</span>
      <ins
        className="adsbygoogle w-full"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
