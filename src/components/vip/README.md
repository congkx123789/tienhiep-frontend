# 📁 Thành Phần Hiển Thị Huy Hiệu & Trạng Thái VIP

> **Đường dẫn thư mục:** `frontend/src/components/vip`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Biểu tượng vương miện, nhãn VIP lấp lánh và thanh cấp bậc đạo hữu.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `RequireVIP.tsx` | 76 | Component bọc ngoài các nút bấm hoặc tính năng VIP đạt chuẩn Enterprise | `RequireVIP` |
| `VipGuard.tsx` | 52 | Module xử lý chức năng VipGuard. | `VipGuard` |
| `VipUpsellModal.tsx` | 72 | Component hộp thoại (Modal popup) hiển thị và xử lý luồng người dùng. | `VipUpsellModal` |
| `index.ts` | 6 | Module xử lý chức năng index. | *(Internal)* |
| `useVipListener.ts` | 65 | Custom React Hook đóng gói logic và quản lý lifecycle cục bộ. | `useVipListener` |
| `useVipModalStore.ts` | 42 | Component hộp thoại (Modal popup) hiển thị và xử lý luồng người dùng. | `openVipModal`, `closeVipModal`, `useVipModalStore` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
