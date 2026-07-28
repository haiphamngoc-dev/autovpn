---
name: code-quality
description: >-
  Code-quality standards: TypeScript strictness, Rust compilation and formatting,
  naming conventions (camelCase, PascalCase, snake_case),
  linting rules, no `any` without reason, no `!important` in styles,
  and constant extraction. Use when writing or refactoring any
  TypeScript/JavaScript or Rust code, when ESLint, Prettier, or cargo clippy
  issues come up, or when the user mentions code style, lint, naming
  conventions, or general code quality.
---

# Tiêu Chuẩn Chất Lượng Code (Code Quality)

Kỹ năng này định nghĩa các tiêu chuẩn về chất lượng code, định dạng (formatting), kiểm tra kiểu (type check) và quy chuẩn tổ chức mã nguồn cho cả frontend và backend.

## 1. Các Quy Tắc Cốt Lõi

- **Chạy linter sau khi thay đổi**:
  - Frontend: `pnpm lint`
  - Rust Backend: `cargo clippy`
- Linter và compiler check bắt buộc phải thông qua trước khi tạo commit hoặc mở PR.
- Tuyệt đối không để lệnh debug `console.log` trong code frontend production.
- Không để lại mã lỗi hoặc code thừa không sử dụng (dead code).

## 2. Tiêu Chuẩn TypeScript (Frontend)

- **Luôn kích hoạt strict mode** của TypeScript compiler.
- **Tránh tối đa kiểu `any`**: Sử dụng kiểu dữ liệu tường minh hoặc `unknown` nếu cần ép kiểu sau.
- Sử dụng **interfaces** để định nghĩa cấu trúc (shape) của các đối tượng (objects).
- Sử dụng **type** cho các kiểu kết hợp (unions), giao (intersections), hoặc các kiểu dữ liệu nguyên bản (primitives).
- Khai báo rõ ràng kiểu dữ liệu trả về cho tất cả các hàm công khai (public functions).

## 3. Quy Chuẩn Đặt Tên (Naming Conventions)

### Frontend (JS/TS)

- **React Components**: `PascalCase` (ví dụ: `UserProfile`, `SettingsModal`).
- **Hàm & Biến**: `camelCase` (ví dụ: `fetchUserData`, `isLoading`).
- **Hằng số (Constants)**: `UPPER_SNAKE_CASE` (ví dụ: `API_RETRY_LIMIT`).
- **Biến Boolean**: Sử dụng prefix `is/has/should` (ví dụ: `isActive`, `hasPermission`).

### Backend (Rust)

- **Hàm & Biến**: `snake_case` (ví dụ: `get_user_info`, `connection_pool`).
- **Structs, Enums, & Traits**: `PascalCase` (ví dụ: `AppState`, `UserError`).
- **Hằng số**: `SCREAMING_SNAKE_CASE` (ví dụ: `MAX_RETRIES`).

## 4. Tổ Chức Import (Frontend Import Order)

Để giữ code gọn gàng, thứ tự imports bắt buộc phải tuân theo ESLint flat config quy định:

1. Thư viện ngoài (`react`, `react-router`, v.v.).
2. Thư viện Tauri core (`@tauri-apps/api/*`).
3. Thư viện UI (`@mantine/core`, `@mantine/hooks`, v.v.).
4. Các path aliases (`@/components/*`, `@/stores/*`, `@/services/*`).
5. Imports tương đối (`../SiblingComponent`, `./types`).
6. Style CSS Modules (`import classes from './X.module.css'`).

### Path Alias

Chúng ta sử dụng alias `@/` trỏ trực tiếp đến thư mục `src/` để tránh dùng đường dẫn tương đối dài dòng:

- ✅ **Đúng**: `import { Button } from '@/components/Button'`
- ❌ **Sai**: `import { Button } from '../../../../components/Button'`

## 5. Quy Chuẩn Comment

- Hạn chế tối đa viết comment giải thích **mã nguồn làm gì** (hãy để tên hàm, tên biến tự giải thích).
- Chỉ viết comment giải thích **tại sao lại làm như vậy** (why) đối với các logic nghiệp vụ phức tạp hoặc giải pháp mang tính đặc thù (workaround).
- Comment viết ngắn gọn, dễ hiểu và sử dụng ngôn ngữ Tiếng Việt cho phần mô tả dự án.

## 6. Tiêu Chuẩn Chất Lượng Rust Backend

- Luôn chạy `cargo fmt` để tự động định dạng mã nguồn theo tiêu chuẩn chung của Rust community.
- Khai báo kiểu lỗi tường minh và quản lý bằng toán tử `?`, tránh dùng `unwrap()`.
- Tối ưu hóa bộ nhớ: Sử dụng tham chiếu (`&T`) thay vì clone dữ liệu (`T.clone()`) trừ phi thực sự cần sở hữu (ownership).
- Hạn chế sử dụng `unsafe` blocks trừ khi cần tương tác trực tiếp với thư viện C qua FFI hoặc tối ưu hiệu năng cực độ đã được kiểm chứng.

## 7. Pre-Commit Checklist (Quality)

- [ ] Chạy `pnpm lint` thành công không có lỗi.
- [ ] Chạy `pnpm type-check` thành công không lỗi type.
- [ ] Chạy `cargo clippy` không có cảnh báo nghiêm trọng.
- [ ] Thử nghiệm compile dự án thành công.
