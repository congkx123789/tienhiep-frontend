import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Languages, RefreshCw, Volume2, Copy, Check, ChevronRight } from 'lucide-react';
import api from '../../services';

export interface InlineAlignState {
  selectedText: string;
  pIdx: number;
  rawText: string;
  translatedText: string;
  x: number;
  y: number;
}

interface InlineWordAlignPopoverProps {
  state: InlineAlignState | null;
  onClose: () => void;
  onApplyWordReplacement: (pIdx: number, oldWord: string, newWord: string) => void;
  onTranslateChunk: (pIdx: number, mode: 'cmlm' | 'vietphrase' | 'hanviet' | 'raw') => void;
}

export const InlineWordAlignPopover: React.FC<InlineWordAlignPopoverProps> = ({
  state,
  onClose,
  onApplyWordReplacement,
  onTranslateChunk
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [matchedZh, setMatchedZh] = useState<string>('');
  const [hanviet, setHanviet] = useState<string>('');
  const [currentVi, setCurrentVi] = useState<string>('');
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [tokens, setTokens] = useState<Array<{ zh: string; vi: string; hanviet: string }>>([]);
  const [copied, setCopied] = useState(false);
  const [isTranslatingMode, setIsTranslatingMode] = useState<string | null>(null);

  useEffect(() => {
    if (!state || !state.selectedText.trim()) return;

    setLoading(true);
    setMatchedZh('');
    setHanviet('');
    setCurrentVi(state.selectedText);
    setAlternatives([]);
    setTokens([]);

    const fetchMatch = async () => {
      try {
        const res = await api.post('/api/translate/align', {
          zh: state.rawText || state.translatedText,
          vi: state.translatedText,
          selected: state.selectedText.trim()
        });

        if (res.data) {
          setMatchedZh(res.data.matched_zh || '');
          setHanviet(res.data.hanviet || '');
          setCurrentVi(res.data.current_vi || state.selectedText);
          setAlternatives(res.data.alternatives || []);
          if (Array.isArray(res.data.tokens)) {
            setTokens(res.data.tokens.filter((t: any) => t.zh && t.zh.trim()));
          }
        }
      } catch (err) {
        console.warn('Lỗi tra cứu đối chiếu từ:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();

    const handleMouseDownOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDownOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDownOutside);
    };
  }, [state, onClose]);

  if (!state || !state.selectedText.trim()) return null;

  const { x, y, selectedText, pIdx } = state;
  const popoverW = 340;
  const safeX = Math.max(12, Math.min(x - popoverW / 2, window.innerWidth - popoverW - 16));
  const safeY = y - 220 > 50 ? y - 230 : y + 25;

  const handleSelectAlternative = (alt: string) => {
    if (!alt || alt === selectedText) return;
    onApplyWordReplacement(pIdx, selectedText, alt);
    setCurrentVi(alt);
  };

  const handleModeChange = async (mode: 'cmlm' | 'vietphrase' | 'hanviet' | 'raw') => {
    setIsTranslatingMode(mode);
    try {
      await onTranslateChunk(pIdx, mode);
    } finally {
      setIsTranslatingMode(null);
      onClose();
    }
  };

  const handleCopyZh = async () => {
    try {
      await navigator.clipboard.writeText(matchedZh || selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        left: `${safeX}px`,
        top: `${safeY}px`,
        width: `${popoverW}px`,
        zIndex: 999999
      }}
      className="bg-[#0f1023]/95 border border-purple-500/40 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-3 text-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-2.5 text-xs select-none"
      onClick={e => e.stopPropagation()}
    >
      {/* Header Popover */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-extrabold text-[11px] text-purple-300 uppercase tracking-wider">
            Đối Chiếu Cặp Từ & Kiểu Dịch
          </span>
          {loading && <RefreshCw className="w-3 h-3 text-purple-400 animate-spin" />}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Matched Pair Block */}
      <div className="bg-[#14162e] border border-indigo-500/30 rounded-xl p-2.5 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
              🇨🇳 Chữ Hán Gốc
            </span>
            <div className="text-base font-black text-cyan-300 font-mono tracking-wide mt-0.5">
              {matchedZh || (loading ? 'Đang tìm...' : selectedText)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
              📜 Âm Hán-Việt
            </span>
            <div className="text-xs font-bold text-amber-300 font-mono mt-0.5">
              {hanviet || '—'}
            </div>
          </div>
        </div>

        <div>
          <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
            🇻🇳 Bản Dịch Hiện Tại
          </span>
          <div className="text-xs font-semibold text-emerald-300 mt-0.5 bg-black/30 px-2 py-1 rounded-lg border border-white/5">
            "{currentVi || selectedText}"
          </div>
        </div>

        {/* Danh sách lựa chọn thay thế trong từ điển */}
        {alternatives.length > 0 && (
          <div>
            <span className="text-[9px] text-indigo-300 block font-bold uppercase tracking-wider mb-1">
              💡 Các lựa chọn dịch khác (Click để đổi ngay):
            </span>
            <div className="flex flex-wrap gap-1">
              {alternatives.map((alt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAlternative(alt)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                    alt === (currentVi || selectedText)
                      ? 'bg-purple-600 text-white font-bold ring-1 ring-purple-300'
                      : 'bg-white/5 hover:bg-white/15 text-slate-200'
                  }`}
                >
                  {alt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Thanh Đổi Kiểu Dịch Đoạn Này */}
      <div className="bg-black/30 border border-white/5 rounded-xl p-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Languages className="w-3 h-3 text-purple-400" />
            Đổi kiểu dịch đoạn này:
          </span>
          {isTranslatingMode && (
            <span className="text-[9px] text-purple-300 animate-pulse font-mono">
              Đang dịch {isTranslatingMode}...
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => handleModeChange('cmlm')}
            disabled={!!isTranslatingMode}
            className="py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-[10px] font-bold transition-all text-center"
          >
            CMLM AI
          </button>
          <button
            onClick={() => handleModeChange('vietphrase')}
            disabled={!!isTranslatingMode}
            className="py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white text-[10px] font-bold transition-all text-center"
          >
            Vietphrase
          </button>
          <button
            onClick={() => handleModeChange('hanviet')}
            disabled={!!isTranslatingMode}
            className="py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white text-[10px] font-bold transition-all text-center"
          >
            Hán Việt
          </button>
          <button
            onClick={() => handleModeChange('raw')}
            disabled={!!isTranslatingMode}
            className="py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white text-[10px] font-bold transition-all text-center"
          >
            Bản Gốc
          </button>
        </div>
      </div>

      {/* Sentence Tokens Map (Ánh xạ từng cặp từ trong câu) */}
      {tokens.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-white/5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Các cặp từ trong câu (Click để đối chiếu):
          </span>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-black/40 rounded-xl border border-white/5 no-scrollbar">
            {tokens.map((tok, idx) => {
              const isCurrent = tok.zh === matchedZh || tok.vi === selectedText;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentVi(tok.vi);
                    setMatchedZh(tok.zh);
                    setHanviet(tok.hanviet);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-0.5 transition-all ${
                    isCurrent
                      ? 'bg-purple-600 text-white font-bold ring-1 ring-purple-300'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                  title={`${tok.zh} (${tok.hanviet}) ➔ ${tok.vi}`}
                >
                  <span className="text-cyan-300">{tok.zh}</span>
                  <ChevronRight className="w-2.5 h-2.5 text-slate-500" />
                  <span>{tok.vi}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
