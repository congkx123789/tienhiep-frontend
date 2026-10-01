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
      const server = await getBestServer();
      const loginUrl = `${server}/api/auth/google/login?state=desktop|${encodeURIComponent(server)}`;
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
      const res = await api.post('/api/auth/resend-verification', { email });
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
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!username || !password) {
          setError(t.authRequired || 'Vui lòng điền đủ thông tin');
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
          setError(t.authRequired || 'Vui lòng điền đủ thông tin');
          setLoading(false);
          return;
        }
        const res = await register(username, password, email);
        if (res.require_verification) {
          setMessage(res.message || 'Một mã xác minh đã được gửi đến email của bạn.');
          setMode('verify_reg');
        } else {
          setMessage(t.regSuccess || 'Đăng ký thành công!');
          setMode('login');
          setPassword('');
        }
      } else if (mode === 'verify_reg') {
        if (!email || !otp) {
          setError('Vui lòng nhập đầy đủ email và mã OTP xác minh.');
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
          setError('Vui lòng nhập email.');
          setLoading(false);
          return;
        }
        const res = await api.post('/api/auth/forgot-password', { email });
        setMessage(res.data.message || 'Mã OTP đã được gửi đến email của bạn.');
        setMode('reset');
      } else if (mode === 'reset') {
        if (!email || !otp || !password) {
          setError('Vui lòng điền đầy đủ thông tin.');
          setLoading(false);
          return;
        }
        const res = await api.post('/api/auth/reset-password', { email, otp, password });
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
