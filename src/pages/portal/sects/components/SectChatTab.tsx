import React from 'react';
import { MessageSquare, Users, Send, Plus, MessageCircle } from 'lucide-react';
import { ChatMessage, SubGroup, ROLE_LABELS, SectRole } from '../Sects.types';

interface SectChatTabProps {
  chatType: 'general' | 'group' | 'direct';
  setChatType: (t: 'general' | 'group' | 'direct') => void;
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number | null) => void;
  selectedDirectUser: any;
  setSelectedDirectUser: (u: any) => void;
  chatMessages: ChatMessage[];
  typedMessage: string;
  setTypedMessage: (val: string) => void;
  sendingMessage: boolean;
  subGroups: SubGroup[];
  members: any[];
  myUserId?: number | string;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  onSendChat: (e: React.FormEvent) => void;
  onOpenCreateGroupModal: () => void;
}

export const SectChatTab: React.FC<SectChatTabProps> = ({
  chatType,
  setChatType,
  selectedGroupId,
  setSelectedGroupId,
  selectedDirectUser,
  setSelectedDirectUser,
  chatMessages,
  typedMessage,
  setTypedMessage,
  sendingMessage,
  subGroups,
  members,
  myUserId,
  chatBottomRef,
  onSendChat,
  onOpenCreateGroupModal
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[600px] bg-[#121225]/80 border border-[#1f1f3a] rounded-3xl overflow-hidden shadow-2xl">
      {/* Channels Sidebar */}
      <div className="md:col-span-1 border-r border-white/5 p-4 space-y-4 overflow-y-auto bg-[#0e0e1f]/60">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">Kênh Chính</span>
          <button
            onClick={() => { setChatType('general'); setSelectedGroupId(null); setSelectedDirectUser(null); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              chatType === 'general' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="truncate">Đại Điện Tông Môn</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nhóm Nhỏ ({subGroups?.length || 0})</span>
            <button onClick={onOpenCreateGroupModal} className="p-1 text-purple-400 hover:text-purple-300" title="Tạo nhóm nhỏ">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {subGroups?.map((g) => (
              <button
                key={g.id}
                onClick={() => { setChatType('group'); setSelectedGroupId(g.id); setSelectedDirectUser(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  chatType === 'group' && selectedGroupId === g.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{g.name}</span>
                </div>
                <span className="text-[10px] opacity-60 font-normal">{g.members_count}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">Đệ Tử Khác</span>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {members?.filter(m => m.user_id !== myUserId).map((m) => (
              <button
                key={m.user_id}
                onClick={() => { setChatType('direct'); setSelectedDirectUser(m); setSelectedGroupId(null); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  chatType === 'direct' && selectedDirectUser?.user_id === m.user_id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-200 flex items-center justify-center text-[10px] font-black shrink-0">
                  {m.username?.[0]?.toUpperCase()}
                </div>
                <span className="truncate">{m.display_name || m.username}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Stream & Input */}
      <div className="md:col-span-3 flex flex-col justify-between h-full bg-[#0a0a14]/60">
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {chatMessages?.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-xs">
              Chưa có đạo hữu nào truyền tin ở kênh này. Hãy bắt đầu cuộc trò chuyện!
            </div>
          ) : (
            chatMessages?.map((msg) => {
              const isMe = msg.user_id === myUserId;
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-7 h-7 rounded-full bg-purple-600/40 text-purple-200 flex items-center justify-center text-xs font-bold shrink-0">
                    {msg.username?.[0]?.toUpperCase()}
                  </div>
                  <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="font-bold text-slate-300">{msg.username}</span>
                      {msg.role && (
                        <span className="text-[9px] px-1 rounded bg-purple-500/10 text-purple-300 font-bold">
                          {ROLE_LABELS[msg.role as SectRole] || msg.role}
                        </span>
                      )}
                    </div>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-[#15152e] text-slate-200 border border-white/5 rounded-tl-none'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef as any} />
        </div>

        <form onSubmit={onSendChat} className="p-3 border-t border-white/5 bg-[#0f0f20] flex gap-2">
          <input
            type="text"
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            placeholder="Truyền âm nhập mật..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#080812] border border-[#1f1f3a] text-white text-xs outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={sendingMessage || !typedMessage.trim()}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
