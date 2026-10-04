import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroBook } from '../Discover.types';

interface DiscoverHeroProps {
  heroBooks: HeroBook[];
  heroIndex: number;
  activeHero: HeroBook;
  heroDescription: string;
  heroTranslating: boolean;
  lang: string;
  onSetHeroIndex: (idx: number | ((prev: number) => number)) => void;
  onPlayHeroTrailer: () => void;
  onTranslateHeroDesc: (targetLang: 'original' | 'vi' | 'en') => void;
}

export const DiscoverHero: React.FC<DiscoverHeroProps> = ({
  heroBooks,
  heroIndex,
  activeHero,
  heroDescription,
  heroTranslating,
  lang,
  onSetHeroIndex,
  onPlayHeroTrailer,
  onTranslateHeroDesc
}) => {
  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden mb-6 min-h-[220px] sm:min-h-[360px] bg-[#0b0b14] border border-[#1f1f3a]/80 shadow-2xl flex flex-col justify-end">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700" 
        style={{ backgroundImage: `url('${(import.meta as any).env?.BASE_URL || '/'}hero_banner.png')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b14] via-[#0b0b14]/75 to-transparent" />
      
      <div className="relative z-10 p-4 sm:p-8 md:p-12 max-w-2xl text-left space-y-2 sm:space-y-4 self-start">
        <h2 className="text-lg sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-200 tracking-wide uppercase">
          {lang === 'vi' ? 'TRUYỆN ĐỀ CỬ XUẤT SẮC TUẦN NÀY' : lang === 'en' ? 'WEEKLY FEATURED NOVEL' : '本周精选推荐'}
        </h2>
        <h3 className="text-base sm:text-xl md:text-2xl font-bold text-white tracking-wide">
          {activeHero.title_vietphrase}
        </h3>
        <p className="text-slate-400 text-xs mt-1 hidden sm:block">
          ✍ {lang === 'vi' ? 'Tác giả:' : lang === 'en' ? 'Author:' : '作者:'} <strong className="text-brand-300 font-semibold">{activeHero.author_hanviet}</strong> · {lang === 'vi' ? 'Thể loại:' : lang === 'en' ? 'Categories:' : '题材:'} <span className="text-slate-300 font-medium">{activeHero.categories}</span>
        </p>

        <p className="text-slate-300 text-xs leading-relaxed line-clamp-2 sm:line-clamp-3 bg-[#0b0b14]/60 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/5">
          {heroTranslating ? (lang === 'vi' ? "Đang dịch nội dung..." : lang === 'en' ? "Translating content..." : "正在翻译内容...") : heroDescription}
        </p>

        <div className="flex flex-wrap gap-2 sm:gap-4 pt-1 sm:pt-2">
          <button 
            onClick={onPlayHeroTrailer}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-extrabold px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-lg transition-all text-xs"
          >
            {lang === 'vi' ? 'Nghe Tóm Tắt (TTS)' : lang === 'en' ? 'Listen Summary (TTS)' : '听取大纲 (TTS)'} <span className="text-purple-300">| 🔊</span>
          </button>
          
          <div className="inline-flex items-center gap-1.5 bg-[#121225]/80 border border-white/10 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold">
            <span className="text-slate-400 text-[10px] hidden sm:inline">{lang === 'vi' ? 'Dịch Nhanh' : lang === 'en' ? 'Quick Translate' : '快速翻译'}</span>
            <button onClick={() => onTranslateHeroDesc('vi')} className="hover:scale-115 transition-transform" title="Thuần Việt">🇻🇳</button>
            <button onClick={() => onTranslateHeroDesc('en')} className="hover:scale-115 transition-transform" title="English">🇺🇸</button>
            <button onClick={() => onTranslateHeroDesc('original')} className="hover:scale-115 transition-transform" title="Original Chinese">🇨🇳</button>
          </div>
        </div>
      </div>

      <div className="absolute right-8 bottom-8 z-10 flex items-center gap-3">
        <button 
          onClick={() => onSetHeroIndex(prev => (prev - 1 + heroBooks.length) % heroBooks.length)}
          className="p-2 bg-black/50 hover:bg-black/75 rounded-full border border-white/10 text-white transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex gap-1.5">
          {heroBooks.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => onSetHeroIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${heroIndex === idx ? 'bg-purple-500 w-6' : 'bg-white/20'}`}
            />
          ))}
        </div>

        <button 
          onClick={() => onSetHeroIndex(prev => (prev + 1) % heroBooks.length)}
          className="p-2 bg-black/50 hover:bg-black/75 rounded-full border border-white/10 text-white transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
