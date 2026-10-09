# 📁 Hộp Thoại Báo Lỗi / Góp Ý

> **Đường dẫn thư mục:** `frontend/src/components/modals/report-modal`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Cho phép người dùng phản hồi các vấn đề liên quan đến chất lượng dịch thuật hoặc lỗi tải chương.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `FeedbackReportModal.tsx` | 196 | Header | `FeedbackReportModal` |
| `TranslationReportModal.tsx` | 187 | Hộp thoại báo lỗi và đề xuất bản dịch tối ưu gửi trực tiếp về máy chủ qua api client | `TranslationReportModal` |
| `index.ts` | 3 | Module xử lý chức năng index. | *(Internal)* |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
