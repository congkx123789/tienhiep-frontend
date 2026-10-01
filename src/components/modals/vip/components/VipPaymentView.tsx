import React from 'react';
import { Clock, AlertCircle, Check, Copy, RefreshCw, ExternalLink } from 'lucide-react';
import { PaymentData } from '../../vip-gate/VipGate.types';

interface VipPaymentViewProps {
  paymentData: PaymentData;
  countdown: { label: string; expired: boolean };
  qrError: boolean;
  setQrError: (err: boolean) => void;
  copyStatus: Record<string, boolean>;
  onCopy: (text: string, key: string) => void;
  onBackToPlans: () => void;
}

export const VipPaymentView: React.FC<VipPaymentViewProps> = ({
  paymentData,
  countdown,
  qrError,
  setQrError,
  copyStatus,
  onCopy,
  onBackToPlans,
}) => {
  const accountNo = (paymentData as any).bank_info?.account_no || (paymentData as any).account_no || '0349717475';
  const transferContent = (paymentData as any).bank_info?.transfer_content || (paymentData as any).transfer_content || (paymentData as any).add_info || 'VIP';

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-[#0b0b16] border border-amber-500/20 flex flex-col items-center">
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Mã QR hết hạn sau: {countdown.label}</span>
        </div>

        <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-amber-400/30">
          {qrError ? (
            <div className="w-[180px] h-[180px] flex flex-col items-center justify-center text-slate-800 text-xs text-center p-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mb-1" />
              <span>Không tải được ảnh QR, vui lòng chuyển khoản theo thông tin bên dưới</span>
            </div>
          ) : (
            <img
              src={paymentData.qr_url}
              alt="VietQR MB Bank"
              className="w-[180px] h-[180px] object-contain rounded-lg"
              onError={() => setQrError(true)}
            />
          )}
        </div>

        <div className="mt-3 text-center">
          <span className="text-[11px] text-slate-400">Số tiền thanh toán:</span>
          <p className="text-lg font-black text-amber-300">
            {Number(paymentData.amount).toLocaleString('vi-VN')} đ
          </p>
        </div>
      </div>

      <div className="space-y-2 bg-[#121226] p-3.5 rounded-2xl border border-white/5 text-xs">
        <div className="flex justify-between items-center py-1 border-b border-white/5">
          <span className="text-slate-400">Ngân hàng:</span>
          <span className="text-white font-bold">MB Bank (Quân Đội)</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-white/5">
          <span className="text-slate-400">Số tài khoản:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-mono font-bold">
              {accountNo}
            </span>
            <button
              type="button"
              onClick={() => onCopy(accountNo, 'acc')}
              className="text-amber-400 hover:text-amber-300"
            >
              {copyStatus.acc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-400">Nội dung chuyển:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-mono font-bold">
              {transferContent}
            </span>
            <button
              type="button"
              onClick={() => onCopy(transferContent, 'content')}
              className="text-amber-400 hover:text-amber-300"
            >
              {copyStatus.content ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-1">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
        <span>Hệ thống tự động kích hoạt ngay khi nhận được tiền...</span>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onBackToPlans}
          className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl"
        >
          Đổi gói khác
        </button>
        {paymentData.checkout_url && (
          <a
            href={paymentData.checkout_url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0b0b14] text-xs font-extrabold rounded-xl flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
          >
            <span>Mở cổng PayOS</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
