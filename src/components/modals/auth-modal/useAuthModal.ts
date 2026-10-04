import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import { api, getBestServer } from '../../../services';

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'verify_reg';

export function useAuthModal(isOpen: boolean, onClose: () => void) {
  const { login, register } = useAuth();
  const { t } = useLang();

  const [mode, setMode] = useState<AuthMode>('login');
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
      if ((window as any).google && !(window as any).electron) {
        (window as any).google.accounts.id.initialize({
          client_id: '107953505478-0gielhlbbif11eu77rb29sq7ie7dqbmn.apps.googleusercontent.com',
          callback: handleGoogleSignInCallback,
        });
        const btnContainer = document.getElementById('google-signin-btn');
        if (btnContainer) {
          (window as any).google.accounts.id.renderButton(
            btnContainer,
            { theme: 'filled_blue', size: 'large', width: 290 }
          );
        }
      }
    }
  }, [isOpen]);

  const handleGoogleSignInCallback = async (response: any) => {
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi đăng nhập Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleDesktopLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const clientId = '107953505478-0gielhlbbif11eu77rb29sq7ie7dqbmn.apps.googleusercontent.com';
      const redirectUri = 'https://tienhiep.lyvuha.com/api/auth/google/callback';
      const state = encodeURIComponent('desktop|http://127.0.0.1:5051');
      const nonce = Math.random().toString(36).substring(2);

      const loginUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=email%20profile&nonce=${nonce}&prompt=select_account&state=${state}`;

      const isNative = (window as any).Capacitor && (window as any).Capacitor.isNativePlatform && (window as any).Capacitor.isNativePlatform();

      if ((window as any).electron && (window as any).electron.openExternal) {
        (window as any).electron.openExternal(loginUrl);
      } else if (isNative) {
        try {
          const { Browser } = await import('@capacitor/browser');
          await Browser.open({ url: loginUrl });
        } catch {
          window.open(loginUrl, '_system');
        }
      } else {
        window.open(loginUrl, '_blank');
      }
    } catch {
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
      const res = await api.post('/api/auth/resend-verification', { email: email.trim() });
      setMessage(res.data.message || 'Mã xác minh mới đã được gửi.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi gửi lại mã xác minh.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const u = username.trim();
    const p = password;
    const em = email.trim();
    const o = otp.trim();

    try {
      if (mode === 'login') {
        if (!u || !p) {
          setError(t.authRequired || 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
          return;
        }
        setLoading(true);
        const user = await login(u, p);
        onClose();
        if (user && user.require_password_change === 1) {
          window.location.href = '/settings';
        }
      } else if (mode === 'register') {
        if (!u || !p) {
          setError(t.authRequired || 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
          return;
        }
        setLoading(true);
        const res = await register(u, p, em);
        if (res.require_verification) {
          setMessage(res.message || 'Một mã xác minh đã được gửi đến email của bạn.');
          setMode('verify_reg');
        } else {
          setMessage(t.regSuccess || 'Đăng ký thành công!');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else if (mode === 'verify_reg') {
        if (!em || !o) {
          setError('Vui lòng nhập đầy đủ email và mã OTP xác minh.');
          return;
        }
        setLoading(true);
        const res = await api.post('/api/auth/verify-registration', { email: em, otp: o });
        if (res.data?.access_token) {
          localStorage.setItem('accessToken', res.data.access_token);
          document.cookie = `accessToken=${res.data.access_token}; path=/; max-age=604800; SameSite=Lax`;
          if (res.data.refresh_token) {
            localStorage.setItem('refreshToken', res.data.refresh_token);
          }
          if (res.data.user) {
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
          setMessage(res.data.message || 'Xác thực tài khoản thành công!');
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 800);
          return;
        }
        setMessage(res.data.message || 'Xác minh thành công! Vui lòng đăng nhập.');
        setMode('login');
        setPassword('');
        setOtp('');
      } else if (mode === 'forgot') {
        if (!em) {
          setError('Vui lòng nhập email.');
          return;
        }
        setLoading(true);
        const res = await api.post('/api/auth/forgot-password', { email: em });
        setMessage(res.data.message || 'Mã OTP đã được gửi đến email của bạn.');
        setMode('reset');
      } else if (mode === 'reset') {
        if (!em || !o || !p) {
          setError('Vui lòng điền đầy đủ thông tin.');
          return;
        }
        setLoading(true);
        const res = await api.post('/api/auth/reset-password', { email: em, otp: o, password: p });
        setMessage(res.data.message || 'Khôi phục mật khẩu thành công.');
        setMode('login');
        setPassword('');
      }
    } catch (err: any) {
      const respData = err.response?.data;
      if (respData?.require_verification) {
        setEmail(respData.email || email);
        setMode('verify_reg');
        setError(respData.error || 'Tài khoản chưa được xác minh. Vui lòng nhập mã OTP.');
      } else {
        setError(respData?.error || err.message || t.connError || 'Lỗi kết nối.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    t,
    mode,
    setMode,
    username,
    setUsername,
    password,
    setPassword,
    email,
    setEmail,
    otp,
    setOtp,
    error,
    message,
    loading,
    handleSubmit,
    handleGoogleDesktopLogin,
    handleResendVerification,
  };
}
