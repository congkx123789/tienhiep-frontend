import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SectLibraryTabProps {
  sectBooks: any[];
  userBookshelf: any[];
  myRole: string;
  myUserId?: number | string;
  onShareBook: (bookId: any) => void;
  onRemoveBook: (bookId: number, title: string) => void;
  onOpenShareModal: () => void;
}

export const SectLibraryTab: React.FC<SectLibraryTabProps> = ({
  sectBooks,
  userBookshelf,
  myRole,
  myUserId,
  onShareBook,
  onRemoveBook,
  onOpenShareModal
}) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const canManage = ['leader', 'vice_leader', 'elder'].includes(myRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" /> Tàng Kinh Các ({sectBooks?.length || 0})
          </h3>
          <p className="text-xs text-slate-400 mt-1">Nơi lưu trữ và chia sẻ công pháp tu tiên của các môn đồ.</p>
        </div>
        <button
          onClick={() => { onOpenShareModal(); setShowModal(true); }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Đóng góp bí kíp
        </button>
      </div>

      {sectBooks?.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-[#121225]/40 rounded-2xl border border-white/5 space-y-2">
          <BookOpen className="w-10 h-10 mx-auto opacity-40 text-purple-400" />
          <p className="text-xs">Tàng Kinh Các hiện chưa có bộ truyện nào. Hãy là người đầu tiên đóng góp!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sectBooks?.map((b) => {
            const canRemove = canManage || b.added_by === myUserId;
            return (
              <div key={b.id} className="p-4 rounded-2xl bg-[#121225]/80 border border-[#1f1f3a] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3">
                <div className="flex gap-3">
                  {b.cover ? (
                    <img src={b.cover} alt={b.title} className="w-16 h-22 object-cover rounded-xl shrink-0 border border-white/10" />
                  ) : (
                    <div className="w-16 h-22 rounded-xl bg-purple-950/40 flex items-center justify-center text-purple-400 font-bold shrink-0">
                      📖
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{b.title_vietphrase || b.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">✍ {b.author_hanviet || b.author}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-300">
                      {b.categories || 'Tu Tiên'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                  <button
                    onClick={() => navigate(`/book/${b.id}`)}
                    className="text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-1"
                  >
                    Xem truyện <ExternalLink className="w-3 h-3" />
                  </button>
                  {canRemove && (
                    <button
                      onClick={() => onRemoveBook(b.id, b.title)}
                      className="text-slate-500 hover:text-rose-400"
                      title="Gỡ khỏi thư viện"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#131324] border border-purple-500/30 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-sm font-extrabold text-white">Chọn truyện từ Tủ Sách của bạn</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {userBookshelf?.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Tủ sách cá nhân của bạn đang trống.</p>
              ) : (
                userBookshelf?.map((b) => (
                  <div key={b.book_id} className="p-2.5 rounded-xl bg-[#0b0b14] border border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">{b.title_vietphrase || b.title}</span>
                    <button
                      onClick={() => { onShareBook(b.book_id); setShowModal(false); }}
                      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold"
                    >
                      Đóng góp
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
