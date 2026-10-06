export interface TranslationSettings {
  engineType: string;
  mode: string;
  serverUrl: string;
  vipKey: string;
  scrollSpeed: number;
  audioSpeed: number;
  continuousClean: boolean;
  typewriterEffect: boolean;
}

export type SettingsTabId =
  | 'profile'
  | 'security'
  | 'preferences'
  | 'wallet'
  | 'stats'
  | 'desktop'
  | 'tts_models'
  | 'ai_translation'
  | 'reports_drive';

export interface TabItem {
  id: SettingsTabId;
  label: string;
  icon: any;
  badge?: string;
}
