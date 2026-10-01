import { FormEvent } from 'react';
import { MessageSquare, ThumbsUp, Send } from 'lucide-react';
import { CommentItem } from '../BookDetail.types';

interface BookCommentsSectionProps {
  comments: CommentItem[];
  likedComments: Set<number>;
  newCommentText: string;
  setNewCommentText: (text: string) => void;
  newCommentRating: number;
  setNewCommentRating: (rating: number) => void;
  handleAddComment: (e: FormEvent) => void;
  handleLikeComment: (id: number) => void;
}

export function BookCommentsSection({
  comments,
  likedComments,
  newCommentText,
  setNewCommentText,
  newCommentRating,
  setNewCommentRating,
  handleAddComment,
  handleLikeComment,
}: BookCommentsSectionProps) {
  return (
    <div className="bg-[#121225]/60 border border-[#1f1f3a] rounded-3xl p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-[#1f1f3a]/60 pb-4">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <MessageSquare className="w-4.5 h-4.5 text-purple-400" /> Bình luận & Đánh giá ({comments.length})
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400 font-bold text-sm">⭐ 4.8</span>
          <span className="text-slate-500 text-[11px]">(145 bình chọn)</span>
        </div>
      </div>

      {/* Comment Submission Form */}
      <form onSubmit={handleAddComment} className="bg-[#0b0b14]/40 border border-[#1f1f3a] p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-semibold">Viết nhận xét của bạn:</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 mr-1">Đánh giá sao:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewCommentRating(star)}
                className={`text-sm transition-colors ${
                  star <= newCommentRating ? 'text-amber-400' : 'text-slate-600 hover:text-slate-500'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Nhập cảm nhận của bạn về bản dịch, cốt truyện..."
            rows={3}
            className="w-full bg-[#121225] border border-[#1f1f3a] rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-purple-500/50 transition-colors resize-none placeholder-slate-600"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/30 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Send className="w-3.5 h-3.5" /> Gửi bình luận
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-[#1f1f3a]/40 pb-4 last:border-b-0 last:pb-0 flex gap-3.5">
            <img
              src={comment.avatar}
              alt={comment.user}
              className="w-9 h-9 rounded-full object-cover border border-[#2d2d55] bg-[#0f0f1a] shrink-0"
            />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">{comment.user}</span>
                  <div className="flex text-amber-400 text-[10px]">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i}>{i < comment.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500">{comment.time}</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{comment.text}</p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold transition-colors ${
                    likedComments.has(comment.id) ? 'text-purple-400' : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <ThumbsUp className="w-3 h-3" /> Hữu ích ({comment.likes})
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
