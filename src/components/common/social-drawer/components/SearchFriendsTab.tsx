import React from 'react';
import { Search, X, UserPlus } from 'lucide-react';
import { SearchUserItem } from '../SocialDrawer.types';

interface SearchFriendsTabProps {
  lang: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchUserItem[];
  setSearchResults: (res: SearchUserItem[]) => void;
  searchLoading: boolean;
  onSearchUsers: () => void;
  onSendRequest: (username: string) => void;
}

export const SearchFriendsTab: React.FC<SearchFriendsTabProps> = ({
  lang,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  searchLoading,
  onSearchUsers,
  onSendRequest,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-teal-400">
        {lang === 'vi' ? 'Tìm bạn hữu mới' : 'Find new friends'}
      </h4>
      
      {/* Search for users */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500/70" />
          <input 
            type="text" 
            placeholder={lang === 'vi' ? 'Tìm theo tên, email, mã ID 7 số...' : 'Search by name, email, 7-digit ID...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchUsers()}
            className="w-full pl-10 pr-8 py-2.5 bg-[#070b13] border border-teal-500/20 focus:border-teal-500 rounded-xl text-white outline-none transition-colors text-xs placeholder-slate-500"
          />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-[9px] text-teal-500/60 px-1 leading-normal">
          {lang === 'vi' ? 'ℹ️ Có thể tìm bằng tên đăng nhập, email hoặc mã ID 7 chữ số (ví dụ: 1234567)' : 'ℹ️ Search by username, email, or 7-digit ID (e.g. 1234567)'}
        </p>
      </div>

      {/* Search Results list */}
      {searchResults.length > 0 && (
        <div className="bg-[#070b13]/90 border border-teal-500/20 rounded-xl p-2.5 space-y-1.5 shadow-lg">
          <span className="text-[9px] font-black text-teal-400/80 uppercase px-2">
            {lang === 'vi' ? 'Kết quả tìm kiếm' : 'Search results'} ({searchResults.length})
          </span>
          {searchResults.map(u => (
            <div key={u.id} className="flex items-center justify-between p-2 hover:bg-teal-950/20 rounded-xl gap-3 border border-transparent hover:border-teal-500/10 transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                {u.avatar ? (
                  <img src={u.avatar} className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-teal-500/10" alt="avatar" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm">
                    {u.username ? u.username[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">{u.username}</p>
                  {u.user_code && (
                    <p className="text-[9px] text-teal-500/70 font-mono mt-0.5"># {u.user_code}</p>
                  )}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => onSendRequest(u.username)}
                className="shrink-0 p-2 hover:bg-teal-600 bg-teal-600/10 text-teal-300 hover:text-white rounded-xl border border-teal-500/20 transition-all"
                title={lang === 'vi' ? 'Kết bạn' : 'Add Friend'}
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {searchQuery && searchResults.length === 0 && !searchLoading && (
        <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-teal-500/10 rounded-xl bg-teal-950/5">
          Không tìm thấy kết quả phù hợp.
        </div>
      )}
    </div>
  );
};
