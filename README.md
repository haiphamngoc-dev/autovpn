# AutoVPN 🛡️🚀

**AutoVPN** là một ứng dụng desktop chuyên nghiệp chạy ngầm trên khay hệ thống (System Tray), được thiết kế để tự động kết nối, tự động khôi phục kết nối và quản lý mã xác thực OTP/TOTP động cho các kết nối VPN hệ thống.

Dự án được xây dựng bằng công nghệ hiện đại **Tauri v2 + Rust + React + Mantine UI**, mang lại trải nghiệm mượt mà, bảo mật tuyệt đối và tài nguyên sử dụng cực kỳ nhỏ nhẹ.

## 🌟 Tính năng nổi bật

* **⚡ Tự động kết nối (Auto-Connect)**: Tự động khởi chạy và kết nối trực tiếp đến profile VPN mặc định ngay sau khi bạn đăng nhập vào máy tính.
* **🔄 Tự động kết nối lại (Auto-Reconnect)**: Giám sát trạng thái kết nối thời gian thực thông qua cơ chế D-Bus (Linux NetworkManager). Tự động phát hiện khi mất kết nối và kết nối lại sau 15 giây.
* **🔑 Quản lý OTP/TOTP động**: Hỗ trợ đắc lực cho các kết nối VPN yêu cầu mật khẩu kết hợp: `{6 số OTP động}{mật khẩu cố định}`. Mã OTP được tạo tự động mỗi lần kết nối mà bạn không cần mở điện thoại.
* **🔒 Bảo mật thông tin tối đa**:
  * Lưu trữ mật khẩu và mã khóa TOTP an toàn bằng mã hóa **AES-GCM**.
  * Tích hợp trực tiếp vào **Keyring hệ thống** của từng hệ điều hành (Secret Service trên Linux, Keychain trên macOS, Credential Manager trên Windows).
* **🖥️ Tự động đồng bộ tài khoản**: Trích xuất trực tiếp tên đăng nhập (`username`) từ cấu hình VPN hệ thống để hiển thị dạng chỉ đọc, tránh lỗi gõ sai và xung đột cấu hình.
* **🛡️ Khóa ứng dụng (App Lock)**: Bảo vệ thông tin nhạy cảm và ngăn chặn truy cập trái phép bằng mã PIN bảo mật.
* **🎨 Giao diện Premium & Tinh tế**: Thanh tiêu đề tùy chỉnh (Custom Titlebar), hỗ trợ chế độ Sáng/Tối (Light/Dark mode) cùng thiết kế responsive bóng bẩy.
* **🌐 Đa ngôn ngữ (Bilingual)**: Hỗ trợ hoàn chỉnh tiếng Anh và tiếng Việt.

## 🛠️ Công nghệ sử dụng

* **Backend**: Rust (Tauri v2) - Tối ưu hóa hiệu năng hệ thống, an toàn bộ nhớ.
* **Frontend**: React + TypeScript + Mantine UI v7.
* **Keyring Integration**: `dbus-secret-service-keyring-store` (Linux), `keyring-core`.
* **State & Platform Monitor**: Giám sát NetworkManager của Linux thông qua D-Bus kết nối trực tiếp.

## ⚙️ Cơ chế hoạt động của OTP động
Đối với các mạng VPN yêu cầu bảo mật 2 lớp (MFA):
1. Bạn quét mã QR và lấy mã bí mật **TOTP secret key (Base32)** cấu hình vào AutoVPN.
2. Khi thực hiện kết nối, AutoVPN sẽ:
   - Tạo mã OTP 6 chữ số ngẫu nhiên theo thời gian thực từ secret key.
   - Ghép mã OTP này lên trước mật khẩu tĩnh của bạn: `Mật khẩu kết nối = {Mã OTP}{Mật khẩu cố định}`.
   - Ghi mật khẩu tạm thời này vào file bí mật dùng một lần và kích hoạt kết nối thông qua `nmcli`.

## 🚀 Hướng dẫn cài đặt & Phát triển

### Yêu cầu hệ thống (Linux)

Hãy đảm bảo bạn đã cài đặt các công cụ quản lý mạng và khay hệ thống tương thích:

```bash
sudo apt update
sudo apt install network-manager libayatana-appindicator3-1 libwebkit2gtk-4.1-dev build-essential curl wget libssl-dev libgtk-3-dev
```

### Khởi chạy môi trường phát triển (Development)

1. **Clone mã nguồn ứng dụng**:
   ```bash
   git clone https://github.com/haiphamngoc-dev/autovpn.git
   cd autovpn
   ```

2. **Cài đặt các thư viện Frontend**:
   ```bash
   npm install
   ```

3. **Khởi chạy chế độ nhà phát triển (Hot reload)**:
   ```bash
   npm run tauri dev
   ```

### Đóng gói ứng dụng (Production Build)

Để build đóng gói ứng dụng thành file `.deb` (dành cho Debian/Ubuntu):

```bash
npm run tauri build -- --bundles deb
```

File cài đặt sau khi đóng gói sẽ nằm tại thư mục `src-tauri/target/release/bundle/deb/`.

## 📄 Giấy phép (License)

Dự án được phân phối dưới giấy phép **MIT License**. Xem chi tiết tại file [LICENSE](LICENSE).

Bản quyền thuộc về © 2026 **Hai Pham Ngoc** <ngochai285nd@gmail.com>.
