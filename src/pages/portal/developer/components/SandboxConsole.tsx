import { Play, Pause, RefreshCw, Send } from 'lucide-react';
import { useLang } from '../../../../contexts/LangContext';

interface SandboxConsoleProps {
  sandboxTtsText: string;
  setSandboxTtsText: (val: string) => void;
  sandboxTtsSpeed: number;
  setSandboxTtsSpeed: (val: number) => void;
  playingSandboxAudio: boolean;
  loadingSandboxAudio: boolean;
  runTtsSandbox: () => void;
  sandboxTransText: string;
  setSandboxTransText: (val: string) => void;
  sandboxTransMode: string;
  setSandboxTransMode: (val: string) => void;
  sandboxTransResult: string;
  translatingSandbox: boolean;
  runTranslationSandbox: () => void;
}

export function SandboxConsole({
  sandboxTtsText,
  setSandboxTtsText,
  sandboxTtsSpeed,
  setSandboxTtsSpeed,
  playingSandboxAudio,
  loadingSandboxAudio,
  runTtsSandbox,
  sandboxTransText,
  setSandboxTransText,
  sandboxTransMode,
  setSandboxTransMode,
  sandboxTransResult,
  translatingSandbox,
  runTranslationSandbox,
}: SandboxConsoleProps) {
  const { t, lang } = useLang();

  return (
    <div className="bg-[#121225]/60 border border-[#1f1f3a] rounded-3xl p-6 space-y-6">
      <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-[#1f1f3a]/50 pb-2">
        ⚡ API Sandbox & TTS Playground
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TTS Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-300">1. Text-to-Speech (TTS)</h4>
            <span className="text-[9px] bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 uppercase font-bold">Local Engine</span>
          </div>

          <textarea
            rows={4}
            value={sandboxTtsText}
            onChange={(e) => setSandboxTtsText(e.target.value)}
            placeholder="Nhập văn bản cần phát audio..."
            className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-3 text-xs text-slate-300 outline-none focus:border-purple-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold block">{t.reader?.speed || 'Tốc độ'} ({sandboxTtsSpeed}x):</label>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={sandboxTtsSpeed}
                onChange={(e) => setSandboxTtsSpeed(parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-[#0b0b14]"
              />
            </div>

            <div className="space-y-1 flex items-end">
              <button
                onClick={runTtsSandbox}
                disabled={loadingSandboxAudio}
                className="w-full bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                {loadingSandboxAudio ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : playingSandboxAudio ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                {playingSandboxAudio ? (lang === 'zh' ? '正在播放...' : lang === 'en' ? 'Playing...' : 'Đang phát...') : (lang === 'zh' ? '播放音频' : lang === 'en' ? 'Play Audio' : 'Gửi & Phát Audio')}
              </button>
            </div>
          </div>
        </div>

        {/* Translation Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-300">{lang === 'zh' ? '2. 中越翻译' : lang === 'en' ? '2. Chinese-Vietnamese Translation' : '2. Dịch thuật Trung-Việt'}</h4>
            <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">CMLM Engine</span>
          </div>

          <textarea
            rows={4}
            value={sandboxTransText}
            onChange={(e) => setSandboxTransText(e.target.value)}
            placeholder="Nhập văn bản tiếng Trung cần dịch..."
            className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-3 text-xs text-slate-300 outline-none focus:border-purple-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={sandboxTransMode}
              onChange={(e) => setSandboxTransMode(e.target.value)}
              className="bg-[#0b0b14] border border-[#1f1f3a] text-xs font-semibold rounded-xl p-2.5 text-slate-300 outline-none cursor-pointer focus:border-purple-500"
            >
              <option value="fast">{t.compFast || 'Dịch nhanh'}</option>
              <option value="vietphrase">{t.compVietphrase || 'Vietphrase'}</option>
            </select>

            <button
              onClick={runTranslationSandbox}
              disabled={translatingSandbox}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              {translatingSandbox ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {lang === 'zh' ? '翻译' : lang === 'en' ? 'Translate' : 'Dịch ngay'}
            </button>
          </div>
        </div>
      </div>

      {/* Translation Sandbox Results */}
      {sandboxTransResult && (
        <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-4 space-y-1.5 animate-in fade-in duration-200">
          <span className="text-[9px] text-slate-500 block uppercase font-extrabold tracking-wider">{lang === 'zh' ? '翻译结果' : lang === 'en' ? 'Translation Result' : 'Kết quả dịch'}</span>
          <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">{sandboxTransResult}</p>
        </div>
      )}
    </div>
  );
}
