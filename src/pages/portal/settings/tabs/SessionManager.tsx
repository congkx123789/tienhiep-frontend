import React, { useState, useEffect } from 'react';
import { Laptop, Smartphone as PhoneIcon, Trash2 } from 'lucide-react';
import api from '../../../../services';

interface SessionItem {
  id: number;
  device: string;
  ip: string;
  current: boolean;
  location: string;
  token: string;
}

interface SessionManagerProps {
  user: any;
  d: Record<string, string>;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ user, d }) => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  const fetchSessions = async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/auth/sessions');
      if (res.data?.success) {
        const curToken = localStorage.getItem('refreshToken');
        const activeOnly = res.data.sessions.filter((s: any) => s.status === 'active');
        const mapped = activeOnly.map((s: any) => ({
          id: s.id,
          device: `${s.os} (${s.browser})`,
          ip: s.ip_address,
          current: s.token === curToken,
          location: s.device_type === 'Desktop' ? 'Máy tính' : 'Điện thoại',
          token: s.token,
        }));
        setSessions(mapped);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const revokeSession = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn đăng xuất thiết bị này không?")) return;
    try {
      const res = await api.post('/api/auth/sessions/revoke', { session_id: id });
      if (res.data?.success) fetchSessions();
    } catch {
      alert("Không thể đăng xuất thiết bị. Vui lòng thử lại sau.");
    }
  };

  const revokeAllSessions = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn đăng xuất tất cả các thiết bị khác không?")) return;
    try {
      const otherSessions = sessions.filter(s => !s.current);
      await Promise.all(otherSessions.map(s => api.post('/api/auth/sessions/revoke', { session_id: s.id })));
      fetchSessions();
    } catch {
      alert("Lỗi khi thực hiện đăng xuất hàng loạt.");
    }
  };

  return (
    <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-[#1f1f3a]/60 pb-3">
        <div>
          <h4 className="font-extrabold text-white text-sm">{d.sessionTitle}</h4>
          <p className="text-[10px] text-slate-400 mt-1">{d.sessionDesc}</p>
        </div>
        {sessions.length > 1 && (
          <button onClick={revokeAllSessions} className="text-red-400 hover:text-red-300 font-extrabold text-[10px] transition-colors">
            {d.revokeAllSessions}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map(s => (
          <div key={s.id} className="flex justify-between items-center p-3.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/10 border border-purple-500/25 rounded-lg text-purple-400">
                {s.device.includes('iPhone') ? <PhoneIcon className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{s.device}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">IP: {s.ip} · {s.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {s.current ? (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-black uppercase rounded">
                  {d.activeNow}
                </span>
              ) : (
                <button onClick={() => revokeSession(s.id)} className="p-1.5 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400 hover:bg-red-500/20 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
