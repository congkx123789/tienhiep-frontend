import MainLayout from '../../../layouts/main';
import { useMessages } from './useMessages';
import { FriendsSidebar } from './components/FriendsSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessageBubble } from './components/ChatMessageBubble';
import { ChatInputForm } from './components/ChatInputForm';

export default function Messages() {
  const m = useMessages();
  const isGlobal = m.activeChannel === 'global';

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-10 h-[calc(100vh-80px)] flex flex-col">
        {/* Chat Main Shell */}
        <div className="flex-1 bg-[#121225]/80 border border-[#1f1f3a] rounded-3xl overflow-hidden flex shadow-2xl backdrop-blur-xl">
          {/* LEFT SIDEBAR: Friend list & Global Channel */}
          <FriendsSidebar
            activeChannel={m.activeChannel}
            onSelectGlobal={m.selectGlobalChannel}
            friendsList={m.friendsList}
            filteredFriends={m.filteredFriends}
            activeChatFriend={m.activeChatFriend}
            setActiveChatFriend={m.selectFriend}
            searchQuery={m.searchQuery}
            setSearchQuery={m.setSearchQuery}
            loadingFriends={m.loadingFriends}
            lang={m.lang}
          />

          {/* RIGHT VIEW: Active chat window */}
          <div
            className={`flex-1 flex flex-col bg-[#080814]/30 ${
              !m.activeChatFriend && !isGlobal ? 'hidden md:flex' : 'flex'
            }`}
          >
            <ChatHeader
              activeChannel={m.activeChannel}
              activeChatFriend={m.activeChatFriend}
              setActiveChatFriend={m.setActiveChatFriend}
              onBackToSidebar={m.selectGlobalChannel}
            />

            {/* Messages stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar select-text bg-gradient-to-b from-[#080814]/10 to-[#0b0b14]/40">
              {m.chatMessages.length === 0 ? (
                <div className="text-center py-20 text-xs text-slate-500 space-y-1">
                  <p className="font-bold text-slate-400">
                    {isGlobal
                      ? 'Chưa có truyền âm nào trên Kênh Thế Giới.'
                      : `Hãy gửi lời chào đầu tiên tới ${m.activeChatFriend?.username}!`}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {isGlobal
                      ? 'Hãy là người đầu tiên mở lời đàm đạo với toàn thể tu sĩ trong hệ thống!'
                      : 'Bắt đầu cuộc trò chuyện riêng tư mật ngữ ngay bây giờ.'}
                  </p>
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
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
