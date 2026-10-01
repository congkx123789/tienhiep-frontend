import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Shield, Sliders, Coins, BarChart3, Laptop, Tv, BrainCircuit,
  Crown, MessageSquare, Terminal 
} from 'lucide-react';
import { SettingsTabId } from '../Settings.types';

interface SettingsSidebarProps {
  user: any;
  displayName: string;
  level: { name: string };
  activeTab: SettingsTabId;
  onSelectTab: (tab: SettingsTabId) => void;
  d: Record<string, string>;
  t: any;
  isElectron: boolean;
  isCapacitor: boolean;
  getFrameStyle: () => string;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  user,
  displayName,
  level,
  activeTab,
  onSelectTab,
  d,
  t,
  isElectron,
  isCapacitor,
  getFrameStyle,
}) => {
  const navigate = useNavigate();

  return (
    <div className="lg:col-span-1 space-y-6">
      {/* Profile Card Summary */}
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-5 flex flex-col items-center text-center shadow-xl">
        <div className="relative mb-4">
          <div className={`rounded-full ${getFrameStyle()} flex items-center justify-center`}>
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-[#0b0b14] text-white text-3xl font-black relative shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 to-brand-500/30" />
              {user?.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover relative z-10" alt="avatar" />
              ) : (
                <span className="relative z-10">{user?.username ? user.username[0].toUpperCase() : 'U'}</span>
              )}
            </div>
          </div>
          {user?.vip_status === 1 && (
            <span className="absolute -bottom-1 -right-1 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0b0b14] font-black text-[9px] rounded-full uppercase tracking-wider shadow-[0_2px_8px_rgba(245,158,11,0.4)] border border-yellow-300 z-20">
              VIP
            </span>
          )}
        </div>
        <h3 className="font-extrabold text-white text-base truncate max-w-full">{displayName || user?.username}</h3>
        <p className="text-purple-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{level?.name}</p>

        <div className="w-full border-t border-white/5 my-4" />

        <div className="w-full text-left space-y-2.5">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Tên đăng nhập</span>
            <span className="text-xs text-slate-200 font-bold">@{user?.username}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Mã ID kết bạn</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-amber-300 font-mono font-bold tracking-widest">
                #{user?.user_code || user?.id}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user?.user_code || String(user?.id));
                  alert('Đã sao chép mã ID!');
                }}
                className="text-[9px] text-slate-500 hover:text-purple-400 transition-colors"
                title="Sao chép mã ID"
              >
                📋
              </button>
            </div>
            <p className="text-[9px] text-slate-600 mt-0.5">Chia sẻ mã này để bạn bè thêm bạn</p>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
              {t.settings?.emailLabel || "Địa chỉ Email"}
            </span>
            <span className="text-xs text-slate-300 truncate block">{user?.email || 'Chưa thiết lập'}</span>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible no-scrollbar">
        <button 
          onClick={() => onSelectTab('profile')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
            activeTab === 'profile' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <User className="w-4 h-4" /> {d.profileTab}
        </button>
        <button 
          onClick={() => onSelectTab('security')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
            activeTab === 'security' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Shield className="w-4 h-4" /> {d.securityTab}
        </button>
        <button 
          onClick={() => onSelectTab('preferences')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
            activeTab === 'preferences' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Sliders className="w-4 h-4" /> {d.prefTab}
        </button>
        <button 
          onClick={() => onSelectTab('wallet')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
            activeTab === 'wallet' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Coins className="w-4 h-4" /> {d.walletTab}
        </button>
        <button 
          onClick={() => onSelectTab('stats')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
            activeTab === 'stats' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Thống kê & Lịch sử
        </button>
        <button 
          onClick={() => onSelectTab('desktop')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
            activeTab === 'desktop' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Laptop className="w-4 h-4" /> {isElectron ? 'Cấu hình Desktop' : (isCapacitor ? 'Cấu hình Android' : 'Tải Bản Desktop')}
        </button>
        <button 
          onClick={() => onSelectTab('tts_models')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
            activeTab === 'tts_models' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Tv className="w-4 h-4" /> Quản lý Giọng AI
        </button>
        <button 
          onClick={() => onSelectTab('ai_translation')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left ${
            activeTab === 'ai_translation' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <BrainCircuit className="w-4 h-4" /> Cấu hình Dịch & AI
        </button>

        <div className="hidden lg:block w-full border-t border-white/5 my-1" />

        <button 
          onClick={() => navigate('/sects')}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left text-slate-400 hover:text-white hover:bg-white/[0.03]"
        >
          <Crown className="w-4 h-4 text-amber-400" /> Tông Môn (Sects)
        </button>
        <button 
          onClick={() => navigate('/messages')}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left text-slate-400 hover:text-white hover:bg-white/[0.03]"
        >
          <MessageSquare className="w-4 h-4 text-purple-400" /> Hộp thư đàm đạo
        </button>
        <button 
          onClick={() => navigate('/developer')}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full text-left text-slate-400 hover:text-white hover:bg-white/[0.03]"
        >
          <Terminal className="w-4 h-4 text-blue-400" /> API Keys & Developer
        </button>
      </div>
    </div>
  );
};
