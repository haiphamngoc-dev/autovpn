---
name: dark-mode-design-expert
description: Chuyên gia thiết kế giao diện chế độ tối (Dark Mode) với phối màu khí quyển, tiêu chuẩn tiếp cận WCAG và các thực hành tốt nhất trên đa nền tảng.
metadata:
  category: Design
  tags:
    - dark-mode
    - accessibility
    - theming
  pairs-with:
    - skill: color-contrast-auditor
      reason: Các bề mặt dark mode cần kiểm tra kỹ tỷ lệ tương phản để đảm bảo khả năng tiếp cận.
    - skill: design-system-generator
      reason: Tạo token dark mode là tính năng cốt lõi của thiết kế hệ thống.
    - skill: web-design-expert
      reason: Dark mode là một khía cạnh cơ bản của phát triển web hiện đại.
---

# Chuyên Gia Thiết Kế Dark Mode

Làm chủ thiết kế giao diện người dùng Dark Mode với phối màu khí quyển, tiêu chuẩn tiếp cận WCAG và các thực hành tốt nhất trên đa nền tảng. Đặc biệt chuyên sâu về các hệ thống màu lấy cảm hứng từ thời tiết/bầu trời/đại dương tự động thích ứng theo thời gian trong ngày và điều kiện môi trường.

## Khi Nào Nên Sử Dụng Skill Này

**Kích hoạt khi:**

- Đề cập tới "dark mode", "dark theme", "night mode", "chế độ tối", "giao diện tối".
- "theme switching", "light/dark toggle", "chuyển đổi giao diện", "nút sáng tối".
- "atmospheric UI", "weather theme", "sky gradient", "phối màu khí quyển".
- "OLED optimization", "battery-friendly dark", "tối ưu OLED", "tiết kiệm pin".
- "elevation in dark mode", "surface layering", "độ nổi khối trong chế độ tối", "phân lớp bề mặt".
- "prefers-color-scheme", "color-scheme CSS", "truy vấn màu hệ thống".
- "contrast ratios dark mode", "accessibility dark theme", "tỷ lệ tương phản tối".

**KHÔNG dùng cho:**

- Tạo bảng màu chung chung → `color-theory-palette-harmony-expert`
- Lựa chọn font chữ và kiểu chữ → `typography-expert`
- Kiến trúc thư viện component tổng quát → `design-system-creator`
- Kiểm định độ tương phản của một cặp màu cụ thể → `color-contrast-auditor`

---

## Khoa Học Về Dark Mode

### Tại Sao Cần Dark Mode

| Yếu tố                      | Light Mode (Sáng)                | Dark Mode (Tối)                       | Người thắng cuộc |
| --------------------------- | -------------------------------- | ------------------------------------- | ---------------- |
| **Pin màn hình OLED**       | Mức tiêu thụ cơ bản 100%         | Tiết kiệm 39-47% pin ở độ sáng tối đa | Dark Mode        |
| **Dùng trong tối**          | Gây mỏi mắt, nhức mắt            | Giảm thiểu ánh sáng chói              | Dark Mode        |
| **Môi trường ngoài trời**   | Đọc nội dung tốt hơn             | Dễ bị lóa, khó nhìn                   | Light Mode       |
| **Người bị loạn thị**       | Đọc chữ dễ dàng hơn              | Dễ bị hiệu ứng quầng sáng (halation)  | Light Mode       |
| **Độ tập trung / Chìm đắm** | Bình thường                      | Nội dung nổi bật hẳn lên phía trước   | Dark Mode        |
| **Giấc ngủ**                | Tiếp xúc nhiều với ánh sáng xanh | Giảm thiểu ánh sáng xanh              | Dark Mode        |

**Nhận định cốt lõi:** Dark Mode không phải lúc nào cũng tốt hơn—nó tốt hơn theo ngữ cảnh. Hệ thống tốt nhất là hệ thống tôn trọng lựa chọn của người dùng VÀ tự động thích ứng theo môi trường.

### Yêu Cầu Tương Phản (WCAG 2.1)

| Loại phần tử              | Tỷ lệ tối thiểu | Tỷ lệ mục tiêu | Ghi chú                                        |
| ------------------------- | --------------- | -------------- | ---------------------------------------------- |
| Chữ nội dung (Body text)  | 4.5:1           | 7:1+           | Ưu tiên AAA để dễ đọc                          |
| Chữ lớn (≥24px)           | 3:1             | 4.5:1+         | Tiêu đề lớn, chữ nổi bật                       |
| Thành phần UI             | 3:1             | 4.5:1+         | Đường viền, icon, vòng tập trung (focus rings) |
| Thành phần bị vô hiệu hóa | Không bắt buộc  | 2.5:1          | Tối ưu trải nghiệm người dùng                  |
| Thành phần trang trí      | Không bắt buộc  | -              | Các chi tiết thuần thẩm mỹ                     |

**Bẫy Dark Mode:** Độ tương phản quá cao (trắng tinh trên nền đen tuyền 21:1) gây mỏi mắt nhiều hơn độ tương phản vừa phải. Nên hướng tới tỷ lệ **12:1 đến 16:1** cho chữ nội dung chính.

---

## Kiến Trúc Token 3 Tầng

### Nền tảng: Primitives (Nguyên thủy) → Semantic (Ngữ nghĩa) → Component (Thành phần)

```css
/* ══════════════════════════════════════════════════════════════════
   TẦNG 1: PRIMITIVES - Giá trị màu thô, không bao giờ dùng trực tiếp
   ══════════════════════════════════════════════════════════════════ */
:root {
  /* Màu trung tính */
  --color-gray-50: #f8fafc;
  --color-gray-100: #f1f5f9;
  --color-gray-200: #e2e8f0;
  --color-gray-300: #cbd5e1;
  --color-gray-400: #94a3b8;
  --color-gray-500: #64748b;
  --color-gray-600: #475569;
  --color-gray-700: #334155;
  --color-gray-800: #1e293b;
  --color-gray-900: #0f172a;
  --color-gray-950: #020617;

  /* Màu thương hiệu */
  --color-ocean-300: #7dd3fc;
  --color-ocean-400: #38bdf8;
  --color-ocean-500: #0ea5e9;
  --color-ocean-600: #0284c7;
  --color-ocean-700: #0369a1;

  /* Màu khí quyển (cho giao diện thích ứng) */
  --color-twilight-deep: #0c1222;
  --color-twilight-mid: #151b2e;
  --color-twilight-surface: #1a1f3a;
  --color-dawn-warm: #fef3c7;
  --color-sunset-orange: #fb923c;
  --color-storm-gray: #374151;
}

/* ══════════════════════════════════════════════════════════════════
   TẦNG 2: SEMANTIC - Tùy biến theo mục đích sử dụng và theme
   ══════════════════════════════════════════════════════════════════ */

/* Chế độ Sáng (Mặc định) */
:root,
:root.theme-light {
  /* Văn bản */
  --color-text-primary: var(--color-gray-900); /* 15.3:1 trên nền trắng */
  --color-text-secondary: var(--color-gray-600); /* 7.0:1 trên nền trắng */
  --color-text-muted: var(--color-gray-500); /* 4.6:1 trên nền trắng */
  --color-text-inverse: var(--color-gray-50);

  /* Màu nền */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: var(--color-gray-50);
  --color-bg-elevated: #ffffff;
  --color-bg-overlay: rgba(0, 0, 0, 0.5);

  /* Bề mặt (Hệ thống phân lớp) */
  --color-surface-base: #ffffff;
  --color-surface-raised: #ffffff;
  --color-surface-overlay: #ffffff;

  /* Đường viền */
  --color-border-default: var(--color-gray-200);
  --color-border-muted: var(--color-gray-100);
  --color-border-emphasis: var(--color-gray-300);

  /* Tương tác */
  --color-interactive-primary: var(--color-ocean-600);
  --color-interactive-hover: var(--color-ocean-700);
  --color-interactive-focus: var(--color-ocean-500);

  /* Độ nổi khối (Đổ bóng hoạt động tốt trong chế độ sáng) */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
}

/* Chế độ Tối */
:root.theme-dark {
  /* Văn bản - hơi lệch trắng để giảm mỏi mắt */
  --color-text-primary: var(--color-gray-50); /* 15.3:1 trên nền tối */
  --color-text-secondary: var(--color-gray-300); /* 9.3:1 trên nền tối */
  --color-text-muted: var(--color-gray-400); /* 5.5:1 trên nền tối */
  --color-text-inverse: var(--color-gray-900);

  /* Màu nền - KHÔNG dùng đen tuyền (#000000) */
  --color-bg-primary: var(--color-twilight-deep); /* #0c1222 */
  --color-bg-secondary: var(--color-twilight-mid); /* #151b2e */
  --color-bg-elevated: var(--color-twilight-surface); /* #1a1f3a */
  --color-bg-overlay: rgba(0, 0, 0, 0.7);

  /* Bề mặt - SÁNG DẦN khi lên cao (Nguyên tắc cốt lõi của Dark Mode) */
  --color-surface-base: var(--color-twilight-deep);
  --color-surface-raised: var(--color-twilight-mid);
  --color-surface-overlay: var(--color-twilight-surface);

  /* Đường viền - rõ hơn một chút trong chế độ tối */
  --color-border-default: rgba(255, 255, 255, 0.1);
  --color-border-muted: rgba(255, 255, 255, 0.05);
  --color-border-emphasis: rgba(255, 255, 255, 0.2);

  /* Tương tác - sáng hơn để dễ nhìn */
  --color-interactive-primary: var(--color-ocean-400);
  --color-interactive-hover: var(--color-ocean-300);
  --color-interactive-focus: var(--color-ocean-500);

  /* Độ nổi khối - HIỆU ỨNG HÀO QUANG (Glow) thay thế đổ bóng trong chế độ tối */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.6);

  /* Hiệu ứng phát sáng hào quang (Chỉ có ở chế độ tối) */
  --glow-sm: 0 0 8px rgba(56, 189, 248, 0.2);
  --glow-md: 0 0 16px rgba(56, 189, 248, 0.3);
  --glow-lg: 0 0 32px rgba(56, 189, 248, 0.4);
}

/* ══════════════════════════════════════════════════════════════════
   TẦNG 3: COMPONENT - Tùy biến chi tiết, kế thừa tầng Semantic
   ══════════════════════════════════════════════════════════════════ */
:root {
  /* Nút bấm (Buttons) */
  --button-bg: var(--color-interactive-primary);
  --button-text: var(--color-text-inverse);
  --button-border: transparent;
  --button-shadow: var(--shadow-sm);

  /* Thẻ chứa (Cards) */
  --card-bg: var(--color-surface-raised);
  --card-border: var(--color-border-default);
  --card-shadow: var(--shadow-md);

  /* Ô nhập liệu (Inputs) */
  --input-bg: var(--color-bg-primary);
  --input-border: var(--color-border-default);
  --input-focus-ring: var(--color-interactive-focus);
}
```

---

## Độ Nổi Khối Trong Dark Mode: Điểm Khác Biệt Quan Trọng

### Tại Sao Đổ Bóng Thất Bại Trong Dark Mode

Trong chế độ sáng, bóng đổ tạo độ sâu bằng cách giả lập ánh sáng từ trên cao. Ở chế độ tối:

- Bóng đổ trở nên vô hình trên nền tối.
- Bóng đổ đen tuyền trông giống như các "lỗ hổng" đục khoét giao diện.
- Hiệu ứng thị giác bị phá vỡ hoàn toàn.

### Giải Pháp Của Material Design 3: Nổi Khối Bằng Tông Màu (Tonal Elevation)

Thay vì đổ bóng, hãy dùng **màu nền sáng hơn** cho các thành phần nằm ở lớp phía trên:

```css
/* Giao diện Sáng: Đổ bóng tạo độ sâu */
.card-light {
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Giao diện Tối: Màu nền sáng dần tạo độ sâu */
.card-dark {
  background: #1e1e1e; /* Sáng hơn so với nền gốc #121212 */
  box-shadow: none; /* Hoặc cực kỳ mờ */
}
```

### Thang Đo Độ Nổi Khối (Material Design 3)

| Cấp độ  | Giao diện Sáng | Màu nền Giao diện Tối | Tỷ lệ trộn màu trắng (%) |
| ------- | -------------- | --------------------- | ------------------------ |
| 0 (Gốc) | #ffffff        | #121212               | 0%                       |
| 1       | shadow-sm      | #1e1e1e               | 5% white                 |
| 2       | shadow-md      | #232323               | 7% white                 |
| 3       | shadow-lg      | #282828               | 8% white                 |
| 4       | shadow-xl      | #2d2d2d               | 9% white                 |
| 5       | shadow-2xl     | #323232               | 11% white                |

### Cách Triển Khai Trong CSS

```css
:root.theme-dark {
  /* Tính toán màu nâng lớp bằng hàm color-mix */
  --elevation-1: color-mix(in srgb, white 5%, var(--color-bg-primary));
  --elevation-2: color-mix(in srgb, white 7%, var(--color-bg-primary));
  --elevation-3: color-mix(in srgb, white 8%, var(--color-bg-primary));
  --elevation-4: color-mix(in srgb, white 9%, var(--color-bg-primary));
  --elevation-5: color-mix(in srgb, white 11%, var(--color-bg-primary));
}

.card {
  background: var(--elevation-2);
}

.modal {
  background: var(--elevation-4);
}

.dropdown {
  background: var(--elevation-3);
}
```

---

## Các Mẫu Triển Khai CSS

### Phương Pháp Hiện Đại: `prefers-color-scheme` + `light-dark()`

```css
/* 1. Thiết lập color-scheme để trình duyệt tối ưu hóa hiển thị gốc */
:root {
  color-scheme: light dark;
}

/* 2. Sử dụng hàm light-dark() để khai báo nhanh (Trình duyệt từ 2024+) */
.card {
  background: light-dark(#ffffff, #1e1e1e);
  color: light-dark(#1f2937, #f3f4f6);
  border: 1px solid light-dark(#e5e7eb, rgba(255, 255, 255, 0.1));
}

/* 3. Lắng nghe cấu hình hệ thống */
@media (prefers-color-scheme: dark) {
  :root:not(.theme-light) {
    /* Đưa các tokens dark mode vào đây */
  }
}

@media (prefers-color-scheme: light) {
  :root:not(.theme-dark) {
    /* Đưa các tokens light mode vào đây */
  }
}
```

### Quản Lý Chuyển Đổi Giao Diện Bằng JavaScript

```typescript
// Trình quản lý theme hỗ trợ lưu trạng thái
type Theme = "light" | "dark" | "system";

function setTheme(theme: Theme) {
  const root = document.documentElement;

  // Xóa bỏ các class cũ
  root.classList.remove("theme-light", "theme-dark");

  if (theme === "system") {
    // Để CSS media queries tự động xử lý
    localStorage.removeItem("theme");
    return;
  }

  // Gán class chỉ định và lưu lại
  root.classList.add(`theme-${theme}`);
  localStorage.setItem("theme", theme);
}

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Khởi tạo ngay khi tải trang (chạy trước khi render để tránh chớp trắng)
function initTheme() {
  const saved = localStorage.getItem("theme") as Theme | null;
  if (saved && saved !== "system") {
    document.documentElement.classList.add(`theme-${saved}`);
  }
}

// Lắng nghe thay đổi theme từ hệ thống
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      // Chỉ tự động thay đổi nếu người dùng chưa cấu hình ghi đè thủ công
    }
  });
```

### Ngăn Chặn Chớp Giao Diện Khi Tải Trang (FOWT - Flash of Wrong Theme)

```html
<!-- Đặt đoạn script này ở phần <head>, ngay trước các thẻ link CSS -->
<script>
  (function () {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("theme-dark");
    } else if (theme === "light") {
      document.documentElement.classList.add("theme-light");
    }
  })();
</script>
```

---

## Ví Dụ Thực Tế: Giao Diện Khí Quyển Thời Tiết/Bầu Trời/Đại Dương

Đây là thiết kế mẫu tối ưu nhất — một hệ thống token cho giao diện thích ứng theo điều kiện thời tiết thực tế và thời gian thực trong ngày.

### Triết Lý Thiết Kế

Đại dương và bầu trời chia sẻ một hệ ngôn ngữ thị giác đồng điệu:

- **Bình minh / Hoàng hôn (Dawn/Dusk)**: Các dải gradient ấm, chuyển sắc dịu nhẹ.
- **Giữa trưa (Midday)**: Sáng sủa, độ tương phản cao, sắc nét.
- **Đêm tối (Night)**: Tông xanh lam thẫm, các đốm phát sáng dịu mắt, huyền ảo.
- **Giông bão (Storm)**: Tông xám u ám kết hợp các đường sáng nổi bật (electric colors).
- **Dưới nước (Underwater)**: Tông mờ ảo của tảo lục và san hô, kết hợp sinh vật tự phát sáng.

### Hệ Thống Token Đầy Đủ

```css
/* ══════════════════════════════════════════════════════════════════
   OCEAN MODERN: HỆ THỐNG TOKEN GIAO DIỆN KHÍ QUYỂN
   ══════════════════════════════════════════════════════════════════ */

:root {
  /* ────────────────────────────────────────────────────────────────
     PRIMITIVES: Bảng Màu Khí Quyển Gốc
     ──────────────────────────────────────────────────────────────── */

  /* Ocean Depths (Tông đại dương) */
  --ocean-surface: #38bdf8; /* Mặt nước có nắng */
  --ocean-shallow: #0ea5e9; /* Vùng nước nông */
  --ocean-mid: #0284c7; /* Độ sâu trung bình */
  --ocean-deep: #0369a1; /* Nước sâu thẳm */
  --ocean-abyss: #075985; /* Vùng tối */
  --ocean-trench: #0c4a6e; /* Khe vực thẳm */

  /* Bầu trời theo giờ (Sky States) */
  --sky-dawn: #fef3c7; /* Bình minh vàng ấm */
  --sky-morning: #bae6fd; /* Sáng sớm trong lành */
  --sky-midday: #7dd3fc; /* Trưa nắng gắt */
  --sky-golden: #fcd34d; /* Giờ vàng chiều */
  --sky-sunset: #fb923c; /* Hoàng hôn rực cam */
  --sky-dusk: #a78bfa; /* Chiều tối tím nhạt */
  --sky-twilight: #6366f1; /* Chạng vạng tối */
  --sky-night: #1e1b4b; /* Bầu trời đêm thẳm */

  /* Hiệu ứng không khí (Atmospheric Effects) */
  --atmosphere-haze: rgba(186, 230, 253, 0.3);
  --atmosphere-fog: rgba(241, 245, 249, 0.6);
  --atmosphere-mist: rgba(148, 163, 184, 0.4);

  /* Hệ thời tiết bão (Storm System) */
  --storm-light: #9ca3af;
  --storm-mid: #6b7280;
  --storm-dark: #4b5563;
  --storm-thunder: #374151;
  --storm-lightning: #fbbf24;

  /* Sinh vật phát quang (Bioluminescence - Điểm nhấn dark mode) */
  --bio-cyan: #22d3ee;
  --bio-teal: #2dd4bf;
  --bio-blue: #60a5fa;
  --bio-purple: #a78bfa;
  --bio-glow: rgba(34, 211, 238, 0.4);

  /* Màu cát & Bờ biển */
  --sand-light: #fef3c7;
  --sand-warm: #fde68a;
  --sand-golden: #fcd34d;
  --sand-wet: #d4a574;

  /* Coral & San hô */
  --coral-pink: #fb7185;
  --coral-orange: #fb923c;
  --kelp-green: #22c55e;
  --algae-teal: #14b8a6;
}

/* ════════════════════════════════════════════════════════════════════
   SEMANTIC: Thiết lập Theme Theo Giờ
   ════════════════════════════════════════════════════════════════════ */

/* BÌNH MINH - DAWN THEME (5h sáng - 8h sáng) - Ấm áp, nhẹ nhàng */
:root.atmosphere-dawn {
  --color-text-primary: #1e293b;
  --color-text-secondary: #475569;
  --color-bg-primary: var(--sky-dawn);
  --color-bg-secondary: #fef9e7;
  --color-accent: var(--sky-golden);
  --gradient-sky: linear-gradient(
    180deg,
    var(--sky-night) 0%,
    var(--sky-dusk) 20%,
    var(--sky-sunset) 40%,
    var(--sky-golden) 70%,
    var(--sky-dawn) 100%
  );
  --gradient-ocean: linear-gradient(
    180deg,
    var(--ocean-deep) 0%,
    var(--ocean-mid) 50%,
    var(--ocean-surface) 100%
  );
}

/* BAN NGÀY - DAYLIGHT THEME (8h sáng - 17h chiều) - Sáng sủa, năng lượng */
:root.atmosphere-day,
:root.theme-light {
  --color-text-primary: #0f172a;
  --color-text-secondary: #334155;
  --color-text-muted: #64748b;
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-elevated: #ffffff;
  --color-accent: var(--ocean-shallow);
  --color-accent-hover: var(--ocean-mid);
  --gradient-sky: linear-gradient(
    180deg,
    var(--sky-midday) 0%,
    var(--sky-morning) 50%,
    #ffffff 100%
  );
  --gradient-ocean: linear-gradient(
    180deg,
    var(--ocean-abyss) 0%,
    var(--ocean-deep) 30%,
    var(--ocean-mid) 60%,
    var(--ocean-shallow) 100%
  );
  --elevation-method: shadow;
}

/* GIỜ VÀNG CHIỀU - GOLDEN HOUR (17h chiều - 19h tối) - Hoài niệm, ấm áp */
:root.atmosphere-golden {
  --color-text-primary: #1c1917;
  --color-text-secondary: #44403c;
  --color-bg-primary: #fffbeb;
  --color-bg-secondary: #fef3c7;
  --color-accent: var(--sky-sunset);
  --gradient-sky: linear-gradient(
    180deg,
    var(--sky-midday) 0%,
    var(--sky-golden) 40%,
    var(--sky-sunset) 70%,
    var(--coral-pink) 100%
  );
  --gradient-ocean: linear-gradient(
    180deg,
    var(--ocean-deep) 0%,
    #0891b2 50%,
    #fcd34d 100%
  );
}

/* CHẠNG VẠNG - TWILIGHT (19h tối - 21h tối) - Huyền bí, yên lặng */
:root.atmosphere-twilight {
  --color-text-primary: #e2e8f0;
  --color-text-secondary: #94a3b8;
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-elevated: #334155;
  --color-accent: var(--sky-twilight);
  --gradient-sky: linear-gradient(
    180deg,
    var(--sky-night) 0%,
    var(--sky-twilight) 30%,
    var(--sky-dusk) 60%,
    var(--sky-sunset) 100%
  );
  --gradient-ocean: linear-gradient(
    180deg,
    var(--ocean-trench) 0%,
    var(--ocean-abyss) 50%,
    var(--ocean-deep) 100%
  );
}

/* ĐÊM TỐI - NIGHT THEME (21h tối - 5h sáng) - Tĩnh lặng, phát quang dịu mắt */
:root.atmosphere-night,
:root.theme-dark {
  --color-text-primary: #f1f5f9; /* 15.3:1 ✓ Đạt chuẩn AAA */
  --color-text-secondary: #cbd5e1; /* 9.3:1 ✓ Đạt chuẩn AAA */
  --color-text-muted: #94a3b8; /* 5.5:1 ✓ Đạt chuẩn AA */
  --color-bg-primary: #0c1222; /* Xanh thẫm sâu thẳm */
  --color-bg-secondary: #151b2e;
  --color-bg-elevated: #1a1f3a;
  --color-accent: var(--bio-cyan);
  --color-accent-hover: var(--bio-teal);
  --gradient-sky: linear-gradient(
    180deg,
    #020617 0%,
    var(--sky-night) 50%,
    #1e1b4b 100%
  );
  --gradient-ocean: linear-gradient(
    180deg,
    #020617 0%,
    var(--ocean-trench) 50%,
    var(--ocean-abyss) 100%
  );
  --elevation-method: surface;

  /* Hào quang sinh học */
  --glow-accent: 0 0 20px var(--bio-glow);
  --glow-subtle: 0 0 10px rgba(34, 211, 238, 0.2);

  /* Phân tầng màu nền tối */
  --surface-base: #0c1222;
  --surface-1: #111827;
  --surface-2: #1f2937;
  --surface-3: #374151;
  --surface-4: #4b5563;
}

/* GIÔNG BÃO - STORM THEME - Đột ngột, nổi bật ánh điện */
:root.atmosphere-storm {
  --color-text-primary: #f3f4f6;
  --color-text-secondary: #d1d5db;
  --color-bg-primary: var(--storm-thunder);
  --color-bg-secondary: var(--storm-dark);
  --color-bg-elevated: var(--storm-mid);
  --color-accent: var(--storm-lightning);
  --gradient-sky: linear-gradient(
    180deg,
    var(--storm-thunder) 0%,
    var(--storm-dark) 30%,
    var(--storm-mid) 60%,
    var(--storm-light) 100%
  );
  --gradient-ocean: linear-gradient(
    180deg,
    #1f2937 0%,
    #374151 40%,
    #6b7280 80%,
    #9ca3af 100%
  );
  --flash-color: rgba(251, 191, 36, 0.3);
}

/* ════════════════════════════════════════════════════════════════════
   COMPONENT: Thành phần khí quyển mẫu
   ════════════════════════════════════════════════════════════════════ */

/* Thẻ kính mờ (Glassmorphism Card) */
.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
  border-radius: 16px;
}

:root.theme-light .glass-card,
:root.atmosphere-day .glass-card,
:root.atmosphere-dawn .glass-card {
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

:root.theme-dark .glass-card,
:root.atmosphere-night .glass-card,
:root.atmosphere-twilight .glass-card {
  --glass-bg: rgba(15, 23, 42, 0.6);
  --glass-border: rgba(255, 255, 255, 0.1);
  box-shadow: var(--glow-subtle);
}

/* Hiệu ứng lớp sóng cuộn */
.wave-layer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: var(--wave-height, 100px);
  background: var(--wave-color);
  animation: wave var(--wave-duration, 8s) ease-in-out infinite;
  opacity: var(--wave-opacity, 0.6);
}

@keyframes wave {
  0%,
  100% {
    transform: translateX(0) translateY(0);
  }
  50% {
    transform: translateX(-25%) translateY(-10px);
  }
}

/* Đốm phát quang sinh học */
:root.theme-dark .glow-element,
:root.atmosphere-night .glow-element {
  box-shadow: var(--glow-accent);
  transition: box-shadow 0.3s ease;
}

:root.theme-dark .glow-element:hover,
:root.atmosphere-night .glow-element:hover {
  box-shadow:
    0 0 30px var(--bio-glow),
    0 0 60px rgba(34, 211, 238, 0.2);
}
```

---

## Các Phản Mẫu Thiết Kế (Anti-Patterns) Cần Tránh

### 1. Nền Đen Tuyền Tuyệt Đối (#000000)

**Vấn đề:** Gây mỏi mắt cực lớn do tương phản quá gắt, gây lỗi bóng mờ kéo vệt (OLED "smearing") khi cuộn trang.
**Giải pháp:** Hãy dùng màu xám than xẫm (Matte Charcoal) hoặc xanh đen thẫm như #0c1222, #121212, #1a1a2e.

### 2. Chữ Trắng Tinh Khiết (#FFFFFF) Trên Nền Tối

**Vấn đề:** Tạo cảm giác nhức mắt, nhòe quầng chữ đối với những người dùng bị loạn thị.
**Giải pháp:** Dùng các tông lệch trắng dịu nhẹ như #f1f5f9, #e2e8f0, #cbd5e1.

### 3. Giữ Nguyên Màu Sắc Tương Tác Của Bản Sáng

**Vấn đề:** Màu xanh lam đậm (ocean-600) trông rất đẹp trên nền trắng nhưng lại bị "chìm nghỉm" hoặc mất hút trên nền tối.
**Giải pháp:** Nâng độ sáng/độ bão hòa của màu thương hiệu lên trong chế độ tối (ví dụ sử dụng ocean-400 thay cho ocean-600).

### 4. Đổ Bóng Nặng Nề

**Vấn đề:** Bóng đổ màu đen hoàn toàn mất tác dụng trên nền tối, hoặc trông giống như các lỗ đen đục khoét giao diện.
**Giải pháp:** Dùng giải pháp nâng sáng màu nền bề mặt (Tonal Elevation).

### 5. Sử Dụng Bộ Lọc Đảo Ngược Màu Tự Động (Filter Invert)

**Vấn đề:** Tạo ra các màu sắc lệch lạc, phản tự nhiên và giảm sút độ thẩm mỹ nghiêm trọng.
**Giải pháp:** Luôn xây dựng một hệ thống biến màu tối (Dark variables) thiết kế riêng hoàn chỉnh.

### 6. Bỏ Qua Lựa Chọn Của Hệ Điều Hành

**Vấn đề:** Ép buộc người dùng dùng giao diện tối mặc dù hệ thống của họ đang bật giao diện sáng, hoặc ngược lại.
**Giải pháp:** Lắng nghe mặc định từ `prefers-color-scheme`, đồng thời cung cấp nút gán để người dùng tự chọn thủ công.

---

## Danh Sách Kiểm Tra Khi Phát Triển (Testing Checklist)

### Kiểm thử Giao diện (Visual)

- [ ] Chữ nội dung chính hiển thị rõ ràng, dễ đọc trên tất cả các lớp nền (Tỷ lệ tương phản tối thiểu 4.5:1, khuyến nghị 7:1+).
- [ ] Chữ nội dung phụ dễ đọc (Tỷ lệ tương phản 4.5:1+).
- [ ] Các thành phần tương tác (links, buttons, inputs) nổi bật, dễ phân biệt.
- [ ] Trạng thái focus của các thẻ hiển thị rõ nét để hỗ trợ bàn phím.
- [ ] Phân cấp lớp giao diện rõ ràng thông qua tông nền tăng dần độ sáng mà không cần dùng bóng đổ đen.
- [ ] Không có hiện tượng chữ trắng tinh trên nền đen tuyền gây mỏi mắt.

### Kiểm thử Chức năng (Functional)

- [ ] Nút chuyển đổi sáng/tối hoạt động mượt mà tức thì.
- [ ] Tự động nhận diện chính xác chế độ màu mặc định của hệ điều hành trong lần đầu truy cập trang.
- [ ] Lưu trữ và duy trì chính xác lựa chọn giao diện của người dùng sau khi refresh trang.
- [ ] Không xảy ra lỗi chớp màn hình trắng khi tải trang (FOWT).
- [ ] Các hình ảnh minh họa, sơ đồ, biểu đồ tự động chuyển đổi sang phiên bản tối phù hợp.
- [ ] Các đoạn mã code block hiển thị đủ độ tương phản, dễ đọc.

---

## Tài Liệu Tham Chiếu Ngành

### Material Design 3 (Google)

- Bề mặt nền tối cơ bản: #121212
- Cơ chế Tonal Elevation sử dụng lớp phủ trắng mờ từ 5% đến 11%.
- Màu sắc chủ đạo được đẩy độ sáng lên khoảng 80% để nổi bật trên nền tối.

### Apple Human Interface Guidelines

- Ưu tiên tôn trọng giao diện cấu hình của hệ thống.
- Sử dụng các màu sắc ngữ nghĩa thích ứng tự động (Semantic dynamic colors).
- Tăng cường độ rực rỡ (vibrancy) của màu sắc khi hiển thị trên nền tối.

### Figma

- Màu nền tối cơ bản: #2c2c2c (nền chung), #383838 (nền các lớp nâng lên).
- Văn bản: #ffffff (chính), #b3b3b3 (phụ).
- Điểm nhấn: màu xanh da trời đặc trưng sáng hơn so với phiên bản sáng.

---

## Skills Hỗ Trợ Đồng Hành

| Tên Skill                | Điểm Kết Nối                                                                  |
| ------------------------ | ----------------------------------------------------------------------------- |
| `color-contrast-auditor` | Kiểm định lại tỷ lệ tương phản của các cặp màu sau khi thiết kế tokens.       |
| `design-system-creator`  | Tích hợp hệ thống màu tối này vào cấu trúc hệ thống thiết kế chung của dự án. |
| `web-design-expert`      | Định hướng thẩm mỹ mỹ thuật tổng quan và đồng bộ thương hiệu.                 |

---

_Hãy luôn nhớ: Dark Mode không phải là việc loại bỏ ánh sáng—nó là sự phối hợp tinh tế của độ chói nhằm dẫn dắt ánh nhìn, bảo vệ đôi mắt và kiến tạo không khí trải nghiệm._
