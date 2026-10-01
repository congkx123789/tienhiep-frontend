import { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import api from '../../../services';
import { FriendItem, ChatMessage } from './Messages.types';

export function useMessages() {
  const { user } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();

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
      console.error('Lỗi khi tải danh sách bạn bè:', e);
    } finally {
      if (showLoading) setLoadingFriends(false);
    }
  };

  const fetchChatHistory = async (friendId: number | string, _showLoading = true) => {
    try {
      const res = await api.get(`/api/messages/chat/${friendId}`);
      if (res.data && res.data.messages) {
        setChatMessages(res.data.messages);
      }
    } catch (e) {
      console.error('Lỗi khi tải lịch sử tin nhắn:', e);
    }
  };

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

  useEffect(() => {
    if (activeChatFriend) {
      fetchChatHistory(activeChatFriend.id, true);
      setFriendsList(prev => prev.map(f => f.id === activeChatFriend.id ? { ...f, unread_messages: 0 } : f));

      chatPollRef.current = setInterval(() => {
        if (!document.hidden) {
          fetchChatHistory(activeChatFriend.id, false);
        }
      }, 5000);
    } else {
      setChatMessages([]);
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    }

    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [activeChatFriend]);

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

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!typedMessage.trim() || !activeChatFriend || !user) return;

    const msgText = typedMessage.trim();
    setTypedMessage('');
    setSendingMessage(true);

    const tempId = Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: activeChatFriend.id,
      message: msgText,
      created_at: new Date().toISOString(),
      is_read: 0
    };
    setChatMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await api.post('/api/messages/send', {
        receiver_id: activeChatFriend.id,
        message: msgText
      });
      if (res.data && res.data.success) {
        setChatMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: res.data.msg_id } : m));
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
