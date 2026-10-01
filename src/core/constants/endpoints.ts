/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  endpoints.ts — BẢN ĐỒ ĐIỀU PHỐI ENDPOINT CÓ METADATA PHỤC VỤ CONTRACT API
 * ═════════════════════════════════════════════════════════════════════════════
 *  Khớp 1:1 với backend routes.go (Contract-Driven Endpoint).
 *  Mỗi thay đổi URL bên Backend chỉ sửa duy nhất tại file này!
 * ═════════════════════════════════════════════════════════════════════════════
 */

export interface EndpointDef {
  path: string | ((...args: any[]) => string);
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  isAuthRequired?: boolean;
  description?: string;
}

export type EndpointMeta = EndpointDef;

export const ENDPOINTS = {
  // 1. Root & Sức Khỏe
  HEALTH: {
    ROOT: { path: '/api/health', method: 'GET' as const, isAuthRequired: false, description: 'Kiểm tra sức khỏe' },
    STATS: { path: '/api/stats', method: 'GET' as const, isAuthRequired: false, description: 'Thống kê 931k sách' },
  },

  // 2. Xác Thực & Người Dùng
  AUTH: {
    LOGIN: { path: '/api/auth/login', method: 'POST' as const, isAuthRequired: false, description: 'Đăng nhập' },
    REGISTER: { path: '/api/auth/register', method: 'POST' as const, isAuthRequired: false, description: 'Đăng ký' },
    ME: { path: '/api/auth/me', method: 'GET' as const, isAuthRequired: true, description: 'Thông tin hồ sơ' },
    LOGOUT: { path: '/api/auth/logout', method: 'POST' as const, isAuthRequired: false, description: 'Đăng xuất' },
    REFRESH: { path: '/api/auth/refresh', method: 'POST' as const, isAuthRequired: false, description: 'Làm mới token' },
    SESSIONS: { path: '/api/auth/sessions', method: 'GET' as const, isAuthRequired: true, description: 'Phiên hoạt động' },
  },

  // 3. Kho Sách & Chương
  BOOKS: {
    LIST: { path: '/api/books', method: 'GET' as const, isAuthRequired: false, description: 'Tìm kiếm truyện' },
    RECENT: { path: '/api/books/recent', method: 'GET' as const, isAuthRequired: false, description: 'Truyện mới' },
    DETAIL: (bookId: string | number) => ({ path: `/api/books/${bookId}`, method: 'GET' as const, description: 'Chi tiết sách' }),
    BY_AUTHOR: (author: string) => ({ path: `/api/author/${encodeURIComponent(author)}`, method: 'GET' as const, description: 'Sách cùng tác giả' }),
    SHARE: { path: '/api/books/share', method: 'GET' as const, isAuthRequired: false, description: 'Chia sẻ sách' },
  },
  CHAPTERS: {
    CONTENT: (bookId: string | number, idx: string | number = 0) => ({
      path: `/api/chapter/content?book_id=${bookId}&chapter_idx=${idx}`,
      method: 'GET' as const,
      description: 'Nội dung chương',
    }),
    PREV_NEXT: (bookId: string | number, idx: string | number = 0) => ({
      path: `/api/chapter/prev-next?book_id=${bookId}&chapter_idx=${idx}`,
      method: 'GET' as const,
      description: 'Chương trước và sau',
    }),
  },

  // 4. Dịch Thuật AI & Vietphrase
  TRANSLATE: {
    CMLM: { path: '/api/translate/cmlm', method: 'POST' as const, isAuthRequired: false, description: 'Dịch CMLM NAT C++' },
    VIETPHRASE: { path: '/api/translate', method: 'POST' as const, isAuthRequired: false, description: 'Dịch Vietphrase' },
    MODELS: { path: '/v1/models', method: 'GET' as const, isAuthRequired: false, description: 'Danh sách model OpenAI' },
  },

  // 5. Tổng Hợp Giọng Nói TTS
  TTS: {
    SPEAK: { path: '/api/tts/speak', method: 'GET' as const, isAuthRequired: false, description: 'Phát giọng đọc TTS' },
    RESET_PROMPT: { path: '/api/tts/reset_prompt', method: 'POST' as const, isAuthRequired: false, description: 'Reset voice context' },
    SET_DEVICE: { path: '/api/tts/set_device', method: 'POST' as const, isAuthRequired: false, description: 'Đặt thiết bị tính toán' },
  },

  // 6. Developer APIs
  DEVELOPER: {
    KEYS: { path: '/api/developer/keys', method: 'GET' as const, isAuthRequired: true, description: 'Danh sách API keys' },
    CREATE_KEY: { path: '/api/developer/keys', method: 'POST' as const, isAuthRequired: true, description: 'Tạo API key' },
    USAGE: { path: '/api/developer/usage', method: 'GET' as const, isAuthRequired: true, description: 'Thống kê lượng dùng' },
  },

  // 7. Tông Môn (Sects)
  SECTS: {
    LIST: { path: '/api/sects', method: 'GET' as const, isAuthRequired: false, description: 'Danh sách tông môn' },
    MY_SECT: { path: '/api/sects/my-sect', method: 'GET' as const, isAuthRequired: false, description: 'Tông môn của tôi' },
    REQUESTS: { path: '/api/sects/requests/list', method: 'GET' as const, isAuthRequired: false, description: 'Yêu cầu gia nhập' },
    LIBRARY: { path: '/api/sects/library/list', method: 'GET' as const, isAuthRequired: false, description: 'Tàng Kinh Các' },
  },

  // 8. Tủ Sách & Người Dùng
  USER: {
    PREFERENCES: { path: '/api/user/preferences', method: 'GET' as const, isAuthRequired: false, description: 'Cài đặt giao diện' },
    BOOKSHELF: { path: '/api/bookshelf', method: 'GET' as const, isAuthRequired: false, description: 'Tủ sách cá nhân' },
    HISTORY: { path: '/api/user/history', method: 'GET' as const, isAuthRequired: false, description: 'Lịch sử đọc truyện' },
    STATS: { path: '/api/user/stats', method: 'GET' as const, isAuthRequired: false, description: 'Thống kê người dùng' },
  },

  // 9. Thanh Toán & VIP
  PAYMENTS: {
    PLANS: { path: '/api/payments/plans', method: 'GET' as const, isAuthRequired: false, description: 'Bảng giá VIP' },
    CHECKOUT: { path: '/api/payment/create', method: 'POST' as const, isAuthRequired: false, description: 'Khởi tạo đơn hàng' },
    STATUS: (orderId: string | number) => ({ path: `/api/payment/status/${orderId}`, method: 'GET' as const, description: 'Kiểm tra trạng thái đơn' }),
    VIP_STATUS: { path: '/api/payment/vip-status', method: 'GET' as const, isAuthRequired: false, description: 'Trạng thái VIP' },
  },

  // 10. Hệ Thống & Releases
  SYSTEM: {
    AI_CHAT: { path: '/api/ai/chat', method: 'POST' as const, isAuthRequired: false, description: 'Trợ lý Tu Tiên AI' },
    RELEASES: { path: '/api/releases', method: 'GET' as const, isAuthRequired: false, description: 'Link tải phiên bản mới' },
    FEEDBACK: { path: '/api/feedback/submit', method: 'POST' as const, isAuthRequired: false, description: 'Đóng góp ý kiến' },
    METRICS: { path: '/api/monitoring/metrics', method: 'GET' as const, isAuthRequired: false, description: 'Chỉ số đo lường' },
  },
} as const;

export type EndpointsTree = typeof ENDPOINTS;
export default ENDPOINTS;
