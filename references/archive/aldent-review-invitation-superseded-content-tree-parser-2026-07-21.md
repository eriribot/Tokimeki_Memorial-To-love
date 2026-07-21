# 艾尔登特审查邀请

## 本轮结果

- 用户可见结果：错误的 `<panc>` 协议已撤销。第二幕 prompt 与 Tavern 候选门禁恢复为既有
  `<content>...</content>`；完整的多个 content 段可按原顺序合并。
- 授权来源：用户提供真实运行截图，并明确指出正文容器应为 `content`，不是 `panc`。
- 权威依据：`AI生文与GAL前端整合方案.md` 第 54-58 行的既有标准示例，以及用户最新纠正。
- 本轮范围：纠正正文容器与抽取预言机，保留当前幕条件化完成合同和严格场景立绘绑定，重新验证最终 inline artifact。
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

## 验证证据

| Check                              | Status  | Evidence                                                                                                       |
| ---------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| User runtime counterexample        | passed  | 截图证明错误 panc 已进入真实流程，用户明确指定 content                                                         |
| Contract/oracle correction         | passed  | 既有方案文档与用户纠正独立证明上一轮 panc 实现和测试预言机错误                                                 |
| Story generation contract          | passed  | `node src/webgame-ui/verify-story-generation.cjs`；content prompt、单/多段抽取、失败反例和 portrait 正反例通过 |
| Full subtree TypeScript            | passed  | `pnpm exec tsc --noEmit -p src/webgame-ui/tsconfig.json`                                                       |
| Changed-file ESLint                | passed  | 本轮 TS/CJS 文件无 error                                                                                       |
| Changed-file Prettier              | passed  | 本轮代码、`MODULES.md`、状态和审查表通过 `prettier --check`                                                    |
| Production build                   | passed  | `pnpm build`；fresh `dist/webgame-ui/index.html` 为 530834 bytes；仅有既有 asset-size 建议                     |
| Exact inline artifact verification | passed  | legacy entity/currency/replacement/syntax error 全为 0；检查到 1 个 inline script                              |
| Artifact protocol scan             | passed  | fresh artifact 包含 content 与场景立绘规则，不包含 panc                                                        |
| Artifact identity                  | passed  | SHA-256 `D7E961FB99BB506F9E44021BA27214216F8B3AF6B326C294F8DBAEB5C63FE1BD`                                     |
| Corrected real Tavern generation   | not run | 尚未用修正后的 artifact 重新生成第二幕                                                                         |
| Host/plugin/database routes        | not run | 本轮禁止触发；hidden floors、MESSAGE_SENT、shujuku/ACU 和数据库仍未接通                                        |
| Human acceptance                   | not run | 等待用户用修正后的 content artifact 重新验收                                                                   |

## 人工复现

1. 在真实 Tavern 中用最终 artifact 重新生成第二幕，查看保存的 User prompt 与原始 Assistant：使用
   `<content>...</content>`，不得再出现 panc。
2. 一个或多个完整 content 段应按原始顺序进入 GAL；缺失 content 或任一 content 未闭合时应显示 `parse_error`。
3. 合法示例必须是 `scene=washroom;focus=lala;portrait=washroom-swimsuit`。
4. 浴室中的菈菈只能显示 `washroom-swimsuit`；`home/bedroom/rooftop/nightStreet/park/schoolRoad` 中显示菈菈时只能使用
   `arrival-default`，错误字段应整体拒绝，不得静默替换。
5. 确认第二幕不少于 30 行，首次场景顺序为
   `washroom -> home -> bedroom -> rooftop -> nightStreet -> park -> schoolRoad`，并人工确认世界书最后情节点完整演完后结束。

预期看到：正文协议恢复为项目既有的 content 容器；prompt、Assistant 原文、本地接受结果和 GAL 画面使用同一套场景立绘规则。

## 当前接通状态

- [x] 不涉及新的接通
- [ ] 只是界面草图
- [ ] 只是本地状态演示
- [ ] 已接入真实状态读取
- [ ] 已接入真实状态写入
- [ ] 已可作为正式流程使用

分链路记录：

- 生成链：既有 `TavernHelper.generate()` 与一次性 World Info hook 未改；修正后的真实生成尚未运行。
- 宿主消息链：仍未创建 hidden user/assistant floors。
- 插件/数据库链：仍未接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- UI 镜像链：既有本地 messagesave/file bridge 未改，不冒充宿主聊天权威。
- 本轮允许触发：本地合同检查、TypeScript、lint、格式检查、生产构建和 exact inline checker。
- 本轮必须隔离：世界书保存写入、宿主消息和插件/数据库副作用。

## 已知风险与缺失证据

- 修正后的真实 Tavern 生成尚未运行，本地检查和 artifact 扫描不能替代这次复验。
- 行数和场景顺序不能机器证明所有世界书语义情节点已覆盖，最终内容仍需人工阅读。
- 最终 inline checker 从 `HEAD:verify-inline-bundle.mjs` 通过管道执行；工作区中该脚本的既有删除没有恢复。
- `pnpm build` 仍有现存的 inline HTML 体积建议，本轮没有扩展到 bundle 拆分。

## 已作废证据

- 上一轮 `ep01-panc-and-scene-portrait-contract` 的 panc prompt、panc 抽取测试和 artifact 哈希已由用户反例推翻，仅保留在
  `references/archive/`，不再代表当前行为。

## 需要人的决定

请填写 `references/aldent-human-review-form.md`，选择接受、限定下一轮、拒绝或证据不足。

本邀请发出后冻结修改；没有完成人工审查，不开启下一实现轮。
