# 经验：宿主钩子隔离与双路线桥接

## Use when

同一 UI 同时存在隔离的开场/预览/摘要路线和必须触发原生 shujuku、ACU、qrf_plot 或数据库的普通路线。

## Four paths

- 生成链：裸 prompt、quiet preset、普通聊天生成或 slash trigger。
- 消息链：是否创建真实 user/assistant 楼层，是否 hidden。
- 插件链：`MESSAGE_SENT`、`/trigger`、worldbook、ACU/shujuku/database。
- 镜像链：UI 从哪个权威状态回读。

## Invariants

- 普通同层交互需要 shujuku 时必须回到真实隐藏楼层。
- 隔离阶段不能发送会触发插件的宿主事件。
- 裸 prompt 不能冒充“使用酒馆预设”。
- 本地 UI 成功不能冒充 host/plugin 成功。

## Checks

- 隔离阶段：日志证明 preset/角色卡/世界书参与，且 `MESSAGE_SENT`、`/trigger`、`dbReadState`、`dbSyncState` 未触发。
- 普通阶段：日志证明当前轮 hidden user、规划/数据库链和 assistant 正文楼层存在。
- 审查邀请明确列出允许触发和必须隔离的链路。
