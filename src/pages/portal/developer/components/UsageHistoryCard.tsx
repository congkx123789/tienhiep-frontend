import { Award } from 'lucide-react';
import { useLang } from '../../../../contexts/LangContext';
import { UsageItem } from '../Developer.types';

interface UsageHistoryCardProps {
  usages: UsageItem[];
  loadingUsage: boolean;
  formatCurrency: (val: number | string) => string;
}

export function UsageHistoryCard({ usages, loadingUsage, formatCurrency }: UsageHistoryCardProps) {
  const { t, lang } = useLang();
  const safeUsages = Array.isArray(usages) ? usages : [];

  return (
    <div className="bg-[#121225]/60 border border-[#1f1f3a] rounded-3xl p-5 shadow-xl space-y-4">
      <h3 className="text-xs font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-purple-300 flex items-center gap-1.5">
        <Award className="w-4 h-4 text-brand-400" /> {t.developer?.apiUsageHistoryTitle || 'Nhật ký cuộc gọi gần đây'}
      </h3>

      {loadingUsage ? (
        <div className="text-center py-4 text-slate-500 text-xs">Đang tải...</div>
      ) : safeUsages.length === 0 ? (
        <p className="text-slate-500 text-xs text-center py-4">
          {lang === 'zh' ? '暂无接口调用记录。' : lang === 'en' ? 'No API usage records found.' : 'Chưa có lịch sử cuộc gọi API nào.'}
        </p>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {safeUsages.slice(0, 10).map((u, idx) => (
            <div key={idx} className="border-b border-[#1f1f3a]/30 pb-2.5 last:border-0 last:pb-0 flex justify-between items-center text-[10px]">
              <div>
                <span className="text-white font-bold font-mono">{u.model}</span>
                <span className="text-slate-500 block text-[9px] mt-0.5">
                  {new Date(u.timestamp).toLocaleTimeString('vi-VN')} · {u.tokens} {lang === 'zh' ? '字符' : lang === 'en' ? 'chars' : 'kí tự'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold block">
                  {u.cost === 0 ? (t.developer?.freeCost || 'Miễn phí (VIP)') : formatCurrency(u.cost || 0)}
                </span>
                <span className={`px-1 rounded text-[8px] font-bold ${u.status_code === 200 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {u.status_code}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
