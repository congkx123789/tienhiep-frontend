import React, { useState, useEffect } from 'react';
import { 
  BarChart3, RefreshCw, AlertTriangle, Clock, Laptop, Tv, 
  Smartphone, Globe, Sparkles, BookOpen, Sliders 
} from 'lucide-react';
import api from '../../../../services';

interface TabStatsProps {
  user: any;
}

export const TabStats: React.FC<TabStatsProps> = ({ user }) => {
  const [stats, setStats] = useState<any>(null);
  const [readingHistory, setReadingHistory] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0 phút';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const fetchStatsAndHistory = async () => {
    setStatsLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        api.get('/api/user/stats'),
        api.get('/api/user/history')
      ]);
      setStats(statsRes.data?.stats || statsRes.data || null);
      setReadingHistory(historyRes.data?.history || historyRes.data || []);
    } catch {} finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchStatsAndHistory();
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="border-b border-[#1f1f3a]/60 pb-3 flex justify-between items-center">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" /> Thống Kê & Lịch Sử Sử Dụng
          </h3>
          <button
            onClick={fetchStatsAndHistory}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {statsLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="text-xs text-slate-400 font-medium animate-pulse">Đang tải dữ liệu hệ thống...</span>
          </div>
        ) : !user ? (
          <div className="p-8 text-center bg-[#0b0b14]/50 rounded-xl border border-[#1f1f3a] space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Yêu cầu đăng nhập</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Bạn đang trải nghiệm dưới quyền Khách. Hãy đăng nhập tài khoản để đồng bộ và xem chi tiết thời gian đọc.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Grid cards statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">TỔNG THỜI GIAN ĐỌC</span>
                  <span className="text-lg font-extrabold text-white block mt-0.5">{stats ? formatDuration(stats.total_reading_time) : '0 phút'}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Tính cả Web và Chrome Extension</span>
                </div>
              </div>

              <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center shrink-0">
                  <Laptop className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">MÔI TRƯỜNG ĐỌC</span>
                  <div className="flex justify-between items-center text-xs mt-1 text-slate-300">
                    <span className="flex items-center gap-1 font-medium"><Tv className="w-3.5 h-3.5 text-blue-400" /> Web:</span>
                    <span className="font-extrabold text-white">{stats ? formatDuration(stats.web_duration) : '0m'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-0.5 text-slate-300">
                    <span className="flex items-center gap-1 font-medium"><Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Ext:</span>
                    <span className="font-extrabold text-white">{stats ? formatDuration(stats.ext_duration) : '0m'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">CHẾ ĐỘ KẾT NỐI</span>
                  <div className="flex justify-between items-center text-xs mt-1 text-slate-300">
                    <span className="flex items-center gap-1 font-medium text-emerald-400">● Online:</span>
                    <span className="font-extrabold text-white">{stats ? formatDuration(stats.online_duration) : '0m'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-0.5 text-slate-300">
                    <span className="flex items-center gap-1 font-medium text-amber-500">○ Offline:</span>
                    <span className="font-extrabold text-white">{stats ? formatDuration(stats.offline_duration) : '0m'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Translation Stats Card */}
            <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-5 mt-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> Hiệu suất dịch thuật & Đọc sách
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#121225] border border-[#1f1f3a]/60 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tổng Số Lượt Dịch</span>
                  <span className="text-xl font-extrabold text-purple-400 block mt-1">{stats?.translation_calls || 0} lượt</span>
                </div>
                <div className="p-3 bg-[#121225] border border-[#1f1f3a]/60 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ký tự đã dịch (AI/Convert)</span>
                  <span className="text-xl font-extrabold text-indigo-400 block mt-1">
                    {stats?.translation_chars ? stats.translation_chars.toLocaleString() : 0} ký tự
                  </span>
                </div>
              </div>
            </div>

            {/* Reading History */}
            <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-5 mt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-purple-400" /> Lịch sử click xem & Đọc chương gần đây
              </h4>
              
              {readingHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Chưa có lịch sử click xem truyện.</p>
              ) : (
                <div className="space-y-4">
                  {readingHistory.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-2">
                      <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block border-b border-[#1f1f3a]/40 pb-1">
                        {group.group_name}
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(Array.isArray(group?.books) ? group.books : []).map((book: any, bIdx: number) => (
                          <div 
                            key={bIdx} 
                            className="p-3 bg-[#121225] border border-[#1f1f3a]/60 rounded-lg flex gap-3 items-center hover:border-purple-500/50 transition-all group relative overflow-hidden"
                          >
                            <div className="w-9 h-12 bg-slate-800 rounded overflow-hidden shrink-0">
                              {book.cover ? (
                                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">Ảnh</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <strong className="text-xs font-bold text-white block truncate group-hover:text-purple-400 transition-colors">
                                {book.title}
                              </strong>
                              <span className="text-[10px] text-slate-400 block truncate mt-0.5">Tác giả: {book.author || 'Ẩn danh'}</span>
                              <span className="text-[9px] text-slate-500 block truncate mt-0.5 font-mono">Chương cuối: {book.last_chapter || 'Chưa đọc'}</span>
                            </div>
                            {book.url && (
                              <a 
                                href={book.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="absolute top-2 right-2 p-1 text-slate-500 hover:text-white bg-[#0b0b14] border border-[#1f1f3a] rounded-md text-[10px] hover:bg-purple-600 transition-all opacity-0 group-hover:opacity-100"
                              >
                                Mở lại
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Actions Logs */}
            <div className="bg-[#0b0b14] border border-[#1f1f3a] rounded-xl p-5 mt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" /> Nhật ký sử dụng hệ thống
              </h4>
              {(!stats?.recent_actions || stats.recent_actions.length === 0) ? (
                <p className="text-xs text-slate-500 text-center py-6">Chưa ghi nhận hoạt động nào gần đây.</p>
              ) : (
                <div className="max-h-[220px] overflow-y-auto divide-y divide-[#1f1f3a]/30 pr-1.5 custom-scrollbar">
                  {stats.recent_actions.map((act: any, idx: number) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white">{act.details || act.action_type}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="capitalize">{act.app_type === 'extension' ? 'Chrome Extension' : 'Web App'}</span>
                          <span>•</span>
                          <span>{act.connection_status === 'online' ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                        {new Date(act.timestamp).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
