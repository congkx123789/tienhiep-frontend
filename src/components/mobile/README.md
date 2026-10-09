# 📁 Thành Phần Chuyên Biệt Cho Thiết Bị Di Động

> **Đường dẫn thư mục:** `frontend/src/components/mobile`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Tối ưu hóa trải nghiệm vuốt chạm, menu phong cách trình duyệt di động (Chrome/Safari) và tính tương thích trên màn hình nhỏ.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`chrome-menu/`](./chrome-menu/README.md) | Menu Trình Duyệt Mobile (Chrome-style Menu) |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `ChromeMobileTabSwitcher.tsx` | 181 | Quản lý chuyển đổi tab, xem danh sách tab đang mở dạng thẻ. | `ChromeMobileTabSwitcher` |
| `index.ts` | 3 | Module xuất khẩu các thành phần mobile. | `ChromeMobileMenu`, `ChromeMobileTabSwitcher` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.
