import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface LogConsoleProps {
  onClose: () => void;
}

export const LogConsole: React.FC<LogConsoleProps> = ({ onClose }) => {
  const [logs, setLogs] = useState('Đang tải nhật ký...');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const win = window as any;
      if (win.electron?.getLogContent) {
        const content = await win.electron.getLogContent();
        setLogs(content || 'Chưa có nhật ký ghi nhận.');
      } else {
        setLogs('Chỉ hoạt động trên ứng dụng Desktop.');
      }
    } catch (err: any) {
      setLogs(`Lỗi tải log: ${err.message}`);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa sạch nhật ký hiện tại?')) return;
    try {
      const win = window as any;
      if (win.electron?.clearLog) {
        const success = await win.electron.clearLog();
        if (success) {
          setLogs('Đã xóa nhật ký cũ.\n');
        } else {
          alert('Xóa log thất bại.');
        }
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const openLogFolder = () => {
    const win = window as any;
    if (win.electron?.openLogFolder) {
      win.electron.openLogFolder();
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-80 bg-[#09090f] border-t-2 border-purple-600 shadow-[0_-15px_30px_rgba(0,0,0,0.8)] z-[999] flex flex-col text-slate-200 font-mono text-[11px] animate-slideUp">
      <div className="h-10 bg-[#12121f] px-4 flex items-center justify-between border-b border-indigo-950/40 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="font-extrabold text-xs uppercase tracking-wider text-purple-300">Nhật Ký Hệ Thống / Log Console</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchLogs} 
            className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 rounded text-slate-300 hover:text-white transition-all text-[10px] font-bold"
          >
            Làm mới
          </button>
          <button 
            onClick={clearLogs} 
            className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 rounded text-rose-300 hover:text-rose-200 transition-all text-[10px] font-bold"
          >
            Xóa log
          </button>
          <button 
            onClick={openLogFolder} 
            className="px-2.5 py-1 bg-slate-700/40 hover:bg-slate-700/60 rounded text-slate-300 hover:text-white transition-all text-[10px] font-bold"
          >
            Mở thư mục
          </button>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors text-[10px] font-bold">
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={(e) => setAutoScroll(e.target.checked)} 
              className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 w-3 h-3" 
            />
            <span>Cuộn tự động</span>
          </label>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div 
        ref={logContainerRef} 
        className="flex-1 p-4 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text bg-[#07070a] border-none outline-none text-slate-300 hover:text-white transition-colors scrollbar-thin"
        style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}
      >
        {logs}
      </div>
    </div>
  );
};
