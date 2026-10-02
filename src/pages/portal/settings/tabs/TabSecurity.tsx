import React, { useState } from 'react';
import { KeyRound, CheckCircle, Lock, Smartphone, Check } from 'lucide-react';
import api from '../../../../services';
import { SessionManager } from './SessionManager';

interface TabSecurityProps {
  user: any;
  setUser: (u: any) => void;
  d: Record<string, string>;
  t: any;
  mustChangePassword?: boolean;
}

export const TabSecurity: React.FC<TabSecurityProps> = ({
  user,
  setUser,
  d,
  t,
  mustChangePassword = false,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const [phone, setPhone] = useState(user?.phone || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(!!user?.phone);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor === 1);

  const [socials, setSocials] = useState({
    google: true,
    facebook: false,
    github: false,
    apple: false,
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 4) {
      setPassError(d.passMinLen);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError(d.passMismatch);
      return;
    }

    setChangePassLoading(true);
    try {
      const payload: any = { new_password: newPassword };
      if (!mustChangePassword) payload.old_password = oldPassword;

      const res = await api.post('/api/auth/change-password', payload);
      setPassSuccess(res.data.message || d.passChangeSuccess);

      if (user) {
        const updatedUser = { ...user, require_password_change: 0 };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.response?.data?.error || d.passChangeError);
    } finally {
      setChangePassLoading(false);
    }
  };

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
    <div className="space-y-6">
      {/* Password Change */}
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1f1f3a]/60 pb-3">
          <KeyRound className="w-5 h-5 text-brand-400" />
          <h4 className="font-extrabold text-white text-sm">{t.settings?.changePassTitle || "Đổi Mật Khẩu"}</h4>
        </div>

        {passError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{passError}</div>}
        {passSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {passSuccess}</div>}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {!mustChangePassword && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{t.settings?.currentPassLabel || "Mật khẩu hiện tại"}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  placeholder={t.settings?.currentPassPlaceholder || "Nhập mật khẩu hiện tại"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{t.settings?.newPassLabel || "Mật khẩu mới"}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  placeholder={t.settings?.newPassPlaceholder || "Tối thiểu 4 ký tự"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{t.settings?.confirmPassLabel || "Xác nhận mật khẩu mới"}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  placeholder={t.settings?.confirmPassPlaceholder || "Xác nhận mật khẩu mới"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={changePassLoading}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
          >
            {changePassLoading ? (t.settings?.updating || 'Đang cập nhật...') : (t.settings?.updateBtn || 'Cập nhật Mật khẩu')}
          </button>
        </form>
      </div>

      {/* OTP & Phone Number */}
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

      {/* Social Accounts */}
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="border-b border-[#1f1f3a]/60 pb-3">
          <h4 className="font-extrabold text-white text-sm">{d.authLinks}</h4>
          <p className="text-[10px] text-slate-400 mt-1">Liên kết OAuth để đăng nhập nhanh bằng 1 click chuột.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-white">🔴 Google</div>
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {d.authLinked}
            </span>
          </div>
          <div className="flex items-center justify-between p-3.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-white">🐙 GitHub</div>
            <button 
              onClick={() => setSocials(prev => ({ ...prev, github: true }))}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all uppercase ${socials.github ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-400 bg-white/5 border border-white/10 hover:text-white'}`}
            >
              {socials.github ? d.authLinked : d.authLinkBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <SessionManager user={user} d={d} />
    </div>
  );
};
