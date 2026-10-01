import 'react';

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag' | string;
  }
}

interface ImportMetaEnv {
  [key: string]: any;
  PROD?: boolean;
  DEV?: boolean;
  VITE_ADSENSE_CLIENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    electron?: any;
    Capacitor?: any;
    adsbygoogle?: any[];
    __originalUrl?: string;
  }
}

export {};
