import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const VipGateContext = createContext(null);

const STORAGE_KEY = 'tienhiep_unlocked_tools_v1';

export function VipGateProvider({ children }) {
  const { user } = useAuth();
  
  // Lưu danh sách tool được mở khóa tạm thời qua quảng cáo: { [toolId]: expireTimestamp }
  const [unlockedTools, setUnlockedTools] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // State điều khiển Overlay Gate
  const [gateConfig, setGateConfig] = useState({
    isOpen: false,
    toolId: null,
    toolName: '',
    description: '',
    durationMinutes: 30,
    onSuccess: null,
  });

  // Dọn dẹp các tool hết hạn
  useEffect(() => {
    const now = Date.now();
    let hasExpired = false;
    const updated = { ...unlockedTools };
    
    Object.keys(updated).forEach((id) => {
      if (updated[id] <= now) {
        delete updated[id];
        hasExpired = true;
      }
    });

    if (hasExpired) {
      setUnlockedTools(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}
    }
  }, []);

  // Kiểm tra xem tool có đang mở khóa không
  const isToolUnlocked = (toolId) => {
    if (!toolId) return true;
    // 1. VIP vĩnh viễn / tháng từ server -> luôn luôn mở
    if (user && user.vip_status === 1) return true;
    // 2. Tài khoản admin hoặc được server cấp quyền riêng theo danh sách unlocked_tools
    if (user) {
      if (['admin', 'havucong25', 'congkx123789'].includes(user.username)) return true;
      if (Array.isArray(user.unlocked_tools)) {
        if (user.unlocked_tools.includes('*') || user.unlocked_tools.includes(toolId)) return true;
      }
    }
    // 3. Kiểm tra hạn mở khóa tạm thời qua quảng cáo (Ad-unlock)
    const expireTime = unlockedTools[toolId];
    if (expireTime && expireTime > Date.now()) return true;
    return false;
  };

  // Lấy thời gian còn lại của tool (tính bằng phút)
  const getToolRemainingMinutes = (toolId) => {
    if (user && user.vip_status === 1) return Infinity;
    if (user && (['admin', 'havucong25', 'congkx123789'].includes(user.username) || user.unlocked_tools?.includes('*') || user.unlocked_tools?.includes(toolId))) {
      return Infinity;
    }
    const expireTime = unlockedTools[toolId];
    if (!expireTime || expireTime <= Date.now()) return 0;
    return Math.ceil((expireTime - Date.now()) / (60 * 1000));
  };

  /**
   * Gọi khi một tool cần kiểm tra quyền sử dụng
   * @param {Object} options
   * @param {string} options.toolId - Mã định danh tool (vd: 'ai_search', 'ai_translate', 'tts_premium')
   * @param {string} options.toolName - Tên hiển thị của tool
   * @param {string} options.description - Mô tả chức năng
   * @param {number} [options.durationMinutes=30] - Thời gian mở khóa tạm thời khi xem quảng cáo
   * @param {Function} options.onSuccess - Callback thực thi khi được mở khóa
   */
  const requestToolAccess = ({
    toolId,
    toolName = 'Công cụ nâng cao',
    description = 'Mở khóa tính năng VIP hoặc xem tài trợ để trải nghiệm',
    durationMinutes = 30,
    onSuccess = null,
  }) => {
    // Nếu đã mở khóa rồi thì thực thi luôn
    if (isToolUnlocked(toolId)) {
      if (typeof onSuccess === 'function') onSuccess();
      return true;
    }

    // Nếu chưa mở khóa -> Hiện overlay gate chồng lên
    setGateConfig({
      isOpen: true,
      toolId,
      toolName,
      description,
      durationMinutes,
      onSuccess,
    });
    return false;
  };

  // Mở modal VIP thuần túy (không qua tool)
  const openVipModal = () => {
    setGateConfig({
      isOpen: true,
      toolId: null,
      toolName: '',
      description: '',
      durationMinutes: 30,
      onSuccess: null,
    });
  };

  // Đóng overlay
  const closeGate = () => {
    setGateConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Thực hiện mở khóa tool sau khi xem xong quảng cáo
  const unlockToolWithAd = (toolId, durationMinutes = 30) => {
    const expireTime = Date.now() + durationMinutes * 60 * 1000;
    const updated = { ...unlockedTools, [toolId]: expireTime };
    setUnlockedTools(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    // Gọi callback onSuccess nếu có
    const callback = gateConfig.onSuccess;
    closeGate();
    if (typeof callback === 'function') {
      setTimeout(() => callback(), 150);
    }
  };

  return (
    <VipGateContext.Provider
      value={{
        isToolUnlocked,
        getToolRemainingMinutes,
        requestToolAccess,
        openVipModal,
        closeGate,
        unlockToolWithAd,
        gateConfig,
        unlockedTools,
      }}
    >
      {children}
    </VipGateContext.Provider>
  );
}

export function useVipGate() {
  const context = useContext(VipGateContext);
  if (!context) {
    throw new Error('useVipGate must be used within a VipGateProvider');
  }
  return context;
}
