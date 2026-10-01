import React from 'react';
import { Crown, Shield, ShieldAlert, UserMinus, Check, X } from 'lucide-react';
import { SectMember, JoinRequest, ROLE_LABELS, SectRole } from '../Sects.types';

interface SectDisciplesTabProps {
  members: SectMember[];
  myRole: SectRole;
  myUserId?: number | string;
  joinRequests: JoinRequest[];
  onPromoteRank: (userId: number, role: SectRole) => void;
  onKickMember: (userId: number, username: string) => void;
  onRespondRequest: (reqId: number, action: 'accept' | 'reject') => void;
}

export const SectDisciplesTab: React.FC<SectDisciplesTabProps> = ({
  members,
  myRole,
  myUserId,
  joinRequests,
  onPromoteRank,
  onKickMember,
  onRespondRequest
}) => {
  const canManage = ['leader', 'vice_leader', 'elder'].includes(myRole);
  const isLeader = myRole === 'leader';

  return (
    <div className="space-y-8">
      {/* Join requests for managers */}
      {canManage && joinRequests.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#1a122e]/80 border border-purple-500/30 space-y-4">
          <h3 className="text-sm font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" /> Đơn xin gia nhập ({joinRequests.length})
          </h3>
          <div className="divide-y divide-white/5">
            {joinRequests.map((req) => (
              <div key={req.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600/40 text-purple-200 flex items-center justify-center font-bold text-xs">
                    {req.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{req.username}</h4>
                    <span className="text-[10px] text-slate-500">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onRespondRequest(req.id, 'reject')}
                    className="p-1.5 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 transition-all text-xs"
                    title="Từ chối"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRespondRequest(req.id, 'accept')}
                    className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 transition-all text-xs"
                    title="Chấp thuận"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disciples List */}
      <div className="p-6 rounded-2xl bg-[#121225]/80 border border-[#1f1f3a] space-y-4">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
          Danh Sách Môn Hạ ({members?.length || 0})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 font-bold uppercase text-[10px]">
                <th className="pb-3">Đệ Tử</th>
                <th className="pb-3">Chức Vị</th>
                <th className="pb-3 text-right">Cống Hiến</th>
                {canManage && <th className="pb-3 text-right">Thao Tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members?.map((m) => {
                const isSelf = m.user_id === myUserId;
                const canChangeRank = isLeader && !isSelf;
                return (
                  <tr key={m.user_id} className="hover:bg-white/[0.02]">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-black text-xs">
                          {m.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">{m.display_name || m.username}</p>
                          <span className="text-[10px] text-slate-500">@{m.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      {canChangeRank ? (
                        <select
                          value={m.role}
                          onChange={(e) => onPromoteRank(m.user_id, e.target.value as SectRole)}
                          className="bg-[#0b0b14] border border-[#1f1f3a] text-purple-300 font-bold text-[11px] rounded-lg px-2 py-1 outline-none"
                        >
                          <option value="leader">Tông chủ</option>
                          <option value="vice_leader">Phó Tông chủ</option>
                          <option value="elder">Trưởng lão</option>
                          <option value="inner_disciple">Nội môn</option>
                          <option value="member">Ngoại môn</option>
                        </select>
                      ) : (
                        <span className="text-[11px] font-bold text-purple-300">
                          {ROLE_LABELS[m.role] || m.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-amber-300">
                      {m.contributions?.toLocaleString() || 0}
                    </td>
                    {canManage && (
                      <td className="py-3 text-right">
                        {canChangeRank && (
                          <button
                            onClick={() => onKickMember(m.user_id, m.username)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Trục xuất"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
