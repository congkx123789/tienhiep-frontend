/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  ChromeMobileMenu.types.ts
 * ═════════════════════════════════════════════════════════════════════════════
 */

export interface ChromeMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNewTab: (isIncognito?: boolean) => void;
  isPrivate?: boolean;
  onTogglePrivate?: () => void;
  onReload: () => void;
  onOpenHistory: () => void;
  isDesktopMode: boolean;
  onToggleDesktopMode: () => void;
  isAutoTranslate: boolean;
  onToggleTranslate: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  cleanAdsActive: boolean;
  onToggleCleanAds: () => void;
  currentUrl?: string;
  currentTitle?: string;
  onOpenExternal?: (url: string) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onOpenBookmarks?: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  canGoForward?: boolean;
  onGoForward?: () => void;
  onOpenTabConfig?: () => void;
  onOpenTranslationSettings?: () => void;
}
