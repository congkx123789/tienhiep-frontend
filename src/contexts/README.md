# 📁 Các React Context Điều Phối Trạng Thái Toàn Cục (Global Contexts)

> **Đường dẫn thư mục:** `frontend/src/contexts`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Tầng quản lý state xuyên suốt ứng dụng dựa trên React Context API, thay thế các thư viện cồng kềnh như Redux.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`auth/`](./auth/README.md) | Context Quản Lý Tài Khoản & Xác Thực (Auth Context) |
| [`browser/`](./browser/README.md) | Context Quản Lý Trình Duyệt Web Đa Tab (Browser Context) |
| [`lang/`](./lang/README.md) | Context Đa Ngôn Ngữ (Language Context) |
| [`vip-gate/`](./vip-gate/README.md) | Context Điều Phối Quyền Hạn VIP |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `AuthContext.tsx` | 251 | Khởi tạo và cung cấp React Context cùng Provider điều phối trạng thái. | `AuthProvider`, `useAuth` |
| `BrowserContext.tsx` | 3 | Khởi tạo và cung cấp React Context cùng Provider điều phối trạng thái. | *(Internal)* |
| `LangContext.tsx` | 38 | Khởi tạo và cung cấp React Context cùng Provider điều phối trạng thái. | `LangProvider`, `useLang` |
| `ReaderSettingsContext.tsx` | 79 | Khởi tạo và cung cấp React Context cùng Provider điều phối trạng thái. | `ReaderSettingsProvider`, `useReaderSettings` |
| `VipGateContext.tsx` | 213 | Khởi tạo và cung cấp React Context cùng Provider điều phối trạng thái. | `VipGateProvider`, `useVipGate` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
