/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  BARREL EXPORT: src/components/index.js
 * ═════════════════════════════════════════════════════════════════════════════
 *  Điều phối xuất nhập toàn bộ components phân tầng theo domain:
 *  - audio/   : AudioPlayer, SystemTicker
 *  - modals/  : AuthModal, VipModal, VipGateModal, AiUpgradeModal, TranslationSettingsModal, ChromeMobileBookmarksModal
 *  - reader/  : ReaderQuickTools, BookCard
 *  - mobile/  : ChromeMobileMenu, ChromeMobileNewTab, ChromeMobileTabSwitcher
 *  - common/  : Footer, DownloadIcon, GoogleAd, SocialDrawer, ErrorBoundary
 * ═════════════════════════════════════════════════════════════════════════════
 */

// Domain sub-modules
export * from './audio';
export * from './modals';
export * from './reader';
export * from './mobile';
export * from './common';
export * from './browser';

// Default exports map
export { default as AudioPlayer } from './audio/player';
export { default as SystemTicker } from './audio/SystemTicker';
export { default as AuthModal } from './modals/auth-modal';
export { default as VipModal } from './modals/vip';
export { default as VipGateModal } from './modals/vip-gate';
export { default as AiUpgradeModal } from './modals/AiUpgradeModal';
export { default as TranslationSettingsModal } from './modals/translation-settings';
export { default as ChromeMobileBookmarksModal } from './modals/ChromeMobileBookmarksModal';
export { default as ReaderQuickTools } from './reader/ReaderQuickTools';
export { default as BookCard } from './reader/book-card';
export { default as ChromeMobileMenu } from './mobile/chrome-menu';
export { default as ChromeMobileNewTab } from './browser/ChromeMobileNewTab';
export { default as ChromeMobileTabSwitcher } from './mobile/ChromeMobileTabSwitcher';
export { default as Footer } from './common/Footer';
export { default as DownloadIcon } from './common/DownloadIcon';
export { default as GoogleAd } from './common/GoogleAd';
export { default as SocialDrawer } from './common/social-drawer';
export { default as ErrorBoundary } from './common/ErrorBoundary';
export * from './vip';
export { default as RequireVIP } from './vip/RequireVIP';
