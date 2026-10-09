# 📁 Kiểm Thử Chức Năng Ứng Dụng

> **Đường dẫn thư mục:** `frontend/src/tests/functional`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Kiểm tra các luồng nghiệp vụ thực tế như đăng nhập, đổi giọng đọc, phân quyền VIP.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`settings/`](./settings/README.md) | Kiểm Thử Trang Cài Đặt |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| [`frontendCore.test.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/tests/functional/frontendCore.test.ts) | 80 | Kiểm thử chức năng cốt lõi frontend: BasePointManager, ENDPOINTS, LocalTranslator. | `runFrontendCoreTests` |
| [`index.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/tests/functional/index.ts) | 5 | Điểm xuất khẩu tập trung cho bộ kiểm thử chức năng. | *(Internal)* |
| [`run_all_tests.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/tests/functional/run_all_tests.ts) | 112 | Trình khởi chạy toàn bộ 6 nhóm kiểm thử chức năng và xuất báo cáo tổng hợp. | *(Runner)* |
| [`test_auth_google_and_rbac.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/tests/functional/test_auth_google_and_rbac.ts) | 239 | Kiểm thử xác thực Google Auth, phân quyền RBAC 3 tầng, luồng nạp VIP ACID và Live Stream SSE. | `runAuthAndRbacTests` |
| [`test_buttons_and_actions.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/tests/functional/test_buttons_and_actions.ts) | 210 | Kiểm thử toàn diện 400 nút bấm và các hành động API thực tế trong giao diện. | `runButtonAndActionTests` |
| [`test_cross_platform_mocking.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/tests/functional/test_cross_platform_mocking.ts) | 110 | Kiểm thử đa nền tảng Single Source of Truth: Web, Android, iOS, Windows, Linux; xác nhận 100% Local On-Device (`127.0.0.1:5051`). | `runCrossPlatformMockingTests`, `TestResult` |
| [`test_form_factor_physical_ux.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/tests/functional/test_form_factor_physical_ux.ts) | 187 | Kiểm định thiết kế vật lý UI/UX: Safe Area Notch, bù trừ bàn phím ảo, cử chỉ vuốt iOS Edge Swipe. | `FormFactorTestResult`, `calculateKeyboardAdjustedOffset`, `validateSafeAreaMetrics`, `resolveReadingSwipeGesture` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
