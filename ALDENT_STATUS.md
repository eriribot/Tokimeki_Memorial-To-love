# 艾尔登特当前状态

```yaml
status: waiting_for_review
current_loop: episode01-director-module-refactor
authorized_by: user_episode_act_scene_character_modularization_2026-07-19
authorized_scope:
  - split episode 01 into episode and act modules without changing stable IDs or save/message shapes
  - centralize scene assets, portrait-character assets and episode-specific director decisions
  - add a minimal reproducible story-module contract check
  - update current module, artifact and human-review records
forbidden_scope:
  - add episode 02 content or claim multi-episode runtime support
  - change AP/date settlement, save schema, message protocol, prompt text or playable-text extraction
  - change worldbook selection, the one-shot World Info hook or saved worldbook state
  - change Galgame CSS, portrait coordinates, animation timing or visual layout
  - create host messages or connect MESSAGE_SENT, shujuku, ACU, plugins, or databases
  - claim behavior or human acceptance from source checks, builds or inline verification
connection_state: source_and_production_inline_artifact_updated_human_review_pending
overall_connection_label: 第一集导演式模块重排已进入生产 inline artifact；真实剧情行为与 Tavern 链路尚未人工复验
superseded_evidence:
  - first production artifact 157468669E2EEF317A952EE5BC5BE9986AE25C8F6E53FB03A71A3BB8EB2BBAC6 was replaced before invitation finalization
  - parallel review development artifact 5279B2ADCB453338CF74520A27A74F95E93B3246F9C2243524A2D71F51A470BC was never reviewable
human_review: pending_episode01_director_module_refactor_acceptance
prior_pending_reviews:
  - dual-map-landscape-overlay-responsiveness
  - story-progression-character-availability-and-raw-reader
  - merge-local-scenes-with-remote-story-display
  - ep01-act1-background-sequence
  - haruna-cross-page-blink-continuity
completed_human_reviews: []
next_loop: frozen_after_episode01_module_review_invitation_until_new_explicit_feedback_or_completed_review_form
```

## 当前人工审查：第一集导演式模块重排

本轮把第一集从单个 `lalaArrival.ts`
和散落的 UI/service 判断中拆成可审查的集、幕、场景、角色与导演模块。现有 event/act/floor/message ID、`lalaExpression`
存档字段、AP/日期结算、prompt、世界书选择和宿主接通状态保持不变。

- `episodes/episode01/acts/act01.ts` 与 `act02.ts` 分别保存本幕元数据、场景时间线和保底页。
- `episodes/episode01/director.ts` 集中背景、effect、菈菈表情推断和菈菈/春菜/梨子出镜 cue。
- `scenes/index.ts` 统一背景 ID、路径和 alt；`characters/index.ts` 统一三名角色的姓名牌、别名、表情和 rig。
- `storyRegistry.ts` 目前只登记第一集；`lalaArrival.ts`、`galAssets.ts` 只保留旧 import 兼容。
- `verify-story-modules.cjs` 检查稳定 ID、两次行动触发、fallback、场景/角色登记和实际资源存在性。

| Check                              | Status  | Evidence                                                                                     |
| ---------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| Story module contract              | passed  | `pnpm run verify:story`；稳定 ID、AP=1/0、lore、fallback、director cue、资源与兼容门面通过   |
| Changed-file ESLint                | passed  | 本轮 TS/TSX/CJS 文件无 lint error                                                            |
| Full subtree TypeScript            | failed  | 仅剩未改动 `stores/characterStore.ts:24` 的既有 `string \| null` 传给 `Set<string>.has` 错误 |
| Production build                   | passed  | 所有子任务结束后最终运行 `pnpm build`；`dist/webgame-ui/index.html` 为 488827 bytes          |
| Exact inline artifact verification | passed  | legacy entity/currency/replacement/syntax error 均为 0，单 inline script                     |
| Artifact identity                  | passed  | SHA-256 `EF43DC856706E67502CC7C0DFE76B3FF3B07B03571D0C30D12044FC9B3DF89E6`                   |
| Real Tavern generation             | not run | 未调用真实 `TavernHelper.generate()`，未复验 World Info 一次性扫描                           |
| Old save / two-act behavior        | not run | 等待人工读取旧存档并完成两次行动、两幕、背景和立绘回归                                       |
| Human acceptance                   | not run | 等待用户审查                                                                                 |

当前连接标签不升级：生成 API、一次性 World Info 扫描实现和本地 messagesave 镜像保持原状；hidden host floors、
`MESSAGE_SENT`、shujuku/ACU 和数据库仍未接通。

### 人工复现

1. 读取重构前的第一集存档，确认当前幕、采用楼层、AI 原文和页位置仍可恢复。
2. 新游戏在 2008-04-07 完成第一次有效行动，确认进入第一幕；完成第一幕后返回自由行动，再完成第二次行动进入第二幕。
3. 确认第一幕背景仍为 `school -> night -> washroomDoor -> washroom`，第二幕仍为 `washroom -> night -> school`。
4. 确认第一幕校内段春菜默认出现，梨子发言或旁白提到梨子时切换梨子；带 `lalaExpression` 的页仍由菈菈优先。
5. 在真实 Tavern 中各生成一幕，确认选中的世界书保存条目继续保持关闭，生成后正文、fallback、重新生成和原文阅读器行为不变。

### 已知风险

- 第二集不能只靠新增目录接入；store 当前正文投影、存档恢复、历史目录、重新生成上下文和文本导出仍需按 `eventId`
  分集，这属于下一轮独立范围。
- 全量 TypeScript 尚被未改动的 `characterStore.ts` 既有空值类型错误阻断；本轮改动文件没有剩余 TypeScript 报错。
- 构建、lint 和 contract check 不能证明剧情语义、视觉节奏、旧存档或真实 Tavern World Info 行为。

## 保留的既有待审范围：双地图与默认 PC 嵌入菜单

用户曾于 2026-07-19 回复“我校验通过”，但随后提供了手机横屏重叠与默认 PC 嵌入态菜单过小的反例；旧通过结论已被后续反馈覆盖。三个目标尺寸的几何检查没有覆盖 SillyTavern 默认 PC 嵌入态，因此不能证明该状态的菜单比例。本记录只审查地图切换控件与相关布局，不接受或替代其他主线范围。

- 彩南高中使用 `map.png`，左侧 `map_next02.png` 前往彩南町；角色档案在右侧镜像位置。
- 彩南町使用 `map1.png`，右侧 `map_next01.png` 返回学校；角色档案切到左侧镜像位置。
- 护法完整可见图形可点击；反馈沿 PNG Alpha 图形描边，没有矩形毛玻璃底、整图模糊、整图阴影或整体缩放。
- 彩南高中校门最终坐标为 `(0.8, 3.2)`，位于护法右下方的道路入口，不再与护法或菜单重叠。
- 地图由当前地点推导，切图不消耗 AP，也不新增独立存档字段。
- `game-frame` 高度 `481-700px` 时，日历为 `82px`、护法为 `66px`、档案为 `40x96px`；菜单不再固定为
  `52px`，而是按实际宽度使用 `clamp(52px, 7.5cqw, 66px)`。
- 手机横屏档以 `game-frame` 高度 `<=480px` 为准：日历 `52px`、护法 `44px`、菜单 `40px`、档案
  `30x72px`；护法和档案共同下移到 `56%` 高度，保持左右镜像同轴并避开左上日历和左下菜单。

| Check                                 | Status  | Evidence                                                |
| ------------------------------------- | ------- | ------------------------------------------------------- |
| Final development compilation         | passed  | 最新菜单规则后运行 `pnpm build:dev`，Webpack 成功       |
| Port 8000 default PC embedded runtime | passed  | 地图框 `910x546px`，菜单 `66x66px`，左/下边距均为 `8px` |
| Port 5500 / fullscreen / other sizes  | not run | 用户明确限制本轮不得验证这些范围                        |
| Human visual review                   | not run | 等待用户确认默认 PC 嵌入态菜单比例                      |

本次地图调整不改变生成链、宿主消息链、插件/数据库链或 UI messagesave 镜像的既有接通标签。

## 仍待人工验收的既有范围

- 主线当前幕从已采用正文进度恢复；非活动事件存档不再无条件把 `mainStoryActIndex` 清零。
- 恢复或继续游戏时会幂等检查 4 月 7 日的 AP 阈值，补回已经到点但尚未进入的幕；普通正确的 `AP=1 / actIndex=1`
  状态仍等待下一次行动触发第二幕。
- 角色卡继续保存在 Card
  store，出现位置由独立规则同步：梨子和春菜初始可见，菈菈完成第一集后可见，梦梦、唯和小暗当前锁定；未知导入角色默认可见。
- AI 原文通过既有楼层 `messageIds` 关联 Tavern
  Assistant 消息，按幕和楼层版本组织，并对原字符串做只读分页。已读目录中的每个楼层可直接打开其原文版本。
- 没有修改提示词、世界书、Tavern 宿主消息、生成协议、shujuku、插件或数据库链。

## 验证证据

| Check                                | Status  | Evidence                                                     |
| ------------------------------------ | ------- | ------------------------------------------------------------ |
| Source formatting / lint             | not run | 用户要求全部检验交给人工                                     |
| TypeScript / development build       | passed  | 地图尺寸调整后整包 `pnpm build:dev` 成功；不等于故事行为验收 |
| Production build                     | not run | 未运行 `pnpm build`                                          |
| Browser / Playwright interaction     | not run | 未启动页面或浏览器自动化                                     |
| Save/load AP progression             | not run | 等待人工在实际存档流程中验收                                 |
| Character visibility                 | not run | 等待人工检查地图、场景、档案和文本态                         |
| Raw reader act/version/page behavior | not run | 等待人工检查具体楼层选择与分页                               |
| Raw message immutability             | not run | 等待人工比较保存消息与重新生成上下文                         |
| Inline artifact verification         | not run | 未运行 `verify-inline-bundle.mjs`                            |
| Real Tavern generation               | not run | 未调用真实 Tavern Helper 生成                                |
| Human acceptance                     | not run | 等待用户审查                                                 |

## 当前接通状态

- 地图 UI 源码和开发产物已更新；故事进度、角色出场和原文阅读器仍没有新的运行时验收证据。
- 生成链、一次性 World Info 扫描链和游戏 messagesave 镜像保持原实现，本轮未验证也未改动其协议。
- 宿主消息链仍未创建 hidden user/assistant 楼层。
- 插件/数据库链仍未接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- 原文阅读器只读取游戏保存的 Tavern Assistant 消息，不新增消息，不修改 prompt history，也不代表宿主聊天权威。

## 人工复现

1. 开始新游戏，确认地图、地点提示、附近角色与角色档案中只有夕崎梨子和西连寺春菜，菈菈、梦梦、古手川唯和小暗都不出现。
2. 完成 4 月 7 日第一集两幕后，确认菈菈开始出现在校园；梦梦、古手川唯和小暗仍保持隐藏。
3. 第一幕完成后在 `AP=1`、日期仍为 4 月 7 日时保存并读取，确认已读第一幕和当前幕进度保留，且不会重复触发第一幕。
4. 读取上述存档后执行第二次有效行动，确认 AP 到 0 时进入第二幕 AI 正文，而不是直接跨到 4 月 8 日。
5. 打开已读剧情，分别从总入口和具体楼层的 `AI 原文`
   按钮进入，确认可以切换幕、生成版本和单页，并且具体楼层按钮会预选对应版本。
6. 检查长原文一次只显示一页，上一页/下一页和页数正确；把各页按顺序拼接后应与原 Assistant 消息完全一致。
7. 关闭阅读器并重新生成候选楼层，确认已保存原文、采用楼层以及用于连续性的历史消息没有因阅读、切页或切版本发生变化。

## 已知风险

- 本轮没有运行格式化、lint、生产构建或 inline
  artifact 检查；开发构建与边界测量只能证明本地实现可编译且几何不重叠，最终观感仍需人工确认。
- 角色出场规则当前只覆盖已有第一集进度；梦梦、唯和小暗在未来剧情事件落地前保持锁定。
- 恢复补触发依赖存档中的日期、AP、已采用幕和完成事件记录彼此一致；异常或手工修改过的存档仍需单独判断。
- 原文分页按字符上限优先寻找段落或句末断点，只影响阅读视图，不是 GAL 正文解析或消息迁移。
- 背景顺序、春菜跨页眨眼以及前次合并后的真实 Tavern 扫描仍是前序待验收项，本轮不自动接受它们。

本状态更新后只剩审查邀请；邀请发出后冻结修改。
