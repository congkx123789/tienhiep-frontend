# 📁 Hộp Thoại Đăng Nhập / Đăng Ký

> **Đường dẫn thư mục:** `frontend/src/components/modals/auth-modal`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Xử lý form xác thực người dùng, đăng nhập nhanh và khôi phục tài khoản.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `AuthForms.tsx` | 134 | Module xử lý chức năng AuthForms. | `AuthForms` |
| `GoogleAuthButton.tsx` | 43 | Component nút bấm có xử lý giao diện và sự kiện tương ứng. | `GoogleAuthButton` |
| `index.tsx` | 128 | Module xử lý chức năng index. | `AuthModal` |
| `useAuthModal.ts` | 246 | Component hộp thoại (Modal popup) hiển thị và xử lý luồng người dùng. | `AuthMode`, `useAuthModal` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
