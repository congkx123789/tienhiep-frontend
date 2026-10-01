import MainLayout from '../../../layouts/main';
import { useLang } from '../../../contexts/LangContext';
import { VipModal } from '../../../components';
import { Terminal } from 'lucide-react';
import { useDeveloper } from './useDeveloper';
import { ApiKeyManager } from './components/ApiKeyManager';
import { SandboxConsole } from './components/SandboxConsole';
import { ApiDocsCard } from './components/ApiDocsCard';
import { UsageHistoryCard } from './components/UsageHistoryCard';

export default function Developer() {
  const { t, lang } = useLang();
  const dev = useDeveloper();

  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    if (isNaN(num)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  if (!dev.user) {
    return (
      <MainLayout>
        <div className="py-20 text-center text-slate-500 max-w-md mx-auto space-y-4">
          <Terminal className="w-12 h-12 text-purple-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Developer API Console</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Vui lòng đăng nhập tài khoản để tiếp tục.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Banner header */}
        <div className="bg-[#121225]/60 border border-[#1f1f3a] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Terminal className="text-purple-400 w-6 h-6" /> {t.developer?.title || 'Developer API & TTS Console'}
            </h2>
            <p className="text-xs text-slate-400">
              {t.developer?.subtitle || 'Quản lý API Key, giám sát số dư và kiểm thử dịch thuật/TTS thời gian thực.'}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-[#0b0b14]/80 border border-purple-500/25 px-5 py-3 rounded-2xl text-right flex-1 md:flex-initial">
              <span className="text-[9px] text-slate-500 block uppercase font-extrabold tracking-wider">{t.developer?.balance || 'Số dư API Developer'}</span>
              <strong className="text-base text-emerald-400 font-extrabold block mt-0.5">{formatCurrency(dev.balance)}</strong>
            </div>
            <button
              onClick={() => dev.setVipModalOpen(true)}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 text-[#0b0b14] font-extrabold px-5 py-4 rounded-2xl text-xs transition-all shadow-lg shadow-amber-500/10 whitespace-nowrap active:scale-95"
            >
              ⚡ {lang === 'zh' ? '充值 / 购买 VIP' : lang === 'en' ? 'Deposit / Buy VIP' : 'Nạp số dư / Mua VIP'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Keys list & Sandbox */}
          <div className="lg:col-span-2 space-y-6">
            <ApiKeyManager
              keys={dev.keys}
              loadingKeys={dev.loadingKeys}
              creatingKey={dev.creatingKey}
              copiedKey={dev.copiedKey}
              newKeyName={dev.newKeyName}
              setNewKeyName={dev.setNewKeyName}
              handleCreateKey={dev.handleCreateKey}
              handleRevokeKey={dev.handleRevokeKey}
              handleCopy={dev.handleCopy}
            />

            <SandboxConsole
              sandboxTtsText={dev.sandboxTtsText}
              setSandboxTtsText={dev.setSandboxTtsText}
              sandboxTtsSpeed={dev.sandboxTtsSpeed}
              setSandboxTtsSpeed={dev.setSandboxTtsSpeed}
              playingSandboxAudio={dev.playingSandboxAudio}
              loadingSandboxAudio={dev.loadingSandboxAudio}
              runTtsSandbox={dev.runTtsSandbox}
              sandboxTransText={dev.sandboxTransText}
              setSandboxTransText={dev.setSandboxTransText}
              sandboxTransMode={dev.sandboxTransMode}
              setSandboxTransMode={dev.setSandboxTransMode}
              sandboxTransResult={dev.sandboxTransResult}
              translatingSandbox={dev.translatingSandbox}
              runTranslationSandbox={dev.runTranslationSandbox}
            />
          </div>

          {/* Right: API Docs & Usage logs */}
          <div className="space-y-6">
            <ApiDocsCard />
            <UsageHistoryCard
              usages={dev.usages}
              loadingUsage={dev.loadingUsage}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>
      </div>

      <VipModal isOpen={dev.vipModalOpen} onClose={() => { dev.setVipModalOpen(false); dev.fetchKeys(); }} />
    </MainLayout>
  );
}
