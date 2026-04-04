# Code Review (Superpower)

Sử dụng superpower `requesting-code-review` để review code chuyên nghiệp.

## Cách dùng

```
# Review thay đổi mới nhất (so với commit trước)
Skill({
  skill: "requesting-code-review",
  args: "Review các thay đổi vừa implement"
})

# Review file cụ thể
Skill({
  skill: "requesting-code-review",
  args: "Review backend/src/controllers/company.js"
})

# Review PR/Branch
Skill({
  skill: "requesting-code-review",
  args: "Review PR này trước khi merge"
})
```

## Superpower Review khác gì?

- ✅ Spawn **code-reviewer subagent** chuyên review
- ✅ So sánh **git diff** (base SHA → head SHA)
- ✅ Checklist chuẩn: Quality, Security, Testing, Architecture
- ✅ Output: Strengths + Critical/Important/Minor + Verdict rõ ràng
- ✅ Review **trước merge**, sau mỗi task, khi gặp khó khăn

## Ví dụ workflow

```
1. Implement xong feature
2. Skill requesting-code-review → nhận feedback
3. Fix Critical/Important issues
4. Push code
```

## Tham khảo

Skill: `C:/Users/ADMIN/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.2/skills/requesting-code-review/`
Agent template: `requesting-code-review/code-reviewer.md`

Review file: $ARGUMENTS
