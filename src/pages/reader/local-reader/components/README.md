# 📁 Các Thành Phần Của Local Reader

> **Đường dẫn thư mục:** `frontend/src/pages/reader/local-reader/components`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Thanh điều hướng chương, menu tùy biến hiển thị và mục lục offline.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`reader-view/`](./reader-view/README.md) | Khung Hiển Thị Văn Bản Của Local Reader |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `LocalBookShelf.tsx` | 199 | Header bar | `LocalBookShelf` |
| `LocalImportModal.tsx` | 241 | Component hộp thoại (Modal popup) hiển thị và xử lý luồng người dùng. | `LocalImportModal` |
| `LocalReadingView.tsx` | 205 | Nội dung đã dịch (hoặc bản gốc nếu mode=raw) | `LocalReadingView` |
| `LocalTocDrawer.tsx` | 78 | Module xử lý chức năng LocalTocDrawer. | `LocalTocDrawer` |
| `ParagraphContextMenu.tsx` | 272 | Khởi tạo và cung cấp React Context cùng Provider điều phối trạng thái. | `ParagraphMenuState`, `WordToken`, `ParagraphContextMenu` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
