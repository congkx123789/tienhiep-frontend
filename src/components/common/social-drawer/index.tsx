import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import { Users, X, Search, Bell } from 'lucide-react';
import { SocialDrawerProps } from './SocialDrawer.types';
import { useSocialDrawer } from './useSocialDrawer';
import { FriendsTab } from './components/FriendsTab';
import { SearchFriendsTab } from './components/SearchFriendsTab';
import { NotificationsTab } from './components/NotificationsTab';
import { ChatWindow } from './components/ChatWindow';

export default function SocialDrawer({ isOpen, onClose, defaultTab }: SocialDrawerProps) {
  const { user } = useAuth();
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<'friends' | 'search' | 'notifications'>(defaultTab || 'friends');

  const {
    friendsList,
    personalNotifs,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    searchLoading,
    socialLoading,
    activeChatFriend,
    setActiveChatFriend,
    chatMessages,
    typedMessage,
    setTypedMessage,
    sendingMessage,
    chatBottomRef,
    unreadNotifsCount,
    totalUnreadMessages,
    handleSearchUsers,
    handleSendFriendRequest,
    handleRespondRequest,
    handleSendMessage,
    handleReadNotification,
  } = useSocialDrawer(user, lang);

  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
      if (defaultTab !== 'friends') {
        setActiveChatFriend(null);
      }
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-45 bg-black/60 backdrop-blur-sm"
      />

      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-96 bg-[#0c0d1e]/95 border-l border-purple-500/20 backdrop-blur-xl flex flex-col text-slate-100 shadow-2xl animate-slideOver">
        {/* Drawer Header */}
        <div className="p-4 border-b border-purple-500/10 flex items-center justify-between bg-[#0e1026]/90">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            <h3 className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-brand-300 to-purple-400 bg-clip-text text-transparent">
              {lang === 'vi' ? 'Thư Hữu & Bạn bè' : 'Book Friends'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        {!activeChatFriend && (
          <div className="flex border-b border-purple-500/10 bg-[#0e1026]/50 p-1 text-[11px] font-bold gap-1 shrink-0">
            <button 
              type="button"
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
                activeTab === 'friends' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Bạn bè' : 'Friends'}</span>
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-black px-0.5 shadow-md">
                  {totalUnreadMessages}
                </span>
              )}
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
                activeTab === 'search' ? 'bg-teal-600/30 text-teal-300 border border-teal-500/30 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Tìm bạn' : 'Find'}</span>
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
                activeTab === 'notifications' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Thông báo' : 'Notif'}</span>
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[8px] font-black px-0.5 shadow-md animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeChatFriend ? (
            <ChatWindow
              user={user}
              lang={lang}
              activeChatFriend={activeChatFriend}
              chatMessages={chatMessages}
              socialLoading={socialLoading}
              typedMessage={typedMessage}
              setTypedMessage={setTypedMessage}
              sendingMessage={sendingMessage}
              onSendMessage={handleSendMessage}
              onBackToList={() => setActiveChatFriend(null)}
              chatBottomRef={chatBottomRef}
              onClose={onClose}
            />
          ) : (
            <>
              {activeTab === 'friends' && (
                <FriendsTab
                  friendsList={friendsList}
                  lang={lang}
                  onSelectFriend={(f) => setActiveChatFriend(f)}
                />
              )}

              {activeTab === 'search' && (
                <SearchFriendsTab
                  lang={lang}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  searchResults={searchResults}
                  setSearchResults={setSearchResults}
                  searchLoading={searchLoading}
                  onSearchUsers={handleSearchUsers}
                  onSendRequest={handleSendFriendRequest}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsTab
                  personalNotifs={personalNotifs}
                  onReadNotification={handleReadNotification}
                  onRespondRequest={handleRespondRequest}
                  onClose={onClose}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export * from './SocialDrawer.types';
