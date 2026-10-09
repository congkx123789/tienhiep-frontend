import React, { useState } from 'react';
import { X, Send, Sparkles, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import api from '../../../services/core/api';

interface TranslationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  currentTranslation: string;
  bookId?: number;
  chapterId?: number;
  engineUsed?: string;
}

export const TranslationReportModal: React.FC<TranslationReportModalProps> = ({
  isOpen,
  onClose,
  originalText,
  currentTranslation,
  bookId = 0,
  chapterId = 0,
  engineUsed = 'cmlm_v1',
}) => {
  const [suggestedFix, setSuggestedFix] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedFix.trim()) {
      setErrorMessage('Vui lòng nhập câu dịch đề xuất của bạn.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.post('/api/reports/translation', {
        book_id: bookId,
        chapter_id: chapterId,
        original_text: originalText,
        current_translation: currentTranslation,
        suggested_fix: suggestedFix.trim(),
        engine_used: engineUsed,
      });

      const data = res.data || {};
      if (data.status === 'success' || res.status === 200 || res.status === 201) {
        setSuccessMessage(data.message || 'Đã ghi nhận đóng góp sửa lỗi dịch thành công!');
        setTimeout(() => {
          onClose();
          setSuggestedFix('');
          setSuccessMessage(null);
        }, 1800);
      } else {
        setErrorMessage(data.error || 'Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại!');
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!');
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
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">Báo Lỗi & Đề Xuất Sửa Bản Dịch</h3>
              <p className="text-xs text-slate-400">Đóng góp trực tiếp vào bộ tinh hoa huấn luyện AI</p>
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

          {/* Raw Text Context */}
          {originalText && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Văn bản gốc (Raw / Hán văn)</span>
                <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Tự động chộp</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-amber-200/90 font-mono select-all">
                {originalText}
              </div>
            </div>
          )}

          {/* Current AI Translation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Bản dịch hiện tại (Đang bị lỗi)</span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{engineUsed}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 italic">
              "{currentTranslation}"
            </div>
          </div>

          {/* Suggested Fix */}
          <div>
            <label className="block text-[11px] font-medium text-purple-300 uppercase tracking-wider mb-1">
              Đề xuất sửa lại thành (Chuẩn ngữ cảnh):
            </label>
            <textarea
              rows={3}
              required
              value={suggestedFix}
              onChange={(e) => setSuggestedFix(e.target.value)}
              placeholder="Ví dụ: Chỗ này phải dịch là Tông Chủ, không phải Giám Đốc..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-100 placeholder-slate-500 text-xs resize-none outline-none transition-all"
            />
          </div>

          {/* Meta Info */}
          {(bookId > 0 || chapterId > 0) && (
            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Truyện ID: #{bookId}</span>
              <span>• Chương: #{chapterId}</span>
            </div>
          )}

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
              disabled={isSubmitting || !suggestedFix.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Đóng Góp Sửa Lỗi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
