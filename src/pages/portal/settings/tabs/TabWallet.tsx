import React, { useState } from 'react';
import { Award, Coins } from 'lucide-react';

interface TabWalletProps {
  user: any;
  d: Record<string, string>;
}

export const TabWallet: React.FC<TabWalletProps> = ({ user, d }) => {
  const [level] = useState({
    name: user?.vip_status === 1 ? 'Trúc Cơ Kỳ (VIP)' : 'Luyện Khí Kỳ (Mortal)',
    exp: 720,
    maxExp: 1000,
    rank: user?.vip_status === 1 ? 'Chân Nhân' : 'Tán Tu',
  });

  const [badges] = useState([
    { id: 1, title: 'Tân Thủ', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', icon: '🌱' },
    { id: 2, title: 'VIP Độc Giả', color: 'bg-amber-500/10 text-amber-400 border-amber-500/25', icon: '👑', active: user?.vip_status === 1 },
    { id: 3, title: 'Mọt Sách', color: 'bg-purple-500/10 text-purple-400 border-purple-500/25', icon: '📚' }
  ]);

  const [wallet] = useState({
    coins: 125000,
    bonus: 2500,
    tickets: 5,
    votes: 3,
    gifts: 2
  });

  const [txTab, setTxTab] = useState<'deposit' | 'expense'>('deposit');
  const [depositLogs] = useState([
    { id: 101, detail: 'Nạp qua MB Bank QR', amount: 50000, time: '2026-06-09 10:23', status: 'success' },
    { id: 102, detail: 'Nạp qua PayOS cổng tự động', amount: 100000, time: '2026-06-05 14:02', status: 'success' }
  ]);
  const [expenseLogs] = useState([
    { id: 201, detail: 'Đăng ký VIP Gói Tháng', amount: -50000, time: '2026-06-09 10:25', status: 'success' },
    { id: 202, detail: 'Mua quà tặng Donate chương', amount: -15000, time: '2026-06-01 20:11', status: 'success' }
  ]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Level Tu Tiên */}
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-[#1f1f3a]/60 pb-3">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400 animate-pulse" /> {d.accountLevel}
          </h3>
          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black uppercase">
            {level.rank}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-bold">{d.levelTitle}: <strong className="text-white font-extrabold">{level.name}</strong></span>
            <span className="text-slate-400 font-mono">{level.exp} / {level.maxExp} EXP</span>
          </div>

          <div className="w-full bg-[#0b0b14] h-3.5 rounded-full overflow-hidden border border-[#1f1f3a] p-0.5">
            <div 
              className="bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-600 h-full rounded-full transition-all duration-1000"
              style={{ width: `${(level.exp / level.maxExp) * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-500 block italic leading-relaxed">
            💡 {d.expNeeded}: {level.maxExp - level.exp} EXP. Đọc thêm truyện mỗi ngày hoặc ủng hộ dịch giả để thăng cấp cảnh giới nhanh hơn!
          </span>
        </div>

        {/* Badges Grid */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.titlesBadges}</label>
          <div className="grid grid-cols-3 gap-2">
            {badges.map(b => (
              <div 
                key={b.id} 
                className={`p-3 rounded-xl border text-center space-y-1 ${b.color} relative overflow-hidden transition-all hover:scale-102`}
              >
                <span className="text-lg block">{b.icon}</span>
                <strong className="text-[10px] font-bold block whitespace-nowrap">{b.title}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ví Tiền & Vật Phẩm */}
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-[#1f1f3a]/60 pb-3">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-purple-400" /> {d.walletBalance}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{d.depositCoin}</span>
              <strong className="text-lg text-emerald-400 font-black font-mono">{wallet.coins.toLocaleString()}</strong>
            </div>
            <span className="text-2xl">🪙</span>
          </div>

          <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{d.bonusCoin}</span>
              <strong className="text-lg text-amber-400 font-black font-mono">{wallet.bonus.toLocaleString()}</strong>
            </div>
            <span className="text-2xl">🎁</span>
          </div>
        </div>

        {/* Kho Vật Phẩm */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{d.itemInventory}</label>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-3 text-center space-y-1">
              <span className="text-xl block">🎫</span>
              <strong className="text-[10px] text-white block">{d.itemRecommendation}</strong>
              <span className="text-xs text-purple-400 font-black font-mono">x{wallet.tickets}</span>
            </div>
            <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-3 text-center space-y-1">
              <span className="text-xl block">⚡</span>
              <strong className="text-[10px] text-white block">{d.itemVote}</strong>
              <span className="text-xs text-purple-400 font-black font-mono">x{wallet.votes}</span>
            </div>
            <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-3 text-center space-y-1">
              <span className="text-xl block">💎</span>
              <strong className="text-[10px] text-white block">{d.itemGift}</strong>
              <span className="text-xs text-purple-400 font-black font-mono">x{wallet.gifts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Logs */}
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-[#1f1f3a]/60 pb-3">
          <h3 className="text-sm font-extrabold text-white">{d.txHistory}</h3>
          <div className="flex gap-1 bg-[#0b0b14] border border-[#1f1f3a] rounded-lg p-0.5">
            <button
              onClick={() => setTxTab('deposit')}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                txTab === 'deposit' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {d.txTabDeposit}
            </button>
            <button
              onClick={() => setTxTab('expense')}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                txTab === 'expense' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {d.txTabExpense}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] text-slate-300">
            <thead>
              <tr className="border-b border-[#1f1f3a] text-slate-500 font-bold">
                <th className="pb-2">{d.txDetail}</th>
                <th className="pb-2">{d.txCost}</th>
                <th className="pb-2">{d.txTime}</th>
                <th className="pb-2 text-right">{d.txStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f3a]/30">
              {txTab === 'deposit' ? (
                depositLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.01]">
                    <td className="py-2.5 font-semibold text-white">{log.detail}</td>
                    <td className="py-2.5 text-emerald-400 font-bold">+{formatCurrency(log.amount)}</td>
                    <td className="py-2.5 text-slate-500 font-mono">{log.time}</td>
                    <td className="py-2.5 text-right">
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded text-[9px] font-black uppercase">
                        Thành công
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                expenseLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.01]">
                    <td className="py-2.5 font-semibold text-white">{log.detail}</td>
                    <td className="py-2.5 text-red-400 font-bold">{log.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(log.amount))}</td>
                    <td className="py-2.5 text-slate-500 font-mono">{log.time}</td>
                    <td className="py-2.5 text-right">
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded text-[9px] font-black uppercase">
                        Thành công
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
