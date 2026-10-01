import { ComparisonData } from '../Bookshelf.types';

interface BookshelfComparisonBoxProps {
  compLoading: boolean;
  comparisonData: ComparisonData | null;
  t: any;
}

export function BookshelfComparisonBox({
  compLoading,
  comparisonData,
  t,
}: BookshelfComparisonBoxProps) {
  return (
    <div className="bg-[#0f101f] border border-[#1f1f3a] rounded-b-2xl p-4 text-xs mt-[-10px] space-y-4 shadow-inner">
      {compLoading ? (
        <div className="text-center text-slate-500 py-3">{t.comparingText || 'Đang so sánh bản dịch...'}</div>
      ) : comparisonData ? (
        <>
          <div className="pb-2 border-b border-white/5">
            <span className="text-[10px] text-brand-400 font-extrabold uppercase">{t.compFast || 'Dịch nhanh'}</span>
            <div className="text-white font-bold mt-0.5">{comparisonData.fast?.title || '—'}</div>
            <p className="text-slate-400 text-[11px] leading-relaxed mt-1">{comparisonData.fast?.desc || '—'}</p>
          </div>
          <div className="pb-2 border-b border-white/5">
            <span className="text-[10px] text-amber-400 font-extrabold uppercase">{t.compAdvanced || 'Dịch nâng cao (AI)'}</span>
            <div className="text-white font-bold mt-0.5">{comparisonData.advanced?.title || '—'}</div>
            <p className="text-slate-400 text-[11px] leading-relaxed mt-1">{comparisonData.advanced?.desc || '—'}</p>
          </div>
          <div className="pb-2 border-b border-white/5">
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase">{t.compVietphrase || 'Vietphrase'}</span>
            <div className="text-white font-bold mt-0.5">{comparisonData.vietphrase?.title || '—'}</div>
            <p className="text-slate-400 text-[11px] leading-relaxed mt-1">{comparisonData.vietphrase?.desc || '—'}</p>
          </div>
          <div>
            <span className="text-[10px] text-indigo-400 font-extrabold uppercase">{t.compHanviet || 'Hán Việt'}</span>
            <div className="text-white font-bold mt-0.5">{comparisonData.hanviet?.title || '—'}</div>
            <p className="text-slate-400 text-[11px] leading-relaxed mt-1">{comparisonData.hanviet?.desc || '—'}</p>
          </div>
        </>
      ) : (
        <div className="text-center text-red-500 py-3">{t.compError || 'Không thể tải bản dịch'}</div>
      )}
    </div>
  );
}
