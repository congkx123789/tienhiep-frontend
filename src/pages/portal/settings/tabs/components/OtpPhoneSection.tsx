import React, { useState } from 'react';
import { Smartphone, CheckCircle } from 'lucide-react';
import api from '../../../../../services';

interface OtpPhoneSectionProps {
  user: any;
  d: Record<string, string>;
}

export const OtpPhoneSection: React.FC<OtpPhoneSectionProps> = ({ user, d }) => {
  const [phone, setPhone] = useState(user?.phone || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(!!user?.phone);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor === 1);

  const handleSendOtp = async () => {
    const target = user?.email || phone;
    if (!target) {
      alert("Vui lòng cung cấp email hoặc số điện thoại để nhận mã OTP.");
      return;
    }
    try {
      const res = await api.post('/api/auth/resend-verification', { email: target });
      setOtpSent(true);
      alert(res.data?.message || "Mã OTP xác thực đã được gửi! Vui lòng kiểm tra hộp thư.");
    } catch (err: any) {
      alert(err.response?.data?.error || "Lỗi khi gửi mã xác thực OTP.");
    }
  };

  const handleVerifyOtp = async () => {
    const target = user?.email || phone;
    if (!otp.trim()) {
      alert("Vui lòng nhập mã OTP xác thực.");
      return;
    }
    try {
      const res = await api.post('/api/auth/verify-registration', { email: target, otp: otp.trim() });
      setPhoneVerified(true);
      setOtpSent(false);
      alert(res.data?.message || "Xác thực OTP thành công!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Mã OTP không chính xác hoặc đã hết hạn.");
    }
  };

  const toggle2FA = () => {
    if (!phoneVerified) {
      alert("Bạn phải liên kết số điện thoại trước khi bật 2FA.");
      return;
    }
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  return (
    <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-[#1f1f3a]/60 pb-3">
        <Smartphone className="w-5 h-5 text-purple-400" />
        <h4 className="font-extrabold text-white text-sm">{d.phoneNumber} & Xác thực OTP</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.phoneNumber}</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder={d.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={phoneVerified}
              className="flex-1 px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none disabled:opacity-60 focus:border-purple-500"
            />
            {!phoneVerified && (
              <button 
                type="button"
                onClick={handleSendOtp}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-[10px] shrink-0"
              >
                {otpSent ? 'Gửi lại' : d.getOtp}
              </button>
            )}
          </div>
        </div>

        {otpSent && (
          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.enterOtp}</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nhập mã OTP (6 số)"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none text-center font-mono tracking-widest focus:border-purple-500"
              />
              <button 
                type="button"
                onClick={handleVerifyOtp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-[10px] shrink-0"
              >
                {d.verifyBtn}
              </button>
            </div>
          </div>
        )}

        {phoneVerified && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mt-6">
            <CheckCircle className="w-4 h-4" /> Đã liên kết & xác thực OTP số điện thoại!
          </div>
        )}
      </div>

      {/* 2FA Toggle */}
      <div className="flex items-center justify-between p-4 bg-[#0b0b14]/50 border border-[#1f1f3a] rounded-xl mt-2">
        <div className="space-y-1 max-w-[80%]">
          <strong className="text-xs text-white block">{d.twoFactor}</strong>
          <span className="text-[10px] text-slate-400 block leading-relaxed">{d.twoFactorDesc}</span>
        </div>
        <button
          type="button"
          onClick={toggle2FA}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${twoFactorEnabled ? 'bg-purple-600' : 'bg-slate-700'}`}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
  );
};
