# 艾尔登特审查邀请

## 本轮结果

- AI 回复不再需要 `[[STAGE_COMPLETE:事件:阶段]]` 末行标记。
- 提示词已删除标记要求，正文适配器已删除 suffix 检查；酒馆返回的合法 `@` 正文会直接抽取、分页并进入 GAL。
- AP、日期、当前幕和内部事件完成记录仍由 Zustand + 存档负责，没有交给模型，也没有更改结算规则。
- 空正文、错误格式、未知说话人、JSON/污染正文和世界书前置错误仍会被拦截。
- 只更新了仓库已有 `output/verify-story-mvp.mjs`，没有新增 `.mjs` 或依赖。

## 本轮改动文件

- `services/storyGenerationPrompt.ts`
- `services/tavernStoryGeneration.ts`
- `output/verify-story-mvp.mjs`
- `AGENTS.md`
- `MODULES.md`
- `AI生文与GAL前端整合方案.md`
- `ALDENT_STATUS.md`
- `references/aldent-human-review-form.md`
- `references/aldent-review-invitation.md`

## 验证证据

| Check                                 | Status  | Evidence                                                                          |
| ------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| No-sentinel runtime path              | passed  | builder、提示要求、suffix 检查和旧错误文案已删除                                  |
| Format / syntax / targeted lint       | passed  | Prettier、`node --check`、ESLint 0 errors；现有脚本有 2 个 Node import warning    |
| Development and production builds     | passed  | fresh `pnpm build:dev`、`pnpm build`；仅有既有 bundle 体积警告                    |
| No-sentinel story browser flow        | passed  | 两幕纯 `@` 返回均进入 `ready`，两个请求的 `doesNotRequestCompletionSentinel=true` |
| AP/date/internal completion authority | passed  | 第一幕结束 4 月 7 日/AP=1；第二幕结束 4 月 8 日/AP=2；内部事件记录唯一            |
| Guards and fallback                   | passed  | 世界书误开启、API 失败/fallback 均通过；console/page/request errors 均为空        |
| Screenshot review                     | passed  | production 第一幕显示正常 GAL，不再是缺标记错误页                                 |
| Final bundle old-string scan          | passed  | 最终 HTML 中旧 marker 和错误文案均为 0 命中                                       |
| Exact inline safety                   | passed  | 五项风险/语法计数均为 0，`scriptCount = 1`                                        |
| Exact artifact                        | passed  | 476,250 bytes；`0F74FE9D8B157499188FD9E99E50E7C26D787EEF3FAFC28001144ABCB207C3DF` |
| Real Tavern generation/rendering      | not run | 尚未在真实 SillyTavern/Tavern Helper 中重新生成                                   |
| Human acceptance                      | not run | 等待确认截图中的同类正文现在可直接进入 GAL                                        |

## 当前接通状态

- [ ] 不涉及接通
- [ ] 只是界面草图
- [x] 只是本地状态演示
- [ ] 已接入真实状态读取
- [ ] 已接入真实状态写入
- [ ] 已可作为正式流程使用

- 生成链：真实 API 路径未改，本轮 production mock 已验证无标记返回；真实 Tavern 未运行。
- 宿主消息链：未接通。
- 插件/数据库链：未接通。
- UI 镜像链：保持不变。

## 人工复现

1. 加载上述 SHA-256 对应的 fresh `dist/webgame-ui/index.html`，用新存档完成第一次有效行动。
2. 检查 AI 原文没有 `[[STAGE_COMPLETE:...]]`，但第一幕仍直接进入 GAL，不出现“缺少当前阶段完成标记”。
3. 播完第一幕后确认 4 月 7 日、AP=1；第二次行动生成第二幕后，播完确认 4 月 8 日、AP=2 且第一集不重触发。
4. 确认原有正文格式和世界书错误仍然可见；本轮只取消 suffix 规则，不是放弃全部解析校验。
5. 背景顺序与春菜眨眼仍是前序待验收项，本轮结果不替代它们。

## 需要人的决定

请确认真实酒馆中原截图同类的无标记 AI 正文现在能直接进入 GAL。一个格式合法但实际上被 token 截断的响应也会播放，这是移除模型自报哨兵后的明确取舍；若以后要检测真实截断，需要另行确认生成 API 是否提供可靠停止原因。

本邀请发出后冻结修改；没有新的明确反馈或完成的审查表，不继续下一实现轮。
