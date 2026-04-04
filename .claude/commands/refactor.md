# Refactor Code

Phân tích và suggest refactor patterns cho code.

## Hướng dẫn

Phân tích và refactor: $ARGUMENTS

### Bước 1: Detect Code Smells
Tìm các vấn đề sau:
- 🐟 **Long functions** (>30 lines) → Extract method
- 🐟 **Deep nesting** (>3 levels) → Early return, guard clauses
- 🐟 **Duplicate code** → Extract shared utility
- 🐟 **God class/module** (>300 lines) → Split responsibilities
- 🐟 **Primitive obsession** → Sử dụng proper types/enums
- 🐟 **Long parameter list** (>3 params) → Use options object
- 🐟 **Feature envy** → Move method to proper class/module
- 🐟 **Dead code** → Remove unused imports, variables, functions

### Bước 2: Suggest Patterns
Áp dụng patterns phù hợp:
- **Strategy Pattern** — khi có nhiều if/else hoặc switch
- **Factory Pattern** — khi tạo objects phức tạp
- **Repository Pattern** — tách DB logic khỏi business logic
- **Middleware Pattern** — cho cross-cutting concerns (logging, auth, validation)
- **Builder Pattern** — khi construct objects nhiều optional params
- **Observer/Event Pattern** — khi cần decouple modules

### Bước 3: Thực hiện refactor
- Refactor từng bước nhỏ, mỗi bước phải giữ behavior không đổi
- Chạy tests sau mỗi bước (nếu có)
- Giữ backward compatibility cho public APIs

### Bước 4: Verify
- So sánh before/after
- Đảm bảo không break existing functionality
- Check bundle size nếu là frontend code

## Output format

```
🔍 CODE SMELLS DETECTED:
1. [smell] tại [file:line] → [suggestion]

🛠️ REFACTOR PLAN:
Step 1: [mô tả] — Risk: Low/Medium/High
Step 2: [mô tả] — Risk: Low/Medium/High

📊 IMPACT:
- Lines of code: X → Y (giảm Z%)
- Cyclomatic complexity: X → Y
- Readability: ⭐⭐⭐ → ⭐⭐⭐⭐⭐
```

Target: $ARGUMENTS
