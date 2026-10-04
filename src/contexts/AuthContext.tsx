import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services';
import { AuthUser, AuthContextType } from './auth/Auth.types';
import { saveAuthTokens, clearAuthTokens } from './auth/authTokenStorage';
import { useOAuthDeepLink } from './auth/useOAuthDeepLink';
import { useAdSensePolicy } from './auth/useAdSensePolicy';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateApiKey = async () => {
    try {
      const res = await api.get('/api/developer/keys');
      if (res.data?.keys && res.data.keys.length > 0) {
        const key = res.data.keys[0].api_key;
        localStorage.setItem('local_tts_key', key);
        return key;
      } else {
        const createRes = await api.post('/api/developer/keys/create', { name: 'Auto Matcha Key' });
        if (createRes.data?.api_key) {
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

  const onAuthSuccess = async (accessToken?: string, refreshToken?: string, newUser?: AuthUser | null) => {
    await saveAuthTokens(accessToken, refreshToken, newUser);
    if (newUser) setUser(newUser);
    fetchOrCreateApiKey().catch(() => {});
  };

  const onAuthFailure = async () => {
    setUser(null);
    await clearAuthTokens();
  };

  const tryRefreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      onAuthFailure();
      return;
    }
    try {
      const response = await api.post('/api/auth/refresh', { refresh_token: refreshToken });
      if (response.data?.access_token) {
        await onAuthSuccess(
          response.data.access_token,
          response.data.refresh_token || refreshToken,
          response.data.user
        );
      } else {
        onAuthFailure();
      }
    } catch (e: any) {
      console.error("Token refresh failed:", e);
      if (e.response && (e.response.status === 400 || e.response.status === 401 || e.response.status === 403)) {
        onAuthFailure();
      } else {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try { setUser(JSON.parse(cachedUser)); } catch (_) {}
        }
      }
    }
  };

  const checkAuth = async () => {
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        const match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'));
        if (match) {
          token = match[2];
          localStorage.setItem('accessToken', token);
        }
      }

      if (!token) {
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
      if (response.data?.logged_in) {
        const serverUser = response.data.user;
        if (serverUser) {
          localStorage.setItem('user', JSON.stringify(serverUser));
          setUser(serverUser);
        }
        const rToken = localStorage.getItem('refreshToken');
        if (rToken) localStorage.setItem('refreshToken', rToken);
        fetchOrCreateApiKey().catch(() => {});
      } else {
        await tryRefreshToken();
      }
    } catch (error: any) {
      console.error("Auth check failed:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        await tryRefreshToken();
      } else if (error.response && error.response.status === 400) {
        onAuthFailure();
      } else {
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
    const initAuth = async () => {
      let cachedUser: AuthUser | null = null;
      let token = null;

      if ((window as any).electron?.storeGet) {
        token = await (window as any).electron.storeGet('accessToken');
        const rToken = await (window as any).electron.storeGet('refreshToken');
        const userObj = await (window as any).electron.storeGet('user');
        
        if (token) localStorage.setItem('accessToken', token);
        if (rToken) localStorage.setItem('refreshToken', rToken);
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
        setLoading(false);
      }
      
      await checkAuth();
    };

    initAuth();
  }, []);

  useOAuthDeepLink(onAuthSuccess);
  useAdSensePolicy(user, loading);

  const login = async (username: string, password: string): Promise<AuthUser> => {
    const response = await api.post('/api/auth/login', { username, password });
    if (response.data?.access_token) {
      await onAuthSuccess(
        response.data.access_token,
        response.data.refresh_token,
        response.data.user
      );
      return response.data.user;
    }
    throw new Error(response.data?.error || 'Đăng nhập không thành công');
  };

  const register = async (username: string, password: string, email?: string) => {
    const response = await api.post('/api/auth/register', { username, password, email });
    if (response.data?.error) {
      throw new Error(response.data.error);
    }
    if (response.data?.access_token) {
      await onAuthSuccess(
        response.data.access_token,
        response.data.refresh_token,
        response.data.user
      );
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
      if (response.data?.logged_in) {
        await onAuthSuccess(
          localStorage.getItem('accessToken') || undefined,
          localStorage.getItem('refreshToken') || undefined,
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export * from './auth/Auth.types';
export default AuthContext;
