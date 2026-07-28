---
name: git-safety
description: >-
  Critical safety guardrails for protected branches: never commit,
  push, or force-push directly to main or release branches;
  no destructive history rewrites without explicit user approval.
  Use before any git operation that touches protected branches,
  before force-push, reset --hard, history rewrite, or branch
  deletion, or whenever the user asks about merging, pushing, or
  release branches.
---

# Quy Tắc An Toàn Git (Git Safety Rules)

Đây là quy định **tối quan trọng** nhằm tránh làm hỏng lịch sử Git trên các nhánh chính của dự án. AI Agent bắt buộc phải tuân thủ nghiêm ngặt.

## 1. Các Nhánh Được Bảo Vệ (Protected Branches)

Tuyệt đối **không bao giờ commit, merge, rebase, hoặc push trực tiếp** lên các nhánh được bảo vệ sau:

- `main` - Nhánh chính chứa mã nguồn ổn định nhất.
- `release/*` - Nhánh phục vụ đóng gói phân phối sản phẩm (ví dụ: `release/v1.0.0`).

## 2. Các Hành Vi Bị Cấm (Prohibited Actions)

- ❌ **Direct Commit**: Không thực hiện lệnh `git commit` khi đang ở trên nhánh bảo vệ.
- ❌ **Direct Push**: Không chạy lệnh `git push origin <protected-branch>` hoặc `git push` từ các nhánh này lên remote.
- ❌ **Force Push**: Tuyệt đối không chạy lệnh `git push --force` hoặc `git push -f` trỏ đến các nhánh bảo vệ.
- ❌ **Local Merge**: Không chạy lệnh `git merge <feature-branch>` khi đang đứng ở nhánh bảo vệ.
- ❌ **Local Reset**: Không chạy lệnh `git reset --hard` trên các nhánh bảo vệ để tránh mất mát lịch sử commit chung.

## 3. Quy Trình Phát Triển Bắt Buộc (Required Workflow)

1. **Luôn tạo nhánh tính năng mới** từ nhánh `main` trước khi chỉnh sửa code:

   ```bash
   git checkout -b feature/ten-tinh-nang
   ```

2. **Xác nhận nhánh hiện tại** bằng lệnh trước khi thực hiện push:

   ```bash
   git branch --show-current
   ```

3. **Mở Pull Request (PR)** trên GitHub/GitLab và chờ review để thực hiện merge code vào nhánh bảo vệ.

## 4. Xử Lý Sự Cố (Error Recovery)

Nếu bạn lỡ chỉnh sửa code trực tiếp trên nhánh `main` nhưng chưa commit:

1. Lưu tạm thời các thay đổi vào stash:

   ```bash
   git stash
   ```

2. Tạo và chuyển sang nhánh tính năng mới:

   ```bash
   git checkout -b feature/appropriate-branch-name
   ```

3. Khôi phục lại các thay đổi đã lưu:

   ```bash
   git stash pop
   ```

4. Tiếp tục thực hiện commit và push trên nhánh mới này.
