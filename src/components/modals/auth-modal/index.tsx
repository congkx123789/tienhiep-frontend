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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full sm:max-w-md bg-[#131324] border border-[#2d2d6b] sm:rounded-2xl rounded-t-3xl p-6 shadow-2xl overflow-hidden animate-slide-up sm:animate-fadeIn max-h-[92dvh] overflow-y-auto">
        {/* Mobile drag handle */}
        <div className="sm:hidden w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-xl font-bold text-white mb-6">
          {m.mode === 'login' && m.t.auth?.loginTitle}
          {m.mode === 'register' && m.t.auth?.registerTitle}
          {m.mode === 'verify_reg' && m.t.auth?.verifyRegTitle}
          {m.mode === 'forgot' && m.t.auth?.forgotTitle}
          {m.mode === 'reset' && m.t.auth?.resetTitle}
        </h3>

        {m.error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {m.error}
          </div>
        )}

        {m.message && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
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
          <GoogleAuthButton handleGoogleDesktopLogin={m.handleGoogleDesktopLogin} />
        )}

        <div className="mt-6 text-center text-sm text-slate-400 space-y-2">
          {m.mode === 'login' && (
            <>
              <div>
                {m.t.auth?.noAccount}{' '}
                <button onClick={() => m.setMode('register')} className="text-brand-400 font-semibold hover:underline">
                  {m.t.auth?.registerNow}
                </button>
              </div>
              <div>
                <button onClick={() => m.setMode('forgot')} className="text-slate-500 text-xs hover:underline">
                  {m.t.auth?.forgotPassLink}
                </button>
              </div>
            </>
          )}

          {m.mode === 'register' && (
            <div>
              {m.t.auth?.haveAccount}{' '}
              <button onClick={() => m.setMode('login')} className="text-brand-400 font-semibold hover:underline">
                {m.t.auth?.submitLogin}
              </button>
            </div>
          )}

          {(m.mode === 'forgot' || m.mode === 'reset' || m.mode === 'verify_reg') && (
            <div>
              <button onClick={() => m.setMode('login')} className="text-brand-400 font-semibold hover:underline">
                {m.t.auth?.backToLogin}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
