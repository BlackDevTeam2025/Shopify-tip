# Generate & Run Tests

Tự động sinh test cases và chạy test cho file/module được chỉ định.

## Hướng dẫn

Hãy thực hiện các bước sau cho file hoặc module: $ARGUMENTS

### Bước 1: Phân tích code
- Đọc file/module được chỉ định
- Xác định tất cả functions, methods, classes cần test
- Xác định edge cases, error cases, boundary conditions

### Bước 2: Sinh test cases
- Sử dụng framework: **Jest** (hoặc Vitest nếu project dùng Vite)
- Đặt file test cạnh file gốc: `filename.test.ts` hoặc trong `__tests__/`
- Bao gồm các loại test:
  - ✅ Happy path (input hợp lệ, kết quả mong đợi)
  - ❌ Error cases (input sai, throw error đúng)
  - 🔄 Edge cases (empty, null, undefined, boundary values)
  - 🔀 Async cases (nếu có async/await)

### Bước 3: Mock strategy
- Mock external dependencies (DB, API calls, file system)
- Sử dụng `jest.mock()` hoặc `vi.mock()`
- Không mock internal logic

### Bước 4: Chạy test
- Chạy `npx jest <test-file>` hoặc `npx vitest run <test-file>`
- Báo cáo kết quả: pass/fail/coverage

## Output format

```
📝 Generated: X test cases
  - Y happy path
  - Z error cases
  - W edge cases

🧪 Results: X passed | Y failed | Z skipped
📊 Coverage: X% statements | Y% branches
```

Target: $ARGUMENTS
