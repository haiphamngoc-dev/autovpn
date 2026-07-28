---
name: pull-requests
description: >-
  Create and review pull requests following project standards including title
  format, description template, and review checklist. Use when creating PRs,
  writing PR descriptions, or reviewing pull requests.
---

# Quy Trình Pull Request (PR Guidelines)

Kỹ năng này định nghĩa các quy tắc khi tạo, mô tả và review các Pull Request trong quá trình phát triển dự án.

## 1. Tạo Mới Một PR

### Nhãn (Labels)

- Khi PR được tạo bởi hoặc có sự hỗ trợ lớn của AI Agent, bắt buộc phải gắn label **"AI-Made"**.

### Tiêu Đề PR (PR Title)

Tiêu đề PR cần ngắn gọn, bắt đầu bằng mã issue (nếu có) hoặc Conventional Commits type:

```text
#123 Thêm cấu hình cài đặt hệ thống
feat(tauri): thêm system tray menu
fix(rust): sửa lỗi race condition trong file watcher
```

### Template Mô Tả PR (PR Description)

```markdown
# Mục đích (What & Why)

Mô tả ngắn gọn các thay đổi chính và lý do thực hiện thay đổi này.

# Kế hoạch kiểm thử (Testing)

Mô tả các bước thủ công hoặc lệnh tự động để kiểm tra thay đổi.

---

Closes #ISSUE_ID
```

_Lưu ý: Viết mô tả ngắn gọn, tập trung vào mô tả mức cao (high-level), không liệt kê chi tiết từng file thay đổi vì diff của Git đã thể hiện điều đó._

## 2. Checklist Review PR (Dành Cho Tác Giả & Reviewer)

### Giao Diện (React / Mantine)

- [ ] Tuân thủ cấu trúc component folder (`ComponentName.tsx` + `ComponentName.module.css`).
- [ ] Không sử dụng styled-components hoặc inline style.
- [ ] Layout sắp xếp bằng `Group`, `Stack`, `Flex`, `Grid` thay vì thẻ `div` thô.
- [ ] Logic form, validation quản lý bằng `@mantine/form`.

### Backend (Rust)

- [ ] Mã nguồn Rust chạy thành công `cargo clippy` và `cargo fmt`.
- [ ] Không lạm dụng `unwrap()` hoặc `expect()`, lỗi được xử lý và bọc trong kiểu `AppError`.
- [ ] State dùng chung được quản lý thread-safe bằng `Mutex`/`RwLock` bọc trong `tauri::State`.

### Tauri Desktop

- [ ] Cấu hình capabilities/permissions được cấp tối thiểu, không dùng wildcards bừa bãi.
- [ ] IPC invoke và events được triển khai đúng chuẩn thông qua các file dịch vụ (services) trung gian.

### Kiểm Thử (Testing)

- [ ] Unit test cho frontend (Vitest) và Rust (cargo test) chạy thành công.
- [ ] E2E tests (Playwright) chạy thành công trên local server (cổng `1420`).
- [ ] Dữ liệu test sử dụng dynamic factories và faker, không sử dụng fixed timeouts.
