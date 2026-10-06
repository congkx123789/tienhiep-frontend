import { MessageSquare, Search, Globe, Users } from 'lucide-react';
import { FriendItem, ChatChannel } from '../Messages.types';

interface FriendsSidebarProps {
  activeChannel: ChatChannel;
  onSelectGlobal: () => void;
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
  activeChannel,
  onSelectGlobal,
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
          {lang === 'vi' ? 'Hộp thư đàm đạo' : 'Messages & Community'}
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

      {/* Stream */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
        {/* KÊNH TRUYỀN ÂM THẾ GIỚI (GLOBAL CHAT TOÀN SERVER) */}
        <div
          onClick={onSelectGlobal}
          className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
            activeChannel === 'global'
              ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/40 text-white shadow-lg shadow-purple-600/10'
              : 'bg-[#121225]/40 hover:bg-white/[0.04] border border-[#1f1f3a] text-slate-300'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs text-white truncate">Truyền Âm Thế Giới</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[8px] font-black uppercase shrink-0">
                  Toàn Server
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                Đàm đạo chung tất cả tu sĩ
              </p>
            </div>
          </div>
        </div>

        {/* PHÂN ĐOÀN MẬT NGỮ 1-1 */}
        <div className="px-2 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> Mật Ngữ Đạo Hữu (1-1)
          </span>
          <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded-md text-slate-400">
            {filteredFriends.length}
          </span>
        </div>

        {loadingFriends && friendsList.length === 0 ? (
          <div className="flex justify-center items-center py-10 text-xs text-slate-500 gap-2">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Đang tải bạn hữu...
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-600">
            {searchQuery ? 'Không tìm thấy bạn hữu nào' : 'Chưa có bạn hữu nào trong danh bạ'}
          </div>
        ) : (
          filteredFriends.map((f) => {
            const isActive = activeChannel === 'direct' && activeChatFriend?.id === f.id;
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
                  </div>

                  <div className="min-w-0">
                    <span className="font-extrabold text-xs block truncate">{f.username}</span>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                      {f.user_code ? `#${f.user_code}` : 'Đạo hữu'}
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
