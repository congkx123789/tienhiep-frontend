# 📁 Context Quản Lý Tài Khoản & Xác Thực (Auth Context)

> **Đường dẫn thư mục:** `frontend/src/contexts/auth`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Quản lý trạng thái đăng nhập, thông tin người dùng, token và cấp bậc VIP.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `Auth.types.ts` | 29 | ═════════════════════════════════════════════════════════════════════════════ | `AuthUser`, `AuthContextType` |
| `authTokenStorage.ts` | 57 | ═════════════════════════════════════════════════════════════════════════════ | `saveAuthTokens`, `clearAuthTokens` |
| `useAdSensePolicy.ts` | 41 | Custom React Hook đóng gói logic và quản lý lifecycle cục bộ. | `useAdSensePolicy` |
| `useOAuthDeepLink.ts` | 87 | Custom React Hook đóng gói logic và quản lý lifecycle cục bộ. | `useOAuthDeepLink` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
