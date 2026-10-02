import React from 'react';
import api from '../../services';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
  errorInfo: any;
  copied: boolean;
  sentToServer: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false, sentToServer: false };
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

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0b14] text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-red-950/20 border border-red-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h1 className="text-2xl sm:text-3xl font-black text-red-400 flex items-center gap-3">
              <span>⚠️</span> Đã Xảy Ra Lỗi Nghiêm Trọng!
            </h1>
            <p className="text-red-200 text-xs sm:text-sm font-medium leading-relaxed">
              Ứng dụng vừa gặp phải sự cố ngoài ý muốn. Chi tiết lỗi đã được ghi nhận tự động vào nhật ký hệ thống:
              <code className="ml-1 px-2 py-0.5 bg-black/40 rounded text-red-300 font-mono text-[11px]">logs/client_errors.log</code>
            </p>

            <div className="bg-black/60 p-4 rounded-xl text-xs text-red-300 font-mono border border-red-900/60 max-h-56 overflow-y-auto space-y-2 select-text">
              <div className="font-bold text-red-400">{this.state.error && this.state.error.toString()}</div>
              <div className="whitespace-pre-wrap opacity-75 text-[11px] leading-relaxed">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button 
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/30 active:scale-95 cursor-pointer"
              >
                🔄 Tải Lại Ứng Dụng (Reload)
              </button>
              <button 
                onClick={this.handleCopy}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                {this.state.copied ? '✅ Đã Sao Chép Lỗi!' : '📋 Sao Chép Chi Tiết Lỗi'}
              </button>
              {this.state.sentToServer && (
                <span className="text-[11px] text-emerald-400 font-semibold ml-auto flex items-center gap-1">
                  ✓ Đã đồng bộ log lên Server
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
