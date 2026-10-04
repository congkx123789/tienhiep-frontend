import React, { useState } from 'react';
import { KeyRound, CheckCircle, Lock } from 'lucide-react';
import api from '../../../../../services';

interface ChangePasswordSectionProps {
  user: any;
  setUser: (u: any) => void;
  d: Record<string, string>;
  t: any;
  mustChangePassword?: boolean;
}

export const ChangePasswordSection: React.FC<ChangePasswordSectionProps> = ({
  user,
  setUser,
  d,
  t,
  mustChangePassword = false,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 4) {
      setPassError(d.passMinLen);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError(d.passMismatch);
      return;
    }

    setChangePassLoading(true);
    try {
      const payload: any = { new_password: newPassword };
      if (!mustChangePassword) payload.old_password = oldPassword;

      const res = await api.post('/api/auth/change-password', payload);
      setPassSuccess(res.data.message || d.passChangeSuccess);

      if (user) {
        const updatedUser = { ...user, require_password_change: 0 };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.response?.data?.error || d.passChangeError);
    } finally {
      setChangePassLoading(false);
    }
  };

  return (
    <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-[#1f1f3a]/60 pb-3">
        <KeyRound className="w-5 h-5 text-brand-400" />
        <h4 className="font-extrabold text-white text-sm">{t.settings?.changePassTitle || "Đổi Mật Khẩu"}</h4>
      </div>

      {passError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{passError}</div>}
      {passSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {passSuccess}</div>}

      <form onSubmit={handlePasswordChange} className="space-y-4">
        {!mustChangePassword && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{t.settings?.currentPassLabel || "Mật khẩu hiện tại"}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password"
                placeholder={t.settings?.currentPassPlaceholder || "Nhập mật khẩu hiện tại"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{t.settings?.newPassLabel || "Mật khẩu mới"}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password"
                placeholder={t.settings?.newPassPlaceholder || "Tối thiểu 4 ký tự"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{t.settings?.confirmPassLabel || "Xác nhận mật khẩu mới"}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password"
                placeholder={t.settings?.confirmPassPlaceholder || "Xác nhận mật khẩu mới"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={changePassLoading}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
        >
          {changePassLoading ? (t.settings?.updating || 'Đang cập nhật...') : (t.settings?.updateBtn || 'Cập nhật Mật khẩu')}
        </button>
      </form>
    </div>
  );
};
