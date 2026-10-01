import { X } from 'lucide-react';

interface BookShareModalProps {
  shareOpen: boolean;
  setShareOpen: (open: boolean) => void;
  shareMessage: string;
  setShareMessage: (msg: string) => void;
  friends: { id: number | string; username: string }[];
  sharing: boolean;
  handleShareBook: (friendId: number | string) => void;
}

export function BookShareModal({
  shareOpen,
  setShareOpen,
  shareMessage,
  setShareMessage,
  friends,
  sharing,
  handleShareBook,
}: BookShareModalProps) {
  if (!shareOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0c0d1e] border border-purple-500/35 rounded-3xl p-6 w-full max-w-sm text-slate-100 shadow-2xl relative animate-fadeIn">
        <button
          onClick={() => { setShareOpen(false); setShareMessage(''); }}
          className="absolute top-4 right-4 p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-extrabold text-sm tracking-wider uppercase mb-4 text-purple-300">Chia sẻ truyện</h3>

        <div className="space-y-3">
          <label className="block text-[10px] uppercase font-black tracking-widest text-slate-500">Lời nhắn kèm theo</label>
          <input
            type="text"
            placeholder="Ví dụ: Truyện này hay lắm, đọc đi!"
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            className="w-full px-3 py-2 bg-[#080814] border border-purple-500/20 rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="space-y-2 mt-4">
          <label className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Chọn bạn bè</label>
          {friends.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-purple-500/10 rounded-2xl text-xs text-slate-500">
              Chưa có bạn bè nào. Vui lòng kết bạn trước.
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {friends.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-2 hover:bg-purple-950/20 border border-purple-500/10 rounded-xl">
                  <span className="text-xs font-bold text-slate-200">{f.username}</span>
                  <button
                    onClick={() => handleShareBook(f.id)}
                    disabled={sharing}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                  >
                    Gửi
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
