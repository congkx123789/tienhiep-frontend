/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  routes.ts — CENTRAL PAGE ROUTE COORDINATOR (FRONTEND)
 * ═════════════════════════════════════════════════════════════════════════════
 */

export const ROUTE_PATTERNS = {
  HOME: '/',
  BOOKSHELF: '/bookshelf',
  HISTORY: '/history',
  DEVELOPER: '/developer',
  DOWNLOADS: '/downloads',
  SETTINGS: '/settings',
  MESSAGES: '/messages',
  SECTS: '/sects',
  VIP: '/vip',
  BOOK_DETAIL: '/book/:bookId',
  BOOK_READ: '/book/:bookId/read/:chapterIdx',
  AUTHOR: '/author/:authorName',
  EMBED: '/embed',
} as const;

export const APP_ROUTES = {
  HOME: '/',
  DISCOVER: '/',
  BOOKSHELF: '/bookshelf',
  HISTORY: '/history',
  DEVELOPER: '/developer',
  DOWNLOADS: '/downloads',
  SETTINGS: '/settings',
  MESSAGES: '/messages',
  SECTS: '/sects',
  VIP: '/vip',
  EMBED: '/embed',
  BOOK_DETAIL: (bookId: number | string) => `/book/${bookId}`,
  BOOK_READ: (bookId: number | string, chapterIdx: number | string = 0) => `/book/${bookId}/read/${chapterIdx}`,
  AUTHOR: (authorName: string) => `/author/${encodeURIComponent(authorName)}`,
  SECT_DETAIL: (sectId: number | string) => `/sects/${sectId}`,
};

export default APP_ROUTES;
