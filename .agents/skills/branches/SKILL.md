---
name: branches
description: >-
  Create and name git branches following project conventions. Use when
  creating branches, checking out new branches, or the user mentions
  branch naming.
---

# Quy Tắc Đặt Tên Nhánh (Branch Naming)

Mọi nhánh tính năng (feature branch) khi phát triển phải tuân theo cấu trúc đặt tên chuẩn để dễ quản lý luồng tích hợp.

## 1. Cấu Trúc Định Dạng (Pattern)

Sử dụng chữ thường, phân tách bằng dấu gạch ngang (kebab-case) kèm theo tiền tố phân loại nhánh:

```bash
# Định dạng chung: <loại-nhánh>/<mô-tả-ngắn> hoặc <loại-nhánh>/<mã-issue>/<mô-tả-ngắn>

# Ví dụ nhánh tính năng:
feature/add-settings-page
feature/123/add-oauth-flow

# Ví dụ nhánh sửa lỗi:
bugfix/fix-window-resize
bugfix/456/fix-memory-leak
```

## 2. Các Loại Nhánh (Branch Types)

- `feature/` - Thêm tính năng mới hoặc tái cấu trúc quy mô lớn ảnh hưởng đến cả frontend và backend.
- `bugfix/` - Nhánh sửa lỗi chung.
- `tauri/` - Nhánh thực hiện các sửa đổi chuyên biệt cho Tauri (cấu hình, capabilities, plugins).
- `rust/` - Nhánh chỉ sửa đổi logic backend Rust.
- `docs/` - Cập nhật tài liệu hướng dẫn, wiki.
- `test/` - Bổ sung hoặc chỉnh sửa các test cases (Vitest, Playwright).
- `release/` - Nhánh chuẩn bị phát hành phiên bản mới (ví dụ: `release/v1.0.0`).

## 3. Một Số Lưu Ý

- Tuyệt đối không commit hoặc push trực tiếp lên các nhánh bảo vệ như `main` hay `release/*`.
- Trước khi push, kiểm tra nhánh hiện tại bằng lệnh `git branch --show-current`.
- Tên nhánh mô tả ngắn gọn hành động, tránh viết tên quá dài hoặc vô nghĩa.
