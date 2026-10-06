import { useNavigate } from 'react-router-dom';
import { Share2, BookOpen } from 'lucide-react';
import { ChatMessage } from '../Messages.types';

interface ChatMessageBubbleProps {
  msg: ChatMessage;
  isMe: boolean;
  lang: string;
}

export function ChatMessageBubble({ msg, isMe, lang }: ChatMessageBubbleProps) {
  const navigate = useNavigate();

  const renderMessageContent = (msgStr: string) => {
    if (!msgStr) return null;

    const isShare = msgStr.includes('[Chia sẻ truyện]') || msgStr.includes('/book/');
    if (isShare) {
      let title = 'Truyện được chia sẻ';
      const titleMatch = msgStr.match(/\[Chia sẻ truyện\]\s*['"“](.*?)['"”]/i) || msgStr.match(/\[Chia sẻ truyện\]\s*(.*?)(?:\s*-\s*Xem|\s*\n|$)/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      } else {
        const firstPart = msgStr.split(' - ')[0].replace('[Chia sẻ truyện]', '').replace(/['"]/g, '').trim();
        if (firstPart) title = firstPart;
      }

      let bookId = '';
      const idMatch = msgStr.match(/\/book\/([a-zA-Z0-9_\-]+)/);
      if (idMatch && idMatch[1]) {
        bookId = idMatch[1].trim();
      }

      let note = '';
      const noteMatch = msgStr.match(/Lời nhắn:\s*["“']?(.*?)["”']?$/im);
      if (noteMatch && noteMatch[1]) {
        note = noteMatch[1].trim();
      }

      if (bookId) {
        return (
          <div className="p-3 bg-purple-900/40 border border-purple-500/30 rounded-2xl space-y-2.5 max-w-sm shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Share2 className="w-3 h-3" />
                  {lang === 'vi' ? 'Chia sẻ truyện' : 'Shared novel'}
                </span>
                <span className="text-xs font-black text-white block mt-1 leading-snug">{title}</span>
              </div>
            </div>

            {note && (
              <p className="text-[11px] text-slate-300 bg-black/30 p-2 rounded-xl border border-white/5 italic">
                "{note}"
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate(`/book/${bookId}`)}
              className="w-full py-1.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-black shadow-md active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Mở đọc ngay' : 'Read now'}</span>
            </button>
          </div>
        );
      }
    }

    return <p className="text-xs whitespace-pre-wrap leading-relaxed select-text">{msgStr}</p>;
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[70%] sm:max-w-[60%] space-y-1">
        {!isMe && msg.sender_name && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[10px] font-black text-purple-400">@{msg.sender_name}</span>
            {msg.vip_status === 1 && (
              <span className="text-[8px] px-1.5 py-0.2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black rounded-full uppercase shadow-sm">
                VIP
              </span>
            )}
          </div>
        )}
        <div
          className={`p-3 rounded-2xl shadow-md ${
            isMe
              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-br-none'
              : 'bg-[#121225] border border-[#1f1f3a] text-slate-200 rounded-bl-none'
          }`}
        >
          {renderMessageContent(msg.message)}
        </div>
        <span className={`text-[8px] text-slate-600 block ${isMe ? 'text-right' : 'text-left'}`}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
