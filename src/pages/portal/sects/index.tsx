import React, { useState, useEffect } from 'react';
import MainLayout from '../../../layouts/main';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import { Users, BookOpen, MessageSquare, Award, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSectData } from './useSectData';
import { useSectAdmin } from './useSectAdmin';
import { useSectChat } from './useSectChat';
import { SectInfoTab } from './components/SectInfoTab';
import { SectDisciplesTab } from './components/SectDisciplesTab';
import { SectLibraryTab } from './components/SectLibraryTab';
import { SectChatTab } from './components/SectChatTab';
import { SectDiscoveryView } from './components/SectDiscoveryView';

export default function Sects() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'disciples' | 'library' | 'chat'>('info');

  const {
    inSect,
    mySectData,
    sectsList,
    pendingRequests,
    searchQuery,
    setSearchQuery,
    selectedSectDetail,
    showSectDetailModal,
    setShowSectDetailModal,
    createName,
    setCreateName,
    createSlogan,
    setCreateSlogan,
    createBadge,
    setCreateBadge,
    contribAmount,
    setContribAmount,
    sectBooksList,
    userBookshelf,
    loading,
    actionLoading,
    errorMessage,
    successMessage,
    handleSearch,
    loadSectInfo,
    viewSectDetail,
    handleCreateSect,
    handleJoinSect,
    handleLeaveSect,
    handleContribute,
    fetchUserBookshelf,
    showError,
    showSuccess
  } = useSectData(activeSubTab);

  const {
    editAnnouncement,
    setEditAnnouncement,
    isEditingAnnouncement,
    setIsEditingAnnouncement,
    joinRequestsList,
    fetchJoinRequests,
    handleUpdateAnnouncement,
    handlePromoteRank,
    handleKickMember,
    handleRespondRequest
  } = useSectAdmin(loadSectInfo, showError, showSuccess);

  useEffect(() => {
    if (inSect && activeSubTab === 'disciples') {
      fetchJoinRequests();
    }
  }, [inSect, activeSubTab]);

  const {
    chatType,
    setChatType,
    selectedGroupId,
    setSelectedGroupId,
    selectedDirectUser,
    setSelectedDirectUser,
    chatMessages,
    typedMessage,
    setTypedMessage,
    sendingMessage,
    subGroups,
    setShowCreateGroupModal,
    chatBottomRef,
    handleSendChat
  } = useSectChat(inSect, activeSubTab, user, showError, showSuccess);

  if (loading) {
    return (
      <MainLayout>
        <div className="py-24 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-500" />
          <p className="text-xs">Đang đồng bộ thần thức tông môn...</p>
        </div>
      </MainLayout>
    );
  }

  if (!inSect) {
    return (
      <MainLayout>
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
          </div>
        )}
        <SectDiscoveryView
          sectsList={sectsList}
          pendingRequests={pendingRequests}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
          onJoinSect={handleJoinSect}
          onViewDetail={viewSectDetail}
          createName={createName}
          setCreateName={setCreateName}
          createSlogan={createSlogan}
          setCreateSlogan={setCreateSlogan}
          createBadge={createBadge}
          setCreateBadge={setCreateBadge}
          onCreateSect={handleCreateSect}
          actionLoading={actionLoading}
          selectedSectDetail={selectedSectDetail}
          showSectDetailModal={showSectDetailModal}
          setShowSectDetailModal={setShowSectDetailModal}
        />
      </MainLayout>
    );
  }

  const navTabs = [
    { key: 'info', icon: Award, label: 'Đại Điện' },
    { key: 'disciples', icon: Users, label: `Môn Đồ (${mySectData?.members?.length || 0})` },
    { key: 'library', icon: BookOpen, label: `Tàng Kinh Các (${sectBooksList?.length || 0})` },
    { key: 'chat', icon: MessageSquare, label: 'Truyền Âm Đàm Đạo' }
  ];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 py-4">
        {successMessage && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
          </div>
        )}

        <div className="flex items-center gap-1.5 p-1 bg-[#121225]/80 rounded-2xl border border-[#1f1f3a] overflow-x-auto text-xs font-bold">
          {navTabs.map(({ key, icon: Icon, label }) => {
            const isActive = activeSubTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveSubTab(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  isActive ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {activeSubTab === 'info' && (
          <SectInfoTab
            mySectData={mySectData}
            editAnnouncement={editAnnouncement}
            setEditAnnouncement={setEditAnnouncement}
            isEditingAnnouncement={isEditingAnnouncement}
            setIsEditingAnnouncement={setIsEditingAnnouncement}
            contribAmount={contribAmount}
            setContribAmount={setContribAmount}
            actionLoading={actionLoading}
            onUpdateAnnouncement={handleUpdateAnnouncement}
            onContribute={handleContribute}
            onLeaveSect={handleLeaveSect}
          />
        )}

        {activeSubTab === 'disciples' && (
          <SectDisciplesTab
            members={mySectData?.members || []}
            myRole={mySectData?.role}
            myUserId={user?.id}
            joinRequests={joinRequestsList}
            onPromoteRank={handlePromoteRank}
            onKickMember={handleKickMember}
            onRespondRequest={handleRespondRequest}
          />
        )}

        {activeSubTab === 'library' && (
          <SectLibraryTab
            sectBooks={sectBooksList}
            userBookshelf={userBookshelf}
            myRole={mySectData?.role}
            myUserId={user?.id}
            onShareBook={handleContribute}
            onRemoveBook={() => {}}
            onOpenShareModal={fetchUserBookshelf}
          />
        )}

        {activeSubTab === 'chat' && (
          <SectChatTab
            chatType={chatType}
            setChatType={setChatType}
            selectedGroupId={selectedGroupId}
            setSelectedGroupId={setSelectedGroupId}
            selectedDirectUser={selectedDirectUser}
            setSelectedDirectUser={setSelectedDirectUser}
            chatMessages={chatMessages}
            typedMessage={typedMessage}
            setTypedMessage={setTypedMessage}
            sendingMessage={sendingMessage}
            subGroups={subGroups}
            members={mySectData?.members || []}
            myUserId={user?.id}
            chatBottomRef={chatBottomRef}
            onSendChat={handleSendChat}
            onOpenCreateGroupModal={() => setShowCreateGroupModal(true)}
          />
        )}
      </div>
    </MainLayout>
  );
}
