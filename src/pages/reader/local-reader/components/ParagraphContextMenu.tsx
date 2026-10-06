import React, { useEffect, useState, useMemo } from 'react';
import { Play, X, RefreshCw } from 'lucide-react';

export interface ParagraphMenuState {
  pIdx: number;
  translatedText: string;
  rawText: string;
  x: number;
  y: number;
}

export interface WordToken {
  zh: string;
  vi: string;
  hanviet: string;
  alternatives: string[];
  source?: string;
  confidence?: string;
  candidates?: string;
}

interface ParagraphContextMenuProps {
  menu: ParagraphMenuState | null;
  translateMode?: string;
  reportEmail?: string;
  onClose: () => void;
  onPlayFromHere: (pIdx: number, text: string) => void;
  onSaveParagraphEdit?: (pIdx: number, newText: string) => void;
}

const CPP_MODES = [
  { id: 4, label: 'Mode 4 (Hybrid C++)' },
  { id: 1, label: 'Mode 1 (Tiên Hiệp)' },
  { id: 2, label: 'Mode 2 (Anime)' },
  { id: 3, label: 'Mode 3 (Phương Tây)' },
];

export const ParagraphContextMenu: React.FC<ParagraphContextMenuProps> = ({
  menu,
  onClose,
  onPlayFromHere,
  onSaveParagraphEdit,
}) => {
  const [selectedCppMode, setSelectedCppMode] = useState<number>(4);
  const [tokens, setTokens] = useState<WordToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<WordToken | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [wordMode, setWordMode] = useState<'phrase' | 'char'>('phrase');

  const hasChinese = useMemo(() => {
    if (!menu?.rawText) return false;
    return /[\u4e00-\u9fa5]/.test(menu.rawText);
  }, [menu?.rawText]);

  useEffect(() => {
    if (!menu) { setTokens([]); setSelectedToken(null); return; }
    setCopiedType(null);
    fetchTokens(menu.rawText, menu.translatedText, selectedCppMode);
  }, [menu, selectedCppMode]);

  const fetchTokens = async (raw: string, trans: string, mode: number) => {
    setIsLoading(true);
    try {
      const endpoints = ['http://127.0.0.1:5051/api/translate/align', '/api/translate/align'];
      let data: any = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zh: raw, vi: trans, mode }),
          });
          if (res.ok) {
            data = await res.json();
            if (data?.tokens?.length > 0) break;
          }
        } catch {}
      }
      if (data?.tokens?.length > 0) {
        const validTokens: WordToken[] = data.tokens.filter((t: any) => t.zh && t.zh.trim());
        setTokens(validTokens);
        if (validTokens.length > 0) setSelectedToken(validTokens[0]);
      } else {
        setTokens([]); setSelectedToken(null);
      }
    } catch {
      setTokens([]); setSelectedToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: number) => {
    setSelectedCppMode(newMode);
    if (menu && hasChinese) fetchTokens(menu.rawText, menu.translatedText, newMode);
  };

  const charTokens = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];
    const list: WordToken[] = [];
    for (const t of tokens) {
      if (t.zh.length <= 1) list.push(t);
      else {
        const chars = Array.from(t.zh);
        const hvParts = t.hanviet ? t.hanviet.split(/\s+/) : [];
        chars.forEach((c, idx) => {
          list.push({ zh: c, vi: hvParts[idx] || t.vi, hanviet: hvParts[idx] || '', alternatives: hvParts[idx] ? [hvParts[idx]] : [t.vi] });
        });
      }
    }
    return list;
  }, [tokens]);

  const activeTokens = wordMode === 'char' ? charTokens : tokens;

  const handleCopy = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1500);
  };

  const handleApplyAlternative = (token: WordToken, alt: string) => {
    if (!menu) return;
    const oldVi = token.vi;
    let newTrans = menu.translatedText;
    newTrans = oldVi && newTrans.includes(oldVi) ? newTrans.replace(oldVi, alt) : newTrans + ' ' + alt;
    if (onSaveParagraphEdit) onSaveParagraphEdit(menu.pIdx, newTrans);
    const updated = { ...token, vi: alt };
    setSelectedToken(updated);
    setTokens(prev => prev.map(t => (t.zh === token.zh ? updated : t)));
  };

  if (!menu) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100000] bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] text-slate-800 transition-all select-none"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <div className="h-10 px-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button onClick={onClose} className="shrink-0 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded" title="Đóng">
          <X className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPlayFromHere(menu.pIdx, menu.translatedText)}
          className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-purple-600 hover:bg-purple-700 text-white"
          title="Phát đọc từ đoạn này"
        >
          <Play className="w-2.5 h-2.5 fill-current" />
          <span>Phát</span>
        </button>

        {(hasChinese || tokens.length > 0) && (
          <>
            <div className="shrink-0 inline-flex items-center rounded border border-slate-200 bg-slate-50 p-0.5 text-[10px] font-medium">
              <button
                type="button"
                onClick={() => setWordMode('phrase')}
                className={`px-1.5 py-0.5 rounded transition-all ${wordMode === 'phrase' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Cụm từ
              </button>
              <button
                type="button"
                onClick={() => setWordMode('char')}
                className={`px-1.5 py-0.5 rounded transition-all ${wordMode === 'char' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Từ đơn
              </button>
            </div>
            <select
              value={selectedCppMode}
              onChange={e => handleModeChange(Number(e.target.value))}
              className="shrink-0 text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-600 font-medium cursor-pointer"
            >
              {CPP_MODES.map(m => (<option key={m.id} value={m.id}>{m.label}</option>))}
            </select>
            <span className="shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 border-l border-slate-200">CHỌN CỤM:</span>

            {isLoading ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 animate-pulse pl-1">
                <RefreshCw className="w-3 h-3 animate-spin text-purple-600" />
                <span className="text-[11px]">Đang phân tích...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 py-0.5">
                {activeTokens.map((tok, idx) => {
                  const isSelected = selectedToken?.zh === tok.zh;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedToken(tok)}
                      className={`shrink-0 flex flex-col items-center justify-center px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                        isSelected ? 'border-purple-500 bg-purple-50/80 ring-1 ring-purple-400 text-purple-900 shadow-xs' : 'border-slate-200 bg-white hover:border-purple-300 text-slate-700'
                      }`}
                    >
                      <span className="text-[11px] font-bold leading-none tracking-tight">{tok.zh}</span>
                      <span className="text-[9px] text-slate-500 leading-none mt-0.5 truncate max-w-[70px]">{tok.vi || tok.hanviet}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!hasChinese && tokens.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-600 pl-1">
            <span className="truncate max-w-xl">{menu.translatedText}</span>
            <span className="text-[10px] text-slate-400 italic shrink-0">• Tiếng Việt</span>
          </div>
        )}
      </div>

      {(hasChinese || tokens.length > 0) && selectedToken && (
        <div className="h-7 px-3 border-t border-slate-100 flex items-center justify-between gap-3 text-[11px] bg-slate-50/70">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-slate-500 font-medium">
              Cụm: <strong className="text-purple-900 font-bold">{selectedToken.zh}</strong>
              {selectedToken.hanviet && <span className="text-slate-400 ml-1">({selectedToken.hanviet})</span>}
            </span>
            <span className="text-slate-400 border-l border-slate-200 pl-2">Đổi nghĩa:</span>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-purple-100/70 text-purple-800 font-semibold border border-purple-200">
                "{selectedToken.vi}"
              </span>
              {selectedToken.alternatives && selectedToken.alternatives.filter(alt => alt && alt !== selectedToken.vi).slice(0, 4).map((alt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyAlternative(selectedToken, alt)}
                  className="px-1.5 py-0.5 rounded bg-white hover:bg-purple-100 hover:text-purple-800 text-slate-600 border border-slate-200 cursor-pointer"
                  title={`Đổi sang: "${alt}" trong câu`}
                >
                  {alt}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(`${selectedToken.zh} (${selectedToken.vi})`, 'word')}
            className="shrink-0 text-[10px] text-slate-500 hover:text-purple-700 font-medium cursor-pointer"
          >
            {copiedType === 'word' ? '✓ Đã chép' : 'Sao chép cụm'}
          </button>
        </div>
      )}
    </div>
  );
};
