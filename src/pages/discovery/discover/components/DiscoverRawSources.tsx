import React from 'react';
import { Globe } from 'lucide-react';

interface DiscoverRawSourcesProps {
  lang: string;
  openInBrowser?: (url: string) => void;
}

export const DiscoverRawSources: React.FC<DiscoverRawSourcesProps> = ({
  lang,
  openInBrowser
}) => {
  const sources = [
    { name: 'UUKanshu', logo: 'U', color: 'bg-indigo-600', url: 'https://uukanshu.cc', desc: 'UU Kanshu' },
    { name: 'Qidian', logo: 'Q', color: 'bg-red-600', url: 'https://m.qidian.com', desc: 'VIP Qidian' },
    { name: 'Fanqie', logo: 'F', color: 'bg-orange-500', url: 'https://fanqienovel.com', desc: 'Free Novel' },
    { name: 'Faloo', logo: 'F', color: 'bg-amber-500', url: 'https://m.faloo.com', desc: 'Faloo System' },
    { name: '69shuba', logo: '6', color: 'bg-emerald-600', url: 'https://www.69shuba.com', desc: '69 Book' },
    { name: 'Ixdzs', logo: 'I', color: 'bg-purple-600', url: 'https://ixdzs8.com', desc: 'EPUB Ebook' },
  ];

  return (
    <div className="bg-[#121225]/85 border border-[#1f1f3a] rounded-2xl p-5 shadow-xl space-y-3.5">
      <h3 className="text-white font-extrabold text-xs tracking-wider flex items-center gap-2 uppercase">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
        </span>
        <Globe className="w-4 h-4 text-purple-400" />
        {lang === 'vi' ? 'Khám phá nguồn truyện raw (Trình duyệt)' : 'Browse Raw Web Sources (In-App Browser)'}
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {sources.map((site, idx) => (
          <button
            key={idx}
            onClick={() => openInBrowser?.(site.url)}
            className="flex flex-col items-center p-3 rounded-xl bg-[#0b0b14]/50 border border-[#1f1f3a] hover:border-purple-500/50 hover:bg-purple-950/10 active:scale-95 transition-all text-center group"
          >
            <div className={`w-8 h-8 rounded-full ${site.color} text-white flex items-center justify-center font-black text-xs mb-1.5 shadow-md group-hover:scale-110 transition-transform`}>
              {site.logo}
            </div>
            <span className="text-slate-200 font-bold text-[11px] group-hover:text-purple-300 transition-colors truncate max-w-full">{site.name}</span>
            <span className="text-slate-500 text-[8px] mt-0.5 font-medium truncate max-w-full">{site.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
