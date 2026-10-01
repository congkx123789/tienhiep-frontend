/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  TranslationSettings.types.ts
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

export interface TranslationSettingsState {
  engineType: string;
  mode: string;
  serverUrl: string;
  vipKey: string;
  scrollSpeed: number;
  audioSpeed: number;
  continuousClean: boolean;
  typewriterEffect: boolean;
}

export interface WebHistoryItem {
  title: string;
  url: string;
}

export interface ToolItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

export interface TranslationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToolAction: (actionId: string) => void;
  isAutoTranslate: boolean;
  pinnedTools: string[];
  onTogglePin: (toolId: string) => void;
  history?: WebHistoryItem[];
  onNavigate: (url: string) => void;
}
