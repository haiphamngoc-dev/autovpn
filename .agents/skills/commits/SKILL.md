---
name: commits
description: >-
  Generate commit messages following Conventional Commits format. Use when
  creating commits, writing commit messages, or the user asks to commit changes.
---

# Quy Tắc Viết Commit Message (Conventional Commits)

Mọi commit message trong dự án **bắt buộc phải viết bằng Tiếng Anh (English)** và tuân theo định dạng **Conventional Commits** để tự động hóa việc sinh changelog và theo dõi lịch sử Git.

## 1. Định Dạng Chuẩn (Commit Format)

```text
<type>(<scope>): <description>

[optional body]

References: #<issue-number>
```

## 2. Các Loại Commit (Commit Types)

- `feat` - Tính năng mới (new feature).
- `fix` - Sửa lỗi (bug fix).
- `refactor` - Tái cấu trúc mã nguồn (không thêm tính năng hay sửa lỗi).
- `test` - Thêm mới hoặc cập nhật các test cases.
- `docs` - Thay đổi tài liệu hướng dẫn (documentation).
- `chore` - Các tác vụ cấu hình hệ thống, nâng cấp package dependencies, build tools.
- `style` - Định dạng code (whitespace, format, missing semi-colons).
- `perf` - Tối ưu hóa hiệu năng (performance).
- `style` - Code style changes (formatting).
- `ci` - Thay đổi cấu hình CI/CD.

## 3. Các Phân Vùng Ảnh Hưởng (Scopes)

Khi commit, chỉ ra phân vùng bị ảnh hưởng trong dấu ngoặc đơn `()` từ danh sách sau:

- `ui` - Các thay đổi trên giao diện React/Mantine frontend.
- `tauri` - Các thay đổi cấu hình Tauri desktop (`tauri.conf.json`, capabilities).
- `rust` - Các thay đổi trên backend Rust.
- `e2e` - Các thay đổi trong thư mục kiểm thử Playwright.
- `deps` - Cập nhật/thêm/xóa dependencies (pnpm, Cargo).
- `i18n` - Cập nhật dịch thuật đa ngôn ngữ.

## 4. Ví Dụ Commit Chuẩn (Bằng Tiếng Anh)

```bash
feat(ui): add settings page with Mantine AppShell

Build the settings page layout using AppShell and CSS Modules.

Refs: #123
```

```bash
fix(rust): resolve race condition in file watcher

Use tokio Mutex instead of std Mutex to prevent blocking the event loop.

Fixes #456
```

```bash
feat(tauri): add system tray menu

Configure system tray menu for the desktop application.
```

```bash
chore(deps): update Mantine to v9.4
```

## 5. Pre-Commit Checklist (Commits)

- [ ] Commit message viết bằng **Tiếng Anh (English)**.
- [ ] Chủ đề ngắn gọn, bắt đầu bằng chữ thường, không kết thúc bằng dấu chấm.
- [ ] Dùng động từ thể chủ động ở thì hiện tại (ví dụ: `add` thay vì `added`, `fix` thay vì `fixed`).
- [ ] Liên kết issue ID (nếu có) ở dòng footer (`Refs: #ID` hoặc `Fixes #ID`).
