# 📁 Các Hàm Tiện Ích & Kịch Bản Nhúng (Utilities)

> **Đường dẫn thư mục:** `frontend/src/utils`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Bao gồm các hàm xử lý chuỗi, định dạng ngày tháng, lưu trữ localStorage và kịch bản tiêm vào trang web ngoại bộ.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`webview-injected/`](./webview-injected/README.md) | Kịch Bản Tiêm Vào Webview Đọc Truyện (Injected Scripts) |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| [`accountStorage.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/utils/accountStorage.ts) | 87 | Quản lý lưu trữ LocalStorage phân tách theo từng tài khoản (Account-Scoped Storage). | `getAccountScope`, `getAccountKey`, `getAccountItem`, `setAccountItem`, `removeAccountItem` |
| [`electron.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/utils/electron.ts) | 17 | Nhận diện môi trường Desktop Electron và Capacitor Native. | `isElectron`, `isCapacitorNative`, `isNativeApp`, `isWebPlatform`, `getElectronAPI` |
| [`index.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/utils/index.ts) | 4 | Điểm tập hợp xuất khẩu tiện ích utils. | *(Internal)* |
| [`localTranslator.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/utils/localTranslator.ts) | 173 | Bộ điều phối dịch thuật C++ Native Core (CMLM NAT, Mode 1-4, Hán Việt, Vietphrase, Raw), tự động định tuyến Mobile Native qua Remote Tunnel/Wi-Fi và Desktop qua 127.0.0.1, hỗ trợ CapacitorHttp tốc độ cao trên iOS/Android. | `localTranslator` |
| [`sentenceSplitter.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/utils/sentenceSplitter.ts) | 54 | Thuật toán tách câu & gom cụm thông minh chuẩn Google Speech (Smart Chunking: 45 - 220 ký tự), tự động gộp thoại ngắn vào câu liền kề để tránh giật lag giọng đọc. | `splitAndMergeSentences` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
