/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  VipGate.types.ts
 * ═════════════════════════════════════════════════════════════════════════════
 */

export interface PlanItem {
  id: string;
  label: string;
  price: string;
  desc: string;
  badge?: string | null;
  icon: string;
}

export interface PaymentData {
  order_id: string;
  checkout_url?: string;
  qr_code?: string;
  qr_url?: string;
  account_number?: string;
  account_name?: string;
  bank_name?: string;
  amount?: number;
  transfer_content?: string;
  expires_at?: string;
}

export type GateStep = 'gate' | 'plans' | 'payment' | 'success';
export type GateTab = 'vip' | 'topup';

export const PLANS: { vip: PlanItem[]; topup: PlanItem[] } = {
  vip: [
    {
      id: 'month',
      label: 'Gói VIP 1 Tháng',
      price: '50.000đ',
      desc: 'Mở khóa toàn bộ tool • Tắt mọi quảng cáo • 30 ngày',
      badge: null,
      icon: '👑',
    },
    {
      id: 'year',
      label: 'Gói VIP 1 Năm',
      price: '200.000đ',
      desc: 'Tiết kiệm 67% • Mở khóa không giới hạn trọn năm',
      badge: 'TIẾT KIỆM 67%',
      icon: '🔥',
    },
  ],
  topup: [
    { id: 'topup_50k',  label: 'Nạp 50.000đ',  price: '50.000đ',  desc: 'Số dư API Developer',   icon: '⚡' },
    { id: 'topup_100k', label: 'Nạp 100.000đ', price: '100.000đ', desc: 'Số dư API Developer',   icon: '💎' },
    { id: 'topup_200k', label: 'Nạp 200.000đ', price: '200.000đ', desc: 'Số dư API Developer • Tối ưu', icon: '🚀' },
  ],
};
