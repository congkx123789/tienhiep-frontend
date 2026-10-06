import { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import api from '../../../services';
import { FriendItem, ChatMessage, ChatChannel } from './Messages.types';

export function useMessages() {
  const { user } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();

  const [activeChannel, setActiveChannel] = useState<ChatChannel>('global');
  const [friendsList, setFriendsList] = useState<FriendItem[]>([]);
  const [activeChatFriend, setActiveChatFriend] = useState<FriendItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const friendsPollRef = useRef<any>(null);
  const chatPollRef = useRef<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchFriends = async (showLoading = true) => {
    if (showLoading) setLoadingFriends(true);
    try {
      const res = await api.get('/api/friends/list');
      if (res.data && res.data.friends) {
        setFriendsList(res.data.friends);
      }
    } catch (e) {
      console.error('Lỗi khi tải danh sách đạo hữu:', e);
    } finally {
      if (showLoading) setLoadingFriends(false);
    }
  };

  const fetchGlobalMessages = async (_showLoading = false) => {
    try {
      const res = await api.get('/api/messages/global?limit=50');
      if (res.data && res.data.messages) {
        setChatMessages(res.data.messages);
      }
    } catch (e) {
      console.error('Lỗi khi tải kênh thế giới:', e);
    }
  };

  const fetchChatHistory = async (friendId: number | string, _showLoading = false) => {
    try {
      const res = await api.get(`/api/messages/chat/${friendId}`);
      if (res.data && res.data.messages) {
        setChatMessages(res.data.messages);
      }
    } catch (e) {
      console.error('Lỗi khi tải lịch sử tin nhắn:', e);
    }
  };

  // Nạp danh sách bạn bè định kỳ
  useEffect(() => {
    if (!user) return;
    fetchFriends(true);

    friendsPollRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchFriends(false);
      }
    }, 15000);

    return () => {
      if (friendsPollRef.current) clearInterval(friendsPollRef.current);
    };
  }, [user]);

  // Luồng đồng bộ tin nhắn theo Kênh hoạt động (Kênh Thế Giới hoặc Kênh 1-1)
  useEffect(() => {
    if (!user) return;

    if (activeChannel === 'global') {
      fetchGlobalMessages(true);
      chatPollRef.current = setInterval(() => {
        if (!document.hidden) {
          fetchGlobalMessages(false);
        }
      }, 3500);
    } else if (activeChannel === 'direct' && activeChatFriend) {
      fetchChatHistory(activeChatFriend.id, true);
      setFriendsList(prev => prev.map(f => f.id === activeChatFriend.id ? { ...f, unread_messages: 0 } : f));

      chatPollRef.current = setInterval(() => {
        if (!document.hidden) {
          fetchChatHistory(activeChatFriend.id, false);
        }
      }, 4000);
    } else {
      setChatMessages([]);
    }

    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [activeChannel, activeChatFriend, user]);

  // Tự động cuộn xuống đáy khi có tin nhắn mới
  useEffect(() => {
    if (chatBottomRef.current) {
      const parent = chatBottomRef.current.parentElement;
      if (parent) {
        parent.scrollTo({
          top: parent.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [chatMessages]);

  const selectGlobalChannel = () => {
    setActiveChannel('global');
    setActiveChatFriend(null);
  };

  const selectFriend = (friend: FriendItem) => {
    setActiveChannel('direct');
    setActiveChatFriend(friend);
  };

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!typedMessage.trim() || !user) return;

    const msgText = typedMessage.trim();
    setTypedMessage('');
    setSendingMessage(true);

    const tempId = Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender_id: user.id,
      sender_name: user.username,
      sender_avatar: user.avatar,
      receiver_id: activeChannel === 'direct' && activeChatFriend ? activeChatFriend.id : 0,
      message: msgText,
      created_at: new Date().toISOString(),
      is_read: 0,
      vip_status: user.vip_status || 0,
    };
    setChatMessages(prev => [...prev, optimisticMsg]);

    try {
      if (activeChannel === 'global') {
        const res = await api.post('/api/messages/global', { message: msgText });
        if (res.data && res.data.success && res.data.message) {
          setChatMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: res.data.message.id } : m));
        }
      } else if (activeChannel === 'direct' && activeChatFriend) {
        const res = await api.post('/api/messages/send', {
          receiver_id: activeChatFriend.id,
          message: msgText
        });
        if (res.data && res.data.success) {
          setChatMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: res.data.msg_id } : m));
        }
      }
    } catch (err) {
      console.error('Gửi tin nhắn thất bại:', err);
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
      setTypedMessage(msgText);
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredFriends = friendsList.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    user,
    lang,
    activeChannel,
    setActiveChannel,
    selectGlobalChannel,
    selectFriend,
    friendsList,
    filteredFriends,
    activeChatFriend,
    setActiveChatFriend,
    chatMessages,
    typedMessage,
    setTypedMessage,
    sendingMessage,
    searchQuery,
    setSearchQuery,
    loadingFriends,
    chatBottomRef,
    handleSendMessage,
    navigate,
  };
}
