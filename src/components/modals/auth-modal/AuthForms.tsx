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
              name="username"
              autoComplete="username"
              placeholder={t.auth?.usernamePlaceholder || 'Tên đăng nhập'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1e1e3a] border border-[#2d2d6b] rounded-xl text-white outline-none focus:border-brand-500 transition-colors placeholder:text-slate-500 text-sm sm:text-base"
            />
          </div>
        )}

        {(mode === 'register' || mode === 'forgot' || mode === 'reset' || mode === 'verify_reg') && (
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder={mode === 'register' ? (t.auth?.emailOptionalPlaceholder || 'Email (tùy chọn - để nhận mã OTP)') : (t.auth?.emailPlaceholder || 'Email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1e1e3a] border border-[#2d2d6b] rounded-xl text-white outline-none focus:border-brand-500 transition-colors placeholder:text-slate-500 text-sm sm:text-base"
              disabled={mode === 'verify_reg'}
            />
          </div>
        )}

        {(mode === 'reset' || mode === 'verify_reg') && (
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              name="otp"
              autoComplete="one-time-code"
              placeholder={t.auth?.otpPlaceholder || 'Mã OTP'}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1e1e3a] border border-[#2d2d6b] rounded-xl text-white outline-none focus:border-brand-500 transition-colors placeholder:text-slate-500 text-sm sm:text-base"
            />
          </div>
        )}

        {mode !== 'forgot' && mode !== 'verify_reg' && (
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              name="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'reset' ? (t.auth?.newPasswordPlaceholder || 'Mật khẩu mới') : (t.auth?.passwordPlaceholder || 'Mật khẩu')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1e1e3a] border border-[#2d2d6b] rounded-xl text-white outline-none focus:border-brand-500 transition-colors placeholder:text-slate-500 text-sm sm:text-base"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-brand-500 via-purple-600 to-indigo-600 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer touch-manipulation flex items-center justify-center gap-2 select-none"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t.auth?.processing || 'Đang xử lý...'}</span>
            </>
          ) : (
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
            type="button"
            onClick={handleResendVerification}
            disabled={loading}
            className="text-xs text-brand-400 font-bold hover:underline cursor-pointer touch-manipulation active:opacity-75"
          >
            {t.auth?.resendOtpBtn || 'Gửi lại mã OTP'}
          </button>
        </div>
      )}
    </>
  );
}
