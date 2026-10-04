import { useState, useEffect, useCallback } from 'react';
import api from '../../../services';
import { SectItem } from './Sects.types';

export function useSectData(activeSubTab: string) {
  const [inSect, setInSect] = useState(false);
  const [mySectData, setMySectData] = useState<any>(null);
  const [sectsList, setSectsList] = useState<SectItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectDetail, setSelectedSectDetail] = useState<any>(null);
  const [showSectDetailModal, setShowSectDetailModal] = useState(false);

  const [createName, setCreateName] = useState('');
  const [createSlogan, setCreateSlogan] = useState('');
  const [createBadge, setCreateBadge] = useState('purple');
  const [contribAmount, setContribAmount] = useState(50);

  const [sectBooksList, setSectBooksList] = useState<any[]>([]);
  const [userBookshelf, setUserBookshelf] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const fetchSectLibrary = async () => {
    try {
      const res = await api.get('/api/sects/library/list');
      if (res.data?.books) setSectBooksList(res.data.books);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUserBookshelf = async () => {
    try {
      const res = await api.get('/api/bookshelf');
      if (res.data) setUserBookshelf(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = useCallback(async () => {
    try {
      const res = await api.get('/api/sects/search', { params: { q: searchQuery } });
      if (res.data?.sects) setSectsList(res.data.sects);
      const listRes = await api.get('/api/sects/list');
      if (listRes.data?.pending_requests) setPendingRequests(listRes.data.pending_requests);
    } catch (err) {
      console.error("Lỗi tìm kiếm tông môn:", err);
    }
  }, [searchQuery]);

  const loadSectInfo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sects/my-sect');
      if (res.data?.in_sect) {
        setInSect(true);
        setMySectData(res.data);
        if (activeSubTab === 'library') fetchSectLibrary();
      } else {
        setInSect(false);
        setMySectData(null);
        handleSearch();
      }
    } catch (e) {
      console.error("Lỗi khi tải thông tin Tông môn:", e);
    } finally {
      setLoading(false);
    }
  }, [activeSubTab, handleSearch]);

  useEffect(() => {
    loadSectInfo();
  }, [loadSectInfo]);

  const viewSectDetail = async (sectId: number) => {
    setActionLoading(true);
    try {
      const res = await api.get(`/api/sects/${sectId}`);
      if (res.data) {
        setSelectedSectDetail(res.data);
        setShowSectDetailModal(true);
      }
    } catch {
      showError("Không thể tải thông tin tông môn chi tiết");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.post('/api/sects/create', {
        name: createName.trim(),
        slogan: createSlogan.trim(),
        badge: createBadge
      });
      if (res.data?.success) {
        showSuccess(res.data.message);
        setCreateName('');
        setCreateSlogan('');
        await loadSectInfo();
      }
    } catch (err: any) {
      showError(err.response?.data?.error || "Không thể thành lập Tông môn");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinSect = async (sectId: number) => {
    setActionLoading(true);
    try {
      const res = await api.post('/api/sects/join', { sect_id: sectId });
      if (res.data?.success) {
        showSuccess(res.data.message);
        setPendingRequests(prev => [...prev, sectId]);
        setShowSectDetailModal(false);
      }
    } catch (err: any) {
      showError(err.response?.data?.error || "Gia nhập tông môn thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveSect = async () => {
    const confirmMsg = mySectData?.role === 'leader' 
      ? "Bạn là Tông chủ, rời đi sẽ giải tán Tông môn và xóa toàn bộ dữ liệu. Bạn chắc chắn chứ?" 
      : "Bạn có chắc chắn muốn rời khỏi Tông môn này không?";
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await api.post('/api/sects/leave');
      if (res.data?.success) {
        showSuccess(res.data.message);
        setInSect(false);
        setMySectData(null);
        await loadSectInfo();
      }
    } catch (err: any) {
      showError(err.response?.data?.error || "Không thể rời tông môn");
    } finally {
      setActionLoading(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contribAmount <= 0) return;
    setActionLoading(true);
    try {
      const res = await api.post('/api/sects/contribute', { amount: contribAmount });
      if (res.data?.success) {
        showSuccess(res.data.message);
        const infoRes = await api.get('/api/sects/my-sect');
        if (infoRes.data) setMySectData(infoRes.data);
      }
    } catch (err: any) {
      showError(err.response?.data?.error || "Cống hiến thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareBook = async (bookId: any) => {
    setActionLoading(true);
    try {
      const res = await api.post('/api/sects/library/add', { book_id: Number(bookId) });
      if (res.data?.success) {
        showSuccess(res.data.message || "Đã đóng góp sách vào Tàng Kinh Các");
        await fetchSectLibrary();
      }
    } catch (err: any) {
      showError(err.response?.data?.error || "Không thể đóng góp sách");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveBook = async (bookId: number, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn gỡ bỏ [${title || 'sách'}] khỏi Tàng Kinh Các?`)) return;
    setActionLoading(true);
    try {
      const res = await api.post('/api/sects/library/remove', { book_id: Number(bookId) });
      if (res.data?.success) {
        showSuccess(res.data.message || "Đã gỡ sách khỏi Tàng Kinh Các");
        await fetchSectLibrary();
      }
    } catch (err: any) {
      showError(err.response?.data?.error || "Không thể gỡ sách");
    } finally {
      setActionLoading(false);
    }
  };

  return {
    inSect,
    mySectData,
    sectsList,
    pendingRequests,
    searchQuery,
    setSearchQuery,
    selectedSectDetail,
    showSectDetailModal,
    setShowSectDetailModal,
    createName,
    setCreateName,
    createSlogan,
    setCreateSlogan,
    createBadge,
    setCreateBadge,
    contribAmount,
    setContribAmount,
    sectBooksList,
    userBookshelf,
    loading,
    actionLoading,
    errorMessage,
    successMessage,
    handleSearch,
    loadSectInfo,
    viewSectDetail,
    handleCreateSect,
    handleJoinSect,
    handleLeaveSect,
    handleContribute,
    handleShareBook,
    handleRemoveBook,
    fetchSectLibrary,
    fetchUserBookshelf,
    showSuccess,
    showError
  };
}
