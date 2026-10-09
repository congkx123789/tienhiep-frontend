# 📁 Cổng Tính Năng & Cài Đặt Hệ Thống (Portal Hub)

> **Đường dẫn thư mục:** `frontend/src/pages/portal`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Khu vực quản lý cài đặt nâng cao, nhật ký phát triển, tải file và bang hội.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`developer/`](./developer/README.md) | Trang Dành Cho Nhà Phát Triển (Developer Tools) |
| [`downloads/`](./downloads/README.md) | Trang Quản Lý Tải Về (Downloads Manager) |
| [`sects/`](./sects/README.md) | Trang Tông Môn / Bang Phái (Sects & Guilds) |
| [`settings/`](./settings/README.md) | Trang Cài Đặt Ứng Dụng (App Settings) |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `VipPage.tsx` | 267 | Banner Hero VIP | `VipPage` |
| `index.ts` | 6 | Module xử lý chức năng index. | *(Internal)* |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
