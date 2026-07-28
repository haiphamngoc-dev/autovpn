---
name: tauri
description: >-
  Tauri V2 framework: cấu hình, capabilities, plugins, IPC bridge,
  multi-window, build & distribution. Dùng khi sửa tauri.conf.json,
  capabilities/*, thêm plugins, cấu hình build, hoặc khi user đề cập
  Tauri, desktop, window, tray, build, distribute.
---

# Quy Chuẩn Tauri V2 Framework

Kỹ năng này định nghĩa các hướng dẫn và thực hành tốt nhất khi làm việc với Tauri V2, quản lý bảo mật thông qua capabilities, tích hợp plugin và thiết lập cầu nối IPC (Inter-Process Communication).

## 1. Cấu trúc Project Tauri V2

Dự án Tauri V2 tiêu chuẩn gồm hai phần chính:

- **Frontend** (`src/`): Ứng dụng web chạy bằng React + TypeScript + Vite.
- **Backend** (`src-tauri/`): Mã nguồn Rust quản lý vòng đời ứng dụng desktop và quyền truy cập tài nguyên hệ điều hành.

## 2. Capabilities & Permissions (Tối Quan Trọng)

Tauri V2 giới thiệu hệ thống bảo mật dựa trên **Capabilities** để kiểm soát chặt chẽ những APIs nào của Tauri được phép gọi từ frontend.

- Toàn bộ các file định nghĩa capability nằm trong thư mục `src-tauri/capabilities/`.
- Mặc định, một file capability được viết bằng JSON/JSONC định cấu hình quyền hạn cho các windows cụ thể.
- Tuân thủ nguyên tắc **least privilege** (cấp phát quyền hạn tối thiểu). Không cấp phát quyền wildcards `*` trừ phi thực sự cần thiết.

Ví dụ định nghĩa capability (`src-tauri/capabilities/default.json`):

```json
{
  "$schema": "../schemas/capability-schema.json",
  "identifier": "default",
  "description": "Các quyền cơ bản dành cho cửa sổ chính",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:allow-read-text-file",
    "dialog:allow-open",
    "shell:allow-open"
  ]
}
```

## 3. Quản lý Plugins

Sử dụng các plugin chính thức của Tauri V2 (ví dụ: `tauri-plugin-fs`, `tauri-plugin-dialog`, `tauri-plugin-store`, `tauri-plugin-log`) thay vì tự code thủ công lại logic hệ thống.

### Quy trình tích hợp plugin

1. Thêm crate vào `Cargo.toml` của backend Rust (dùng `cargo add tauri-plugin-store`).
2. Khởi tạo plugin trong file `lib.rs`:

   ```rust
   tauri::Builder::default()
       .plugin(tauri_plugin_store::Builder::default().build())
       // ...
   ```

3. Cài đặt dependency phía frontend JS/TS (nếu plugin yêu cầu API client):

   ```bash
   pnpm add @tauri-apps/plugin-store
   ```

4. Bật permissions của plugin tương ứng trong file `src-tauri/capabilities/default.json`.

## 4. Cầu nối IPC (IPC Bridge)

Giao tiếp giữa frontend và backend thông qua hai cơ chế chính:

### A. Invoke (Frontend gọi Backend và nhận phản hồi)

- Frontend React:

  ```typescript
  import { invoke } from "@tauri-apps/api/core";

  async function loadUser(id: string) {
    try {
      const user = await invoke<User>("get_user", { id });
      return user;
    } catch (error) {
      console.error("Lỗi khi tải user:", error);
    }
  }
  ```

### B. Events (Gửi tin nhắn một chiều, bất đồng bộ)

- **Từ Frontend gửi lên Backend**: Dùng `emit`:

  ```typescript
  import { emit } from "@tauri-apps/api/event";
  emit("frontend-event", { msg: "Hello from React" });
  ```

- **Từ Backend gửi xuống Frontend**: Dùng `emit` từ window hoặc app handle:

  ```rust
  use tauri::Emitter;

  #[tauri::command]
  fn trigger_backend_work(window: tauri::Window) {
      window.emit("backend-event", Payload { data: "success".into() }).unwrap();
  }
  ```

- **Frontend lắng nghe Event**:

  ```typescript
  import { listen } from "@tauri-apps/api/event";

  useEffect(() => {
    const unlisten = listen<Payload>("backend-event", (event) => {
      console.log("Nhận dữ liệu từ Rust:", event.payload);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);
  ```

## 5. Cấu hình Cửa sổ & Trạng thái Hệ thống

- Toàn bộ thiết lập của ứng dụng nằm tại `src-tauri/tauri.conf.json`.
- Cấu hình kích thước mặc định, trạng thái resizable, và title cửa sổ chính xác trong mục `"windows"`.
- Không sử dụng hardcode devServer URL khác cổng mặc định `1420` nếu không có lý do đặc biệt.

## 6. Kỹ Thuật Tích Hợp Nâng Cao (Advanced Features)

Để xây dựng một ứng dụng desktop chuyên nghiệp, Tauri V2 cung cấp các API tích hợp sâu vào hệ điều hành:

### A. Màn hình chờ (Splashscreen)

Để tối ưu hóa trải nghiệm khởi động, cấu hình cửa sổ `main` ẩn (`visible: false`) và cửa sổ `splashscreen` hiển thị (`visible: true`) trong `tauri.conf.json`. Khi backend/frontend khởi tạo xong, thực hiện đóng splashscreen và hiện cửa sổ chính:

```rust
// src-tauri/src/lib.rs (hoặc commands)
use tauri::Manager;

#[tauri::command]
fn close_splashscreen(app: tauri::AppHandle) {
    if let Some(splashscreen) = app.get_webview_window("splashscreen") {
        splashscreen.close().unwrap();
    }
    if let Some(main_window) = app.get_webview_window("main") {
        main_window.show().unwrap();
    }
}
```

### B. Khay Hệ thống (System Tray - Tauri V2 API)

Tạo System Tray biểu tượng ở góc thanh công cụ hệ điều hành thông qua `TrayIconBuilder`:

```rust
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;

pub fn setup_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let quit_i = MenuItem::with_id(app, "quit", "Thoát ứng dụng", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&quit_i])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;
    Ok(())
}
```

### C. Cửa sổ Không Viền & Drag Region (Frameless Window)

Để thiết kế thanh header tùy chỉnh (custom titlebar), tắt viền cửa sổ hệ thống bằng cách đặt `"decorations": false` trong `tauri.conf.json`.

Để cho phép người dùng kéo thả cửa sổ từ giao diện web, thêm thuộc tính `data-tauri-drag-region` vào header component:

```html
<header data-tauri-drag-region className="{classes.customHeader}">
  <div className="{classes.title}">Ứng dụng của tôi</div>
  {/* Các nút Minimize, Maximize, Close tự custom gọi Tauri APIs */}
</header>
```

### D. Menu Ứng dụng (Window Menu)

Tạo thanh thực đơn (File, Edit, Help...) phía trên cửa sổ:

```rust
use tauri::menu::{Menu, Submenu, MenuItem};

pub fn setup_menu(app: &tauri::App) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let help_menu = Submenu::new(app, "Trợ giúp", true)?;
    let about_i = MenuItem::with_id(app, "about", "Về chúng tôi", true, None::<&str>)?;
    help_menu.append(&about_i)?;

    let menu = Menu::new(app)?;
    menu.append(&help_menu)?;
    Ok(menu)
}
```

## 7. Development & Build Commands

- Chạy môi trường phát triển (Hot-reload cho cả Rust và React):

  ```bash
  pnpm tauri dev
  ```

- Build ứng dụng desktop (tạo file bundle/installers tương ứng cho OS hiện tại):

  ```bash
  pnpm tauri build
  ```

## 8. Pre-Commit Checklist (Tauri)

- [ ] Mọi capability mới đều được khai báo rõ ràng, không sử dụng quyền quá dư thừa.
- [ ] Không có file cấu hình `tauri.conf.json` bị mất các trường bắt buộc hoặc cấu hình sai devPath.
- [ ] Đảm bảo plugin được khởi tạo đầy đủ ở cả Rust backend và import đúng thư viện client ở frontend.
- [ ] Cửa sổ không viền có khai báo drag region (`data-tauri-drag-region`) để đảm bảo người dùng vẫn có thể di chuyển cửa sổ.
