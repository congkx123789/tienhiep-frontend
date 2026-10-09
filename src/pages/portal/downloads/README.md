# 📁 Trang Quản Lý Tải Về (Downloads Manager)

> **Đường dẫn thư mục:** `frontend/src/pages/portal/downloads`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Theo dõi tiến độ tải truyện offline, danh sách file EPUB/TXT đã tải và dung lượng bộ nhớ.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`components/`](./components/README.md) | Các Thành Phần Của Downloads Manager |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `Downloads.types.ts` | 26 | Định nghĩa kiểu dữ liệu (TypeScript interfaces & types) cho module này. | `ReleaseItem`, `ReleasesState`, `AdminFormState` |
| `index.tsx` | 205 | Module xử lý chức năng index. | `Downloads` |
| `useDownloadsData.ts` | 183 | Custom React Hook đóng gói logic và quản lý lifecycle cục bộ. | `useDownloadsData` |
| `useElectronUpdater.ts` | 141 | Custom React Hook đóng gói logic và quản lý lifecycle cục bộ. | `useElectronUpdater` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
