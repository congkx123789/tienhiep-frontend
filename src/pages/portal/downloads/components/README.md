# 📁 Các Thành Phần Của Downloads Manager

> **Đường dẫn thư mục:** `frontend/src/pages/portal/downloads/components`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Thanh tiến trình tải, nút tạm dừng/tiếp tục và công cụ dọn dẹp bộ nhớ.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `AdminReleaseModal.tsx` | 130 | Component hộp thoại (Modal popup) hiển thị và xử lý luồng người dùng. | `AdminReleaseModal` |
| `DesktopSection.tsx` | 222 | Linux Card | `DesktopSection` |
| `ExtensionSection.tsx` | 85 | Module xử lý chức năng ExtensionSection. | `ExtensionSection` |
| `MobileAppSection.tsx` | 113 | Android Card | `MobileAppSection` |
| `PlatformIcons.tsx` | 43 | Module xử lý chức năng PlatformIcons. | `ChromeIcon`, `WindowsIcon`, `AndroidIcon`, `AppleIcon` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
