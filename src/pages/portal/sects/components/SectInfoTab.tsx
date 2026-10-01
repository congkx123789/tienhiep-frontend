import React from 'react';
import { Crown, Users, Coins, Edit, Check, X, LogOut, Award } from 'lucide-react';
import { ROLE_LABELS } from '../Sects.types';

interface SectInfoTabProps {
  mySectData: any;
  editAnnouncement: string;
  setEditAnnouncement: (val: string) => void;
  isEditingAnnouncement: boolean;
  setIsEditingAnnouncement: (val: boolean) => void;
  contribAmount: number;
  setContribAmount: (val: number) => void;
  actionLoading: boolean;
  onUpdateAnnouncement: () => void;
  onContribute: (e: React.FormEvent) => void;
  onLeaveSect: () => void;
}

export const SectInfoTab: React.FC<SectInfoTabProps> = ({
  mySectData,
  editAnnouncement,
  setEditAnnouncement,
  isEditingAnnouncement,
  setIsEditingAnnouncement,
  contribAmount,
  setContribAmount,
  actionLoading,
  onUpdateAnnouncement,
  onContribute,
  onLeaveSect
}) => {
  const sect = mySectData?.sect || {};
  const myRole = mySectData?.role;
  const canEdit = ['leader', 'vice_leader'].includes(myRole);

  const getBadgeColor = (badge: string) => {
    if (badge === 'emerald') return 'from-emerald-600 to-teal-800 text-emerald-200 border-emerald-500/40';
    if (badge === 'amber') return 'from-amber-600 to-yellow-800 text-amber-200 border-amber-500/40';
    if (badge === 'rose') return 'from-rose-600 to-red-800 text-rose-200 border-rose-500/40';
    return 'from-purple-600 to-indigo-800 text-purple-200 border-purple-500/40';
  };

  return (
    <div className="space-y-6">
      {/* Banner Card */}
      <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-r ${getBadgeColor(sect.badge || 'purple')} border shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6`}>
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-black/40 border border-white/20 text-[10px] font-black uppercase tracking-wider text-white">
              {ROLE_LABELS[myRole as keyof typeof ROLE_LABELS] || myRole}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-wide">
            {sect.name}
          </h2>
          <p className="text-sm opacity-90 italic">
            "{sect.slogan || 'Tu tiên cầu đạo, nhất thống giang sơn.'}"
          </p>
        </div>

        <div className="flex flex-wrap md:flex-col gap-3 text-xs bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 opacity-80" />
            <span>Thành viên: <strong>{mySectData?.members?.length || sect.members_count || 1}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-300" />
            <span>Quỹ Tông Môn: <strong className="text-amber-300">{sect.total_contributions?.toLocaleString() || 0} Linh Thạch</strong></span>
          </div>
        </div>
      </div>

      {/* Announcement Card */}
      <div className="p-6 rounded-2xl bg-[#121225]/80 border border-[#1f1f3a] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" /> Thông cáo Tông môn
          </h3>
          {canEdit && !isEditingAnnouncement && (
            <button
              onClick={() => setIsEditingAnnouncement(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300"
            >
              <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
            </button>
          )}
        </div>

        {isEditingAnnouncement ? (
          <div className="space-y-3">
            <textarea
              rows={3}
              value={editAnnouncement}
              onChange={(e) => setEditAnnouncement(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#0b0b14] border border-[#1f1f3a] text-white text-xs outline-none focus:border-purple-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditingAnnouncement(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={onUpdateAnnouncement}
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
              >
                Lưu
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-300 leading-relaxed bg-[#0b0b14]/50 p-4 rounded-xl border border-white/5">
            {sect.announcement || "Hiện chưa có thông cáo nào từ Tông chủ."}
          </p>
        )}
      </div>

      {/* Contribute and Leave Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={onContribute} className="p-6 rounded-2xl bg-[#121225]/80 border border-[#1f1f3a] space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" /> Cống hiến Linh Thạch
          </h3>
          <p className="text-xs text-slate-400">Đóng góp linh thạch giúp gia tăng điểm công đức và mở rộng tông môn.</p>
          <div className="flex gap-2">
            {[20, 50, 100, 200].map((amt) => (
              <button
                type="button"
                key={amt}
                onClick={() => setContribAmount(amt)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  contribAmount === amt
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400'
                }`}
              >
                +{amt}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-105 active:scale-98 text-[#0b0b14] font-black text-xs transition-all shadow-md"
          >
            Cống hiến {contribAmount} Linh Thạch
          </button>
        </form>

        <div className="p-6 rounded-2xl bg-[#121225]/80 border border-[#1f1f3a] space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-rose-400 flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Rời khỏi Tông môn
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Nếu rời khỏi Tông môn, toàn bộ điểm cống hiến và chức vụ của bạn trong môn phái này sẽ bị hủy bỏ.
            </p>
          </div>
          <button
            type="button"
            onClick={onLeaveSect}
            disabled={actionLoading}
            className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-bold text-xs transition-all"
          >
            {myRole === 'leader' ? 'Giải tán Tông Môn' : 'Rời Môn Phái'}
          </button>
        </div>
      </div>
    </div>
  );
};
