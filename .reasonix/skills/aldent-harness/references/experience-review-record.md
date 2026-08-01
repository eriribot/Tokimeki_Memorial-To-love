# 经验：可恢复审查记录

## Use when

任务跨文件、修复杂 bug、新增协议，或下一任务必须恢复人工批准范围。

## Active record

只维护一份紧凑的当前状态，至少包含：

```text
status:
authorized_scope:
forbidden_scope:
connection_state:
evidence:
superseded_evidence:
human_review:
next_loop:
```

历史邀请和旧结论进入归档，不继续充当当前规格。已执行、已检查、仍是假设必须可区分。

同一范围出现更新的人类反馈或运行反例时，旧接受立即降级并移入 `superseded_evidence`，直到反例被修复并重新验收。不同范围的通过与失败保持独立，不能互相覆盖。
