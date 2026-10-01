export type LangCode = 'vi' | 'en' | 'zh';

export interface LangContextType {
  lang: LangCode;
  setLang: React.Dispatch<React.SetStateAction<LangCode>>;
  t: Record<string, any>;
}
