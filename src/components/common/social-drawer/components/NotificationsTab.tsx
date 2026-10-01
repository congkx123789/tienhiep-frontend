import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, BookOpen } from 'lucide-react';
import { NotifItem } from '../SocialDrawer.types';

interface NotificationsTabProps {
  personalNotifs: NotifItem[];
  onReadNotification: (id: string | number) => void;
  onRespondRequest: (senderId: string | number, action: 'accept' | 'reject') => void;
  onClose: () => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  personalNotifs,
  onReadNotification,
  onRespondRequest,
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Yêu cầu & Hoạt động</h4>
      {personalNotifs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-purple-500/10 rounded-2xl text-xs text-slate-500">
          Không có thông báo mới.
        </div>
      ) : (
        personalNotifs.map(notif => (
          <div 
            key={notif.id}
            className={`p-3 border rounded-xl space-y-2 transition-all ${
              notif.is_read 
                ? 'bg-[#080814]/40 border-purple-500/5 text-slate-400' 
                : 'bg-purple-950/10 border-purple-500/30 text-slate-200 shadow-lg shadow-purple-950/10'
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <p className="text-xs leading-relaxed">{notif.message}</p>
              {!notif.is_read && (
                <button 
                  type="button"
                  onClick={() => onReadNotification(notif.id)}
                  className="text-[9px] text-purple-400 hover:text-purple-300 underline shrink-0"
                >
                  Đã đọc
                </button>
              )}
            </div>

            {notif.type === 'friend_request' && !notif.is_read && (
              <div className="flex items-center gap-2 pt-1">
                <button 
                  type="button"
                  onClick={() => onRespondRequest(notif.sender_id!, 'accept')}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition-colors"
                >
                  <Check className="w-3 h-3" /> Đồng ý
                </button>
                <button 
                  type="button"
                  onClick={() => onRespondRequest(notif.sender_id!, 'reject')}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#121225] border border-[#1f1f3a] text-slate-300 hover:bg-slate-800 rounded-lg text-[10px] font-bold transition-colors"
                >
                  <X className="w-3 h-3" /> Từ chối
                </button>
              </div>
            )}

            {notif.type === 'book_share' && notif.related_id && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/book/${notif.related_id}`);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-md mt-1"
              >
                <BookOpen className="w-3 h-3" />
                <span>Đọc truyện ngay</span>
              </button>
            )}

            <span className="block text-[8px] text-slate-500 italic">
              {new Date(notif.created_at).toLocaleString()}
            </span>
          </div>
        ))
      )}
    </div>
  );
};
