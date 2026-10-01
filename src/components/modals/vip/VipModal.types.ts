/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  VipModal.types.ts
 * ═════════════════════════════════════════════════════════════════════════════
 */

export interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type VipStep = 'plans' | 'payment' | 'success';
export type VipTab = 'vip' | 'topup';
