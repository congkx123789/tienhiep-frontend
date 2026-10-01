/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  apiRoutes.ts — BẢN ĐỒ TOÀN BỘ 100% CÁC API ENDPOINTS
 * ═════════════════════════════════════════════════════════════════════════════
 */

export const API_ENDPOINTS = {
  // ─── 1. XÁC THỰC & QUẢN LÝ TÀI KHOẢN (AUTH) ───
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    UPDATE_PROFILE: '/api/auth/update-profile',
    CHANGE_PASSWORD: '/api/auth/change-password',
    SESSIONS: '/api/auth/sessions',
    SESSIONS_REVOKE: '/api/auth/sessions/revoke',
    GOOGLE_CALLBACK: '/api/auth/google/callback',
    VERIFY_REGISTRATION: '/api/auth/verify-registration',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },

  // ─── 2. DEVELOPER KEYS & QUẢN LÝ TÍCH HỢP BÊN THỨ BA ───
  DEVELOPER: {
    KEYS: '/api/developer/keys',
    KEYS_CREATE: '/api/developer/keys/create',
    KEYS_DELETE: '/api/developer/keys/delete',
    USAGE: '/api/developer/usage',
  },

  // ─── 3. HỆ THỐNG, GIÁM SÁT, PHIÊN BẢN & PHẢN HỒI (SYSTEM & TELEMETRY) ───
  SYSTEM: {
    HEALTH: '/api/health',
    HEALTH_ALT: '/health',
    STATS: '/api/stats',
    RELEASES: '/api/releases',
    RELEASES_UPDATE: '/api/releases/update',
    NOTIFICATIONS: '/api/system/notifications',
    NOTIFICATIONS_PERSONAL: '/api/notifications/personal',
    NOTIFICATIONS_PERSONAL_READ: '/api/notifications/personal/read',
    MONITORING_METRICS: '/api/monitoring/metrics',
    FRONTEND_ERROR: '/api/monitoring/frontend-error',
    LOGS_ERROR: '/api/logs/error',
    FEEDBACK_SUBMIT: '/api/feedback/submit',
    FEEDBACK: '/api/feedback/submit',
    AI_CHAT: '/api/ai/chat',
    RELEASES_LATEST: '/api/releases',
  },

  // ─── 4. DỊCH THUẬT AI, VIETPHRASE & PHÂN ĐOẠN CÂU ───
  TRANSLATE: {
    ROOT: '/api/translate',
    DEFAULT: '/api/translate',
    LEGACY: '/translate',
    V1: '/api/v1/translate',
    CMLM: '/api/translate/cmlm',
    MODELS: '/v1/models',
    CHAPTER_SEGMENT: '/api/chapter/segment',
    LOCAL_DICTIONARY_VIETPHRASE: '/dictionaries/Vietphrase.txt',
    LOCAL_DICTIONARY_ALIGNED_HANVIET: '/dictionaries/Aligned_HanViet.txt',
    LOCAL_DICTIONARY_HANVIET_CHAR: '/dictionaries/HanViet_CharDict.txt',
  },

  // ─── 5. TỔNG HỢP GIỌNG ĐỌC MATCHA TTS C++ TIÊN HIỆP ───
  TTS: {
    SPEAK: '/api/tts/speak',
    SYNTHESIZE: '/synthesize',
    RESET_PROMPT: '/reset_prompt',
    RESET_PROMPT_API: '/api/tts/reset_prompt',
    SET_DEVICE: '/set_device',
    SET_DEVICE_API: '/api/tts/set_device',
    RELOAD_MODEL: '/reload_model',
    RELOAD_MODEL_API: '/api/tts/reload_model',
    SPEECH_OPENAI: '/v1/audio/speech',
  },

  // ─── 6. KHO SÁCH & TÌM KIẾM 931,000+ TÁC PHẨM ───
  BOOKS: {
    LIST: '/api/books',
    RECENT: '/api/books/recent',
    DETAIL: (id: string | number) => `/api/books/${id}`,
    DETAIL_LEGACY: (id: string | number) => `/api/book/${id}`,
    TRANSLATIONS: (id: string | number) => `/api/book/${id}/translations`,
    CHAPTER: (bookId: string | number, chapterIdx: string | number) => `/api/book/${bookId}/read/${chapterIdx}`,
    AUTHOR: (authorName: string) => `/api/author/${encodeURIComponent(authorName)}`,
    BY_AUTHOR: (authorName: string) => `/api/author/${encodeURIComponent(authorName)}`,
    SHARE: '/api/books/share',
    STATS: '/api/stats',
  },

  CHAPTERS: {
    CONTENT: (bookId: string | number, chapterIdx: string | number = 0) => `/api/chapter/content?book_id=${bookId}&chapter_idx=${chapterIdx}`,
    PREV_NEXT: (bookId: string | number, chapterIdx: string | number = 0) => `/api/chapter/prev-next?book_id=${bookId}&chapter_idx=${chapterIdx}`,
  },

  // ─── 7. TỦ SÁCH CÁ NHÂN (BOOKSHELF) ───
  BOOKSHELF: {
    GET: '/api/bookshelf',
    LIST: '/api/bookshelf',
    ADD: '/api/bookshelf/add',
    REMOVE: '/api/bookshelf/remove',
  },

  // ─── 8. LỊCH SỬ ĐỌC TRUYỆN (HISTORY) ───
  HISTORY: {
    GET: '/api/history',
    LIST: '/api/history',
    ADD: '/api/history/add',
    CLEAR: '/api/history/clear',
    REMOVE: '/api/history/remove',
    USER_HISTORY: '/api/user/history',
  },

  // ─── 9. SỔ TAY TỪ VỰNG TIÊN HIỆP (VOCABULARY) ───
  VOCABULARY: {
    GET: '/api/vocabulary',
    LIST: '/api/vocabulary',
    ADD: '/api/vocabulary/add',
    DELETE: '/api/vocabulary/delete',
  },

  // ─── 10. THỐNG KÊ & THEO DÕI TU LUYỆN NGƯỜI DÙNG (USER STATS & TRACKING) ───
  USER: {
    STATS: '/api/user/stats',
    TRACK: '/api/user/track',
    PREFERENCES: '/api/user/preferences',
    VIP_STATUS: '/api/user/vip-status',
    PAYMENT_VIP_STATUS: '/api/payment/vip-status',
    SET_VIP: '/api/user/set-vip',
    SYSTEM_SET_VIP: '/api/system/set-vip',
  },

  // ─── 11. BẠN BÈ & TIN NHẮN MẬT (SOCIAL & MESSAGES) ───
  SOCIAL: {
    FRIENDS_LIST: '/api/friends/list',
    FRIENDS: '/api/friends/list',
    FRIEND_REQUEST: '/api/friends/request',
    FRIEND_RESPOND: '/api/friends/respond',
    SEARCH_USERS: '/api/users/search',
    USERS_SEARCH: (query: string) => `/api/users/search?q=${encodeURIComponent(query)}`,
    CHAT_MESSAGES: (friendId: string | number) => `/api/messages/chat/${friendId}`,
    MESSAGES: (friendId: string | number) => `/api/messages/chat/${friendId}`,
    MESSAGE_SEND: '/api/messages/send',
    SEND_MESSAGE: '/api/messages/send',
  },

  NOTIFICATIONS: {
    UNREAD_COUNTS: '/api/notifications/personal',
  },

  // ─── 12. TÔNG MÔN, BANG HỘI & PHÁP BẢO (SECTS & GUILD) ───
  SECTS: {
    MY_SECT: '/api/sects/my-sect',
    LIST: '/api/sects/list',
    SEARCH: (query: string) => `/api/sects/search?q=${encodeURIComponent(query)}`,
    DETAIL: (id: string | number) => `/api/sects/${id}`,
    CREATE: '/api/sects/create',
    JOIN: '/api/sects/join',
    LEAVE: '/api/sects/leave',
    CONTRIBUTE: '/api/sects/contribute',
    ANNOUNCEMENT: '/api/sects/announcement',
    PROMOTE_RANK: '/api/sects/promote/rank',
    KICK: '/api/sects/kick',
    REQUESTS_LIST: '/api/sects/requests/list',
    REQUESTS_RESPOND: '/api/sects/requests/respond',
    LIBRARY_LIST: '/api/sects/library/list',
    LIBRARY_ADD: '/api/sects/library/add',
    LIBRARY_REMOVE: '/api/sects/library/remove',
    CHAT_GROUPS: '/api/sects/chat/groups',
    CHAT_GROUPS_CREATE: '/api/sects/chat/groups/create',
    CHAT_GROUP_DETAIL: (groupId: string | number) => `/api/sects/chat/groups/${groupId}`,
    CHAT_GROUP_ADD_MEMBER: (groupId: string | number) => `/api/sects/chat/groups/${groupId}/members/add`,
    CHAT_GROUP_REMOVE_MEMBER: (groupId: string | number) => `/api/sects/chat/groups/${groupId}/members/remove`,
    CHAT_HISTORY: '/api/sects/chat/history',
    CHAT_SEND: '/api/sects/chat/send',
  },

  // ─── 13. CỔNG THANH TOÁN & GÓI VIP (PAYMENT & SUBSCRIPTIONS) ───
  PAYMENT: {
    CREATE: '/api/payment/create',
    CHECKOUT: '/api/payment/create',
    STATUS: (orderId: string | number) => `/api/payment/status/${orderId}`,
    WEBHOOK: '/api/payment/webhook',
    CONFIRM: '/api/payment/confirm',
    VERIFY: '/api/payment/confirm',
    ORDERS: '/api/payment/orders',
    PLANS: '/api/payment/orders',
    SET_VIP: '/api/user/set-vip',
    VIP_STATUS: '/api/user/vip-status',
  },
  PAYMENTS: {
    CREATE: '/api/payment/create',
    CHECKOUT: '/api/payment/create',
    STATUS: (orderId: string | number) => `/api/payment/status/${orderId}`,
    WEBHOOK: '/api/payment/webhook',
    CONFIRM: '/api/payment/confirm',
    VERIFY: '/api/payment/confirm',
    ORDERS: '/api/payment/orders',
    PLANS: '/api/payment/orders',
    SET_VIP: '/api/user/set-vip',
    VIP_STATUS: '/api/user/vip-status',
  },
  MONITORING: {
    METRICS: '/api/monitoring/metrics',
  },

  // ─── 14. TRỢ LÝ ĐỌC TRUYỆN AI THÔNG MINH ───
  AI: {
    CHAT: '/api/ai/chat',
  },

  // ─── 15. XỬ LÝ & DỊCH SÁCH ĐIỆN TỬ EPUB ───
  EPUB: {
    TRANSLATE: '/api/epub/translate',
    CONVERT_TXT: '/api/epub/convert-txt',
  },

  // ─── 16. PROXY ĐỌC WEB NOVEL & TẢI ẢNH BÌA ───
  PROXY: {
    IFRAME: '/api/iframe_proxy',
    IFRAME_OLD: '/iframe_proxy',
    IMAGE: '/api/image_proxy',
  },

  // ─── 17. TÀI NGUYÊN TĨNH & FILE TẢI VỀ (DOWNLOADS & STATIC ASSETS) ───
  DOWNLOADS: {
    FILE: (filename: string) => `/downloads/${encodeURIComponent(filename)}`,
  },
  STATIC: {
    FAVICON: '/favicon.png',
    AVATAR_DICEBEAR: (seed: string, style: string = 'adventurer') => `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`,
  },
} as const;

export function buildApiUrl(endpoint: string, base: string = ''): string {
  if (!base) return endpoint;
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}

export function getEndpoint(category: string, key: string, ...args: any[]): string {
  const cat = (API_ENDPOINTS as any)[category];
  if (!cat) {
    console.warn(`[getEndpoint] Category "${category}" không tồn tại trong API_ENDPOINTS.`);
    return '';
  }
  const ep = cat[key];
  if (typeof ep === 'function') {
    return ep(...args);
  }
  return ep || '';
}

export function getAllEndpointsList(): Array<{ category: string; key: string; path: string; isDynamic: boolean }> {
  const list: Array<{ category: string; key: string; path: string; isDynamic: boolean }> = [];
  for (const [category, endpoints] of Object.entries(API_ENDPOINTS)) {
    for (const [key, value] of Object.entries(endpoints as Record<string, any>)) {
      list.push({
        category,
        key,
        path: typeof value === 'function' ? value('{param}') : value,
        isDynamic: typeof value === 'function',
      });
    }
  }
  return list;
}
