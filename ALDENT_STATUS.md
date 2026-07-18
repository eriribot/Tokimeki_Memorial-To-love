# 艾尔登特当前状态

```yaml
status: waiting_for_review
current_loop: merge-local-scenes-with-remote-story-display
authorized_by: user_merge_conflict_report_2026-07-18
authorized_scope:
  - resolve the pull conflict between local fac9bdc and remote d120b26
  - preserve local backgrounds, layered portraits, and no-required-sentinel behavior
  - preserve the remote story-display fix, one-shot World Info scan route, and saved-message chat history
  - accept the remote cleanup of tracked output artifacts and obsolete test scripts
  - repair active documentation and validate the merged inline artifact
forbidden_scope:
  - force-push, discard either commit, or restore the removed output test suite
  - change AP, affection, dates, event settlement, saves, backgrounds, portrait coordinates, or blink timing
  - change saved Tavern worldbook state, create host floors, or connect shujuku/plugins/databases
connection_state: merged_local_production_build_and_static_browser_start_verified
overall_connection_label: 只是本地状态演示
human_review: pending_real_tavern_world_info_and_generation_acceptance
prior_pending_reviews:
  - ep01-act1-background-sequence
  - haruna-cross-page-blink-continuity
next_loop: frozen_after_review_invitation_until_new_explicit_feedback_or_completed_review_form
```

## 本轮结果

- Git 分叉为本地 `fac9bdc（增加新场景）` 与远端 `d120b26（修复正文显示）`，共同基线为 `e99519a`。
- `services/storyGenerationPrompt.ts` 和 `services/tavernStoryGeneration.ts`
  采用远端正文显示链作为骨架；它同样不要求模型输出完成标记，并会清理旧回复中残留的历史标记。
- 本地 `school -> night -> washroomDoor -> washroom` 背景、共享菈菈/春菜分层立绘和眨眼修复均保留并通过编译。
- 当前幕用明确开场/结尾约束正文。代码按当前幕读取关闭的剧情/人物条目，只在下一次 `WORLDINFO_ENTRIES_LOADED`
  扫描的内存副本中临时启用；保存的世界书开关不应改变。
- 连续性改为从已保存的主线 user/assistant 消息中取最后 6 条，传给 `overrides.chat_history.prompts`。
- 明确 `@姓名牌` 的临时老师、学生或路人可以进入 GAL；已登记角色仍会归一化。
- 远端删除的 `output/verify-story-mvp.mjs` 及旧截图/测试产物保持删除，没有为解决冲突恢复它们。

## 验证证据

| Check                           | Status  | Evidence                                                                                  |
| ------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| Three-way conflict resolution   | passed  | 三个 unmerged path 已解析；源码无 conflict marker                                         |
| Targeted Prettier / ESLint      | passed  | 合并相关 TS/TSX 文件 ESLint 0 errors                                                      |
| Development build               | passed  | fresh `pnpm build:dev`                                                                    |
| Production build                | passed  | fresh `pnpm build`；只有既有 462 KiB 体积警告                                             |
| Static production browser start | passed  | 地图、角色、AP/日期状态正常；仅有脱离 Tavern 时缺文件桥的预期错误                         |
| Exact inline safety             | passed  | 五项 replacement/字符风险与语法错误均为 0，`scriptCount = 1`                              |
| Exact artifact                  | passed  | 473,451 bytes；SHA-256 `A04DE67443EEA4E059F0E2070E1C1C5FD420D245A7A3AF46E38A212E189FC196` |
| Real one-shot World Info scan   | not run | 静态浏览器没有真实 `WORLDINFO_ENTRIES_LOADED` 和 Tavern 世界书                            |
| Real generation / GAL rendering | not run | 尚未在用户实际 SillyTavern/Tavern Helper 中运行合并包                                     |
| Human acceptance                | not run | 等待确认正文、背景、立绘与世界书扫描合并后同时正常                                        |

## 当前接通状态

- 生成链：真实 `TavernHelper.generate` 路径存在，本轮只证明编译和静态启动，未证明真实返回。
- World Info 链：源码注册一次性原生扫描钩子；真实命中、隔离和停止尚待 Tavern 日志。
- 宿主消息链：没有创建 hidden user/assistant 楼层；chat history 来自游戏保存消息。
- 插件/数据库链：没有接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- UI 镜像链：游戏自有 messagesave/file bridge 保持不变，不是宿主聊天权威。

## 人工复现

1. 加载上述 SHA-256 对应的 fresh `dist/webgame-ui/index.html`，确认 `剧情第一集` 和菈菈人物条目保持关闭。
2. 第一次有效行动触发第一幕；确认仅剧情条目的本次扫描副本被启用，正文无需 `STAGE_COMPLETE` 即进入 GAL。
3. 播完第一幕后确认仍为 4 月 7 日、AP=1，背景依次进入学校、夜景、浴室门前和浴室内部。
4. 第二次有效行动触发第二幕；确认本次扫描包含剧情和菈菈人物条目，并带有已保存前置消息连续性。
5. 生成结束后重新查看世界书，两个保存条目仍保持关闭；普通后续扫描不应继续强制命中这两个副本。
6. 播完第二幕后确认进入 4 月 8 日、AP=2，菈菈/春菜立绘和眨眼没有合并回归。

## 已知风险

- 一次性 World Info 钩子依赖真实 Tavern 的 `eventOnce`、`tavern_events.WORLDINFO_ENTRIES_LOADED`
  和扫描时序；本地构建无法代替真实证据。
- `stripLegacyCompletionSentinels()` 只兼容清理旧模型输出，不重新要求标记。
- 远端清理了仓库内浏览器回归脚本，因此本轮没有自动证明完整两幕；不能把静态启动截图写成真实生成验收。
- 背景顺序和春菜眨眼仍是前序待验收项，本次冲突解决不自动接受它们。

本状态更新后只剩审查邀请；邀请发出后冻结修改。
