/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  routes.ts — ĐIỂM CHỐT ROUTER & NAVIGATION DUY NHẤT (FRONTEND)
 * ═════════════════════════════════════════════════════════════════════════════
 *  - Quản lý tập trung 100% các URL route của ứng dụng Web/App/Electron.
 *  - Tuyệt đối không hardcode chuỗi URL rải rác trong component.
 *  - Hỗ trợ dynamic route params an toàn kiểu dữ liệu.
 * ═════════════════════════════════════════════════════════════════════════════
 */

export const APP_ROUTES = {
  HOME: '/',
  BOOKSHELF: '/bookshelf',
  HISTORY: '/history',
  DEVELOPER: '/developer',
  DOWNLOADS: '/downloads',
  SETTINGS: '/settings',
  MESSAGES: '/messages',
  SECTS: '/sects',
  VIP: '/vip',
  BOOK_DETAIL: (bookId: string | number = ':bookId') => `/book/${bookId}`,
  READER: (bookId: string | number = ':bookId', chapterIdx: string | number = ':chapterIdx') => `/book/${bookId}/read/${chapterIdx}`,
  AUTHOR: (authorName: string = ':authorName') => `/author/${authorName}`,
  EMBED: '/embed',
} as const;

export default APP_ROUTES;
