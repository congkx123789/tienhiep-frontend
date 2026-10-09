# 📁 Bộ Kiểm Thử Mã Nguồn Tự Động (Frontend Tests)

> **Đường dẫn thư mục:** `frontend/src/tests`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Chứa các kịch bản kiểm tra tự động đảm bảo chất lượng, tính hồi quy và độ ổn định của hệ thống.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`browser/`](./browser/README.md) | Kiểm Thử Trình Duyệt Webview |
| [`contracts/`](./contracts/README.md) | Kiểm Thử Giao Ước Dữ Liệu (API Contracts) |
| [`functional/`](./functional/README.md) | Kiểm Thử Chức Năng Ứng Dụng |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `index.ts` | 2 | Module xử lý chức năng index. | *(Internal)* |
| `run_all_tests.ts` | 149 | Module xử lý chức năng run_all_tests. | *(Internal)* |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
