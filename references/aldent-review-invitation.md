# 艾尔登特审查邀请

## 本轮结果

- 已解决本地 `fac9bdc` 与远端 `d120b26` 的三处 merge conflict，没有丢弃任一提交。
- 保留本地新背景、菈菈/春菜共享分层立绘及无需完成标记的行为。
- 保留远端正文显示修复：幕开场/结尾 prompt、最多 6 条已保存主线消息、一次性原生 World Info 扫描，以及临时角色姓名牌。
- `剧情第一集` 和按幕选择的人物条目仍必须保持关闭；代码只临时启用本次扫描的副本，不应修改保存状态。
- 远端删除的旧 `output/` 测试脚本和产物保持删除，没有新建 `.mjs`。

## 验证证据

| Check                           | Status  | Evidence                                                                          |
| ------------------------------- | ------- | --------------------------------------------------------------------------------- |
| Merge conflicts                 | passed  | 三个冲突路径已解析，源码无 conflict marker                                        |
| Targeted lint                   | passed  | 合并相关 TypeScript/TSX 文件 0 errors                                             |
| Development / production builds | passed  | fresh `pnpm build:dev`、`pnpm build`                                              |
| Static production browser       | passed  | 地图、角色和 AP/日期状态正常；缺 Tavern 文件桥为预期错误                          |
| Exact inline safety             | passed  | 五项风险/语法计数均为 0，`scriptCount = 1`                                        |
| Exact artifact                  | passed  | 473,451 bytes；`A04DE67443EEA4E059F0E2070E1C1C5FD420D245A7A3AF46E38A212E189FC196` |
| Real World Info scan            | not run | 静态浏览器不能触发真实 Tavern 扫描事件                                            |
| Real generation / GAL           | not run | 等待用户加载合并包触发两幕                                                        |

## 当前接通状态

- [ ] 不涉及接通
- [ ] 只是界面草图
- [x] 只是本地状态演示
- [ ] 已接入真实状态读取
- [ ] 已接入真实状态写入
- [ ] 已可作为正式流程使用

- 生成链：真实 API 路径存在，本轮未在 Tavern 中运行。
- World Info 链：一次性扫描钩子已编译，真实命中/停止待验证。
- 宿主消息链：未创建真实楼层；连续性来自游戏保存消息。
- 插件/数据库链：未接通。
- UI 镜像链：保持不变。

## 人工复现

1. 加载上述 SHA-256 对应的 fresh inline，确认剧情和菈菈人物条目保持关闭。
2. 第一次行动触发第一幕，确认无完成标记正文进入 GAL，本次扫描只启用剧情副本。
3. 播完第一幕确认 4 月 7 日/AP=1 和四段背景顺序。
4. 第二次行动触发第二幕，确认扫描包含剧情/菈菈副本，并使用已保存消息保持连续性。
5. 生成后确认保存条目仍关闭、后续普通扫描不继续命中；播完确认 4 月 8 日/AP=2。
6. 检查菈菈与春菜分层立绘、口型和眨眼无合并回归。

## 需要人的决定

请确认真实 Tavern 中两次 World
Info 扫描、AI 正文、GAL 画面和生成后条目关闭状态。静态构建不能证明这个宿主时序，本邀请不把它写成已接通。

本邀请发出后冻结修改；没有新的明确反馈或完成的审查表，不继续下一实现轮。
