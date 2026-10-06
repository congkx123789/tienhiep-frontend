import React, { useState } from 'react';
import { X, Send, MessageSquarePlus, CheckCircle2, AlertTriangle, Bug } from 'lucide-react';

interface FeedbackReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDepartment?: 'frontend_ui' | 'backend_api' | 'billing_payment' | 'new_feature';
}

export const FeedbackReportModal: React.FC<FeedbackReportModalProps> = ({
  isOpen,
  onClose,
  defaultDepartment = 'new_feature',
}) => {
  const [department, setDepartment] = useState(defaultDepartment);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'critical'>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Vui lòng nhập nội dung mô tả chi tiết.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/reports/system', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          department,
          severity,
          title: title.trim(),
          description: description.trim(),
          attachments: '[]',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === 'success') {
        setSuccessMessage(data.message || 'Phản hồi đã được chuyển thành công tới bộ phận kỹ thuật!');
        setTimeout(() => {
          onClose();
          setTitle('');
          setDescription('');
          setSuccessMessage(null);
        }, 1800);
      } else {
        setErrorMessage(data.error || 'Có lỗi xảy ra khi gửi phản hồi. Vui lòng thử lại!');
      }
    } catch {
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">Báo Lỗi Hệ Thống & Đóng Góp</h3>
              <p className="text-xs text-slate-400">Phân luồng trực tiếp tới từng phòng ban kỹ thuật</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Department Selection */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                Bộ phận tiếp nhận
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="frontend_ui">Giao diện (UI/UX)</option>
                <option value="backend_api">Máy chủ & API Go</option>
                <option value="billing_payment">Nạp VIP & Thanh toán</option>
                <option value="new_feature">Đề xuất tính năng mới</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                Mức độ nghiêm trọng
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="low">Thấp (Góp ý nhỏ)</option>
                <option value="medium">Trung bình (Khó chịu nhẹ)</option>
                <option value="critical">Nghiêm trọng (Không dùng được)</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              Tiêu đề vấn đề
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tóm tắt ngắn gọn vấn đề gặp phải..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-500 text-xs outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              Mô tả chi tiết
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Các bước tái hiện lỗi, thiết bị đang dùng hoặc ý tưởng giải pháp..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-500 text-xs resize-none outline-none transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Phản Hồi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
