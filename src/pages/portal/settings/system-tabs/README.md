# 📁 Các Tab Cài Đặt Hệ Thống

> **Đường dẫn thư mục:** `frontend/src/pages/portal/settings/system-tabs`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Trung tâm quản trị hệ thống tầng sâu: Hợp nhất toàn bộ cấu hình Lõi AI & Dịch thuật C++ Native (CMLM NAT + Matcha-TTS) và quản trị môi trường ứng dụng Desktop/Mobile.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| [`TabAiTranslation.tsx`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/pages/portal/settings/system-tabs/TabAiTranslation.tsx) | 224 | **Lõi AI & Dịch Thuật C++ Hợp Nhất**: Quản lý đồng bộ trạng thái kết nối Local Engine, chọn thiết bị phần cứng (Auto INT8/GPU CUDA/CPU Thuần), danh sách 5 mô hình nơ-ron On-Device, chế độ dịch thuật (Mode 1-4, Vietphrase, Hán Việt, Raw), Server API URL, VIP key và trạm chẩn đoán kiểm thử trực tiếp (Translation & TTS). | `TabAiTranslation` |
| [`TabDesktop.tsx`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/pages/portal/settings/system-tabs/TabDesktop.tsx) | 214 | Cấu hình đường dẫn lưu trữ, kiểm tra cập nhật phiên bản và thông tin môi trường Desktop/Mobile. | `TabDesktop` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal & Tinh gọn:** Không tạo các tab trùng lặp chồng chéo trách nhiệm. Toàn bộ Lõi AI C++ Native Core (dịch thuật & giọng đọc) được quy hoạch thống nhất vào `TabAiTranslation`.
2. **Giới hạn dòng:** Mọi file trong thư mục duy trì nghiêm ngặt dưới 300 dòng mã nguồn.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng (`TranslationSettings`, `SettingsTabId`), tuyệt đối không dùng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
