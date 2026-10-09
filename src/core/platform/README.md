# 📁 Nhận Diện Nền Tảng Hoạt Động (Cross-Platform Detection)

> **Đường dẫn thư mục:** `frontend/src/core/platform`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Xác định ứng dụng đang chạy trên iOS Native (Capacitor), Android Native, Electron Desktop hay Web Browser để bật các tính năng phần cứng tương ứng.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| [`basePoint.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/core/platform/basePoint.ts) | 127 | Điều phối Base URL tập trung phân định chi tiết theo từng OS (100% Local On-Device / In-RAM Engine `127.0.0.1:5051` cho cả iOS, Android và Desktop). | `BASE_POINT_CONFIG`, `OS_ENDPOINTS`, `isAcceptableServerUrl`, `BasePointManager` |
| [`detector.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/core/platform/detector.ts) | 161 | Nhận diện chính xác hệ điều hành thực thi (`detectOS`: iOS, Android, Windows, Linux, macOS, Web) và nền tảng runtime (`detectPlatform`: Electron, Capacitor, Web); hỗ trợ mock platform & OS cho testing. | `setMockPlatform`, `detectPlatform`, `detectOS`, `CURRENT_OS`, `isWindows`, `isLinux`, `isMacOS`, `isIOS`, `isAndroid` |
| [`index.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/core/platform/index.ts) | 3 | Điểm xuất khẩu tập trung cho module platform: tái xuất `BasePointManager`, `detector`. | `BasePointManager`, `detectPlatform`, `detectOS` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
