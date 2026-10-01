import MainLayout from '../../../layouts/main';
import { MessageSquare } from 'lucide-react';
import { useMessages } from './useMessages';
import { FriendsSidebar } from './components/FriendsSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessageBubble } from './components/ChatMessageBubble';
import { ChatInputForm } from './components/ChatInputForm';

export default function Messages() {
  const m = useMessages();

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-10 h-[calc(100vh-80px)] flex flex-col">
        {/* Chat Main Shell */}
        <div className="flex-1 bg-[#121225]/80 border border-[#1f1f3a] rounded-3xl overflow-hidden flex shadow-2xl backdrop-blur-xl">
          {/* LEFT SIDEBAR: Friend list */}
          <FriendsSidebar
            friendsList={m.friendsList}
            filteredFriends={m.filteredFriends}
            activeChatFriend={m.activeChatFriend}
            setActiveChatFriend={m.setActiveChatFriend}
            searchQuery={m.searchQuery}
            setSearchQuery={m.setSearchQuery}
            loadingFriends={m.loadingFriends}
            lang={m.lang}
          />

          {/* RIGHT VIEW: Active chat window */}
          <div
            className={`flex-1 flex flex-col bg-[#080814]/30 ${
              !m.activeChatFriend ? 'hidden md:flex' : 'flex'
            }`}
          >
            {m.activeChatFriend ? (
              <>
                <ChatHeader
                  activeChatFriend={m.activeChatFriend}
                  setActiveChatFriend={m.setActiveChatFriend}
                />

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar select-text bg-gradient-to-b from-[#080814]/10 to-[#0b0b14]/40">
                  {m.chatMessages.length === 0 ? (
                    <div className="text-center py-20 text-xs text-slate-600">
                      Hãy gửi lời chào đầu tiên tới {m.activeChatFriend.username}!
                    </div>
                  ) : (
                    m.chatMessages.map((msg, idx) => (
                      <ChatMessageBubble
                        key={msg.id || idx}
                        msg={msg}
                        isMe={msg.sender_id === m.user?.id}
                        lang={m.lang}
                      />
                    ))
                  )}
                  <div ref={m.chatBottomRef} />
                </div>

                <ChatInputForm
                  typedMessage={m.typedMessage}
                  setTypedMessage={m.setTypedMessage}
                  sendingMessage={m.sendingMessage}
                  handleSendMessage={m.handleSendMessage}
                />
              </>
            ) : (
              /* Empty state placeholder */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
                <div className="w-20 h-20 bg-gradient-to-tr from-purple-600/20 to-brand-500/20 rounded-full flex items-center justify-center text-purple-400 shadow-xl mb-4 border border-purple-500/10 animate-pulse">
                  <MessageSquare className="w-9 h-9" />
                </div>
                <h3 className="font-extrabold text-base text-slate-200">Kính chào Thư hữu!</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                  Hãy chọn một người bạn từ danh sách đàm đạo ở cột bên trái để bắt đầu nhắn tin và chia sẻ các tác phẩm truyện dịch AI tâm đắc.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
