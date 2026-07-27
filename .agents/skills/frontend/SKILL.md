---
name: frontend
description: >-
  Quy chuẩn phát triển frontend React + Mantine v9 + Zustand + React
  Router v7: cấu trúc feature-based, component, CSS Modules, hooks,
  state management, routing, import order. Dùng khi sửa file trong src/**,
  viết React components, hooks, stores, hoặc khi user đề cập UI, frontend, React.
---

# Quy Chuẩn Phát Triển Frontend (Feature-Based Architecture)

Kỹ năng này định nghĩa các quy tắc thiết kế và thực hành lập trình tốt nhất cho phần frontend của ứng dụng desktop sử dụng kiến trúc **Feature-Based (Feature-driven)**.

## 1. Cấu Trúc Thư Mục Feature-Based

Để đảm bảo tính mở rộng và dễ bảo trì cho ứng dụng lớn, mã nguồn frontend được chia thành các module tính năng độc lập nằm trong thư mục `src/features/`.

```text
src/
├── components/          # UI components dùng chung toàn cục (Button, Modal, Input...)
├── features/            # Nơi chứa các module tính năng độc lập
│   ├── auth/            # Ví dụ: Feature Auth
│   │   ├── components/  # Components riêng của Auth (LoginForm, RegisterCard...)
│   │   ├── stores/      # Zustand store riêng của Auth (useAuthStore.ts)
│   │   ├── services/    # Tauri IPC wrappers riêng của Auth (authService.ts)
│   │   ├── hooks/       # Custom hooks nội bộ của Auth
│   │   ├── types.ts     # TypeScript types của Auth
│   │   └── index.ts     # Cổng export duy nhất (Barrel file) của module Auth
│   └── settings/        # Ví dụ: Feature Settings
├── hooks/               # Custom hooks dùng chung toàn hệ thống
├── i18n/                # Cấu hình đa ngôn ngữ toàn cục
├── routes/              # Cấu hình định tuyến chính của ứng dụng
├── types/               # Kiểu dữ liệu dùng chung toàn cục
└── utils/               # Hàm tiện ích dùng chung toàn cục
```

### Quy tắc cổng giao tiếp (index.ts - Barrel File)

Mỗi thư mục feature **bắt buộc** phải có một file `index.ts` đóng vai trò là "public API" cho feature đó.

- Chỉ export những component, hooks, hoặc functions mà các phần khác trong ứng dụng thực sự cần dùng.
- Các file bên ngoài feature **tuyệt đối không** được import sâu vào các file con bên trong feature. Mọi import phải đi qua file `index.ts` của feature đó.
- **Đúng**: `import { LoginForm } from '@/features/auth';`
- **Sai**: `import { LoginForm } from '@/features/auth/components/LoginForm/LoginForm';`

## 2. Cấu Trúc Component React

### Components chức năng (Functional Components)

- Chỉ sử dụng **Functional Components** kết hợp với hooks. Không viết Class Components.
- **Bắt buộc sử dụng named exports** (ví dụ: `export function ComponentName() {}`). Không dùng `export default`.
- Giữ component gọn gàng, đơn nhiệm. Nếu logic xử lý state phức tạp, hãy tách ra thành các custom hook riêng trong thư mục `hooks/` của feature.

### Thư mục Component

Mỗi component tự chứa các tài nguyên của nó trong một thư mục:

```text
ComponentName/
├── ComponentName.tsx           # File code giao diện chính
├── ComponentName.module.css    # File CSS Modules
├── ComponentName.test.tsx      # File unit/integration tests (chạy bằng Vitest)
├── ComponentName.types.ts      # Khai báo TypeScript types cho component (optional)
└── ComponentName.constants.ts # Các hằng số nội bộ của component (optional)
```

## 3. Thứ Tự Imports Trong Files

1. Các thư viện bên ngoài (`react`, `react-router`, `zustand`, v.v.).
2. Thư viện Tauri core (`@tauri-apps/api/*`).
3. Thư viện UI (`@mantine/core`, `@mantine/hooks`, v.v.).
4. Các path aliases (`@/components/*`, `@/features/*`, `@/stores/*`, v.v.).
5. Imports tương đối (`../SiblingComponent`, `./types`).
6. Import file style của chính component đó (luôn đặt ở **DÒNG CUỐI CÙNG**):

   ```typescript
   import classes from "./ComponentName.module.css";
   ```

## 4. Quản Lý Trạng Thái (Zustand)

Chúng ta sử dụng **Zustand** thay cho Redux Toolkit để quản lý global state.

### Vị trí đặt Store

- Nếu store chỉ phục vụ cho một tính năng cụ thể, hãy đặt trong `src/features/feature-name/stores/`.
- Nếu store lưu trữ thông tin dùng chung toàn hệ thống (ví dụ: theme, global settings), hãy đặt trong `src/stores/`.

### Ví dụ cấu trúc store

```typescript
// src/features/auth/stores/useAuthStore.ts
import { create } from "zustand";

interface User {
  id: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

## 5. Quản Lý Routing (React Router v7)

Chúng ta sử dụng **React Router v7** để điều hướng trang trong ứng dụng desktop.

> [!IMPORTANT]
> Vì ứng dụng chạy trực tiếp từ các file tĩnh cục bộ (dưới giao thức `tauri://` hoặc `file://`), việc sử dụng `BrowserRouter` sẽ gây ra lỗi **404 Not Found** khi reload trang.
>
> - **Bắt buộc** sử dụng `HashRouter` hoặc `createHashRouter` cho routing chính của ứng dụng.
> - Sử dụng `MemoryRouter` hoặc `createMemoryRouter` trong môi trường kiểm thử (Vitest component tests).

```typescript
// src/main.tsx
import { createHashRouter, RouterProvider } from 'react-router';
import { routes } from './routes';

const router = createHashRouter(routes);

export function App() {
  return <RouterProvider router={router} />;
}
```

## 6. Tích Hợp Tauri IPC Bridge

- Các hàm gọi `invoke` hoặc lắng nghe event của Rust backend được bọc trong các service file.
- Đặt service file trong `src/features/feature-name/services/` nếu dùng riêng cho một feature, hoặc `src/services/` nếu dùng chung toàn hệ thống.

```typescript
// src/features/auth/services/authService.ts
import { invoke } from "@tauri-apps/api/core";

export async function loginBackend(credentials: Credentials): Promise<Session> {
  return invoke<Session>("login", { credentials });
}
```

## 7. Hiệu Năng & Thực Hành Tốt

- Sử dụng `useMemo` cho các phép tính toán logic nặng.
- Sử dụng `useCallback` cho các hàm callback truyền xuống các components con phức tạp.
- Tránh viết arrow functions ẩn danh trực tiếp trong prop JSX.
- Luôn thực hiện dọn dẹp (cleanup) các event listeners, timers, subcriptions trong phần return của hook `useEffect`.
