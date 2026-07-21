# 艾尔登特审查邀请

## 本轮结果

- 用户可见结果：第一集已按“集 -> 幕 -> 导演 -> 场景/角色资源”重排；现有两幕行为、稳定 ID、存档/message 形状和 GAL 协议保持不变。
- 授权来源：用户明确要求把第一集、幕、场景和角色表情模块化，以便以后像导演一样控制剧情。
- 本轮范围：第一集目录重排、场景/角色 manifest、第一集 director、单集 registry、兼容门面、最小契约检查和当前文档。
- 明确未触碰：第二集内容、多集状态投影、AP/日期结算、存档 schema、prompt、正文抽取、世界书选择、CSS/立绘坐标、宿主消息、插件和数据库链。

## 主要改动文件

- `GalMainStory/episodes/episode01/index.ts`
- `GalMainStory/episodes/episode01/acts/act01.ts`
- `GalMainStory/episodes/episode01/acts/act02.ts`
- `GalMainStory/episodes/episode01/director.ts`
- `GalMainStory/scenes/index.ts`
- `GalMainStory/characters/index.ts`
- `GalMainStory/storyRegistry.ts`
- `GalMainStory/lalaArrival.ts`
- `GalMainStory/galAssets.ts`
- `GalMainStory/GalMainStory.tsx`
- `services/tavernStoryGeneration.ts`
- `stores/gameStore.ts`
- `save/snapshot.ts`
- `verify-story-modules.cjs`
- `package.json`
- `MODULES.md`
- `ALDENT_STATUS.md`

## 验证证据

| Check                              | Status  | Evidence                                                                                  |
| ---------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| Story module contract              | passed  | `pnpm run verify:story`；ID、AP=1/0、lore、fallback、director、资源和兼容门面通过         |
| Changed-file ESLint                | passed  | 本轮 TS/TSX/CJS 文件无 lint error                                                         |
| Independent code review            | passed  | 未发现行为回归、循环依赖、类型错误或资源/ID 漂移                                          |
| `MODULES.md` closed-book recovery  | passed  | 隔离代理可恢复 event/act ID、世界书 UID/名称和第二集未完成边界                            |
| Full subtree TypeScript            | failed  | 未改动 `stores/characterStore.ts:24` 的既有 `string \| null` 错误阻断；本轮文件无剩余报错 |
| Production build                   | passed  | 所有子任务结束后最终运行 `pnpm build`；`dist/webgame-ui/index.html` 为 488827 bytes       |
| Exact inline artifact verification | passed  | legacy entity/currency/replacement/syntax error 均为 0；检查 1 个 inline script           |
| Artifact identity                  | passed  | SHA-256 `EF43DC856706E67502CC7C0DFE76B3FF3B07B03571D0C30D12044FC9B3DF89E6`                |
| Real Tavern generation             | not run | 未调用真实生成，未复验 World Info 一次性扫描                                              |
| Old save / two-act behavior        | not run | 等待人工读取旧存档并完成两幕回归                                                          |
| Human acceptance                   | not run | 等待用户决定                                                                              |

## 人工复现

1. 读取重构前的第一集存档，确认当前幕、采用楼层、AI 原文和页位置仍能恢复。
2. 新游戏在 2008-04-07 完成第一次有效行动进入第一幕；返回自由行动后完成第二次行动进入第二幕。
3. 确认第一幕场景顺序为 `space -> school -> schoolGate -> home -> washroom`，第二幕为
   `washroom -> home -> bedroom -> rooftop -> nightStreet -> park -> schoolRoad`。
4. 确认菈菈、春菜和梨子只使用各自独立角色模块中登记的立绘；未登记人物只显示实名通用名牌。
5. 在真实 Tavern 中各生成一幕，确认保存世界书条目仍关闭，生成、fallback、重新生成和 AI 原文阅读行为不变。

预期看到：目录结构变清楚，但第一集的玩家可见行为、状态结算、生成输入和保存数据没有变化。

## 当前接通状态

- [x] 不涉及新的接通
- [ ] 只是界面草图
- [ ] 只是本地状态演示
- [ ] 已接入真实状态读取
- [ ] 已接入真实状态写入
- [ ] 已可作为正式流程使用

分链路记录：

- 生成链：既有 `TavernHelper.generate()` 与一次性 World Info hook 未改，本轮未真实运行。
- 宿主消息链：仍未创建 hidden user/assistant floors。
- 插件/数据库链：仍未接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- UI 镜像链：既有本地 messagesave/file bridge 未改，不冒充宿主聊天权威。
- 本轮允许触发：本地 contract check、lint、生产构建和 exact inline checker。
- 本轮必须隔离：真实生成、世界书保存写入、宿主消息和插件/数据库副作用。

## 已知风险与缺失证据

- 第二集不能只新增 `episode02`；`mainStoryActs`、存档恢复、历史目录、重新生成上下文和 `render_game_to_text()` 仍需按
  `eventId` 分集。
- 旧存档恢复、真实两幕体验、角色表情语义和 World Info 一次性扫描仍需人工/真实 Tavern 证据。
- 全量 TypeScript 仍有一个未改动文件的既有空值错误，本轮未扩大范围修复。

## 需要人的决定

请填写 `aldent-human-review-form.md`，选择接受、限定下一轮、拒绝或证据不足。

本邀请发出后冻结修改；没有新的明确反馈或完成的审查表，不开启下一实现轮。
