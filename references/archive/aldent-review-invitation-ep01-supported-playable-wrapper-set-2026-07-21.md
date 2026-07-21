# 艾尔登特审查邀请

> 已归档：这是 `ep01-supported-playable-wrapper-set` 的待审记录，不再是当前审查邀请。

## 本轮结果

- 用户可见结果：正文解析不再把 `<content>` 当作唯一合法标签。`<正文>`、`<story_scene>`、`<story_scence>`
  以及原先登记的其他正文标签均可使用。
- 容器合同：整份 Tavern 返回必须只出现一对受支持且同名的正文开闭标签。容器外内容被丢弃；正文内其他尖括号标签标记被过滤；缺失、未闭合、开闭名错配、重复或并列多个受支持容器会可见失败。
- 提示合同：默认示例仍使用 `<content>...</content>`；上层提示已指定 `<正文>`、`<story_scene>`、`<story_scence>`
  等标签时沿用该同名标签对，不再宣称 content 是唯一标签。
- 场景合同保持：只有当前幕登记了 `requiredSceneSequence` 才输出并校验场景完成合同。
- 立绘合同保持：第二幕 `washroom + lala` 唯一使用 `washroom-swimsuit`；其余第二幕场景中的菈菈唯一使用
  `arrival-default`，错误组合整体拒绝而不静默替换。
- 授权来源：用户指出项目已有 `<正文>`、`<story_scene>` 等正文标签，并明确补充 `<story_scence>`。
- 明确未触碰：世界书剧情与选择、AP/日期/好感/事件结算、fallback 正文、角色素材和坐标、GAL 布局、宿主消息、shujuku/ACU、插件和数据库。

## 支持的正文标签

`story_scene`、`story_scence`、`gal_scene`、`story`、`scene`、`正文`、`剧情`、`narrative`、`dialogue`、`script`、`content`、`context`、`body`、`text`、`final`、`answer`、`output`、`response`。

## 改动文件

- `GalMainStory/portraitRules.ts`
- `GalMainStory/storyPresentation.ts`
- `GalMainStory/storyTextExtraction.ts`
- `services/storyGenerationPrompt.ts`
- `services/tavernStoryGeneration.ts`
- `verify-story-generation.cjs`
- `MODULES.md`
- `ALDENT_STATUS.md`
- `references/aldent-human-review-form.md`
- `references/archive/aldent-review-invitation-superseded-panc-contract-2026-07-21.md`
- `references/archive/aldent-human-review-form-superseded-panc-contract-2026-07-21.md`
- `references/archive/aldent-review-invitation-superseded-content-tree-parser-2026-07-21.md`
- `references/archive/aldent-human-review-form-superseded-content-tree-parser-2026-07-21.md`
- `references/archive/aldent-review-invitation-superseded-single-content-wrapper-2026-07-21.md`
- `references/archive/aldent-human-review-form-superseded-single-content-wrapper-2026-07-21.md`

## 验证证据

| Check                              | Status  | Evidence                                                                                                                                          |
| ---------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| User contract counterexample       | passed  | 用户指出正文容器是既有标签集合，不是 content 单标签，并明确补充 `<正文>` 与 `<story_scence>`                                                      |
| Frozen before-failure reproduction | passed  | `<正文>`、`<story_scene>`、`<story_scence>` 三个完整正例在修复前均稳定抛出“未包含 `<content>`”                                                    |
| Story generation contract          | passed  | `node src/webgame-ui/verify-story-generation.cjs`；全部 18 个登记标签、畸形外层标签、标签过滤、缺失/截断/错配/重复/并列反例及 portrait 正反例通过 |
| Full subtree TypeScript            | passed  | `pnpm exec tsc --noEmit -p src/webgame-ui/tsconfig.json`                                                                                          |
| Changed-file ESLint                | passed  | 本轮 TS/CJS 文件无 error                                                                                                                          |
| Changed-file Prettier              | passed  | 本轮代码、`MODULES.md`、状态和审查表通过 `prettier --check`                                                                                       |
| Production build                   | passed  | `pnpm build`；fresh `dist/webgame-ui/index.html` 为 531402 bytes；仅有既有 asset-size 建议                                                        |
| Exact inline artifact verification | passed  | legacy entity/currency/replacement/syntax error 全为 0；检查到 1 个 inline script                                                                 |
| Artifact protocol scan             | passed  | fresh artifact 包含 content、`<正文>`、story_scene、story_scence 与受支持容器错误提示，不包含 panc                                                |
| Artifact identity                  | passed  | SHA-256 `B28E9967E2DE66FC873C1552B3626B6AC8D9EC959819DC84BA7ACE56C5502B47`                                                                        |
| Corrected real Tavern generation   | not run | 尚未用本次正文标签集合 artifact 重新生成第二幕                                                                                                    |
| Host/plugin/database routes        | not run | 本轮禁止触发；hidden floors、MESSAGE_SENT、shujuku/ACU 和数据库仍未接通                                                                           |
| Human acceptance                   | not run | 等待用户用本次 artifact 重新验收                                                                                                                  |

## 人工复现

1. 在真实 Tavern 中用最终 artifact 重新生成第二幕，查看原始 User prompt 与 Assistant：默认可使用
   `<content>...</content>`；上层指定其他登记标签时，应只保留一对同名标签；不得出现 panc。
2. 分别用唯一的 `<content>`、`<正文>`、`<story_scene>`、`<story_scence>` 包裹同一段合法 GAL 正文，四种都应进入 GAL。
3. 即使正文容器前存在不匹配的
   `</konatan_planning~>`，只要唯一受支持标签对完整，正文仍应进入 GAL；容器外规划文字不得进入。
4. 缺失、未闭合、开闭名错配、重复或并列多个受支持正文容器应显示 `parse_error`；正文内其他尖括号标签标记应被过滤。
5. 浴室中的菈菈只能显示 `washroom-swimsuit`；`home/bedroom/rooftop/nightStreet/park/schoolRoad` 中显示菈菈时只能使用
   `arrival-default`，错误字段应整体拒绝，不得静默替换。
6. 确认第二幕不少于 30 行，首次场景顺序为
   `washroom -> home -> bedroom -> rooftop -> nightStreet -> park -> schoolRoad`，并人工确认世界书最后情节点完整演完后结束。

预期看到：正文容器可以使用登记集合中的任一标签，但每次只能有一对同名标签；畸形的容器外规划标签不能遮住正文，也不会进入 GAL。

## 当前接通状态

- [x] 不涉及新的接通
- [ ] 只是界面草图
- [ ] 只是本地状态演示
- [ ] 已接入真实状态读取
- [ ] 已接入真实状态写入
- [ ] 已可作为正式流程使用

分链路记录：

- 生成链：既有 `TavernHelper.generate()` 与一次性 World Info hook 未改；本次正文标签集合尚未在真实 Tavern 复验。
- 宿主消息链：仍未创建 hidden user/assistant floors。
- 插件/数据库链：仍未接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- UI 镜像链：既有本地 messagesave/file bridge 未改，不冒充宿主聊天权威。
- 本轮允许触发：本地合同检查、TypeScript、lint、格式检查、生产构建和 exact inline checker。
- 本轮必须隔离：世界书保存写入、宿主消息和插件/数据库副作用。

## 已知风险与缺失证据

- 本次正文标签集合尚未在真实 Tavern 重新生成；本地回归和 artifact 扫描不能替代这次复验。
- 标签过滤只移除其他尖括号标签标记；遗留的非 GAL 文本仍由严格逐行协议拒绝，不会作为正文静默放行。
- 行数和场景顺序不能机器证明所有世界书语义情节点已覆盖，最终内容仍需人工阅读。
- 最终 inline checker 从 `HEAD:verify-inline-bundle.mjs` 通过管道执行；工作区中该脚本的既有删除没有恢复。
- `pnpm build` 仍有现存的 inline HTML 体积建议，本轮没有扩展到 bundle 拆分。

## 已作废证据

- panc 合同已由用户纠正和既有 content 文档推翻。
- content 标签树提取及其 SHA-256 `D7E961...FE1BD` 已由完整 content 误报截图推翻。
- 单 content 直接提取及其 SHA-256 `710BFA...A15E6` 已由本次既有标签集合反例推翻。旧邀请及表单只保留在
  `references/archive/`，不再代表当前行为。

## 需要人的决定

请填写 `references/aldent-human-review-form.md`，选择接受、限定下一轮、拒绝或证据不足。

本邀请发出后冻结修改；没有完成人工审查，不开启下一实现轮。
