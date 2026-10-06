import { ChevronLeft, Phone, Video, MoreVertical, Globe } from 'lucide-react';
import { FriendItem, ChatChannel } from '../Messages.types';

interface ChatHeaderProps {
  activeChannel: ChatChannel;
  activeChatFriend: FriendItem | null;
  setActiveChatFriend: (f: FriendItem | null) => void;
  onBackToSidebar?: () => void;
}

export function ChatHeader({
  activeChannel,
  activeChatFriend,
  setActiveChatFriend,
  onBackToSidebar,
}: ChatHeaderProps) {
  const isGlobal = activeChannel === 'global' || !activeChatFriend;

  return (
    <div className="px-4 py-3 border-b border-[#1f1f3a] flex items-center justify-between bg-[#0b0b14]/50 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => {
            setActiveChatFriend(null);
            if (onBackToSidebar) onBackToSidebar();
          }}
          className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors md:hidden shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {isGlobal ? (
          <>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-white block truncate">
                  Truyền Âm Thế Giới
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[8px] font-black rounded-full uppercase">
                  Toàn Server
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5 truncate">
                Mọi người trong server đều có thể trò chuyện tại đây
              </span>
            </div>
          </>
        ) : (
          <>
            {activeChatFriend.avatar ? (
              <img src={activeChatFriend.avatar} className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-purple-500/20" alt="avatar" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-brand-500 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-inner">
                {activeChatFriend.username[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="font-extrabold text-xs text-slate-200 block truncate">{activeChatFriend.username}</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                {activeChatFriend.user_code ? `#${activeChatFriend.user_code}` : 'Mật ngữ 1-1'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!isGlobal && activeChatFriend && (
          <>
            <button 
              type="button"
              onClick={() => alert(`Đang khởi tạo kết nối âm thanh thoại đàm đạo với ${activeChatFriend.username}...`)}
              className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer" 
              title="Gọi thoại đàm đạo"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => alert(`Đang kiểm tra camera và kết nối cuộc gọi video với ${activeChatFriend.username}...`)}
              className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer" 
              title="Gọi video trực tiếp"
            >
              <Video className="w-4 h-4" />
            </button>
          </>
        )}
        <button 
          type="button"
          onClick={() => alert(isGlobal ? 'Kênh Thế Giới: Bất kỳ ai gửi tin nhắn, toàn bộ người dùng đang online trên server đều nhìn thấy tức thì.' : `Mật ngữ 1-1 riêng tư với ${activeChatFriend?.username}.`)}
          className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
          title="Thông tin kênh"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
