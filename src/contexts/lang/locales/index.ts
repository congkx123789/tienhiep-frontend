import { vi } from './vi';
import { en } from './en';
import { zh } from './zh';

export const translations: Record<string, typeof vi> = {
  vi,
  en,
  zh,
};

export { vi, en, zh };
