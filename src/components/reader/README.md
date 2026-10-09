# 📁 Các Thành Phần Của Trình Đọc Truyện (Reader UI)

> **Đường dẫn thư mục:** `frontend/src/components/reader`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Bao gồm thẻ sách, thanh tiến độ đọc và các thành phần trực quan khi duyệt sách.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`book-card/`](./book-card/README.md) | Thẻ Hiển Thị Truyện (Book Card) |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `InlineWordAlignPopover.tsx` | 286 | Header Popover | `InlineAlignState`, `InlineWordAlignPopover` |
| `ReaderQuickTools.tsx` | 211 | Thu gọn Dock [ ✕ ] | `ReaderQuickTools` |
| `index.ts` | 3 | Module xử lý chức năng index. | *(Internal)* |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
