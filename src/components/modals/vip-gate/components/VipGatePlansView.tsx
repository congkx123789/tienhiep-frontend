import React from 'react';
import { Crown, Zap, Check, ArrowRight, RefreshCw, LogIn } from 'lucide-react';
import { PLANS, GateTab } from '../VipGate.types';
import { useAuth } from '../../../../contexts/AuthContext';

interface VipGatePlansViewProps {
  tab: GateTab;
  setTab: (tab: GateTab) => void;
  selectedPlan: string;
  setSelectedPlan: (planId: string) => void;
  loading: boolean;
  toolId?: string;
  onBackToGate?: () => void;
  onInitiatePayment: () => void;
}

export const VipGatePlansView: React.FC<VipGatePlansViewProps> = ({
  tab,
  setTab,
  selectedPlan,
  setSelectedPlan,
  loading,
  toolId,
  onBackToGate,
  onInitiatePayment,
}) => {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      {/* Tabs VIP / Nạp */}
      <div className="flex p-1 bg-[#0b0b16] rounded-xl border border-white/5">
        <button
          type="button"
          onClick={() => setTab('vip')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === 'vip'
              ? 'bg-amber-500 text-[#0b0b14] shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Crown className="w-3.5 h-3.5" /> Gói VIP Thành Viên
        </button>
        <button
          type="button"
          onClick={() => setTab('topup')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === 'topup'
              ? 'bg-amber-500 text-[#0b0b14] shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Nạp Số Dư API
        </button>
      </div>

      {/* Danh sách các gói */}
      <div className="space-y-2.5">
        {PLANS[tab].map((p) => {
          const isSel = selectedPlan === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                isSel
                  ? 'bg-amber-500/15 border-amber-400/80 shadow-lg shadow-amber-500/5'
                  : 'bg-[#121226] border-white/5 hover:border-white/10 hover:bg-[#16162f]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{p.label}</h4>
                    {p.badge && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-amber-300 block">{p.price}</span>
                <div
                  className={`w-4 h-4 rounded-full border mt-1 ml-auto flex items-center justify-center ${
                    isSel ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                  }`}
                >
                  {isSel && <Check className="w-2.5 h-2.5 text-[#0b0b14] stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nút tiếp tục thanh toán */}
      <div className="pt-2 flex gap-2">
        {toolId && onBackToGate && (
          <button
            type="button"
            onClick={onBackToGate}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-2xl transition-colors"
          >
            Quay lại
          </button>
        )}
        <button
          type="button"
          onClick={onInitiatePayment}
          disabled={loading}
          className={`flex-1 py-3 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer ${
            !user 
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-purple-500/25 animate-pulse'
              : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-[#0b0b14] shadow-amber-500/25'
          }`}
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : !user ? (
            <>
              <LogIn className="w-4 h-4" /> Đăng Nhập Để Nạp VIP
            </>
          ) : (
            <>
              Tiếp Tục Chuyển Khoản <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
