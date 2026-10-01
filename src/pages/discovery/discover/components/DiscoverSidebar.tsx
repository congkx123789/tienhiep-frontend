import React from 'react';
import { Award, MessageSquare } from 'lucide-react';
import { LeaderboardItem, CommentItem } from '../Discover.types';

interface DiscoverSidebarProps {
  leaderboard: LeaderboardItem[];
  communityComments: CommentItem[];
  lang: string;
}

export const DiscoverSidebar: React.FC<DiscoverSidebarProps> = ({
  leaderboard,
  communityComments,
  lang
}) => {
  return (
    <div className="space-y-6">
      {/* Leaderboard */}
      <div className="bg-[#121225]/60 border border-[#1f1f3a] rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-400" /> {lang === 'vi' ? 'BẢNG XẾP HẠNG HOT' : lang === 'en' ? 'HOT RANKINGS' : '热门排行'}
        </h3>

        {leaderboard.length > 0 ? (
          <div className="space-y-4">
            {leaderboard.map((novel, index) => (
              <div key={novel.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 shadow-md ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800' :
                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                    'bg-white/5 text-slate-400 border border-white/10'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{novel.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">✍ {novel.author}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] shrink-0 font-bold">
                  {novel.trend === 'up' && (
                    <span className="text-emerald-500 flex items-center">▲ {novel.diff}</span>
                  )}
                  {novel.trend === 'down' && (
                    <span className="text-red-500 flex items-center">▼ {novel.diff}</span>
                  )}
                  {novel.trend === 'none' && (
                    <span className="text-slate-500">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-xs text-center py-6">{lang === 'vi' ? 'Chưa có xếp hạng.' : lang === 'en' ? 'No rankings.' : '暂无排行'}</p>
        )}
      </div>

      {/* Community Activities */}
      <div className="bg-[#121225]/60 border border-[#1f1f3a]/85 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-purple-300 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-400" /> {lang === 'vi' ? 'Hoạt động cộng đồng' : lang === 'en' ? 'Community Activity' : '社区动态'}
        </h3>

        <div className="flex -space-x-2 overflow-hidden py-1 border-b border-white/5 pb-3">
          {communityComments.map(c => (
            <img
              key={c.id}
              className="inline-block h-6 w-6 rounded-full ring-2 ring-[#121225] object-cover"
              src={c.avatar}
              alt={c.user}
            />
          ))}
        </div>

        <div className="space-y-4">
          {communityComments.map((c) => {
            let badgeColor = 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400';
            if (c.source === 'Truyenchu') badgeColor = 'bg-sky-500/15 border-sky-500/35 text-sky-400';
            if (c.source === 'Nady knise') badgeColor = 'bg-purple-500/15 border-purple-500/35 text-purple-400';
            
            return (
              <div key={c.id} className="border-b border-white/5 pb-3.5 last:border-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 text-xs font-bold">{c.user}</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">{c.time}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase shrink-0 ${badgeColor}`}>
                    {c.source}
                  </span>
                  <p className="text-slate-300 text-xs leading-normal flex-1">
                    {c.comment}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
