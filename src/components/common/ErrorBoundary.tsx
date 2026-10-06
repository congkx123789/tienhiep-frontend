import React from 'react';
import api from '../../services';
import { submitReportWithFallback } from '../../services/reportFallbackService';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
  errorInfo: any;
  copied: boolean;
  sentToServer: boolean;
  isReporting: boolean;
  reported: boolean;
  reportMsg: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      sentToServer: false,
      isReporting: false,
      reported: false,
      reportMsg: '',
    };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    const errorPayload = {
      message: error?.toString() || 'Unknown Error',
      stack: errorInfo?.componentStack || error?.stack || '',
      url: window.location.href,
      userAgent: navigator.userAgent,
      time: new Date().toISOString()
    };

    try {
      localStorage.setItem('last_app_error', JSON.stringify(errorPayload));
    } catch (_) {}

    try {
      api.post('/api/logs/error', errorPayload)
        .then(() => this.setState({ sentToServer: true }))
        .catch(() => {});
    } catch(e) {
      console.error("Failed to dispatch client error log:", e);
    }
  }

  handleCopy = () => {
    const text = `[ERROR]: ${this.state.error?.toString()}\n[URL]: ${window.location.href}\n[STACK]:\n${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  handleReportAdmin = async () => {
    this.setState({ isReporting: true });
    try {
      const err = this.state.error;
      const stack = this.state.errorInfo?.componentStack || err?.stack || '';
      const res = await submitReportWithFallback({
        type: 'crash',
        severity: 'critical',
        title: `Ứng dụng gặp sự cố: ${err?.message || err?.toString() || 'React Render Crash'}`,
        description: `Sự cố giao diện: ${err?.toString()}\n\nComponent Stack:\n${stack.substring(0, 500)}`,
        metadata: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          crash_time: new Date().toISOString()
        }
      });
      this.setState({ reported: true, reportMsg: res.message });
    } catch (_) {
      this.setState({ reported: true, reportMsg: 'Đã lưu báo cáo vào bộ nhớ đệm an toàn.' });
    } finally {
      this.setState({ isReporting: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0b14] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-2xl w-full bg-[#121225] border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl shrink-0">
                🔥
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-red-400">
                  Hệ thống gặp sự cố bất ngờ!
                </h1>
                <p className="text-slate-400 text-xs mt-0.5">
                  Giao diện đang xem vừa gặp ngoại lệ. Bạn có thể khôi phục trang hoặc gửi báo cáo trực tiếp tới đội ngũ kỹ thuật.
                </p>
              </div>
            </div>

            <div className="bg-[#0b0b14] p-4 rounded-2xl text-xs text-red-300 font-mono border border-red-900/40 max-h-48 overflow-y-auto space-y-2 select-text">
              <div className="font-bold text-red-400">{this.state.error && this.state.error.toString()}</div>
              <div className="whitespace-pre-wrap opacity-70 text-[11px] leading-relaxed">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </div>
            </div>

            {this.state.reported && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 font-medium">
                ✅ {this.state.reportMsg || 'Báo cáo sự cố đã được gửi thành công tới bộ phận kỹ thuật!'}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button 
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-purple-600/30 active:scale-95 cursor-pointer"
              >
                🔄 Tải Lại Trang (Khôi phục)
              </button>

              <button 
                onClick={() => window.location.href = '/'}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                🏠 Về Trang Chủ
              </button>

              <button 
                onClick={this.handleReportAdmin}
                disabled={this.state.isReporting || this.state.reported}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer ${
                  this.state.reported
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                }`}
              >
                {this.state.isReporting ? '⏳ Đang gửi...' : this.state.reported ? '✅ Đã Báo Cáo' : '🚨 Gửi Báo Cáo Sự Cố'}
              </button>

              <button 
                onClick={this.handleCopy}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all ml-auto active:scale-95 cursor-pointer"
                title="Sao chép lỗi để gửi thủ công"
              >
                {this.state.copied ? '✅ Đã chép' : '📋 Sao chép lỗi'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
