import MainLayout from '../../../layouts/main';
import { Loader } from 'lucide-react';
import { useHistoryPage } from './useHistoryPage';
import { HistoryHeader } from './components/HistoryHeader';
import { WebHistoryTab } from './components/WebHistoryTab';
import { ReadingHistoryControls } from './components/ReadingHistoryControls';
import { ReadingHistoryList } from './components/ReadingHistoryList';

export default function HistoryPage() {
  const h = useHistoryPage();

  return (
    <MainLayout>
      <HistoryHeader
        lang={h.lang}
        activeTab={h.activeTab}
        setActiveTab={h.setActiveTab}
        browserHistoryLength={(h.browserHistory || []).length}
      />

      {/* TAB 1: WEB BROWSING HISTORY */}
      {h.activeTab === 'web' && (
        <WebHistoryTab
          browserHistory={h.browserHistory}
          webSearchQ={h.webSearchQ}
          setWebSearchQ={h.setWebSearchQ}
          clearBrowserHistory={h.clearBrowserHistory}
          deleteBrowserHistoryItem={h.deleteBrowserHistoryItem}
          openInBrowser={h.openInBrowser}
          lang={h.lang}
        />
      )}

      {/* TAB 2: READING HISTORY */}
      {h.activeTab === 'reading' && (
        <div className="space-y-4 animate-fade-in">
          {h.authLoading ? (
            <div className="py-20 text-center text-slate-500">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
              <span>{h.lang === 'vi' ? 'Đang tải thông tin...' : h.lang === 'en' ? 'Loading info...' : '正在加载信息...'}</span>
            </div>
          ) : !h.user ? (
            <div className="py-20 text-center text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto mb-4">
                🔒
              </div>
              <p className="text-sm">{h.t.loginToViewHistory || 'Vui lòng đăng nhập để xem lịch sử đọc.'}</p>
            </div>
          ) : (
            <>
              <ReadingHistoryControls
                totalBooks={h.totalBooks}
                isEditMode={h.isEditMode}
                setIsEditMode={h.setIsEditMode}
                selectedIds={h.selectedIds}
                setSelectedIds={h.setSelectedIds}
                isAllSelected={h.isAllSelected}
                handleSelectAll={h.handleSelectAll}
                handleBulkDelete={h.handleBulkDelete}
                searchQ={h.searchQ}
                setSearchQ={h.setSearchQ}
                fetchHistory={h.fetchHistory}
                handleClearHistory={h.handleClearHistory}
                lang={h.lang}
              />

              <ReadingHistoryList
                historyGroups={h.historyGroups}
                loading={h.loading}
                isEditMode={h.isEditMode}
                selectedIds={h.selectedIds}
                deletingId={h.deletingId}
                handleSelectItem={h.handleSelectItem}
                handleDeleteItem={h.handleDeleteItem}
                navigate={h.navigate}
                openInBrowser={h.openInBrowser}
                lang={h.lang}
                noHistoryText={(h.t as any)?.noHistory || 'Chưa có lịch sử đọc'}
              />
            </>
          )}
        </div>
      )}
    </MainLayout>
  );
}
