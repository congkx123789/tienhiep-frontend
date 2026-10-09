# 📁 Các Custom Hooks Dùng Chung

> **Đường dẫn thư mục:** `frontend/src/hooks`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Tập hợp các hook tái sử dụng như đo kích thước màn hình, debouncing, xử lý cử chỉ vuốt và phím tắt.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `useAutoUpdate.ts` | 160 | useAutoUpdate.js | `useAutoUpdate` |
| `useReaderSwipeGesture.ts` | 88 | Hook xử lý cử chỉ vuốt chuyển chương khi đọc truyện (Swipe Navigation): | `SwipeGestureHandlers`, `useReaderSwipeGesture` |
| `useUsageTracker.ts` | 88 | Custom React Hook đóng gói logic và quản lý lifecycle cục bộ. | `useUsageTracker` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
