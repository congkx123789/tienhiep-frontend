# 📁 Dịch Vụ Đọc Sách & Dịch Thuật (Reader Services)

> **Đường dẫn thư mục:** `frontend/src/services/reader`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le 300$ dòng/file)  
> **Ranh giới:** Phân định rõ ràng giữa **Server Cloud API** và **Local In-RAM Facade**.

---

## 📌 Tổng Quan & Phân Định Trách Nhiệm

Thư mục này chứa các dịch vụ phục vụ trải nghiệm đọc truyện của người dùng, phân rõ làm 2 luồng:
1. **🔵 Nhóm Server Cloud API:** Lấy dữ liệu 931k tiểu thuyết và đồng bộ tiến độ với Backend Go Server (`bookService.ts`, `tocHistoryService.ts`).
2. **🟢 Nhóm Local In-RAM Facade:** Điều phối sang lõi C++ Native In-RAM (`translateService.ts`, `ttsService.ts`), 100% không dùng mạng.

---

## 📄 Chi Tiết Các Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Phân Loại | Vai Trò & Trách Nhiệm Chính | Các Exports Chính |
| :--- | :---: | :---: | :--- | :--- |
| `bookService.ts` | 47 | 🔵 **Server Cloud** | Kết nối REST API Backend lấy danh mục 931k truyện, chi tiết sách, chương, tìm kiếm tác giả. | `bookService` |
| `tocHistoryService.ts` | 188 | 🔵 **Server Cloud** | Ghi bản ghi mục lục (TOC) vào cache và đồng bộ lên Backend Go (`/api/user/toc-history`). | `PageTocRecord`, `recordPageToc`, `getLocalPageToc` |
| `translateService.ts` | 31 | 🟢 **Local In-RAM** | Facade gọi trực tiếp vào `localTranslator` (C++ Native Core / Wasm In-RAM), 100% không dùng mạng. | `translateService` |
| `ttsService.ts` | 26 | 🟢 **Local In-RAM** | Tạo URL gọi endpoint TTS nội bộ trên thiết bị (`/api/tts/speak`). | `ttsService` |
| `index.ts` | 8 | 🔄 **Barrel Export** | Xuất bản tập trung các dịch vụ đọc truyện. | *(Internal)* |

---

## ⚙️ Quy Tắc Thiết Kế & Bảo Trì

1. **Phân định ranh giới:** Không bao giờ trộn lẫn logic gọi HTTP mạng vào `translateService.ts`. Dịch thuật và TTS luôn ưu tiên chạy On-Device.
2. **Phân rã Fractal:** Không để dồn nhiều hơn 7 file mã nguồn trong cùng một thư mục.
3. **Giới hạn dòng:** Mọi file trong thư mục phải duy trì nghiêm ngặt $\le 300$ dòng mã nguồn.
