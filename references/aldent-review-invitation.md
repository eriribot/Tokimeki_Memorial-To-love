# 艾尔登特审查邀请

## 本轮结果

- 生成器现在会只读 `出包王女` 世界书中关闭的 `剧情第一集`，按 `UID 2 / 名称` 选择并校验完整正文。
- 每幕请求只注入一份带精确 stage ID 的 `<selected_story_lore>`；不把正文复制进 `user_input`，不发送 `position:none` 或
  `should_scan:true`。
- 条目缺失、重复、误开启或正文不完整时，会在 AI 调用前显示错误；条目误开启路径已证明 `generate` 为 0 次。
- 本地 TXT 只是恢复源，没有进入 bundle；真实世界书内容和开关均未由代码修改。

## 改动文件

- `data/storyLore.ts`
- `GalMainStory/lalaArrival.ts`
- `services/storyGenerationPrompt.ts`
- `services/tavernStoryGeneration.ts`
- `output/verify-story-mvp.mjs`
- `output/story-mvp-e2e/`
- `AGENTS.md`
- `MODULES.md`
- `AI生文与GAL前端整合方案.md`
- `ALDENT_STATUS.md`
- `references/aldent-review-invitation.md`

## 验证证据

| Check                              | Status  | Evidence                                                                   |
| ---------------------------------- | ------- | -------------------------------------------------------------------------- |
| Targeted format/lint/script syntax | passed  | 本轮文件通过 Prettier、ESLint 和 `node --check`                            |
| Subtree TypeScript                 | failed  | 既有 `stores/gameStore.ts:266` 空值类型错误；本轮未修改该文件              |
| Development build                  | passed  | fresh `pnpm build:dev`                                                     |
| Exact inline safety                | passed  | 五项风险计数为 0，1 个 inline script 可解析                                |
| Exact artifact                     | passed  | SHA-256 `58BAF5DA0DE816DA312F4262827FC9BDF19572BE62AEE841DFEDD9CC898AE191` |
| Story browser paths                | passed  | 正常两幕、缺完成标记、条目误开启、API 失败/fallback                        |
| Selected lore routing              | passed  | 每幕 1 次关闭条目读取、1 份 stage lore、0 native scan                      |
| Enabled-entry guard                | passed  | 可见错误、AP=1、`generate=0`                                               |
| Console/page/request failures      | passed  | 全部为 0                                                                   |
| Screenshot review                  | passed  | 桌面错误态、正常 GAL 和移动 fallback 无新增布局问题                        |
| Real Tavern read/generation        | not run | 等待用户加载 fresh artifact 后人工触发                                     |
| Human acceptance                   | not run | 等待 AI 原文和 GAL 截图                                                    |

## 当前接通状态

- [ ] 不涉及接通
- [ ] 只是界面草图
- [x] 只是本地状态演示
- [ ] 已接入真实状态读取
- [ ] 已接入真实状态写入
- [ ] 已可作为正式流程使用

- 生成链：`getWorldbook` 只读路径和 `generate` 调用已实现，本地 mock 已验证；真实 Tavern 未运行。
- 宿主消息链：未接通。
- 插件/数据库链：未接通。
- UI 镜像链：现有本地游戏消息镜像保持不变。

## 人工复现

1. 保持 `出包王女 / 剧情第一集` 关闭，确认 UID 2、标题和正文首尾标签不变。
2. 加载 SHA-256 对应的 fresh `dist/webgame-ui/index.html`，用新存档完成第一次有效行动。
3. 保存第一幕 AI 原文和 GAL 截图；正文应停在浴室白光，最后一行是第一幕精确完成标记。
4. 播完后完成第二次有效行动，保存第二幕 AI 原文和截图；正文应收束到次日误告白和婚约宣言。
5. 确认两幕结束后进入 4 月 8 日、AP=2，没有“条目必须保持关闭”错误，也没有重复第一集正文。

## 需要人的决定

请提交两幕 AI 原文和 GAL 截图，确认接受、限定修正或证据不足。审查邀请发出后本轮冻结；没有新的明确请求或完成的审查表，不继续修改生成、世界书或结算链。
