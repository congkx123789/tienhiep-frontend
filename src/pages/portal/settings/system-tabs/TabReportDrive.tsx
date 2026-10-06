import React, { useState } from 'react';
import { FileSpreadsheet, Download, ShieldCheck, Database, Calendar, Filter, Sparkles, MessageSquarePlus } from 'lucide-react';
import { FeedbackReportModal } from '../../../../components/modals/report-modal';

export const TabReportDrive: React.FC = () => {
  const [reportType, setReportType] = useState<'translation' | 'system' | 'social' | 'all'>('translation');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [adminKey, setAdminKey] = useState<string>('LYVUHA_ADMIN_2026');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);

  const handleDownloadExcel = () => {
    setIsExporting(true);
    let exportUrl = `/api/admin/reports/export?type=${reportType}&admin_key=${encodeURIComponent(adminKey)}`;
    if (selectedMonth && selectedMonth !== 'all') {
      exportUrl += `&month=${encodeURIComponent(selectedMonth)}`;
    }

    // Trigger direct stream download from Server-Side Virtual Drive
    const link = document.createElement('a');
    link.href = exportUrl;
    link.setAttribute('download', `Bao_Cao_${reportType}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-800/40 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Ổ Đĩa Báo Cáo Nội Bộ (Server-Side Virtual Drive)
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Excelize Stream
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Tự động kết xuất và stream trực tiếp bảng tính Excel (.xlsx) từ cơ sở dữ liệu SQLite trong RAM mà không lưu file rác trên máy chủ.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold shadow-md transition-all cursor-pointer shrink-0"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Gửi Phản Hồi Mới</span>
          </button>
        </div>
      </div>

      {/* Export Configuration Card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800/80 pb-3">
          <Filter className="w-4 h-4 text-purple-400" />
          <span>Tùy Chọn Kết Xuất Bảng Tính Quản Trị</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Phân Loại Dữ Liệu
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="translation">📚 Lỗi Dịch Thuật (Bộ phận AI Fine-Tuning)</option>
              <option value="system">🛠️ Phản Hồi Hệ Thống (Phòng Kỹ Thuật Dev)</option>
              <option value="social">🛡️ Tố Cáo Cộng Đồng (Đội ngũ Kiểm Duyệt)</option>
              <option value="all">📦 Toàn Bộ Báo Cáo (Gộp 3 Sheets Excel)</option>
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Kỳ Báo Cáo (Tháng)
            </label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Toàn bộ thời gian (Không giới hạn)</option>
                <option value="2026-10">Tháng 10/2026 (Hiện tại)</option>
                <option value="2026-09">Tháng 09/2026</option>
                <option value="2026-08">Tháng 08/2026</option>
              </select>
              <Calendar className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Admin Security Key */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Khóa Quản Trị (X-Admin-Key)
            </label>
            <div className="relative">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Nhập khóa quản trị an ninh..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
              <ShieldCheck className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Tự động định dạng Header xanh #2B579A, căn chỉnh độ rộng cột và gán AutoFilter.</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-700/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang kết xuất...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>Xuất Bảng Tính Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Department Breakdown Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">1. Lỗi Dịch Thuật AI</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Thu thập câu gốc, câu dịch AI và câu người dùng đề xuất sửa. Dùng làm dữ liệu Dataset để Fine-tune lại mô hình CMLM & Vietphrase.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">2. Phản Hồi Kỹ Thuật Dev</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Phân mảnh theo phòng ban (UI/UX, Backend Go, Thanh toán VIP, Tính năng mới) kèm mức độ nghiêm trọng để lập tức phân công xử lý.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-1">3. Kiểm Duyệt Cộng Đồng</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Lưu vết các báo cáo vi phạm bình luận, tông môn, spam từ độc giả. Hỗ trợ đối chiếu trước khi thực hiện cấm IP hoặc khóa tài khoản.
          </p>
        </div>
      </div>

      {/* Feedback Modal Triggered on Demand */}
      <FeedbackReportModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
};
