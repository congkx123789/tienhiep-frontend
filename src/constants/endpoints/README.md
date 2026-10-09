# 📁 Định Nghĩa Các Đường Dẫn API (API Endpoints)

> **Đường dẫn thư mục:** `frontend/src/constants/endpoints`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Quản lý toàn bộ URI endpoint của các service: auth, chapter, translate, tts, book.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| [`apiRoutes.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/constants/endpoints/apiRoutes.ts) | 271 | Bảng ánh xạ route API toàn hệ thống: Auth, Reader, Translate, TTS, Books, System Events, Quota. | `API_ENDPOINTS`, `buildApiUrl`, `getEndpoint`, `getAllEndpointsList` |
| [`index.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/constants/endpoints/index.ts) | 9 | Điểm tập hợp xuất khẩu constants: `API_ENDPOINTS`, `SERVER_CONFIG`, `OS_PROFILES`, `getCandidateServers`. | `API_ENDPOINTS`, `SERVER_CONFIG`, `OS_PROFILES`, `getCandidateServers` |
| [`serverConfig.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/constants/endpoints/serverConfig.ts) | 73 | Cấu hình máy chủ điều phối: Toàn bộ nền tảng (iOS, Android, Windows, Linux, macOS, Web) kết nối 100% Local On-Device / In-RAM Engine (`127.0.0.1:5051`), loại bỏ hoàn toàn phụ thuộc máy chủ từ xa. | `SERVER_CONFIG`, `OS_PROFILES`, `getCandidateServers` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
