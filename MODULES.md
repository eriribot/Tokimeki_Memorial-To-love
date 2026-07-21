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
- 教室/图书馆场景、玩家属性、角色卡、好感、事件日志、开始菜单和存档槽。
- 特技使用 127 项六分类有向无环前置图。初始没有已取得特技；根节点只是可学习。有效 AP 行动获得特技 EXP，当前学期窗口内花费 EXP 取得特技，再从已取得特技中最多选择 6 项实践并一次提交。第一次窗口为
  `2008-05-09`；旧学期不能在后来同日补交。驾照保持考试外部取得，技能效果尚未接入属性或行动结算。
- 特技面板直接渲染在 `.map-section` 内。桌面使用同框详情栏，手机竖屏使用同框底部抽屉，手机横屏使用同框右侧抽屉；背景使用
  `artsource/SkillUi/skill-menu-paper-bg.png`，所有资源路径经 `resolveAssetPath()`。
- 行动点是时间推进权威；有效行动自动改变时段，AP 用完自动跨日，不再提供独立推进时间按钮。
- 2008-04-07 第一集由两次自由行动自动触发两幕 AI 生成，世界书剧情小节是情节唯一权威；支持加载/错误/保底、GAL 播放和本地 messagesave 镜像。
- 主线恢复会从已采用幕数校正当前幕，并幂等补触发已经达到 AP 阈值但尚未进入的幕；第一幕结束时保存的 `AP=1 / actIndex=1`
  状态不会被旧的非活动事件存档重置为第一幕。
- 当前可执行的默认角色规则仍是：夕崎梨子与西连寺春菜初始可见，菈菈在第一集完成后可见，梦梦、古手川唯与小暗保持锁定，未知导入角色默认可见。菈菈这一解锁点早于第二集 4 月 11 日的转学生揭晓，是现行运行时与已校对剧情之间的已知缺口；只能在后续 EP02 登记、三幕完成状态和存档迁移一起落地时修正。
- AI 每一页必须按受控格式给出
  `scene/focus/portrait/expression/effect`；当前幕的场景表、演员表、立绘版本和各立绘实际表情集合共同约束可用值。未登记人物可以用真实姓名或明确身份说话，并显示通用文字名牌，但不能带“临时角色”标签，也不能虚构立绘。渲染器直接消费通过校验的演出 cue，不再按页数、关键词或角色特判猜演出。
- GAL 表现层用同一个分层立绘组件渲染菈菈、西连寺春菜、结城美柑和夕崎梨子。每名角色是独立模块，并可登记多套立绘；每套立绘拥有自己的 body、mask、眼嘴资源和表情集合。以后新增萨斯丁、猿山、校长等角色时新增角色模块并在需要的幕登记，不修改通用类型。
- 夕崎梨子是默认目标卡之一，与 User 分离，可以通过交谈发展好感。
- 已读剧情中的 AI 原文按“幕 -> 生成版本 -> 页”阅读；目录内的楼层按钮会直接打开对应版本，每次只显示一页，不再把所有 Assistant 正文堆叠在同一滚动区。
- 重新生成会从当前幕开头产生一个新候选，只继承前面各幕当前采用楼层；当前幕旧候选不会作为续写历史。每个候选楼层可以删除，删除当前采用版时自动回退到剩余的最新可播放版本。

## 剧情编辑目录

- 第一集拆为 `episodes/episode01/acts/act01.ts` 与
  `act02.ts`。每幕只保存稳定 ID、AP 阈值、世界书小节名、人物 lore 选择、可用场景、演员/立绘表和保底页；不重复保存剧情 opening/ending。
- 稳定标识保持为 event `main.lala-arrival-2008-04-07`、第一幕 `ep01.act1-falling-star`、第二幕
  `ep01.act2-bathroom`；floor/message ID 和保存形状不因目录重排改变。
- 不存在专用
  `director.ts`。这里的“导演式编辑”指世界书、幕素材表、角色立绘模块和 AI 演出协议可以分别剪辑，而不是由一段导演代码猜剧情。
- `scenes/index.ts` 统一场景 ID、资源路径和 alt；`characters/{lala,haruna,mikan,riko}.ts`
  分别登记角色别名、姓名牌、人物 lore 与多立绘集合，`characters/index.ts` 只负责注册和查询。
- `storyRegistry.ts`
  是集目录入口，目前只登记第一集。新增第二集时应新建独立 episode/acts 目录并显式登记，不创建空占位集。
- 未完成：运行时仍是单集正文投影；第二集接入前必须让 `mainStoryActs`、存档恢复、历史目录、重新生成上下文和
  `render_game_to_text()` 按 `eventId` 分集，不能仅增加 `episode02` 数据文件。
- `data/lore-books/tolove-tv-episode-02-act01.txt`、`act02.txt`、`act03.txt`
  是第二集三幕恢复源；第二集仍未登记。`tolove-character-mikan.txt` 与 `tolove-character-haruna.txt`
  是人物条目的恢复源，不进入 bundle；当前人物模块分别按用户确认的 UID `7` 与 `6`
  读取真实 Tavern 条目。第一幕会选择美柑和春菜人物 lore，但本地 fallback 画面不能证明真实 World Info 扫描已经命中。
- 项目尚未发布，不保留 `lalaArrival.ts`、`LalaExpression`、`lalaExpression` 或旧正文格式兼容层。

## 模块登记

| 模块                                       | 负责                                          | 权威输入                            | 输出或副作用           | 不负责             |
| ------------------------------------------ | --------------------------------------------- | ----------------------------------- | ---------------------- | ------------------ |
| `stores/gameStore.ts`                      | 行动、时段、日期、主线与生成状态              | 玩家行动意图                        | AP、事件节点、完成记录 | AI 正文措辞        |
| `stores/cardStore.ts`                      | 目标卡、位置与好感                            | 角色卡、已结算交谈                  | 角色地图状态           | 主线触发           |
| `stores/mapStore.ts`                       | 彩南高中/彩南町地图定义与地点索引             | 当前地点 ID                         | 地图背景和当前区域地点 | AP 与剧情结算      |
| `components/MapMenu.tsx`                   | 地图边缘护法与区域切换                        | 当前地图、另一地图入口              | 切换当前地点           | 消耗 AP            |
| `components/CharacterProfileModal.tsx`     | 档案入口镜像位置和角色档案弹窗                | 当前地图                            | 档案入口/弹窗状态      | 改写角色状态       |
| `data/characterAvailability.ts`            | 默认角色的出场条件                            | 角色 ID、主线完成记录               | 可见/锁定判断          | 地图位置分配       |
| `services/characterPresence.ts`            | 将剧情进度和时段同步到角色位置                | Game/Card store                     | 角色出现位置与当前目标 | 改写角色卡         |
| `components/Controls.tsx`                  | 展示并提交行动                                | Store 当前状态                      | 行动意图               | 自行推进剧情       |
| `data/skills.ts`                           | 127 项特技定义与六分类                        | 公开原作资料                        | 技能静态表             | 玩家进度           |
| `skilllogic/`                              | 图校验、学期窗口、EXP、学习、实践与技能 store | 技能静态表、日期、已结算行动        | 本地技能进度           | 应用技能效果       |
| `components/SpecialSkillPanel.tsx`         | 技能树、状态详情与 map 内响应式抽屉           | `skilllogic`、当前日期              | 学习/实践提交意图      | 重算前置或结算效果 |
| `services/storyGenerationPrompt.ts`        | 世界书幕选择和受控 GAL 演出格式               | lore 小节、场景/立绘可用值          | 可复用生成契约         | 重述具体剧情       |
| `services/tavernStoryGeneration.ts`        | 生成、消息连续性和受控正文解析                | 幕定义、已存消息、世界书资料        | `GalStoryAct`          | 猜测画面与角色     |
| `GalMainStory/storyRegistry.ts`            | 已登记剧情集查询                              | `eventId`                           | 集定义或 `null`        | 自动支持多集存档   |
| `GalMainStory/episodes/episode01/index.ts` | 第一集组装、稳定 ID、lore 选择和触发判断      | 日期、AP、当前幕                    | 第一集定义             | 生成调用和状态结算 |
| `GalMainStory/episodes/episode01/acts/`    | 世界书小节、素材表、结构完成合同和保底页      | 本幕编辑合同                        | 两个独立幕定义         | 重写世界书剧情     |
| `GalMainStory/scenes/index.ts`             | GAL 场景 manifest                             | 背景 ID                             | 资源路径与 alt         | 幕时间线           |
| `GalMainStory/characters/*.ts`             | 单角色别名、人物 lore、多立绘与表情资源       | 角色素材和世界书条目                | 可注册角色模块         | 当前幕是否可用     |
| `GalMainStory/characters/index.ts`         | 角色注册、说话人匹配与立绘查询                | 独立角色模块                        | 角色/立绘查询 API      | 剧情出镜判断       |
| `GalMainStory/portraitRules.ts`            | 解析场景与角色唯一绑定的立绘                  | 当前幕场景立绘规则                  | 必选立绘 ID 或无绑定   | 选择剧情镜头       |
| `GalMainStory/storyTextExtraction.ts`      | 从模型标签输出中结构化抽取正文                | Tavern Assistant 原文               | `<content>` 可播放文本 | 校验逐行演出字段   |
| `GalMainStory/storyPresentation.ts`        | 严格解析并校验 AI 逐页演出单                  | `@` 正文、当前幕素材表与立绘绑定    | 正文与演出 cue         | 推测或改写演出字段 |
| `GalMainStory/GalMainStory.tsx`            | 加载/错误/保底、历史回放和 GAL 播放           | Store、演出 cue、场景/角色 manifest | GAL 画面、翻页意图     | 选择画面或角色     |
| `GalMainStory/StoryHistoryArchive.tsx`     | 候选重生成、采用、回放和删除                  | 各幕楼层档案                        | 版本管理意图           | 删除宿主聊天楼层   |
| `GalMainStory/storyRawArchive.ts`          | 关联幕、楼层与 Tavern Assistant 原文并分页    | 剧情档案、messagesave               | 只读原文阅读模型       | 归一化或改写正文   |
| `GalMainStory/RawStoryHistoryDialog.tsx`   | 按幕、版本和页展示 AI 原文                    | 只读原文阅读模型                    | 阅读器选择状态         | 修改消息或采用楼层 |
| `GalMainStory/galAssets.ts`                | 共享 GAL 窗口素材                             | GALBOX 文件                         | 窗口/翻页资源路径      | 角色资产           |
| `GalMainStory/LayeredPortrait.tsx`         | body、mask、眼嘴图集和共享动画渲染            | rig、表情、当前发言状态             | 分层立绘画面           | 选择说话人或结算   |
| `save/snapshot.ts`                         | V1 兼容快照                                   | Game/Player/Card/Skill store        | 本地/宿主存档数据      | 生成请求           |
| `data/storyLore.ts`                        | 读取关闭条目并武装下一次原生扫描中的副本      | 稳定 UID/名称、世界书条目           | 一次性 World Info 钩子 | 修改已保存世界书   |
| `data/worldbook.ts`                        | 世界书读取、扫描对象构建和显式诊断桥          | 游戏上下文、TavernHelper            | 显式读/诊断能力        | 剧情条目选择       |
| `data/lore-books/*.txt`                    | 剧情与人物世界书的人工恢复文本                | 已校对剧情与人物资料                | 待导入的纯文本恢复源   | 运行时扫描和状态   |

## 权威状态

- 数值、日期、事件和当前幕以 Zustand + 存档为权威。
- 特技权威状态位于
  `skilllogic/skillStore.ts`，存档只保存 EXP、学习历史和学期实践提交；节点状态与当前实践集合由图和最后一次提交派生。面板关闭会丢弃尚未提交的实践草案，但不会丢失已取得技能或已提交配置。技能效果当前只是说明文字，不能称为已作用于游戏结算。
- 第一集 event ID 和两个 act
  ID 保持不变；项目尚未发布，本轮直接替换 beat/message 正文协议，不提供旧存档或旧 AI 正文兼容。
- 当前地图不另存一份并行状态，而是由 `currentLocationId` 经 `getMapForLocation()`
  唯一推导；因此存档恢复地点后会自动恢复对应地图。跨地图按钮只把地点切到目标地图入口。
- 地图边缘控件的布局契约为：学校“街”护法在左、档案在右；彩南町“学校”护法在右、档案在左；两者中心线镜像对齐。护法的圆形预览和恶魔图形均可点击，反馈不覆盖透明矩形区域。三档横屏尺寸的最新调整等待人工重新验收，不能沿用此前被撤回的通过结论。
- 第一集剧情权威拆为真实 `出包王女` 世界书中两条保持关闭的条目：第一幕使用 UID `150` /
  `剧情第一集·第一幕`，第二幕使用 UID `151` / `剧情第一集·第二幕`。两幕都会选择保持关闭的 UID `1` /
  `菈菈.萨塔琳.戴比路克` 人物条目；第一幕还会选择 UID `6` 的西连寺春菜和 UID `7`
  的结城美柑人物条目。每次生成只扫描当前幕剧情条目及该幕登记的人物条目。代码按稳定 UID/名称只读验证，并仅在下一次原生 World
  Info 扫描中启用这些条目的副本；已保存条目的关闭状态不变。本地 TXT 只是恢复源，不进入 bundle。
- 第二集 UID `201/202/203` 当前仍只是恢复源，运行时没有选择或扫描这些剧情条目，也没有据此改变角色出场。
- 当前 preset 实际激活的其他世界书可以补充人物和长期事实，但不能覆盖剧情世界书当前小节。代码不会另写 opening/ending 或替缺失、损坏的世界书编造剧情答案。
- AI 返回的是正文候选。新生成必须恰好包含一对受支持的同名正文开闭标签；登记值为
  `story_scene/story_scence/gal_scene/story/scene/正文/剧情/narrative/dialogue/script/content/context/body/text/final/answer/output/response`。prompt 默认示例使用
  `<content>...</content>`，但上层已指定 `<正文>`、`<story_scene>` 或 `<story_scence>` 等标签时可以沿用。
  `storyTextExtraction.ts`
  直接扫描登记标签的开闭 token，不让容器外标签树决定正文是否存在；容器外内容被丢弃，正文中的其他尖括号标签标记被过滤，再经逐行演出校验、完整性检查和分页后进入 GAL。正文标签只是结构容器，不是完成哨兵；容器缺失、未闭合、开闭名不一致、重复或并列多个会进入
  `parse_error`。
- AI 原文阅读器只对保存的 Tavern
  Assistant 字符串做视图切片；所有页按顺序拼接仍是原字符串。切页、切幕和切换生成版本不修改 messagesave、提示词历史、采用楼层或重新生成上下文。
- 单看正文长度不是完成证明，也不需要模型输出完成标记。prompt 和本地解析器共同读取当前幕的 `minimumLineCount` 与
  `requiredSceneSequence`；只有当前幕登记了必经场景时才生成并检查场景完成合同。行数不足或没有按顺序走完本幕场景会进入
  `parse_error`。这仍不能机器证明所有世界书语义点都已覆盖，最终剧情内容由世界书和人工阅读判断。
- 正文容器内每个非空行的标准协议是
  `@说话人【scene=...;focus=...;portrait=...;expression=...;effect=...】：正文`。每行完整声明演出，不继承上一页。旁白、玩家、当前幕演员和世界书中的未登记实名人物都能说话；未登记人物走通用文字名牌，不能使用不存在的角色 ID 或立绘。已经有角色模块但不在当前幕 cast 中的角色不能擅自说话。场景必须属于本幕场景表；出镜角色必须属于本幕演员表；立绘和表情必须真实登记在该角色模块中。只要画面展示已登记角色就不能使用
  `focus=none`，当前幕角色本人发言却使用 `focus=none` 同样进入
  `parse_error`。字段缺失、越界、JSON 或非协议正文也会被拒绝。
- 场景专用立绘规则由 `portraitRules.ts` 同时提供给 prompt 示例和本地解析器。第二幕 `scene=washroom + focus=lala`
  唯一允许 `portrait=washroom-swimsuit`，该幕其他场景的菈菈唯一允许 `portrait=arrival-default`；模型给出错误组合时进入
  `parse_error`，解析器不得静默替换原始 portrait。
- 超过单页长度的对白会在分页后保留原说话人，不能把后续页静默降级成旁白。
- 重生成的聊天历史按 `contextFloorIds` 精确选择前面各幕当前采用楼层，不按 `actIndex <= currentActIndex`
  混入当前幕旧候选。楼层删除同时删除其游戏内消息；删除采用版会安全回退或取消采用，但不会删除尚未接通的宿主 hidden 消息。
- 渲染器只按当前页 `focusCharacterId/portraitId/expressionId`
  查询注册表并绘制；focus 不要求等于说话人，因此 AI 可以剪出反应镜头。口型只在当前出镜角色本人发言时启用；眨眼规则属于具体立绘表情资源。
- 第一集已经把 `space/school/schoolGate/home/washroom/bedroom/rooftop/nightStreet/park/schoolRoad`
  拆成独立语义场景槽位。除原有浴室外，其余第一集槽位已从素材库选择并复制对应背景；夜间遛狗路段和次晨上学路分别使用
  `nightStreet` 与 `schoolRoad`，不再共用一张图。资源映射只由 `scenes/index.ts` 管理，不进入世界书。
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
