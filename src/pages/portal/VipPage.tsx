import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/main';
import { useAuth } from '../../contexts/AuthContext';
import { useVipGate } from '../../contexts/VipGateContext';
import {
  Crown, Sparkles, Zap, Shield, BookOpen, Download, Volume2,
  CheckCircle2, ArrowRight, Tv, Clock, Gift, PlayCircle
} from 'lucide-react';

export default function VipPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openVipModal, openToolGate, isToolUnlocked, getToolRemainingMinutes, systemEvent, quotaInfo } = useVipGate();

  // Danh sách các công cụ tiêu biểu trong hệ thống
  const tools = [
    {
      id: 'ai_search',
      name: 'AI Phân Tích & Tìm Kiếm Truyện',
      desc: 'Sử dụng Gemini 1.5 Flash gợi ý cốt truyện theo tính cách nhân vật',
      icon: Sparkles,
      color: 'from-amber-500 to-yellow-400',
      route: '/',
    },
    {
      id: 'ai_translate',
      name: 'Dịch Thuật AI Nâng Cao (Gemini / Claude)',
      desc: 'Mô hình dịch AI thông minh, câu văn mượt mà chuẩn văn phong tiên hiệp',
      icon: BookOpen,
      color: 'from-purple-500 to-indigo-500',
      route: '/embed',
    },
    {
      id: 'tts_premium',
      name: 'Đọc Giọng Nói AI Studio (TTS Cao Cấp)',
      desc: 'Giọng đọc AI cảm xúc, đọc liên tục hàng nghìn chương không gián đoạn',
      icon: Volume2,
      color: 'from-emerald-500 to-teal-400',
      route: '/embed',
    },
    {
      id: 'batch_download',
      name: 'Tải Truyện Hàng Loạt & Xuất EPUB Siêu Tốc',
      desc: 'Tự động cào và đóng gói ebook trọn bộ chỉ trong vài giây',
      icon: Download,
      color: 'from-blue-500 to-cyan-400',
      route: '/downloads',
    },
  ];

  const handleUseTool = (tool: typeof tools[0]) => {
    navigate(tool.route);
  };

  const handleTestGate = (tool: typeof tools[0]) => {
    openToolGate(tool.id, tool.name, tool.desc, 30);
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Banner Hero VIP */}
        <div className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#161633] via-[#0f0f22] to-[#120f26] border border-amber-500/30 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                <Crown className="w-4 h-4 fill-current" />
                <span>TIÊN HIỆP AI VIP ECOSYSTEM</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
                Ủng Hộ VIP & Trung Tâm Mở Khóa Tool
              </h1>
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                Tất cả công cụ nâng cao (Dịch thuật AI, Giọng đọc Studio, Phân tích truyện) có thể mở khóa vĩnh viễn bằng cách ủng hộ VIP, hoặc mở khóa miễn phí qua quảng cáo tài trợ.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <button
                  onClick={openVipModal}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-[#0b0b14] font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Crown className="w-4 h-4 fill-current" />
                  <span>Nâng Cấp VIP Ngay (Từ 50k)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 px-3 py-2 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Trạng thái: </span>
                    <strong className={user?.vip_status === 1 ? 'text-amber-400' : 'text-slate-300'}>
                      {user?.vip_status === 1 ? '👑 VIP Thành Viên' : 'Người Dùng Tiêu Chuẩn'}
                    </strong>
                  </div>
                  {systemEvent.isFreeEventActive && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      🎉 Free Toàn Bộ ({systemEvent.eventName || 'Sự Kiện'})
                    </span>
                  )}
                  {!systemEvent.isFreeEventActive && user?.vip_status !== 1 && quotaInfo && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      Dùng thử hôm nay: {Math.max(0, Math.ceil(quotaInfo.remainingSeconds / 60))} phút
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Icon Card hoàng kim */}
            <div className="shrink-0 w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border-2 border-amber-400/40 p-4 flex flex-col items-center justify-center shadow-2xl relative">
              <Crown className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400 animate-pulse fill-current" />
              <span className="text-[11px] font-black text-amber-300 mt-2 uppercase tracking-wider">
                {user?.vip_status === 1 ? 'ĐANG KÍCH HOẠT' : 'MỞ KHÓA TẤT CẢ'}
              </span>
            </div>
          </div>
        </div>

        {/* 6 Đặc Quyền VIP Độc Quyền */}
        <div>
          <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Quyền Lợi Độc Quyền Khi Nâng Cấp VIP</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: 'Tắt 100% Quảng Cáo', desc: 'Không còn bất kỳ quảng cáo AdSense hay video làm gián đoạn việc đọc sách.' },
              { title: 'Mở Khóa Toàn Bộ Tool', desc: 'Dùng không giới hạn mọi công cụ AI hiện tại và các tool phát triển trong tương lai.' },
              { title: 'Dịch Thuật AI Chuẩn Sách', desc: 'Sử dụng model Gemini/Claude cao cấp, giữ đúng ngữ cảnh kiếm hiệp/tiên hiệp.' },
              { title: 'Giọng Đọc TTS Không Giới Hạn', desc: 'Nghe liên tục hàng trăm chương sách mà không bị giới hạn ký tự hay thời gian.' },
              { title: 'Khung Rồng Vàng Avatar', desc: 'Hiệu ứng viền Rồng Vàng rực rỡ độc quyền trên hồ sơ và bình luận.' },
              { title: 'Tải Sách Siêu Tốc', desc: 'Tải hàng loạt toàn bộ chương truyện định dạng TXT/EPUB chỉ với 1 cú click.' },
            ].map((p, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#121226]/80 border border-white/5 hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <h4 className="text-sm font-bold text-white">{p.title}</h4>
                </div>
                <p className="text-xs text-slate-400 pl-6 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Danh Sách Tool & Cơ Chế Mở Khóa Bằng Quảng Cáo / VIP */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-emerald-400" />
                <span>Danh Sách Công Cụ & Trạng Thái Mở Khóa</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bạn có thể bấm vào bất kỳ công cụ nào dưới đây để kiểm tra thử logic mở khóa chồng lên (Overlay Gate)
              </p>
            </div>
            <button
              type="button"
              onClick={() => openToolGate('ad_trial', 'Mở Khóa Qua Quảng Cáo', 'Xem video ngắn 15s để nhận 30 phút trải nghiệm VIP', 30)}
              className="text-xs text-slate-300 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 px-3 py-1.5 rounded-xl border border-white/10 hover:border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span>Đã hỗ trợ: </span>
              <strong className="text-emerald-400 flex items-center gap-1">
                <Tv className="w-3.5 h-3.5" /> Xem quảng cáo 15s để mở khóa 30 phút
              </strong>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tools.map((t) => {
              const Icon = t.icon;
              const unlocked = isToolUnlocked(t.id);
              const remainingMin = getToolRemainingMinutes(t.id);

              return (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-[#131327] border border-white/5 hover:border-brand-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl bg-gradient-to-tr ${t.color} text-[#0b0b14] font-bold shadow-md`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{t.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {unlocked ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {remainingMin === Infinity ? 'Mở khóa vĩnh viễn (VIP)' : `Mở khóa còn ${remainingMin} phút`}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                                🔒 Chưa mở khóa
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      {unlocked ? 'Sẵn sàng sử dụng' : 'Hỗ trợ VIP & Xem QC'}
                    </span>
                    <div className="flex items-center gap-2">
                      {unlocked ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUseTool(t)}
                            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-emerald-500 text-[#0b0b14] hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95"
                          >
                            <PlayCircle className="w-4 h-4" /> Dùng Ngay
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTestGate(t)}
                            title="Thử nghiệm Overlay Gate mở khóa bằng quảng cáo"
                            className="px-2.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer active:scale-95"
                          >
                            <Shield className="w-3.5 h-3.5" /> Test Gate
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTestGate(t)}
                          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 text-[#0b0b14] hover:brightness-110 shadow-md shadow-amber-500/20 active:scale-95"
                        >
                          <PlayCircle className="w-4 h-4" /> Test Mở Khóa Tool
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hướng Dẫn Kích Hoạt Nhanh */}
        <div className="p-5 rounded-2xl bg-[#0e0e1c] border border-white/5 text-xs text-slate-400 space-y-2">
          <h4 className="text-white font-bold flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Chính Sách Kích Hoạt & Bảo Hành VIP:</span>
          </h4>
          <p>
            1. Khi chuyển khoản qua PayOS hoặc mã VietQR MB Bank, hệ thống tự động quét và kích hoạt VIP trong 10–30 giây.
          </p>
          <p>
            2. Nếu có sự cố chậm trễ từ phía ngân hàng, bạn có thể nhắn tin tới ban quản trị hoặc xác nhận qua Admin Key để được hỗ trợ kích hoạt tức thì.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
