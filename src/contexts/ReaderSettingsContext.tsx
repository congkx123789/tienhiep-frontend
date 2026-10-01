import React, { createContext, useContext, useState, useEffect } from 'react';

interface ReaderSettingsContextType {
  theme: string;
  setTheme: (t: string) => void;
  fontSize: number;
  setFontSize: (s: number | ((prev: number) => number)) => void;
  decreaseFontSize: () => void;
  increaseFontSize: () => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  lineHeight: string;
  setLineHeight: (l: string) => void;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextType | null>(null);

export function ReaderSettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('readerTheme') || 'dark');
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('readerFontSize') || '18'));
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('readerFontFamily') || 'sans');
  const [lineHeight, setLineHeight] = useState(() => localStorage.getItem('readerLineHeight') || 'relaxed');

  useEffect(() => {
    localStorage.setItem('readerTheme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('readerFontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('readerFontFamily', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    localStorage.setItem('readerLineHeight', lineHeight);
  }, [lineHeight]);

  const decreaseFontSize = () => setFontSize(prev => Math.max(12, prev - 1));
  const increaseFontSize = () => setFontSize(prev => Math.min(36, prev + 1));

  return (
    <ReaderSettingsContext.Provider value={{
      theme,
      setTheme,
      fontSize,
      setFontSize,
      decreaseFontSize,
      increaseFontSize,
      fontFamily,
      setFontFamily,
      lineHeight,
      setLineHeight
    }}>
      {children}
    </ReaderSettingsContext.Provider>
  );
}

export function useReaderSettings(): ReaderSettingsContextType {
  const context = useContext(ReaderSettingsContext);
  if (!context) {
    return {
      theme: 'dark',
      setTheme: () => {},
      fontSize: 18,
      setFontSize: () => {},
      decreaseFontSize: () => {},
      increaseFontSize: () => {},
      fontFamily: 'sans',
      setFontFamily: () => {},
      lineHeight: 'relaxed',
      setLineHeight: () => {}
    };
  }
  return context;
}
