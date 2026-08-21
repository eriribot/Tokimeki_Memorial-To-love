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
- 教室/图书馆场景、玩家属性、角色卡、好感、事件日志、开始菜单和存档槽。标题页“重新开始”先进入赛菲的蓝色天鹅绒房间，并显示是否接受性格画像的同框“是 / 否”选择。“否”不调用模型，“是”进入由内置六阶段自适应提示词引导的画像访谈；两条路径之后都必须完整播放梨子的五页叫醒过场，再进入她递交入学登记表的事件 CG，开场不提供跳过按钮。之后由玩家依次填写姓名、生日、血型、外貌和性格并核对确认；赛菲只可预填性格，姓名、外貌及其他资料仍由玩家填写。梨子在叫醒对话中使用眼嘴动画，在登记表旁保持眨眼。只有最终“确认登记”才提交完整玩家资料、建立可自动存档的游戏会话并进入游戏。
- 赛菲画像链独立于主线生成：运行时不读取
  `Aiforpersonality/Izumi 用户画像模式3 (1).json`，也不采用酒馆当前启用的 preset。接受画像后，第一题及之后每一题都由
  `TavernHelper.generateRaw()`
  生成；未完成回合必须同时返回问题和恰好三个第一人称候选回答，问题、AI 选项和自由输入都显示在赛菲局部的 episode04 式蓝色选择窗中。调用按顺序提交内置 system
  prompt、仅存在于当前组件内存的多轮历史和玩家本轮回答；不写酒馆楼层、世界书或游戏存档。最终报告只在当前界面展示，回填登记草稿的字段只有通过本地合同校验的
  `personality`。
- 特技使用 127 项六分类有向无环前置图。初始没有已取得特技；根节点只是可学习。有效 AP 行动获得特技 EXP，当前学期窗口内花费 EXP 取得特技，再从已取得特技中最多选择 6 项实践并一次提交。第一次窗口为
  `2008-05-09`；旧学期不能在后来同日补交。驾照保持考试外部取得，技能效果尚未接入属性或行动结算。
- 特技面板直接渲染在 `.map-section` 内。桌面使用同框详情栏，手机竖屏使用同框底部抽屉，手机横屏使用同框右侧抽屉；背景使用
  `artsource/SkillUi/skill-menu-paper-bg.png`，所有资源路径经 `resolveAssetPath()`。
- 行动点是时间推进权威；有效行动自动改变时段，AP 用完自动跨日，不再提供独立推进时间按钮。
- 每日两个可行动槽显示为“阶段一 / 阶段二”：阶段一只从校内地点分配角色，阶段二允许角色卡偏好落在学校或彩南町。第二次行动把 AP 降为 0 后直接跨日；内部
  `evening`
  只标为“日终结算”，用于日终主线衔接，不代表第三个可行动时段。日终结算时角色离开自由地图。整组分配按稳定角色 ID计算，同一地点最多 4 名具名角色，满员后依次尝试其余合法地点，所有合法地点都满员时才暂不显示。角色卡规范化和运行时加载共用完整
  `LocationId` 白名单，城镇偏好不会再被静默过滤。
- 地图人物 Q 版立绘、地点下方“与人物互动”和底部附近人物列表现在只负责打开同框互动场景，打开、切换人物、选话题和退出都不消耗 AP。场景一次只聚焦一名全身立绘，同地点其余人物以最多 4 人的切换 chip 显示；行动菜单不会自动输出公式化见面句，也不会伪装成正文框。菜单顶部的关系、阶段/AP 与返回键使用互动场景自己的 flex 状态栏，不复用主线五列翻页控制器；窄于 760px 时隐藏关系摘要，保留阶段/AP 与返回。旧的“点击后立刻扣 AP、固定好感 +5、只写一句日志”路径已经移除。
- 人物互动首版固定为“聊一聊 / 送礼 / 一起行动 / 观察 / 拉近距离 / 离开”六项。送礼明确锁定为尚未接入；观察为本地 0
  AP 信息事件且不提升关系；聊一聊按日期、阶段、地点、角色和事件包版本稳定抽出 3 个手写话题，并通过主线共用的
  `GalStoryPage`
  选择层逐项显示，选定后再用同一个主线正文与名牌组件播放 3–5 个 beat。一起行动要求友情 20，拉近距离要求友情 40 与恋爱 15。所有付费事件最后确认时才重新校验主线出场、地点、人物、资源和关系门槛，并原子结算 1
  AP；付费序列进行中不能换人或返回地图，重开同一上下文也不能刷新话题。
- 友情与恋爱是人物关系的权威轴，好感显示为二者四舍五入后的平均值；旧存档若只有好感而友情/恋爱均为 0，会在角色加载或快照恢复时立即把旧好感规范化为二轴共同基线，门槛投影也使用同一规则，不再等到首次关系更新才跳变。事件奖励与日志由 runtime 按行动 ID 固定，UI 不能传入任意关系增量。首版事件不接 AI、酒馆楼层、约会存档或随机失败，也不保存 0
  AP 观察次数。六名默认角色各有独立的 To
  LOVE-Ru 式误会、发明、吐槽或轻喜剧事件包，未知导入卡只使用 greeting 与 alternate
  greetings 生成安全回退，不读取 prompt 或示例对话。
- 自由互动背景使用原作背景集：教室、中庭、图书室、天台、站前、商店街、公园和河堤使用对应场景；拥有夕方变体的地点在阶段二换光线。素材库没有彩南高校食堂和音乐室，因此食堂暂用家庭餐厅、音乐室暂用彩南高校走廊并在 UI 标注视觉来源，不把近似图登记为精确场景。
- 非主线约会由 `DatingModule/` 独立持有预约、邀约尝试、双阶段运行态、回忆、`sub/hurt` 与有向女生关系。成功预约投影到双月日历并显示 `💕`；约会正文只通过 `TavernHelper.generate({ user_input })` 注入本轮提示词，模型、最大输出、采样和上下文等生成设置全部沿用酒馆当前 preset，不由约会模块覆盖。返回文本复用主线 `storyTextExtraction.ts` 接受完整的受支持正文容器，默认要求 `<content>...</content>`。12 页、1200 字是交给 AI 的写作目标，不是本地拒收门槛；提示词以《出包王女》式校园轻喜剧活力和《心跳回忆》式约会情绪推进作为高层写作引导，按阶段给出四段演出节奏、催稿式完成标准与不外显的提交前复核，鼓励模型把过渡演成页面并自然超过最低目标。只要返回至少一页可播放正文并满足容器、正文行、演出字段和恰好 3 个已登记选项 ID 的结构协议，就直接进入 GAL。未知 ID、重复 ID、emoji、颜文字或非法演出字段仍进入可见错误/重新生成流程。玩家说话人沿用主线的 `@你`，渲染时显示存档玩家名；预设偶尔带出的原作男主称呼不再让整幕失败，若它出现在说话人名牌位置也会归一到存档玩家名，不能形成第二名男主。AI 只写正文、逐页演出字段与选项文案，本地导演器仍拥有选项 ID、关系、AP、费用和日期结算。
- 正式约会、放学同行、费用选择和完成提示都绝对定位在现有 `.map-section` 内；GAL 日期场景复用 `GalStoryPage` 的 30:17 舞台。角色页的 `expression` 由 AI 根据当页情绪从对应立绘的登记表情中自行选择；约会选项图标由独立的 `datingOptionVisuals.ts` 按稳定选项 ID 映射，AI 不生成图标或 emoji。关系结算器不读取表情或图标，因此后续扩充互动表现不需要修改数值规则。
- 2008-04-07 第一集由两次自由行动触发两幕；2008-04-09 至 04-10 第二集按 `1 AP / 0 AP / 次日 0 AP` 触发三幕；第三集在
  `2008-04-11`、`04-12`、`04-13` 每日第一次行动各触发一幕。第三集三幕都声明
  `timeCost: 'whole-day'`：触发前仍按一次有效行动原子结算，完成该幕后直接进入下一日并恢复日初 AP，不再保留当日晚间自由行动；`04-14`
  的上学路摔倒只属于第三幕尾声，不是第四幕。第四集第一幕在 `2008-04-15 #1` 以 `whole-day` 触发；第二、三幕在
  `04-16 #1/#2` 依次以 `single-action`
  触发，使返校说明、容器开启与校园混战保持在同一天；第一幕结尾由当前采用楼层提供恰好三项 AI 候选，另有一项独立自由输入页；四种选择都汇入第二幕，只允许改变下一幕开场语气、反应或一句回扣，不建立分支路线。AI 结果不合法时改用模板内恰好三项的保底候选。四集都从真实世界书读取当前幕，支持加载、错误、保底、GAL 播放和本地 messagesave 镜像。
- 主线运行态只保存 `eventId + actId + phase + pageIndex`。选择结果保存在既有幕档案的
  `choiceDecision`，不建立并行的分集进度字段；恢复时按剧集模板严格校验选择 ID，并按当前行动次数幂等检查等待中的幕。当前幕正文只从对应档案的采用楼层读取，不另存一份正文投影。
- 当前可执行的默认角色规则是：夕崎梨子与西连寺春菜初始可见，菈菈在第二集完成、以转学生身份登场后可见，梦梦、古手川唯与小暗保持锁定；角色卡只通过程序化 JSON 初始化进入运行态，当前没有用户文件/URL 导入入口。
- AI 每一页必须按受控格式给出
  `scene/focus/portrait/expression/effect`；当前幕的场景表、演员表、立绘版本和各立绘实际表情集合共同约束可用值。未登记人物可以用真实姓名或明确身份说话，并显示通用文字名牌，但不能带“临时角色”标签，也不能虚构立绘。渲染器直接消费通过校验的演出 cue，不再按页数、关键词或角色特判猜演出。
- `speaker=null` 的普通正文页保留通用文字 nameplate 并显示“旁白”；人物专用 PNG
  nameplate 仍只用于已登记且拥有对应素材的说话人，选择页不重复挂载 nameplate。
- 带选择的幕必须在正文末尾输出三行
  `@选项【index=1..3】`，每行包含即时行动和下一幕微差分提示；严格解析器拒绝缺项、多项和重复项。第四项自由输入由玩家在独立同框页填写，最多 80 字，并作为同一种
  `choiceDecision` 连续性输入进入下一幕。
- GAL 表现层用同一个分层立绘组件渲染菈菈、西连寺春菜、结城美柑和夕崎梨子。每名角色是独立模块，并可登记多套立绘；每套立绘拥有自己的 body、mask、眼嘴资源和表情集合。以后新增萨斯丁、猿山、校长等角色时新增角色模块并在需要的幕登记，不修改通用类型。
- GAL 幕标题使用 `artsource/galbox/midashi01.png` /
  `midashi02.png`，选择框使用蓝/粉棋盘窗口素材；选中、悬停与键盘焦点统一使用 `#75dec5`
  实色条。选择按钮和正文底板不得增加
  `backdrop-filter`、圆角卡片、悬浮位移、阴影或毛玻璃；长 AI 正文在独立正文区滚动，末页为选项预留固定空间。
- User 是固定主角、与结城家共同生活，承接原作男主的剧情职能；企划中不存在另一名男性梨斗。夕崎梨子是与 User 分离的青梅竹马、美柑的姐姐、信息/提醒辅助和独立可攻略角色，可以通过交谈发展好感，但不继承原作男主身份、菈菈婚约或对春菜的关系，也不能替 User 作出玩家保留的选择。
- 已读剧情中的 AI 原文按“幕 -> 生成版本 -> 页”阅读；目录内的楼层按钮会直接打开对应版本，每次只显示一页，不再把所有 Assistant 正文堆叠在同一滚动区。
- 重新生成会从当前幕开头产生一个新候选，只继承前面各幕当前采用楼层；当前幕旧候选不会作为续写历史。每个候选楼层可以删除，删除当前采用版时自动回退到剩余的最新可播放版本。
- 地图菜单的“辞典”入口打开同框本地辞典。`data/lore-books/dictionary/entries.json` 保存从官方 `TextAsset/ToLoveArg` 的
  `Dictionary`
  表机械提取的 103 条中文词条；界面不显示假名，支持滚动列表、详情、前后词条、返回列表和关闭回地图。当前没有词条解锁、搜索或剧情状态写入，也没有接通标题页的
  `ToLOVE3辞典` 入口。
- 地图菜单的“数据”入口打开同框资料页，`CharacterArchivePanel` 始终绝对挂载在 `.map-section` 内，stage 以 `100% × 100%`
  覆盖现有地图框，不占浏览器全屏。授权 `bg_data1/bg_data2` 虽为 1024×1024 原图，运行时当前使用 `object-fit: fill`
  匹配地图框；页面没有灰色侧边，也不使用毛玻璃、卡片边框或面板阴影。主角页不显示当前位置，固定标题为“主角”，展示登记后的男性性别、生日、血型、完整外貌与性格；身高和体重仍显示“未登记”，另有体力、压力和零用钱。体力与压力共用
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
  与 GameSnapshot schema v4。`PlayerProfile`
  还严格保存固定男性、最多 160 个 Unicode 字符的外貌与性格；v3及更早存档不迁移。先前彩色五级雷达和“理系压力表”候选均已撤销。
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
- 地图菜单的“目录”入口打开本地上下文与总结审查。上下文页会显示当前存档有效的
  `<tolove_player_profile>`、资料签名、注入版本、Persona 承载方式、身份别名护栏和本次隔离的 Persona 来源。主线只在当前生成请求中注入存档玩家资料，不调用
  `/persona-set`，不切换或改写酒馆当前 Persona；普通卡片继续使用酒馆原生用户设定。当前幕运行时按该幕投影的 `messageIds`
  显示“当前幕连续性窗口”；空闲时按当前跨集规范时间线显示“下一轮连续性窗口”，两者都最多保留最近 6 条完整原文。历史楼层没有持久化跨集 history 回执，因此空闲窗口明确标成按当前采用版重建，不冒充当时真实发送记录。原文默认折叠且列表与弹窗正文都可独立滚动；快照、生成提示、本幕世界书引用和全部原文仍为只读。
  `historyFloorIds` 只负责跨集生成历史，存档中的同集 `contextFloorIds`
  契约不变。该界面不代表真实宿主消息或 shujuku 扫描。
- 地图菜单“系统设定”只配置记忆用 OpenAI 兼容 API：弹层限制在地图框中央，`window_kani.png` 是完整窗口主体，原生
  `midashi_op.png` 按 255:49 比例叠在左上承载“系统设定”标题；该弹层不再混用
  `window_system.png`。一级页只显示“AI 记忆设定”，点击后才挂载输入表单；两个页面都不建立独立滚动区。用户填写的地址与酒馆“自定义（兼容 OpenAI）”一样被视为完整 API 基址，客户端直接追加
  `/models` 与 `/chat/completions`，不会擅自插入
  `/v1`。拉取模型先尝试浏览器直连；若被跨域或网络层拦截且当前处于 SillyTavern，则改用酒馆现成的只读状态接口代发，不写酒馆设置或密钥库。模型名称仍可手动输入。启用状态、地址、模型和密钥长期保存在当前浏览器；总结合同不是用户配置：剧情连续性固定保留最近 6 条消息，每累计 6 个尚未归档的完整楼层自动形成 1 个小总结，手动生成可提前总结当前 1–6 楼，每 5 条已接受小总结形成 1 个大总结，正文上限分别为 300/600 字。自动存档运行器挂载时也会立即检查当前游戏态，因此保存配置后能复查本页最近一次配对成功的权威自动存档。
- 大小总结的 TIDD-EC 提示词、自动调度、纯文本规范化、本地候选封装和人工审查已经接通：只有主存档与 MessageArchive 同次写入成功后才排队；每个当前采用的主线幕是一楼，每场已经 `completeRun` 并进入 `DatingArchive` 的完整约会也投影为一楼，进行中的约会草稿不计。约会楼层以稳定的本地 User/Assistant 消息对承载日期、对象、地点以及按正文/返程顺序保存的台词，不伪装成主线或真实宿主消息。累计 6 个未覆盖楼层形成自动小总结，手动生成可选择最早的 1–6 个未覆盖楼层。当前来源存在失败任务时后续自动批次暂停，失败任务不会自动循环，重试会重新校验已保存锚点、当前采用楼层和原文。每次调度先处理已经凑齐的 5 条大总结批次，再处理新的 6 楼层小总结批次；同一批大总结的来源指纹、楼层和消息必须互不重复。副 API 未启用时，手动小总结按钮保持 disabled/灰色；启用后只有运行中任务或与当前 save/source 仍匹配的失败任务阻断，过期失败记录不误锁新批次。副 API 只提供摘要正文；标题、来源指纹、来源 ID、状态、模型、时间戳及 JSON 存储外壳全部由本地代码生成，新候选的
  `facts`
  固定为空，不从普通文本伪造结构化证据。玩家可接受、编辑或拒绝候选；已拒绝候选可以从同一组冻结来源显式重新生成，但后续任务或候选出现后，旧记录不再重复生成。候选和失败任务的冻结来源默认折叠：小总结按原顺序展示 1–6 个楼层的本地 User/Assistant 原文及主线幕或约会范围、楼层、Tavern/fallback 标签，大总结展示 5 条来源小总结的标题和正文；展开区自身滚动，缺失来源不会被静默过滤。请求落盘要求
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
  是注册清单，目前登记第一集至第四集。共享触发器、生成、存档、历史和渲染只按 `eventId + actId`
  查询模板，没有分集特判。复用既有角色与场景时，新增一集只需新增幕定义、该集 `index.ts`，再在注册清单增加一项。
- 幕可通过 `presentation.cgShots` 声明一组派生 CG，并用 `trigger.kind` 选择在指定 `sceneId`
  的零基页序号前 (`before-scene-beat`) 或后 (`after-scene-beat`) 打开；同一幕可登记多组不同触发点，每组 `frames[]`
  可登记多帧并分别保存稳定帧 ID、资源、替代文本、裁切和可选 `camera`。`camera` 使用原图坐标系的
  `focusXPercent / focusYPercent` 与
  `zoom`，因此同一原图可以复用为不同构图，而不需要复制素材。点击正文页先打开不含对话框、姓名牌和控制条的全屏 CG，组内点击以 260ms 交叉淡化逐帧前进，只有最后一帧再次点击才执行 420ms 淡出并复用原有翻页动作进入下一页。CG 组和帧游标只用组件本地状态，不增加存档页或结算路径。AI 提示只收到场景页边界，不收到资源和转场命令；第一集第二幕使用“首个
  `scene=home` 正文页之前”的宽松边界，因而浴室段可以自然增减正文页，只要美柑出现所开启的下一情节点从 `home`
  开始，CG 就会在她出现前播放。具体帧素材与运镜仍完全由第二幕本地配置负责。
- `data/lore-books/tolove-tv-episode-02-act01.txt`、`act02.txt`、`act03.txt`
  是第二集三幕恢复源，不进入 bundle。第二集运行时按 `order 152/153/154` 读取真实 Tavern 条目；人物条目按
  `order 100/101/102` 读取。第一幕会选择美柑和春菜人物 lore，但本地 fallback 画面不能证明真实 World Info 扫描已经命中。
- `episodes/episode03/` 保存第三集三幕，event ID 为 `main.love-triangle-user-2008-04-11`。三幕依次在
  `04-11 #1 / 04-12 #1 / 04-13 #1` 触发，读取 `order 155/156/157`，并全部使用
  `timeCost: 'whole-day'`。第二幕的邀请因果固定为美柑先邀请春菜，菈菈随后撒娇并提出去水族馆，春菜同意。第三幕中，春菜先重提 User 与菈菈很般配，再揭示自己从初中起就注意到 User 在无人要求时自发照料教室花草；春菜与 User 都把告白说到开头，随后被菈菈造成的鱼群事故打断，关系不结算。写完
  `04-13` 水族馆事件后，才以 `04-14` 上学路摔倒收尾。当前人物 lore 共同采用 User 主角、梨子青梅竹马的映射。
- `episodes/episode04/` 保存第四集试作三幕，event ID 为 `main.love-apron-user-2008-04-15`。三幕依次在
  `04-15 #1 / 04-16 #1 / 04-16 #2` 触发，读取 `order 159/160/161`；第一幕使用 `timeCost: 'whole-day'`，后两幕使用
  `single-action`。第一幕只让战争说明进入 User 的脑内惨败幻想，并以伤人的厨艺退婚借口导致菈菈离家；真正的战争恐惧留到第二幕返校谈话，第三幕同日承接容器开启，并以“比星际战争还惨”的原作回环结束。第一幕的选择由前端一次性结算，未选时不能跳过或结束该幕；后续 fallback 与 AI 提示只读取模板给出的连续性提示，使 User 的追赶或准备措辞产生收敛式微变化，模型不得另开路线或重算状态。
- `GalMainStory/characters/lala.ts` 另登记 `004_01_01` 的 `school-uniform` portrait，只收录眼嘴均齐全的 `a/b/c/d/e`，缺少 mouth 的 `f` 不进入运行时；菈菈全局默认仍为 `arrival-default`。校服只由明确的幕内规则选用：第二集第三幕教室、第三集第一幕天台/学校、第三集第三幕周一上学路尾声、第四集第一幕学校。转学揭晓前、周末换衣、水族馆及第四集穿宇航服返校后的连续段落继续使用 `arrival-default`。表情语义、非眨眼帧、接缝与 mask 仍待人工验收。`DatingModule/datingStoryGeneration.ts` 会枚举角色登记表中的全部 portrait，因此校服现已同时出现在约会 AI 的可选立绘清单中；本轮只做素材与主线场景映射，未增加约会地点过滤。
- 项目尚未发布，不保留 `lalaArrival.ts`、`LalaExpression`、`lalaExpression` 或旧正文格式兼容层。

## 模块登记

| 模块                                       | 负责                                                                                                                               | 权威输入                                                  | 输出或副作用                                   | 不负责                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `stores/gameStore.ts`                      | 行动、时段、日期与通用主线接口装配                                                                                                 | 玩家行动意图、主线模板触发结果                            | AP、日期、事件节点                             | 分集或楼层实现                                                                      |
| `stores/mainStoryStore.ts`                 | 通用主线游标、生成态、楼层动作、AI/保底/自由输入选择和按 `timeCost` 完成结算                                                       | 模板查询、剧情楼层、Game store                            | 主线状态与选择决定                             | 识别具体集数                                                                        |
| `stores/playerStore.ts`                    | 玩家原始数值、v4 `PlayerProfile` 规范化、`999/100` 上限、大学进路五阶段和六轴投影                                                  | 玩家登记、行动结算、严格快照恢复                          | 玩家状态、固定身份与资料页派生值               | 新增文理/根性存档字段                                                               |
| `start/PlayerRegistration.tsx`             | 赛菲“是 / 否”入口、两分支强制汇入梨子五页叫醒过场和登记事件、姓名/生日/血型/外貌/性格本地草稿与最终一次性登记                      | 玩家选择与输入、赛菲可选性格结果、`createPlayerProfile()` | 梨子动态过场、最终确认后的不可编辑登记提交意图 | 跳过首次梨子开场、确认前保存、让赛菲填写姓名/外貌或修改酒馆 Persona                 |
| `VelvetRoom/`                              | 赛菲分层立绘、六阶段画像、AI 问题与三回答协议、局部蓝色选择/输入窗、内存历史、结果解析与性格回填                                   | 玩家回答、内置 system prompt、`TavernHelper.generateRaw`  | 本地报告与一次性 `personality` 草稿            | 修改 episode04 共享选择器、读取 Izumi JSON、采用当前酒馆 preset、写楼层/存档/世界书 |
| `stores/cardStore.ts`                      | 目标卡、分组位置结果、友情/恋爱权威值与派生好感；仅保留程序化 JSON 卡初始化                                                        | 角色卡、地点分配结果、已结算关系变化                      | 角色地图状态与关系值                           | 自行决定地点、文件/URL 导入、主线触发                                               |
| `data/locationIds.ts`                      | 完整地图地点 ID 注册与共享类型守卫                                                                                                 | `LocationId`                                              | 卡片规范化和加载白名单                         | 地图坐标、时段分配                                                                  |
| `stores/mapStore.ts`                       | 彩南高中/彩南町地图定义与地点索引                                                                                                  | 当前地点 ID                                               | 地图背景和当前区域地点                         | AP 与剧情结算                                                                       |
| `components/MapMenu.tsx`                   | 地图边缘护法、区域切换和菜单入口分发                                                                                               | 当前地图、另一地图入口、菜单选择                          | 切换地点或打开本地界面                         | 消耗 AP、改写快照                                                                   |
| `CalendarModule/index.tsx`                 | 原日期牌、行动点显示、`1 AP` 折页提示、跨日转场与 DateModule 导出                                                                  | Zustand 日期与剩余 AP                                     | 时间展示和打开意图                             | 拥有日期、推进时间或改结算                                                          |
| `CalendarModule/date.ts`                   | 公历月长、闰年、下一日与游戏日起始日期换算                                                                                         | 合法年月日                                                | 确定性日期计算                                 | UI、预约或主线触发                                                                  |
| `CalendarModule/DateModule/`               | 同框中文双月投影、逐页年份、本地双月翻页、当天标记、可点选日期信息条和周末主线红 ×                                                 | 当前 `CalendarDateValue` 与投影 specialDates              | 组件本地可见月份、选中日期与关闭意图           | 推进日期、事件图标、AP 或状态写入                                                   |
| `components/DictionaryPanel.tsx`           | 辞典列表、详情、前后翻页和关闭交互                                                                                                 | 官方静态词条                                              | 地图框内只读辞典 UI                            | 解锁、搜索或状态写入                                                                |
| `data/dictionary.ts`                       | 解析并校验随包词条                                                                                                                 | `entries.json`                                            | 只读词条数组                                   | 推断或改写词条                                                                      |
| `data/lore-books/dictionary/entries.json`  | 保存官方 Dictionary 表的中文字段                                                                                                   | `TextAsset/ToLoveArg`                                     | 103 条静态词条                                 | 假名、解锁或运行状态                                                                |
| `components/CharacterArchivePanel.tsx`     | 100% 覆盖地图框的资料 stage；共轨双状态槽、单色五阶段雷达、18 槽分页图标、详情屏与非持久化开发解锁预览                             | Player/Card/Game/Map store                                | 地图框内只读资料 UI                            | 扩展玩家 schema、读取主角头像或结算                                                 |
| `data/characterArchive.ts`                 | 官方 01-11 槽位与第 12-18 扩充槽资源映射、角色卡绑定和锁定态去身份化                                                               | Card store、角色出场规则                                  | 18 个只读资料槽                                | 编造人物资料或解锁                                                                  |
| `components/CharacterProfileModal.tsx`     | 档案入口镜像位置和角色档案弹窗                                                                                                     | 当前地图                                                  | 档案入口/弹窗状态                              | 改写角色状态                                                                        |
| `data/characterAvailability.ts`            | 默认角色的出场条件                                                                                                                 | 角色 ID、主线完成记录                                     | 可见/锁定判断                                  | 地图位置分配                                                                        |
| `services/characterLocationAllocation.ts`  | 按时段、出场条件、角色偏好和单地点 4 人上限生成确定性整组位置                                                                      | 角色集合、`CharacterPresenceContext`                      | `角色 ID -> 地点或 null`                       | 写 store、改角色卡或推进时间                                                        |
| `services/characterPresence.ts`            | 将剧情进度和时段同步到角色位置                                                                                                     | Game/Card store                                           | 角色出现位置与当前目标                         | 改写角色卡                                                                          |
| `services/characterRelationship.ts`        | 规范化旧档关系轴、派生好感并纯函数应用关系变化                                                                                     | 角色关系值与已批准增量                                    | 规范化后的友情、恋爱与好感                     | AP、出场或事件门槛                                                                  |
| `data/characterInteractionProfiles.ts`     | 六名默认角色的手写互动包、未知卡回退、结构校验、插值和稳定话题抽取                                                                 | 日期、阶段、地点、角色 ID 与事件包版本                    | 纯本地事件序列                                 | AP、store、AI 或 UI                                                                 |
| `data/locationSceneBackgrounds.ts`         | 所有自由地图地点的阶段背景映射与明确近似素材注记                                                                                   | `LocationId`、阶段                                        | 原作背景资源路径                               | 角色位置或互动结算                                                                  |
| `services/characterInteractionRuntime.ts`  | 最终 beat 时重验主线出场/人物/地点/AP/资源/关系门槛，并按行动 ID 提交固定奖励                                                      | Game/Player/Card store 与行动 ID                          | 单次 AP、日志、关系和人物位置同步              | 选择话题、生成文本或渲染                                                            |
| `components/CharacterInteractionScene.tsx` | 单人聚焦（桌面立绘约占场景高度 3/4）、同地点人物切换、无自动问候的六项菜单，以及复用 `GalStoryPage` 的三话题选择与逐 beat 正文播放 | 互动数据、背景映射与 store 投影                           | 本地 UI 意图；仅最终确认调用 runtime           | 直接推进时间、AI、约会或礼物系统                                                    |
| `DatingModule/`                            | 非主线邀约、日历预约、双阶段约会、长正文与三行动协议、关系账本、回忆、地图框 GAL 和交互视觉映射                                  | Game/Card/Player/Skill store、当前 preset、已登记选项 ID  | 本地预约/结算状态与已采纳约会正文               | 让 AI 决定数值、AP、费用、日期、选项 ID 或创建宿主消息                              |
| `components/Controls.tsx`                  | 底部唯一操作区，展示六维/资源、提交个人行动，并把附近人物互动意图交给场景                                                          | Store 当前状态                                            | 状态投影、个人行动或场景打开意图               | 直接结算人物关系或自行推进剧情                                                      |
| `data/skills.ts`                           | 127 项特技定义与六分类                                                                                                             | 公开原作资料                                              | 技能静态表                                     | 玩家进度                                                                            |
| `skilllogic/`                              | 图校验、学期窗口、EXP、学习、实践与技能 store                                                                                      | 技能静态表、日期、已结算行动                              | 本地技能进度                                   | 应用技能效果                                                                        |
| `components/SpecialSkillPanel.tsx`         | 技能树、状态详情与 map 内响应式抽屉                                                                                                | `skilllogic`、当前日期                                    | 学习/实践提交意图                              | 重算前置或结算效果                                                                  |
| `services/storyGenerationPrompt.ts`        | 世界书幕选择、受控 GAL 演出格式、宽松 CG 场景边界提示与三项 AI 候选输出协议                                                        | lore 小节、场景/立绘/CG 边界、选择问题                    | 可复用生成契约                                 | 重述具体剧情或暴露 CG 素材                                                          |
| `services/playerPersona.ts`                | 版本化玩家资料、签名、Persona Description 覆盖/兜底计划、`{{user}}` 传输别名护栏和历史签名校验                                     | 冻结的 v4 `PlayerProfile`、当前预设                       | 请求级 Persona 描述覆盖与一次性 system 注入    | 切换、改名、删除、重绑或写入真实酒馆 Persona                                        |
| `services/storyGenerationMutex.ts`         | 保证剧情生成与一次性世界书钩子单请求互斥                                                                                           | generation ID、异步操作                                   | 互斥结果与 `finally` 清理                      | 取消宿主请求                                                                        |
| `services/storyGenerationContext.ts`       | 生成请求的提示/CG 边界/跨集历史窗口与玩家资料签名的确定性投影                                                                      | 幕定义、冻结 PlayerProfile、规范楼层与原文                | `userInput`、资料块、6 条历史、ID              | 改写游戏状态或世界书                                                                |
| `services/tavernStoryGeneration.ts`        | 冻结玩家身份、仅在请求内注入内部 PlayerProfile、隔离外部 Persona Description 与 Persona Lore、生成并严格解析正文和三项候选         | 幕定义、PlayerProfile、消息、世界书资料                   | 带身份签名的 `GalStoryAct` 楼层                | 切换宿主 Persona、修改全局用户名/预设/世界书保存态                                  |
| `services/localContextPreview.ts`          | 本地快照、原文、当前生成与有效玩家 Persona 投影的只读汇总                                                                          | Game/Card/Player/Skill store、messagesave                 | 上下文与 Persona 预览模型                      | 写回状态或触发生成                                                                  |
| `memory/storyTimeline.ts`                  | 跨集规范时间线、最近 6 条与更旧完整消息对选择                                                                                      | 主线档案、messagesave、生产剧集注册表                     | 楼层和消息只读投影                             | 写档或改 active floor                                                               |
| `memory/summarySourceProjection.ts`        | 把当前采用主线与已完成约会合并为按剧情日期排序的稳定两消息总结楼层                                                                 | GameSnapshot、主线 messagesave、DatingArchive             | 总结专用楼层与来源消息                         | 创建宿主消息、改主线档案或纳入约会草稿                                               |
| `memory/summaryPolicy.ts`                  | 固定 6 消息窗口、手动 1–6/自动 6 楼、5 条小总结批次与 300/600 字上限                                                               | 产品记忆协议                                              | 共享确定性常量                                 | 调 API 或保存候选                                                                   |
| `memory/summaryPrompts.ts`                 | 大小总结 TIDD-EC 提示词和输入边界校验                                                                                              | 完整消息对/已接受小总结、只读状态锚点                     | 提示词投影与来源 ID                            | 调 API、解析或结算                                                                  |
| `memory/summaryAnalyzer.ts`                | 规范化副 API 纯文本并创建本地摘要 payload                                                                                          | 副 API 文本、本地来源批次                                 | 本地标题、正文、空 facts                       | 推断事实或保存候选                                                                  |
| `memory/summaryArchive.ts`                 | 按存档隔离的浏览器候选、任务和人工决定记录                                                                                         | 已校验候选、审查命令                                      | 浏览器本地摘要记录                             | Tavern 文件侧档                                                                     |
| `memory/summaryRuntime.ts`                 | 自动存档后排队、主线/约会来源合并、去重、取消、迟到校验、重试与当前失败任务判定                                                    | SaveRecord、MessageArchive、DatingArchive、API 配置       | 副 API 请求与本地候选运行态                    | 注入剧情、创建宿主楼层或写游戏数值                                                   |
| `memory/summaryProgress.ts`                | 非持久化摘要阶段与真实/不定进度                                                                                                    | 摘要执行器阶段通知                                        | 地图 UI 运行态                                 | 业务编排或持久化                                                                    |
| `components/MemorySummaryProgress.tsx`     | 地图内 `push_0~3` 摘要进度与错误回显                                                                                               | `summaryProgress`                                         | 非阻塞进度条                                   | 启动摘要或模拟完成                                                                  |
| `GalMainStory/episodeTemplate.ts`          | 分集/分幕模板、`single-action / whole-day` 耗时合同与注册期不变量                                                                  | 集元数据、幕定义                                          | 合法剧情模板                                   | 运行态结算                                                                          |
| `GalMainStory/episodes/index.ts`           | 生产剧集注册清单                                                                                                                   | 各集模板                                                  | 通用剧情目录                                   | 分集控制流                                                                          |
| `GalMainStory/storyRegistry.ts`            | 通用模板查询、触发匹配、lore 与保底投影                                                                                            | `eventId + actId`、日期、行动序号                         | 当前幕定义或触发结果                           | 保存重复进度                                                                        |
| `GalMainStory/storyArchive.ts`             | 楼层采用、前文上下文与正文投影                                                                                                     | 剧情档案、模板幕 ID                                       | 当前正文/前文楼层                              | 分集触发                                                                            |
| `GalMainStory/storyPersistence.ts`         | 严格校验主线 schema v2                                                                                                             | 游标、完成集、楼层、messagesave                           | 可恢复主线状态                                 | 迁移旧存档                                                                          |
| `GalMainStory/episodes/episode01/index.ts` | 第一集元数据与两幕组装                                                                                                             | 两个幕定义                                                | 第一集模板                                     | 生成调用和状态结算                                                                  |
| `GalMainStory/episodes/episode01/acts/`    | 世界书小节、素材表、结构完成合同和保底页                                                                                           | 本幕编辑合同                                              | 两个独立幕定义                                 | 重写世界书剧情                                                                      |
| `GalMainStory/episodes/episode02/`         | 第二集元数据、三幕触发与 lore order                                                                                                | 三个幕定义                                                | 第二集模板                                     | 跨日结算和正文措辞                                                                  |
| `GalMainStory/episodes/episode03/`         | 第三集元数据、三幕整天触发、角色映射与 lore order                                                                                  | 三个幕定义、改编证据包                                    | 第三集模板                                     | 改写共享运行时                                                                      |
| `GalMainStory/episodes/episode04/`         | 第四集元数据、首日整天与次日两次触发、选择与收敛式下一幕变体                                                                       | 三个幕定义、选择连续性提示                                | 第四集模板                                     | 建立独立分支运行态                                                                  |
| `GalMainStory/scenes/index.ts`             | GAL 场景 manifest                                                                                                                  | 背景 ID                                                   | 资源路径与 alt                                 | 幕时间线                                                                            |
| `GalMainStory/characters/*.ts`             | 单角色别名、人物 lore、多立绘与表情资源                                                                                            | 角色素材和世界书条目                                      | 可注册角色模块                                 | 当前幕是否可用                                                                      |
| `GalMainStory/characters/index.ts`         | 角色注册、说话人匹配与立绘查询                                                                                                     | 独立角色模块                                              | 角色/立绘查询 API                              | 剧情出镜判断                                                                        |
| `GalMainStory/portraitRules.ts`            | 解析场景与角色唯一绑定的立绘                                                                                                       | 当前幕场景立绘规则                                        | 必选立绘 ID 或无绑定                           | 选择剧情镜头                                                                        |
| `GalMainStory/storyTextExtraction.ts`      | 从模型标签输出中结构化抽取正文                                                                                                     | Tavern Assistant 原文                                     | 受支持容器内的可播放文本                       | 校验逐行演出字段                                                                    |
| `GalMainStory/storyPresentation.ts`        | 将 AI 正文与可选演出字段归一为合法逐页 cue                                                                                         | 标签正文、当前幕素材表与立绘绑定                          | 正文与代码补全的演出 cue                       | 改写剧情语义或角色资源                                                              |
| `GalMainStory/storyCg.ts`                  | 校验多触发组/多帧 CG 配置，按场景内零基页序号的前/后边界解析组并提供帧游标                                                         | `presentation.cgShots`、已接受正文 cue                    | 当前页后的 CG 组、帧或空                       | 猜测台词语义、集数分支或状态结算                                                    |
| `GalMainStory/GalCgPage.tsx`               | 预载组内帧，只暴露当前帧并渲染交叉淡化、进入和退出状态                                                                             | 已解析 CG 组、帧游标、资源、裁切和转场                    | 无对话框的多帧全屏 CG                          | 翻页、存档或剧情结算                                                                |
| `GalMainStory/GalMainStory.tsx`            | 加载/错误/保底、历史回放、GAL 播放及派生 CG 组的本地帧游标/淡出编排                                                                | Store、演出 cue、场景/角色 manifest、CG 定义              | GAL 画面、CG 逐帧显隐与翻页意图                | 选择数据和持久化                                                                    |
| `GalMainStory/GalChoicePanel.tsx`          | 三项生成候选、第四项自由输入入口及独立同框输入页                                                                                   | 当前幕候选、已存选择、提交回调                            | 选择 UI 与玩家意图                             | 生成候选或推进剧情                                                                  |
| `GalMainStory/StoryHistoryArchive.tsx`     | 候选重生成、采用、回放和删除                                                                                                       | 各幕楼层档案                                              | 版本管理意图                                   | 删除宿主聊天楼层                                                                    |
| `GalMainStory/storyRawArchive.ts`          | 关联幕、楼层与 Tavern Assistant 原文并分页                                                                                         | 剧情档案、messagesave                                     | 只读原文阅读模型                               | 归一化或改写正文                                                                    |
| `GalMainStory/RawStoryHistoryDialog.tsx`   | 按幕、版本和页展示 AI 原文                                                                                                         | 只读原文阅读模型                                          | 阅读器选择状态                                 | 修改消息或采用楼层                                                                  |
| `GalMainStory/galAssets.ts`                | 共享 GAL 窗口素材                                                                                                                  | GALBOX 文件                                               | 窗口/翻页资源路径                              | 角色资产                                                                            |
| `GalMainStory/LayeredPortrait.tsx`         | body、mask、眼嘴图集和共享动画渲染                                                                                                 | rig、表情、当前发言状态                                   | 分层立绘画面                                   | 选择说话人或结算                                                                    |
| `save/snapshot.ts`                         | 严格 schema v4 快照、完整玩家资料与剧情楼层签名一致性                                                                              | Game/Player/Card/Skill store、消息镜像                    | 本地/宿主存档数据                              | v3 及更早迁移                                                                       |
| `savesolt/SaveSlotModal.tsx`               | 存档槽位读写、删除和状态提示                                                                                                       | `gameSaveApi`                                             | 槽位操作意图                                   | 修改快照内容                                                                        |
| `message/floor0Mirror.ts`                  | 文件对话档写入成功后，把同一份规范化 MessageArchive 非阻断地旁路镜像进既有 `chat[0].extra` 自有命名空间                            | MessageArchive、Tavern Helper 楼层接口                    | `__tolove_message_archive_mirror_v1`           | 创建/删除楼层或改变文件存档权威                                                     |
| `messagesolt/index.ts`                     | Tavern 文件消息镜像桥                                                                                                              | `MessageRequest`、本地文件接口                            | MessageArchive 文件                            | 真实宿主消息楼层                                                                    |
| `components/ContextPreviewModal.tsx`       | 快照/原文/上下文/玩家 Persona 阅读、总结审查与手动按钮禁用态                                                                       | 本地预览、摘要 archive/runtime、API 开关                  | 数据阅读与人工审查意图                         | 绕过 API 开关或直接调用剧情生成                                                     |
| `components/SystemSettingsModal.tsx`       | 记忆 API、固定记忆层级说明、模型拉取与连接测试                                                                                     | `config/openaiCompatible`、summary policy                 | 本地设置意图、调度刷新                         | 摘要解析或游戏存档                                                                  |
| `config/openaiCompatible/defaults.ts`      | 默认值、`/v1` 校验、请求地址和脱敏投影                                                                                             | 用户配置                                                  | 规范化配置与安全视图                           | 浏览器存储或网络请求                                                                |
| `config/openaiCompatible/storage.ts`       | OpenAI 兼容配置的浏览器长期保存                                                                                                    | 规范化配置、`localStorage`                                | 配置读写/清空                                  | GameSnapshot 或消息                                                                 |
| `config/openaiCompatible/client.ts`        | `/models`、`/chat/completions` 请求、响应解析和连接探测                                                                            | API 配置、记忆提示                                        | 模型列表、文本结果或显式错误                   | 自动选择摘要时机                                                                    |
| `data/storyLore.ts`                        | 读取关闭条目并武装下一次原生扫描副本；剧情请求级清空 Persona Lore 并在所有退出路径停止钩子                                         | 稳定 order/名称、世界书条目、扫描选项                     | 一次性 World Info 钩子                         | 修改已保存世界书或其他 Lore 来源                                                    |
| `data/worldbook.ts`                        | 世界书读取、扫描对象构建和显式诊断桥                                                                                               | 游戏上下文、TavernHelper                                  | 显式读/诊断能力                                | 剧情条目选择                                                                        |
| `data/lore-books/*.txt`                    | 剧情与人物世界书的人工恢复文本                                                                                                     | 已校对剧情与人物资料                                      | 待导入的纯文本恢复源                           | 运行时扫描和状态                                                                    |
| `verify-player-persona.cjs`                | PlayerProfile 请求级覆盖/兜底注入与禁止宿主 Persona 接管的合同检查                                                                 | `playerPersona.ts`                                        | 定向校验结果                                   | 证明真实 Tavern 最终提示或普通卡片显示                                              |
| `verify-episode03.cjs`                     | 第三集注册、身份、lore、场景资源与 fallback 合同检查                                                                               | 生产剧集、角色/场景注册表、恢复源                         | 定向校验结果                                   | 证明真实 Tavern 扫描或剧情质量                                                      |
| `verify-episode04.cjs`                     | 第四集注册、选择投影、存档恢复、fallback 变体和 GAL 素材合同检查                                                                   | 生产剧集、选择档案、恢复源、界面资源                      | 定向校验结果                                   | 证明真实 Tavern 扫描或人工观感                                                      |

## 权威状态

- 数值、日期、事件和当前幕以 Zustand + 存档为权威。
- `DateModule` 只从 `App` 接收权威 `gameStore.date` 和投影后的
  `specialDates`，并用它们初始化组件本地的双月浏览游标；翻页只改变这次打开期间的显示月份，点选只改变这次打开期间的本地选中日期，关闭再打开会回到游戏当前月与下月，不进入 Zustand、快照或主线。它不直接查询
  `GalMainStory` 的分集日期，主线打开时会直接关闭，因此不会建立第二套日程或占用规则。
- 特技权威状态位于
  `skilllogic/skillStore.ts`，存档只保存 EXP、学习历史和学期实践提交；节点状态与当前实践集合由图和最后一次提交派生。面板关闭会丢弃尚未提交的实践草案，但不会丢失已取得技能或已提交配置。技能效果当前只是说明文字，不能称为已作用于游戏结算。
- 第一集 event ID 和两个 act ID 保持不变；第二集 event ID 为 `main.engagement-cancellation-2008-04-09`，第三集 event
  ID 为 `main.love-triangle-user-2008-04-11`，第四集 event ID 为
  `main.love-apron-user-2008-04-15`。旧的梨子主角版第三集 ID 不再复用，避免旧采用楼层被误认成当前剧情。项目仍在开发期，旧存档不兼容；schema
  v2 的运行游标、楼层和消息都用稳定的 `eventId + actId` 关联，幕序号只在显示时由模板推导。
- 当前地图不另存一份并行状态，而是由 `currentLocationId` 经 `getMapForLocation()`
  唯一推导；因此存档恢复地点后会自动恢复对应地图。跨地图按钮只把地点切到目标地图入口。
- 地图边缘控件的布局契约为：学校“街”护法在左、档案在右；彩南町“学校”护法在右、档案在左；两者中心线镜像对齐。护法的圆形预览和恶魔图形均可点击，反馈不覆盖透明矩形区域。三档横屏尺寸的最新调整等待人工重新验收，不能沿用此前被撤回的通过结论。
- 第一集剧情使用真实 `出包王女` 世界书中两条保持关闭的条目：第一幕 `order 150` / `剧情第一集·第一幕`，第二幕 `order 151`
  / `剧情第一集·第二幕`。人物条目依次为菈菈 `order 100`、春菜 `order 101`、美柑 `order 102`、梨子
  `order 103`。第二集三幕使用 `order 152/153/154`，第三集三幕使用 `order 155/156/157`，第四集三幕使用
  `order 159/160/161`；`order 158` 不属于当前生产注册。每次生成只扫描当前幕剧情条目及该幕登记的人物条目。代码按稳定
  `order` 和名称只读验证，并仅在下一次原生 World
  Info 扫描中启用这些条目的副本；已保存条目的关闭状态不变。本地 TXT 只是恢复源，不进入 bundle。
- 当前主线剧情 preset 实际激活的其他世界书可以补充人物和长期事实，但不能覆盖剧情世界书当前小节。代码不会另写 opening/ending 或替缺失、损坏的世界书编造剧情答案；此处只描述主线
  `generate()` 链，不适用于独立使用内置提示词的赛菲画像。
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
  `aquarium`；前者复用已登记街道素材，后者使用实际水族馆背景 `/artsource/backgrounds/bg029_a.png`。资源映射只由
  `scenes/index.ts` 管理，不进入世界书。
- 四集当前运行时与人物恢复源统一采用 User 主角、与结城家共同生活和梨子青梅竹马的映射；不存在男性梨斗，也不把原作男主关系转交给梨子。真实 Tavern 世界书仍需用当前恢复源替换
  `order 100-103`、`150-157` 与 `159-161`，并移除或禁用旧
  `order 158`；完成这一步并取得真实扫描与生成证据前，只能证明本地合同一致，不能宣称酒馆实机连续性通过。
- `TavernHelper.generate()`
  返回值只证明生成 API 路线；当前不会新增真实 user/assistant 聊天楼层，也没有触发 shujuku/database。文件对话档写入成功后，独立 sidecar 适配器会尝试把同一份 MessageArchive 写入既有
  `chat[0].extra.__tolove_message_archive_mirror_v1`；该尝试不参与文件存档成败，真实 Tavern 保存/刷新仍待实机验证。
- 保底正文必须显式标记为 `fallback`，不能冒充宿主成功。
- “目录”上下文预览只读取本地 Zustand 和 messagesave；它能证明本地投影与生成调用使用同一选择逻辑，不能证明实际 World
  Info 注入、宿主 hidden floors、MESSAGE_SENT、shujuku 或数据库行为。
- 记忆 API 配置和临时模型候选不属于 GameSnapshot 或 MessageArchive。设置页的“拉取”调用用户填写的 OpenAI 兼容地址；浏览器直连失败时可经 SillyTavern 的
  `/api/backends/chat-completions/status`
  只读代发，但不写宿主设置、密钥库或消息。没有真实可用地址的证据时，不得宣称副 API 已接通。模型列表失败不得抹掉用户手填的模型名称。

## 当前接通标签

`真实 generate API 已实现；本地 messagesave/file 镜像已实现；#0 extra 旁路镜像源码与本地合同已实现、真实宿主生命周期未验证；真实 hidden host floors、shujuku、原生宿主消息和数据库未接通。`

分链路口径：

- 主线生成链：按当前幕只读验证关闭的剧情/人物条目，注册一次性 `WORLDINFO_ENTRIES_LOADED`
  钩子，仅在下一次扫描中启用所选副本，随后调用 `TavernHelper.generate({ preset_name: 'in_use' })`。连续性通过
  `overrides.chat_history` 携带最多 6 条已保存主线 user/assistant 消息；内部 PlayerProfile 通过本次请求的 Persona
  Description 覆盖或 depth-0 system 注入保持主角权威，当前酒馆 `{{user}}` 只作为传输别名。该链不调用
  `/persona-set`，不改全局用户名或当前 Persona，普通卡片仍由酒馆原生用户设定管理；生成结束后无论成功失败都停止一次性钩子。
- 天鹅绒房间链：首屏“是 / 否”由本地 UI 结算；选择“否”不调用模型，选择“是”才以内部启动信号请求第一道 AI 问题和三个候选回答。之后每轮调用
  `TavernHelper.generateRaw()`，`ordered_prompts` 只含内置 system prompt、组件内存历史和本轮玩家回答；严格解析
  `profile_state + question + 三个 @选项`，完成回合则要求第六阶段的 `closing + personality + report`。运行时不读取 Izumi
  JSON、不采用当前酒馆 preset、不扫描世界书、不创建宿主楼层或存档。画像结束只向登记草稿回填
  `personality`；首次的“否”和画像完成都先进入不可跳过的梨子五页叫醒过场，再汇入登记事件并由最终确认统一保存。真实模型是否完整遵守仍需实机验收。
- 宿主消息链：不创建真实 hidden user/assistant floors；仅有一个不阻断文件存档的既有 `chat[0]` namespaced extra
  sidecar 写入路径。它不是原生聊天消息发送，也不触发 `MESSAGE_SENT`。
- 插件/数据库链：未接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- UI/镜像链：游戏内 messagesave/file bridge 仍是存读档权威；`chat[0].extra`
  当前只是最新一次成功文件对话档的旁路副本，不参与读档、删除或回退，不冒充宿主聊天权威或严格同层 v2 权威。
- 上下文预览链：本地状态演示；当前生成时可显示实际调用投影，空闲时只显示最近原文窗口，不升级任何宿主/插件接通标签。
- 记忆 API 链：设置 UI、固定 6 消息窗口与 2/5 批次、600/1200 字上限、自动存档后调度、`{API 基址}/chat/completions`、纯文本响应规范化、本地 JSON 候选封装、浏览器候选缓存、审查、失败重试和已拒绝候选重新生成已经实现。真实外部接口成功仍待用户复验；Tavern 记忆侧档、已接受摘要的剧情上下文注入和 shujuku 仍未接通。
