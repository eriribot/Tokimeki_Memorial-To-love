# 经验：语义验收与测试预言机完整性

## Use when

自动检查全绿但真人正例或反例失败；AI 负责路线、摘要、记忆、事件或状态语义；修复同时想改 expected、fixture、阈值、mock、fallback 或交付产物。

## Authority

当前用户目标或完成的审查合同定义预期行为。自动测试是该合同的证据，不是修改合同的授权。

后到的同范围真人反例会撤销旧接受并降级当前状态；保留旧记录，但不能继续把旧 `passed` 当现状。不同范围的反馈不得互相覆盖。

## Acceptance contract

- 修复前冻结失败输入、期望结果、前状态和实际结果；依赖该断点的用例记 `not run`，并在证据中写 `blocked by <断点>`，不计通过。
- 分开报告证据来源、语义解释、状态提交、UI 回读、真实生成、宿主消息和插件/数据库。
- 正例、否定最小对和边界反例都保留；语义泛化使用未出现在 prompt、fixture 或实现关键词中的自然改写。
- 同一模型、相近 prompt 的重试是相关证据，不是独立裁判。
- 可由日期、状态、互斥表或确定性规则决定的 yes/no 事实，由代码守住；模型只处理不可机械化的解释。
- build、lint、call graph、simulation 和 mock 只标记各自层。真实链路需要实际 UI 动作、真实运行结果、耐久写入和刷新/读档回读。
- 构建证据同时记录命令退出码、目标产物的新 hash 或 mtime，以及对确切交付产物执行的检查；旧 dist 通过不证明新源码。

如果 expected、fixture 或合同确实有错，单独说明权威依据，并把它标为“合同/测试修正”；不要把实现和预言机同时变化后的绿色结果当独立证明。

## Stop conditions

- 实现与 expected 同时变化，但没有独立权威说明哪一方错。
- 为特定测试文本、关键词、message ID 或快照增加生产分支。
- 真人反例未解决，却准备恢复“正式可用”或更强标签。
- 前置正例失败后仍继续累计下游通过率。

## Review evidence

```text
authoritative_behavior:
preserved_positive_and_negative_cases:
oracle_changes:
artifact_identity:
before_failure:
after_result:
blocked_dependents:
human_review:
```
