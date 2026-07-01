# Hướng Dẫn Phát Triển App Mobile Với Capacitor (Android & iOS)

Dự án **frontend-web** của bạn đã được tích hợp thành công bộ khung **Capacitor** để bọc ứng dụng React/Vite thành Mobile App. Cấu hình đã được tối ưu hóa để trỏ đúng thư mục build `dist-web` của Vite.

---

## 🚀 Kịch Bản Build & Run Trên Mobile

Để tự động hóa quá trình phát triển, các shortcut scripts sau đã được thêm vào `frontend-web/package.json`:

### 🤖 Cho Android (Chạy trên Linux/Windows)
1. **Mở dự án trên Android Studio:**
   ```bash
   npm run cap:build:android
   ```
   *Lệnh này sẽ tự động chạy: `vite build` (sinh thư mục `dist-web`) $\rightarrow$ `cap sync` (đồng bộ code sang thư mục `android/`) $\rightarrow$ mở Android Studio.*

2. **Cách mở bằng tay:**
   Mở phần mềm **Android Studio**, chọn **Open Project** và chỉ tới thư mục `frontend-web/android`.

### 🍎 Cho iOS (Chỉ chạy trên macOS)
*Lưu ý: Bạn bắt buộc phải cài đặt phần mềm **Xcode** trên macOS.*
```bash
npm run cap:build:ios
```

---

## 🔄 Quy Trình Cập Nhật Khi Có Thay Đổi Code React
Mỗi khi bạn chỉnh sửa bất kỳ giao diện hoặc logic nào trong code React (`src/`), hãy chạy lệnh sau để cập nhật sang app mobile:
```bash
# Đối với Android
npm run build && npx cap sync android

# Đối với iOS
npm run build && npx cap sync ios
```

---

## 🛠️ Lưu Ý Quan Trọng Khi Chạy Trên Máy Ảo (Emulator)

### 1. Địa Chỉ Gọi API Local (Local Host Loopback)
* Nếu bạn chạy server API cục bộ trên máy tính (`localhost:5051`), máy ảo Android sẽ **không** hiểu `localhost` là máy tính của bạn (nó tự coi `localhost` là chính nó).
* Thay vào đó, bạn phải cấu hình API trỏ về:
  * **Android Emulator:** `http://10.0.2.2:5051` (IP đặc biệt để Android Emulator kết nối ngược lại máy host của bạn).
* Trong khi đó, nếu chạy bản **Production**, hệ thống sẽ tự động ping và gọi đến live server `https://cong123779-tienhiep-api.hf.space` nên sẽ chạy bình thường mà không cần sửa cấu hình.

### 2. Cài Đặt Android Studio Trên Ubuntu Linux
Nếu máy tính của bạn chưa có sẵn Android Studio / SDK:
```bash
# Cài đặt Android Studio qua Snap
sudo snap install android-studio --classic
```
Sau đó mở Android Studio, làm theo hướng dẫn Setup Wizard để tự động tải về Android SDK mới nhất và cấu hình thiết bị ảo (AVD - Android Virtual Device).
