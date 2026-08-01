# 经验：真实 API 已通不等于可见身份已通

## Use when

resolver/state-sync/prompt facts 正确，但用户看到的学年、班级、身份或关系仍是旧值。

## Layers

- 计算层：当前身份是否算对。
- 显示层：用户可见面是否仍读取基底或 legacy 字段。
- 验证层：handoff 中声称执行的命令是否真实可跑。

## Invariants

- 基底字段不能冒充当前身份。
- 当前身份的 resolver/state-sync 产物是用户可见面的权威。
- 真实 API 跑通不自动证明显示层正确。
- 跑不通的命令不能写成“已验证”。

## Checks

让基底值与当前值刻意不同，同时核对 prompt facts、UI 文案和 handoff 命令。
