import { useState } from 'react';
import api from '../../../services';
import { localTranslator } from '../../../utils/localTranslator';

export function useBookCardDesc(rawDesc: string) {
  const [showDesc, setShowDesc] = useState(false);
  const [translateMode, setTranslateMode] = useState<'original' | 'vi' | 'en'>('original');
  const [translatedDesc, setTranslatedDesc] = useState('');
  const [translating, setTranslating] = useState(false);

  const handleTranslateDesc = async (targetLang: 'original' | 'vi' | 'en') => {
    if (targetLang === 'original') {
      setTranslateMode('original');
      return;
    }
    setTranslating(true);
    try {
      const storedSettings = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      const activeMode = storedSettings.mode || '4';
      try {
        const res = await api.post('/api/translate', {
          texts: [rawDesc],
          mode: targetLang === 'en' ? 'en' : activeMode,
        });
        if (res.data?.translations?.[0]) {
          setTranslatedDesc(res.data.translations[0]);
          setTranslateMode(targetLang);
        }
      } catch (cloudErr) {
        console.warn("[BookCard] Cloud translation failed, trying offline localTranslator:", cloudErr);
        await localTranslator.loadDictionaries();
        const transText = localTranslator.translateSentence(rawDesc, 'advanced');
        setTranslatedDesc(transText);
        setTranslateMode(targetLang);
      }
    } catch (e) {
      alert("Hạn mức dịch máy chủ đã hết và bộ dịch offline gặp lỗi.");
    } finally {
      setTranslating(false);
    }
  };

  const descText = translateMode === 'original' ? rawDesc : (translatedDesc || rawDesc);

  return {
    showDesc,
    setShowDesc,
    translateMode,
    descText,
    translating,
    handleTranslateDesc,
  };
}
