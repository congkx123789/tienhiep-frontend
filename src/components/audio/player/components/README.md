# 📁 Các Thành Phần Con Của Audio Player

> **Đường dẫn thư mục:** `frontend/src/components/audio/player/components`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Các nút bấm điều khiển, thanh trượt thời lượng (seekbar), bộ chọn tốc độ và menu điều chỉnh chi tiết cho Audio Player.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| `MiniPlayer.tsx` | 109 | Giao diện thanh phát thu nhỏ tiện lợi khi cuộn trang | `MiniPlayer` |
| `PlayerControls.tsx` | 104 | Cụm nút bấm điều khiển Play/Pause, tua câu, chuyển chương | `PlayerControls` |
| `PlayerSettingsModal.tsx` | 121 | Hộp thoại cài đặt tinh gọn cho mô hình đơn giọng Matcha-TTS C++ (tốc độ, âm lượng, hẹn giờ ngủ) | `PlayerSettingsModal` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
