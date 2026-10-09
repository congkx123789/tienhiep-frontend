# 📁 Các Phân Mục Cài Đặt Chi Tiết

> **Đường dẫn thư mục:** `frontend/src/pages/portal/settings/tabs`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Cài đặt giao diện đọc, cài đặt mạng, bảo mật và tài khoản.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`components/`](./components/README.md) | Các Thành Phần Con Trong Mục Cài Đặt |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `SessionManager.tsx` | 111 | Module xử lý chức năng SessionManager. | `SessionManager` |
| `TabPreferences.tsx` | 216 | Reader Settings Config | `TabPreferences` |
| `TabProfile.tsx` | 203 | Avatar | `TabProfile` |
| `TabSecurity.tsx` | 74 | Password Change | `TabSecurity` |
| `TabStats.tsx` | 238 | Grid cards statistics | `TabStats` |
| `TabWallet.tsx` | 292 | Level Tu Tiên | `TabWallet` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
