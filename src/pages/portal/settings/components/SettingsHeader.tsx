import React from 'react';
import { Settings as SettingsIcon, AlertTriangle } from 'lucide-react';

interface SettingsHeaderProps {
  title?: string;
  mustChangePassword?: boolean;
  mustChangePassTitle?: string;
  mustChangePassDesc?: string;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title = "⚙️ Cài đặt Tài khoản",
  mustChangePassword = false,
  mustChangePassTitle = "Yêu cầu đặt mật khẩu mới",
  mustChangePassDesc = "Đây là lần đầu tiên bạn đăng nhập bằng Google. Vui lòng thiết lập mật khẩu riêng cho tài khoản để có thể đăng nhập trực tiếp bằng Email sau này.",
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-purple-400 animate-spin-slow" /> {title}
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Quản lý hồ sơ, ví tài sản, cấp bậc tu tiên, bảo mật hai lớp và cấu hình trình đọc đám mây.
        </p>
      </div>

      {mustChangePassword && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-300 text-sm shadow-lg shadow-amber-500/5">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold mb-0.5">{mustChangePassTitle}</strong>
            {mustChangePassDesc}
          </div>
        </div>
      )}
    </div>
  );
};
