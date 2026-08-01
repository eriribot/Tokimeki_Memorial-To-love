# 经验：同层样式不污染宿主

## Use when

Tavern Helper iframe/同层 UI 影响宿主头像、右侧角色图、插件面板或全局布局；资源已加载但尺寸变成 `0x0`。

## Invariants

- iframe 样式不默认进入宿主。
- 只有卡片自己的命名空间样式可以带出。
- 宿主头像、角色图和固定插件 UI 不属于卡片控制范围。
- 图片已加载但 `0x0` 时先查 CSS 和布局。

## Checks

- 拒绝输出到宿主的 `html`、`body`、`*`、`#app` 等全局选择器。
- 拒绝宿主头像/角色图选择器和坏的占位 `@import`。
- 确认卡片 scoped 样式、ACU/dice/shujuku UI 和 hidden bridge floors 仍正常。
