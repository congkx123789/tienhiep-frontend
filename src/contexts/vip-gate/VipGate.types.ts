export interface SystemEventInfo {
  isFreeEventActive: boolean;
  eventName: string;
  dailyFreeMinutes: number;
  maintenanceMode: boolean;
}

export interface UserQuotaInfo {
  unlimited: boolean;
  remainingSeconds: number;
  usedSeconds: number;
  dailyMinutes: number;
  reason: string;
  description: string;
}

export interface GateConfig {
  isOpen: boolean;
  toolId: string | null;
  toolName: string;
  description: string;
  durationMinutes: number;
  onSuccess: (() => void) | null;
}

export interface VipGateContextValue {
  isToolUnlocked: (toolId: string | null) => boolean;
  getToolRemainingMinutes: (toolId: string | null) => number;
  requestToolAccess: (options: {
    toolId: string;
    toolName?: string;
    description?: string;
    durationMinutes?: number;
    onSuccess?: (() => void) | null;
  }) => boolean;
  openVipModal: () => void;
  openToolGate: (toolId: string, toolName?: string, description?: string, durationMinutes?: number) => void;
  closeGate: () => void;
  unlockToolWithAd: (toolId: string, durationMinutes?: number) => void;
  gateConfig: GateConfig;
  unlockedTools: Record<string, number>;
  systemEvent: SystemEventInfo;
  quotaInfo: UserQuotaInfo | null;
  refreshSystemEvent: () => Promise<void>;
  refreshQuota: () => Promise<void>;
}

// Danh sách các công cụ Offline thuần túy - Luôn luôn miễn phí 100%, không cần kết nối mạng hoặc VIP
export const OFFLINE_FREE_TOOLS = [
  'offline_dict',
  'vietphrase_local',
  'cache_reading',
  'epub_local',
  'hanviet_dict',
  'local_bookmarks',
  'local_history',
];
