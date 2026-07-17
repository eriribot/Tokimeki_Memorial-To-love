# 艾尔登特当前状态

```yaml
status: waiting_for_review
current_loop: disabled-worldbook-story-lore-read
authorized_by: user_go_on_2026-07-17
authorized_scope:
  - read the disabled 出包王女 / 剧情第一集 worldbook entry by stable UID/name before episode generation
  - validate the entry and inject exactly one event-scoped lore block into each act request
  - reject missing, duplicate, enabled, or malformed lore before calling generate
  - update focused tests and active documentation, rebuild, and verify the exact inline artifact
forbidden_scope:
  - modify or enable the user's live SillyTavern worldbook
  - import the local episode TXT into the runtime bundle or restore deleted character lore files
  - change AP, affection, date, event settlement, save schema, hidden host floors, plugins, or databases
connection_state: getWorldbook_read_and_generate_call_path_locally_mocked
overall_connection_label: 只是本地状态演示
human_review: pending_real_tavern_generation
next_loop: frozen_until_completed_human_review_form_or_new_explicit_request
```

## 本轮结果

- 第一集生成前调用 `TavernHelper.getWorldbook('出包王女')`，优先核对
  `UID 2 + 剧情第一集`，UID 变化时只允许唯一同名条目回退。
- 条目必须保持关闭，正文必须以 `<To LOVE-Ru TV Episode 01>` 包围并包含
  `标题:从天而降的少女`；否则在调用 AI 前进入可见错误。
- 通过校验的完整条目以一个 `<selected_story_lore>` system 块注入。块携带当前 event/stage
  ID，`should_scan:false`，不会进入 `user_input`，也不发送 `position:none` 原生扫描键。
- 第二幕仍携带已接受的第一幕连续性正文；运行时契约仍是最后一个 depth-0 system 注入。
- 本地 `data/lore-books/tolove-tv-episode-01.txt` 只是世界书恢复源，没有被 import 或打入 inline
  bundle。菈菈、梨子两份 TXT 保持原有删除状态。

## 改动范围

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

| Check                       | Status  | Evidence                                                                                                  |
| --------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| Script syntax               | passed  | `node --check src/webgame-ui/output/verify-story-mvp.mjs`                                                 |
| Targeted Prettier           | passed  | 本轮 TS/MJS/Markdown 全部符合项目格式                                                                     |
| Targeted ESLint             | passed  | `storyLore.ts`、`lalaArrival.ts`、`storyGenerationPrompt.ts`、`tavernStoryGeneration.ts`                  |
| Subtree TypeScript          | failed  | 既有 `stores/gameStore.ts:266` 的 `GalStoryAct \| null` 错误；本轮文件范围 ESLint 和实际 webpack 构建通过 |
| Development build           | passed  | fresh `pnpm build:dev`                                                                                    |
| Exact inline safety         | passed  | 五项风险计数均为 0，1 个 inline script 可解析                                                             |
| Exact artifact              | passed  | 4,481,496 bytes；SHA-256 `58BAF5DA0DE816DA312F4262827FC9BDF19572BE62AEE841DFEDD9CC898AE191`               |
| Local TXT exclusion         | passed  | 本地第一集独有正文句未出现在最终 inline HTML；bundle 只含读取/校验逻辑和标题标记                          |
| Story MVP browser flow      | passed  | 正常两幕、缺完成标记、条目误开启、API 失败/fallback 四条路径                                              |
| Lore routing assertions     | passed  | 两幕各读取一次关闭条目、各有一份精确 stage lore；无 native scan、无 user_input 正文重复                   |
| Enabled-entry guard         | passed  | 条目开启时错误可见，AP 保持 1，`generate` 调用 0 次                                                       |
| Console/page/request errors | passed  | 三项均为 0                                                                                                |
| Screenshot inspection       | passed  | 正常 GAL、关闭条目错误和移动 fallback 无新增重叠或裁切                                                    |
| Real Tavern worldbook read  | not run | 本轮没有读取或修改用户真实世界书                                                                          |
| Real Tavern generation      | not run | 等待用户加载 fresh artifact 后触发两幕                                                                    |
| Human acceptance            | not run | 自动化是证据，不是人工接受                                                                                |

## 当前接通状态

- 生成链：源码会先只读 `getWorldbook`，校验关闭条目后调用
  `TavernHelper.generate({ preset_name: 'in_use', max_chat_history: 0 })`；本地 mock 已验证参数，真实 Tavern 尚未运行。
- 宿主消息链：没有创建 hidden user/assistant 楼层。
- 插件/数据库链：没有触发 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- UI 镜像链：游戏自有 messagesave/file bridge 保持不变，不是宿主聊天权威。
- 本轮没有修改真实世界书开关、条目内容或绑定。

## 人工复现

1. 保持截图中的 `出包王女 / 剧情第一集` 为关闭状态，标题和 UID 仍为 `剧情第一集 / 2`，正文首尾标签完整。
2. 加载 fresh `dist/webgame-ui/index.html`，使用新存档开始 2008-04-07。
3. 完成第一次有效行动，确认进入“放学后的坠落光”，没有出现“条目必须保持关闭”或“正文不完整”错误。
4. 保存第一幕 AI 原文和 GAL 截图。原文最后一行应为当前第一幕完成标记，正文只完成第一幕并停在浴室白光。
5. 播完第一幕并完成第二次有效行动，保存第二幕 AI 原文和截图。正文应完成浴室登场、追逐、装置失控和次日误告白，并停在婚约宣言。
6. 确认两幕结束后日期为 4 月 8 日、AP 恢复为 2，且没有重复的第一集世界书正文。

## 已知风险

- 完成标记只能证明响应闭合，不能机器证明模型语义上覆盖了每个必要节点；真实 AI 原文仍需人工阅读。
- 每幕会注入完整第一集条目，并用精确 stage ID 和提示边界限制当前幕；模型是否遵守“不提前演出”仍需真实 preset 验收。
- 真实 Tavern 若把条目名称改掉、保留多个同名条目、开启条目或粘贴不完整正文，生成会按设计失败并显示原因。

本状态和审查邀请发出后冻结修改。
