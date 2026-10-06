import { useState, useEffect, useRef } from 'react';
import api from '../../../services';
import { PaymentData, GateStep } from './VipGate.types';

export function useVipPayment(
  user: any,
  refreshUser: () => Promise<void>,
  toolId?: string,
  unlockToolWithAd?: (toolId: string, durationMinutes: number) => void
) {
  const [selectedPlan, setSelectedPlan] = useState('month');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [polling, setPolling] = useState(false);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  const [qrError, setQrError] = useState(false);
  const pollingRef = useRef<any>(null);

  // Đếm ngược hết hạn đơn hàng
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!paymentData?.expires_at) return;
    const calc = () => Math.max(0, Math.floor((new Date(paymentData.expires_at!).getTime() - Date.now()) / 1000));
    setSecs(calc());
    const t = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(t);
  }, [paymentData?.expires_at]);

  const countdown = {
    secs,
    label: `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`,
    expired: secs === 0 && !!paymentData?.expires_at,
  };

  // Polling tự động kiểm tra giao dịch mỗi 5s
  const startPolling = (orderId: string, onCompleted: () => void, onExpired: () => void) => {
    clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await api.get(`/api/payment/status/${orderId}`);
        if (res.data?.status === 'completed') {
          clearInterval(pollingRef.current);
          setPolling(false);
          refreshUser();
          if (toolId && unlockToolWithAd) {
            unlockToolWithAd(toolId, 99999);
          }
          onCompleted();
        } else if (res.data?.status === 'expired') {
          clearInterval(pollingRef.current);
          setPolling(false);
          onExpired();
        }
      } catch (_) {}
    }, 5000);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus((p) => ({ ...p, [key]: true }));
      setTimeout(() => setCopyStatus((p) => ({ ...p, [key]: false })), 1500);
    });
  };

  const handleInitiatePayment = async (onSuccess: (data: PaymentData) => void) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      alert('Vui lòng đăng nhập hoặc tạo tài khoản trước khi nạp VIP để hệ thống kích hoạt tự động vào tài khoản của bạn!');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/payment/create', {
        plan: selectedPlan,
        user_id: user?.id ? String(user.id) : undefined,
      });
      setPaymentData(res.data);
      setPolling(true);
      setQrError(false);
      onSuccess(res.data);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Không khởi tạo được thanh toán. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const stopPolling = () => {
    clearInterval(pollingRef.current);
    setPolling(false);
  };

  return {
    selectedPlan,
    setSelectedPlan,
    loading,
    paymentData,
    setPaymentData,
    polling,
    copyStatus,
    qrError,
    setQrError,
    countdown,
    startPolling,
    stopPolling,
    handleCopy,
    handleInitiatePayment,
  };
}
