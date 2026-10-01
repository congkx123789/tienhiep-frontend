import React from 'react';
import { 
  Tv, RefreshCw, Globe, Laptop, CheckCircle, Trash2, 
  Sparkles, ChevronRight 
} from 'lucide-react';
import { getElectronAPI } from '../../../../utils/electron';

interface TabTtsModelsProps {
  isElectron: boolean;
  downloadFolder: string;
  isCapacitor: boolean;
  pingStats: {
    trans: string;
    tts: string;
    localTts: string;
    rtf: string;
    transRtf?: string;
    isPinging: boolean;
  };
  onPingServer: () => void;
  localModels: any[];
  downloadProgress: Record<string, number>;
  onDownloadModel: (modelId: string, url: string) => void;
  onDeleteModel: (filename: string) => void;
  ttsDevice: string;
  onDeviceChange: (device: string) => void;
  deleteModal: { open: boolean; filename: string };
  setDeleteModal: (val: any) => void;
  confirmDeleteModel: () => void;
}

export const TabTtsModels: React.FC<TabTtsModelsProps> = ({
  isElectron,
  downloadFolder,
  pingStats,
  onPingServer,
  localModels,
  downloadProgress,
  onDownloadModel,
  onDeleteModel,
  ttsDevice,
  onDeviceChange,
  deleteModal,
  setDeleteModal,
  confirmDeleteModel,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-[#1f1f3a]/60 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-purple-400" /> Trung Tâm Quản Lý Trí Tuệ Nhân Tạo (AI)
            </h3>
            <p className="text-xs text-slate-400 mt-1">Kiểm tra kết nối máy chủ và quản lý kho giọng đọc Local / Đám mây.</p>
          </div>
          <div className="flex items-center gap-2">
            {isElectron && (
              <button 
                onClick={async () => {
                  const api = getElectronAPI();
                  if (api && api.openLogFolder) await api.openLogFolder();
                }}
                className="flex items-center gap-1 bg-[#1e293b] hover:bg-[#334155] text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700 transition-all cursor-pointer"
              >
                📂 MỞ THƯ MỤC LOGS
              </button>
            )}
            <button 
              onClick={onPingServer}
              disabled={pingStats.isPinging}
              className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:bg-slate-800 disabled:text-slate-500 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-500/30 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${pingStats.isPinging ? 'animate-spin' : ''}`} /> PING SERVER
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Server Status */}
          <div className="p-4 bg-[#0b0b14]/50 border border-[#1f1f3a] rounded-xl space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" /> Trạng Thái Kết Nối
            </h4>
            <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${pingStats.trans.includes('Lỗi') ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                Máy Chủ Dịch (Vietphrase)
              </span>
              <span className={`text-[10px] font-mono flex items-center gap-2 ${pingStats.trans.includes('Lỗi') ? 'text-red-400' : 'text-emerald-400'}`}>
                {pingStats.trans} {pingStats.transRtf && pingStats.transRtf !== 'Lỗi' && (
                  <span className="bg-purple-500/20 text-purple-300 px-1.5 rounded-full border border-purple-500/30" title="Tốc độ dịch">RTF: {pingStats.transRtf}</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${pingStats.tts.includes('Lỗi') ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                Máy Chủ TTS (Đọc Truyện)
              </span>
              <span className={`text-[10px] font-mono flex items-center gap-2 ${pingStats.tts.includes('Lỗi') ? 'text-red-400' : 'text-emerald-400'}`}>
                {pingStats.tts} <span className="bg-emerald-500/20 text-emerald-300 px-1.5 rounded-full border border-emerald-500/30">RTF: {pingStats.rtf}</span>
              </span>
            </div>
            <div className={`flex flex-col p-2.5 bg-white/5 rounded-lg border ${pingStats.localTts.includes('Connected') ? 'border-emerald-500/30' : 'border-red-500/20'}`}>
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${pingStats.localTts.includes('Connected') ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  Local TTS (Offline App)
                </span>
                <span className={`text-[10px] font-mono ${pingStats.localTts.includes('Connected') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pingStats.localTts}
                </span>
              </div>
            </div>
          </div>

          {/* Installed Models */}
          <div className="p-4 bg-[#0b0b14]/50 border border-[#1f1f3a] rounded-xl space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5" /> Kho Giọng Đọc (Đã Tải)
            </h4>
            
            <div className="space-y-2">
              {localModels.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-4 bg-white/5 rounded-lg border border-white/5 border-dashed">
                  Chưa có Giọng đọc AI nào được tải về máy.
                </p>
              ) : (
                localModels.map((model) => (
                  <div key={model.name} className="flex flex-col p-2.5 bg-white/5 rounded-lg border border-emerald-500/20 gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">File: {model.name}</span>
                      <span className="text-[9px] text-slate-500 bg-black/40 px-1.5 py-0.5 rounded">{model.sizeMB} MB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3"/> Đã Kích Hoạt Offline
                      </span>
                      <button onClick={() => onDeleteModel(model.name)} className="text-[10px] text-red-400 hover:text-red-300 hover:bg-red-400/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                        <Trash2 className="w-3 h-3"/> Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Device Selector */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">⚡ Chế Độ Xử Lý</h4>
              <div className="flex gap-1.5">
                {[
                  { key: 'auto', label: '🔄 Tự Động', desc: 'CPU INT8 (RTF 15x)' },
                  { key: 'gpu',  label: '🎮 GPU (CUDA)', desc: 'Model lớn FP16' },
                  { key: 'cpu',  label: '💻 CPU', desc: 'INT8 nhanh nhất' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => onDeviceChange(opt.key)}
                    className={`flex-1 p-2 rounded-lg text-center transition-all border ${
                      ttsDevice === opt.key
                        ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                        : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-bold">{opt.label}</div>
                    <div className="text-[8px] mt-0.5 opacity-70">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[9px] text-slate-500 text-center mt-2 italic">Bộ lưu trữ Model: {downloadFolder}</p>
          </div>
        </div>

        {/* Cloud Model Library */}
        <div className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Thư Viện Giọng Đọc Mới (Cloud)
            </h4>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">Mới cập nhật: 2 Model ONNX</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col p-3 bg-[#05050a]/80 rounded-xl border border-white/5 hover:border-indigo-500/50 transition-colors gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="text-xs font-bold text-white">1. Matcha-TTS Acoustic (INT8)</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mô hình tạo phổ âm từ văn bản, đã lượng hóa INT8 siêu nhẹ.</p>
                </div>
                <span className="text-[9px] text-slate-500 bg-black px-1.5 py-0.5 rounded">19.2 MB</span>
              </div>
              <button 
                onClick={() => onDownloadModel('matcha_tts_int8', 'https://huggingface.co/datasets/Cong123779/Local-TTS-Engine/resolve/main/matcha_tts_int8.onnx')}
                disabled={downloadProgress['matcha_tts_int8.onnx'] !== undefined}
                className="mt-auto w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                {downloadProgress['matcha_tts_int8.onnx'] !== undefined 
                  ? <><RefreshCw className="w-3 h-3 animate-spin"/> Đang tải... {downloadProgress['matcha_tts_int8.onnx']}%</>
                  : <><ChevronRight className="w-3 h-3 rotate-90"/> Tải Matcha-TTS ONNX</>
                }
              </button>
            </div>

            <div className="flex flex-col p-3 bg-[#05050a]/80 rounded-xl border border-white/5 hover:border-indigo-500/50 transition-colors gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="text-xs font-bold text-white">2. Vocos Vocoder (INT8)</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mô hình giải mã phổ âm thành sóng âm thanh chất lượng cao.</p>
                </div>
                <span className="text-[9px] text-slate-500 bg-black px-1.5 py-0.5 rounded">13.0 MB</span>
              </div>
              <button 
                onClick={() => onDownloadModel('vocos_decoupled_int8', 'https://huggingface.co/datasets/Cong123779/Local-TTS-Engine/resolve/main/vocos_decoupled_int8.onnx')}
                disabled={downloadProgress['vocos_decoupled_int8.onnx'] !== undefined}
                className="mt-auto w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                {downloadProgress['vocos_decoupled_int8.onnx'] !== undefined 
                  ? <><RefreshCw className="w-3 h-3 animate-spin"/> Đang tải... {downloadProgress['vocos_decoupled_int8.onnx']}%</>
                  : <><ChevronRight className="w-3 h-3 rotate-90"/> Tải Vocos Vocoder ONNX</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-[#12121f] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-red-500/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Xóa Giọng Đọc AI</h3>
                  <p className="text-[10px] text-slate-400">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 mb-5">
                Bạn có chắc chắn muốn xóa vĩnh viễn tệp <span className="text-red-400 font-bold">{deleteModal.filename}</span> khỏi ổ đĩa không?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ open: false, filename: '' })} className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-colors">
                  Hủy Bỏ
                </button>
                <button onClick={confirmDeleteModel} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1">
                  <Trash2 className="w-3 h-3" /> Xóa Vĩnh Viễn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
