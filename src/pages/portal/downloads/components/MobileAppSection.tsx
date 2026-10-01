import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { DownloadIcon } from '../../../../components';
import { AndroidIcon, AppleIcon } from './PlatformIcons';
import { ReleaseItem } from '../Downloads.types';

interface MobileAppSectionProps {
  androidApk: ReleaseItem;
  iosIpa: ReleaseItem;
  content: any;
}

export const MobileAppSection: React.FC<MobileAppSectionProps> = ({
  androidApk,
  iosIpa,
  content
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Android Card */}
        <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-purple-500/40 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-md">
                <AndroidIcon className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                v{androidApk.version} • {androidApk.file_size}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white group-hover:text-purple-300 transition-colors">
                Android App (.APK)
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {androidApk.release_notes || content.apkDesc}
              </p>
            </div>

            <div className="pt-2">
              <a
                href={androidApk.download_url}
                download
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-xs transition-all shadow-lg shadow-emerald-600/20"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>{content.apkBtn}</span>
              </a>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Hỗ trợ Android 8.0 trở lên
            </span>
          </div>
        </div>

        {/* iOS Card */}
        <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-purple-500/40 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-300 shadow-md">
                <AppleIcon className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-300 border border-slate-500/20">
                v{iosIpa.version} • {iosIpa.file_size}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white group-hover:text-purple-300 transition-colors">
                iOS Package (.IPA)
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {iosIpa.release_notes}
              </p>
            </div>

            <div className="pt-2">
              <a
                href={iosIpa.download_url}
                download
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-98 text-white font-extrabold text-xs transition-all shadow-lg"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>{content.ipaBtn}</span>
              </a>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Sideload (AltStore / TrollStore / Scarlet)
            </span>
          </div>
        </div>
      </div>

      {/* Sync Note Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-extrabold text-amber-300 mb-0.5">{content.noteTitle}</h4>
          <p className="text-amber-200/90 leading-relaxed">{content.noteText}</p>
        </div>
      </div>
    </div>
  );
};
