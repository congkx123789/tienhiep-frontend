import { History, BookOpen, Globe } from 'lucide-react';

interface HistoryHeaderProps {
  lang: string;
  activeTab: 'reading' | 'web';
  setActiveTab: (tab: 'reading' | 'web') => void;
  browserHistoryLength: number;
}

export function HistoryHeader({
  lang,
  activeTab,
  setActiveTab,
  browserHistoryLength,
}: HistoryHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <History className="w-6 h-6 text-brand-400" />
          {lang === 'vi' ? 'Trung Tâm Lịch Sử' : lang === 'en' ? 'History Center' : '历史中心'}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {lang === 'vi' ? 'Theo dõi tiến độ đọc truyện và lịch sử duyệt web di động' : 'Track reading progress and mobile browsing history'}
        </p>
      </div>

      {/* Segmented Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl self-start sm:self-auto">
        <button
          onClick={() => setActiveTab('reading')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'reading'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{lang === 'vi' ? 'Lịch Sử Đọc' : 'Reading'}</span>
        </button>

        <button
          onClick={() => setActiveTab('web')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'web'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === 'vi' ? `Duyệt Web (${browserHistoryLength})` : `Web (${browserHistoryLength})`}</span>
        </button>
      </div>
    </div>
  );
}
