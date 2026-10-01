import { FormEvent } from 'react';
import { Send, Image, Paperclip } from 'lucide-react';

interface ChatInputFormProps {
  typedMessage: string;
  setTypedMessage: (msg: string) => void;
  sendingMessage: boolean;
  handleSendMessage: (e?: FormEvent) => void;
}

export function ChatInputForm({
  typedMessage,
  setTypedMessage,
  sendingMessage,
  handleSendMessage,
}: ChatInputFormProps) {
  return (
    <form onSubmit={handleSendMessage} className="p-3 border-t border-[#1f1f3a] bg-[#0b0b14]/50 flex items-center gap-2 shrink-0">
      <div className="flex items-center gap-1">
        <button type="button" className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-slate-300 transition-colors" title="Đính kèm ảnh">
          <Image className="w-4 h-4" />
        </button>
        <button type="button" className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-slate-300 transition-colors" title="Đính kèm tệp">
          <Paperclip className="w-4 h-4" />
        </button>
      </div>

      <input
        type="text"
        placeholder="Nhập nội dung đàm đạo..."
        value={typedMessage}
        onChange={(e) => setTypedMessage(e.target.value)}
        className="flex-1 px-4 py-2.5 bg-[#05050a] border border-[#1f1f3a] rounded-2xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
      />

      <button
        type="submit"
        disabled={sendingMessage || !typedMessage.trim()}
        className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl transition-all disabled:opacity-40 shadow-lg shadow-purple-600/20 hover:scale-105 active:scale-95 shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
