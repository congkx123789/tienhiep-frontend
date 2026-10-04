import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { SessionManager } from './SessionManager';
import { ChangePasswordSection } from './components/ChangePasswordSection';
import { OtpPhoneSection } from './components/OtpPhoneSection';

interface TabSecurityProps {
  user: any;
  setUser: (u: any) => void;
  d: Record<string, string>;
  t: any;
  mustChangePassword?: boolean;
}

export const TabSecurity: React.FC<TabSecurityProps> = ({
  user,
  setUser,
  d,
  t,
  mustChangePassword = false,
}) => {
  const [socials, setSocials] = useState({
    google: true,
    facebook: false,
    github: false,
    apple: false,
  });

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <ChangePasswordSection
        user={user}
        setUser={setUser}
        d={d}
        t={t}
        mustChangePassword={mustChangePassword}
      />

      {/* OTP & Phone Number */}
      <OtpPhoneSection user={user} d={d} />

      {/* Social Accounts */}
      <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="border-b border-[#1f1f3a]/60 pb-3">
          <h4 className="font-extrabold text-white text-sm">{d.authLinks}</h4>
          <p className="text-[10px] text-slate-400 mt-1">Liên kết OAuth để đăng nhập nhanh bằng 1 click chuột.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-white">🔴 Google</div>
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {d.authLinked}
            </span>
          </div>
          <div className="flex items-center justify-between p-3.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-white">🐙 GitHub</div>
            <button 
              onClick={() => setSocials(prev => ({ ...prev, github: true }))}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all uppercase ${socials.github ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-400 bg-white/5 border border-white/10 hover:text-white'}`}
            >
              {socials.github ? d.authLinked : d.authLinkBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <SessionManager user={user} d={d} />
    </div>
  );
};
