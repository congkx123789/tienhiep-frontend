import { Terminal } from 'lucide-react';
import { useLang } from '../../../../contexts/LangContext';

export function ApiDocsCard() {
  const { t } = useLang();

  return (
    <div className="bg-[#121225]/60 border border-[#1f1f3a] rounded-3xl p-5 shadow-xl space-y-4">
      <h3 className="text-xs font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 flex items-center gap-1.5">
        <Terminal className="w-4 h-4 text-amber-400" /> {t.developer?.apiDocsTitle || 'Tài liệu tích hợp (cURL)'}
      </h3>

      <div className="space-y-3.5">
        <div className="space-y-1">
          <span className="text-[9px] text-slate-400 font-extrabold uppercase">{t.developer?.ttsEndpoint || '1. Chuyển Text thành Audio (OpenAI format)'}</span>
          <div className="bg-[#0b0b14] border border-white/5 p-3 rounded-xl relative">
            <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto whitespace-pre leading-relaxed select-all">
{`curl -X POST http://localhost:5051/v1/audio/speech \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "Nhập văn bản cần phát", "speed": 1.0}' \\
  --output audio.wav`}
            </pre>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-slate-400 font-extrabold uppercase">{t.developer?.transEndpoint || '2. API Dịch Thuật Trung-Việt'}</span>
          <div className="bg-[#0b0b14] border border-white/5 p-3 rounded-xl relative">
            <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto whitespace-pre leading-relaxed select-all">
{`curl -X POST http://localhost:5051/api/v1/translate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"texts": ["第1章", "开封神殿"], "mode": "fast"}'`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
