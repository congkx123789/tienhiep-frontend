import React from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';

interface AdminReleaseModalProps {
  adminPlat: string;
  setAdminPlat: (p: string) => void;
  adminVersion: string;
  setAdminVersion: (v: string) => void;
  adminUrl: string;
  setAdminUrl: (u: string) => void;
  adminSize: string;
  setAdminSize: (s: string) => void;
  adminNotes: string;
  setAdminNotes: (n: string) => void;
  updating: boolean;
  statusMsg: string;
  onUpdateRelease: (e: React.FormEvent) => void;
  onAutoFill: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AdminReleaseModal: React.FC<AdminReleaseModalProps> = ({
  adminPlat,
  setAdminPlat,
  adminVersion,
  setAdminVersion,
  adminUrl,
  setAdminUrl,
  adminSize,
  setAdminSize,
  adminNotes,
  setAdminNotes,
  updating,
  statusMsg,
  onUpdateRelease,
  onAutoFill
}) => {
  return (
    <div className="bg-[#121225]/90 border border-purple-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl mt-12 space-y-6">
      <div className="flex items-center gap-2.5 text-purple-300 font-extrabold text-sm uppercase tracking-wider">
        <Settings className="w-5 h-5 text-purple-400" />
        <span>Bảng Quản Trị Cập Nhật Phiên Bản (Admin Only)</span>
      </div>

      <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl text-xs space-y-2">
        <label className="block text-slate-300 font-bold">Nạp nhanh từ tệp AppImage / APK / EXE:</label>
        <input 
          type="file" 
          onChange={onAutoFill}
          className="text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
        />
      </div>

      <form onSubmit={onUpdateRelease} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Nền tảng</label>
            <select
              value={adminPlat}
              onChange={(e) => setAdminPlat(e.target.value)}
              className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
            >
              <option value="extension">Chrome Extension</option>
              <option value="desktop_linux">Linux AppImage</option>
              <option value="desktop_windows">Windows Client</option>
              <option value="android_apk">Android APK</option>
              <option value="ios_ipa">iOS IPA</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Phiên bản (Version)</label>
            <input
              type="text"
              value={adminVersion}
              onChange={(e) => setAdminVersion(e.target.value)}
              placeholder="vd: 1.0.1"
              className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Dung lượng (File size)</label>
            <input
              type="text"
              value={adminSize}
              onChange={(e) => setAdminSize(e.target.value)}
              placeholder="vd: 116 MB"
              className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Link tải về (Download URL)</label>
            <input
              type="text"
              value={adminUrl}
              onChange={(e) => setAdminUrl(e.target.value)}
              placeholder="URL tải trực tiếp"
              className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 font-bold mb-1">Ghi chú phát hành (Release Notes)</label>
          <textarea
            rows={2}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Nội dung cập nhật tính năng mới..."
            className="w-full bg-[#0b0b14] border border-[#1f1f3a] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] font-bold text-amber-400">{statusMsg}</span>
          <button
            type="submit"
            disabled={updating}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md"
          >
            {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Lưu Phiên Bản</span>
          </button>
        </div>
      </form>
    </div>
  );
};
