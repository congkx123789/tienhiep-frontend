/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  BARREL EXPORT: src/pages/index.ts (FRACTAL DOMAIN-DRIVEN)
 * ═════════════════════════════════════════════════════════════════════════════
 *  Điều phối toàn bộ 13 màn hình giao diện phân theo cụm nghiệp vụ:
 *  - Cụm Discovery: Discover, BookDetail, AuthorDetail
 *  - Cụm Reader: Reader, LocalReader
 *  - Cụm User: Bookshelf, HistoryPage, Messages
 *  - Cụm Portal: Sects, VipPage, Settings, Developer, Downloads
 * ═════════════════════════════════════════════════════════════════════════════
 */

// 1. Cụm Khám Phá & Chi Tiết Sách
export * from './discovery';

// 2. Cụm Đọc Truyện & Trình Đọc Offline
export * from './reader';

// 3. Cụm Người Dùng, Tủ Sách & Lịch Sử
export * from './user';

// 4. Cụm Tông Môn, Cài Đặt & Phát Hành
export * from './portal';
