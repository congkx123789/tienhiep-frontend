import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lyvuha.tts',
  appName: 'Tiên Hiệp AI',
  webDir: 'dist-web',
  server: {
    androidScheme: 'http'
  }
};

export default config;
