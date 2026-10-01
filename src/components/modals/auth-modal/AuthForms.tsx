import { FormEvent } from 'react';
import { User, Mail, KeyRound, Lock } from 'lucide-react';
import { AuthMode } from './useAuthModal';

interface AuthFormsProps {
  mode: AuthMode;
  t: any;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  otp: string;
  setOtp: (val: string) => void;
  loading: boolean;
  handleSubmit: (e: FormEvent) => void;
  handleResendVerification: () => void;
}

export function AuthForms({
  mode,
  t,
  username,
  setUsername,
  password,
  setPassword,
  email,
  setEmail,
  otp,
  setOtp,
  loading,
  handleSubmit,
  handleResendVerification,
}: AuthFormsProps) {
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(mode === 'login' || mode === 'register') && (
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder={t.auth?.usernamePlaceholder || 'Tên đăng nhập'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1e1e3a] border border-[#2d2d6b] rounded-xl text-white outline-none focus:border-brand-500 transition-colors"
              required
            />
          </div>
        )}

        {(mode === 'register' || mode === 'forgot' || mode === 'reset' || mode === 'verify_reg') && (
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              placeholder={t.auth?.emailPlaceholder || 'Email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1e1e3a] border border-[#2d2d6b] rounded-xl text-white outline-none focus:border-brand-500 transition-colors"
              required
              disabled={mode === 'verify_reg'}
            />
          </div>
        )}

        {(mode === 'reset' || mode === 'verify_reg') && (
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder={t.auth?.otpPlaceholder || 'Mã OTP'}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1e1e3a] border border-[#2d2d6b] rounded-xl text-white outline-none focus:border-brand-500 transition-colors"
              required
            />
          </div>
        )}

        {mode !== 'forgot' && mode !== 'verify_reg' && (
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              placeholder={mode === 'reset' ? (t.auth?.newPasswordPlaceholder || 'Mật khẩu mới') : (t.auth?.passwordPlaceholder || 'Mật khẩu')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1e1e3a] border border-[#2d2d6b] rounded-xl text-white outline-none focus:border-brand-500 transition-colors"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-brand-500 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all"
        >
          {loading ? (t.auth?.processing || 'Đang xử lý...') : (
            mode === 'login' ? (t.auth?.submitLogin || 'Đăng nhập') :
            mode === 'register' ? (t.auth?.submitRegister || 'Đăng ký') :
            mode === 'forgot' ? (t.auth?.submitForgot || 'Gửi mã khôi phục') :
            mode === 'verify_reg' ? (t.auth?.submitVerifyReg || 'Xác nhận OTP') : (t.auth?.submitReset || 'Đặt lại mật khẩu')
          )}
        </button>
      </form>

      {mode === 'verify_reg' && (
        <div className="mt-3 text-center">
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="text-xs text-brand-400 font-bold hover:underline"
          >
            {t.auth?.resendOtpBtn || 'Gửi lại mã OTP'}
          </button>
        </div>
      )}
    </>
  );
}
