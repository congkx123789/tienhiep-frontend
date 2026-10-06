import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function useVipListener() {
  const { user, setUser, refreshUser } = useAuth();

  useEffect(() => {
    if (!user) return;

    const streamUrl = `/api/events/stream?user_id=${user.id || ''}`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === 'system_vip_upgraded') {
            // 1. Cập nhật state tức thì không cần F5
            if (setUser) {
              setUser((prev: any) => ({
                ...prev,
                isVip: true,
                vip_status: 1,
                vip_plan: payload.data?.plan || 'month',
                vip_expiry: payload.data?.vip_expiry,
              }));
            }
            if (refreshUser) {
              refreshUser().catch(() => {});
            }

            // 2. Kích hoạt thông báo thành công
            showVipCelebration(payload.message || 'Chúc mừng đạo hữu đã nâng cấp VIP thành công!');
          }
        } catch {
          // Bỏ qua tin nhắn không phải JSON
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (e) {
      console.warn('[useVipListener] Không thể kết nối EventSource:', e);
    }

    return () => {
      eventSource?.close();
    };
  }, [user?.id]);
}

function showVipCelebration(message: string) {
  const banner = document.createElement('div');
  banner.className =
    'fixed top-6 right-6 z-50 bg-slate-900 border-2 border-amber-500 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce';
  banner.innerHTML = `<span style="font-size:24px">💎</span><div><h4 style="font-weight:bold;color:#fbbf24">Đột Phá Cảnh Giới VIP!</h4><p style="font-size:13px;color:#cbd5e1">${message}</p></div>`;
  document.body.appendChild(banner);
  setTimeout(() => {
    banner.remove();
  }, 6000);
}
