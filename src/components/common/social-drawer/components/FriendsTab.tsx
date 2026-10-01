import React from 'react';
import { MessageSquare } from 'lucide-react';
import { FriendItem } from '../SocialDrawer.types';

interface FriendsTabProps {
  friendsList: FriendItem[];
  lang: string;
  onSelectFriend: (friend: FriendItem) => void;
}

export const FriendsTab: React.FC<FriendsTabProps> = ({
  friendsList,
  lang,
  onSelectFriend,
}) => {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-purple-400">
        {lang === 'vi' ? 'Danh sách bạn bè' : 'Friends list'} ({friendsList.length})
      </h4>
      {friendsList.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-purple-500/10 rounded-2xl text-xs text-slate-500 bg-purple-950/5">
          {lang === 'vi' ? 'Chưa có bạn bè nào. Hãy sang tab "Tìm bạn" để kết nối!' : 'No friends yet. Go to "Find" tab to search!'}
        </div>
      ) : (
        <div className="grid gap-2.5">
          {friendsList.map(f => (
            <div 
              key={f.id} 
              onClick={() => onSelectFriend(f)}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-950/10 to-indigo-950/10 hover:from-purple-900/25 hover:to-indigo-900/25 border border-purple-500/15 hover:border-purple-500/40 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] shadow-md gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {f.avatar ? (
                  <img src={f.avatar} className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-purple-500/20" alt="avatar" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center font-black text-xs text-white shrink-0 shadow-inner">
                    {f.username[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-200 block truncate">{f.username}</span>
                  {f.user_code && (
                    <span className="text-[9px] text-purple-400/70 font-mono block mt-0.5">#{f.user_code}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(f.unread_messages || 0) > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[9px] font-black min-w-[18px] text-center animate-pulse shadow-md">
                    {f.unread_messages}
                  </span>
                )}
                <div className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg text-purple-400 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
