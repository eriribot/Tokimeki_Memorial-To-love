# 艾尔登特当前状态

```yaml
status: waiting_for_review
current_loop: story-progression-character-availability-and-raw-reader
authorized_by: user_code_only_and_human_testing_request_2026-07-19
authorized_scope:
  - recover the pending first-episode act from AP and accepted-act progress after save restore or resume
  - gate bundled character presence by completed main-story events without deleting character cards
  - replace the flat AI raw-message pile with act, version, and page reading slots
  - update current module and human-review records
forbidden_scope:
  - create or run mjs tests, validation scripts, builds, lint, browser automation, or inline-bundle verification
  - change prompts, generation protocol, worldbook selection or saved worldbook state
  - create host messages or connect MESSAGE_SENT, shujuku, ACU, plugins, or databases
  - claim runtime, Tavern, or human acceptance from source inspection
connection_state: local_code_implemented_unverified
overall_connection_label: 只是本地代码实现，尚未人工验收
human_review: pending_story_progression_character_visibility_and_raw_reader_acceptance
prior_pending_reviews:
  - merge-local-scenes-with-remote-story-display
  - ep01-act1-background-sequence
  - haruna-cross-page-blink-continuity
next_loop: frozen_after_review_invitation_until_new_explicit_feedback_or_completed_review_form
```

## 本轮结果

- 主线当前幕从已采用正文进度恢复；非活动事件存档不再无条件把 `mainStoryActIndex` 清零。
- 恢复或继续游戏时会幂等检查 4 月 7 日的 AP 阈值，补回已经到点但尚未进入的幕；普通正确的
  `AP=1 / actIndex=1` 状态仍等待下一次行动触发第二幕。
- 角色卡继续保存在 Card store，出现位置由独立规则同步：梨子和春菜初始可见，菈菈完成第一集后可见，梦梦、唯和小暗当前锁定；未知导入角色默认可见。
- AI 原文通过既有楼层 `messageIds` 关联 Tavern Assistant 消息，按幕和楼层版本组织，并对原字符串做只读分页。已读目录中的每个楼层可直接打开其原文版本。
- 没有修改提示词、世界书、Tavern 宿主消息、生成协议、shujuku、插件或数据库链。

## 验证证据

| Check                                | Status  | Evidence                              |
| ------------------------------------ | ------- | ------------------------------------- |
| Source formatting / lint             | not run | 用户要求全部检验交给人工              |
| TypeScript / development build       | not run | 未运行 `pnpm build:dev`               |
| Production build                     | not run | 未运行 `pnpm build`                   |
| Browser / Playwright interaction     | not run | 未启动页面或浏览器自动化              |
| Save/load AP progression             | not run | 等待人工在实际存档流程中验收          |
| Character visibility                 | not run | 等待人工检查地图、场景、档案和文本态  |
| Raw reader act/version/page behavior | not run | 等待人工检查具体楼层选择与分页        |
| Raw message immutability             | not run | 等待人工比较保存消息与重新生成上下文  |
| Inline artifact verification         | not run | 未运行 `verify-inline-bundle.mjs`     |
| Real Tavern generation               | not run | 未调用真实 Tavern Helper 生成         |
| Human acceptance                     | not run | 等待用户审查                          |

## 当前接通状态

- 本轮只完成本地源码实现，未形成新的构建或 inline artifact 证据。
- 生成链、一次性 World Info 扫描链和游戏 messagesave 镜像保持原实现，本轮未验证也未改动其协议。
- 宿主消息链仍未创建 hidden user/assistant 楼层。
- 插件/数据库链仍未接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- 原文阅读器只读取游戏保存的 Tavern Assistant 消息，不新增消息，不修改 prompt history，也不代表宿主聊天权威。

## 人工复现

1. 开始新游戏，确认地图、地点提示、附近角色与角色档案中只有夕崎梨子和西连寺春菜，菈菈、梦梦、古手川唯和小暗都不出现。
2. 完成 4 月 7 日第一集两幕后，确认菈菈开始出现在校园；梦梦、古手川唯和小暗仍保持隐藏。
3. 第一幕完成后在 `AP=1`、日期仍为 4 月 7 日时保存并读取，确认已读第一幕和当前幕进度保留，且不会重复触发第一幕。
4. 读取上述存档后执行第二次有效行动，确认 AP 到 0 时进入第二幕 AI 正文，而不是直接跨到 4 月 8 日。
5. 打开已读剧情，分别从总入口和具体楼层的 `AI 原文` 按钮进入，确认可以切换幕、生成版本和单页，并且具体楼层按钮会预选对应版本。
6. 检查长原文一次只显示一页，上一页/下一页和页数正确；把各页按顺序拼接后应与原 Assistant 消息完全一致。
7. 关闭阅读器并重新生成候选楼层，确认已保存原文、采用楼层以及用于连续性的历史消息没有因阅读、切页或切版本发生变化。

## 已知风险

- 本轮按用户要求没有运行格式化、编译、浏览器或 inline artifact 检查，源码能否构建和实际布局均需人工确认。
- 角色出场规则当前只覆盖已有第一集进度；梦梦、唯和小暗在未来剧情事件落地前保持锁定。
- 恢复补触发依赖存档中的日期、AP、已采用幕和完成事件记录彼此一致；异常或手工修改过的存档仍需单独判断。
- 原文分页按字符上限优先寻找段落或句末断点，只影响阅读视图，不是 GAL 正文解析或消息迁移。
- 背景顺序、春菜跨页眨眼以及前次合并后的真实 Tavern 扫描仍是前序待验收项，本轮不自动接受它们。

本状态更新后只剩审查邀请；邀请发出后冻结修改。
