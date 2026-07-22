# AI 记忆、变量解析与自主规划调研报告

## 结论摘要

本项目不应直接复制 Generative
Agents 一类系统的“自主规划”。那类系统的规划器可以决定下一步观察、行动和反思；本项目的日期、AP、主线触发、关系结算和存档恢复必须由本地确定性状态决定。模型可以提供叙事候选、语义信号和回忆候选，但不能获得推进游戏世界的权限。

本轮采用的最小架构是：

```text
Zustand + GameSnapshot v2
  日期 / AP / 玩家属性 / 角色关系 / 主线游标 / 技能

MessageArchive v2
  已接受和解析失败的本地原文楼层

Context Projection
  当前快照投影 + 当前主线历史窗口 + 生成提示 + 世界书引用

AI / 副 API
  仅输出正文候选、语义信号或摘要候选
```

本地快照、原文归档和上下文预览先形成可检查闭环；真实 shujuku、ACU、hidden host
floors 和数据库写入留到本地合同通过后再接。

## 为什么自主规划不能直接照搬

### 1. 权威状态不同

Generative
Agents 的规划是为了让代理在环境中持续行动，计划本身可以改变环境。本项目的日期、AP、事件完成、当前幕和关系变量是游戏规则，不是模型意见。让规划器决定“今天去哪里”“是否推进一天”会绕过
`gameStore` 和严格快照恢复，导致同一输入无法重放。

### 2. 玩家意图不可被代理替代

这是玩家做选择的约会游戏，而不是代理自己生活的模拟。NPC 可以有目标和情绪，但玩家行动必须先经过选项选择和本地结算；AI 只能把已经结算的结果演成 GAL 正文。否则模型会替玩家邀约、失约、消费 AP，玩家无法解释关系变化。

### 3. 记忆里的“观察”不等于游戏事实

自主代理通常把观察流作为世界事实，再由反思生成高层记忆。本项目的候选正文可能解析失败、被玩家拒绝、被重新生成或属于未采用楼层。只有本地接受并绑定到
`floorId` 的内容才可进入连续性上下文；摘要绝不能反向写日期、AP、好感或事件状态。

### 4. 计划与异步存档存在竞态

模型请求返回前，玩家可能换档、重抽当前楼层或删除候选。自主规划没有本项目的 `saveUuid + revision + source fingerprint`
约束时，迟到结果会污染新存档。任何副 API 结果都必须绑定基准版本，过期结果直接丢弃。

### 5. 规划目标与主线合同冲突

本项目主线按照 `eventId + actId`
和日期/AP 触发，世界书条目、场景序列、立绘规则和正文协议都有本地校验。自主规划器可能为了“合理”而跳过必经场景、虚构人物或提前完成事件，这与
`storyPresentation` 和 `storyPersistence` 的确定性合同冲突。

### 6. 测试与成本不允许黑箱决策

主线和约会需要能够重放、回归、保存、读取和比较 fallback。若规划、变量写回和摘要都由模型决定，就无法区分剧情质量问题、规则问题和异步问题，也无法在没有副 API 的玩家环境中提供稳定体验。

## 成熟方案的可复用部分

| 方案              | 可以借鉴                                                              | 不直接复制                                          |
| ----------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| AI Dungeon Memory | 最近原文、自动摘要、可编辑记忆、Context Viewer                        | 不把 RPG 数值状态藏进摘要；不让摘要成为唯一上下文   |
| Generative Agents | 记忆流、近期性/重要性/相关性检索、带来源的反思                        | 不复制自主行动和自主日程；不让反思写游戏状态        |
| Inworld           | 情绪、目标、知识可见性、关系状态分层                                  | 不把所有角色状态合成一个自由文本 Memory             |
| Tokimeki 关系机制 | 友好度、心动度、伤心度和危机派生                                      | 不把单一 affection 当成所有关系；不让 AI 直接改数值 |
| islandmilfcode    | 当前轮变量解析与长期摘要分离、白名单、限幅、证据引用、取消和 fallback | 不复制多表 MemoryDB、并行权威和摘要回写变量         |

参考：

- [AI Dungeon Memory System](https://help.aidungeon.com/faq/the-memory-system)
- [AI Dungeon Context Management](https://help.aidungeon.com/how-do-i-manage-context)
- [Generative Agents](https://arxiv.org/abs/2304.03442)
- [Inworld Relation State](https://docs.inworld.ai/unreal-engine/runtime/character-reference/InworldGraphRuntimeData_RelationState/InworldGraphRuntimeData_RelationState)
- [Tokimeki relationship reverse engineering](https://gcgx.games/tokimeki/friendship.html)

## 对当前架构的映射

`save/snapshot.ts` 已是日期、AP、主线、玩家和角色状态的 schema-v2 权威；`message/protocol.ts` 已是与
`saveUuid + saveRevision`
配对的本地原文镜像。新增一套关系或记忆 store 会制造重复权威，因此上下文预览只读取现有 store 和消息镜像，不复制状态。

当前生成器原本在 `tavernStoryGeneration.ts`
内部截取最后 6 个 message 对象。此次将这个选择抽成共享投影，使 Tavern 调用和 UI 预览使用同一份
`chatHistory`。这 6 条是原文校准窗口，不被摘要替换；世界书只展示已选择的 order/name 引用，不能把本地预览描述成真实 World
Info 扫描证据。

关系系统仍需后续单独实现 `friendship / romance / hurt` 和本地结算，但不在这轮的本地记忆闭环中偷偷加入。`affection`
暂时继续作为现有 UI 字段，不能宣称 Tokimeki 变量已经接通。

## 本轮交付与边界

已实现的目标：

- 复用现有 GameSnapshot v2 和 MessageArchive v2，不引入迁移分支。
- 生成器与预览共用精确的最近消息投影。
- 数据面板展示当前本地快照、原文消息、生成提示、历史窗口和世界书引用。
- 数据面板明确标出 fallback、Tavern generate、宿主消息、shujuku/database 的不同接通状态。

没有实现的内容：

- 没有创建真实 Tavern hidden floors。
- 没有触发 `MESSAGE_SENT`、ACU、shujuku 或数据库写入。
- 没有让副 API 写入 friendship、romance、hurt、AP、日期或事件。
- 没有实现摘要生成、玩家编辑摘要或向量检索；这些要在上下文预览通过人工验收后再进入下一轮。

## 下一轮验收建议

在 4 月 8 日空挡期，从 4 月 7 日第一集结束状态打开“数据”面板，确认快照、原文和关系字段可见；有当前主线生成时，确认预览里的提示和 6 条历史消息与实际生成调用一致。随后关闭 Tavern
generate，使用 fallback 重复保存/读取，验证本地快照和原文归档仍可恢复。

人工验收通过前，预览只能标记为“本地状态演示”，不能升级为真实 shujuku/宿主集成。
