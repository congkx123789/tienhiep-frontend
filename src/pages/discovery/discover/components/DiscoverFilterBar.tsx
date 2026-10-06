import React from 'react';
import { Search, Filter, Sparkles, Shuffle, X } from 'lucide-react';

interface DiscoverFilterBarProps {
  q: string;
  setQ: (val: string) => void;
  searchField: string;
  setSearchField: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  source: string;
  setSource: (val: string) => void;
  dup: string;
  setDup: (val: string) => void;
  minChapters: string;
  setMinChapters: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  showFilters: boolean;
  setShowFilters: (val: boolean | ((prev: boolean) => boolean)) => void;
  total: number;
  lang: string;
  t: any;
  onSearchSubmit: (e: React.FormEvent) => void;
  onOpenAiModal: () => void;
  onRandomGacha: () => void;
  onClearFilters: () => void;
  getCategoryName: (cat: string) => string;
}

export const DiscoverFilterBar: React.FC<DiscoverFilterBarProps> = ({
  q,
  setQ,
  searchField,
  setSearchField,
  category,
  setCategory,
  source,
  setSource,
  dup,
  setDup,
  minChapters,
  setMinChapters,
  sortBy,
  setSortBy,
  showFilters,
  setShowFilters,
  total,
  lang,
  t,
  onSearchSubmit,
  onOpenAiModal,
  onRandomGacha,
  onClearFilters,
  getCategoryName
}) => {
  return (
    <form onSubmit={onSearchSubmit} className="bg-[#121225]/80 border border-[#1f1f3a]/80 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* 🍯 Bẫy chống Bot (Honeypot Trap): Bot tự động điền ô này sẽ bị từ chối ngay */}
      <input type="text" name="hp_trap" tabIndex={-1} autoComplete="off" style={{ display: 'none', position: 'absolute', opacity: 0, pointerEvents: 'none' }} aria-hidden="true" />
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-white outline-none focus:border-purple-500 transition-colors text-xs"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <button 
            type="submit" 
            className="flex-1 sm:flex-initial bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-3 rounded-xl shadow-md transition-all text-xs text-center"
          >
            {lang === 'vi' ? 'Tìm' : lang === 'en' ? 'Search' : '搜索'}
          </button>

          <button 
            type="button" 
            onClick={() => setShowFilters(v => !v)}
            className={`px-3 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              showFilters 
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-300' 
                : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:text-white'
            }`}
            title={lang === 'vi' ? 'Bộ lọc nâng cao' : lang === 'en' ? 'Advanced filters' : '高级筛选'}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'vi' ? 'Bộ lọc' : lang === 'en' ? 'Filters' : '筛选'}</span>
          </button>

          <button 
            type="button" 
            onClick={onOpenAiModal}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 text-[#0b0b14] font-extrabold px-4 py-3 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 fill-current animate-pulse" />
            <span>{lang === 'vi' ? 'AI' : lang === 'en' ? 'AI Search' : 'AI'}</span>
          </button>
        </div>
      </div>

      <div className={`${showFilters ? 'grid' : 'hidden lg:grid'} grid-cols-2 md:grid-cols-3 gap-3 pt-2`}>
        <select 
          value={searchField} 
          onChange={(e) => setSearchField(e.target.value)}
          className="bg-[#0b0b14] border border-[#1f1f3a] text-xs font-semibold rounded-xl p-3 text-slate-300 outline-none cursor-pointer focus:border-purple-500"
        >
          <option value="all">{t.searchFieldAll}</option>
          <option value="title">{t.searchFieldTitle}</option>
          <option value="author">{t.searchFieldAuthor}</option>
          <option value="hanviet">{t.searchFieldHanviet}</option>
          <option value="vietphrase">{t.searchFieldVietphrase}</option>
          <option value="chinese">{t.searchFieldChinese}</option>
          <option value="description">{t.searchFieldDesc}</option>
        </select>

        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          className="bg-[#0b0b14] border border-[#1f1f3a] text-xs font-semibold rounded-xl p-3 text-slate-300 outline-none cursor-pointer focus:border-purple-500"
        >
          <option value="">{t.allCategories}</option>
          {["玄幻", "都市", "言情", "女生", "科幻", "修真", "仙侠", "武侠", "历史", "网游", "同人", "其他"].map(cat => (
            <option key={cat} value={cat}>{getCategoryName(cat)}</option>
          ))}
        </select>

        <select 
          value={source} 
          onChange={(e) => setSource(e.target.value)}
          className="bg-[#0b0b14] border border-[#1f1f3a] text-xs font-semibold rounded-xl p-3 text-slate-300 outline-none cursor-pointer focus:border-purple-500"
        >
          <option value="">{t.allSources}</option>
          {['Ixdzs', 'Biquge', '41nr', 'Quanben', 'Faloo', 'Fanqie', 'Hjwzw'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select 
          value={dup} 
          onChange={(e) => setDup(e.target.value)}
          className="bg-[#0b0b14] border border-[#1f1f3a] text-xs font-semibold rounded-xl p-3 text-slate-300 outline-none cursor-pointer focus:border-purple-500"
        >
          <option value="">{t.allDup}</option>
          <option value="multi">{t.dupMulti}</option>
          <option value="single">{t.dupSingle}</option>
        </select>

        <select 
          value={minChapters} 
          onChange={(e) => setMinChapters(e.target.value)}
          className="bg-[#0b0b14] border border-[#1f1f3a] text-xs font-semibold rounded-xl p-3 text-slate-300 outline-none cursor-pointer focus:border-purple-500"
        >
          <option value="">{t.allChapters}</option>
          <option value="100">{t.ch100}</option>
          <option value="500">{t.ch500}</option>
          <option value="1000">{t.ch1000}</option>
          <option value="2000">{t.ch2000}</option>
        </select>

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[#0b0b14] border border-[#1f1f3a] text-xs font-semibold rounded-xl p-3 text-slate-300 outline-none cursor-pointer focus:border-purple-500"
        >
          <option value="site_count DESC">{t.sortBy.site_count}</option>
          <option value="chapters_max DESC">{t.sortBy.chapters_max}</option>
          <option value="word_count_max DESC">{t.sortBy.word_count_max}</option>
          <option value="title ASC">{t.sortBy.title_asc}</option>
          <option value="title DESC">{t.sortBy.title_desc}</option>
          <option value="id ASC">{t.sortBy.default}</option>
        </select>
      </div>

      <div className="flex justify-between items-center border-t border-[#1f1f3a]/30 pt-3">
        <span className="text-slate-500 text-xs">
          {lang === 'vi' ? <>Tìm thấy <strong>{total.toLocaleString()}</strong> truyện</> : lang === 'en' ? <>Found <strong>{total.toLocaleString()}</strong> novels</> : <>找到 <strong>{total.toLocaleString()}</strong> 部小说</>}
        </span>
        
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onRandomGacha}
            className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors text-xs font-extrabold"
          >
            <Shuffle className="w-3.5 h-3.5" /> {lang === 'vi' ? 'Random Truyện (Gacha)' : lang === 'en' ? 'Random Novel (Gacha)' : '随机小说 (抽卡)'}
          </button>

          <button 
            type="button" 
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-bold"
          >
            <X className="w-3.5 h-3.5" /> {t.clearFilter}
          </button>
        </div>
      </div>
    </form>
  );
};
