# 艾尔登特当前状态

```yaml
status: implementation_complete_human_review_pending
current_loop: tokimemo4-special-skill-progression-and-map-drawer
authorized_by: user_special_skill_panel_mobile_fidelity_and_unlock_flow_2026-07-20
authorized_scope:
  - rebuild the special-skill data and prerequisite graph from public Tokimeki Memorial 4 references
  - begin with no learned or practiced skills and enforce sequential AND prerequisites
  - earn skill EXP from accepted AP actions, spend it during the current term, and commit at most six practiced skills
  - persist skill progression, reset it with a new session, and expose concise text state
  - render a real tree with state-aware edges and a generated nostalgic paper background
  - keep portrait and landscape drawers strictly inside the map frame
forbidden_scope:
  - apply skill effects to attributes, AP, affection, action success, or story settlement
  - fabricate license-exam success or claim an exam system is connected
  - change story prompts, worldbook selection, Galgame presentation, or Tavern generation
  - create host messages or connect MESSAGE_SENT, shujuku, ACU, plugins, or databases
  - claim behavior or human acceptance from source checks, builds or inline verification
connection_state: real_local_skill_progression_read_write_and_save
overall_connection_label:
  真实本地特技进度已接入行动 EXP、学习、学期实践提交、存档恢复与文本回读；技能效果和驾照考试尚未接入
human_review: pending_special_skill_ui_and_progression_acceptance
prior_pending_reviews:
  - worldbook-authoritative-ai-directed-presentation
  - dual-map-landscape-overlay-responsiveness
  - story-progression-character-availability-and-raw-reader
  - merge-local-scenes-with-remote-story-display
  - ep01-act1-background-sequence
  - haruna-cross-page-blink-continuity
completed_human_reviews: []
next_loop: human_review_special_skill_tree_mobile_drawers_and_term_flow
```

## 当前增量：特技树、学期学习与 map 内手机抽屉

- `data/skills.ts` 现有 127 项，分类数量为
  `25/24/20/26/24/8`；130 条前置边在加载时检查重复 ID、缺失前置、重复前置、成本和环。
- `skilllogic/` 单独负责图、日期、EXP、学习、六槽实践、快照校验和 Zustand store。初始普通根节点为
  `available`，没有技能默认为已取得或实践。
- 每次被 `settlePlayerAction()` 接受的 AP 行动获得 1
  EXP；拒绝行动不增加。该值是本项目对“指令积累经验”的显式适配常量，不冒充原作未找到的精确换算公式。
- 第一次管理窗口为
  `2008-05-09`，之后按学期开放；当前窗口维持到下学期开始，漏过的旧学期不能在同一天连续补交。学习与实践配置分离，所有前置都是 AND，实践最多 6 项且每学期只提交一次。
- 技能快照是 V1 兼容可选顶层字段。新存档保存 EXP、学习历史和学期提交；旧存档缺字段时重置技能进度，坏字段会显式拒绝。自动存档订阅技能 store，新游戏统一重置。
- `SpecialSkillPanel` 使用真实四态和状态连线，依赖深度标为 `STEP`
  而不是伪等级。驾照节点显示“通过驾照考试取得”，不会用 EXP 学习。
- 面板仍是 `.map-section` 的直接子级；技能打开时 map 框获得独立可用高度。`390x844` 使用同框底部抽屉，`844x390`
  使用同框右侧抽屉，遮罩可点、`Esc` 可退、焦点返回触发节点，关键触控目标不小于 44px。
- `artsource/SkillUi/` 只保留最终 `skill-menu-paper-bg.png`。CLI fallback 临时环境和 Playwright 临时文件已删除。
- 技能效果尚未接到属性、成功率、AP、好感或剧情结算；驾照考试没有运行时入口。这两点不属于本轮完成声明。

| Check                              | Status  | Evidence                                                                                                              |
| ---------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| Skill graph/data smoke             | passed  | 127 项、六分类、130 边、无环；根节点 available，前置/EXP/六槽/单次提交与跳学期校验通过                                |
| Accepted-action EXP and save smoke | passed  | 接受行动 `0 -> 1`，随后拒绝行动保持 `1`；技能快照 `42 -> reset -> restore 42`，旧档恢复为 `0`                         |
| Changed-file ESLint                | passed  | 本轮 TS/TSX 文件局部 ESLint 无 error                                                                                  |
| Full subtree TypeScript            | failed  | 仍被未改动全局声明、VueUse Web Bluetooth 类型和 `global.d.ts` 重复声明阻断；本轮组件错误已修复，Webpack 类型构建通过  |
| Development build                  | passed  | `pnpm build:dev` 成功，技能背景进入 fresh inline artifact                                                             |
| Browser matrix                     | passed  | `1440x900`、`390x844`、`844x390` 的真实 game-frame；127 项、树线、抽屉几何、背景请求、遮罩、Esc、焦点与 44px 热区通过 |
| Standalone console                 | passed  | 除缺少 Tavern Helper 存档事件接口的预期隔离错误外，无新增 console error 或资源失败                                    |
| Production build / inline check    | not run | 最终文档完成后运行                                                                                                    |
| Skill effects / license exam       | not run | 本轮明确未接入                                                                                                        |
| Human acceptance                   | not run | 等待用户审查                                                                                                          |

### 人工复现

1. 新游戏在 4 月 7 日打开特技，确认 EXP/取得/实践均为 0；根技能只显示可学习，高阶技能锁定，操作显示“当前不可学习”。
2. 在手机竖屏点击任一节点，确认详情从 map 框底部打开；点暗色遮罩或按 `Esc`
   后焦点回到原节点。手机横屏重复操作，确认详情从 map 框右侧打开。
3. 推进到 5 月 9 日并积累 EXP，依次学习一个根技能和其后继；确认后继在根技能取得前不能学习，学习后 EXP 扣除。
4. 从已取得技能中选择不超过 6 项并确定配置；关闭重开、自动存档读取和新游戏重置后分别检查实践项保留、存档恢复和全清空。
5. 查看轻便摩托驾照，确认只能看到考试取得提示；检查属性和行动结果，确认本轮没有暗中应用技能效果。

## 保留的既有待审范围：世界书权威与 AI 导演式演出单

- 第一集剧情世界书已经按幕拆开：第一幕扫描 UID `101` / `剧情第一集·第一幕`，第二幕扫描 UID `102` /
  `剧情第一集·第二幕`，不再把两幕整条注入同一次生成；两幕都会同时扫描菈菈人物条目 UID `1`。
- prompt 要求 AI 每页生成
  `scene/focus/portrait/expression/effect`；解析器用当前幕素材表、角色注册表和具体立绘表情集合严格校验。
- prompt 动态提供当前幕真实立绘示例，并禁止把正在画面中或正在发言的已登记角色标为
  `focus=none`；这条规则对未来注册角色通用。
- 未登记人物可以用真实姓名或明确身份说话，并由现有 generic
  nameplate 显示姓名；他们不能带“临时角色”标签，也不能虚构 focus、portrait 或 expression。已登记但不在当前幕 cast 的角色仍会被拒绝。
- 每幕新增最少正文行数和必经场景顺序；第一幕少于 17 行或没有走完
  `space → school → schoolGate → home → washroom`，第二幕少于 23 行或没有走完
  `washroom → home → bedroom → rooftop → nightStreet → park → schoolRoad`，都会作为不完整正文拒绝，不需要 AI 输出完成标记。
- 重新生成按 `contextFloorIds` 只继承前面各幕当前采用楼层，不再把当前幕旧楼层送回模型续写。
- 已读剧情的每个候选楼层可删除；删除当前采用版会回退到剩余的最新可播放版，没有候选时取消采用。删除仅作用于游戏本地楼层及其 messagesave 原文。
- `characters/lala.ts`、`haruna.ts`、`riko.ts` 独立管理别名、人物 lore、姓名牌和多套立绘；当前 `a-f`
  文件后缀只存在于角色资源模块内部。
- `director.ts`、`lalaArrival.ts`、`LalaExpression`、`lalaExpression`
  和旧正文格式已直接删除；项目未发布，因此不提供兼容适配。
- React 播放器直接消费 AI cue；背景、出镜角色、立绘、表情与效果不再由页数、关键词或角色特判推断。
- 两幕世界书已撤销不属于 TV 第 1 话的旧校舍天台双向告白、保护春菜和校园疏散，恢复太空冷开场、校门退缩、回家电话、泡澡中爆炸、卧室说明、足球解围、屋顶逃跑和春菜遛狗目击。萨斯丁在公园乘飞船登场并被真空君卷走，次日误告白触发婚约；不再使用错误的婚约后太空收尾。代表性台词只以短句意图约束，不大段照抄。
- 第一集地点已拆成独立语义场景槽位，并从 `D:\出包女王素材库\Texture2D` 选择九张 `1024x512` 背景复制到项目。夜间遛狗使用
  `nightStreet/bg009_b`，次晨上学使用 `schoolRoad/bg006_a`，不再用一个标签掩盖两个时间段。
- 剧情世界书不再硬匹配某句结尾正文，只检查关闭状态、根标签和非空正文；用户追加“不写下一集内容”不会再被判为正文不完整。人物条目仍可保留可选身份标记。
- 按用户要求，本增量未运行类型检查、构建、脚本验证或浏览器验证；下方内容是历史记录，不是当前实现证据。

## 历史记录：已被当前增量取代的导演模块重排

本轮把第一集从单个 `lalaArrival.ts`
和散落的 UI/service 判断中拆成可审查的集、幕、场景、角色与导演模块。现有 event/act/floor/message ID、`lalaExpression`
存档字段、AP/日期结算、prompt、世界书选择和宿主接通状态保持不变。

- `episodes/episode01/acts/act01.ts` 与 `act02.ts` 分别保存本幕元数据、场景时间线和保底页。
- `episodes/episode01/director.ts` 集中背景、effect、菈菈表情推断和菈菈/春菜/梨子出镜 cue。
- `scenes/index.ts` 统一背景 ID、路径和 alt；`characters/index.ts` 统一三名角色的姓名牌、别名、表情和 rig。
- `storyRegistry.ts` 目前只登记第一集；`lalaArrival.ts`、`galAssets.ts` 只保留旧 import 兼容。
- `verify-story-modules.cjs` 检查稳定 ID、两次行动触发、fallback、场景/角色登记和实际资源存在性。

| Check                              | Status  | Evidence                                                                                     |
| ---------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| Story module contract              | passed  | `pnpm run verify:story`；稳定 ID、AP=1/0、lore、fallback、director cue、资源与兼容门面通过   |
| Changed-file ESLint                | passed  | 本轮 TS/TSX/CJS 文件无 lint error                                                            |
| Full subtree TypeScript            | failed  | 仅剩未改动 `stores/characterStore.ts:24` 的既有 `string \| null` 传给 `Set<string>.has` 错误 |
| Production build                   | passed  | 所有子任务结束后最终运行 `pnpm build`；`dist/webgame-ui/index.html` 为 488827 bytes          |
| Exact inline artifact verification | passed  | legacy entity/currency/replacement/syntax error 均为 0，单 inline script                     |
| Artifact identity                  | passed  | SHA-256 `EF43DC856706E67502CC7C0DFE76B3FF3B07B03571D0C30D12044FC9B3DF89E6`                   |
| Real Tavern generation             | not run | 未调用真实 `TavernHelper.generate()`，未复验 World Info 一次性扫描                           |
| Old save / two-act behavior        | not run | 等待人工读取旧存档并完成两次行动、两幕、背景和立绘回归                                       |
| Human acceptance                   | not run | 等待用户审查                                                                                 |

当前连接标签不升级：生成 API、一次性 World Info 扫描实现和本地 messagesave 镜像保持原状；hidden host floors、
`MESSAGE_SENT`、shujuku/ACU 和数据库仍未接通。

### 人工复现

1. 读取重构前的第一集存档，确认当前幕、采用楼层、AI 原文和页位置仍可恢复。
2. 新游戏在 2008-04-07 完成第一次有效行动，确认进入第一幕；完成第一幕后返回自由行动，再完成第二次行动进入第二幕。
3. 确认第一幕场景依次为 `space -> school -> schoolGate -> home -> washroom`，第二幕依次为
   `washroom -> home -> bedroom -> rooftop -> nightStreet -> park -> schoolRoad`。
4. 确认菈菈在第一幕太空冷开场和第二幕主要段落使用登记立绘，春菜与梨子各自使用独立角色模块；未登记人物只显示实名通用名牌。
5. 在真实 Tavern 中各生成一幕，确认选中的世界书保存条目继续保持关闭，生成后正文、fallback、重新生成和原文阅读器行为不变。

### 已知风险

- 第二集不能只靠新增目录接入；store 当前正文投影、存档恢复、历史目录、重新生成上下文和文本导出仍需按 `eventId`
  分集，这属于下一轮独立范围。
- 全量 TypeScript 尚被未改动的 `characterStore.ts` 既有空值类型错误阻断；本轮改动文件没有剩余 TypeScript 报错。
- 构建、lint 和 contract check 不能证明剧情语义、视觉节奏、旧存档或真实 Tavern World Info 行为。

## 保留的既有待审范围：双地图与默认 PC 嵌入菜单

用户曾于 2026-07-19 回复“我校验通过”，但随后提供了手机横屏重叠与默认 PC 嵌入态菜单过小的反例；旧通过结论已被后续反馈覆盖。三个目标尺寸的几何检查没有覆盖 SillyTavern 默认 PC 嵌入态，因此不能证明该状态的菜单比例。本记录只审查地图切换控件与相关布局，不接受或替代其他主线范围。

- 彩南高中使用 `map.png`，左侧 `map_next02.png` 前往彩南町；角色档案在右侧镜像位置。
- 彩南町使用 `map1.png`，右侧 `map_next01.png` 返回学校；角色档案切到左侧镜像位置。
- 护法完整可见图形可点击；反馈沿 PNG Alpha 图形描边，没有矩形毛玻璃底、整图模糊、整图阴影或整体缩放。
- 彩南高中校门最终坐标为 `(0.8, 3.2)`，位于护法右下方的道路入口，不再与护法或菜单重叠。
- 地图由当前地点推导，切图不消耗 AP，也不新增独立存档字段。
- `game-frame` 高度 `481-700px` 时，日历为 `82px`、护法为 `66px`、档案为 `40x96px`；菜单不再固定为
  `52px`，而是按实际宽度使用 `clamp(52px, 7.5cqw, 66px)`。
- 手机横屏档以 `game-frame` 高度 `<=480px` 为准：日历 `52px`、护法 `44px`、菜单 `40px`、档案
  `30x72px`；护法和档案共同下移到 `56%` 高度，保持左右镜像同轴并避开左上日历和左下菜单。

| Check                                 | Status  | Evidence                                                |
| ------------------------------------- | ------- | ------------------------------------------------------- |
| Final development compilation         | passed  | 最新菜单规则后运行 `pnpm build:dev`，Webpack 成功       |
| Port 8000 default PC embedded runtime | passed  | 地图框 `910x546px`，菜单 `66x66px`，左/下边距均为 `8px` |
| Port 5500 / fullscreen / other sizes  | not run | 用户明确限制本轮不得验证这些范围                        |
| Human visual review                   | not run | 等待用户确认默认 PC 嵌入态菜单比例                      |

本次地图调整不改变生成链、宿主消息链、插件/数据库链或 UI messagesave 镜像的既有接通标签。

## 仍待人工验收的既有范围

- 主线当前幕从已采用正文进度恢复；非活动事件存档不再无条件把 `mainStoryActIndex` 清零。
- 恢复或继续游戏时会幂等检查 4 月 7 日的 AP 阈值，补回已经到点但尚未进入的幕；普通正确的 `AP=1 / actIndex=1`
  状态仍等待下一次行动触发第二幕。
- 角色卡继续保存在 Card
  store，出现位置由独立规则同步：梨子和春菜初始可见，菈菈完成第一集后可见，梦梦、唯和小暗当前锁定；未知导入角色默认可见。
- AI 原文通过既有楼层 `messageIds` 关联 Tavern
  Assistant 消息，按幕和楼层版本组织，并对原字符串做只读分页。已读目录中的每个楼层可直接打开其原文版本。
- 没有修改提示词、世界书、Tavern 宿主消息、生成协议、shujuku、插件或数据库链。

## 验证证据

| Check                                | Status  | Evidence                                                     |
| ------------------------------------ | ------- | ------------------------------------------------------------ |
| Source formatting / lint             | not run | 用户要求全部检验交给人工                                     |
| TypeScript / development build       | passed  | 地图尺寸调整后整包 `pnpm build:dev` 成功；不等于故事行为验收 |
| Production build                     | not run | 未运行 `pnpm build`                                          |
| Browser / Playwright interaction     | not run | 未启动页面或浏览器自动化                                     |
| Save/load AP progression             | not run | 等待人工在实际存档流程中验收                                 |
| Character visibility                 | not run | 等待人工检查地图、场景、档案和文本态                         |
| Raw reader act/version/page behavior | not run | 等待人工检查具体楼层选择与分页                               |
| Raw message immutability             | not run | 等待人工比较保存消息与重新生成上下文                         |
| Inline artifact verification         | not run | 未运行 `verify-inline-bundle.mjs`                            |
| Real Tavern generation               | not run | 未调用真实 Tavern Helper 生成                                |
| Human acceptance                     | not run | 等待用户审查                                                 |

## 当前接通状态

- 地图 UI 源码和开发产物已更新；故事进度、角色出场和原文阅读器仍没有新的运行时验收证据。
- 生成链、一次性 World Info 扫描链和游戏 messagesave 镜像保持原实现，本轮未验证也未改动其协议。
- 宿主消息链仍未创建 hidden user/assistant 楼层。
- 插件/数据库链仍未接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- 原文阅读器只读取游戏保存的 Tavern Assistant 消息，不新增消息，不修改 prompt history，也不代表宿主聊天权威。

## 人工复现

1. 开始新游戏，确认地图、地点提示、附近角色与角色档案中只有夕崎梨子和西连寺春菜，菈菈、梦梦、古手川唯和小暗都不出现。
2. 完成 4 月 7 日第一集两幕后，确认菈菈开始出现在校园；梦梦、古手川唯和小暗仍保持隐藏。
3. 第一幕完成后在 `AP=1`、日期仍为 4 月 7 日时保存并读取，确认已读第一幕和当前幕进度保留，且不会重复触发第一幕。
4. 读取上述存档后执行第二次有效行动，确认 AP 到 0 时进入第二幕 AI 正文，而不是直接跨到 4 月 8 日。
5. 打开已读剧情，分别从总入口和具体楼层的 `AI 原文`
   按钮进入，确认可以切换幕、生成版本和单页，并且具体楼层按钮会预选对应版本。
6. 检查长原文一次只显示一页，上一页/下一页和页数正确；把各页按顺序拼接后应与原 Assistant 消息完全一致。
7. 关闭阅读器并重新生成候选楼层，确认已保存原文、采用楼层以及用于连续性的历史消息没有因阅读、切页或切版本发生变化。

## 已知风险

- 本轮没有运行格式化、lint、生产构建或 inline
  artifact 检查；开发构建与边界测量只能证明本地实现可编译且几何不重叠，最终观感仍需人工确认。
- 角色出场规则当前只覆盖已有第一集进度；梦梦、唯和小暗在未来剧情事件落地前保持锁定。
- 恢复补触发依赖存档中的日期、AP、已采用幕和完成事件记录彼此一致；异常或手工修改过的存档仍需单独判断。
- 原文分页按字符上限优先寻找段落或句末断点，只影响阅读视图，不是 GAL 正文解析或消息迁移。
- 背景顺序、春菜跨页眨眼以及前次合并后的真实 Tavern 扫描仍是前序待验收项，本轮不自动接受它们。

本状态更新后只剩审查邀请；邀请发出后冻结修改。
