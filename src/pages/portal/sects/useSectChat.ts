import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services';
import { ChatMessage, SubGroup } from './Sects.types';

export function useSectChat(inSect: boolean, activeSubTab: string, user: any, showError: (msg: string) => void, showSuccess: (msg: string) => void) {
  const [chatType, setChatType] = useState<'general' | 'group' | 'direct'>('general');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedDirectUser, setSelectedDirectUser] = useState<any>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const [subGroups, setSubGroups] = useState<SubGroup[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<number[]>([]);

  const [showGroupSettingsModal, setShowGroupSettingsModal] = useState(false);
  const [activeGroupDetail, setActiveGroupDetail] = useState<any>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  const fetchSubGroups = useCallback(async () => {
    try {
      const res = await api.get('/api/sects/chat/groups');
      if (res.data?.groups) setSubGroups(res.data.groups);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchChatHistory = useCallback(async () => {
    try {
      const params: any = { chat_type: chatType };
      if (chatType === 'group' && selectedGroupId) {
        params.group_id = selectedGroupId;
      } else if (chatType === 'direct' && selectedDirectUser) {
        params.target_id = selectedDirectUser.user_id || selectedDirectUser.id;
      } else if (chatType !== 'general') {
        return;
      }

      const res = await api.get('/api/sects/chat/history', { params });
      if (res.data?.messages) {
        setChatMessages(res.data.messages);
      }
    } catch (e) {
      console.error(e);
    }
  }, [chatType, selectedGroupId, selectedDirectUser]);

  useEffect(() => {
    if (inSect && activeSubTab === 'chat') {
      fetchSubGroups();
      fetchChatHistory();
      pollRef.current = setInterval(() => {
        if (!document.hidden) fetchChatHistory();
      }, 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [inSect, activeSubTab, chatType, selectedGroupId, selectedDirectUser, fetchChatHistory, fetchSubGroups]);

  useEffect(() => {
    if (activeSubTab === 'chat' && chatBottomRef.current) {
      const parent = chatBottomRef.current.parentElement;
      if (parent) {
        parent.scrollTo({
          top: parent.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [chatMessages, activeSubTab]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    const msgText = typedMessage.trim();
    setTypedMessage('');
    setSendingMessage(true);

    try {
      const body: any = { message: msgText, chat_type: chatType };
      if (chatType === 'group') body.group_id = selectedGroupId;
      if (chatType === 'direct') body.target_id = selectedDirectUser.user_id || selectedDirectUser.id;

      await api.post('/api/sects/chat/send', body);
      await fetchChatHistory();
    } catch {
      showError("Gửi tin nhắn thất bại");
      setTypedMessage(msgText);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateSubGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedGroupMembers.length === 0) return;
    try {
      const res = await api.post('/api/sects/chat/groups/create', {
        name: newGroupName.trim(),
        members: [user.id, ...selectedGroupMembers]
      });
      if (res.data?.group_id) {
        showSuccess(`Nhóm chat '${newGroupName}' được thành lập!`);
        setShowCreateGroupModal(false);
        setNewGroupName('');
        setSelectedGroupMembers([]);
        await fetchSubGroups();
        setChatType('group');
        setSelectedGroupId(res.data.group_id);
      }
    } catch (err: any) {
      showError(err.response?.data?.error || "Không thể tạo nhóm chat nhỏ");
    }
  };

  return {
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
    showCreateGroupModal,
    setShowCreateGroupModal,
    newGroupName,
    setNewGroupName,
    selectedGroupMembers,
    setSelectedGroupMembers,
    showGroupSettingsModal,
    setShowGroupSettingsModal,
    activeGroupDetail,
    setActiveGroupDetail,
    chatBottomRef,
    handleSendChat,
    handleCreateSubGroup,
    fetchSubGroups,
    fetchChatHistory
  };
}
