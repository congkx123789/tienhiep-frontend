# 📁 Dịch Vụ Lõi & Client HTTP Cơ Sở

> **Đường dẫn thư mục:** `frontend/src/services/core`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Khởi tạo instance Axios, cấu hình Interceptors tự động đính kèm Token và chuẩn hóa phản hồi API.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| [`apiClient.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/services/core/apiClient.ts) | 1 | Tái xuất khẩu client Axios cơ sở. | *(Internal)* |
| [`api.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/services/core/api.ts) | 19 | Adapter bọc API tầng dịch vụ kết nối với core API instance. | `api` |
| [`hfWakeup.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/services/core/hfWakeup.ts) | 17 | Kiểm tra trạng thái máy chủ (100% Local On-Device Engine). | `wakeUpRemoteSpace` |
| [`index.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/services/core/index.ts) | 4 | Điểm xuất khẩu tập trung cho tầng services/core. | `api`, `wakeUpRemoteSpace` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
