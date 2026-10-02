import { X } from 'lucide-react';
import { useAuthModal } from './useAuthModal';
import { AuthForms } from './AuthForms';
import { GoogleAuthButton } from './GoogleAuthButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const m = useAuthModal(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200050] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-[#131324] border border-[#2d2d6b] rounded-2xl p-6 shadow-2xl max-h-[90dvh] overflow-y-auto animate-fadeIn pb-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 p-2 -mr-1 -mt-1 text-slate-400 hover:text-white transition-colors cursor-pointer touch-manipulation rounded-lg active:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-6 pr-8">
          {m.mode === 'login' && (m.t.auth?.loginTitle || 'Đăng Nhập')}
          {m.mode === 'register' && (m.t.auth?.registerTitle || 'Đăng Ký')}
          {m.mode === 'verify_reg' && (m.t.auth?.verifyRegTitle || 'Xác Minh Email')}
          {m.mode === 'forgot' && (m.t.auth?.forgotTitle || 'Quên Mật Khẩu')}
          {m.mode === 'reset' && (m.t.auth?.resetTitle || 'Khôi Phục Mật Khẩu')}
        </h3>

        {m.error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-sm font-medium animate-fadeIn">
            {m.error}
          </div>
        )}

        {m.message && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm font-medium animate-fadeIn">
            {m.message}
          </div>
        )}

        <AuthForms
          mode={m.mode}
          t={m.t}
          username={m.username}
          setUsername={m.setUsername}
          password={m.password}
          setPassword={m.setPassword}
          email={m.email}
          setEmail={m.setEmail}
          otp={m.otp}
          setOtp={m.setOtp}
          loading={m.loading}
          handleSubmit={m.handleSubmit}
          handleResendVerification={m.handleResendVerification}
        />

        {m.mode === 'login' && (
          <GoogleAuthButton
            handleGoogleDesktopLogin={m.handleGoogleDesktopLogin}
            loading={m.loading}
          />
        )}

        <div className="mt-6 text-center text-sm text-slate-400 space-y-3">
          {m.mode === 'login' && (
            <>
              <div>
                {m.t.auth?.noAccount || 'Chưa có tài khoản?'}{' '}
                <button
                  type="button"
                  onClick={() => m.setMode('register')}
                  className="text-brand-400 font-bold hover:underline cursor-pointer touch-manipulation active:opacity-75"
                >
                  {m.t.auth?.registerNow || 'Đăng ký ngay'}
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => m.setMode('forgot')}
                  className="text-slate-400 text-xs hover:text-slate-200 hover:underline cursor-pointer touch-manipulation active:opacity-75 py-1 px-2"
                >
                  {m.t.auth?.forgotPassLink || 'Quên mật khẩu?'}
                </button>
              </div>
            </>
          )}

          {m.mode === 'register' && (
            <div>
              {m.t.auth?.haveAccount || 'Đã có tài khoản?'}{' '}
              <button
                type="button"
                onClick={() => m.setMode('login')}
                className="text-brand-400 font-bold hover:underline cursor-pointer touch-manipulation active:opacity-75"
              >
                {m.t.auth?.submitLogin || 'Đăng nhập'}
              </button>
            </div>
          )}

          {(m.mode === 'forgot' || m.mode === 'reset' || m.mode === 'verify_reg') && (
            <div>
              <button
                type="button"
                onClick={() => m.setMode('login')}
                className="text-brand-400 font-bold hover:underline cursor-pointer touch-manipulation active:opacity-75"
              >
                {m.t.auth?.backToLogin || 'Quay lại Đăng nhập'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
