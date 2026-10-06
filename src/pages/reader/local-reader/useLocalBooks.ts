import { useState, useEffect, useCallback } from 'react';
import { LocalBook, StorageInfo } from './LocalReader.types';
import { getLocalBooksFromDB, saveLocalBookToDB, deleteLocalBookFromDB } from './localDb';
import { appConfirm } from '../../../services/dialogService';

export function useLocalBooks(lang: string) {
  const [localBooks, setLocalBooks] = useState<LocalBook[]>([]);
  const [activeBook, setActiveBook] = useState<LocalBook | null>(null);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());

  const updateStorageEstimate = useCallback(async () => {
    if (navigator.storage?.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageInMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
        const quotaInMB = ((estimate.quota || 0) / (1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 0 });
        setStorageInfo({ usage: usageInMB, quota: quotaInMB });
      } catch (e) {
        console.error('Failed to get storage estimate:', e);
      }
    }
  }, []);

  const loadBooks = useCallback(async () => {
    const books = await getLocalBooksFromDB();
    setLocalBooks(books);
    updateStorageEstimate();
  }, [updateStorageEstimate]);

  useEffect(() => {
    loadBooks();
    const handleAuthChange = () => loadBooks();
    window.addEventListener('sync-auth-event', handleAuthChange);
    return () => window.removeEventListener('sync-auth-event', handleAuthChange);
  }, [loadBooks]);

  const handleSelectBook = (book: LocalBook) => {
    setActiveBook(book);
    setActiveChapterIdx(book.lastReadChapterIdx || 0);
  };

  const handleSaveProgress = async (book: LocalBook, chapterIdx: number) => {
    const updated = {
      ...book,
      lastReadChapterIdx: chapterIdx,
      lastReadAt: Date.now()
    };
    await saveLocalBookToDB(updated);
    setLocalBooks(prev => prev.map(b => b.id === book.id ? updated : b));
  };

  const handleDeleteBook = async (bookId: string) => {
    const ok = await appConfirm({
      title: 'Xóa Sách Thiết Bị',
      message: 'Bạn có chắc chắn muốn xóa cuốn sách này khỏi thiết bị?',
      confirmText: 'Xóa Ngay',
      type: 'danger',
    });
    if (!ok) return;
    await deleteLocalBookFromDB(bookId);
    setLocalBooks(prev => prev.filter(b => b.id !== bookId));
    if (activeBook?.id === bookId) setActiveBook(null);
  };

  const handleToggleSelectBook = (id: string) => {
    setSelectedBookIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedBookIds.size === localBooks.length) {
      setSelectedBookIds(new Set());
    } else {
      setSelectedBookIds(new Set(localBooks.map(b => b.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedBookIds.size === 0) return;
    const ok = await appConfirm({
      title: 'Xác Nhận Xóa Nhiều Sách',
      message: `Xác nhận xóa ${selectedBookIds.size} cuốn sách đã chọn khỏi thiết bị?`,
      confirmText: 'Xóa Toàn Bộ',
      type: 'danger',
    });
    if (!ok) return;
    for (const id of selectedBookIds) {
      await deleteLocalBookFromDB(id);
    }
    setLocalBooks(prev => prev.filter(b => !selectedBookIds.has(b.id)));
    setSelectedBookIds(new Set());
    setIsEditMode(false);
  };

  const handleClearAllData = async () => {
    const confirmMsg = lang === 'zh' 
      ? "⚠️ 警告：此操作将删除设备上保存的所有离线小说，且无法恢复。您确定要删除吗？" 
      : lang === 'en' 
      ? "⚠️ WARNING: This will DELETE ALL offline novels saved on this device and CANNOT be recovered. Are you sure you want to delete?" 
      : "⚠️ CẢNH BÁO: Hành động này sẽ XÓA TOÀN BỘ truyện offline lưu trong thiết bị và không thể khôi phục. Bạn có chắc chắn muốn xóa không?";

    const ok = await appConfirm({
      title: 'Xóa Toàn Bộ Dữ Liệu Offline',
      message: confirmMsg,
      confirmText: 'Xóa Tất Cả',
      type: 'danger',
    });
    if (!ok) return;

    for (const b of localBooks) {
      await deleteLocalBookFromDB(b.id);
    }
    setLocalBooks([]);
    setActiveBook(null);
  };

  return {
    localBooks,
    setLocalBooks,
    activeBook,
    setActiveBook,
    activeChapterIdx,
    setActiveChapterIdx,
    storageInfo,
    isEditMode,
    setIsEditMode,
    selectedBookIds,
    handleSelectBook,
    handleSaveProgress,
    handleDeleteBook,
    handleToggleSelectBook,
    handleSelectAll,
    handleDeleteSelected,
    handleClearAllData,
    loadBooks
  };
}
