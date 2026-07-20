import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { X, Mail, Lock, User, KeyRound } from 'lucide-react';
import api, { getBestServer } from '../services/api';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const { t } = useLang();
  
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot', 'reset'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setUsername('');
      setPassword('');
      setEmail('');
      setOtp('');
      setError('');
      setMessage('');
      
      // Initialize Google sign in button if available (Web only)
      if (window.google && !window.electron) {
        window.google.accounts.id.initialize({
          client_id: "107953505478-0gielhlbbif11eu77rb29sq7ie7dqbmn.apps.googleusercontent.com",
          callback: handleGoogleSignInCallback
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "filled_blue", size: "large", width: 290 }
        );
      }
    }
  }, [isOpen]);

  const handleGoogleSignInCallback = async (response) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/google/callback', { credential: response.credential });
      if (res.data && res.data.access_token) {
        localStorage.setItem('accessToken', res.data.access_token);
        document.cookie = `accessToken=${res.data.access_token}; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        if (res.data.user?.require_password_change === 1) {
          window.location.href = '/settings';
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi đăng nhập Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleDesktopLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const server = await getBestServer();
      const loginUrl = `${server}/api/auth/google/login?state=desktop|${encodeURIComponent(server)}`;
      const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
      
      if (window.electron && window.electron.openExternal) {
        window.electron.openExternal(loginUrl);
      } else if (isNative) {
        try {
          const { Browser } = await import('@capacitor/browser');
          await Browser.open({ url: loginUrl });
        } catch (capErr) {
          console.error("Capacitor Browser failed, falling back to window.open", capErr);
          window.open(loginUrl, '_system');
        }
      } else {
        window.open(loginUrl, '_blank');
      }
    } catch (err) {
      setError('Không thể mở liên kết đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/resend-verification', { email });
      setMessage(res.data.message || 'Mã xác minh mới đã được gửi.');
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi gửi lại mã xác minh.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!username || !password) {
          setError(t.authRequired);
          setLoading(false);
          return;
        }
        const user = await login(username, password);
        onClose();
        if (user && user.require_password_change === 1) {
          window.location.href = '/settings';
        }
      } else if (mode === 'register') {
        if (!username || !password || !email) {
          setError(t.authRequired);
          setLoading(false);
          return;
        }
        const res = await register(username, password, email);
        if (res.require_verification) {
          setMessage(res.message || 'Một mã xác minh đã được gửi đến email của bạn.');
          setMode('verify_reg');
        } else {
          setMessage(t.regSuccess);
          setMode('login');
          setPassword('');
        }
      } else if (mode === 'verify_reg') {
        if (!email || !otp) {
          setError("Vui lòng nhập đầy đủ email và mã OTP xác minh.");
          setLoading(false);
          return;
        }
        const res = await api.post('/api/auth/verify-registration', { email, otp });
        setMessage(res.data.message || 'Xác minh thành công! Vui lòng đăng nhập.');
        setMode('login');
        setPassword('');
        setOtp('');
      } else if (mode === 'forgot') {
        if (!email) {
          setError("Vui lòng nhập email.");
          setLoading(false);
          return;
        }
        const res = await api.post('/api/auth/forgot-password', { email });
        setMessage(res.data.message || 'Mã OTP đã được gửi đến email của bạn.');
        setMode('reset');
      } else if (mode === 'reset') {
        if (!email || !otp || !password) {
          setError("Vui lòng điền đầy đủ thông tin.");
          setLoading(false);
          return;
        }
        const res = await api.post('/api/auth/reset-password', { email, otp, password });
        setMessage(res.data.message || 'Khôi phục mật khẩu thành công.');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      const respData = err.response?.data;
      if (respData?.require_verification) {
        setEmail(respData.email || email);
        setMode('verify_reg');
        setError(respData.error || 'Tài khoản chưa được xác minh. Vui lòng nhập mã OTP.');
      } else {
        setError(respData?.error || err.message || t.connError);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full sm:max-w-md bg-[#131324] border border-[#2d2d6b] sm:rounded-2xl rounded-t-3xl p-6 shadow-2xl overflow-hidden animate-slide-up sm:animate-fadeIn max-h-[92dvh] overflow-y-auto">
        {/* Drag handle on mobile */}
        <div className="sm:hidden w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-xl font-bold text-white mb-6">
          {mode === 'login' && t.auth?.loginTitle}
          {mode === 'register' && t.auth?.registerTitle}
          {mode === 'verify_reg' && t.auth?.verifyRegTitle}
          {mode === 'forgot' && t.auth?.forgotTitle}
          {mode === 'reset' && t.auth?.resetTitle}
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(mode === 'login' || mode === 'register') && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                placeholder={t.auth?.usernamePlaceholder}
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
                placeholder={t.auth?.emailPlaceholder}
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
                placeholder={t.auth?.otpPlaceholder}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#1e1e3a] border border-[#2d2d6b] rounded-xl text-white outline-none focus:border-brand-500 transition-colors"
                required
              />
            </div>
          )}

          {(mode !== 'forgot' && mode !== 'verify_reg') && (
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                placeholder={mode === 'reset' ? t.auth?.newPasswordPlaceholder : t.auth?.passwordPlaceholder} 
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
            {loading ? t.auth?.processing : (
              mode === 'login' ? t.auth?.submitLogin :
              mode === 'register' ? t.auth?.submitRegister :
              mode === 'forgot' ? t.auth?.submitForgot :
              mode === 'verify_reg' ? t.auth?.submitVerifyReg : t.auth?.submitReset
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
              {t.auth?.resendOtpBtn}
            </button>
          </div>
        )}

        {mode === 'login' && (
          <div className="mt-4 flex justify-center w-full px-1">
            {(window.electron || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) ? (
              <button
                type="button"
                onClick={handleGoogleDesktopLogin}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-semibold">Đăng nhập với Google</span>
              </button>
            ) : (
              <div id="google-signin-btn"></div>
            )}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-slate-400 space-y-2">
          {mode === 'login' && (
            <>
              <div>
                {t.auth?.noAccount}{' '}
                <button onClick={() => setMode('register')} className="text-brand-400 font-semibold hover:underline">
                  {t.auth?.registerNow}
                </button>
              </div>
              <div>
                <button onClick={() => setMode('forgot')} className="text-slate-500 text-xs hover:underline">
                  {t.auth?.forgotPassLink}
                </button>
              </div>
            </>
          )}

          {mode === 'register' && (
            <div>
              {t.auth?.haveAccount}{' '}
              <button onClick={() => setMode('login')} className="text-brand-400 font-semibold hover:underline">
                {t.auth?.submitLogin}
              </button>
            </div>
          )}

          {(mode === 'forgot' || mode === 'reset' || mode === 'verify_reg') && (
            <div>
              <button onClick={() => setMode('login')} className="text-brand-400 font-semibold hover:underline">
                {t.auth?.backToLogin}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
