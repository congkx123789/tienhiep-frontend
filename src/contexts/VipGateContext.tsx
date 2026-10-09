import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredUser } from '../utils/accountStorage';
import {
  SystemEventInfo,
  UserQuotaInfo,
  GateConfig,
  VipGateContextValue,
  OFFLINE_FREE_TOOLS
} from './vip-gate/VipGate.types';
import { useSystemEvent } from './vip-gate/useSystemEvent';
import { useUserQuota } from './vip-gate/useUserQuota';

export * from './vip-gate/VipGate.types';

const VipGateContext = createContext<VipGateContextValue | null>(null);
const STORAGE_KEY = 'tienhiep_unlocked_tools_v1';

export function VipGateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(() => getStoredUser());

  useEffect(() => {
    const handleAuthSync = () => {
      setUser(getStoredUser());
    };
    window.addEventListener('sync-auth-event', handleAuthSync);
    window.addEventListener('storage', handleAuthSync);
    return () => {
      window.removeEventListener('sync-auth-event', handleAuthSync);
      window.removeEventListener('storage', handleAuthSync);
    };
  }, []);

  const { systemEvent, refreshSystemEvent } = useSystemEvent();
  const { quotaInfo, refreshQuota } = useUserQuota(user);

  const [unlockedTools, setUnlockedTools] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [gateConfig, setGateConfig] = useState<GateConfig>({
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
  }, [unlockedTools]);

  const isToolUnlocked = useCallback(
    (toolId: string | null): boolean => {
      if (!toolId || OFFLINE_FREE_TOOLS.includes(toolId)) return true;
      if (systemEvent.isFreeEventActive) return true;
      if (user && user.vip_status === 1) return true;
      if (user) {
        const username = (user.username || '').toLowerCase();
        if (['admin', 'havucong25', 'congkx123789'].includes(username)) return true;
        if (Array.isArray(user.unlocked_tools)) {
          if (user.unlocked_tools.includes('*') || user.unlocked_tools.includes(toolId)) return true;
        }
      }
      if (quotaInfo?.unlimited || (quotaInfo?.remainingSeconds && quotaInfo.remainingSeconds > 0)) {
        return true;
      }
      const expireTime = unlockedTools[toolId];
      return !!(expireTime && expireTime > Date.now());
    },
    [systemEvent.isFreeEventActive, user, quotaInfo, unlockedTools]
  );

  const getToolRemainingMinutes = useCallback(
    (toolId: string | null): number => {
      if (!toolId || OFFLINE_FREE_TOOLS.includes(toolId)) return Infinity;
      if (systemEvent.isFreeEventActive) return Infinity;
      if (user && user.vip_status === 1) return Infinity;
      if (user) {
        const username = (user.username || '').toLowerCase();
        if (['admin', 'havucong25', 'congkx123789'].includes(username)) return Infinity;
        if (user.unlocked_tools?.includes('*') || user.unlocked_tools?.includes(toolId)) return Infinity;
      }
      if (quotaInfo?.remainingSeconds && quotaInfo.remainingSeconds > 0) {
        return Math.ceil(quotaInfo.remainingSeconds / 60);
      }
      const expireTime = unlockedTools[toolId];
      if (!expireTime || expireTime <= Date.now()) return 0;
      return Math.ceil((expireTime - Date.now()) / (60 * 1000));
    },
    [systemEvent.isFreeEventActive, user, quotaInfo, unlockedTools]
  );

  const requestToolAccess = useCallback(
    ({
      toolId,
      toolName = 'Công cụ nâng cao',
      description = 'Mở khóa tính năng VIP hoặc trải nghiệm qua tài trợ',
      durationMinutes = 30,
      onSuccess = null,
    }: {
      toolId: string;
      toolName?: string;
      description?: string;
      durationMinutes?: number;
      onSuccess?: (() => void) | null;
    }): boolean => {
      if (OFFLINE_FREE_TOOLS.includes(toolId) || isToolUnlocked(toolId)) {
        if (typeof onSuccess === 'function') onSuccess();
        return true;
      }
      if (!user) {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
        alert(`Vui lòng đăng nhập hoặc tạo tài khoản để sử dụng công cụ [${toolName}]!`);
        return false;
      }
      setGateConfig({
        isOpen: true,
        toolId,
        toolName,
        description,
        durationMinutes,
        onSuccess,
      });
      return false;
    },
    [isToolUnlocked, user]
  );

  const openVipModal = useCallback(() => {
    setGateConfig({
      isOpen: true,
      toolId: null,
      toolName: '',
      description: '',
      durationMinutes: 30,
      onSuccess: null,
    });
  }, []);

  const openToolGate = useCallback((toolId: string, toolName = '', description = '', durationMinutes = 30) => {
    setGateConfig({
      isOpen: true,
      toolId,
      toolName: toolName || toolId,
      description: description || 'Mở khóa tính năng VIP qua xem quảng cáo hoặc nâng cấp',
      durationMinutes,
      onSuccess: null,
    });
  }, []);

  const closeGate = useCallback(() => {
    setGateConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const unlockToolWithAd = useCallback(
    (toolId: string, durationMinutes = 30) => {
      const expireTime = Date.now() + durationMinutes * 60 * 1000;
      const updated = { ...unlockedTools, [toolId]: expireTime };
      setUnlockedTools(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}

      const callback = gateConfig.onSuccess;
      closeGate();
      if (typeof callback === 'function') {
        setTimeout(() => callback(), 150);
      }
    },
    [unlockedTools, gateConfig.onSuccess, closeGate]
  );

  return (
    <VipGateContext.Provider
      value={{
        isToolUnlocked,
        getToolRemainingMinutes,
        requestToolAccess,
        openVipModal,
        openToolGate,
        closeGate,
        unlockToolWithAd,
        gateConfig,
        unlockedTools,
        systemEvent,
        quotaInfo,
        refreshSystemEvent,
        refreshQuota,
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
