# 📁 Các Thành Phần Của Trang Chi Tiết Tác Phẩm

> **Đường dẫn thư mục:** `frontend/src/pages/discovery/book-detail/components`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Bảng mục lục chương, khu vực thông tin tác giả và thanh hành động chân trang.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `BookChaptersList.tsx` | 38 | Module xử lý chức năng BookChaptersList. | `BookChaptersList` |
| `BookCommentsSection.tsx` | 135 | Comment Submission Form | `BookCommentsSection` |
| `BookHeroCover.tsx` | 167 | Module xử lý chức năng BookHeroCover. | `BookHeroCover` |
| `BookShareModal.tsx` | 73 | Component hộp thoại (Modal popup) hiển thị và xử lý luồng người dùng. | `BookShareModal` |
| `BookSidebarStats.tsx` | 109 | Translation Stats Card | `BookSidebarStats` |
| `BookSynopsisCard.tsx` | 37 | Thẻ hiển thị thông tin trực quan dạng khối. | `BookSynopsisCard` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
