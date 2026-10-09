# 📁 Thành Phần Giao Diện Tái Sử Dụng (UI Components)

> **Đường dẫn thư mục:** `frontend/src/components`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Tập hợp các UI component độc lập, tuân thủ nguyên tắc Single Responsibility, phục vụ cho nhiều trang và luồng nghiệp vụ khác nhau.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`audio/`](./audio/README.md) | Module Âm Thanh & Trình Phát TTS |
| [`common/`](./common/README.md) | Các Thành Phần Giao Diện Chung |
| [`mobile/`](./mobile/README.md) | Thành Phần Chuyên Biệt Cho Thiết Bị Di Động |
| [`modals/`](./modals/README.md) | Hệ Thống Hộp Thoại (Modals & Dialogs) |
| [`reader/`](./reader/README.md) | Các Thành Phần Của Trình Đọc Truyện (Reader UI) |
| [`vip/`](./vip/README.md) | Thành Phần Hiển Thị Huy Hiệu & Trạng Thái VIP |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `index.ts` | 42 | ═════════════════════════════════════════════════════════════════════════════ | *(Internal)* |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
