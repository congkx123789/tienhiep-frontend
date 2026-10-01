import { MessageSquare, Search } from 'lucide-react';
import { FriendItem } from '../Messages.types';

interface FriendsSidebarProps {
  friendsList: FriendItem[];
  filteredFriends: FriendItem[];
  activeChatFriend: FriendItem | null;
  setActiveChatFriend: (f: FriendItem) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  loadingFriends: boolean;
  lang: string;
}

export function FriendsSidebar({
  friendsList,
  filteredFriends,
  activeChatFriend,
  setActiveChatFriend,
  searchQuery,
  setSearchQuery,
  loadingFriends,
  lang,
}: FriendsSidebarProps) {
  return (
    <div
      className={`w-full md:w-80 border-r border-[#1f1f3a] flex flex-col bg-[#0b0b14]/50 ${
        activeChatFriend ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#1f1f3a] space-y-3 shrink-0">
        <h3 className="text-sm font-black tracking-wider text-slate-100 uppercase flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          {lang === 'vi' ? 'Hộp thư đàm đạo' : 'Direct Messages'}
        </h3>

        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder={lang === 'vi' ? 'Tìm bạn hữu...' : 'Search friends...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#05050a] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors placeholder-slate-600"
          />
        </div>
      </div>

      {/* Friends list stream */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
        {loadingFriends && friendsList.length === 0 ? (
          <div className="flex justify-center items-center py-20 text-xs text-slate-500 gap-2">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Đang tải bạn hữu...
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-20 text-xs text-slate-600">
            {searchQuery ? 'Không tìm thấy bạn hữu nào' : 'Chưa có bạn hữu nào'}
          </div>
        ) : (
          filteredFriends.map((f) => {
            const isActive = activeChatFriend?.id === f.id;
            return (
              <div
                key={f.id}
                onClick={() => setActiveChatFriend(f)}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                  isActive
                    ? 'bg-purple-600/20 border border-purple-500/30 text-white'
                    : 'hover:bg-purple-950/10 border border-transparent hover:border-[#1f1f3a] text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {f.avatar ? (
                      <img src={f.avatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/20" alt="avatar" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-brand-500 flex items-center justify-center font-black text-sm text-white shadow-inner">
                        {f.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0c0d1e]" />
                  </div>

                  <div className="min-w-0">
                    <span className="font-extrabold text-xs block truncate">{f.username}</span>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                      {f.user_code ? `#${f.user_code}` : 'Đang trực tuyến'}
                    </span>
                  </div>
                </div>

                {f.unread_messages > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[9px] font-black min-w-[18px] text-center animate-pulse shadow-md">
                    {f.unread_messages}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
