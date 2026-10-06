import { useState, useCallback, useEffect } from 'react';
import api from '../../services';
import { UserQuotaInfo } from './VipGate.types';

export function useUserQuota(user: any) {
  const [quotaInfo, setQuotaInfo] = useState<UserQuotaInfo | null>(null);

  const refreshQuota = useCallback(async () => {
    try {
      const res = await api.get('/api/user/quota');
      if (res.data?.success) {
        setQuotaInfo({
          unlimited: !!res.data.unlimited,
          remainingSeconds: res.data.remaining_seconds || 0,
          usedSeconds: res.data.used_seconds || 0,
          dailyMinutes: res.data.daily_minutes || 30,
          reason: res.data.reason || '',
          description: res.data.description || '',
        });
      }
    } catch {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    refreshQuota();
    const interval = setInterval(refreshQuota, 180000);
    return () => clearInterval(interval);
  }, [refreshQuota, user]);

  return { quotaInfo, refreshQuota };
}
