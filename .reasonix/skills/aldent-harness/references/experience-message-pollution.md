# 经验：消息污染防线

## Use when

摘要、回溯、重新生成、导入导出或 prompt 历史拼装可能让旧消息再次进入上下文。

## Invariants

- `lastSummarizedIndex` 只前进；仅当它超过实际消息总数时允许回退。
- 摘要覆盖范围缩小，不代表旧消息可以重新进入 prompt。
- 区分“摘要为空”和“消息不存在”。

## Checks

- 搜索无条件的 `lastSummarizedIndex = maxCovered + 1`。
- 回退前核对 `conversationCount`。
- 重生成使用当前阶段已存 prompt/context，而不是旧聊天、本地缓存或过期 host state。
