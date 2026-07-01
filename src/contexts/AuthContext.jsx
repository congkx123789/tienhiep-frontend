import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateApiKey = async () => {
    try {
      const res = await api.get('/api/developer/keys');
      if (res.data && res.data.keys && res.data.keys.length > 0) {
        const key = res.data.keys[0].api_key;
        localStorage.setItem('local_tts_key', key);
        return key;
      } else {
        // No keys, create one!
        const createRes = await api.post('/api/developer/keys/create', { name: 'Auto Matcha Key' });
        if (createRes.data && createRes.data.api_key) {
          const key = createRes.data.api_key;
          localStorage.setItem('local_tts_key', key);
          return key;
        }
      }
    } catch (e) {
      console.error("Failed to fetch/create API key:", e);
    }
    return null;
  };

  const onAuthSuccess = async (accessToken, refreshToken, user) => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      document.cookie = `accessToken=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
      if (window.electron && typeof window.electron.storeSet === 'function') {
        await window.electron.storeSet('accessToken', accessToken);
      }
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
      if (window.electron && typeof window.electron.storeSet === 'function') {
        await window.electron.storeSet('refreshToken', refreshToken);
      }
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      if (window.electron && typeof window.electron.storeSet === 'function') {
        await window.electron.storeSet('user', user);
      }
    }

    // ── Fire-and-forget: fetch API key in background, do NOT await ────────
    // Previously this was awaited, causing a waterfall:
    //   /api/auth/me → wait → /api/developer/keys → wait → render
    // Now both calls resolve independently, UI renders immediately.
    fetchOrCreateApiKey().catch(() => {});

    // Notify same-tab listeners (e.g. extension content script)
    window.dispatchEvent(new Event('sync-auth-event'));
  };

  const onAuthFailure = async () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('local_tts_key');
    document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax";
    
    if (window.electron && typeof window.electron.storeDelete === 'function') {
      await window.electron.storeDelete('accessToken');
      await window.electron.storeDelete('refreshToken');
      await window.electron.storeDelete('user');
    }
    
    // Notify same-tab listeners
    window.dispatchEvent(new Event('sync-auth-event'));
  };

  const tryRefreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      onAuthFailure();
      return;
    }
    try {
      const response = await api.post('/api/auth/refresh', { refresh_token: refreshToken });
      if (response.data && response.data.access_token) {
        await onAuthSuccess(
          response.data.access_token,
          response.data.refresh_token || refreshToken,
          response.data.user
        );
      } else {
        onAuthFailure();
      }
    } catch (e) {
      console.error("Token refresh failed:", e);
      // Chỉ xóa token khi server phản hồi các lỗi Client (400, 401, 403) chứng tỏ token hết hạn/không hợp lệ
      if (e.response && (e.response.status === 400 || e.response.status === 401 || e.response.status === 403)) {
        onAuthFailure();
      } else {
        // Lỗi mạng/Server 5xx: Giữ nguyên token, cố gắng khôi phục thông tin user đã cache
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch (_) {}
        }
      }
    }
  };

  const checkAuth = async () => {
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        // Fallback to cookie
        const match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'));
        if (match) {
          token = match[2];
          localStorage.setItem('accessToken', token);
        }
      }

      if (!token) {
        // No access token, try refresh immediately if possible
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          await tryRefreshToken();
        } else {
          onAuthFailure();
        }
        setLoading(false);
        return;
      }

      const response = await api.get('/api/auth/me');
      if (response.data && response.data.logged_in) {
        // Update user data from server (may differ from cached)
        const serverUser = response.data.user;
        if (serverUser) {
          localStorage.setItem('user', JSON.stringify(serverUser));
          setUser(serverUser);
        }
        const rToken = localStorage.getItem('refreshToken');
        if (rToken) localStorage.setItem('refreshToken', rToken);
        // API key fetch is non-blocking (fire-and-forget)
        fetchOrCreateApiKey().catch(() => {});
      } else {
        await tryRefreshToken();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        await tryRefreshToken();
      } else if (error.response && error.response.status === 400) {
        onAuthFailure();
      } else {
        // Network / server 5xx: keep cached user shown
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try { setUser(JSON.parse(cachedUser)); } catch (_) {}
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ── Optimistic rendering: show cached user immediately ─────────────────
    const initAuth = async () => {
      let cachedUser = null;
      let token = null;
      let refreshToken = null;

      if (window.electron && typeof window.electron.storeGet === 'function') {
        token = await window.electron.storeGet('accessToken');
        refreshToken = await window.electron.storeGet('refreshToken');
        const userObj = await window.electron.storeGet('user');
        
        // Sync back to localStorage for other parts of the application
        if (token) localStorage.setItem('accessToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        if (userObj) {
          localStorage.setItem('user', JSON.stringify(userObj));
          cachedUser = userObj;
        }
      } else {
        const localUserStr = localStorage.getItem('user');
        if (localUserStr) {
          try { cachedUser = JSON.parse(localUserStr); } catch (_) {}
        }
        token = localStorage.getItem('accessToken') || document.cookie.includes('accessToken=');
      }

      if (cachedUser && token) {
        setUser(cachedUser);
        setLoading(false); // Mở khóa giao diện ngay lập tức!
      }
      
      // Then verify silently
      await checkAuth();
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (window.electron && typeof window.electron.onOAuthCallback === 'function') {
      console.log("[AuthContext] Registering Electron Deep Link OAuth Listener");
      const unsubscribe = window.electron.onOAuthCallback((url) => {
        try {
          console.log("[AuthContext] Received OAuth Callback URL:", url);
          const parsedUrl = new URL(url);
          const params = new URLSearchParams(parsedUrl.search);
          const token = params.get('token');
          const refreshToken = params.get('refresh_token');
          const userStr = params.get('user');
          let parsedUser = null;
          if (userStr) {
            parsedUser = JSON.parse(decodeURIComponent(userStr));
          }
          
          if (token) {
            onAuthSuccess(token, refreshToken, parsedUser);
            console.log("[AuthContext] Deep link OAuth login successful!");
            
            if (parsedUser && parsedUser.require_password_change === 1) {
              window.location.href = '/settings';
            } else {
              window.location.reload();
            }
          }
        } catch (err) {
          console.error("[AuthContext] Failed to process OAuth callback URL:", err);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    if (user && user.vip_status === 1) {
      console.log("VIP User detected - Google AdSense disabled");
      const script = document.getElementById('google-adsense-script');
      if (script) {
        script.remove();
      }
      return;
    }

    if (!document.getElementById('google-adsense-script')) {
      const script = document.createElement('script');
      script.id = 'google-adsense-script';
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + (import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-9548504602542886');
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, [user, loading]);

  const login = async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    if (response.data && response.data.access_token) {
      await onAuthSuccess(
        response.data.access_token,
        response.data.refresh_token,
        response.data.user
      );
      return response.data.user;
    }
    throw new Error(response.data.error || 'Đăng nhập không thành công');
  };

  const register = async (username, password, email) => {
    const response = await api.post('/api/auth/register', { username, password, email });
    if (response.data && response.data.error) {
      throw new Error(response.data.error);
    }
    return response.data;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/api/auth/logout', { refresh_token: refreshToken });
    } catch (e) {
      console.error(e);
    } finally {
      onAuthFailure();
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data && response.data.logged_in) {
        await onAuthSuccess(
          localStorage.getItem('accessToken'),
          localStorage.getItem('refreshToken'),
          response.data.user
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
