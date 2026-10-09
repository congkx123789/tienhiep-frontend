# 🏛️ Layouts: Browser Shell & Overlay Coordinator (Tầng 3.5)

Thư mục chứa các thành phần điều phối khung nhìn trình duyệt (Overlay Shell Coordinator) toàn cục của ứng dụng.

## 📋 Danh sách tệp tin

| Tệp tin | Số dòng | Vai trò kiến trúc | Export chính |
| :--- | :--- | :--- | :--- |
| `BrowserOverlay.tsx` | ~115 | Vỏ bọc giao diện kết nối trạng thái từ `useBrowser()` điều phối Header, Viewports, Modals và Quick Tools. | `BrowserOverlay` |
| `BrowserModals.tsx` | ~220 | Điều phối các hộp thoại: cấu hình tab, chuyển tab, danh sách bookmark, cài đặt dịch thuật và thanh nghe đọc. | `BrowserModals` |
| `index.ts` | 3 | Barrel export của module. | Toàn bộ |

## 🌲 Quy tắc Kiến trúc Cây Đơn Chiều

- **Vị trí tầng:** Tầng 3.5 (Layout Shells).
- **Quyền gọi xuống (Downward):** Được phép gọi Tầng 3 (`components/browser`, `components/audio`, `components/modals`, `components/mobile`, `components/reader`), Tầng 2 (`contexts/BrowserContext`), Tầng 0 (`utils`).
- **Quyền gọi lên (Upward):** Nghiêm cấm gọi Tầng 4 (`pages`) và Tầng 5 (`App.tsx`).
