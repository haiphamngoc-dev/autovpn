---
name: i18n
description: >-
  Quốc tế hóa (i18n) với react-i18next trong Tauri + Mantine: cấu trúc
  locale files, key conventions, useTranslation, Mantine locale
  integration. Dùng khi thêm/sửa chuỗi hiển thị, file locale, hoặc
  khi user đề cập i18n, translations, ngôn ngữ, locales.
---

# Quy Chuẩn Quốc Tế Hóa (i18n)

Kỹ năng này định nghĩa các quy tắc khi triển khai đa ngôn ngữ (i18n) trong ứng dụng desktop bằng `react-i18next`.

## 1. Cấu Trúc File locales (`src/i18n/`)

Thư mục quản lý i18n được tổ chức tập trung như sau:

```text
src/i18n/
├── index.ts          # Khởi tạo i18next
├── locales/
│   ├── en.json       # Ngôn ngữ tiếng Anh (Source of Truth)
│   └── vi.json       # Ngôn ngữ tiếng Việt
└── types.d.ts        # Type-safety định nghĩa các key dịch thuật
```

## 2. API Dùng Cho Dịch Thuật

Tùy vào ngữ cảnh gọi dịch thuật mà chọn API phù hợp:

| API                     | Ngữ cảnh sử dụng                              | Ví dụ                                                                        |
| :---------------------- | :-------------------------------------------- | :--------------------------------------------------------------------------- |
| `useTranslation()` hook | Trong React Components                        | `const { t } = useTranslation();`                                            |
| `i18n.t()` singleton    | Ngoài React (Zustand stores, utils, services) | `import i18n from '@/i18n'; i18n.t('key');`                                  |
| `<Trans>` component     | Chuỗi ký tự có chứa JSX, style, link inline   | `<Trans i18nKey="terms">Tôi đồng ý với <a href="...">điều khoản</a></Trans>` |

## 3. Quy Tắc Đặt Tên Key Dịch (Key Convention)

- Sử dụng cấu trúc phẳng (flat keys) kết hợp với dot-notation để định nghĩa đường dẫn phân cấp rõ ràng.
- Đặt tên theo mẫu: `[trang/domain].[component].[element]`.
- Ví dụ:
  - `settings.general.title` -> Tiêu đề trang Cài đặt chung
  - `dashboard.chart.empty` -> Thông báo biểu đồ trống
  - `common.button.save` -> Nút lưu dùng chung

## 4. Interpolation (Truyền Biến Vào Chuỗi Dịch)

Khi chuỗi dịch có chứa dữ liệu động, sử dụng cú pháp dấu ngoặc nhọn kép `{{}}`:

- File JSON:

  ```json
  {
    "greeting": "Xin chào {{name}}, chào mừng bạn quay lại!"
  }
  ```

- Gọi trong React:

  ```typescript
  t("greeting", { name: "Hải" });
  ```

## 5. Tích Hợp Mantine & i18n

- Đối với các component như `DatePicker` hoặc `Calendar` của Mantine, hãy kết hợp truyền ngôn ngữ thông qua `DatesProvider` của thư viện `@mantine/dates`.
- Toàn bộ nội dung hiển thị của `Notifications` hoặc `Modals` cũng phải được bọc trong hàm `t()`.

## 6. Type-Safe Dịch Thuật (TypeScript)

Để tránh lỗi gõ sai key dịch thuật, chúng ta khai báo type augmentation từ file `en.json` (source of truth):

```typescript
// src/i18n/types.d.ts
import "i18next";
import en from "./locales/en.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof en;
    };
  }
}
```

## 7. Các Quy Tắc Tuyệt Đối

- ✅ **100% các chuỗi hiển thị** phía client phải được lấy từ file i18n. Tuyệt đối không hardcode text tiếng Việt hay tiếng Anh trực tiếp trong JSX/TSX.
- ✅ Luôn duy trì sự đồng bộ (parity) giữa `en.json` và `vi.json`. Nếu thêm 1 key mới ở file này, phải bổ sung ngay lập tức ở file kia.
- ✅ Các key trong file JSON nên được sắp xếp theo thứ tự bảng chữ cái (alphabetical) để dễ tìm kiếm và quản lý.
