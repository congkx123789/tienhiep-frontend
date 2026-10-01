import React, { useState } from 'react';
import { User, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../../../../services';

interface TabProfileProps {
  user: any;
  setUser: (u: any) => void;
  d: Record<string, string>;
}

export const TabProfile: React.FC<TabProfileProps> = ({ user, setUser, d }) => {
  const [displayName, setDisplayName] = useState(user?.display_name || user?.username || '');
  const [birthday, setBirthday] = useState(user?.birthday || '1998-01-01');
  const [gender, setGender] = useState(user?.gender || 'male');
  const [bio, setBio] = useState(user?.bio || 'Ta là một người mê đọc truyện dịch AI...');
  const [avatarFrame, setAvatarFrame] = useState(user?.avatar_frame || 'default');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage('');

    try {
      const res = await api.put('/api/auth/profile', {
        display_name: displayName,
        birthday,
        gender,
        bio,
        avatar_frame: avatarFrame,
        avatar,
      });

      if (res.data) {
        setUser({
          ...user,
          display_name: displayName,
          birthday,
          gender,
          bio,
          avatar_frame: avatarFrame,
          avatar,
        });
        setProfileMessage(d.saveSuccess);
      }
    } catch {
      setProfileMessage(d.saveError);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="bg-[#121225]/80 border border-[#1f1f3a] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="border-b border-[#1f1f3a]/60 pb-3">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-purple-400" /> {d.profileTab}
        </h3>
        <p className="text-xs text-slate-400 mt-1">Thông tin hiển thị khi đi viết đánh giá, lời giới thiệu bản thân.</p>
      </div>

      {profileMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {profileMessage}
        </div>
      )}

      <form onSubmit={handleProfileSave} className="space-y-4">
        {/* Avatar */}
        <div className="bg-[#0b0b14]/60 p-4 border border-[#1f1f3a]/60 rounded-xl space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ảnh Đại Diện (Avatar)</label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-[#05050a] text-white border border-purple-500/30 shrink-0">
              {avatar ? (
                <img src={avatar} className="w-full h-full object-cover" alt="Avatar Preview" onError={(e: any) => { e.target.src = ''; }} />
              ) : (
                <span className="text-xl font-bold">{user?.username ? user.username[0].toUpperCase() : 'U'}</span>
              )}
            </div>
            
            <div className="flex-1 w-full space-y-1.5">
              <input 
                type="text" 
                placeholder="Dán liên kết hình ảnh (https://...) tại đây"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-4 py-2 bg-[#05050a] border border-[#1f1f3a] rounded-xl text-xs text-slate-200 outline-none focus:border-purple-500 transition-colors"
              />
              <span className="text-[10px] text-slate-500 block">Hoặc chọn một trong các nhân vật đại diện bên dưới:</span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1.5">
            {[
              { name: 'Nghịch Thiên', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=NghichThien' },
              { name: 'Kiếm Hồn', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KiemHon' },
              { name: 'Thần Thú', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ThanThu' },
              { name: 'Yêu Tộc', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YeuToc' },
              { name: 'Thư Sinh', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=ThuSinh' },
              { name: 'Tử Yên', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=TuYen' },
              { name: 'Tiêu Dao', url: 'https://api.dicebear.com/7.x/micah/svg?seed=TieuDao' }
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatar(p.url)}
                className={`p-1 bg-[#05050a] border rounded-lg hover:border-purple-500 hover:scale-105 transition-all flex flex-col items-center gap-1 ${
                  avatar === p.url ? 'border-purple-500 bg-purple-500/10' : 'border-[#1f1f3a]'
                }`}
                title={p.name}
              >
                <img src={p.url} className="w-8 h-8 rounded-full" alt={p.name} />
                <span className="text-[8px] text-slate-500 truncate max-w-full">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.displayName}</label>
            <input 
              type="text" 
              placeholder={d.displayNamePlaceholder}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.avatarFrame}</label>
            <select 
              value={avatarFrame}
              onChange={(e) => setAvatarFrame(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-slate-300 outline-none focus:border-purple-500"
            >
              <option value="default">{d.frameDefault}</option>
              <option value="vip" disabled={user?.vip_status !== 1}>{d.frameVip} {!user?.vip_status && '🔒'}</option>
              <option value="event">{d.frameEvent}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.birthday}</label>
            <input 
              type="date" 
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-slate-300 outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.gender}</label>
            <div className="grid grid-cols-3 gap-2">
              {['male', 'female', 'other'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                    gender === g
                      ? 'bg-purple-600/25 border-purple-500 text-purple-300'
                      : 'bg-[#0b0b14] border-[#1f1f3a] text-slate-400 hover:text-white'
                  }`}
                >
                  {g === 'male' ? d.genderMale : g === 'female' ? d.genderFemale : d.genderOther}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.bio}</label>
          <textarea 
            rows={3}
            placeholder={d.bioPlaceholder}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-4 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-slate-300 outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
        >
          {savingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
          {d.saveBtn}
        </button>
      </form>
    </div>
  );
};
