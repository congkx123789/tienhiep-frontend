export const isElectron: boolean =
  typeof window !== 'undefined' &&
  (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1 || Boolean((window as any).electron));

export const isCapacitorNative: boolean =
  typeof window !== 'undefined' &&
  (Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
   (typeof (window as any).Capacitor?.getPlatform === 'function' && ['android', 'ios'].includes((window as any).Capacitor.getPlatform())) ||
   Boolean((window as any).webkit?.messageHandlers?.cordova_iab));

export const isNativeApp: boolean = isElectron || isCapacitorNative;
export const isWebPlatform: boolean = !isNativeApp;

export const getElectronAPI = (): any => {
  return isElectron ? (window as any).electron : null;
};

