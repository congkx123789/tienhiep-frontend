import { ChevronLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { FriendItem } from '../Messages.types';

interface ChatHeaderProps {
  activeChatFriend: FriendItem;
  setActiveChatFriend: (f: FriendItem | null) => void;
}

export function ChatHeader({ activeChatFriend, setActiveChatFriend }: ChatHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-[#1f1f3a] flex items-center justify-between bg-[#0b0b14]/50 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setActiveChatFriend(null)}
          className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors md:hidden shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Friend Avatar */}
        {activeChatFriend.avatar ? (
          <img src={activeChatFriend.avatar} className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-purple-500/20" alt="avatar" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-brand-500 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-inner">
            {activeChatFriend.username[0].toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <span className="font-extrabold text-xs text-slate-200 block truncate">{activeChatFriend.username}</span>
          <span className="text-[9px] text-slate-500 block mt-0.5">Đang đàm đạo</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all" title="Gọi thoại (Giả lập)">
          <Phone className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all" title="Gọi video (Giả lập)">
          <Video className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
