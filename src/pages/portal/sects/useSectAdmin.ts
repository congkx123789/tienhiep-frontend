import { useState } from 'react';
import api from '../../../services';
import { SectRole, JoinRequest } from './Sects.types';

export function useSectAdmin(loadSectInfo: () => Promise<void>, showError: (msg: string) => void, showSuccess: (msg: string) => void) {
  const [editAnnouncement, setEditAnnouncement] = useState('');
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [joinRequestsList, setJoinRequestsList] = useState<JoinRequest[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const fetchJoinRequests = async () => {
    try {
      const res = await api.get('/api/sects/requests/list');
      if (res.data?.requests) setJoinRequestsList(res.data.requests);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAnnouncement = async () => {
    setAdminLoading(true);
    try {
      const res = await api.post('/api/sects/announcement', { announcement: editAnnouncement });
      if (res.data?.success) {
        showSuccess(res.data.message);
        setIsEditingAnnouncement(false);
        await loadSectInfo();
      }
    } catch (err: any) {
      showError(err.response?.data?.error || "Cập nhật thông cáo thất bại");
    } finally {
      setAdminLoading(false);
    }
  };

  const handlePromoteRank = async (targetUserId: number, newRole: SectRole) => {
    setAdminLoading(true);
    try {
      const res = await api.post('/api/sects/promote/rank', { user_id: targetUserId, role: newRole });
      if (res.data?.success) {
        showSuccess(res.data.message);
        await loadSectInfo();
      }
    } catch (err: any) {
      showError(err.response?.data?.error || "Thăng/Giáng chức thất bại");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleKickMember = async (userId: number, username: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn trục xuất đệ tử ${username} khỏi tông môn?`)) return;
    setAdminLoading(true);
    try {
      const res = await api.post('/api/sects/kick', { user_id: userId });
      if (res.data?.success) {
        showSuccess(res.data.message);
        await loadSectInfo();
      }
    } catch (err: any) {
      showError(err.response?.data?.error || "Trục xuất thất bại");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleRespondRequest = async (reqId: number, action: 'accept' | 'reject') => {
    setAdminLoading(true);
    try {
      const res = await api.post('/api/sects/requests/respond', { request_id: reqId, action });
      if (res.data?.success) {
        showSuccess(res.data.message);
        await fetchJoinRequests();
        await loadSectInfo();
      }
    } catch (err: any) {
      showError(err.response?.data?.error || "Xử lý yêu cầu thất bại");
    } finally {
      setAdminLoading(false);
    }
  };

  return {
    editAnnouncement,
    setEditAnnouncement,
    isEditingAnnouncement,
    setIsEditingAnnouncement,
    joinRequestsList,
    adminLoading,
    fetchJoinRequests,
    handleUpdateAnnouncement,
    handlePromoteRank,
    handleKickMember,
    handleRespondRequest
  };
}
