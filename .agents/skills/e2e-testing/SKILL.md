---
name: e2e-testing
description: >-
  Quy chuẩn E2E testing với Playwright cho Tauri app: page objects,
  fixtures, test structure, navigation patterns. Dùng khi sửa file
  trong tests/e2e/**, viết Playwright tests, page objects, hoặc khi
  user đề cập Playwright, E2E, page objects, end-to-end.
---

# Quy Chuẩn Kiểm Thử Đầu Cuối (E2E Testing với Playwright)

Kỹ năng này định nghĩa các quy tắc, cấu trúc thư mục và thực hành tốt nhất khi xây dựng các kịch bản kiểm thử E2E bằng Playwright cho ứng dụng desktop Tauri.

## 1. Cấu Trúc Thư Mục Test E2E (`tests/`)

Toàn bộ mã nguồn E2E test nằm tách biệt trong thư mục `tests/` ở root của dự án, đảm bảo không import trực tiếp bất kỳ code nghiệp vụ nào từ frontend (`src/`) hoặc backend (`src-tauri/`):

```text
tests/
├── e2e/
│   ├── pages/          # Thư mục chứa các Page Object Models (POM)
│   │   ├── BasePage.ts # Lớp cơ sở (Base Page class)
│   │   ├── HomePage.ts
│   │   └── SettingsPage.ts
│   ├── fixtures/       # Định nghĩa các custom fixtures của Playwright
│   ├── specs/          # Các file đặc tả kịch bản test (*.spec.ts)
│   └── test-data/      # Sinh dữ liệu test bằng Fishery và Faker
└── playwright.config.ts # Cấu hình Playwright
```

## 2. Page Object Model (POM)

Mọi thao tác tương tác với giao diện UI (click, điền form, đọc text) phải được encapsulate bên trong các lớp Page Object để tránh lặp code selectors và tăng tính bảo trì.

### Ví dụ BasePage (`tests/e2e/pages/BasePage.ts`)

```typescript
import { Page, Locator } from "@playwright/test";

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }
}
```

### Ví dụ LoginPage (`tests/e2e/pages/LoginPage.ts`)

```typescript
import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByPlaceholder("Nhập email");
    this.passwordInput = page.getByPlaceholder("Nhập mật khẩu");
    this.loginButton = page.getByRole("button", { name: /đăng nhập/i });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.waitForLoad();
  }
}
```

## 3. Cấu Trúc Kịch Bản Test (Test Spec Pattern)

Sử dụng custom fixtures để tự động khởi tạo các Page Object và chia sẻ state:

```typescript
// tests/e2e/specs/login.spec.ts
import { test, expect } from "../fixtures/base";
import { UserFactory } from "../test-data/user.factory";

test.describe("Chức năng Đăng nhập", () => {
  const testUser = UserFactory.build();

  test.beforeEach(async ({ loginPage }) => {
    // Tauri dev server chạy mặc định tại cổng 1420
    await loginPage.goto("http://localhost:1420");
  });

  test("nên đăng nhập thành công với thông tin hợp lệ", async ({
    loginPage,
    dashboardPage,
  }) => {
    await loginPage.login(testUser.email, testUser.password);
    await expect(dashboardPage.welcomeMessage).toBeVisible();
    await expect(dashboardPage.welcomeMessage).toContainText(testUser.name);
  });
});
```

## 4. Xác Định Selectors (Locators)

- Ưu tiên tìm kiếm phần tử dựa theo các accessible attributes (`getByRole`, `getByLabel`, `getByPlaceholder`).
- Nếu giao diện có cấu trúc động phức tạp, hãy thêm thuộc tính `data-testid` vào mã HTML và tìm kiếm bằng `page.getByTestId()`.
- **Tuyệt đối không** sử dụng CSS Selector thô dựa trên class tự sinh của CSS Modules (ví dụ: `page.locator('.ComponentName_root__a8b9')`) vì class này sẽ thay đổi mỗi khi build dự án.

## 5. Chạy Tests & Debugging

- Chạy toàn bộ E2E tests:

  ```bash
  pnpm test:e2e
  ```

- Xem trực tiếp quá trình chạy test (UI Mode):

  ```bash
  pnpm exec playwright test --ui
  ```

## 6. Pre-Commit Checklist (E2E)

- [ ] Không sử dụng fixed timeout (`waitForTimeout`).
- [ ] Các class Page Object không chứa logic kiểm thử (`expect`). Logic assert nằm hoàn toàn ở file `*.spec.ts`.
- [ ] Test dữ liệu được dọn dẹp (teardown) sau khi chạy để tránh ảnh hưởng đến môi trường.
