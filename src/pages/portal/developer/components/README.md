# 📁 Các Thành Phần Của Developer Tools

> **Đường dẫn thư mục:** `frontend/src/pages/portal/developer/components`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Khung xem log realtime, công cụ đo latency và bộ giả lập sự kiện.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `ApiDocsCard.tsx` | 42 | Thẻ hiển thị thông tin trực quan dạng khối. | `ApiDocsCard` |
| `ApiKeyManager.tsx` | 114 | Create Key Form | `ApiKeyManager` |
| `SandboxConsole.tsx` | 141 | TTS Section | `SandboxConsole` |
| `UsageHistoryCard.tsx` | 52 | Thẻ hiển thị thông tin trực quan dạng khối. | `UsageHistoryCard` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
