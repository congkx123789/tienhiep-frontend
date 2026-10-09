# 📁 Các Thành Phần Của Trang Khám Phá

> **Đường dẫn thư mục:** `frontend/src/pages/discovery/discover/components`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)

## 📌 Tổng Quan & Mục Đích

Thanh tìm kiếm, bộ lọc tag thể loại và danh sách truyện gợi ý.

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| `DiscoverBookGrid.tsx` | 91 | Module xử lý chức năng DiscoverBookGrid. | `DiscoverBookGrid` |
| `DiscoverFilterBar.tsx` | 205 | 🍯 Bẫy chống Bot (Honeypot Trap): Bot tự động điền ô này sẽ bị từ chối ngay | `DiscoverFilterBar` |
| `DiscoverHero.tsx` | 97 | Module xử lý chức năng DiscoverHero. | `DiscoverHero` |
| `DiscoverRawSources.tsx` | 50 | Module xử lý chức năng DiscoverRawSources. | `DiscoverRawSources` |
| `DiscoverSidebar.tsx` | 122 | Leaderboard | `DiscoverSidebar` |

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân rã Fractal:** Mỗi module con khi có độ phức tạp tăng cao phải được chia nhỏ vào thư mục con tương ứng, không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
2. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt dưới 300 dòng mã nguồn để tránh quá tải bộ nhớ đệm và duy trì tính dễ hiểu.
3. **Độc lập và Type Safe:** Mọi tương tác dữ liệu phải có định nghĩa kiểu TypeScript rõ ràng, tránh sử dụng kiểu `any` tùy tiện.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
