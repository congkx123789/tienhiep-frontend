# 📁 Hệ Thống Hộp Thoại (Modals & Dialogs)

> **Đường dẫn thư mục:** `frontend/src/components/modals`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Quản lý toàn bộ các popup modal che phủ màn hình để xử lý luồng xác thực, nạp VIP, báo lỗi và cấu hình dịch.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`auth-modal/`](./auth-modal/README.md) | Hộp Thoại Đăng Nhập / Đăng Ký |
| [`confirm-modal/`](./confirm-modal/README.md) | Hộp Thoại Xác Nhận Hành Động |
| [`report-modal/`](./report-modal/README.md) | Hộp Thoại Báo Lỗi / Góp Ý |
| [`translation-settings/`](./translation-settings/README.md) | Cài Đặt Bộ Máy Dịch & Từ Điển |
| [`vip/`](./vip/README.md) | Hộp Thoại Nâng Cấp VIP (VIP Upsell Modal) |
| [`vip-gate/`](./vip-gate/README.md) | Cổng Chặn VIP (VIP Feature Gate) |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `AiUpgradeModal.tsx` | 278 | Glow effect | `AiUpgradeModal` |
| `ChromeMobileBookmarksModal.tsx` | 159 | Header | `ChromeMobileBookmarksModal` |
| `index.ts` | 8 | Module xử lý chức năng index. | *(Internal)* |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
