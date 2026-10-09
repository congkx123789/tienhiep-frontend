# 📁 Cổng Chặn VIP (VIP Feature Gate)

> **Đường dẫn thư mục:** `frontend/src/components/modals/vip-gate`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Cơ chế chặn truy cập vào tính năng cao cấp khi tài khoản chưa đạt cấp độ VIP tương ứng.

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`components/`](./components/README.md) | Các Thành Phần Con Của Cổng Chặn VIP |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `VipGate.types.ts` | 57 | ═════════════════════════════════════════════════════════════════════════════ | `PlanItem`, `PaymentData`, `GateStep`, `GateTab`, `PLANS` |
| `index.tsx` | 183 | Header Modal | `VipGateModal` |
| `useAdReward.ts` | 59 | Custom React Hook đóng gói logic và quản lý lifecycle cục bộ. | `useAdReward` |
| `useVipPayment.ts` | 111 | Custom React Hook đóng gói logic và quản lý lifecycle cục bộ. | `useVipPayment` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
