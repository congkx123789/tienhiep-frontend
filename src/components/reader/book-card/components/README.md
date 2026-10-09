# 📁 Các Thành Phần Con Của Book Card

> **Đường dẫn thư mục:** `frontend/src/components/reader/book-card/components`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Huy hiệu trạng thái (Full/Đang ra), nhãn thể loại và nút tương tác nhanh.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `BookCardHeader.tsx` | 103 | Thẻ hiển thị thông tin trực quan dạng khối. | `BookCardHeader` |
| `BookCardSources.tsx` | 89 | Thẻ hiển thị thông tin trực quan dạng khối. | `BookCardSources` |
| `BookCardSummary.tsx` | 118 | Thẻ hiển thị thông tin trực quan dạng khối. | `BookCardSummary` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
