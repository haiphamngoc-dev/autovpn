---
name: ui-ux
description: >-
  Quy chuẩn thiết kế giao diện UI/UX chuyên nghiệp: phối màu, typography,
  spacing (8px grid), responsive, dark/light mode contrast, icon usage,
  interactive states, safe areas, và accessibility. Dùng khi viết CSS,
  thiết kế UI, sửa giao diện React/Mantine, hoặc khi user đề cập thiết kế,
  UI/UX, giao diện, CSS/styling, màu sắc, font, layout.
---

# Quy Chuẩn Thiết Kế UI/UX Chuyên Nghiệp

Kỹ năng này định nghĩa các nguyên tắc thiết kế giao diện (UI) và trải nghiệm người dùng (UX) chuyên nghiệp nhằm tạo ra các sản phẩm có tính thẩm mỹ cao, chuyển động mượt mà, dễ tương tác và đáp ứng các tiêu chuẩn无障碍 (accessibility).

## 1. Icon & Visual Elements

### Tuyệt đối không dùng Emoji làm Icon chức năng

- Không sử dụng các emoji như 🎨, 🚀, ⚙️, 💾 để làm các icon điều hướng, nút bấm, hoặc control hệ thống.
- **Bắt buộc** sử dụng các thư viện icon dạng vector (SVG) chất lượng cao. Khuyến nghị sử dụng **Phosphor Icons (`@phosphor-icons/react`)** hoặc **Heroicons (`@heroicons/react`)**.
- Các icon trong cùng một phân vùng giao diện phải có sự nhất quán về kiểu stroke (ví dụ: cùng dùng nét Outline 1.5px hoặc cùng dùng Fill), không được trộn lẫn.

### Sử dụng Vector Assets

- Mọi hình ảnh minh họa, logo, icon phải sử dụng định dạng SVG thay vì PNG/JPG để đảm bảo hiển thị sắc nét trên màn hình Retina/High-DPI và hỗ trợ theming (thay đổi màu sắc động theo theme).

### Kích thước vùng chạm (Touch & Click Targets)

- Đảm bảo tất cả các phần tử có thể click được (nút, icon, liên kết) có diện tích tương tác tối thiểu là **44×44px** (hoặc dùng padding/hitSlop để mở rộng vùng click đối với các icon nhỏ).
- Thêm thuộc tính `cursor: pointer` vào CSS cho tất cả các phần tử có thể click.

## 2. Hiệu ứng Tương tác & Chuyển động (Interactions & Motion)

### Trạng thái Tương tác Ổn định

- Khi người dùng hover hoặc bấm (pressed) vào một nút, hiệu ứng chuyển màu hoặc opacity phải mượt mà và **không được làm thay đổi kích thước biên của phần tử (layout bounds)** gây ra hiện tượng giật màn hình hoặc làm dịch chuyển các phần tử xung quanh (layout shift).
- Thời gian chuyển tiếp (transition duration) cho các micro-interactions (hover, focus, active states) nên nằm trong khoảng **150ms – 300ms** với easing mượt mà (`ease-in-out` hoặc cubic-bezier native).

```css
/* Ví dụ CSS Module cho Button tương tác mượt mà */
.button {
  transition:
    background-color 200ms ease,
    transform 150ms ease,
    box-shadow 200ms ease;
}

.button:hover {
  background-color: var(--mantine-color-blue-7);
}

.button:active {
  transform: scale(0.98); /* Nhấn nhẹ nhưng không đổi kích thước khung */
}
```

## 3. Màu sắc & Độ tương phản (Contrast & Light/Dark Mode)

### Độ tương phản Văn bản (Text Contrast)

- Tuân thủ tiêu chuẩn tương phản **WCAG AA**:
  - Văn bản chính (body text): Độ tương phản tối thiểu **4.5:1** so với màu nền.
  - Văn bản lớn hoặc tiêu đề (headings): Độ tương phản tối thiểu **3:1**.
  - Không sử dụng màu xám quá nhạt cho chữ trên nền trắng, hoặc màu xám quá tối trên nền đen.

### Nhất quán giữa Light và Dark Theme

- Không được hardcode mã màu hex (`#ffffff`) trong CSS Module. Sử dụng các biến theme của Mantine (`var(--mantine-color-text)`, `var(--mantine-color-body)`) để giao diện tự động thích ứng hoàn hảo khi chuyển đổi giao diện sáng/tối.
- Đảm bảo các đường phân cách (borders/dividers) và các trạng thái hover/focused vẫn nhìn rõ trên cả nền tối.

## 4. Bố cục & Khoảng cách (Layout & Spacing Grid)

### Hệ thống Lưới 8px (8px Spacing Rhythm)

- Sử dụng bội số của 8px (hoặc 4px cho các khoảng cách cực nhỏ) để định cấu hình padding, margin, và gap giữa các phần tử nhằm tạo ra nhịp điệu thị giác (visual rhythm) đồng bộ.
- Map tương ứng với hệ thống spacing của Mantine:
  - `xs` = 8px (Spacing nhỏ, khoảng cách giữa các phần tử con)
  - `sm` = 12px (Spacing vừa)
  - `md` = 16px (Padding mặc định của card, khoảng cách tiêu chuẩn)
  - `lg` = 24px (Khoảng cách giữa các section)
  - `xl` = 32px (Khoảng cách lớn)

### Compliant Safe-Areas

- Trên môi trường Desktop chạy full-screen hoặc custom title bar, đảm bảo nội dung không bị che khuất bởi thanh tiêu đề hệ thống hoặc bo góc cửa sổ.
- Đảm bảo các nội dung cuộn (scroll view) có khoảng đệm cuối (bottom padding) hợp lý để không bị che khuất bởi các thanh công cụ cố định (sticky footers).

## 5. Tiêu chuẩn Về Khả Năng Tiếp Cận (Accessibility - a11y)

- **Keyboard Navigation**: Mọi phần tử tương tác được phải có trạng thái focus nhìn thấy rõ (`:focus-visible`) khi duyệt bằng phím Tab.
- **Screen Reader Support**: Thêm thuộc tính `aria-label` cho các nút chỉ chứa icon (icon-only buttons) để trình đọc màn hình có thể thông báo chức năng.
- **Không dùng màu sắc làm chỉ thị duy nhất**: Tránh việc chỉ dùng màu xanh/đỏ để báo trạng thái thành công/lỗi, hãy kết hợp với icon cảnh báo hoặc văn bản mô tả cụ thể.

---

## 6. Pre-Delivery Checklist (Kiểm thử trước khi bàn giao UI)

### Chất lượng hiển thị (Visual Quality)

- [ ] 100% không sử dụng emoji làm icon chức năng.
- [ ] Tất cả các icon đều nhất quán về phong cách và thư viện (khuyên dùng Phosphor).
- [ ] Các hiệu ứng hover/active không gây ra hiện tượng dịch chuyển bố cục (layout shift).
- [ ] Toàn bộ màu sắc và khoảng cách đều sử dụng biến CSS của Mantine Theme (không hardcode).

### Trải nghiệm Tương tác (Interaction)

- [ ] Tất cả các phần tử clickable đều có hiệu ứng phản hồi trực quan (opacity/color transition) trong vòng 150-200ms.
- [ ] Có thuộc tính `cursor: pointer` trên các phần tử tương tác.
- [ ] Trạng thái disabled được hiển thị rõ ràng (mờ đi, không nhận click và đổi cursor thành `not-allowed`).

### Độ tương phản và Theme

- [ ] Độ tương phản của body text đạt tối thiểu 4.5:1 trên cả Light mode và Dark mode.
- [ ] Kiểm tra giao diện hoạt động tốt trên cả hai chế độ sáng và tối (không bị mất border, không bị trùng màu chữ/màu nền).

### Bố cục & Responsive

- [ ] Đã kiểm tra giao diện trên màn hình kích thước nhỏ (chiều ngang cửa sổ tối thiểu 375px) và các màn hình lớn (1440px+).
- [ ] Layout tuân thủ hệ thống lưới 8px.
- [ ] Không có nội dung cuộn bị che khuất bởi các thanh header/footer cố định.
