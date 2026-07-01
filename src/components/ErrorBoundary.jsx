import React from 'react';
import api from '../services/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Gửi log lỗi về server
    try {
      api.post('/api/logs/error', {
        message: error.toString(),
        stack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        time: new Date().toISOString()
      }).catch(() => {
        // Bỏ qua nếu server không có route này
      });
    } catch(e) { console.error("Failed to send log:", e); }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0b14] text-white flex flex-col items-center justify-center p-8">
          <div className="max-w-2xl bg-red-900/20 border border-red-500/50 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-3xl font-black text-red-400 mb-4 flex items-center gap-3">
              <span>⚠️</span> Đã Xảy Ra Lỗi Nghiêm Trọng!
            </h1>
            <p className="text-red-200 mb-6 font-medium">
              Ứng dụng vừa gặp phải một sự cố ngoài ý muốn. Đừng lo, lỗi đã được tự động ghi nhận và gửi về Server để khắc phục.
            </p>
            
            <div className="bg-black/50 p-4 rounded-xl overflow-x-auto text-sm text-red-300 font-mono border border-red-900 mb-6 max-h-64 overflow-y-auto">
              <div className="font-bold mb-2">{this.state.error && this.state.error.toString()}</div>
              <div className="whitespace-pre-wrap opacity-80">{this.state.errorInfo && this.state.errorInfo.componentStack}</div>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/30 active:scale-95"
            >
              🔄 Tải Lại Ứng Dụng (Reload)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
