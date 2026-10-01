import React, { useState } from 'react';
import { Crown, Users, Plus, Search, Shield, ChevronRight, X, Coins } from 'lucide-react';
import { SectItem } from '../Sects.types';

interface SectDiscoveryViewProps {
  sectsList: SectItem[];
  pendingRequests: number[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearch: () => void;
  onJoinSect: (id: number) => void;
  onViewDetail: (id: number) => void;
  createName: string;
  setCreateName: (name: string) => void;
  createSlogan: string;
  setCreateSlogan: (slogan: string) => void;
  createBadge: string;
  setCreateBadge: (badge: string) => void;
  onCreateSect: (e: React.FormEvent) => void;
  actionLoading: boolean;
  selectedSectDetail: any;
  showSectDetailModal: boolean;
  setShowSectDetailModal: (show: boolean) => void;
}

export const SectDiscoveryView: React.FC<SectDiscoveryViewProps> = ({
  sectsList,
  pendingRequests,
  searchQuery,
  setSearchQuery,
  onSearch,
  onJoinSect,
  onViewDetail,
  createName,
  setCreateName,
  createSlogan,
  setCreateSlogan,
  createBadge,
  setCreateBadge,
  onCreateSect,
  actionLoading,
  selectedSectDetail,
  showSectDetailModal,
  setShowSectDetailModal
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
          Tông Môn & Bang Phái Tu Tiên
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Gia nhập môn phái cùng các đạo hữu đàm đạo tu chân, chia sẻ tàng kinh các và tranh đoạt thần bảng.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 active:scale-95 text-[#0b0b14] font-black text-xs transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Khai Tông Lập Phái
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex gap-2 max-w-md mx-auto">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm danh môn chính phái..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b0b14] border border-[#1f1f3a] text-xs text-white outline-none focus:border-purple-500"
          />
        </div>
        <button
          onClick={onSearch}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
        >
          Tìm
        </button>
      </div>

      {/* Sects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectsList?.map((s) => {
          const isPending = pendingRequests.includes(s.id);
          return (
            <div key={s.id} className="p-6 rounded-2xl bg-[#121225]/80 border border-[#1f1f3a] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase">
                    Môn Phái
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{s.members_count} môn đồ</span>
                  </div>
                </div>

                <h3 className="text-lg font-extrabold text-white">{s.name}</h3>
                <p className="text-xs text-slate-400 italic line-clamp-2">
                  "{s.slogan || 'Nhất kiếm định càn khôn'}"
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => onViewDetail(s.id)}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300"
                >
                  Chi tiết
                </button>
                <button
                  onClick={() => onJoinSect(s.id)}
                  disabled={isPending || actionLoading}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isPending
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                  }`}
                >
                  {isPending ? 'Đã gửi đơn' : 'Gia nhập'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Sect Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#131324] border border-purple-500/30 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" /> Khai Tông Lập Phái
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { onCreateSect(e); setShowCreateModal(false); }} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Tên Tông Môn</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="vd: Tiêu Dao Phái, Thanh Vân Môn..."
                  className="w-full p-2.5 rounded-xl bg-[#0b0b14] border border-[#1f1f3a] text-white outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Khẩu Hiệu / Tông Chỉ</label>
                <input
                  type="text"
                  value={createSlogan}
                  onChange={(e) => setCreateSlogan(e.target.value)}
                  placeholder="vd: Thuận ta thì sống, nghịch ta thì chết..."
                  className="w-full p-2.5 rounded-xl bg-[#0b0b14] border border-[#1f1f3a] text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Huy Hiệu Tông Môn</label>
                <div className="flex gap-2">
                  {['purple', 'emerald', 'amber', 'rose'].map((badge) => (
                    <button
                      type="button"
                      key={badge}
                      onClick={() => setCreateBadge(badge)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        createBadge === badge ? 'border-white bg-white/10 text-white' : 'border-white/10 text-slate-400'
                      }`}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-105 active:scale-98 text-[#0b0b14] font-black text-xs shadow-lg transition-all"
              >
                Thành Lập Tông Môn (Miễn Phí)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sect Detail Modal */}
      {showSectDetailModal && selectedSectDetail && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#131324] border border-purple-500/30 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-extrabold text-white">{selectedSectDetail.name}</h3>
              <button onClick={() => setShowSectDetailModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 italic">"{selectedSectDetail.slogan}"</p>
            <div className="text-xs space-y-2 text-slate-400">
              <p>Tông chủ: <strong className="text-white">{selectedSectDetail.leader_name}</strong></p>
              <p>Thành viên: <strong className="text-white">{selectedSectDetail.members_count}</strong></p>
              <p>Điểm công đức: <strong className="text-amber-300">{selectedSectDetail.total_contributions?.toLocaleString()} Linh Thạch</strong></p>
            </div>
            <button
              onClick={() => onJoinSect(selectedSectDetail.id)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
            >
              Gửi Đơn Gia Nhập
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
