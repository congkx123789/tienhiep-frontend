# 📁 Định Nghĩa Kiểu Dữ Liệu TypeScript (Type Definitions)

> **Đường dẫn thư mục:** `frontend/src/types`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Tập hợp các interface, type alias và enum được sử dụng xuyên suốt toàn bộ codebase để đảm bảo type safety.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| [`global-env.d.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/types/global-env.d.ts) | 34 | Khai báo kiểu môi trường toàn cục (Vite env, Window electron, Capacitor globals). | *(Ambient)* |
| [`index.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/types/index.ts) | 204 | Định nghĩa kiểu dữ liệu cốt lõi cho nền tảng (`PlatformType`, `OSType`, `PlatformRuntimeProfile`, `BasePointConfig`), Sách, Chương, Người dùng, Dịch thuật. | `PlatformType`, `OSType`, `PlatformRuntimeProfile`, `BasePointConfig`, `Book`, `Chapter`, `User` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
