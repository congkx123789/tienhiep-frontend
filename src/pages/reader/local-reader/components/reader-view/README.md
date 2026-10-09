# 📁 Khung Hiển Thị Văn Bản Của Local Reader

> **Đường dẫn thư mục:** `frontend/src/pages/reader/local-reader/components/reader-view`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Render văn bản theo trang hoặc cuộn liên tục, hỗ trợ chạm chuyển trang mượt mà.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `LocalReaderContent.tsx` | 114 | Module xử lý chức năng LocalReaderContent. | `ParsedParagraph`, `LocalReaderContent` |
| `LocalReaderHeader.tsx` | 126 | ── Top Floating Control Bar ── | `LocalReaderHeader` |
| `LocalReaderNav.tsx` | 41 | Module xử lý chức năng LocalReaderNav. | `LocalReaderNav` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
