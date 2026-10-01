import { useEffect } from 'react';
import { AuthUser } from './Auth.types';

export function useAdSensePolicy(user: AuthUser | null, loading: boolean) {
  useEffect(() => {
    if (loading) return;

    const isNativeOrElectron = typeof window !== 'undefined' && (
      !!(window as any).electron ||
      ((window as any).Capacitor?.isNativePlatform && (window as any).Capacitor.isNativePlatform())
    );

    if (isNativeOrElectron) {
      console.log("Native / Electron Platform - Google AdSense disabled for policy compliance");
      const script = document.getElementById('google-adsense-script');
      if (script) {
        script.remove();
      }
      return;
    }

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
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ((import.meta as any).env?.VITE_ADSENSE_CLIENT || 'ca-pub-9548504602542886');
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, [user, loading]);
}
