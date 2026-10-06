import { useState, useCallback, useEffect } from 'react';
import api from '../../services';
import { SystemEventInfo } from './VipGate.types';

export function useSystemEvent() {
  const [systemEvent, setSystemEvent] = useState<SystemEventInfo>({
    isFreeEventActive: false,
    eventName: '',
    dailyFreeMinutes: 30,
    maintenanceMode: false,
  });

  const refreshSystemEvent = useCallback(async () => {
    try {
      const res = await api.get('/api/system/event');
      if (res.data?.success && res.data.event) {
        const ev = res.data.event;
        setSystemEvent({
          isFreeEventActive: ev.free_event_active === 'true',
          eventName: ev.free_event_name || 'Tri Ân Đạo Hữu',
          dailyFreeMinutes: parseInt(ev.daily_free_minutes_default || '30', 10),
          maintenanceMode: ev.maintenance_mode === 'true',
        });
      }
    } catch {
      // Offline fallback: giữ nguyên trạng thái
    }
  }, []);

  useEffect(() => {
    refreshSystemEvent();
    const interval = setInterval(refreshSystemEvent, 180000);
    return () => clearInterval(interval);
  }, [refreshSystemEvent]);

  return { systemEvent, refreshSystemEvent };
}
