# 📁 Các Thành Phần Con Của Cài Đặt Dịch

> **Đường dẫn thư mục:** `frontend/src/components/modals/translation-settings/components`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Các tab lựa chọn từ điển, thanh điều chỉnh thuật toán CMLM NAT và công cụ kiểm thử nhanh.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| [`ActionToolsGrid.tsx`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/components/modals/translation-settings/components/ActionToolsGrid.tsx) | 74 | Lưới công cụ thao tác nhanh: xóa cache, nạp lại model, kiểm tra trạng thái dịch. | `ActionToolsGrid` |
| [`AdvancedTab.tsx`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/components/modals/translation-settings/components/AdvancedTab.tsx) | 88 | Tab nâng cao: Tốc độ cuộn trang, tự động phát âm thanh, tùy biến cache bộ nhớ. | `AdvancedTab` |
| [`HistoryTab.tsx`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/components/modals/translation-settings/components/HistoryTab.tsx) | 84 | Tab lịch sử: Xem lại lịch sử các câu dịch gần nhất, dọn dẹp lịch sử an toàn. | `HistoryTab` |
| [`ModeSelector.tsx`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/components/modals/translation-settings/components/ModeSelector.tsx) | 141 | Bộ lựa chọn chế độ dịch nơ-ron: Mode 1-4, CMLM NAT, Vietphrase, Hán Việt, Raw. | `ModeItem`, `ModeGroup`, `BASE_MODE_GROUPS`, `SERVER_MODE_GROUP`, `ModeSelector` |
| [`ToolsTab.tsx`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/components/modals/translation-settings/components/ToolsTab.tsx) | 144 | Tab công cụ chẩn đoán: Tổng quan mô hình AI, trạng thái kết nối máy chủ Core. | `ToolsTab` |
| [`TranslationAndTtsTester.tsx`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/components/modals/translation-settings/components/TranslationAndTtsTester.tsx) | 280 | Công cụ kiểm thử trực tiếp: Hỗ trợ chuyển đổi nhanh toàn bộ mode dịch và giọng đọc C++ Matcha-TTS ONNX 100% Local On-Device (`127.0.0.1:5051`), loại bỏ hoàn toàn LAN IP ảo. | `TranslationAndTtsTester` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
