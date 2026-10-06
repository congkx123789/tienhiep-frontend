import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useVipModalStore } from './useVipModalStore';

export const VipUpsellModal: React.FC = () => {
  const { isOpen, featureName, closeVipModal } = useVipModalStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoToPricing = () => {
    closeVipModal();
    navigate('/vip');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 p-6 md:p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative">
        <button
          onClick={closeVipModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors"
        >
          ✕
        </button>

        <div className="text-5xl mb-3 animate-bounce">👑</div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 mb-2">
          Mở Khóa Đặc Quyền
        </h2>

        <p className="text-slate-300 text-sm mb-6">
          Tính năng <strong className="text-amber-400 font-semibold">{featureName}</strong> chỉ dành riêng cho tài khoản VIP. Nâng cấp ngay hôm nay để tận hưởng trọn vẹn:
        </p>

        <ul className="text-left text-slate-300 space-y-3 mb-8 mx-auto w-full text-sm bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <li className="flex items-center gap-2.5">
            <span className="text-amber-400 font-bold">✓</span>
            <span>Dịch AI CMLM tốc độ cao (Không giới hạn)</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="text-amber-400 font-bold">✓</span>
            <span>Nghe truyện Audio giọng C++ Offline chuẩn phòng thu</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="text-amber-400 font-bold">✓</span>
            <span>Tải EPUB toàn bộ chương để đọc Offline</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="text-amber-400 font-bold">✓</span>
            <span>Huy hiệu VIP hoàng kim & Viền Avatar độc quyền</span>
          </li>
        </ul>

        <div className="flex gap-3">
          <button
            onClick={closeVipModal}
            className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-medium text-sm transition-colors"
          >
            Để sau
          </button>
          <button
            onClick={handleGoToPricing}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 text-sm transition-all"
          >
            Xem Bảng Giá
          </button>
        </div>
      </div>
    </div>
  );
};
