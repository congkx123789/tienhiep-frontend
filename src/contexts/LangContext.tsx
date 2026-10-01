import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './lang/locales';
import { LangCode, LangContextType } from './lang/Lang.types';

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangCode>(() => (localStorage.getItem('preferredLanguage') as LangCode) || 'vi');

  useEffect(() => {
    localStorage.setItem('preferredLanguage', lang);
  }, [lang]);

  const t = translations[lang] || translations.vi;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    return {
      lang: 'vi' as LangCode,
      setLang: () => {},
      t: translations.vi,
    };
  }
  return context;
}

export * from './lang/Lang.types';
export { LangContext };
export default LangContext;
