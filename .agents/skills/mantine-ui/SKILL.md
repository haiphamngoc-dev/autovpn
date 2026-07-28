---
name: mantine-ui
description: >-
  Mantine UI v9: components, Styles API, theming, CSS Modules, PostCSS
  setup, dark/light mode, form handling, hooks. Dùng khi sửa React
  components, CSS modules, theme config, hoặc khi user đề cập Mantine,
  UI components, styling, theme, form, modal, AppShell.
---

# Quy Chuẩn Mantine UI v9

Kỹ năng này định nghĩa quy chuẩn thiết kế, xây dựng giao diện và sử dụng thư viện Mantine UI v9 trong các component React.

## 1. Yêu cầu & Cài đặt Styles

- Sử dụng **React 19** và **Mantine UI v9** trở lên.
- **Bắt buộc** sử dụng PostCSS và CSS Modules để style giao diện. Không sử dụng styled-components, SCSS không có Modules, hay TailwindCSS (trừ phi có yêu cầu đặc biệt từ người dùng).
- Styles phải được phân cascade rõ ràng và import file CSS styles của Mantine đúng vị trí (ở entry point `main.tsx`).

## 2. CSS Modules Pattern

Tất cả các style tùy chỉnh cho một component React phải nằm trong file CSS Module cùng cấp thư mục với component đó.

### Ví dụ tổ chức

```text
src/components/MyButton/
├── MyButton.tsx
├── MyButton.module.css
└── MyButton.test.tsx
```

### Ví dụ code `MyButton.module.css`

```css
.root {
  padding: var(--mantine-spacing-md);
  border-radius: var(--mantine-radius-md);
  background-color: var(--mantine-color-body);
}

.title {
  color: var(--mantine-color-blue-filled);
  font-size: var(--mantine-font-size-lg);
}
```

### Ví dụ code `MyButton.tsx`

```tsx
import classes from "./MyButton.module.css";

export function MyButton() {
  return (
    <div className={classes.root}>
      <h2 className={classes.title}>Nội dung tiêu đề</h2>
    </div>
  );
}
```

## 3. Sử dụng Mantine Styles API

Khi cần tùy chỉnh CSS cho các thành phần con nằm sâu bên trong component của Mantine, sử dụng thuộc tính `classNames` thay vì ghi đè bằng CSS selectors thô bạo.

```tsx
// Custom Input component sử dụng classes của CSS Modules để override Styles API của TextInput
import { TextInput } from "@mantine/core";
import classes from "./CustomInput.module.css";

export function CustomInput() {
  return (
    <TextInput
      label="Nhập thông tin"
      classNames={{
        root: classes.inputRoot,
        input: classes.inputField,
        label: classes.inputLabel,
      }}
    />
  );
}
```

## 4. Biến Hệ thống của Theme (Theme Variables)

Luôn luôn ưu tiên sử dụng các biến CSS được cung cấp sẵn bởi Mantine Theme để đảm bảo sự thống nhất và tương thích hoàn hảo với chế độ Dark/Light mode:

- **Colors**: `var(--mantine-color-blue-6)`, `var(--mantine-color-body)`, `var(--mantine-color-dimmed)`, `var(--mantine-color-error)`.
- **Spacing**: `var(--mantine-spacing-xs)`, `var(--mantine-spacing-sm)`, `var(--mantine-spacing-md)`.
- **Border Radius**: `var(--mantine-radius-sm)`, `var(--mantine-radius-md)`, `var(--mantine-radius-xl)`.
- **Font Sizes**: `var(--mantine-font-size-sm)`, `var(--mantine-font-size-md)`, `var(--mantine-font-size-xl)`.

## 5. Style Props và Giới Hạn Sử Dụng

Mantine cung cấp style props (như `mt` cho margin-top, `p` cho padding, `fz` cho font-size, v.v.).

- Chỉ dùng style props cho các tinh chỉnh nhỏ, mang tính cục bộ (ví dụ: `mt="xs"`, `p="sm"`).
- **Giới hạn tối đa 3-4 style props** trên một thẻ. Nếu vượt quá giới hạn này, bắt buộc phải khai báo style trong file CSS Module tương ứng để giữ cho code JSX/TSX sạch sẽ và dễ đọc.

## 6. Layout Components

Tránh sử dụng thẻ `div` thô để sắp xếp layout. Thay vào đó, hãy sử dụng các layout components có sẵn cực kỳ mạnh mẽ của Mantine:

- **`Group`**: Sắp xếp ngang (horizontal flexbox).
- **`Stack`**: Sắp xếp dọc (vertical flexbox).
- **`Flex`**: Cho các nhu cầu flexbox tùy chỉnh khác.
- **`Grid` & `Grid.Col`**: Bố cục dạng lưới.
- **`AppShell`**: Xây dựng cấu trúc layout chính cho ứng dụng desktop (Header, Navbar, Main).

## 7. Form Handling & Validation

Sử dụng `@mantine/form` cho toàn bộ logic liên quan đến form, validation và submit dữ liệu:

```tsx
import { useForm } from "@mantine/form";
import { Button, TextInput } from "@mantine/core";

const form = useForm({
  initialValues: { email: "", name: "" },
  validate: {
    email: (value) => (/^\S+@\S+$/.test(value) ? null : "Email không hợp lệ"),
    name: (value) => (value.length < 2 ? "Tên quá ngắn" : null),
  },
});

return (
  <form onSubmit={form.onSubmit((values) => console.log(values))}>
    <TextInput {...form.getInputProps("email")} label="Email" />
    <TextInput {...form.getInputProps("name")} label="Họ tên" />
    <Button type="submit">Lưu lại</Button>
  </form>
);
```

## 8. Dark & Light Mode

- Sử dụng hook `useMantineColorScheme()` để chuyển đổi color scheme hoặc lấy trạng thái hiện tại.
- Để định nghĩa styles riêng cho Dark mode trong CSS module, sử dụng class selectors của Mantine hoặc mixin:

  ```css
  /* Sử dụng mixins hoặc thuộc tính data-mantine-color-scheme */
  [data-mantine-color-scheme="dark"] .root {
    background-color: var(--mantine-color-dark-8);
  }
  ```

## 9. Không Được Làm (Prohibited Actions)

- ❌ Không sử dụng inline styles (`style={{ color: 'red' }}`) trừ phi giá trị style được tính toán động (dynamic).
- ❌ Không sử dụng `!important` trong CSS module để ghi đè styles của Mantine (dùng CSS layers hoặc nâng cấp độ selector nếu cần).
- ❌ Không hardcode mã màu hex (`#ffffff`, `#000000`) hay khoảng cách pixel (`16px`) trực tiếp trong styles. Luôn sử dụng biến theme.
