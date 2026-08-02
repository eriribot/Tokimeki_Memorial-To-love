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
- 左上日期牌保持原有底图、行动点与折页关键帧；折页只在剩余 `1 AP`
  时播放，作为“今日最后一次行动”的提示。日期牌外层使用独立实色光标响应点击，不向牌面叠加透明底、滤镜、位移或新的动画。
- 点击日期牌会在 `.map-section` 内打开 `CalendarModule/DateModule/`
  的双月日历，初始显示当前月与下月，并显示逐页年份、中文月份、中文星期、周日红字、周六蓝字和当天实色标记。当前及未来日期可点选查看底部横向信息条；主线判定的周末
  `whole-day` 日期显示红 × 与“已有重要日程，该日期暂不可安排”。展开态只用一层 `30%`
  中性暗色压低地图，不使用纯白 stage、毛玻璃或模糊；档案同款 `L_data/R_data`
  提示保留 PNG 原始 Alpha，并在组件内清除通用按钮的底色、圆角、阴影、滤镜和位移。翻页按钮跟随日历书定位在左右外缘，翻页按双页书逻辑每次前后两个月；日历不推进日期、不改 AP、不写存档。
- 原 PSP 日历资源中已经找到 `love_event1..3`、`holiday_01..20`、`birthday_player_01`、`school_01..04`、`festival` 与
  `sakura`
  等图标命名，但当前仍位于原始图集/ARK 中，尚未完成语义切片，也没有进入运行时。图标存在不代表约会或节假日功能已经接通。
- 教室/图书馆场景、玩家属性、角色卡、好感、事件日志、开始菜单和存档槽。标题页“重新开始”先进入梨子主持的新生登记：确定性开场后依次登记姓、名、生日和血型，最终确认才提交玩家资料并进入游戏；确认前不建立可自动存档的游戏会话。
- 特技使用 127 项六分类有向无环前置图。初始没有已取得特技；根节点只是可学习。有效 AP 行动获得特技 EXP，当前学期窗口内花费 EXP 取得特技，再从已取得特技中最多选择 6 项实践并一次提交。第一次窗口为
  `2008-05-09`；旧学期不能在后来同日补交。驾照保持考试外部取得，技能效果尚未接入属性或行动结算。
- 特技面板直接渲染在 `.map-section` 内。桌面使用同框详情栏，手机竖屏使用同框底部抽屉，手机横屏使用同框右侧抽屉；背景使用
  `artsource/SkillUi/skill-menu-paper-bg.png`，所有资源路径经 `resolveAssetPath()`。
- 行动点是时间推进权威；有效行动自动改变时段，AP 用完自动跨日，不再提供独立推进时间按钮。
- 2008-04-07 第一集由两次自由行动触发两幕；2008-04-09 至 04-10 第二集按 `1 AP / 0 AP / 次日 0 AP` 触发三幕；第三集在
  `2008-04-11`、`04-12`、`04-13` 每日第一次行动各触发一幕。第三集三幕都声明
  `timeCost: 'whole-day'`：触发前仍按一次有效行动原子结算，完成该幕后直接进入下一日并恢复日初 AP，不再保留当日晚间自由行动；`04-14`
  的上学路摔倒只属于第三幕尾声，不是第四幕。三集都从真实世界书读取当前幕，支持加载、错误、保底、GAL 播放和本地 messagesave 镜像。
- 主线运行态只保存
  `eventId + actId + phase + pageIndex`。恢复时按剧集模板和当前行动次数幂等检查等待中的幕；当前幕正文只从对应档案的采用楼层读取，不另存一份正文投影。
- 当前可执行的默认角色规则是：夕崎梨子与西连寺春菜初始可见，菈菈在第二集完成、以转学生身份登场后可见，梦梦、古手川唯与小暗保持锁定；角色卡只通过程序化 JSON 初始化进入运行态，当前没有用户文件/URL 导入入口。
- AI 每一页必须按受控格式给出
  `scene/focus/portrait/expression/effect`；当前幕的场景表、演员表、立绘版本和各立绘实际表情集合共同约束可用值。未登记人物可以用真实姓名或明确身份说话，并显示通用文字名牌，但不能带“临时角色”标签，也不能虚构立绘。渲染器直接消费通过校验的演出 cue，不再按页数、关键词或角色特判猜演出。
- GAL 表现层用同一个分层立绘组件渲染菈菈、西连寺春菜、结城美柑和夕崎梨子。每名角色是独立模块，并可登记多套立绘；每套立绘拥有自己的 body、mask、眼嘴资源和表情集合。以后新增萨斯丁、猿山、校长等角色时新增角色模块并在需要的幕登记，不修改通用类型。
- User 是固定主角、与结城家共同生活，承接原作男主的剧情职能；企划中不存在另一名男性梨斗。夕崎梨子是与 User 分离的青梅竹马、美柑的姐姐、信息/提醒辅助和独立可攻略角色，可以通过交谈发展好感，但不继承原作男主身份、菈菈婚约或对春菜的关系，也不能替 User 作出玩家保留的选择。
- 已读剧情中的 AI 原文按“幕 -> 生成版本 -> 页”阅读；目录内的楼层按钮会直接打开对应版本，每次只显示一页，不再把所有 Assistant 正文堆叠在同一滚动区。
- 重新生成会从当前幕开头产生一个新候选，只继承前面各幕当前采用楼层；当前幕旧候选不会作为续写历史。每个候选楼层可以删除，删除当前采用版时自动回退到剩余的最新可播放版本。
- 地图菜单的“辞典”入口打开同框本地辞典。`data/lore-books/dictionary/entries.json` 保存从官方 `TextAsset/ToLoveArg` 的
  `Dictionary`
  表机械提取的 103 条中文词条；界面不显示假名，支持滚动列表、详情、前后词条、返回列表和关闭回地图。当前没有词条解锁、搜索或剧情状态写入，也没有接通标题页的
  `ToLOVE3辞典` 入口。
- 地图菜单的“数据”入口打开同框资料页，`CharacterArchivePanel` 始终绝对挂载在 `.map-section` 内，stage 以 `100% × 100%`
  覆盖现有地图框，不占浏览器全屏。授权 `bg_data1/bg_data2` 虽为 1024×1024 原图，运行时当前使用 `object-fit: fill`
  匹配地图框；页面没有灰色侧边，也不使用毛玻璃、卡片边框或面板阴影。主角页不显示当前位置，固定标题为“主角”，生日、身高、体重、血型四行当前固定显示“未登记”，另有体力、压力和零用钱。体力与压力共用
  `stamina-track.png` 槽体，以 `heart.png` / `pressure-icon.png` 区分项目，以粉色 / 青色填充区分数值；当前运行时
  `player-status` 只有这 3 个授权素材，并全部经 `resolveAssetPath()`。`bg_data1.png` 始终是唯一完整底图，官方
  `x=508–575` 的锥形粉色页边、白书沟和细内线不被覆盖；新增的官方空白纸 `bg_ht01.png`
  只局部羽化覆盖左上原烘焙字段（约源坐标 `x=30–270 / y=176–410`），因此中心没有第二层书脊或 CSS 拼接。
- 主角六轴 SVG 雷达显示“文系 / 理系 / 艺术 / 运动 / 容姿 / 根性”，在现有 `PlayerState` 下依次映射为
  `intelligence / intelligence / art / athletics / charm / athletics`。原始成长值保持
  `0–999`，并直接显示在轴名旁；雷达只绘制单色五层同心环、六条轴线和一个当前阶段多边形，不再绘制 Persona 风格彩色扇区、菱形节点或中心
  `MAX`
  徽章。阶段按普通大学进路线阈值派生：`0–159=1`、`160–199=2`、`200–239=3`、`240–259=4`、`260+=5`；默认六维原始值均为
  `30`，因此从阶段 1 开始。`stores/playerStore.ts` 持有
  `TOKIMEKI_ATTRIBUTE_MAX=999`、`TOKIMEKI_UNIVERSITY_STAGE_THRESHOLDS=[160,200,240,260]` 和
  `resolveTokimekiAttributeStage()`；体力和压力仍是 `PLAYER_RESOURCE_MAX=100`。`render_game_to_text()` 同时暴露精确
  `radar` 与派生 `radarStages`。该展示不扩展能力数值字段；玩家登记资料由独立 `PlayerProfile` 进入 `PlayerState`
  与 GameSnapshot schema v3。先前彩色五级雷达和“理系压力表”候选均已撤销。
- 主角区不挂载人物图片节点、不读取 `avatar`、不使用梨斗图片资源。角色页保留官方 `01-11`
  槽位，并以第 12-18 槽扩充梨子、提亚悠、御门凉子、籾冈里纱、天条院沙姬、小静与雾崎恭子；每页最多显示 12 槽，显示
  `icon_dataNN[a/b].png` 与 `cursor_dataNN.png`，解锁沿用
  `characterAvailability.ts`，详情中的姓名、类型、关系值、常去地点和简介来自当前
  `cardStore`。锁定槽在展示层移除角色对象，只显示 `???`，不泄漏身份。该页只读，不结算 AP、日期、好感或剧情。开发阶段由
  `SHOW_ARCHIVE_DEV_UNLOCK_CONTROL` 显示“开发解锁”按钮：开启只把槽位与详情图切换为彩色 `a`
  素材，不改角色卡、剧情条件或存档；关闭立即回到 `characterAvailability.ts`
  与角色卡共同决定的默认状态。发布前可将该常量设为 `false` 或移除对应渲染块。
- 底部独立的 `StatPanel` 已移除，完整属性展示仍集中在资料页；`Controls`
  是唯一底部操作区；“体力 / 压力”以蓝色心形 / 橙色仪表图标和固定三位宽度的精确值显示在系统标题同行，现有六维精确值位于系统组下方。体力为
  `0` 或压力达到 `100`
  时，个人行动与交谈只允许休息；休息仍正常消耗行动点并恢复资源。资料页打开时该操作区保留在布局中但 inert/灰化。用户角色卡文件/URL 导入 UI、action 和 loader 已删除；`addCardFromJSON()`
  仅保留给默认角色初始化。
- 地图菜单的“目录”入口打开本地上下文与总结审查。当前幕运行时按该幕投影的 `messageIds`
  显示“当前幕连续性窗口”；空闲时按当前跨集规范时间线显示“下一轮连续性窗口”，两者都最多保留最近 6 条完整原文。历史楼层没有持久化跨集 history 回执，因此空闲窗口明确标成按当前采用版重建，不冒充当时真实发送记录。原文默认折叠且列表与弹窗正文都可独立滚动；快照、生成提示、本幕世界书引用和全部原文仍为只读。
  `historyFloorIds` 只负责跨集生成历史，存档中的同集 `contextFloorIds`
  契约不变。该界面不代表真实宿主消息或 shujuku 扫描。
- 地图菜单“系统设定”只配置记忆用 OpenAI 兼容 API：弹层限制在地图框中央，`window_kani.png` 是完整窗口主体，原生
  `midashi_op.png` 按 255:49 比例叠在左上承载“系统设定”标题；该弹层不再混用
  `window_system.png`。一级页只显示“AI 记忆设定”，点击后才挂载输入表单；两个页面都不建立独立滚动区。用户填写的地址与酒馆“自定义（兼容 OpenAI）”一样被视为完整 API 基址，客户端直接追加
  `/models` 与 `/chat/completions`，不会擅自插入
  `/v1`。拉取模型先尝试浏览器直连；若被跨域或网络层拦截且当前处于 SillyTavern，则改用酒馆现成的只读状态接口代发，不写酒馆设置或密钥库。模型名称仍可手动输入。启用状态、地址、模型和密钥长期保存在当前浏览器；总结合同不是用户配置：固定保留最近 6 条消息，每 2 个更旧完整楼层形成 1 个小总结，每 5 条已接受小总结形成 1 个大总结，正文上限分别为 600/1200 字。自动存档运行器挂载时也会立即检查当前游戏态，因此保存配置后能复查本页最近一次配对成功的权威自动存档。
- 大小总结的 TIDD-EC 提示词、自动调度、纯文本规范化、本地候选封装和人工审查已经接通：只有主存档与 MessageArchive 同次写入成功后才排队；每次保存或显式设置刷新最多处理一个批次，不会连续清空旧档积压。最近 6 条消息（3 个完整楼层）不参与摘要，前方恰好 2 个未覆盖完整楼层才形成一个小总结，因此首次触发需要 5 个规范楼层。当前来源存在失败任务时后续自动批次暂停，失败任务不会自动循环，重试会重新校验已保存锚点、当前采用楼层和原文。每次调度先处理已经凑齐的 5 条大总结批次，再处理新的 2 楼层小总结批次；同一批大总结的来源指纹、楼层和消息必须互不重复。副 API 未启用时，手动小总结按钮保持 disabled/灰色；启用后只有运行中任务或与当前 save/source 仍匹配的失败任务阻断，过期失败记录不误锁新批次。副 API 只提供摘要正文；标题、来源指纹、来源 ID、状态、模型、时间戳及 JSON 存储外壳全部由本地代码生成，新候选的
  `facts`
  固定为空，不从普通文本伪造结构化证据。玩家可接受、编辑或拒绝候选；已拒绝候选可以从同一组冻结来源显式重新生成，但后续任务或候选出现后，旧记录不再重复生成。候选和失败任务的冻结来源默认折叠：小总结按原顺序展示 2 个楼层的 4 条本地 User/Assistant 原文及幕、楼层、Tavern/fallback 标签，大总结展示 5 条来源小总结的标题和正文；展开区自身滚动，缺失来源不会被静默过滤。请求落盘要求
  `saveUuid + exact revision + sourceFingerprint`
  仍一致；接受、编辑、重新生成和大总结复用前还会同时重验已保存来源与当前 live 采用版。jobs 和候选按 `saveUuid`
  完整保存在当前浏览器 `memory-summary-archive:v3`；加载器只接受 v3，空白活动身份会归一为 `null`
  而不删除其余合法记录，candidate/job 自身必须使用非空 `saveUuid` 与
  `revision >= 1`，来源形状无效、悬空或错配的记录会被丢弃；遗留 v1/v2 即使仍留在浏览器存储中也不会加载或迁移。新游戏会为默认自动档申请新
  `saveUuid`；普通自动存档只有在主档与原文档成对成功后才替换记忆锚点，写入失败会继续保留上一份已配对上下文；手动默认档和读档仍使用可失效、可回滚的切换。存档槽可共用 UUID，因此删除或覆盖槽位不会按 UUID 猜测清空浏览器摘要；孤立记录由当前身份和来源重验隔离。该 archive 不是 Tavern 文件侧档；接受结果尚未注入剧情生成，也不结算 AP、日期、好感、`friendship/romance/hurt`
  或约会资格。
- 地图框内已经挂载非阻塞的摘要进度条，复用 `push_0.png`～`push_3.png`
  四帧动画；真实网络等待使用不定进度，只有调用者提供可计数进度时才显示百分比。进度状态不持久化、不进入
  `gameStore`，`window.toloveMemorySummaryProgressPreview()` 和 `?toloveMemorySummaryPreview=`
  只用于本地 UI 取证，不代表副 API 或 fallback 已运行。

## 剧情编辑目录

- 第一集拆为 `episodes/episode01/acts/act01.ts` 与
  `act02.ts`。每幕只保存稳定 ID、日期/行动序号触发器、剧情世界书 order、人物 lore 选择、可用场景、演员/立绘表、生成合同和保底页；不重复保存剧情 opening/ending。
- 稳定标识保持为 event `main.lala-arrival-2008-04-07`、第一幕 `ep01.act1-falling-star`、第二幕
  `ep01.act2-bathroom`；floor/message ID 和保存形状不因目录重排改变。
- 不存在专用
  `director.ts`。这里的“导演式编辑”指世界书、幕素材表、角色立绘模块和 AI 演出协议可以分别剪辑，而不是由一段导演代码猜剧情。
- `scenes/index.ts` 统一场景 ID、资源路径和 alt；`characters/{lala,haruna,mikan,riko}.ts`
  分别登记角色别名、姓名牌、人物 lore 与多立绘集合，`characters/index.ts` 只负责注册和查询。
- `episodeTemplate.ts` 定义唯一分集接口及 `single-action / whole-day` 幕耗时合同；`episodes/index.ts`
  是注册清单，目前登记第一集、第二集和第三集。共享触发器、生成、存档、历史和渲染只按 `eventId + actId`
  查询模板，没有分集特判。复用既有角色与场景时，新增一集只需新增幕定义、该集 `index.ts`，再在注册清单增加一项。
- `data/lore-books/tolove-tv-episode-02-act01.txt`、`act02.txt`、`act03.txt`
  是第二集三幕恢复源，不进入 bundle。第二集运行时按 `order 152/153/154` 读取真实 Tavern 条目；人物条目按
  `order 100/101/102` 读取。第一幕会选择美柑和春菜人物 lore，但本地 fallback 画面不能证明真实 World Info 扫描已经命中。
- `episodes/episode03/` 保存第三集三幕，event ID 为 `main.love-triangle-user-2008-04-11`。三幕依次在
  `04-11 #1 / 04-12 #1 / 04-13 #1` 触发，读取 `order 155/156/157`，并全部使用
  `timeCost: 'whole-day'`。第二幕的邀请因果固定为美柑先邀请春菜，菈菈随后撒娇并提出去水族馆，春菜同意。第三幕中，春菜先重提 User 与菈菈很般配，再揭示自己从初中起就注意到 User 在无人要求时自发照料教室花草；春菜与 User 都把告白说到开头，随后被菈菈造成的鱼群事故打断，关系不结算。写完
  `04-13` 水族馆事件后，才以 `04-14` 上学路摔倒收尾。当前人物 lore 共同采用 User 主角、梨子青梅竹马的映射。
- 项目尚未发布，不保留 `lalaArrival.ts`、`LalaExpression`、`lalaExpression` 或旧正文格式兼容层。

## 模块登记

| 模块                                       | 负责                                                                                                   | 权威输入                                     | 输出或副作用                         | 不负责                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------ | ----------------------------------- |
| `stores/gameStore.ts`                      | 行动、时段、日期与通用主线接口装配                                                                     | 玩家行动意图、主线模板触发结果               | AP、日期、事件节点                   | 分集或楼层实现                      |
| `stores/mainStoryStore.ts`                 | 通用主线游标、生成态、楼层动作和按 `timeCost` 完成结算                                                 | 模板查询、剧情楼层、Game store               | 主线状态变更                         | 识别具体集数                        |
| `stores/playerStore.ts`                    | 玩家原始数值、`999/100` 上限、大学进路五阶段和六轴投影                                                 | 玩家行动结算、严格快照恢复                   | 玩家状态与资料页派生值               | 新增文理/根性存档字段               |
| `stores/cardStore.ts`                      | 目标卡、位置与好感；仅保留程序化 JSON 卡初始化                                                         | 角色卡、已结算交谈                           | 角色地图状态                         | 文件/URL 导入、主线触发             |
| `stores/mapStore.ts`                       | 彩南高中/彩南町地图定义与地点索引                                                                      | 当前地点 ID                                  | 地图背景和当前区域地点               | AP 与剧情结算                       |
| `components/MapMenu.tsx`                   | 地图边缘护法、区域切换和菜单入口分发                                                                   | 当前地图、另一地图入口、菜单选择             | 切换地点或打开本地界面               | 消耗 AP、改写快照                   |
| `CalendarModule/index.tsx`                 | 原日期牌、行动点显示、`1 AP` 折页提示、跨日转场与 DateModule 导出                                      | Zustand 日期与剩余 AP                        | 时间展示和打开意图                   | 拥有日期、推进时间或改结算          |
| `CalendarModule/date.ts`                   | 公历月长、闰年、下一日与游戏日起始日期换算                                                             | 合法年月日                                   | 确定性日期计算                       | UI、预约或主线触发                  |
| `CalendarModule/DateModule/`               | 同框中文双月投影、逐页年份、本地双月翻页、当天标记、可点选日期信息条和周末主线红 ×                     | 当前 `CalendarDateValue` 与投影 specialDates | 组件本地可见月份、选中日期与关闭意图 | 推进日期、事件图标、AP 或状态写入   |
| `components/DictionaryPanel.tsx`           | 辞典列表、详情、前后翻页和关闭交互                                                                     | 官方静态词条                                 | 地图框内只读辞典 UI                  | 解锁、搜索或状态写入                |
| `data/dictionary.ts`                       | 解析并校验随包词条                                                                                     | `entries.json`                               | 只读词条数组                         | 推断或改写词条                      |
| `data/lore-books/dictionary/entries.json`  | 保存官方 Dictionary 表的中文字段                                                                       | `TextAsset/ToLoveArg`                        | 103 条静态词条                       | 假名、解锁或运行状态                |
| `components/CharacterArchivePanel.tsx`     | 100% 覆盖地图框的资料 stage；共轨双状态槽、单色五阶段雷达、18 槽分页图标、详情屏与非持久化开发解锁预览 | Player/Card/Game/Map store                   | 地图框内只读资料 UI                  | 扩展玩家 schema、读取主角头像或结算 |
| `data/characterArchive.ts`                 | 官方 01-11 槽位与第 12-18 扩充槽资源映射、角色卡绑定和锁定态去身份化                                   | Card store、角色出场规则                     | 18 个只读资料槽                      | 编造人物资料或解锁                  |
| `components/CharacterProfileModal.tsx`     | 档案入口镜像位置和角色档案弹窗                                                                         | 当前地图                                     | 档案入口/弹窗状态                    | 改写角色状态                        |
| `data/characterAvailability.ts`            | 默认角色的出场条件                                                                                     | 角色 ID、主线完成记录                        | 可见/锁定判断                        | 地图位置分配                        |
| `services/characterPresence.ts`            | 将剧情进度和时段同步到角色位置                                                                         | Game/Card store                              | 角色出现位置与当前目标               | 改写角色卡                          |
| `components/Controls.tsx`                  | 底部唯一操作区，系统组只读展示六维与资源精确值，并提交行动                                             | Store 当前状态                               | 状态投影与行动意图                   | 自行推进剧情                        |
| `data/skills.ts`                           | 127 项特技定义与六分类                                                                                 | 公开原作资料                                 | 技能静态表                           | 玩家进度                            |
| `skilllogic/`                              | 图校验、学期窗口、EXP、学习、实践与技能 store                                                          | 技能静态表、日期、已结算行动                 | 本地技能进度                         | 应用技能效果                        |
| `components/SpecialSkillPanel.tsx`         | 技能树、状态详情与 map 内响应式抽屉                                                                    | `skilllogic`、当前日期                       | 学习/实践提交意图                    | 重算前置或结算效果                  |
| `services/storyGenerationPrompt.ts`        | 世界书幕选择和受控 GAL 演出格式                                                                        | lore 小节、场景/立绘可用值                   | 可复用生成契约                       | 重述具体剧情                        |
| `services/storyGenerationContext.ts`       | 生成请求的提示/跨集历史窗口确定性投影                                                                  | 幕定义、规范 history floor、messagesave      | `userInput`、6 条历史、消息 ID       | 改写游戏状态或世界书                |
| `services/tavernStoryGeneration.ts`        | 生成、消息连续性和受控正文解析                                                                         | 幕定义、已存消息、世界书资料                 | `GalStoryAct`                        | 猜测画面与角色                      |
| `services/localContextPreview.ts`          | 本地快照、原文和当前生成投影的只读汇总                                                                 | Game/Card/Player/Skill store、messagesave    | 上下文预览模型                       | 写回状态或触发生成                  |
| `memory/storyTimeline.ts`                  | 跨集规范时间线、最近 6 条与更旧完整消息对选择                                                          | 主线档案、messagesave、生产剧集注册表        | 楼层和消息只读投影                   | 写档或改 active floor               |
| `memory/summaryPolicy.ts`                  | 固定 6 消息窗口、2/5 总结批次与 600/1200 字上限                                                        | 产品记忆协议                                 | 共享确定性常量                       | 调 API 或保存候选                   |
| `memory/summaryPrompts.ts`                 | 大小总结 TIDD-EC 提示词和输入边界校验                                                                  | 完整消息对/已接受小总结、只读状态锚点        | 提示词投影与来源 ID                  | 调 API、解析或结算                  |
| `memory/summaryAnalyzer.ts`                | 规范化副 API 纯文本并创建本地摘要 payload                                                              | 副 API 文本、本地来源批次                    | 本地标题、正文、空 facts             | 推断事实或保存候选                  |
| `memory/summaryArchive.ts`                 | 按存档隔离的浏览器候选、任务和人工决定记录                                                             | 已校验候选、审查命令                         | 浏览器本地摘要记录                   | Tavern 文件侧档                     |
| `memory/summaryRuntime.ts`                 | 自动存档后排队、去重、取消、迟到校验、重试与当前失败任务判定                                           | SaveRecord、MessageArchive、API 配置         | 副 API 请求与本地候选运行态          | 注入剧情或写游戏数值                |
| `memory/summaryProgress.ts`                | 非持久化摘要阶段与真实/不定进度                                                                        | 摘要执行器阶段通知                           | 地图 UI 运行态                       | 业务编排或持久化                    |
| `components/MemorySummaryProgress.tsx`     | 地图内 `push_0~3` 摘要进度与错误回显                                                                   | `summaryProgress`                            | 非阻塞进度条                         | 启动摘要或模拟完成                  |
| `GalMainStory/episodeTemplate.ts`          | 分集/分幕模板、`single-action / whole-day` 耗时合同与注册期不变量                                      | 集元数据、幕定义                             | 合法剧情模板                         | 运行态结算                          |
| `GalMainStory/episodes/index.ts`           | 生产剧集注册清单                                                                                       | 各集模板                                     | 通用剧情目录                         | 分集控制流                          |
| `GalMainStory/storyRegistry.ts`            | 通用模板查询、触发匹配、lore 与保底投影                                                                | `eventId + actId`、日期、行动序号            | 当前幕定义或触发结果                 | 保存重复进度                        |
| `GalMainStory/storyArchive.ts`             | 楼层采用、前文上下文与正文投影                                                                         | 剧情档案、模板幕 ID                          | 当前正文/前文楼层                    | 分集触发                            |
| `GalMainStory/storyPersistence.ts`         | 严格校验主线 schema v2                                                                                 | 游标、完成集、楼层、messagesave              | 可恢复主线状态                       | 迁移旧存档                          |
| `GalMainStory/episodes/episode01/index.ts` | 第一集元数据与两幕组装                                                                                 | 两个幕定义                                   | 第一集模板                           | 生成调用和状态结算                  |
| `GalMainStory/episodes/episode01/acts/`    | 世界书小节、素材表、结构完成合同和保底页                                                               | 本幕编辑合同                                 | 两个独立幕定义                       | 重写世界书剧情                      |
| `GalMainStory/episodes/episode02/`         | 第二集元数据、三幕触发与 lore order                                                                    | 三个幕定义                                   | 第二集模板                           | 跨日结算和正文措辞                  |
| `GalMainStory/episodes/episode03/`         | 第三集元数据、三幕整天触发、角色映射与 lore order                                                      | 三个幕定义、改编证据包                       | 第三集模板                           | 改写共享运行时                      |
| `GalMainStory/scenes/index.ts`             | GAL 场景 manifest                                                                                      | 背景 ID                                      | 资源路径与 alt                       | 幕时间线                            |
| `GalMainStory/characters/*.ts`             | 单角色别名、人物 lore、多立绘与表情资源                                                                | 角色素材和世界书条目                         | 可注册角色模块                       | 当前幕是否可用                      |
| `GalMainStory/characters/index.ts`         | 角色注册、说话人匹配与立绘查询                                                                         | 独立角色模块                                 | 角色/立绘查询 API                    | 剧情出镜判断                        |
| `GalMainStory/portraitRules.ts`            | 解析场景与角色唯一绑定的立绘                                                                           | 当前幕场景立绘规则                           | 必选立绘 ID 或无绑定                 | 选择剧情镜头                        |
| `GalMainStory/storyTextExtraction.ts`      | 从模型标签输出中结构化抽取正文                                                                         | Tavern Assistant 原文                        | 受支持容器内的可播放文本             | 校验逐行演出字段                    |
| `GalMainStory/storyPresentation.ts`        | 将 AI 正文与可选演出字段归一为合法逐页 cue                                                             | 标签正文、当前幕素材表与立绘绑定             | 正文与代码补全的演出 cue             | 改写剧情语义或角色资源              |
| `GalMainStory/GalMainStory.tsx`            | 加载/错误/保底、历史回放和 GAL 播放                                                                    | Store、演出 cue、场景/角色 manifest          | GAL 画面、翻页意图                   | 选择画面或角色                      |
| `GalMainStory/StoryHistoryArchive.tsx`     | 候选重生成、采用、回放和删除                                                                           | 各幕楼层档案                                 | 版本管理意图                         | 删除宿主聊天楼层                    |
| `GalMainStory/storyRawArchive.ts`          | 关联幕、楼层与 Tavern Assistant 原文并分页                                                             | 剧情档案、messagesave                        | 只读原文阅读模型                     | 归一化或改写正文                    |
| `GalMainStory/RawStoryHistoryDialog.tsx`   | 按幕、版本和页展示 AI 原文                                                                             | 只读原文阅读模型                             | 阅读器选择状态                       | 修改消息或采用楼层                  |
| `GalMainStory/galAssets.ts`                | 共享 GAL 窗口素材                                                                                      | GALBOX 文件                                  | 窗口/翻页资源路径                    | 角色资产                            |
| `GalMainStory/LayeredPortrait.tsx`         | body、mask、眼嘴图集和共享动画渲染                                                                     | rig、表情、当前发言状态                      | 分层立绘画面                         | 选择说话人或结算                    |
| `save/snapshot.ts`                         | 严格 schema v3 快照与玩家登记一致性                                                                    | Game/Player/Card/Skill store                 | 本地/宿主存档数据                    | 旧存档迁移                          |
| `savesolt/SaveSlotModal.tsx`               | 存档槽位读写、删除和状态提示                                                                           | `gameSaveApi`                                | 槽位操作意图                         | 修改快照内容                        |
| `messagesolt/index.ts`                     | Tavern 文件消息镜像桥                                                                                  | `MessageRequest`、本地文件接口               | MessageArchive 文件                  | 真实宿主消息楼层                    |
| `components/ContextPreviewModal.tsx`       | 快照/原文/上下文阅读、总结审查与手动按钮禁用态                                                         | 本地预览、摘要 archive/runtime、API 开关     | 数据阅读与人工审查意图               | 绕过 API 开关或直接调用剧情生成     |
| `components/SystemSettingsModal.tsx`       | 记忆 API、固定记忆层级说明、模型拉取与连接测试                                                         | `config/openaiCompatible`、summary policy    | 本地设置意图、调度刷新               | 摘要解析或游戏存档                  |
| `config/openaiCompatible/defaults.ts`      | 默认值、`/v1` 校验、请求地址和脱敏投影                                                                 | 用户配置                                     | 规范化配置与安全视图                 | 浏览器存储或网络请求                |
| `config/openaiCompatible/storage.ts`       | OpenAI 兼容配置的浏览器长期保存                                                                        | 规范化配置、`localStorage`                   | 配置读写/清空                        | GameSnapshot 或消息                 |
| `config/openaiCompatible/client.ts`        | `/models`、`/chat/completions` 请求、响应解析和连接探测                                                | API 配置、记忆提示                           | 模型列表、文本结果或显式错误         | 自动选择摘要时机                    |
| `data/storyLore.ts`                        | 读取关闭条目并武装下一次原生扫描中的副本                                                               | 稳定 order/名称、世界书条目                  | 一次性 World Info 钩子               | 修改已保存世界书                    |
| `data/worldbook.ts`                        | 世界书读取、扫描对象构建和显式诊断桥                                                                   | 游戏上下文、TavernHelper                     | 显式读/诊断能力                      | 剧情条目选择                        |
| `data/lore-books/*.txt`                    | 剧情与人物世界书的人工恢复文本                                                                         | 已校对剧情与人物资料                         | 待导入的纯文本恢复源                 | 运行时扫描和状态                    |
| `verify-episode03.cjs`                     | 第三集注册、身份、lore、场景资源与 fallback 合同检查                                                   | 生产剧集、角色/场景注册表、恢复源            | 定向校验结果                         | 证明真实 Tavern 扫描或剧情质量      |

## 权威状态

- 数值、日期、事件和当前幕以 Zustand + 存档为权威。
- `DateModule` 只从 `App` 接收权威 `gameStore.date` 和投影后的
  `specialDates`，并用它们初始化组件本地的双月浏览游标；翻页只改变这次打开期间的显示月份，点选只改变这次打开期间的本地选中日期，关闭再打开会回到游戏当前月与下月，不进入 Zustand、快照或主线。它不直接查询
  `GalMainStory` 的分集日期，主线打开时会直接关闭，因此不会建立第二套日程或占用规则。
- 特技权威状态位于
  `skilllogic/skillStore.ts`，存档只保存 EXP、学习历史和学期实践提交；节点状态与当前实践集合由图和最后一次提交派生。面板关闭会丢弃尚未提交的实践草案，但不会丢失已取得技能或已提交配置。技能效果当前只是说明文字，不能称为已作用于游戏结算。
- 第一集 event ID 和两个 act ID 保持不变；第二集 event ID 为 `main.engagement-cancellation-2008-04-09`，第三集 event
  ID 为
  `main.love-triangle-user-2008-04-11`。旧的梨子主角版第三集 ID 不再复用，避免旧采用楼层被误认成当前剧情。项目仍在开发期，旧存档不兼容；schema
  v2 的运行游标、楼层和消息都用稳定的 `eventId + actId` 关联，幕序号只在显示时由模板推导。
- 当前地图不另存一份并行状态，而是由 `currentLocationId` 经 `getMapForLocation()`
  唯一推导；因此存档恢复地点后会自动恢复对应地图。跨地图按钮只把地点切到目标地图入口。
- 地图边缘控件的布局契约为：学校“街”护法在左、档案在右；彩南町“学校”护法在右、档案在左；两者中心线镜像对齐。护法的圆形预览和恶魔图形均可点击，反馈不覆盖透明矩形区域。三档横屏尺寸的最新调整等待人工重新验收，不能沿用此前被撤回的通过结论。
- 第一集剧情使用真实 `出包王女` 世界书中两条保持关闭的条目：第一幕 `order 150` / `剧情第一集·第一幕`，第二幕 `order 151`
  / `剧情第一集·第二幕`。人物条目依次为菈菈 `order 100`、春菜 `order 101`、美柑 `order 102`、梨子
  `order 103`。第二集三幕使用 `order 152/153/154`，第三集三幕使用
  `order 155/156/157`。每次生成只扫描当前幕剧情条目及该幕登记的人物条目。代码按稳定 `order`
  和名称只读验证，并仅在下一次原生 World
  Info 扫描中启用这些条目的副本；已保存条目的关闭状态不变。本地 TXT 只是恢复源，不进入 bundle。
- 当前 preset 实际激活的其他世界书可以补充人物和长期事实，但不能覆盖剧情世界书当前小节。代码不会另写 opening/ending 或替缺失、损坏的世界书编造剧情答案。
- AI 返回的是正文候选。生成 prompt 仍要求只输出一对受支持的同名正文开闭标签；登记值为
  `story_scene/story_scence/gal_scene/story/scene/正文/剧情/narrative/dialogue/script/content/context/body/text/final/answer/output/response`。prompt 默认示例使用
  `<content>...</content>`，但上层已指定 `<正文>`、`<story_scene>` 或 `<story_scence>` 等标签时可以沿用。
  `storyTextExtraction.ts`
  扫描受支持标签 token，并让每个关闭标签只匹配它前面最近的同名开标签；最终只截取最近一对完整容器。规划中的孤立开标签、畸形
  `</konatan_planning~>`、其他标签树和容器外文字都不能扩张正文边界。若正文又被包成 `\\n' + '@...'`
  形式的 JavaScript 字符串拼接，解析副本会先还原真实换行，消息档案中的 Assistant 原文保持不变。正文中的其他尖括号标签标记被过滤，再经逐行演出归一、完整性检查和分页后进入 GAL。正文标签只是结构容器，不是完成哨兵；找不到任何完整标签对时进入
  `parse_error`。
- AI 原文阅读器只对保存的 Tavern
  Assistant 字符串做视图切片；所有页按顺序拼接仍是原字符串。切页、切幕和切换生成版本不修改 messagesave、提示词历史、采用楼层或重新生成上下文。
- 单看正文长度不是完成证明，也不需要模型输出完成标记。prompt 和本地解析器共同读取当前幕的 `minimumLineCount` 与
  `requiredSceneSequence`；只有当前幕登记了必经场景时才生成并检查场景完成合同。行数不足或没有按顺序走完本幕场景会进入
  `parse_error`。这仍不能机器证明所有世界书语义点都已覆盖，最终剧情内容由世界书和人工阅读判断。
- prompt 继续建议每页使用
  `@说话人【scene=...;focus=...;portrait=...;expression=...;effect=...】：正文`，但这些演出字段不再是正文接收门禁。解析器也接受
  `@说话人：正文`、`说话人：正文`、只有 cue 的旁白行和纯正文；纯正文按旁白播放。缺失或无效的 `scene`
  继承上一页，首行使用本幕首场景；`focus` 优先采用当前幕内的有效请求或当前说话角色，否则继承上一页或隐藏；`effect` 默认
  `none`。没有角色对白的纯叙述正文不再单独拒绝。JSON、空正文、最少行数和必经场景顺序门禁保持不变。
- 场景专用立绘规则由 `portraitRules.ts`
  同时提供给 prompt 示例和本地归一器。代码先应用场景绑定，再采用模型给出的当前幕合法立绘，否则回退到角色默认或当前幕首个合法立绘；表情不存在或缺失时使用该立绘自己的
  `defaultExpressionId`。因此 `changingRoom + haruna` 始终使用 `changer-room`，即使模型误给 `panic`
  也会稳定回退到该立绘登记的 `shy`，而不是拒绝整篇正文。原始 Assistant 文本仍原样保存在消息档案中。
- 超过单页长度的对白会在分页后保留原说话人，不能把后续页静默降级成旁白。
- 重生成的聊天历史按 `contextFloorIds`
  精确选择模板中前面各幕的当前采用楼层，不靠持久化幕序号猜顺序，也不混入当前幕旧候选。仍被后续版本引用的楼层不能删除；删除其他楼层会同步删除其游戏内消息。删除采用版会安全回退或取消采用，但不会删除尚未接通的宿主 hidden 消息。
- 渲染器只按当前页 `focusCharacterId/portraitId/expressionId`
  查询注册表并绘制；focus 不要求等于说话人，因此 AI 可以剪出反应镜头。口型只在当前出镜角色本人发言时启用；眨眼规则属于具体立绘表情资源。
- 前两集已经把
  `space/school/schoolGate/home/washroom/bedroom/rooftop/nightStreet/park/schoolRoad/changingRoom/washroomDoor/riverbank`
  拆成独立语义场景槽位。除原有浴室外，其余第一集槽位已从素材库选择并复制对应背景；夜间遛狗路段和次晨上学路分别使用
  `nightStreet` 与 `schoolRoad`，不再共用一张图。第三集新增 `townStreet` 与
  `aquarium`；前者复用已登记街道素材，后者使用项目内原创 SVG 水族馆背景。资源映射只由 `scenes/index.ts`
  管理，不进入世界书。
- 三集当前运行时与人物恢复源统一采用 User 主角、与结城家共同生活和梨子青梅竹马的映射；不存在男性梨斗，也不把原作男主关系转交给梨子。真实 Tavern 世界书仍需用当前恢复源替换
  `order 100-103` 与 `150-157`，并移除或禁用旧
  `order 158`；完成这一步并取得真实扫描与生成证据前，只能证明本地合同一致，不能宣称酒馆实机连续性通过。
- `TavernHelper.generate()` 返回值只证明生成 API 路线；当前没有创建真实聊天楼层，也没有触发 shujuku/database。
- 保底正文必须显式标记为 `fallback`，不能冒充宿主成功。
- “目录”上下文预览只读取本地 Zustand 和 messagesave；它能证明本地投影与生成调用使用同一选择逻辑，不能证明实际 World
  Info 注入、宿主 hidden floors、MESSAGE_SENT、shujuku 或数据库行为。
- 记忆 API 配置和临时模型候选不属于 GameSnapshot 或 MessageArchive。设置页的“拉取”调用用户填写的 OpenAI 兼容地址；浏览器直连失败时可经 SillyTavern 的
  `/api/backends/chat-completions/status`
  只读代发，但不写宿主设置、密钥库或消息。没有真实可用地址的证据时，不得宣称副 API 已接通。模型列表失败不得抹掉用户手填的模型名称。

## 当前接通标签

`真实 generate API 已实现；本地 messagesave 镜像已实现；真实 hidden host floors、shujuku、宿主消息和数据库未接通。`

分链路口径：

- 生成链：按当前幕只读验证关闭的剧情/人物条目，注册一次性 `WORLDINFO_ENTRIES_LOADED`
  钩子，仅在下一次扫描中启用所选副本，随后调用 `TavernHelper.generate({ preset_name: 'in_use' })`。连续性通过
  `overrides.chat_history` 携带最多 6 条已保存主线 user/assistant 消息；生成结束后无论成功失败都停止一次性钩子。
- 宿主消息链：未创建真实 hidden user/assistant floors。
- 插件/数据库链：未接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- UI 镜像链：游戏内 messagesave/file bridge 是本地游戏协议，不冒充宿主聊天权威。
- 上下文预览链：本地状态演示；当前生成时可显示实际调用投影，空闲时只显示最近原文窗口，不升级任何宿主/插件接通标签。
- 记忆 API 链：设置 UI、固定 6 消息窗口与 2/5 批次、600/1200 字上限、自动存档后调度、`{API 基址}/chat/completions`、纯文本响应规范化、本地 JSON 候选封装、浏览器候选缓存、审查、失败重试和已拒绝候选重新生成已经实现。真实外部接口成功仍待用户复验；Tavern 记忆侧档、已接受摘要的剧情上下文注入和 shujuku 仍未接通。
