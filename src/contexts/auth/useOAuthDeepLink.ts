import { useEffect } from 'react';
import { AuthUser } from './Auth.types';

export function useOAuthDeepLink(onAuthSuccess: (token: string, refreshToken?: string, user?: AuthUser) => Promise<void>) {
  const handleOAuthUrl = async (url: string) => {
    try {
      console.log("[AuthContext] Received OAuth Callback URL:", url);
      const parsedUrl = new URL(url);
      const params = new URLSearchParams(parsedUrl.search);
      const token = params.get('token');
      const refreshToken = params.get('refresh_token') || undefined;
      const userStr = params.get('user');
      let parsedUser: AuthUser | undefined = undefined;
      if (userStr) {
        parsedUser = JSON.parse(decodeURIComponent(userStr));
      }
      
      if (token) {
        await onAuthSuccess(token, refreshToken, parsedUser);
        console.log("[AuthContext] Deep link OAuth login successful!");

        if (typeof window !== 'undefined') {
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
        
        if (parsedUser && parsedUser.require_password_change === 1) {
          window.location.href = '/settings';
        }
      }
    } catch (err) {
      console.error("[AuthContext] Failed to process OAuth callback URL:", err);
    }
  };

  useEffect(() => {
    if ((window as any).electron?.onOAuthCallback) {
      console.log("[AuthContext] Registering Electron Deep Link OAuth Listener");
      const unsubscribe = (window as any).electron.onOAuthCallback((url: string) => {
        handleOAuthUrl(url);
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const p = new URLSearchParams(window.location.search);
      if (p.has('token')) {
        handleOAuthUrl(window.location.href);
      }
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    let appListener: any = null;

    const setupCapacitorListener = async () => {
      const isNative = (window as any).Capacitor?.isNativePlatform && (window as any).Capacitor.isNativePlatform();
      if (!isNative) return;

      try {
        const { App } = await import('@capacitor/app');
        if (!isSubscribed) return;

        console.log("[AuthContext] Registering Capacitor App URL Open Listener");
        appListener = await App.addListener('appUrlOpen', (event: any) => {
          console.log("[AuthContext] Capacitor received URL:", event.url);
          handleOAuthUrl(event.url);
        });
      } catch (err) {
        console.error("[AuthContext] Failed to register Capacitor listener:", err);
      }
    };

    setupCapacitorListener();

    return () => {
      isSubscribed = false;
      if (appListener?.remove) {
        appListener.remove();
      }
    };
  }, []);
}
