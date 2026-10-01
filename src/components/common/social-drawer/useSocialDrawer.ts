import { useState, useEffect, useRef } from 'react';
import api from '../../../services';
import { FriendItem, NotifItem, ChatMessage, SearchUserItem } from './SocialDrawer.types';

export function useSocialDrawer(user: any, lang: string) {
  const [friendsList, setFriendsList] = useState<FriendItem[]>([]);
  const [personalNotifs, setPersonalNotifs] = useState<NotifItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  // Chat state
  const [activeChatFriend, setActiveChatFriend] = useState<FriendItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<any>(null);
  const notifPollRef = useRef<any>(null);

  const fetchFriends = async () => {
    try {
      const res = await api.get('/api/friends/list');
      if (res.data?.friends) {
        setFriendsList(res.data.friends);
      }
    } catch (e) {
      console.error("Failed to load friends", e);
    }
  };

  const fetchPersonalNotifs = async () => {
    try {
      const res = await api.get('/api/notifications/personal');
      if (res.data?.notifications) {
        setPersonalNotifs(res.data.notifications);
      }
    } catch (e) {
      console.error("Failed to load personal notifications", e);
    }
  };

  const fetchChatHistory = async (friendId: string | number, showLoading = true) => {
    try {
      if (showLoading && chatMessages.length === 0) setSocialLoading(true);
      const res = await api.get(`/api/messages/chat/${friendId}`);
      if (res.data?.messages) {
        setChatMessages(res.data.messages);
        fetchFriends();
      }
    } catch (e) {
      console.error("Failed to fetch chat history", e);
    } finally {
      setSocialLoading(false);
    }
  };

  // Poll notifications
  useEffect(() => {
    if (!user) return;
    fetchPersonalNotifs();
    fetchFriends();
    
    notifPollRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchPersonalNotifs();
      }
    }, 20000);

    return () => clearInterval(notifPollRef.current);
  }, [user]);

  // Handle active chat polling
  useEffect(() => {
    if (activeChatFriend) {
      fetchChatHistory(activeChatFriend.id);
      chatPollRef.current = setInterval(() => {
        if (!document.hidden) {
          fetchChatHistory(activeChatFriend.id, false);
        }
      }, 5000);
    } else {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    }

    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [activeChatFriend]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [chatMessages]);

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await api.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.data?.users) {
        setSearchResults(res.data.users);
      }
    } catch (e) {
      console.error("User search failed", e);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendFriendRequest = async (targetQuery: string) => {
    try {
      const res = await api.post('/api/friends/request', { friend_username: targetQuery });
      if (res.data?.success) {
        alert(lang === 'vi' ? `Đã gửi lời mời kết bạn tới ${res.data.to_user || targetQuery}!` : `Friend request sent!`);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (e: any) {
      alert(e.response?.data?.error || "Gửi lời mời thất bại");
    }
  };

  const handleRespondRequest = async (senderId: string | number, action: 'accept' | 'reject') => {
    try {
      const res = await api.post('/api/friends/respond', { sender_id: senderId, action });
      if (res.data?.success) {
        fetchPersonalNotifs();
        fetchFriends();
      }
    } catch (e) {
      alert("Xử lý thất bại");
    }
  };

  const handleSendMessage = async () => {
    if (!typedMessage.trim() || !activeChatFriend || !user) return;
    setSendingMessage(true);
    try {
      const res = await api.post('/api/messages/send', {
        receiver_id: activeChatFriend.id,
        message: typedMessage.trim(),
      });
      if (res.data?.success) {
        const newMsg: ChatMessage = {
          id: res.data.msg_id,
          sender_id: user.id,
          receiver_id: activeChatFriend.id,
          message: typedMessage.trim(),
          created_at: new Date().toISOString(),
        };
        setChatMessages(prev => [...prev, newMsg]);
        setTypedMessage('');
      }
    } catch (e) {
      console.error("Failed to send message", e);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReadNotification = async (notifId: string | number) => {
    try {
      await api.post('/api/notifications/personal/read', { notification_id: notifId });
      fetchPersonalNotifs();
    } catch (e) {
      console.error("Failed to read notification", e);
    }
  };

  const unreadNotifsCount = personalNotifs.filter(n => !n.is_read).length;
  const totalUnreadMessages = friendsList.reduce((acc, cur) => acc + (cur.unread_messages || 0), 0);

  return {
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
  };
}
