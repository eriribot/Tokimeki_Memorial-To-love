# 艾尔登特审查邀请

## 本轮结果

- 用户可见结果：截图中的 `<content>...</content>`
  本来完整存在。解析器现在直接按唯一的字面量开闭标签截取正文，不再受前面不匹配的 `</konatan_planning~>`
  或其他外层标签嵌套影响。
- 正文容器合同：Tavern 返回结果必须恰好包含一个
  `<content>...</content>`；容器外文字全部丢弃，正文中的其他尖括号标签标记会被过滤。缺失、未闭合或重复 content 会可见失败。
- 场景合同保持：只有当前幕登记了 `requiredSceneSequence` 才输出并校验场景完成合同。
- 立绘合同保持：第二幕 `washroom + lala` 唯一使用 `washroom-swimsuit`；其余第二幕场景中的菈菈唯一使用
  `arrival-default`，错误组合整体拒绝而不静默替换。
- 授权来源：用户提供真实运行截图，指出完整 content 标签对被误报缺失，并明确要求直接匹配目标开闭标签、过滤其他标签。
- 明确未触碰：世界书剧情与选择、AP/日期/好感/事件结算、fallback 正文、角色素材和坐标、GAL 布局、宿主消息、shujuku/ACU、插件和数据库。

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

## 验证证据

| Check                              | Status  | Evidence                                                                                                                          |
| ---------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| User runtime counterexamples       | passed  | 用户先纠正 panc 为 content，随后截图证明完整 content 标签对仍被旧树解析误报为缺失                                                 |
| Frozen before-failure reproduction | passed  | 截图同形的 `<thinking>... </konatan_planning~> ... <content>...</content>` 在修复前稳定抛出“未包含”                               |
| Story generation contract          | passed  | `node src/webgame-ui/verify-story-generation.cjs`；直接抽取、畸形外层标签、标签过滤、缺失/截断/重复反例及 portrait 正反例全部通过 |
| Full subtree TypeScript            | passed  | `pnpm exec tsc --noEmit -p src/webgame-ui/tsconfig.json`                                                                          |
| Changed-file ESLint                | passed  | 本轮 TS/CJS 文件无 error                                                                                                          |
| Changed-file Prettier              | passed  | 本轮代码、`MODULES.md`、状态和审查表通过 `prettier --check`                                                                       |
| Production build                   | passed  | `pnpm build`；fresh `dist/webgame-ui/index.html` 为 530919 bytes；仅有既有 asset-size 建议                                        |
| Exact inline artifact verification | passed  | legacy entity/currency/replacement/syntax error 全为 0；检查到 1 个 inline script                                                 |
| Artifact protocol scan             | passed  | fresh artifact 包含 content 与唯一容器错误提示，不包含 panc                                                                       |
| Artifact identity                  | passed  | SHA-256 `710BFA488B2849651657E82B5723A84D6C5F2E65718416629101BD50D44A15E6`                                                        |
| Corrected real Tavern generation   | not run | 尚未用本次直接标签对抽取的 artifact 重新生成第二幕                                                                                |
| Host/plugin/database routes        | not run | 本轮禁止触发；hidden floors、MESSAGE_SENT、shujuku/ACU 和数据库仍未接通                                                           |
| Human acceptance                   | not run | 等待用户用本次 artifact 重新验收                                                                                                  |

## 人工复现

1. 在真实 Tavern 中用最终 artifact 重新生成第二幕，查看原始 Assistant 输出：必须恰好包含一个
   `<content>...</content>`，不得出现 panc。
2. 复验截图同形输出：即使 content 前存在不匹配的
   `</konatan_planning~>`，唯一且完整的 content 正文仍应进入 GAL；容器外规划文字不得进入。
3. 缺失、未闭合或重复 content 应显示 `parse_error`；content 内其他尖括号标签标记应被过滤。
4. 浴室中的菈菈只能显示 `washroom-swimsuit`；`home/bedroom/rooftop/nightStreet/park/schoolRoad` 中显示菈菈时只能使用
   `arrival-default`，错误字段应整体拒绝，不得静默替换。
5. 确认第二幕不少于 30 行，首次场景顺序为
   `washroom -> home -> bedroom -> rooftop -> nightStreet -> park -> schoolRoad`，并人工确认世界书最后情节点完整演完后结束。

预期看到：正文协议始终是唯一 content 容器；畸形的容器外规划标签不能遮住正文，也不会进入 GAL。

## 当前接通状态

- [x] 不涉及新的接通
- [ ] 只是界面草图
- [ ] 只是本地状态演示
- [ ] 已接入真实状态读取
- [ ] 已接入真实状态写入
- [ ] 已可作为正式流程使用

分链路记录：

- 生成链：既有 `TavernHelper.generate()` 与一次性 World Info hook 未改；本次直接标签对抽取尚未在真实 Tavern 复验。
- 宿主消息链：仍未创建 hidden user/assistant floors。
- 插件/数据库链：仍未接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- UI 镜像链：既有本地 messagesave/file bridge 未改，不冒充宿主聊天权威。
- 本轮允许触发：本地合同检查、TypeScript、lint、格式检查、生产构建和 exact inline checker。
- 本轮必须隔离：世界书保存写入、宿主消息和插件/数据库副作用。

## 已知风险与缺失证据

- 本次直接标签对抽取尚未在真实 Tavern 重新生成；本地回归和 artifact 扫描不能替代这次复验。
- 标签过滤只移除其他尖括号标签标记；遗留的非 GAL 文本仍由严格逐行协议拒绝，不会作为正文静默放行。
- 行数和场景顺序不能机器证明所有世界书语义情节点已覆盖，最终内容仍需人工阅读。
- 最终 inline checker 从 `HEAD:verify-inline-bundle.mjs` 通过管道执行；工作区中该脚本的既有删除没有恢复。
- `pnpm build` 仍有现存的 inline HTML 体积建议，本轮没有扩展到 bundle 拆分。

## 已作废证据

- `ep01-panc-and-scene-portrait-contract` 的 panc 合同已由用户纠正和既有 content 文档推翻。
- 上一份 content 树解析邀请及 SHA-256 `D7E961...FE1BD` 已由本次完整 content 误报截图推翻；两份旧邀请及表单只保留在
  `references/archive/`，不再代表当前行为。

## 需要人的决定

请填写 `references/aldent-human-review-form.md`，选择接受、限定下一轮、拒绝或证据不足。

本邀请发出后冻结修改；没有完成人工审查，不开启下一实现轮。
