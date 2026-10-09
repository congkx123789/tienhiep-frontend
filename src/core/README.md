# 📁 Nền Tảng Cốt Lõi Ứng Dụng (Application Core)

> **Đường dẫn thư mục:** `frontend/src/core`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le 300$ dòng/file)  
> **Phân rã:** Tách biệt rõ ràng giữa **Local In-RAM Engine (`wasm/`)** và **Server HTTP Client (`api.ts`, `network/`)**.

---

## 📌 Tổng Quan & Phân Định Hai Tầng Lõi

Thư mục `core` đóng vai trò trục xương sống của ứng dụng:
1. **🟢 Lõi Cục Bộ (Local In-RAM Engine):** Nằm tại [`wasm/`](./wasm/README.md), nạp và điều phối thư viện WebAssembly `native-core.wasm` (Trie MaxMatch Vietphrase, Han-Viet, Mode 0..7) và mô hình ONNX Web In-Process. Hoạt động 100% không dùng mạng.
2. **🔵 Lõi Kết Nối Máy Chủ (Server HTTP Client):** [`api.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/core/api.ts) và [`network/`](./network/README.md), cung cấp Axios client để giao tiếp với Backend Server Go (`server/`).
3. **📱 Lõi Nhận Diện Nền Tảng:** [`platform/`](./platform/README.md), phân định runtime (iOS Native Capacitor, Android APK, Electron Desktop, Web).

---

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Phân loại | Mục đích chức năng |
| :--- | :---: | :--- |
| [`wasm/`](./wasm/README.md) | 🟢 **Local In-RAM** | Lõi WebAssembly và ONNX In-Process chạy trực tiếp trong RAM thiết bị. |
| [`platform/`](./platform/README.md) | ⚙️ **Platform** | Nhận diện môi trường hệ điều hành (iOS, Android, Windows, macOS, Linux, Web). |
| [`network/`](./network/README.md) | 🔵 **Server Cloud** | Hạ tầng quản lý kết nối mạng, phát hiện trạng thái Online/Offline. |
| [`constants/`](./constants/README.md) | ⚙️ **Constants** | Hằng số nền tảng lõi và mã lỗi hệ thống. |

---

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Phân loại | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :---: | :--- | :--- |
| [`api.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/core/api.ts) | 224 | 🔵 **Server Cloud** | Axios HTTP client gốc, điều phối kết nối tới Backend Server Go, tự động gắn Bearer Token và xử lý mã lỗi mạng. | `api`, `getBestServer`, `pingServer`, `SERVERS`, `isSafeLocalUrl` |
| [`index.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/core/index.ts) | 3 | 🔄 **Barrel Export** | Xuất bản tập trung client `api`. | `api` *(default export)* |

---

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Không trộn lẫn Wasm và HTTP API:** Mọi logic xử lý ma trận AI và từ điển phải nằm trong `wasm/` hoặc `localTranslator.ts`, không gọi qua `api.ts`.
2. **Phân rã Fractal:** Mỗi thư mục con duy trì $\le 7$ files.
3. **Giới hạn dòng:** Mọi file duy trì nghiêm ngặt $\le 300$ dòng mã nguồn.
