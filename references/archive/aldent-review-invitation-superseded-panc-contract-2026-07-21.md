# 艾尔登特审查邀请

## 本轮结果

- 用户可见结果：第二幕 prompt 不再用 `washroom + arrival-default` 作为错误示例；新候选必须有唯一闭合的
  `<panc>`；浴室与非浴室的菈菈立绘由当前幕规则唯一决定，错误组合明确失败，不再静默替换。
- 授权来源：用户明确报告 prompt 上下文冲突、缺失 `<panc>` 和立绘不稳定，并要求修复条件判断。
- 本轮范围：当前幕 prompt 合同、`<panc>` 结构化抽取、场景立绘决策与解析、针对性合同检查、当前文档和最终 inline artifact 验证。
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
- `references/archive/aldent-review-invitation-story-modules-2026-07-20.md`
- `references/archive/aldent-human-review-form-story-modules-2026-07-20.md`

## 验证证据

| Check                              | Status  | Evidence                                                                                                        |
| ---------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| Frozen failure baseline            | passed  | 修复前复现冲突示例、无 panc 要求、静默 portrait 改写和错误 `<content>` 优先级                                  |
| Story generation contract          | passed  | `node src/webgame-ui/verify-story-generation.cjs`；两幕 prompt、panc 正反例、portrait 正反例和配置守卫通过     |
| Full subtree TypeScript            | passed  | `pnpm exec tsc --noEmit -p src/webgame-ui/tsconfig.json`                                                        |
| Changed-file ESLint                | passed  | 本轮 TS/CJS 文件无 error                                                                                        |
| Changed-file Prettier              | passed  | 本轮代码和当前文档通过 `prettier --check`                                                                       |
| Production build                   | passed  | `pnpm build`；fresh `dist/webgame-ui/index.html` 为 530808 bytes；仅有既有 asset-size 建议                      |
| Exact inline artifact verification | passed  | legacy entity/currency/replacement/syntax error 全为 0；检查到 1 个 inline script                              |
| Artifact identity                  | passed  | SHA-256 `E73F48A86BC2BCDF77351B4D2EA8C2CD86D194EDCB1907A55BA939A4BDF6F958`                                      |
| Real Tavern generation             | not run | 未调用真实 preset / `TavernHelper.generate()`，不能证明模型第一次就服从 wrapper、场景与立绘合同                |
| Host/plugin/database routes        | not run | 本轮禁止触发；hidden floors、MESSAGE_SENT、shujuku/ACU 和数据库仍未接通                                         |
| Human acceptance                   | not run | 等待用户在真实 Tavern 中阅读第二幕                                                                               |

## 人工复现

1. 在真实 Tavern 中触发或重新生成第二幕，查看保存的 User prompt：合法示例必须是
   `scene=washroom;focus=lala;portrait=washroom-swimsuit`，完成合同必须列出当前幕七个必经场景。
2. 查看原始 Assistant：必须只有一个闭合的 `<panc>...</panc>`。缺失、重复或未闭合时应显示
   `parse_error`，不得进入 GAL。
3. 阅读第二幕：浴室中的菈菈只能显示 `washroom-swimsuit`；`home/bedroom/rooftop/nightStreet/park/schoolRoad`
   中显示菈菈时只能使用 `arrival-default`。
4. 对照原始 Assistant 演出字段与 GAL 立绘；错误 portrait 应整体拒绝，不能出现“原文写 A、画面被静默改成 B”。
5. 确认第二幕不少于 30 行，首次场景顺序为
   `washroom -> home -> bedroom -> rooftop -> nightStreet -> park -> schoolRoad`，并人工确认世界书最后情节点完整演完后结束。

预期看到：prompt、Assistant 原文、本地接受结果和 GAL 画面使用同一套场景立绘规则；`<panc>` 只承担正文容器职责，不承担剧情完成判定。

## 当前接通状态

- [x] 不涉及新的接通
- [ ] 只是界面草图
- [ ] 只是本地状态演示
- [ ] 已接入真实状态读取
- [ ] 已接入真实状态写入
- [ ] 已可作为正式流程使用

分链路记录：

- 生成链：既有 `TavernHelper.generate()` 与一次性 World Info hook 未改；本轮未真实运行。
- 宿主消息链：仍未创建 hidden user/assistant floors。
- 插件/数据库链：仍未接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- UI 镜像链：既有本地 messagesave/file bridge 未改，不冒充宿主聊天权威。
- 本轮允许触发：本地合同检查、TypeScript、lint、格式检查、生产构建和 exact inline checker。
- 本轮必须隔离：真实生成、世界书保存写入、宿主消息和插件/数据库副作用。

## 已知风险与缺失证据

- prompt 与本地守卫不能保证真实 preset/模型第一次就服从；没有增加自动重试，坏候选会可见失败。
- 行数和场景顺序不能机器证明所有世界书语义情节点已覆盖，最终内容仍需人工阅读。
- 最终 inline checker 从 `HEAD:verify-inline-bundle.mjs` 通过管道执行；工作区中该脚本的既有删除没有恢复。
- `pnpm build` 仍有现存的 inline HTML 体积建议，本轮没有扩展到 bundle 拆分。

## 需要人的决定

请填写 `references/aldent-human-review-form.md`，选择接受、限定下一轮、拒绝或证据不足。

本邀请发出后冻结修改；没有完成人工审查，不开启下一实现轮。
