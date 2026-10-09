# 📁 Các Thành Phần Của Main Layout

> **Đường dẫn thư mục:** `frontend/src/layouts/main/components`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Thanh điều hướng chuyển trang (BottomNav), Header và vùng chứa nội dung.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `BottomNav.tsx` | 66 | Module xử lý chức năng BottomNav. | `BottomNav` |
| `BrowserNavSheet.tsx` | 67 | Backdrop | `BrowserNavSheet` |
| `FlagIcon.tsx` | 48 | Module xử lý chức năng FlagIcon. | `FlagIcon` |
| `LogConsole.tsx` | 116 | Module xử lý chức năng LogConsole. | `LogConsole` |
| `MainHeader.tsx` | 299 | LEFT: Logo | `MainHeader` |
| `MobileMenuDrawer.tsx` | 293 | User Profile Card | `MobileMenuDrawer` |
| `SystemBanners.tsx` | 136 | ─── MISSING ENGINE BANNER (Electron only) ─── | `SystemBanners` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
