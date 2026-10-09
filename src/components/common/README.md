# 📁 Các Thành Phần Giao Diện Chung

> **Đường dẫn thư mục:** `frontend/src/components/common`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Các thành phần UI xuất hiện xuyên suốt hệ thống như ngăn kéo tương tác xã hội (social drawer), thanh chân trang (Footer), quảng cáo tài trợ (GoogleAd) và xử lý lỗi (ErrorBoundary).

## 📂 Danh Sách Thư Mục Con (Subdirectories)

| Thư mục con | Mục đích chức năng |
| :--- | :--- |
| [`social-drawer/`](./social-drawer/README.md) | Ngăn Kéo Tương Tác Cộng Đồng (Social Drawer) |

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `CircularProgress.tsx` | 107 | Vòng tròn hiển thị tiến độ từ 0 đến 100%. | `CircularProgress` |
| `DownloadIcon.tsx` | 24 | Biểu tượng tải sách đa kích thước. | `DownloadIcon` |
| `ErrorBoundary.tsx` | 172 | Bắt ngoại lệ và hiển thị giao diện phục hồi sự cố toàn cục. | `ErrorBoundary` |
| `Footer.tsx` | 185 | Thanh chân trang ứng dụng hiển thị thông tin và liên kết hỗ trợ. | `Footer` |
| `FreeEventBanner.tsx` | 51 | Banner thông báo sự kiện miễn phí toàn server. | `FreeEventBanner` |
| `GoogleAd.tsx` | 171 | Thành phần quảng cáo Google AdSense & đối tác tài trợ hệ thống. | `GoogleAd` |
| `index.ts` | 7 | Điểm xuất khẩu barrel module. | Toàn bộ từ các tệp trên |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.
