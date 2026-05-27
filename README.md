# AutoVPN

[![Tauri Version](https://img.shields.io/badge/Tauri-v2.0-blue?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app/)
[![Rust Version](https://img.shields.io/badge/Rust-1.75%2B-orange?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![React Version](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Mantine UI](https://img.shields.io/badge/Mantine-v9.0-teal?style=flat-square&logo=mantine&logoColor=white)](https://mantine.dev/)
[![App Version](https://img.shields.io/badge/Version-0.5.8-success?style=flat-square)](https://github.com/haiphamngoc-dev/autovpn/releases)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

AutoVPN là một ứng dụng desktop chuyên nghiệp chạy ngầm trên khay hệ thống (System Tray), được thiết kế để tự động kết nối, khôi phục kết nối thông minh và quản lý credentials cũng như mã xác thực OTP/TOTP động cho các kết nối VPN hệ thống.

Dự án được xây dựng trên mô hình tối ưu hóa tài nguyên **Tauri v2 + Rust + React + Mantine UI**, mang lại hiệu năng cao, chiếm dụng RAM cực kỳ nhỏ nhẹ và bảo mật tuyệt đối cho thông tin của bạn.

---

## Các tính năng chính

- **Tự động kết nối (Auto-Connect)**: Tự động khởi chạy và thiết lập kết nối trực tiếp đến profile VPN mặc định ngay sau khi bạn khởi động hệ thống.
- **Khôi phục kết nối thông minh (Auto-Reconnect)**: Giám sát trạng thái mạng thời gian thực thông qua cơ chế lắng nghe sự kiện D-Bus (Linux NetworkManager). Tự động phát hiện khi mất kết nối mạng và thiết lập lại VPN ngay khi đường truyền internet khả dụng, tôn trọng cấu hình số lần thử tối đa (`maxAttempts`).
- **Đồng bộ OTP/TOTP động**: Hỗ trợ đắc lực cho các kết nối VPN yêu cầu mật khẩu bảo mật MFA dạng ghép chuỗi: `{Mã OTP 6 số}{Mật khẩu cố định}`. Hệ thống tự sinh mã theo chu kỳ 30 giây giúp lược bỏ thao tác thủ công.
- **Bảo mật phần cứng & Keyring**:
  - Mã hóa an toàn chuẩn quân sự **AES-GCM** cho dữ liệu nhạy cảm.
  - Tích hợp trực tiếp vào **Hệ thống Keyring của Hệ điều hành** (Secret Service API trên Linux thông qua DBus, Keychain trên macOS, Credential Manager trên Windows).
- **Đồng bộ hóa tài khoản**: Tự động phát hiện và trích xuất tên đăng nhập (`username`) từ cấu hình VPN hệ thống để hiển thị dạng chỉ đọc, giảm thiểu sai sót cấu hình.
- **Khóa ứng dụng bảo mật (App Lock)**: Thiết lập mã PIN để mã hóa và khóa màn hình giao diện, ngăn chặn truy cập trái phép.
- **Giao diện Responsive**: Hỗ trợ chế độ Sáng/Tối (Light/Dark mode) cùng thanh tiêu đề tùy chỉnh (Custom Titlebar) mượt mà.
- **Hỗ trợ đa ngôn ngữ**: Bản địa hóa hoàn chỉnh với hai ngôn ngữ Tiếng Anh (English) và Tiếng Việt.

---

## Kiến trúc công nghệ

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│    Mantine UI 9  •  TypeScript  •  i18next  •  Vite     │
└────────────────────────────┬────────────────────────────┘
                             │ (IPC Bridge)
┌────────────────────────────▼────────────────────────────┐
│                    Backend (Tauri v2)                   │
│        Rust Core  •  zbus D-Bus Monitor  •  Updater     │
└────────────────────────────┬────────────────────────────┘
                             │ (OS APIs)
┌────────────────────────────▼────────────────────────────┐
│                  Hệ thống & Phần cứng                   │
│     NetworkManager  •  System Keyring  •  Autostart     │
└─────────────────────────────────────────────────────────┘
```

- **Rust Backend**: Đảm nhận vai trò giám sát, xử lý các tác vụ mức thấp, an toàn bộ nhớ và quản lý mã hóa thông tin.
- **React Frontend**: Hiển thị bảng điều khiển mượt mà, quản lý trạng thái hiển thị trực quan.
- **zbus (D-Bus Library)**: Lắng nghe bất đồng bộ các tín hiệu NetworkManager trên Linux để phát hiện tức thời sự thay đổi cấu hình mạng mà không tiêu tốn tài nguyên CPU.
- **Tauri Auto-Updater**: Đóng gói bảo mật bằng chữ ký số, hỗ trợ tự cập nhật tải về ứng dụng tự động trực tiếp từ GitHub Releases.

---

## Cơ chế hoạt động của OTP động

Đối với các kết nối VPN yêu cầu xác thực 2 lớp (Multi-Factor Authentication):

1. **Thiết lập khóa**: Bạn cấu hình **Base32 TOTP secret key** từ mã QR của quản trị viên cấp vào ứng dụng AutoVPN.
2. **Kích hoạt kết nối**: Khi khởi tạo kết nối, AutoVPN sẽ:
   - Sinh mã xác thực 6 chữ số dựa theo thuật toán chuẩn RFC 6238.
   - Tạo chuỗi mật khẩu hoàn chỉnh theo định dạng: `Mật khẩu = {Mã OTP}{Base Password}`.
   - Gửi an toàn credentials vào hệ thống quản lý mạng và yêu cầu dịch vụ mạng khởi chạy tiến trình kết nối.

---

## Hướng dẫn cài đặt & Phát triển

### Yêu cầu hệ thống (Linux)

Ứng dụng cần các thư viện quản lý kết nối và giao diện khay hệ thống. Hãy cài đặt chúng qua trình quản lý gói của bạn:

```bash
sudo apt update
sudo apt install -y \
  network-manager \
  libayatana-appindicator3-1 \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  libssl-dev \
  libgtk-3-dev
```

### Khởi chạy môi trường phát triển (Development)

1. **Clone mã nguồn dự án**:

   ```bash
   git clone https://github.com/haiphamngoc-dev/autovpn.git
   cd autovpn
   ```

2. **Cài đặt các gói thư viện Node.js**:

   ```bash
   pnpm install
   ```

3. **Khởi chạy ứng dụng ở chế độ nhà phát triển (Hot reload)**:
   ```bash
   pnpm tauri dev
   ```

### Đóng gói ứng dụng (Production Build)

Để biên dịch và đóng gói ứng dụng thành tệp cài đặt `.deb` tiêu chuẩn:

```bash
pnpm tauri build -- --bundles deb
```

Đầu ra sau khi đóng gói sẽ nằm tại thư mục `src-tauri/target/release/bundle/deb/`.

---

## Giấy phép (License)

Dự án được phân phối dưới giấy phép **MIT License**. Xem chi tiết tại tệp [LICENSE](LICENSE).

Bản quyền thuộc về © 2026 **Hai Pham Ngoc** <ngochai285nd@gmail.com>.
