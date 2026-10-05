import { useState, useEffect } from 'react';
import { TranslationSettingsState } from './TranslationSettings.types';

export function useTranslationSettings(isOpen: boolean) {
  const [activeTab, setActiveTab] = useState<'tools' | 'advanced' | 'history'>('tools');
  const [settings, setSettings] = useState<TranslationSettingsState>({
    engineType: 'browser',
    mode: '4',
    serverUrl: '',
    vipKey: '',
    scrollSpeed: 30,
    audioSpeed: 1.0,
    continuousClean: true,
    typewriterEffect: false,
  });

  useEffect(() => {
    const syncSettings = () => {
      const stored = localStorage.getItem('translationSettings');
      if (stored) {
        try {
          let parsed = JSON.parse(stored);
          if (!parsed.mode || parsed.mode === 'vietphrase') {
            parsed.mode = '4';
          }
          const validModes = ['1', '2', '3', '4', 1, 2, 3, 4, 'raw', 'none'];
          if (parsed.engineType === 'browser' && !validModes.includes(parsed.mode)) {
            parsed.mode = '4';
          }
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {}
      }
    };

    if (isOpen) {
      syncSettings();
    }

    const handleSettingsUpdate = (e: any) => {
      if (e.detail) {
        setSettings(prev => ({ ...prev, ...e.detail }));
      }
    };

    window.addEventListener('translationSettingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('translationSettingsUpdated', handleSettingsUpdate);
  }, [isOpen]);

  const updateSetting = (key: keyof TranslationSettingsState, value: any) => {
    let newSettings = { ...settings, [key]: value };
    const validModes = ['1', '2', '3', '4', 1, 2, 3, 4, 'vietphrase', 'hanviet', 'raw', 'none'];
    if (key === 'engineType' && value === 'browser') {
      if (!validModes.includes(newSettings.mode)) {
        newSettings.mode = '4';
      }
    }
    setSettings(newSettings);
    localStorage.setItem('translationSettings', JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent('translationSettingsUpdated', { detail: newSettings }));
  };

  return {
    activeTab,
    setActiveTab,
    settings,
    updateSetting,
  };
}
