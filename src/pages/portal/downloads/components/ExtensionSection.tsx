import React, { useState } from 'react';
import { ChevronRight, Info, CheckCircle2, ChevronDown } from 'lucide-react';
import { DownloadIcon } from '../../../../components';
import { ChromeIcon } from './PlatformIcons';
import { ReleaseItem } from '../Downloads.types';

interface ExtensionSectionProps {
  extension: ReleaseItem;
  content: any;
  lang: string;
}

export const ExtensionSection: React.FC<ExtensionSectionProps> = ({
  extension,
  content,
  lang
}) => {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/40 transition-all">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-md">
            <ChromeIcon className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            v{extension.version} • {extension.file_size}
          </span>
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-white group-hover:text-purple-300 transition-colors">
            {content.extensionTitle}
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {content.extensionDesc}
          </p>
        </div>

        <div className="pt-2">
          <a
            href={extension.download_url}
            download
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-extrabold text-xs transition-all shadow-lg shadow-purple-600/20"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>{content.extensionBtn}</span>
          </a>
        </div>

        <button
          onClick={() => setShowSteps(v => !v)}
          className="w-full flex items-center justify-between pt-3 border-t border-white/5 text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-purple-400" />
            {content.extensionStepHeader}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSteps ? 'rotate-180' : ''}`} />
        </button>

        {showSteps && (
          <ol className="space-y-2.5 bg-[#0a0a14] p-4 rounded-2xl border border-white/5 text-[11px] text-slate-300 animate-fadeIn">
            {content.extSteps.map((step: string, idx: number) => (
              <li key={idx} className="flex gap-2.5 items-start">
                <span className="w-4 h-4 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Chrome, Edge, Brave, Cốc Cốc
        </span>
      </div>
    </div>
  );
};
