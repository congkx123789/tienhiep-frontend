import { FormEvent } from 'react';
import { Key, Plus, Trash2, Copy, Check, RefreshCw } from 'lucide-react';
import { useLang } from '../../../../contexts/LangContext';
import { ApiKeyItem } from '../Developer.types';

interface ApiKeyManagerProps {
  keys: ApiKeyItem[];
  loadingKeys: boolean;
  creatingKey: boolean;
  copiedKey: string;
  newKeyName: string;
  setNewKeyName: (val: string) => void;
  handleCreateKey: (e: FormEvent) => void;
  handleRevokeKey: (key: string) => void;
  handleCopy: (key: string) => void;
}

export function ApiKeyManager({
  keys,
  loadingKeys,
  creatingKey,
  copiedKey,
  newKeyName,
  setNewKeyName,
  handleCreateKey,
  handleRevokeKey,
  handleCopy,
}: ApiKeyManagerProps) {
  const { t, lang } = useLang();

  return (
    <div className="bg-[#121225]/60 border border-[#1f1f3a] rounded-3xl p-6 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-[#1f1f3a]/50">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-purple-400" /> {t.developer?.apiKeyListTitle || 'Danh sách khóa API Key'}
        </h3>
      </div>

      {loadingKeys ? (
        <div className="text-center py-6 text-slate-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-500" />
          {t.developer?.creating || 'Đang tải...'}
        </div>
      ) : keys.length === 0 ? (
        <p className="text-slate-500 text-xs text-center py-6">
          {lang === 'zh' ? '您尚未创建任何 API Key。' : lang === 'en' ? 'You have not created any API Keys yet.' : 'Bạn chưa tạo khóa API nào.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-[#1f1f3a] text-slate-500">
                <th className="pb-2">{t.developer?.keyNameLabel || 'Tên khóa'}</th>
                <th className="pb-2">Khóa API</th>
                <th className="pb-2">{t.developer?.createdLabel || 'Ngày tạo'}</th>
                <th className="pb-2 text-center">{lang === 'zh' ? '操作' : lang === 'en' ? 'Actions' : 'Hành động'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f3a]/30">
              {keys.map((k, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-semibold text-white">{k.name}</td>
                  <td className="py-3 font-mono text-purple-300">
                    {k.api_key.slice(0, 10)}...{k.api_key.slice(-6)}
                  </td>
                  <td className="py-3 text-slate-500 text-[10px]">
                    {new Date(k.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleCopy(k.api_key)}
                        className="p-1.5 bg-[#0b0b14] border border-[#1f1f3a] hover:border-purple-500/50 rounded-lg text-slate-400 hover:text-white transition-all"
                        title="Copy API Key"
                      >
                        {copiedKey === k.api_key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleRevokeKey(k.api_key)}
                        className="p-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                        title="Thu hồi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Key Form */}
      <form onSubmit={handleCreateKey} className="flex gap-2 border-t border-[#1f1f3a]/50 pt-4">
        <input
          type="text"
          placeholder={t.developer?.keyNamePlaceholder || 'Tên gợi nhớ'}
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-[#0b0b14] border border-[#1f1f3a] rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-colors"
        />
        <button
          type="submit"
          disabled={creatingKey || !newKeyName.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> {t.developer?.createBtn || 'Tạo khóa'}
        </button>
      </form>
    </div>
  );
}
