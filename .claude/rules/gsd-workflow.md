# GSD Workflow Rules

MANDATORY — Dev agent phải tuân thủ GSD workflow cho project này.

## Plan File Location

| File | Purpose |
|------|---------|
| `.gsd/state.json` | Canonical state — orchestration dùng |
| `.gsd/plan.md` | GSD overview |
| `.gsd/phases/phase-*.md` | Chi tiết từng phase |
| `function-plan.md` | Copy của plan đầy đủ |

## Phase Execution Rules

### Trước Mỗi Phase

1. Đọc `.gsd/phases/phase-X.md` đầy đủ
2. Verify state.json: `workflow_mode`, `current_phase` đúng
3. Tạo atomic task list từ phase file
4. Xác định parallel vs sequential tasks

### Trong Phase

1. Mỗi task → implement → verify → **commit TRƯỚC KHI** next task
2. Nếu task fail: fix → verify → commit trước khi tiếp
3. Sau phase hoàn thành: full phase verification → commit phase complete

### Review Gates

| Gate | Trigger | Action |
|------|---------|--------|
| L0 | Docs only | Self-review, ko cần agent |
| L1 | Settings write, dashboard | code-reviewer agent |
| L2 | Checkout cart manipulation | code-reviewer agent + security-reviewer |

```bash
# L1/L2: Gọi code-reviewer sau khi implement
# (Dùng Agent tool với subagent_type="code-reviewer")
```

## Task Definition

Mỗi task phải có:
- **File cụ thể** để viết
- **Verification condition** cụ thể
- **Commit sau khi pass**

### Task Template

```
## Task X.Y — [Tên]

**File:** `path/to/file.jsx`
**Action:** [Viết gì]
**Verification:**
```bash
[command để verify]
```
```bash
# Commit sau khi pass
git add path/to/file.jsx
git commit -m "feat(ext): [mô tả task]"
```
```

## Hard Gates

```
⛔ KHÔNG BAO GIỜ bỏ qua verification trước khi commit
⛔ KHÔNG BAO GIỜ skip code-reviewer cho L2 tasks
⛔ KHÔNG BAO GIỜ implement feature chưa có trong phase plan
⛔ KHÔNG BAO GIỜ bypass Shopify constraints (custom CSS, DOM access, etc.)
```

## Shopify App Dev

### Pre-Scaffold Phase
- Chưa có `package.json` → chạy `shopify app init` TRƯỚC
- Sau scaffold → update `.gsd/state.json` → `workflow_mode = "executing"`

### Post-Scaffold
- Extension file: `extensions/checkout-tip-block/src/Checkout.jsx`
- Admin routes: `app/routes/app.*.jsx`
- Services: `app/services/TipStatsService.server.js`

## Commit Convention

```bash
git commit -m "feat(ext): add tip options UI with choice-list

Implements task 2.2 from phase-2.
- Radio buttons for 15%, 18%, 20%, None
- Default selected: 18%
- Uses s-choice-list component"
```

## Git Workflow

1. **Mỗi task** → commit riêng (small, focused)
2. **Hết phase** → commit "phase-X complete"
3. **Feature complete** → squash/fixup nếu cần
4. KHÔNG force push
5. KHÔNG skip git status trước khi commit

## State Management

Sau mỗi phase complete:

```json
{
  "status": "executing",
  "workflow_mode": "executing",
  "current_phase": "phase-X",
  "phases": [
    { "id": "phase-1", "status": "completed" },
    { "id": "phase-2", "status": "in_progress" }
  ]
}
```

## Context Limits

- Context > 70% → dừng, save state, báo user
- Context < 35% → tiếp tục bình thường
- Long task → break thành smaller tasks
