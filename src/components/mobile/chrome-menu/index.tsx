import React, { useEffect, useRef } from 'react';
import { ChromeMobileMenuProps } from './ChromeMobileMenu.types';
import { MenuQuickActions } from './components/MenuQuickActions';
import { MenuNavList } from './components/MenuNavList';
import { MenuAiTools } from './components/MenuAiTools';

export default function ChromeMobileMenu(props: ChromeMobileMenuProps) {
  const {
    isOpen,
    onClose,
    currentUrl,
    currentTitle,
  } = props;

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: any;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      timer = setTimeout(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);
      }, 60);
    }
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (currentUrl && currentUrl !== 'about:newtab') {
        await navigator.clipboard.writeText(currentUrl);
        alert('Đã sao chép liên kết vào bộ nhớ tạm!');
      }
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share && currentUrl && currentUrl !== 'about:newtab') {
      try {
        await navigator.share({
          title: currentTitle || 'Trang web',
          url: currentUrl
        });
      } catch {}
    } else {
      handleCopyLink();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200000] bg-black/40 backdrop-blur-[2px] flex justify-end items-start animate-fade-in">
      <div 
        ref={menuRef}
        className="w-64 max-w-[85vw] mt-14 mr-2 bg-[#181824] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-2 text-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <MenuQuickActions
          canGoBack={props.canGoBack}
          onGoBack={props.onGoBack}
          canGoForward={props.canGoForward}
          onGoForward={props.onGoForward}
          isBookmarked={props.isBookmarked}
          onToggleBookmark={props.onToggleBookmark}
          onReload={props.onReload}
          handleShare={handleShare}
          currentUrl={props.currentUrl}
          onOpenExternal={props.onOpenExternal}
          onClose={props.onClose}
        />

        <div className="flex flex-col space-y-0.5 text-xs font-medium">
          <MenuNavList
            onNewTab={props.onNewTab}
            onOpenBookmarks={props.onOpenBookmarks}
            onOpenHistory={props.onOpenHistory}
            isDesktopMode={props.isDesktopMode}
            onToggleDesktopMode={props.onToggleDesktopMode}
            onOpenTabConfig={props.onOpenTabConfig}
            onClose={props.onClose}
          />

          <MenuAiTools
            onOpenTranslationSettings={props.onOpenTranslationSettings}
            isAutoTranslate={props.isAutoTranslate}
            onToggleTranslate={props.onToggleTranslate}
            isAudioPlaying={props.isAudioPlaying}
            onToggleAudio={props.onToggleAudio}
            cleanAdsActive={props.cleanAdsActive}
            onToggleCleanAds={props.onToggleCleanAds}
            onClose={props.onClose}
          />
        </div>
      </div>
    </div>
  );
}

export * from './ChromeMobileMenu.types';
