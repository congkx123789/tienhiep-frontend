# 📁 Các Thành Phần Của Lịch Sử Đọc

> **Đường dẫn thư mục:** `frontend/src/pages/user/history/components`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Thẻ lịch sử đọc, nút xóa từng mục và nút dọn dẹp toàn bộ lịch sử.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `HistoryHeader.tsx` | 61 | Segmented Switcher (Chỉ hiển thị nút Duyệt Web trên App Native) | `HistoryHeader` |
| `ReadingHistoryControls.tsx` | 122 | Module xử lý chức năng ReadingHistoryControls. | `ReadingHistoryControls` |
| `ReadingHistoryList.tsx` | 159 | Module xử lý chức năng ReadingHistoryList. | `ReadingHistoryList` |
| `WebHistoryTab.tsx` | 123 | Module xử lý chức năng WebHistoryTab. | `WebHistoryTab` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
