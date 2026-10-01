import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader, Share2, BookOpen, Send } from 'lucide-react';
import { FriendItem, ChatMessage } from '../SocialDrawer.types';

interface ChatWindowProps {
  user: any;
  lang: string;
  activeChatFriend: FriendItem;
  chatMessages: ChatMessage[];
  socialLoading: boolean;
  typedMessage: string;
  setTypedMessage: (text: string) => void;
  sendingMessage: boolean;
  onSendMessage: () => void;
  onBackToList: () => void;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  user,
  lang,
  activeChatFriend,
  chatMessages,
  socialLoading,
  typedMessage,
  setTypedMessage,
  sendingMessage,
  onSendMessage,
  onBackToList,
  chatBottomRef,
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      {/* Back to list header */}
      <div className="flex items-center gap-2 border-b border-purple-500/10 pb-3 mb-3 shrink-0">
        <button 
          type="button"
          onClick={onBackToList}
          className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          {activeChatFriend.avatar ? (
            <img src={activeChatFriend.avatar} className="w-7 h-7 rounded-full object-cover shrink-0" alt="avatar" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center font-black text-[10px] text-white shrink-0">
              {activeChatFriend.username[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="font-extrabold text-xs text-slate-200">{activeChatFriend.username}</h4>
            <p className="text-[9px] text-slate-500">Đang trò chuyện</p>
          </div>
        </div>
      </div>

      {/* Chat messages stream */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4 select-text">
        {socialLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="text-center py-20 text-xs text-slate-600">
            Chưa có tin nhắn nào. Hãy gửi lời chào!
          </div>
        ) : (
          chatMessages.map((msg, i) => {
            const isSelf = msg.sender_id === user?.id;
            const isShare = msg.message && (msg.message.includes("[Chia sẻ truyện]") || msg.message.includes("/book/"));
            
            let shareData: { title: string; bookId?: string; note?: string } | null = null;
            if (isShare) {
              const msgText = msg.message || "";
              let title = "Truyện được chia sẻ";
              const titleMatch = msgText.match(/\[Chia sẻ truyện\]\s*['"“](.*?)['"”]/i) || msgText.match(/\[Chia sẻ truyện\]\s*(.*?)(?:\s*-\s*Xem|\s*\n|$)/i);
              if (titleMatch?.[1]) {
                title = titleMatch[1].trim();
              } else {
                const firstPart = msgText.split(' - ')[0].replace('[Chia sẻ truyện]', '').replace(/['"]/g, '').trim();
                if (firstPart) title = firstPart;
              }

              let bookId = "";
              const idMatch = msgText.match(/\/book\/([a-zA-Z0-9_\-]+)/);
              if (idMatch?.[1]) {
                bookId = idMatch[1].trim();
              }

              let note = "";
              const noteMatch = msgText.match(/Lời nhắn:\s*["“']?(.*?)["”']?$/im);
              if (noteMatch?.[1]) {
                note = noteMatch[1].trim();
              }

              shareData = { title, bookId, note };
            }

            return (
              <div key={msg.id || i} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border ${
                  isSelf 
                    ? 'bg-purple-600/20 border-purple-500/30 text-purple-200 rounded-tr-none' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 rounded-tl-none'
                }`}>
                  {shareData ? (
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        {lang === 'vi' ? 'Truyện được chia sẻ' : 'Shared novel'}
                      </span>
                      <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1.5">
                        <p className="font-extrabold text-white text-xs leading-snug">{shareData.title}</p>
                        {shareData.note && (
                          <p className="text-[11px] text-slate-300 italic bg-white/5 p-1.5 rounded-lg border border-white/5">
                            "{shareData.note}"
                          </p>
                        )}
                      </div>
                      {shareData.bookId && (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/book/${shareData!.bookId}`);
                            onClose();
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-[11px] rounded-xl shadow-md transition-all active:scale-95"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{lang === 'vi' ? 'Mở đọc ngay' : 'Read now'}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.message}</span>
                  )}
                  <span className="block text-[8px] text-slate-500 text-right mt-1.5">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef as any} />
      </div>

      {/* Message inputs */}
      <div className="flex gap-2 border-t border-purple-500/10 pt-3 shrink-0">
        <input 
          type="text" 
          placeholder="Nhập tin nhắn..."
          value={typedMessage}
          onChange={(e) => setTypedMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
          className="flex-1 px-3 py-2 bg-[#080814] border border-purple-500/20 rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
        />
        <button 
          type="button"
          onClick={onSendMessage}
          disabled={sendingMessage || !typedMessage.trim()}
          className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
