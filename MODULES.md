# webgame-ui 模块清单

> 当前运行时权威。人工审查范围和证据见 `ALDENT_STATUS.md`；历史过程见 `progress.md`，后者不作为当前规格。

## 当前能力

- 地图支持在彩南高中与彩南町之间切换；彩南町使用独立背景和车站、商店街、公园、河堤、住宅区落点。切换区域本身不消耗 AP。
- 双地图不使用文字分段控件。彩南高中左侧显示 `map_next02.png` 前往彩南町，彩南町右侧显示 `map_next01.png`
  返回学校；角色档案入口始终位于护法对侧并共享同一垂直中心线。
- 护法完整可见图形都是点击目标，悬停/键盘焦点反馈沿 PNG 透明 Alpha 描边；不得给整张矩形图片增加毛玻璃、模糊底板、整体阴影或整体缩放。彩南高中校门地图坐标固定为
  `(0.8, 3.2)`。
- 地图浮层只针对横屏游戏框适配，并按 `game-frame` 实际尺寸响应：高度 `481-700px` 使用日历 `82px`、护法 `66px`、档案
  `40x96px`，菜单按实际宽度以 `clamp(52px, 7.5cqw, 66px)` 连续缩放；手机横屏 `<=480px` 使用日历 `52px`、护法
  `44px`、菜单 `40px`、档案 `30x72px`，护法与档案统一位于 `56%`
  高度保持镜像同轴。更大的桌面游戏框保持原规则，不建立竖屏专用布局。
- 教室/图书馆场景、玩家属性、角色卡、好感、技能、事件日志、开始菜单和存档槽。
- 行动点是时间推进权威；有效行动自动改变时段，AP 用完自动跨日，不再提供独立推进时间按钮。
- 2008-04-07 第一集由两次自由行动自动触发两幕纯文本生成，支持幕开场/结尾提示、加载/错误/保底、GAL播放和本地 messagesave 镜像。
- 主线恢复会从已采用幕数校正当前幕，并幂等补触发已经达到 AP 阈值但尚未进入的幕；第一幕结束时保存的 `AP=1 / actIndex=1`
  状态不会被旧的非活动事件存档重置为第一幕。
- 默认角色按剧情进度决定是否在校内出现：夕崎梨子与西连寺春菜初始可见，菈菈在第一集完成后可见，梦梦、古手川唯与小暗在当前剧情范围内保持锁定。导入的未知角色默认可见。
- 第一幕背景按 `school -> night -> washroomDoor -> washroom` 演出，第二幕按 `washroom -> night -> school`
  演出。AI 页使用幕内进度元数分配背景，保底页逐页显式指定 `background` ID。
- GAL 表现层用同一个分层立绘组件渲染菈菈、西连寺春菜和夕崎梨子；第一幕校内段默认显示春菜，梨子本人发言或旁白首次提到梨子时切换为梨子，剧情提供菈菈表情时仍由菈菈优先。
- 夕崎梨子是默认目标卡之一，与 User 分离，可以通过交谈发展好感。
- 已读剧情中的 AI 原文按“幕 -> 生成版本 -> 页”阅读；目录内的楼层按钮会直接打开对应版本，每次只显示一页，不再把所有 Assistant 正文堆叠在同一滚动区。

## 剧情导演目录

- 已完成：第一集拆为 `episodes/episode01/acts/act01.ts` 与
  `act02.ts`；每幕独立保存稳定 ID、AP 阈值、开场/结尾、场景时间线和保底页。
- 稳定标识保持为 event `main.lala-arrival-2008-04-07`、第一幕 `ep01.act1-falling-star`、第二幕
  `ep01.act2-bathroom`；floor/message ID 和保存形状不因目录重排改变。
- 已完成：`episode01/director.ts`
  集中 AI 页的背景、效果、菈菈表情推断，以及菈菈/春菜/梨子的出镜选择；React 组件不再内置这些剧情判断。
- 已完成：`scenes/index.ts` 统一背景 ID、资源路径和 alt；`characters/index.ts`
  统一三名角色的别名、姓名牌、可用表情与分层立绘 rig。物理 PNG 继续留在既有
  `/artsource/{backgrounds,galbox,lala,haruna,riko}` 目录，不做无收益搬迁。
- `storyRegistry.ts`
  是集目录入口，目前只登记第一集。新增第二集时应新建独立 episode/acts 目录并显式登记，不创建空占位集。
- 未完成：运行时仍是单集正文投影；第二集接入前必须让 `mainStoryActs`、存档恢复、历史目录、重新生成上下文和
  `render_game_to_text()` 按 `eventId` 分集，不能仅增加 `episode02` 数据文件。
- `lalaArrival.ts` 与 `galAssets.ts` 只保留旧 import 兼容门面；新代码分别从 `episodes/episode01`、`characters`、`scenes`
  和 `storyRegistry` 进入。

## 模块登记

| 模块                                          | 负责                                       | 权威输入                            | 输出或副作用           | 不负责             |
| --------------------------------------------- | ------------------------------------------ | ----------------------------------- | ---------------------- | ------------------ |
| `stores/gameStore.ts`                         | 行动、时段、日期、主线与生成状态           | 玩家行动意图                        | AP、事件节点、完成记录 | AI 正文措辞        |
| `stores/cardStore.ts`                         | 目标卡、位置与好感                         | 角色卡、已结算交谈                  | 角色地图状态           | 主线触发           |
| `stores/mapStore.ts`                          | 彩南高中/彩南町地图定义与地点索引          | 当前地点 ID                         | 地图背景和当前区域地点 | AP 与剧情结算      |
| `components/MapMenu.tsx`                      | 地图边缘护法与区域切换                     | 当前地图、另一地图入口              | 切换当前地点           | 消耗 AP            |
| `components/CharacterProfileModal.tsx`        | 档案入口镜像位置和角色档案弹窗             | 当前地图                            | 档案入口/弹窗状态      | 改写角色状态       |
| `data/characterAvailability.ts`               | 默认角色的出场条件                         | 角色 ID、主线完成记录               | 可见/锁定判断          | 地图位置分配       |
| `services/characterPresence.ts`               | 将剧情进度和时段同步到角色位置             | Game/Card store                     | 角色出现位置与当前目标 | 改写角色卡         |
| `components/Controls.tsx`                     | 展示并提交行动                             | Store 当前状态                      | 行动意图               | 自行推进剧情       |
| `services/storyGenerationPrompt.ts`           | 幕开场/结尾边界和 GAL 格式                 | 幕标题、开场、结尾、主要角色        | 可复用生成契约         | 具体剧情 lore      |
| `services/tavernStoryGeneration.ts`           | 当前事件适配、消息连续性和正文解析         | 幕 ID、已存消息、已选剧情资料       | `GalStoryAct`          | AP、好感、宿主楼层 |
| `GalMainStory/storyRegistry.ts`               | 已登记剧情集查询                           | `eventId`                           | 集定义或 `null`        | 自动支持多集存档   |
| `GalMainStory/episodes/episode01/index.ts`    | 第一集组装、稳定 ID、lore 选择和触发判断   | 日期、AP、当前幕                    | 第一集定义与兼容 API   | 生成调用和状态结算 |
| `GalMainStory/episodes/episode01/acts/`       | 第一集逐幕元数据、场景时间线和保底页       | 本幕剧情合同                        | 两个独立幕定义         | 跨幕状态           |
| `GalMainStory/episodes/episode01/director.ts` | 第一集背景、效果、表情和出镜决策           | 解析正文页、幕内进度                | 演出 cue               | AP、存档、世界书   |
| `GalMainStory/scenes/index.ts`                | GAL 场景 manifest                          | 背景 ID                             | 资源路径与 alt         | 幕时间线           |
| `GalMainStory/characters/index.ts`            | 角色别名、姓名牌、表情表与分层立绘 rig     | 角色 ID/说话人                      | 角色资产描述           | 剧情出镜判断       |
| `GalMainStory/storyPresentation.ts`           | 正文行、说话人和情绪解析                   | `@` 正文、玩家名                    | 规范化逻辑行           | 选择背景或角色     |
| `GalMainStory/GalMainStory.tsx`               | 加载/错误/保底、历史回放和 GAL 播放        | Store、导演 cue、场景/角色 manifest | GAL 画面、翻页意图     | 重算游戏状态       |
| `GalMainStory/storyRawArchive.ts`             | 关联幕、楼层与 Tavern Assistant 原文并分页 | 剧情档案、messagesave               | 只读原文阅读模型       | 归一化或改写正文   |
| `GalMainStory/RawStoryHistoryDialog.tsx`      | 按幕、版本和页展示 AI 原文                 | 只读原文阅读模型                    | 阅读器选择状态         | 修改消息或采用楼层 |
| `GalMainStory/galAssets.ts`                   | 共享 GAL 窗口素材与旧 import 兼容导出      | 角色/场景 manifest                  | GALBOX 路径            | 角色资产权威       |
| `GalMainStory/LayeredPortrait.tsx`            | body、mask、眼嘴图集和共享动画渲染         | rig、表情、当前发言状态             | 分层立绘画面           | 选择说话人或结算   |
| `save/snapshot.ts`                            | V1 兼容快照                                | 三个 Zustand store                  | 本地/宿主存档数据      | 生成请求           |
| `data/storyLore.ts`                           | 读取关闭条目并武装下一次原生扫描中的副本   | 稳定 UID/名称、世界书条目           | 一次性 World Info 钩子 | 修改已保存世界书   |
| `data/worldbook.ts`                           | 世界书读取、扫描对象构建和显式诊断桥       | 游戏上下文、TavernHelper            | 显式读/诊断能力        | 剧情条目选择       |

## 权威状态

- 数值、日期、事件和当前幕以 Zustand + 存档为权威。
- 第一集 event ID、两个 act ID、floor/message 形状和旧存档字段保持不变；本轮目录重排不构成第二集运行时支持。
- 当前地图不另存一份并行状态，而是由 `currentLocationId` 经 `getMapForLocation()`
  唯一推导；因此存档恢复地点后会自动恢复对应地图。跨地图按钮只把地点切到目标地图入口。
- 地图边缘控件的布局契约为：学校“街”护法在左、档案在右；彩南町“学校”护法在右、档案在左；两者中心线镜像对齐。护法的圆形预览和恶魔图形均可点击，反馈不覆盖透明矩形区域。三档横屏尺寸的最新调整等待人工重新验收，不能沿用此前被撤回的通过结论。
- 第一集剧情权威来自真实 `出包王女` 世界书中保持关闭的 UID `2` / `剧情第一集` 条目；第二幕还会选择保持关闭的 UID `1` /
  `菈菈.萨塔琳.戴比路克` 人物条目。代码按稳定 UID/名称只读验证，并仅在下一次原生 World
  Info 扫描中启用这些条目的副本；已保存条目的关闭状态不变。本地 TXT 只是恢复源，不进入 bundle。
- 当前 preset 实际激活的其他世界书可以补充人物和长期事实，但不能覆盖当前幕明确的开场/结尾边界。代码不会替缺失或损坏的世界书事实编造剧情答案。
- AI 返回的是正文候选，经本地分页和污染检查后才能进入 GAL。
- AI 原文阅读器只对保存的 Tavern
  Assistant 字符串做视图切片；所有页按顺序拼接仍是原字符串。切页、切幕和切换生成版本不修改 messagesave、提示词历史、采用楼层或重新生成上下文。
- 正文长度不是完成条件。提示词要求模型在当前阶段收束后停笔，但返回正文不需要模型输出额外的完成标记。AP、日期和当前幕由 Zustand + 存档决定；本地解析只验证可播放正文协议，不能机器证明所有世界书情节都已覆盖。
- 新生成正文的标准协议是 `@旁白：叙述` 或
  `@角色名【情绪】：台词`。协议只约束可解析格式，不覆盖当前 preset 的人物塑造、文风、叙事密度或自然篇幅；若 preset 使用
  `<content>`，渲染器只消费其中的 `@`
  正文。旧存档的常见冒号、引号、方括号、Markdown 姓名牌和拆行写法仍可归一化；新生成缺少
  `@`、包含裸引号对白或 JSON 时进入 `parse_error`。已登记角色会归一化；老师、学生、路人等明确 `@姓名牌`
  可作为临时角色。简短情绪词可自由填写，已知词会映射到立绘表情。
- 超过单页长度的对白会在分页后保留原说话人，不能把后续页静默降级成旁白。
- 第一幕 `school` 页且没有 `lalaExpression` 时显示春菜；只要正文页带有 `lalaExpression`
  就由菈菈优先。同一显示角色的眨眼周期跨页连续，不因翻页清零；口型仍按正文页重新播放，且只在当前立绘对应角色实际发言时启用。内部眼嘴坐标不随响应式断点变化。
- `lalaExpression`
  继续作为既有存档里的菈菈主立绘提示字段；春菜与梨子的运行时 cue 由第一集 director 推导。本轮不迁移正文协议或存档 schema。
- `TavernHelper.generate()` 返回值只证明生成 API 路线；当前没有创建真实聊天楼层，也没有触发 shujuku/database。
- 保底正文必须显式标记为 `fallback`，不能冒充宿主成功。

## 当前接通标签

`真实 generate API 已实现；本地 messagesave 镜像已实现；真实 hidden host floors、shujuku、宿主消息和数据库未接通。`

分链路口径：

- 生成链：按当前幕只读验证关闭的剧情/人物条目，注册一次性 `WORLDINFO_ENTRIES_LOADED`
  钩子，仅在下一次扫描中启用所选副本，随后调用 `TavernHelper.generate({ preset_name: 'in_use' })`。连续性通过
  `overrides.chat_history` 携带最多 6 条已保存主线 user/assistant 消息；生成结束后无论成功失败都停止一次性钩子。
- 宿主消息链：未创建真实 hidden user/assistant floors。
- 插件/数据库链：未接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- UI 镜像链：游戏内 messagesave/file bridge 是本地游戏协议，不冒充宿主聊天权威。
