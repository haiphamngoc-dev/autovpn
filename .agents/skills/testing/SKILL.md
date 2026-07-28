---
name: testing
description: >-
  Quy chuẩn testing với Vitest + React Testing Library: cấu trúc test,
  renderComponent helper, faker, mocking, waitFor. Dùng khi viết/sửa
  file *.test.ts hoặc *.test.tsx, thêm tests, hoặc khi user đề cập
  vitest, testing library, faker, test patterns.
---

# Quy Chuẩn Kiểm Thử (Testing Standards)

Kỹ năng này định nghĩa cấu trúc, nguyên tắc và các thực hành tốt nhất khi viết unit/integration tests cho cả frontend (sử dụng Vitest) và backend (sử dụng Rust native test framework).

## 1. Nguyên Tắc Cốt Lõi

- **Chạy thử nghiệm tự động**:
  - Frontend: `pnpm test`
  - Rust Backend: `cargo test`
- Áp dụng cấu trúc **AAA (Arrange - Act - Assert)** trong mỗi test case.
- Tên test case phải mô tả rõ ràng hành vi: `"nên trả về X khi truyền vào Y"`.
- **Tuyệt đối không sử dụng thời gian chờ cố định (fixed delay)** như `setTimeout` hay `sleep` trong code test. Luôn sử dụng các hàm chờ bất đồng bộ như `waitFor` hoặc `findBy`.
- Sử dụng thư viện `@faker-js/faker` để sinh dữ liệu test ngẫu nhiên, tránh hardcode dữ liệu tĩnh.

## 2. Unit/Integration Test Giao Diện (Vitest + React Testing Library)

### Sử Dụng Helper `renderComponent` Thống Nhất

Mỗi file component test (`*.test.tsx`) phải định nghĩa một hàm helper `renderComponent` để gom nhóm logic setup (bọc provider, truyền default props, v.v.):

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import { UserCard, UserCardProps } from './UserCard';
import { UserFactory } from '@/mocks/factories/user.factory';

describe('UserCard', () => {
  // Dữ liệu mock sinh tự động qua factory
  const mockUser = UserFactory.build();

  const defaultProps: UserCardProps = {
    user: mockUser,
    onSelect: vi.fn(),
  };

  // Helper render dùng chung
  const renderComponent = (propsOverride?: Partial<UserCardProps>) => {
    const props = { ...defaultProps, ...propsOverride };
    return render(
      <MantineProvider>
        <UserCard {...props} />
      </MantineProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nên hiển thị tên người dùng chính xác', () => {
    renderComponent();
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  });

  it('nên kích hoạt sự kiện onSelect khi click vào thẻ', async () => {
    const mockOnSelect = vi.fn();
    renderComponent({ onSelect: mockOnSelect });

    screen.getByRole('button', { name: /chọn/i }).click();

    expect(mockOnSelect).toHaveBeenCalledWith(mockUser.id);
  });
});
```

### Mocking Tauri API client

Khi component gọi lệnh IPC bridge (`invoke`), chúng ta cần mock module `@tauri-apps/api/core` trong Vitest:

```typescript
import { vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Thiết lập kết quả trả về trong test case cụ thể:
import { invoke } from "@tauri-apps/api/core";
vi.mocked(invoke).mockResolvedValue({ id: "123", name: "Hải" });
```

### Mocking & Reset Zustand Store

Trước mỗi test case, hãy đảm bảo reset trạng thái của Zustand store về mặc định để tránh ô nhiễm state giữa các test cases chạy song song:

```typescript
import { useAuthStore } from "@/stores/useAuthStore";

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
```

### Mức Độ Ưu Tiên Của Query (Testing Library)

Luôn ưu tiên query dựa trên khả năng tiếp cận của người dùng (accessibility) thay vì query theo cấu trúc DOM hoặc class CSS:

- **Ưu tiên hàng đầu**: `screen.getByRole()`, `screen.getByLabelText()`, `screen.getByPlaceholderText()`.
- **Lựa chọn cuối cùng**: `screen.getByTestId()` (dùng thuộc tính `data-testid`).
- **Tuyệt đối tránh**: Sử dụng class name hay query selector thô (`container.querySelector('.btn')`).

## 3. Unit & Integration Test Backend (Rust)

Backend viết bằng Rust được test bằng công cụ test tích hợp sẵn của Rust compiler.

### Viết Test Trong Cùng File (Unit Test)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculator() {
        assert_eq!(add(2, 3), 5);
    }
}
```

### Viết Integration Test (Gọi Tauri commands)

Đặt các integration tests trong thư mục `src-tauri/tests/` hoặc dùng mock `tauri::mock::mock_builder` để kiểm thử logic xử lý của các command:

```rust
#[tokio::test]
async fn test_get_user_command() {
    let app = tauri::test::mock_builder()
        .build(tauri::generate_context!())
        .unwrap();
    // Chạy logic kiểm thử với app handle
}
```

## 4. Pre-Commit Checklist (Testing)

- [ ] Mọi logic nghiệp vụ mới đều có unit test đi kèm.
- [ ] Không sử dụng lệnh delay tĩnh (`setTimeout` hoặc `sleep`).
- [ ] Mọi mock được dọn dẹp sạch sẽ sau mỗi test case (`vi.clearAllMocks()`).
- [ ] Sử dụng factories (như Fishery) kết hợp `@faker-js/faker` để tạo dữ liệu mock.
