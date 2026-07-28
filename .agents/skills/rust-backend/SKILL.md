---
name: rust-backend
description: >-
  Quy chuẩn lập trình Rust backend trong Tauri V2: cấu trúc module-based,
  state management, error handling, serde, async/tokio, logging, và
  testing. Dùng khi sửa file trong src-tauri/src/**, viết Tauri commands,
  Rust structs, services, hoặc khi user đề cập Rust, backend, commands.
---

# Quy Chuẩn Rust Backend (Module-Based Architecture)

Kỹ năng này định nghĩa các quy tắc và thực hành tốt nhất khi phát triển phần backend bằng Rust cho ứng dụng desktop Tauri V2 sử dụng kiến trúc **Module-Based (Feature-based in Rust)**.

## 1. Cấu Trúc Thư Mục Backend (`src-tauri/src/`)

Các chức năng của backend Rust được chia theo các module chức năng độc lập (tương ứng với các features ở frontend) thay vì phân chia theo lớp công nghệ:

```text
src-tauri/src/
├── main.rs               # Entry point khởi chạy ứng dụng
├── lib.rs                # Khởi tạo app, cấu hình plugin và đăng ký các commands
├── state.rs              # Trạng thái chia sẻ toàn hệ thống (AppState)
├── errors.rs             # Custom Error enum dùng chung (AppError)
├── utils.rs              # Các hàm tiện ích bổ trợ dùng chung toàn cục
├── auth/                 # Module Auth độc lập
│   ├── mod.rs            # Entry point khai báo các module con của Auth
│   ├── commands.rs       # Định nghĩa các hàm #[tauri::command] của Auth
│   ├── models.rs         # Các Structs dữ liệu, DTOs chỉ dùng cho Auth
│   └── service.rs        # Logic xử lý nghiệp vụ của Auth
└── settings/             # Module Settings độc lập
    ├── mod.rs
    ├── commands.rs
    ├── models.rs
    └── service.rs
```

## 2. Tổ Chức Module Con (Rust Modules Pattern)

Mỗi thư mục feature của Rust (như `auth/`) chứa file `mod.rs` khai báo các sub-modules công khai:

```rust
// src-tauri/src/auth/mod.rs
pub mod commands;
pub mod models;
pub mod service;
```

## 3. Đăng Ký Modules & Commands Trong `lib.rs`

Khai báo các module feature ở file cấu hình chính `lib.rs`, sau đó export và đăng ký các commands tương ứng:

```rust
// src-tauri/src/lib.rs
mod auth;
mod settings;
mod errors;
mod state;

use state::AppState;

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new()) // Đăng ký AppState toàn cục
        .invoke_handler(tauri::generate_handler![
            auth::commands::login,
            auth::commands::logout,
            settings::commands::get_config,
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi khi chạy ứng dụng Tauri");
}
```

## 4. Tauri Command Pattern

Mọi command giao tiếp với frontend cần tuân thủ cấu trúc sau:

- Luôn là hàm async.
- Trả về kiểu `Result<T, AppError>` (import `AppError` từ module cha `crate::errors::AppError`).
- Trích xuất state thông qua `tauri::State`.

```rust
// src-tauri/src/auth/commands.rs
use tauri::State;
use crate::state::AppState;
use crate::errors::AppError;
use super::models::{LoginPayload, Session};

#[tauri::command]
pub async fn login(
    state: State<'_, AppState>,
    payload: LoginPayload,
) -> Result<Session, AppError> {
    let auth_service = state.auth_service.lock().await;
    auth_service.authenticate(payload).map_err(AppError::from)
}
```

## 5. Error Handling

Không bao giờ dùng `unwrap()` hoặc `expect()` trong code logic nghiệp vụ (trừ phần khởi tạo cấu hình lúc startup nếu thực sự cần crash app). Thay vào đó, trả về một kiểu lỗi thống nhất có thể serialize sang JSON để frontend dễ dàng đọc.

Sử dụng thư viện `thiserror` để định nghĩa custom error:

```rust
// src-tauri/src/errors.rs
#[derive(Debug, thiserror::Error, serde::Serialize)]
#[serde(tag = "type", content = "message")] // Đảm bảo serialize rõ cấu trúc lỗi sang JS
pub enum AppError {
    #[error("Không tìm thấy: {0}")]
    NotFound(String),

    #[error("Lỗi Database: {0}")]
    Database(String),

    #[error("Lỗi xác thực: {0}")]
    Unauthorized(String),
}

// Tự động chuyển đổi các lỗi từ thư viện bên ngoài bằng `?` operator
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Database(err.to_string())
    }
}
```

## 6. Serde & IPC Data Transfer

Mọi cấu trúc dữ liệu gửi hoặc nhận qua Tauri IPC bridge phải implement các trait serialization của `serde`:

```rust
// src-tauri/src/auth/models.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")] // Đảm bảo đồng bộ với camelCase ở frontend React
pub struct Session {
    pub token: String,
    pub expires_at: u64,
}
```

## 7. Async & Threading

- Sử dụng `tokio` (mặc định đi kèm Tauri) để thực hiện các tác vụ non-blocking/async.
- Với các tác vụ nặng cần tính toán nhiều (CPU-bound), sử dụng `tokio::task::spawn_blocking` để tránh blocking event loop.

## 8. Logging

Sử dụng macro log chuẩn (`info!`, `warn!`, `error!`, `debug!`) từ `log` crate kết hợp với plugin `tauri-plugin-log` để chuyển hướng log lên console hoặc lưu ra file.

```rust
use log::{info, error};

info!("Khởi chạy dịch vụ người dùng...");
```

## 9. Unit & Integration Testing

- Viết các test case của Rust trong cùng file nguồn hoặc thư mục `tests` tùy độ lớn.
- Sử dụng `#[cfg(test)]` để tách biệt mã kiểm thử.
- Sử dụng `#[tokio::test]` cho các test async.

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_expiry() {
        let session = Session { token: "secret".into(), expires_at: 3600 };
        assert_eq!(session.expires_at, 3600);
    }
}
```

## 10. Pre-Commit Checklist (Rust)

Trước khi commit bất kỳ thay đổi nào liên quan đến backend Rust:

- [ ] Chạy `cargo clippy` để kiểm tra lỗi/chất lượng code. Không được để sót cảnh báo nghiêm trọng.
- [ ] Chạy `cargo fmt --check` để đảm bảo code đúng định dạng format.
- [ ] Chạy `cargo test` để đảm bảo tất cả các test case đều pass.
- [ ] Đảm bảo không sử dụng `unwrap()` vô tội vạ.
