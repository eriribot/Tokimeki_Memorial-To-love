# Kimi 交接：地图菜单“数据”资料页前端重做

> 工作目录：`D:\webgame\tavern_helper_template-main\src\webgame-ui`
>
> 当前状态：审核退回后的实现已收口。资料页仍挂在现有地图框内，但 stage 当前是 `100% × 100%` 覆盖 `.map-section`，授权背景使用 `object-fit: fill`，不是上一版文档所写的 1:1 `contain`。主角状态槽已收敛为 3 个运行时素材，六轴雷达已收敛为精确原值 + 单色五环 + 阶段多边形；副 API 未开启时手动小总结是灰色 disabled。用户明确禁止本轮测试，所以构建、Lint、TypeScript、游戏页面浏览器、截图、inline 和 API 均未运行；本轮只用浏览器查阅了《心跳回忆4》攻略阈值，资料检索与草图都不算运行时验收。当前为 implementation complete / human review pending。

## 1. 先读这些约束

1. 用户明确说明 `D:\素材\出包女王素材库` 是已取得日方 FuRyu 授权的项目素材，可在本项目内放心使用。素材库原件只读，复制到仓库时保持非破坏性。
2. 主角属性页绝对不能使用结城梨斗的图片、立绘、头像或其衍生资源。当前实现选择了完全不显示主角图片；重做时也必须守住这条红线。
3. 不允许把其他男性角色、梨斗剪影或官方男主图包装成“自定义主角”。如果需要视觉锚点，只能使用中性图形、玩家名字、颜色或纯 UI 装饰。
4. 角色详情资料必须来自当前 Store/角色卡，没有权威数据时显示“未登记”，不能凭原作常识补写。主角页的生日、身高、体重、血型当前是明确固定的四条“未登记”展示，不代表新增了玩家资料字段。
5. 锁定角色不能通过按钮标签、alt、DOM dataset、`render_game_to_text()` 或详情内容泄露姓名。
6. 本轮只是本地 Zustand 状态资料页，不代表 Tavern host floor、shujuku、ACU、插件或数据库接通。
7. `MODULES.md` 是当前模块权威；`ALDENT_STATUS.md` 是当前证据和人工审查边界；`progress.md` 只是历史。

## 2. 用户真正要的结果

- 地图菜单“数据”打开同一个黄色 game-frame 内的资料页，不占浏览器全屏，也不启用 archive-only 视口布局；资料 stage 直接以 `100% × 100%` 覆盖现有 `.map-section`。
- 授权 `bg_data1.png` / `bg_data2.png` 原图为 1024×1024，但当前运行时使用 `object-fit: fill` 铺满地图框，不保留灰色侧边。资料页没有毛玻璃、卡片边框或面板阴影。
- 主角页不显示当前位置，也不显示梨斗或其他人物图。页面固定标题为“主角”，生日、身高、体重、血型四行固定“未登记”，另有体力心形槽、独立压力槽和零用钱。
- 体力与压力共用 `artsource/ui/archive/player-status/stamina-track.png`，分别使用 `heart.png` 与 `pressure-icon.png`，并以粉色 / 青色填充区分；3 个路径都经 `resolveAssetPath()`。`bg_data1.png` 保持唯一完整底图，官方书脊 `x=508–575` 原样露出；`bg_ht01.png` 只局部羽化覆盖左上旧字段，中心没有第二层书脊或 CSS 白页拼接。
- 主角六轴 SVG 雷达显示“文系 / 理系 / 艺术 / 运动 / 容姿 / 根性”，当前依次映射 `intelligence / intelligence / art / athletics / charm / athletics`。原始值保留 `0–999` 并直接显示；阶段显示为 `0–159=1`、`160–199=2`、`200–239=3`、`240–259=4`、`260+=5`，默认六维原值均为 `30`，所以初始均为阶段 1。画面只保留单色五层同心环、六条轴线和一个阶段多边形；`render_game_to_text()` 同时输出原始 `radar` 与派生 `radarStages`。不得据此扩展 `PlayerState`、`GameSnapshot` 或存档 schema。
- 阶段阈值参考《心跳回忆 4》[毕业后的进路](http://wikinavi.net/tokimeki4/index.php?卒業後の進路)中普通大学的 `160 / 200 / 240 / 260` 要求；这是设计参考，不是运行时验收。
- Persona 风格彩色五级雷达、菱形节点、中心 `MAX` 徽章和 risei 风格压力表都是已被用户否决的候选，不得从旧截图、旧文档或旧素材清单恢复。
- 角色档案使用官方 01–11 角色图标与锁定图；解锁条件沿用当前剧情出场规则。
- 解锁详情读取当前 CardStore 关系数值、类型、常去地点和简介。
- 支持返回列表、左右切换、键盘左右键、Escape 和显式关闭。
- 打开资料页时地图和底部 `Controls` 不可操作；`Controls` 仍保留在布局中并灰化，关闭后恢复。
- 底部重复 `StatPanel` 和用户角色卡文件/URL导入入口已经删除；默认角色所需 JSON 初始化必须保留。
- 现有地图侧边 `CharacterProfileModal` 不能被删掉或改成同一个入口。
- 桌面与 `844×390` 手机横屏都必须清楚可读。自动检查只证明没有溢出，不等于观感合格。

## 3. 官方素材在哪里

### 原始授权素材库

| 类型 | 原始位置 | 数量/尺寸 |
| --- | --- | --- |
| 主角资料背景 | `D:\素材\出包女王素材库\Texture2D\bg_data1.png` | 1 张，1024×1024 |
| 角色资料背景 | `D:\素材\出包女王素材库\Texture2D\bg_data2.png` | 1 张，1024×1024 |
| 主角页空白纸底 | `D:\素材\出包女王素材库\Texture2D\bg_ht01.png` | 1 张，1024×512；仅局部清除旧字段 |
| 角色解锁/锁定图 | `D:\素材\出包女王素材库\Sprite\icon_data01a.png` 至 `icon_data11b.png` | 22 张 |
| 选中光标 | `D:\素材\出包女王素材库\Sprite\cursor_data01.png` 至 `cursor_data11.png` | 11 张 |
| 详情翻页 | `D:\素材\出包女王素材库\Sprite\L_data.png`、`R_data.png` | 2 张 |
| 主角状态心形 | `D:\素材\出包女王素材库\Sprite\heart_anim_3.png` | 仓库内重命名为 `player-status/heart.png` |
| 体力槽底 | `D:\素材\出包女王素材库\Sprite\op_gauge2.png` | 仓库内重命名为 `player-status/stamina-track.png` |
| 压力状态图标 | `D:\素材\出包女王素材库\Sprite\op_bar3mute.png` | 仓库内重命名为 `player-status/pressure-icon.png` |
| 压力槽外框（已否决候选） | `D:\素材\出包女王素材库\Sprite\bar_waku.png` | 官方原件保留；当前未复制到 `artsource`、未接入运行时 |
| 压力槽填充（已否决候选） | `D:\素材\出包女王素材库\Sprite\bar.png` | 官方原件保留；当前未复制到 `artsource`、未接入运行时 |
| 官方 Data 图集参考 | `D:\素材\出包女王素材库\Texture2D\SpriteAtlasTexture-ADV_Data-1024x1024-fmt12.png` | 1 张，仅用于分析图集关系 |

Unity 导出还包含：

- `D:\素材\出包女王素材库\MonoBehaviour\DataController.json`
- `D:\素材\出包女王素材库\MonoBehaviour\DataDetailController.json`
- `D:\素材\出包女王素材库\MonoBehaviour\DataCharacterIcon*.json`

这些 JSON 目前只有 Unity GameObject/Script PathID 引用，没有组件字段、锚点或可直接照抄的布局代码。不能把它们描述成“已经拿到原版实现”。需要结合实际游戏截图、纹理 UV、SpriteAtlas 和目标 game-frame 重新还原布局。

### 已复制到仓库的素材

仓库位置：

`D:\webgame\tavern_helper_template-main\src\webgame-ui\artsource\ui\archive`

源码目录当前共 41 个文件：

- 背景/纸底 3 个；
- `a/b` 角色图标 22 个；
- 光标 11 个；
- 左右翻页 2 个。
- `player-status` 主角状态素材 3 个：`heart.png`、`pressure-icon.png`、`stamina-track.png`。

构建发布位置：

`D:\webgame\tavern_helper_template-main\dist\artsource\ui\archive`

原有 37 个文件的源文件、仓库副本和生产发布副本在上一候选中做过 SHA-256 对照，没有发现差异；新增 `bg_ht01.png` 的官方源与仓库副本 SHA-256 相同，3 个运行时 `player-status` 素材位于源码 `artsource`。已否决的 `pressure-frame.png`、`pressure-fill.png` 和临时 pressure-gauge/track/gradient 复制品已从 `artsource` 删除，官方原件仍在 `D:\素材`。本轮没有构建或核对 `dist`。所有运行时路径必须以 `/` 开头，并经过 `resolveAssetPath()`。

## 4. 当前代码控制点

| 文件/行 | 当前职责 |
| --- | --- |
| `data/menuAssets.ts:46`、`:50` | 地图菜单定义；“数据”从 placeholder 改成可用入口 |
| `components/MapMenu.tsx:14`、`:72` | `onOpenData` 属性和菜单点击分发 |
| `App.tsx:45`、`:62-65` | `isCharacterArchiveOpen` 状态与统一地图高度预算；资料页不再获得独立全屏高度 |
| `App.tsx:257-264`、`:341` | game-frame 尺寸与 `CharacterArchivePanel` 在 `.map-section` 内的挂载 |
| `App.tsx:346-376`、`App.css:137-176` | 底部只保留单列 `Controls`；资料页打开时保留布局但 inert/灰化 |
| `components/CharacterArchivePanel.tsx:40-50` | 六轴标签、雷达半径与五层显示比例 |
| `components/CharacterArchivePanel.tsx:65-70` | 把六个精确原值映射成五阶段多边形坐标 |
| `components/CharacterArchivePanel.tsx:73-155` | 3 素材共轨双状态槽、单色五层雷达、原值标签和无障碍阶段文本 |
| `components/CharacterArchivePanel.tsx:158-215` | `bg_ht01` 局部清底、固定“主角”、四条“未登记”、体力/压力、零用钱和六维 store 投影；没有人物图片节点 |
| `components/CharacterArchivePanel.tsx:225` | 11 槽角色列表、锁定/解锁图标与光标 |
| `components/CharacterArchivePanel.tsx:292` | 角色详情、资料字段、左右导航和返回 |
| `components/CharacterArchivePanel.tsx:381` | 顶层组件入口、选择、键盘、Escape、关闭状态、背景选择与视图挂载 |
| `components/CharacterArchivePanel.css:1-33` | stage 以 100% 宽高覆盖地图框、白色底和 `object-fit: fill` |
| `components/CharacterArchivePanel.css:274-316` | 体力/压力共用槽体、粉色/青色填充与同一官方 track 叠层 |
| `components/CharacterArchivePanel.css:337-388` | 单色五层雷达网格、单一阶段多边形、轴名和精确原值 |
| `artsource/ui/archive/bg_ht01.png` | 官方空白纸底；源/仓库 hash 一致，生产发布未验证 |
| `stores/playerStore.ts:4-6`、`:28-33`、`:36-48` | `999` 原值上限、`160/200/240/260` 阈值、五阶段 resolver 和共享六维投影 |
| `save/snapshot.ts:68-118` | schema-v2 玩家字段与 `999/100` 范围的严格恢复校验 |
| `artsource/ui/archive/player-status/*` | `heart.png`、`pressure-icon.png`、`stamina-track.png` 3 个运行时素材；当前仅确认源码存在，生产发布未验证 |
| `data/characterArchive.ts:7` | 官方归档素材根路径 |
| `data/characterArchive.ts:38` | 固定 01–11 槽位与当前角色 ID 映射 |
| `data/characterArchive.ts:52` | CardStore + 出场条件解析，以及锁定态去身份化 |
| `index.tsx:150-164` | `render_game_to_text()` 暴露精确 `radar`、阈值、上限和派生 `radarStages` |
| `GalMainStory/StoryHistoryArchive.tsx:72` | 修复不存在的 `gameStore.save.record`；现在读取 `activeSaveUuid` |
| `components/ContextPreviewModal.tsx:380`、`:418-430` | 手动小总结的当前失败任务判断、API 关闭灰色禁用态 |
| `memory/summaryRuntime.ts:566-582` | 仅让 running 或当前 save/source 匹配的 failed job 阻塞 |
| `stores/cardStore.ts:74`、`stores/characterStore.ts:72` | 保留 `addCardFromJSON()` 默认角色初始化；文件/URL导入已删除 |

当前文件规模：

- `CharacterArchivePanel.tsx`：471 行；
- `CharacterArchivePanel.css`：599 行；
- `characterArchive.ts`：75 行。
- `index.tsx`：219 行。

视觉层当前以地图框为唯一舞台：stage 占满 `.map-section`，1024×1024 背景使用 `object-fit: fill`，DOM 继续按同一容器百分比和 `cqh/cqw` 定位。不要擅自恢复上一版 1:1 `contain`、灰色侧边或 archive-only 全屏布局；如要再次改变拉伸方式，需要新的用户意见。原作构图观感仍待用户人工确认。

## 5. 现有数据合同应保留

以下是当前应保留的数据/交互合同。本轮没有重新运行自动回归，不能把上一候选的通过记录当成本轮证据：

1. `CHARACTER_ARCHIVE_SLOTS` 的 01–11 固定槽位结构。
2. `resolveCharacterArchiveSlots()` 先检查 CardStore 和 `isCharacterAvailable()`，锁定时把 `character` 设为 `null`。
3. 主角页逐字段订阅 `playerStore` 的 `intelligence/athletics/art/charm/stamina/stress/money`，不订阅 `avatar`；主角四条档案只是固定“未登记”文本。
4. 3 个 `player-status` 素材只负责体力/压力表现：两种图标共用一张 track，并由粉色/青色 CSS 填充区分；`bg_ht01.png` 只负责覆盖 `bg_data1` 左上烘焙字段。运行时路径都必须经过 `resolveAssetPath()`，它们不创建新的玩家字段，也不覆盖官方中缝。
5. 解锁详情从 CardStore 读取 `name/type/affection/friendship/romance/description`。
6. 常去地点通过 `mapStore.locations` 转成人类可读名称。
7. 缺失角色详情资料使用“未登记”，不写假数据；主角六轴雷达只是现有字段映射，不创建文系、理系、容姿或根性的新权威字段。成长属性原始上限由 `TOKIMEKI_ATTRIBUTE_MAX` 控制，显示阶段由 `[160, 200, 240, 260]` 派生为 1–5；体力/压力资源上限由 `PLAYER_RESOURCE_MAX` 控制。UI 与 `render_game_to_text()` 共用六维和阶段 resolver，后者同时返回精确 `radar` 与 `radarStages`；存档恢复拒绝缺失、非有限或越界玩家数值。
8. App 层的 `inert`、`aria-hidden` 和关闭恢复逻辑。
9. Escape、左右方向键、左右按钮、返回列表和显式关闭。
10. `render_game_to_text()` 中的页签、子视图、槽位和锁定态回读。
11. 现有 `CharacterProfileModal` 的入口和行为。

如果只做视觉重做，优先冻结 `data/characterArchive.ts`、`MapMenu.tsx`、App 状态接线和 `index.tsx` 投影，只替换/拆分 `CharacterArchivePanel.tsx` 与 CSS。

## 6. 当前状态：已处理与仍待人审

### 本轮已处理

1. 资料页不再挂载主角/梨斗/男性占位图片；主角不显示当前位置，固定显示“主角”、四条“未登记”、体力心形槽、独立压力槽、零用钱和六轴雷达。
2. 资料 stage 以 `100% × 100%` 覆盖现有地图框；官方 1024×1024 背景使用 `object-fit: fill`，没有灰色侧边，也不使用毛玻璃、卡片边框或面板阴影。
3. 体力/压力槽已收敛为 3 个授权 `player-status` 素材并共用 track；完整 `bg_data1.png` 负责官方中缝，`bg_ht01.png` 只局部清掉左上旧字段。成长属性保留 `0–999` 原值，雷达按 `160/200/240/260` 派生五阶段并只绘制单色同心环与一个阶段多边形；体力/压力资源保持 `100`。
4. 标题和底部 `Controls` 保留在正常游戏布局中；`Controls` 在资料页打开时 inert/灰化。重复 `StatPanel` 已删除，地图可用高度只做统一预算。
5. `CardImporter` 按钮/面板、文件导入、URL导入、PNG/URL loader 与对应类型已删除；`addCardFromJSON()` 默认角色初始化保留。
6. 副 API 关闭时手动小总结按钮为灰色 disabled；启用后过期 failed job 不再误锁，只有当前来源仍匹配的失败任务阻断。
7. `StoryHistoryArchive.tsx:72` 的 `state.save.record` 修复保留，但本轮没有重新构建生产包验证。
8. Persona 风格彩色雷达、菱形节点、中心 `MAX` 徽章和 risei 压力表候选已撤销；对应临时压力素材已从 `artsource` 删除，不能作为当前实现继续迭代。

### 仍待人工判断

1. **背景构图。** 两张官方背景当前使用 `fill` 铺满地图框，仍需用户判断非等比显示与 DOM 坐标是否符合目标观感；当前没有灰色侧边留白。
2. **手机详情滚动。** 本轮未运行浏览器；`844×390` 详情正文需在真实 Tavern 中确认滚动区域和字号。
3. **导航原生感。** `L_data/R_data` 已接入，返回/关闭仍是 HTML 交互，需要结合原作手柄/掌机参考决定是否重画。
4. **信息重心。** 主角左页的固定档案行、共轨体力/压力槽、零用钱和单色五阶段雷达是否舒服仍须人审；草图不能替代实际 game-frame 审查。
5. **当前人审仍 pending。** `ALDENT_STATUS.md` 保持 `implementation_complete_human_review_pending`；本轮所有自动检查都是 `not run`。

## 7. Kimi 接手顺序

### 第一步：先人工审当前实现，不立即扩范围

1. 打开当前 `CharacterArchivePanel.tsx` / CSS 和 `bg_data1.png`、`bg_data2.png`，确认代码与本文行号一致。
2. 在目标 Tavern game-frame 手工检查全框 `fill` 背景、清晰度、三素材共轨状态槽、五阶段单色雷达、角色槽位、详情和关闭；本轮没有任何可复用的新自动通过证据。
3. 特别检查桌面与 `844×390`：页面必须完整限制在地图框内且没有灰色侧边，标题和 `Controls` 仍应存在于正常布局，`Controls` 只灰化不消失。
4. 确认主角页没有任何人物图片请求，角色卡文件/URL导入入口没有重新出现，API 关闭时小总结按钮明确为灰色。
5. 把用户意见写回 `ALDENT_STATUS.md`；只有新的明确审核意见才授权下一轮视觉修改。

### 第二步：只有再次退回时才拆视觉组件

建议至少拆成：

- `CharacterArchivePanel`：只管顶层页签、关闭和键盘；
- `PlayerStatusPage`：只管主角数值；
- `CharacterArchiveGrid`：只管 11 槽图标；
- `CharacterArchiveDetail`：只管单角色资料；
- 可选 `ArchiveFrame`：统一设计坐标、缩放与安全区。

数据选择器可以继续留在现有组件或提取成小 hook，但不要把视觉坐标塞进 Store。

### 第三步：维护当前地图框设计坐标

- 当前 stage、背景和 DOM 都以实际地图框为坐标容器；背景 `fill`、DOM 百分比和 `cqh/cqw` 必须作为同一套实现一起评估。
- 不要单独把背景改回等比缩放或裁切而保留旧 DOM 坐标。若用户要求改变显示策略，需要同时重新确认背景与 HTML 的坐标对应。
- 桌面和平板优先共享同一构图；手机横屏只在确实不可读时调整字号/间距，不重新发明另一套页面。
- 触控目标至少 44×44 CSS px，但视觉图可以更小。
- 长简介与小高度使用明确滚动区，不能靠字体继续缩小。

### 第四步：统一游戏视觉语言

- 优先寻找并使用授权素材库中同一 Data/UI 系统的按钮、标题、光标和装饰资源。
- 没有对应素材时才写 CSS，并尽量保持扁平的掌机 UI，而不是浏览器 tab/card/dashboard 风格。
- 主角页使用无人物图的中性构图；禁止以“临时占位”为由放梨斗图片。
- 角色列表必须让 `a` 解锁图、`b` 锁定图和 `cursor_dataNN` 成为主要视觉，不要再给它们叠加大量通用卡片效果。

## 8. 验收清单

视觉层完成前至少检查：

- [ ] 用户确认整体构图，而不只是自动测试通过。
- [ ] 主角页 DOM 内没有角色图片节点，Network 也没有请求梨斗/男主图片。
- [ ] 背景以 `fill` 覆盖整个地图框且没有灰色侧边；其非等比显示已由用户在实际 game-frame 中审查。
- [ ] 11 个槽位顺序、锁定图、解锁图和光标与官方素材一致。
- [ ] 锁定角色在可访问名称、dataset 和 `render_game_to_text()` 中不泄漏。
- [ ] 桌面没有大面积无意义空白，信息重心稳定。
- [ ] `844×390` 文字能正常阅读，不靠 9–10px 字体勉强塞入。
- [ ] 主角页固定显示生日、身高、体重、血型四条“未登记”；角色详情缺失字段也继续显示“未登记”。
- [ ] 主角页不显示当前位置；体力心形槽、独立压力槽、零用钱和六轴雷达均可读。
- [ ] `heart.png`、`pressure-icon.png`、`stamina-track.png` 三个素材在目标运行时成功加载，两个状态槽共用 track、图标不同、填充为粉色/青色，且所有路径经过 `resolveAssetPath()`。
- [ ] `bg_ht01.png` 的左上局部清底没有可见边缘，`bg_data1.png` 的官方 `x=508–575` 中缝完整未覆盖，“文系”标签 `labelY=-174` 没有与标题或网格重叠。
- [ ] 六轴顺序和映射为文系/理系/艺术/运动/容姿/根性 = `intelligence/intelligence/art/athletics/charm/athletics`；原始值为 `0–999`，阶段阈值为 `160/200/240/260`，默认值 `30` 显示阶段 1，体力/压力资源上限为 `100`，且没有新增玩家或存档字段。
- [ ] 雷达只显示单色五层同心环、六个名称与精确原值、一个阶段多边形；没有彩色扇区、菱形节点或中心 `MAX` 徽章。
- [ ] 左右按钮、方向键、返回、Escape、关闭均可用。
- [ ] 打开时地图、底部行动、日历、侧边档案和全屏入口不抢交互。
- [ ] 底部没有重复 `StatPanel`，也没有角色卡文件/URL导入按钮；默认角色仍可通过 JSON 初始化。
- [ ] 副 API 关闭时手动小总结按钮为清楚的灰色 disabled；过期 failed job 不会误锁新批次。
- [ ] 关闭后原地图与旧侧边档案入口正常。
- [ ] `window.render_game_to_text()` 与屏幕状态一致。
- [ ] 无新增控制台错误、失败资源和水平溢出。

## 9. 上一候选的历史证据

下面的脚本、截图和生产包都属于被用户退回的上一候选，只能用来定位旧问题，不能作为当前实现通过证据。本轮没有生成新 artifact、截图或哈希。

自动回归脚本：

`D:\webgame\tavern_helper_template-main\output\web-game-archive\verify-archive.mjs`

结果：

`D:\webgame\tavern_helper_template-main\output\web-game-archive\results.json`

上一候选桌面截图：

`D:\webgame\tavern_helper_template-main\output\web-game-archive\desktop-1440x1100`

上一候选手机横屏截图：

`D:\webgame\tavern_helper_template-main\output\web-game-archive\landscape-844x390`

这些截图对应旧的近似全屏/隐藏底栏实现，不是当前页面截图。

生产包：`dist/webgame-ui/index.html`，723584 bytes，SHA-256
`D3712A794BF6976AC258F46F8DC8AA2F97913E77F1AFC01E2A5EA1F18105FF49`。

历史结果曾为 14 项通过，但已被用户视觉审核否决，当前不得沿用为绿色结论。

## 10. 后续可运行的构建与检查

本轮按用户要求全部未运行。只有用户允许验证后，才从 `D:\webgame\tavern_helper_template-main` 使用以下命令：

```powershell
pnpm build:dev
pnpm build
pnpm exec eslint src/webgame-ui/App.tsx src/webgame-ui/components/MapMenu.tsx src/webgame-ui/components/CharacterArchivePanel.tsx src/webgame-ui/data/menuAssets.ts src/webgame-ui/data/characterArchive.ts src/webgame-ui/index.tsx
```

浏览器专项回归：

```powershell
node output/web-game-archive/verify-archive.mjs
```

注意：

- 上一轮曾记录 TypeScript 既有错误，但本轮没有重跑；不要把旧数量写成当前结果，也不要顺手扩修无关模块。
- `verify-inline-bundle.mjs` 是否存在及生产包身份必须在实际验证前重新确认，不能沿用旧 hash/self-test 记录。
- Git 状态以当前仓库实际命令为准；不要再沿用“`.git` 是空目录”的旧结论。
- 普通技能客户端在非 Tavern 页面会记录既有自动存档桥错误；专项归档回归用内存协议假桥隔离这一外部依赖，因此它不证明真实 Tavern 文件接通。

## 11. Kimi 接手后的第一项输出

先交付当前实现的人工复核报告，不直接继续改 CSS：

1. 桌面和 `844×390` 中，`fill` 页面是否完整限制在 game-frame、无灰色侧边，并与 DOM 坐标对齐；
2. 主角标题、四条“未登记”、体力/压力槽、零用钱和六轴雷达的字号、间距与清晰度；
3. 三个授权状态素材、共轨粉/青填充、`bg_ht01` 局部清底和完整官方中缝在实际 game-frame 中是否正确；
4. 11 槽、详情、L/R、返回和 Escape 的实际交互；
5. `Controls` 灰化、角色卡导入入口消失、API 关闭按钮灰色是否符合用户意见；
6. 主角页 DOM/Network 中没有梨斗或其他人物图片。

人工反馈写回 `ALDENT_STATUS.md` 后停止；只有新的明确审核意见才进入下一实现轮。
