# 艾尔登特当前状态

```yaml
status: waiting_for_review
current_loop: remove-ai-stage-completion-sentinel
authorized_by: user_explicit_remove_request_2026-07-18
authorized_scope:
  - remove the model-emitted event/stage completion sentinel from the generation prompt
  - accept parseable Tavern GAL text without a response suffix
  - preserve AP, date, current-act, and internal event-completion authority in Zustand and saves
  - update the existing story regression and active documentation without creating a new mjs test
  - validate development, production, browser flow, and the exact inline artifact
forbidden_scope:
  - weaken playable-text, speaker, worldbook, empty-response, or pollution validation
  - change AP, affection, dates, act triggers, event settlement, saves, or fallback rules
  - change story lore, backgrounds, portraits, blink timing, host floors, shujuku, plugins, or databases
connection_state: local_production_no_sentinel_story_flow_verified
overall_connection_label: 只是本地状态演示
human_review: pending_real_tavern_no_sentinel_acceptance
prior_pending_reviews:
  - ep01-act1-background-sequence
  - haruna-cross-page-blink-continuity
next_loop: frozen_after_review_invitation_until_new_explicit_feedback_or_completed_review_form
```

## 本轮结果

- 已删除 `buildStoryCompletionSentinel()`、prompt 中的末行标记要求，以及正文适配器中的 `endsWith()` /
  `stripCompletionSentinel()` 强制检查。
- `TavernHelper.generate()` 返回字符串后现在直接进入 `<content>` 抽取和 `@旁白` / `@角色【情绪】`
  解析。没有额外末行标记的合法正文可以进入 GAL。
- AP、日期、当前幕和 `completedMainStoryEventIds`
  没有改动：第一次行动仍为 4 月 7 日/AP=1/第一幕，第二次行动仍为 AP=0/第二幕，第二幕播放结束后仍进入 4 月 8 日/AP=2，并只写一条内部事件完成记录。
- 空正文、JSON、未知说话人、缺少 `@`、污染正文、世界书缺失/重复/误开启/损坏和 API 请求失败仍按原规则显示错误。
- 仓库已有 `output/verify-story-mvp.mjs` 已改为让正常 mock 返回纯 `@`
  正文，并断言两个请求都不包含完成哨兵；没有新增测试脚本。

## 本轮改动范围

- `services/storyGenerationPrompt.ts`
- `services/tavernStoryGeneration.ts`
- `output/verify-story-mvp.mjs`（仅更新现有回归）
- `AGENTS.md`
- `MODULES.md`
- `AI生文与GAL前端整合方案.md`
- `ALDENT_STATUS.md`
- `references/aldent-human-review-form.md`
- `references/aldent-review-invitation.md`
- `output/story-no-sentinel-dev/`、`output/story-no-sentinel-production/`、`output/web-game-no-sentinel/`（本地证据）

工作区中现有背景和 Haruna/Lala 立绘差异属于前序循环，本轮没有重写或回退它们。

## 验证证据

| Check                                 | Status  | Evidence                                                                                                 |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| Runtime sentinel references           | passed  | builder、prompt 参数、suffix 检查和旧错误文案已从运行源码删除                                            |
| Existing test syntax                  | passed  | `node --check output/verify-story-mvp.mjs`                                                               |
| Targeted Prettier                     | passed  | 本轮源码、现有回归和活跃文档                                                                             |
| Targeted ESLint                       | passed  | 0 errors；现有 `.mjs` 的 `node:fs` / `node:path` 规则产生 2 个既有 warning                               |
| Development build                     | passed  | fresh `pnpm build:dev`                                                                                   |
| Development no-sentinel story flow    | passed  | 两幕纯 `@` mock 均进入 `ready`；`doesNotRequestCompletionSentinel=true`                                  |
| Production no-sentinel story flow     | passed  | 正常两幕、世界书保护、请求失败/fallback 均通过；三个浏览器错误数组为空                                   |
| AP/date/internal completion authority | passed  | 第一幕结束 4 月 7 日/AP=1；第二幕结束 4 月 8 日/AP=2；内部事件记录 1 条                                  |
| Screenshot review                     | passed  | production `direct-ready.png` 显示正常第一幕 GAL，不再是缺标记错误页                                     |
| Generic web-game client               | passed  | 启动和状态截图正常；只记录静态页缺 Tavern 文件桥的既有预期错误                                           |
| Production bundle old-string scan     | passed  | `STAGE_COMPLETE`、旧错误文案和“阶段完成标记”在最终 HTML 中均为 0 命中                                    |
| Production build                      | passed  | fresh `pnpm build`；仅有既有 465 KiB bundle 体积警告                                                     |
| Exact inline safety                   | passed  | `legacyEntityPrefix/currencySign/replacementChar/replacementSpecial/syntaxErrors = 0`，`scriptCount = 1` |
| Exact artifact                        | passed  | 476,250 bytes；SHA-256 `0F74FE9D8B157499188FD9E99E50E7C26D787EEF3FAFC28001144ABCB207C3DF`                |
| Real Tavern generation/rendering      | not run | 尚未在用户实际 SillyTavern/Tavern Helper 中加载新哈希重新生成                                            |
| Human acceptance                      | not run | 等待确认截图中的同类无标记正文现在可直接进入 GAL                                                         |

## 当前接通状态

- 生成链：源码仍调用真实 `getWorldbook` 和
  `TavernHelper.generate`；本轮只在浏览器 mock 验证返回处理，真实 Tavern 未运行。
- 宿主消息链：未接通。
- 插件/数据库链：未接通。
- UI 镜像链：现有本地游戏消息镜像保持不变。

本轮没有提升真实 Tavern、插件或数据库的接通等级。

## 人工复现

1. 加载 SHA-256 对应的 fresh `dist/webgame-ui/index.html`，用新存档在 4 月 7 日完成第一次有效行动。
2. 查看 AI 原文，确认末尾不需要 `[[STAGE_COMPLETE:...]]`；合法 `@`
   正文应直接显示第一幕 GAL，不再出现“缺少当前阶段完成标记”。
3. 播完第一幕，确认仍为 4 月 7 日、AP=1，当前主线退出。
4. 完成第二次有效行动；第二幕无末行标记也应进入 GAL。播完后确认进入 4 月 8 日、AP=2，第一集不再触发。
5. 确认原有 `@` 格式、说话人和世界书错误仍可见；不要把“现在不检查末行标记”误解为“任何文本都会放行”。
6. 背景顺序和春菜眨眼仍是前序待验收项，本轮通过不能代替它们的人工结论。

## 已知风险

- 一个语法可解析但实际被 token 上限截断的正文现在也会进入 GAL。这是移除不可靠末行哨兵后的明确取舍；AP/日期只能选择和结算阶段，不能证明正文语义完整。
- 原哨兵同样不能证明世界书节点真的完成，只能证明模型输出了指定字符串。本轮保留 prompt 的事件闭环要求，真实语义质量继续由实际 Tavern 原文和人工审查判断。
- 若以后需要可靠的传输截断诊断，应优先使用生成 API 明确提供的停止原因；不应重新用模型自报字符串冒充机器证据。

本状态更新后只剩审查邀请；邀请发出后冻结修改。
