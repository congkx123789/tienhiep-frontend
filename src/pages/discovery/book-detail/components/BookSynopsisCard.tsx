import { ChevronDown, ChevronUp } from 'lucide-react';

interface BookSynopsisCardProps {
  displayDescription: string;
  expandedDesc: boolean;
  setExpandedDesc: (expanded: boolean) => void;
}

export function BookSynopsisCard({
  displayDescription,
  expandedDesc,
  setExpandedDesc,
}: BookSynopsisCardProps) {
  return (
    <div className="bg-[#121225]/60 border border-[#1f1f3a] rounded-3xl p-6">
      <h3 className="text-base font-extrabold text-white mb-3">Tóm tắt nội dung</h3>
      <div className="text-slate-300 text-xs leading-relaxed space-y-2 relative">
        <p className={expandedDesc ? '' : 'line-clamp-4'}>
          {displayDescription}
        </p>
        {displayDescription && (
          <button
            onClick={() => setExpandedDesc(!expandedDesc)}
            className="mt-2 text-purple-400 font-bold inline-flex items-center gap-1 text-[11px] hover:underline"
          >
            {expandedDesc ? (
              <>Thu gọn <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>Xem thêm <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
