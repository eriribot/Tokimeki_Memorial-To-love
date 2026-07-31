# 历史进度归档

> 当前运行时以 `MODULES.md` 为准，当前人工审查范围与证据以 `ALDENT_STATUS.md`
> 为准。旧幕数、旧入口、旧存档方案和历史“等待审查”状态不得直接带入新任务。

Original prompt:
$ponytail
$develop-web-game 现在sidebar 把 components\StatPanel.tsx以及进行学习哪些指令弄在地图下面就是从sidebar分离出来注意充分利用weight而不是高度不要有空白，就是尽量矮但是宽

- Moved StatPanel and Controls out of Sidebar and under the map in App.tsx.
- Reserved vertical budget in map scaling so the new bottom panel fits below the map.
- Fixed React mount timing for inline built HTML.
- Restyled bottom panel as one Tokimeki-style notebook board with lighter separators and mixed pastel button colors.
- Build passed: npm run build.
- Browser check passed: sidebar is portrait-only; bottom panel contains StatPanel and Controls; no console errors.
- Latest screenshot: layout-final.png.
- TODO: none.- 2026-06-26: Fixed classroom character sizing with ponytail scope: tachie images now use equal display
  width, portrait fallback keeps the existing box size. Kept map glass/background and chibi white card styling intact.
- Build passed: npm run build from repository root.
- 2026-06-26: Kept scene tachie grounded at the bottom of the map-stage, removed unused Player avatar from map
  rendering, and allowed library to enter the reused scene flow like classroom.
- Build passed: npm run build. Playwright localhost check passed against http://localhost:5500/dist/webgame-ui/.
- 2026-06-26: Library scene now uses existing /artsource/backgrounds/library.png via sceneBackground mapping in
  ClassroomScene.
- Build passed and localhost Playwright check passed.
- 2026-06-27: Moved map chibi avatars below location cards so they do not cover enter-scene buttons. Added
  scene-characters count class and wider/flexible tachie layout for 4-character scenes. Not built or browser-tested per
  user request.
- 2026-07-04: Added a modular MapMenu overlay using cleaned transparent derivatives of
  /artsource/component/menubutton.png and menu.png; appears on the school map and toggles the menu bar from the map
  corner.
- 2026-07-04: Refined school map markers: smaller visible white location cards, finer 20x12 grid, larger non-overlapping
  76px chibi avatars with restored white circular backing. Verified in Chrome DevTools MCP; no console warnings/errors.
- 2026-07-04: Processed user green-screen menu art into /artsource/component/menu.greenkey.png, cropped to a transparent
  1254x275 menu strip, copied to dist, and switched MapMenu to use it. Chrome DevTools MCP confirmed image loads with no
  console warnings/errors.
- 2026-07-05: Original-style menu attempt was too large and kept an extra left menu avatar. Added CSS override so
  expanded menu hides the separate toggle and shows only a smaller bottom menu strip with a lighter dark gradient.
- 2026-07-05: Reworked MapMenu to use a full-width bottom menu image with seven transparent click hotspots. The
  rightmost hotspot resets the game/returns title and closes the menu; expanded state hides the separate menu toggle.
- 2026-07-05: Changed menu interaction to original-like menu mode: opening the menu darkens the whole map, stretches the
  menu strip across the bottom, and clicking the dark area above the menu closes it back to the map. Bottom menu
  hotspots remain active.
- 2026-07-05: Added final full-width menu CSS override: menu backdrop covers the whole map and closes on click, while
  the menu strip is pinned left/right/bottom at 100% map width using the source image aspect ratio.
- 2026-07-13: Began the approved start/menu modularization review loop. Added MODULES.md, copied all 28 official
  `*menu*.png` sprites non-destructively into `artsource/ui/menu`, and made the repository-local artsource the Webpack
  publish source.
- 2026-07-13: Added local-session lifecycle actions, a two-action start screen, full player/card/game reset
  coordination, and an eight-button sprite MapMenu. Save/load/index/data/dictionary/settings remain deliberate visual
  placeholders with no side effects.
- 2026-07-13: Matched the supplied original-game reference: the open map menu now uses seven bottom icons, defaults the
  yellow cursor to Save, moves it on hover/focus, closes through the dark map backdrop, and keeps the unused icon08
  asset on disk.
- 2026-07-13: Removed the map menu panel texture, bottom glass/shadow treatment, and rectangular focus outline per user
  feedback. The official yellow cursor sprite is now the only selection treatment around icons.
- 2026-07-13: Restored official `menu_icon08` as the explicit Return action after direct user review. While the menu is
  open, both map border layers and their shadows are suppressed so the sprite row reads as an overlay instead of a boxed
  panel.
- 2026-07-13: Isolated MapMenu buttons from global button hover/filter/shine rules and restored visible overflow,
  preventing the official 129% yellow cursor halo from being clipped into a square.
- 2026-07-13: Replaced the start screen's CSS-rendered text heading with the existing `artsource/ui/title.png` asset
  while preserving the accessible game title.
- 2026-07-13: Restored the map container's fixed border geometry after user review exposed a 4px open-menu layout shift.
  The square selection bug remains fixed at the button layer without resizing the page.
- 2026-07-13: Final development and production builds passed. The inline-host safety checker reported zero legacy entity
  prefixes, currency signs, replacement characters, replacement specials, and syntax errors for both artifacts.
- 2026-07-13: Final Playwright flow passed on desktop and mobile: title asset decode, disabled Continue, complete
  three-store restart, preserved Continue state, eight menu icons, unclipped cursor hover/focus, explicit Return,
  backdrop close, zero layout shift, zero console errors, zero HTTP failures, and zero horizontal overflow.
- 2026-07-13: Verified all 28 source menu assets match both the extracted Sprite files and the production copies by
  SHA-256; `title.png` also matches its production copy. No source asset was deleted.
- 2026-07-13: Full `pnpm lint` remains blocked by the pre-existing generated `tavern_sync.mjs` (1184 errors). Scoped
  lint for this implementation has zero errors and six expected Node-builtin warnings in the two `.mjs` verification
  scripts.
- 2026-07-13: Current connection status is still `只是本地状态演示`. Awaiting Aldent human review; no next feature loop
  without a completed review form.
- 2026-07-13: Added local `font/` assets from `D:\素材\出包女王素材库\Font`, registered the Seurat merged CJK font and
  Liberation Sans fallback in `index.css`, and extended `copy_webgame_assets` to publish `dist/font`. Build and browser
  verification pending.
- 2026-07-13: Reworked the title screen toward the supplied real-device composition: `title_bg.png` base,
  `title_bg3a.png` foreground layer, copied `logo.png`, and six A/B sprite menu items. Added looping
  `artsource/music/op.mp3` with immediate autoplay plus pointer/keyboard retry. 5500 verification pending.
- 2026-07-13: Per user correction, removed `logo.png` from the title screen and restored `title.png` as the only title
  asset. Background layers, six A/B menu sprites, and title music remain.
- 2026-07-13: 5500 verification passed at `http://localhost:5500/dist/webgame-ui/`: title/background/12 menu sprite
  images all loaded, `title.png` is the title source, six start menu items render, mobile has no horizontal overflow,
  and `op.mp3` returned `audio/mpeg` with playback active under an autoplay-permitted browser. Default browser autoplay
  policy was also checked: the audio reports `blocked` before a gesture and switches to `playing` immediately after the
  first click through the retry listeners.
- 2026-07-13: Scoped ESLint for `StartScreen.tsx` and `menuAssets.ts` passed.
  `verify-inline-bundle.mjs dist/webgame-ui/index.html` passed with zero legacy entity prefixes, currency signs,
  replacement characters, replacement specials, and syntax errors. Current connection status remains `只是本地状态演示`.
- 2026-07-13: Compressed and raised the title menu using viewport-height sizing so all six A/B items, including
  `系统设定`, fit inside the 5500 desktop viewport without changing the `title.png` or background layers.
- 2026-07-13: Replaced the custom title-menu selection treatment with the official `artsource/ui/cursor.png`: selected
  items now show the cursor plus A sprite, unselected items show the B sprite, and the cursor follows mouse hover,
  focus, and ArrowUp/ArrowDown navigation.
- 2026-07-13: Isolated title-menu buttons from global shine, shadow, filter, transform, transition, and overflow
  clipping so `cursor.png` is the only selection treatment.
- 2026-07-13: Made no-session Continue visibly disabled with a grayscale B sprite. It uses `aria-disabled` plus
  `tabIndex=-1` and guarded pointer/click handling so hovering the unavailable item immediately returns the official
  cursor to Restart instead of feeling stuck; keyboard navigation also skips it.
- 2026-07-13: Verified the inverse state in the same browser session: after starting and returning to title, Continue
  regains full-color B/A behavior, accepts the official cursor, and resumes the game. `pnpm build:dev`, scoped ESLint,
  the exact inline-host safety checker, Playwright screenshots, hover/keyboard interaction assertions, console checks,
  and HTTP checks all passed. Current connection status remains `只是本地状态演示`; awaiting Aldent human review.
- 2026-07-14: Added the read-only `data/worldbook.ts` Tavern Helper adapter for listing current global/character/chat
  bindings, reading one or all active worldbooks, preserving RegExp keys during UTF-8 JSON conversion, and exposing
  `window.toloveWorldbook` without automatic reads or writes. Replaced the main-page text heading and the stale
  start-screen alt text with the existing To LOVE-Ru `artsource/ui/title.png`. Scoped ESLint, development build,
  inline-bundle safety check, Playwright client state/screenshot review, and a mocked Tavern Helper contract test
  passed; real SillyTavern worldbook evidence remains required before labeling this as real state reading.
- 2026-07-15: 开始本地主线闭环：只实现 2008-04-07 第一次有效行动结算后剩 1 点时触发菈菈登场，以及固定 GAL 播放；本轮明确隔离 AI、宿主聊天楼层、世界书扫描和 shujuku/数据库写入。
- 2026-07-15: 已新增 `GalMainStory/`
  固定事件数据、全屏 GAL 播放器和独立 CSS；普通行动、地图人物交谈与具体场景交谈统一进入 `gameStore`
  结算，主线页与完成状态进入 V1 兼容存档和
  `render_game_to_text()`。已同步纠正方案文档中“静默 generate 等于真同层”的旧判断。等待构建与浏览器验证。
- 2026-07-15: 本地主线闭环验证完成。范围 ESLint、UTF-8 严格解码、`pnpm build:dev`、`pnpm build`、最终内联 HTML 安全检查均通过；安全计数
  `legacyEntityPrefix/currencySign/replacementChar/replacementSpecial/syntaxErrors` 全为 0。
- 2026-07-15: 开发包和生产包均完成 Playwright 多步验证：普通行动、地图人物交谈、具体场景交谈都会在 4 月 7 日扣到剩 1 点时触发；上一页/下一页/跳过/正常结束可用；活动事件可从第 3 页存档恢复；完成标记只写一次，读回完成档后不会重触发；390×844 无横向溢出；全部场景无 console
  error 和失败资源请求。截图与结果保存在系统临时目录 `codex-gal-main-story-e2e`。
- 2026-07-15: Chrome DevTools 连接未取得：Chrome 正在运行且 native host 正常，但当前 Default 配置未安装 ChatGPT Chrome
  Extension。本轮不能宣称经过 Chrome
  DevTools 验证；已有证据来自技能客户端和终端 Playwright。当前接通状态仍是“只是本地状态演示”，等待艾尔登特人工审查。
- 2026-07-15: 根据人工评审开启菈菈官方素材表现层小循环：仅使用 `artsource/lala` 与 `artsource/galbox`，新增底图 + Alpha
  mask + 眼睛/嘴型图集的分层立绘，按十页固定剧情切换 `a-f` 表情，并加入眨眼、短口型、官方消息窗、菈菈名牌和 `push_0..3`
  点击提示动画。
- 2026-07-15: `GalMainStory` 已从浏览器视口级 fixed 遮罩改为黄色 `.map-section`
  内的 absolute剧情层；保留上一页/下一页/跳过，新增画面非控件区域点击继续与方向键/Enter/Space 翻页。剧情期间地图附属浮层隐藏，底部玩法面板使用
  `inert` 锁定。范围 ESLint 与 `pnpm build:dev` 已通过，等待浏览器截图、完整交互、生产包和最终内联安全检查。
- 2026-07-15: GAL 表现层已按黄色游戏框的容器宽度完成三档横屏自适应：PC `>=1024px`、平板 `640-1023px`、手机
  `<640px`。生产包在 1440x1100、1180x820、844x390 三种视口逐页验证，十页正文均无 overflow，剧情层均未越出游戏框；手机档保留左右翻页并隐藏页码/跳过以避免遮挡人物。
- 2026-07-15: 最终生产包交互与素材验证通过：菈菈页姓名为“菈菈”、玩家页为“你”、旁白无姓名牌；空白点击/上一页/方向键均只移动一页，最后一页只写一次完成标记，底部面板为
  `inert`，四张 `push_0..3` 均加载，控制台零错误。`pnpm build:dev`、`pnpm build`、范围 ESLint、Prettier
  check 和最终内联安全检查均通过，五项安全计数为 0。当前接通状态仍是“只是本地状态演示”，等待艾尔登特人工审查。
- 2026-07-15: 新增
  `菈菈分层动态立绘制作与接入指南.md`，记录非 Live2D 的技术判定、官方素材尺寸、body/mask 关系、眼嘴窗口坐标、非等比三帧图集映射、a-f 表情、动画节奏、三档横屏参数，以及兼容旧格式和制作新角色的两条制图路线。本轮只做知识沉淀，没有修改游戏运行代码。
- 2026-07-15: 艾尔登特新增 `GAL-PORTRAIT-01` 分层动态立绘武器库、经验 010 和技能读取路由。writing-skills
  RED 基线实际复现了“因尺寸不能整除而猜四帧、编临时坐标”的错误；GREEN 与两次REFACTOR 后已能处理横纵图集、显式矩形、锚点、动画、fallback、容器响应式和证据 sidecar，最终新代理报告通用结构字段缺口为 0。当前接通状态仍是“只是本地状态演示”。
- 2026-07-16: 新目标是移除独立推进时间按钮、把夕崎梨子改为独立可发展关系角色、纠正第一集不再由梨子固定走百合/婚约剧情，并完成最小 Tavern
  Helper 正文生成 MVP。
- 2026-07-16: 已移除“推进时间/结束今日”。有效行动成为时间权威：第一次行动自动到放学后，第二次行动耗尽 AP；4 月 7 日可在剩 1
  AP 时主动尝试向春菜告白，或由 AP 归零兜底触发同一第一集。没有主线的日期会在 AP 归零后自动跨日。
- 2026-07-16: 新增夕崎梨子默认角色卡和纯文本人物书。梨子进入地图、档案、交谈与好感系统，但不是 User，不再承担浴室初遇、保护菈菈、误告白和婚约的固定剧情位。第一集与菈菈世界书已经按此重写。
- 2026-07-16: 首集改成四幕按需生成。每幕直接调用 `TavernHelper.generate({preset_name:'in_use'})` 获取纯文本正文，不使用
  `json_schema`；非空自然段直接成为 GAL 页，`角色名：台词`
  只用于识别人名。背景、表情、特效、行动点、日期和完成状态仍由代码控制。
- 2026-07-16: 本地 Playwright 契约验证通过：四幕分别调用 4 次 generate，四次均无 json_schema；三份本地资料与逐幕人物扫描键进入请求；主动告白/日终兜底、加载、错误、保底、部分幕存读档、桌面/手机播放、跨到 4 月 8 日和唯一完成标记全部通过。梨子交谈后好感从 0 变 5；控制台、页面异常和资源失败均为 0。结果在
  `output/story-mvp-e2e/results.json`。
- TODO: 在真实 SillyTavern 中人工检查当前预设、WORLD_INFO_ACTIVATED 和四幕实际正文。当前只能标记为“真实 generate
  API 已实现，真实酒馆运行待人工审查”；没有创建真实聊天楼层，也没有接通 MESSAGE_SENT、shujuku/ACU 或数据库。
- 2026-07-16: 用户在真实 SillyTavern 中触发了第一幕生成；Chrome 运行日志证明请求已返回并在旧版 `parseGeneratedActs`
  中因“不是有效 JSON”失败。当前消息 iframe 确认仍含旧 JSON 解析器、没有
  `parsePlainTextAct`，所以这不是生成 API 失败，也不是当前源码仍要求 JSON。
- 2026-07-16: 修正 `界面-实时修改.json`：开发入口改为 watch 实际产物
  `http://localhost:5500/dist/webgame-ui/index.html`，并加入时间戳避免继续缓存旧 HTML。watch 地址冒烟、生产四幕契约、TypeScript、范围 ESLint、严格 UTF-8/JSON 与最终内联安全检查均通过；仍需在酒馆重新导入该正则或重新渲染
  `[开局]` 消息后，用新 iframe 完成四幕真实正文和 `WORLD_INFO_ACTIVATED` 人工审查。
- 2026-07-16: 当前用户要求停止用 `/user/files/tokimeki-to-love-save-*.json` 文件桥和 `window.toloveSave.save/load`
  自动化直调冒充存读档。已定位控制脚本为 `savesolt/index.ts`，并确认正式 UI 原先没有自动存档触发器，“继续游戏”也不会读取
  `autosave`。
- 2026-07-16: 第一阶段改为浏览器 `localStorage` 唯一存档后端；新增三份 Zustand 状态订阅的 600ms 防抖自动存档、
  `pagehide`/返回标题补写、开始页自动档继续读取和可见错误信息。旧文件桥源码、酒馆导入 JSON 与 `window.toloveSave`
  调试入口已移除； `verify-story-mvp.mjs`
  的部分幕存读档改为等待自动保存、整页重载、点击“继续游戏”恢复，等待构建与浏览器验证。
- 2026-07-16: 人工截图审查否决浏览器 `localStorage` 方案；用户要的是 Tavern Helper 启用 `ToLove存档槽`
  后写入 SillyTavern 本机 `user/files`
  的真实文件存档，反对的是自动测试直接调用调试 API 冒充玩家存读档。上一条方案已纠正，未作为验收结论。
- 2026-07-16: 已恢复 `savesolt/index.ts` 文件桥和可重复生成的 `ToLove存档槽.json`，客户端改为严格 `tavern-file`，删除
  `browserStore.ts` 与全部 `browser-local` 回退。桥未启用时显示明确错误；读取界面会列出 `autosave`
  自动档；游戏状态变化仍以 600ms 防抖写入真实文件桥，开始页“继续”读取真实自动档。
- 2026-07-16: 范围 ESLint、开发构建、生产构建、导入脚本语法解析和最终内联包安全检查通过；开发/生产最终 HTML 的
  `legacyEntityPrefix/currencySign/replacementChar/replacementSpecial/syntaxErrors` 均为 0，且不存在
  `localStorage`、`browser-local` 或
  `BrowserSaveStore`。按用户要求没有运行 Playwright、没有自动点击或代替玩家操作；真实酒馆文件读写仍等待人工审查。
- 2026-07-16: 用户确认本轮先做独立 `messagesolt`，只保存游戏内部的 User prompt 与 Assistant 原始正文；真实酒馆隐藏楼层、
  `MESSAGE_SENT`、`/trigger`、shujuku、ACU 和数据库留到后续单独测试。本轮新增 `message/` 协议与客户端、 `messagesolt/`
  文件桥及可导入的 `ToLove对话槽.json`。
- 2026-07-16: 每个 `autosave/slot-01..08` 现在对应一个 `tokimeki-to-love-messages-<slot>.json`，以
  `slotId + saveUuid + saveRevision`
  校验。游戏快照与消息数组在同一同步时刻冻结，主存档写入后写同 REV 对话档；读取时版本不符或新版缺档会明确失败，旧版内嵌
  `mainStoryMessages` 可兼容迁移；删除主存档时同步删除对话档。
- 2026-07-16: 后续正文生成不再读取酒馆当前聊天末尾，`max_chat_history` 设为 0；改为最多注入当前存档最近 16 条
  `saved_game_conversation`，当前预设、角色卡与原有世界书扫描/资料注入保持不变。范围 ESLint、开发/生产构建、两个导入脚本语法与
  `no-store` 检查、最终内联安全检查均通过；五项安全计数为 0。未运行 Playwright 或真实酒馆交互，等待人工审查。
- 2026-07-16: 开始修复真实 Tavern 正文进入 GAL 后的素材丢失。新增独立的说话人/情绪呈现解析层：兼容旧 `角色：台词`，新增
  `角色【情绪】：台词`；把 User、玩家名、拉拉/Lala/ララ及人物简称归一成前端登记名，并把六种语义情绪映射到菈菈 `a-f`
  眼嘴素材。`galbox`
  窗口、点击提示和角色姓名牌路径集中到素材登记表；菈菈从第二幕起在本幕持续在场，非菈菈发言时只停止口型而不卸载立绘。等待纯解析契约、构建和人工酒馆画面审查。
- 2026-07-16:
  GAL 素材呈现静态验证完成：User/当前玩家名/拉拉/Lala/ララ/旁白/未知标签兼容契约通过，第二幕“菈菈持续显示、只在菈菈发言时开口型”的表达式序列通过；范围 ESLint、开发构建、生产构建通过。生产包
  `dist/artsource`
  中正文窗、姓名牌、4 帧点击提示、body/mask 与六组眼嘴共 20 个文件齐全，最终内联安全五项计数为 0；按用户要求未运行 Playwright、未替用户触发真实酒馆生成，等待人工画面审查。
- 2026-07-17: 接手剧情生成契约收尾。新增 event/stage 完成标记，缺失标记的截断候选进入可见
  `parse_error`；背景切换改用阶段相对进度元数据，不再依赖固定页码。移除主线本地 lore/扫描键直注入和三个一次性迁移脚本，活跃文档已同步；构建与回归验证待运行。Chrome 只读检查发现当前
  `出包王女` 世界书的“剧情第一集”条目为绿灯且内容为空，真实 Tavern 语义完成验收因此仍受外部世界书资料阻塞。
- 2026-07-17: 剧情生成收尾验证完成。范围 Prettier/ESLint、脚本语法、fresh `pnpm build:dev`、exact
  inline 五项安全计数和 Story
  MVP 三路径回归通过；完成标记缺失路径显示明确错误且 AP 保持 1，正常和 fallback 路径均在两幕后进入 4 月 8 日。整仓 lint 仍有既有 1185
  errors/56 warnings。状态保持 `waiting_for_review`，没有把 mock、构建或截图写成人工接受。
- 2026-07-17: 开始补齐手动存档删除 UI。现有主档/对话档删除协议和文件桥保持不变；`SaveSlotModal`
  新增独立删除按钮、不可撤销确认、精确 UUID 级联调用和删除后权威列表对账。自动档因常驻写入竞态不提供游戏内删除入口，等待构建与浏览器回归。
- 2026-07-21: 按用户确认的美柑草稿配置完成 `characters/mikan.ts`，保留
  `arrival-default`、a-f 语义映射、禁眨眼集合与人物世界书 UID
  7；角色注册表和第一集第一幕 cast/lore 已接线，回家 fallback 页由美柑实际发言并显示分层立绘。
- 2026-07-21: 范围 Prettier/ESLint、webgame 子树 TypeScript、剧情生成合同和 `pnpm build:dev` 通过。桌面与 `844x390`
  手机横屏均经真实玩家流程走到第一幕第 11/17 页；美柑 body/mask/c 眼嘴/姓名牌成功解码，截图位于
  `output/web-game-mikan/`。本地缺少 Tavern save/generate 接口，UID 7 的真实 World Info 扫描仍待人工酒馆复验。
- 2026-07-21: 用户提供的实际截图否决了上一条视觉证据：美柑沿用了菈菈的
  `eyes.y=237 / mouth.y=365`，导致眼嘴贴片切过刘海、额头和脸部。用美柑 `a_eye/a_mouth` 第一帧与 `010_01_01_a #27473.png`
  做像素匹配后，修正为 `eyes=(394,270,230,131)`、`mouth=(394,398,230,57)`；六组表情三帧边缘误差由约 `39/60` 降至约
  `5-6`。共享分层组件、表情映射和禁眨眼集合没有改动。修正版已通过 Prettier、ESLint、TypeScript、剧情合同和开发构建；旧浏览器截图不再作为通过证据，由于当前本地 URL 浏览器策略阻止重新抓取，修正版实际页面等待用户刷新确认。新增源级诊断图位于
  `output/web-game-mikan/`。
- 2026-07-21: 按用户要求只扩充分层立绘接入文档，没有改代码或素材。新增 Photoshop 通用修缝流程：先区分坐标、帧外圈、纹理串帧、小数缩放和完整 mask 问题；在 1024 母板中用 Difference 锁定角色自己的 region；把旧三帧图集整图重采样到 `230x393 / 230x171` 后按整数线切帧；三帧复用 body crop `edge-reference`，用小范围 Contract/Feather 保证外圈一致；最后重新拼 clean atlas 并用 Timeline、多缩放和多背景验收。现有“自己制作新表情”步骤同步移除菈菈硬编码坐标，改为角色自身 region 与 clean/legacy 双路线。
- 2026-07-23: 记忆第一轮补齐大小总结 TIDD-EC prompt 构造器、只读确定性状态锚点、来源/证据边界合同，以及地图框内 `push_0~3` 非阻塞进度条。进度运行态独立于 `gameStore` 且不持久化，网络等待不伪造百分比；真实副 API、响应解析、候选审查、记忆侧档和上下文注入仍未接通。范围合同、TypeScript 与 ESLint 已通过；等待现有 `pnpm watch` 产物截图和人工 prompt/UI 审查。
- 2026-07-23: 根据真实酒馆截图修正目录：跨集规范历史成为实际生成用的最近 6 条窗口，原文默认折叠，弹窗正文和原文列表可滚动。记忆 API 设置新增小总结 1/2/3 楼层与大总结 3/5/8 条已接受小总结频率；主存档和对话档同次成功后自动请求，严格解析来源/引文，候选可接受、编辑、拒绝，失败只在总结页人工重试。候选暂按 saveUuid 保存在当前浏览器，尚未写 Tavern 记忆侧档或注入剧情。按用户要求本轮未运行任何测试、构建、格式化或浏览器验证。
- 2026-07-23: 静态审查收紧首轮运行链：每个权威保存/设置刷新只处理一个频率批次，自动存档挂载时立即建立锚点，人工重试与自动任务互斥；候选接受和大总结前重验 saved/live 采用楼层，大总结按规范剧情顺序而非返回时间排序。玩家编辑会清除原 AI facts，覆盖账本不再固定截断 80 条。目录将运行中当前幕的投影窗口与空闲时按当前采用版重建的下一轮 6 条窗口分开标注，不把缺少持久化回执的历史楼层冒充真实请求。仍按用户要求未运行任何测试、构建、格式化、浏览器或真实 API。
- 2026-07-23: 用户真实 Tavern 反例发现 `SummaryReviewTab` 的两个 Zustand selector 在 `getSnapshot` 内持续创建筛选/排序数组，触发 React 19 Maximum update depth。现已改为订阅稳定的 store 原始数组并用 `useMemo` 派生当前存档视图；同文件其余 selector 静态确认不同类。遵照用户要求未运行测试、构建、格式化、浏览器或 API，等待用户刷新 watch 页面复验。
- 2026-07-23: 用户真实 Tavern 证明副 API 正文已返回，但旧协议错误要求模型生成 JSON；同时旧设置让一层正文立即生成小总结。大小总结现改为模型只回纯文本、本地函数生成标题与来源/状态/时间戳/JSON 外壳，新候选不从 prose 伪造 facts。记忆层级固定为 6 个完整楼层生成 1 个小总结、5 条已接受小总结生成 1 个大总结；最近 6 条消息继续保留作校准。浏览器候选 archive 使用 v2 键，旧 v1 任务保留但不再加载。遵照用户要求未运行测试、构建、格式化、浏览器或 API，等待用户实机复验。
- 2026-07-23: 后续数学评审与用户决定取代上一条 6 楼层策略：总结合同改为静态常量，固定保留最近 6 条消息，每 2 个更旧完整楼层生成 1 个小总结，每 5 条已接受小总结生成 1 个大总结，正文上限固定为 600/1200 字；系统设置不再保存或展示频率选项。副 API 仍只返回纯文本，本地封装 JSON 与空 facts。已拒绝候选可从原冻结来源显式重新生成；浏览器候选 archive 升为 v3，旧 v1/v2 留存但不加载。遵照用户要求未运行测试、构建、格式化、浏览器或 API，等待用户实机复验。
- 2026-07-23: 静态收口固定总结链：大总结批次优先于后续小总结积压，5 条来源必须在指纹、楼层与消息上互不重复；已拒绝记录生成后续任务或候选后不再重复开新任务。API 迟到结果改为严格匹配 request revision，并对 saved/live 两侧重新验证来源。浏览器 v3 加载会隔离无效 shape、悬空或错配的 ready job/candidate。新游戏轮换默认自动档 UUID；自动存档、默认档手动写入与读档显式失效或回滚记忆锚点，只有主档和原文档成对成功后才重新采用。仍遵照用户要求未运行测试、构建、格式化、浏览器或真实 API。
- 2026-07-23: 总结审查补齐冻结来源：小总结和失败任务可展开查看 2 个楼层的 4 条本地原文及幕/楼层/source，大总结按原顺序查看 5 条来源小总结的标题和正文；来源默认折叠且展开区独立滚动。浏览器 v3 现在拒绝空白 active UUID 与 revision 小于 1 的记录。由于手动槽、载入会话与自动档可共用 UUID，删除/覆盖槽位不再推测性清空摘要；切换回滚会重新排队恢复的成对上下文。宿主固定槽旧写入仍不可撤销，手动另存也尚未重锚 accepted 摘要。遵照用户要求未运行测试、构建、格式化、浏览器或 API。
- 2026-07-23: 普通自动存档不再在写入开始时提前清空记忆锚点，而是等主档与原文档成对成功后才采用新 revision 并排队总结；写入失败继续保留上一份已配对上下文，所以既有总结和人工重试入口不会长期隐藏。显式读档/删除/默认档写入仍使用可失效、可回滚的 transition。遵照用户要求未运行测试、构建、格式化、浏览器或 API。
- 2026-07-26: 按用户批准方案启用地图菜单“数据”，新增同框“主角属性 / 角色档案”资料页和官方 `01-11`
  槽位资源。主角页只读取 `playerStore` 数值并使用纯 CSS 名字首字标记，不读取 `avatar`、不渲染图片；锁定角色在展示层去身份化，解锁详情读取当前 CardStore/MapStore，缺失生日、身高、体重和血型显示“未登记”。
- 2026-07-26: fresh `pnpm build:dev` 后的首轮 `844x390` 回归撤销了旧绿色结果并复现页头覆盖正文；原因是实际 game-frame 宽度超过
  `620px`，没有命中组合容器查询。短高度布局统一把内容起点下移到 `24%`，重新构建后桌面和手机横屏完整回归通过，最终截图已逐张打开检查。
- 2026-07-26: 作用域 ESLint、开发构建、生产构建、官方技能客户端、生产包 14 项归档回归、37 个素材发布哈希和 exact inline 五项安全检查通过。最终生产 HTML（清理无用 CSS 后）SHA-256 为
  `CC03E826479B8B71912859DAB1C248498BFA5E1B5BDA36A64E74B5F1C9315C7F`。整树 TypeScript 仍被五个未改动模块的 12 条既有错误阻断；归档文件没有出现在错误中。
- 2026-07-26: 当前接通标签仍为“只是本地状态演示”。技能客户端在无 Tavern 事件接口时记录既有自动存档桥错误；归档专项回归使用只响应现有存档/对话协议的内存假桥，不冒充真实 Tavern、host floor、shujuku、ACU 或数据库证据。TODO：等待用户在目标 Tavern game-frame 完成人工视觉与交互审查；审查前不扩展下一功能。
- 2026-07-26: 用户认为当前数据页前端观感不合格，新增 `KIMI_DATA_ARCHIVE_HANDOFF.md` 作为重做交接文档。文档冻结数据/交互合同，明确主角禁用梨斗图片、官方素材来源、1024×1024 背景比例疑点、当前 443 行组件与 891 行 CSS 的视觉债务，以及 Kimi 应先完成原作构图判断再重写视觉层。
- 2026-07-26: 按用户最新反馈重做资料页表现层：移除主角 `icon_data10b` 占位图，修正四条资料线，去掉资料页外层圆角/阴影；背景保持授权 `bg_data1/bg_data2`，DOM 文本和官方图标不再跟随非等比整层 transform，改按容器高度保持清晰比例。资料页打开时隐藏标题、底部行动板、角色卡导入和事件日志，并按可用视口重新缩放，`844x390` 不再缩成 400x240 小框。
- 2026-07-26: 修复 `StoryHistoryArchive.tsx` 对不存在的 `gameStore.save.record` selector；改订阅 `useMemorySummaryArchiveStore.activeSaveUuid` 并补齐 callback 依赖。fresh 开发包、桌面/手机横屏 14 项归档回归和 scoped ESLint 已通过；生产构建与人工 Tavern 视觉验收仍待完成。
- 2026-07-26: 资料页清晰度与 `record` selector 修复已完成生产收尾。`pnpm build` 通过；生产 HTML 为 723584 bytes，SHA-256 `D3712A794BF6976AC258F46F8DC8AA2F97913E77F1AFC01E2A5EA1F18105FF49`。删除前 inline 检查器 self-test 与五项安全计数通过，桌面/`844x390` 生产包 14 项回归通过并已实际检查截图。远端仅 `main@70ecc44` 且仍含旧 selector；本地 `.git` 是空目录，不能执行 pull/merge，后续若要恢复版本管理应先在旁路干净 clone 中迁移当前改动。真实 Tavern/宿主/plugin/database 与人工视觉验收仍未证明。
- 2026-07-26: 最终完整 TypeScript 检查仍有 10 条既有错误，集中在 `ContextPreviewModal`、`storyContextValidation`、`storyTimeline`、`summaryRuntime` 四个未改模块；`StoryHistoryArchive` 的 `save` 字段错误已消失。本轮不扩展修复这些模块。
- 2026-07-26: 短暂候选（已由下一条撤销）曾把资料页改为地图框内的 1:1 正方形 stage，授权 1024×1024 背景使用 `contain` 等比显示；主角页展示当前地点、零用钱与学力/运动/艺术/魅力/体力/压力六条横向属性，并移除四条“未登记”占位和雷达图。底部 `StatPanel`、`CardImporter`、文件/URL action 与 loader 已删除，默认角色所需 JSON 初始化保留；副 API 关闭态和 current failed job 判断也已收口。本轮遵照用户要求未运行构建、Lint、TypeScript、浏览器、截图、inline、API 或其他测试。该条只保留为历史，不是当前构图。
- 2026-07-26: 最新实现再次取代上一条资料页构图结论：`CharacterArchivePanel` 的 stage 现在以 `100% × 100%` 覆盖现有 `.map-section`，`bg_data1/bg_data2` 使用 `object-fit: fill`，不保留灰色侧边，也没有资料页毛玻璃、卡片边框或面板阴影。主角页不显示当前位置，不挂任何人物图片；固定“主角”标题，生日/身高/体重/血型四行固定“未登记”，另有体力心形槽、独立压力槽和零用钱。六轴 SVG 雷达为文系/理系/艺术/运动/容姿/根性，当前只在展示层映射为 `intelligence/intelligence/art/athletics/charm/stamina`，没有扩展 `PlayerState` 或存档 schema。右侧 11 槽和详情交互、StatPanel/CardImporter 清理、手动小总结灰色关闭态及 current failed job 判断保持不变。本轮用户明确禁止测试，build、Lint、TypeScript、browser、截图、inline 和 API 均未运行；草图也不作为运行时验收，状态继续为 implementation complete / human review pending。
- 2026-07-26: 主角状态槽进一步接入五个已复制的授权素材：`artsource/ui/archive/player-status/heart.png`、`pressure-icon.png`、`stamina-track.png`、`pressure-frame.png`、`pressure-fill.png`，运行时统一经 `resolveAssetPath()`。左页遮罩缩为 `49.6%` 以保留官方书脊，雷达“文系”标签下移到 `labelY=-174`。源码 archive 现有 42 个文件，但本轮仍未运行 build、资源发布核对、浏览器或截图，不能宣称新素材已进入生产 artifact 或通过运行时验收。
- 2026-07-26: 按用户最新反馈修正资料页中缝与数值量纲：`bg_data1.png` 继续作为唯一完整底图，官方 `x=508–575` 锥形粉色页边、白书沟与细内线不再被任何覆盖层触碰；新增并经源/仓库 hash 对照的官方 `bg_ht01.png` 只局部羽化覆盖左上烘焙字段。源码 archive 现有 43 个文件。`stores/playerStore.ts` 新增 `TOKIMEKI_ATTRIBUTE_MAX=999` 和 `PLAYER_RESOURCE_MAX=100`；学习/运动/艺术/社交的成长属性改按 `999` 封顶，体力/压力继续按 `100` 维持当前行动循环。文理共用学力、根性沿用运动作为无 schema 扩展的临时显示映射；UI 与 `render_game_to_text()` 共用 resolver，schema-v2 恢复严格拒绝缺失、非有限或越界玩家数值。遵照用户要求，本轮未运行 build、Lint、TypeScript、浏览器、截图、inline 或 API；人工视觉验收仍 pending。
- 2026-07-26: 最新实现再次取代上方五素材和彩色雷达候选。体力与压力现在共用 `stamina-track.png`，分别使用 `heart.png` / `pressure-icon.png`，以粉色 / 青色填充区分；运行时 `player-status` 只剩 3 个素材，连同 37 个原档案素材和 `bg_ht01.png`，源码 archive 共 41 个文件。`pressure-frame.png`、`pressure-fill.png` 与临时 pressure-gauge/track/gradient 复制品已从 `artsource` 删除，官方原件仍留在 `D:\素材`。六轴保留精确 `0–999` 原始值，但雷达只显示单色五层同心环、六个名称与数值、一个阶段多边形；阶段按 `0–159 / 160–199 / 200–239 / 240–259 / 260+` 映射为 1–5，默认值 `30` 均为阶段 1。Persona 风格彩色扇区、菱形节点、中心 `MAX` 徽章和 risei 压力表候选均已撤销。`render_game_to_text()` 同时暴露原始 `radar` 与派生 `radarStages`；手动小总结在副 API 未启用时保持原生灰色 disabled。遵照用户要求，build、Lint、TypeScript、游戏页面浏览器、截图、inline、API 与人工验收均未运行；仅浏览原作攻略页核对阶段阈值。
- 2026-07-27: `Controls` 的体力/压力继续直接读取 `playerStore` 并显示精确值，标签采用已确认草图的蓝色 heart-pulse / 橙色 gauge 图标。用户最终纠正位置为“系统右侧、个人行动左侧”：资源块现与系统按钮同一行并位于按钮右边，六维位于该行下方；独立 `StatPanel` 未恢复。最终位置修正后按用户要求未再运行格式化、Lint、构建、浏览器、截图或 inline 检查；此前显示资源位于系统按钮下方的截图、构建和 hash 对最终布局均已作废，等待目标 game-frame 人工确认。
- 2026-07-30: 新增 `CalendarModule/DateModule/` 的只读双月日历，点击左上原日期牌后在 `.map-section` 内显示当前月与下月。日历只读取 Zustand 当前日期，使用原 PSP 双页与月份素材，补充中文月份/星期、周末配色和当天实色标记；没有月份切换、选日、预约、节假日、约会、生日、AP、跨日、存档或主线规则。原始图集中已定位 `love_event`、`holiday`、生日、学校、祭典与樱花图标命名，但本轮不切片、不接运行时。
- 2026-07-30: 用户否决展开态暗色透明背景，并要求左上日期牌的原样式和原动画不受入口影响。最终源码移除日历暗幕，点击反馈改为日期牌外层独立实色光标；日期牌本体继续使用原 `new_count.png`、行动点素材和 `count_ani_1/2` 关键帧，不增加悬停滤镜或位移。折页改在剩余 `1 AP` 时显示，因为 `0 AP` 会立即跨日。最终 scoped ESLint、`pnpm build:dev` 与 `pnpm build` 通过；用户明确接手页面视觉验证，自动浏览器检查已中止，不能把中止前的旧暗幕截图作为验收证据。
- 2026-07-30: 本条取代此前“日历不能翻月”的显示合同。`DateModule` 使用原版 `artsource/ui/ji_guide_L/R.png`，按双页书逻辑每次前后翻两个月，并在左右页分别显示对应年份；浏览游标只在本次打开期间存在，关闭后重新从游戏权威当前月开始。没有增加翻页动画、日期选择、事件图标、AP、存档或主线写入。遵照用户要求，本轮未运行 build、Lint、TypeScript、格式化、浏览器、截图、inline 或其他验证，等待用户实机确认。
- 2026-07-30: 用户截图否决了日历书外继续透出地图与角色的临时浮层感，本条取代上一条的 `ji_guide_L/R` 呈现。日历现在沿用档案页的全幅不透明白色 stage，翻页提示改为 `artsource/ui/archive/L_data.png` 与 `R_data.png` 并按档案页尺寸置于 stage 两侧；没有毛玻璃、模糊、半透明暗幕或新翻页动画。双月本地翻阅、逐页年份和不写游戏状态的合同不变。遵照用户要求，本轮未运行 build、Lint、TypeScript、格式化、浏览器、截图、inline 或其他验证，等待用户实机确认。
- 2026-07-30: 用户进一步澄清“透明”只针对两个 L/R 翻页按钮，并非要求纯白日历底层，本条取代上一条。日历恢复透明同框呈现；`L_data/R_data` 原图本身已有 Alpha，截图中的白色圆角块来自全局 `button` 的圆角、阴影、hover 滤镜/位移以及此前误加的白色 stage。`DateModule` 现局部清除这些继承效果和通用伪元素，只保留原图形自然叠在地图上。双月翻阅、逐页年份及只读合同不变；遵照用户要求，本轮未运行 build、Lint、TypeScript、格式化、浏览器、截图、inline 或其他验证。
- 2026-07-30: 根据用户实机截图，日历展开层增加单层 `rgb(22 18 28 / 30%)` 背景暗化，不使用 backdrop blur、毛玻璃或纯白 stage；L/R 从地图两端改为日历书内部的相对定位，分别贴近日历左右外缘并垂直居中，因此会随书本尺寸一起移动。按钮原始 Alpha 和全局按钮样式隔离保持不变。遵照用户要求，本轮未运行 build、Lint、TypeScript、格式化、浏览器、截图、inline 或其他验证。
- 2026-07-31: 把日历从只读双月显示升级为可点选日期信息层：新增 `CalendarModule/specialDates/` 投影目录，`DateModule` 现在接收主线投影后的 `specialDates`，当前与未来日期可点击查看底部横向信息条，主线判定的周末 `whole-day` 日期显示红 X 和“已有重要日程，该日期暂不可安排”。保留原月页/年份/翻页按钮和不写 AP、日期结算、存档的合同；尚未运行 build 或浏览器验证。
- 2026-07-31: 按用户反馈把日历里的主线周末标记从字体字符改成纯 CSS 绘制的红 X，并把日期数字继续往上贴，避免“绑定字体”的观感。`DateModule` 仍只改本地可视层，不写 AP、日期或存档；`pnpm exec eslint ...` 与 `pnpm build:dev` 已通过，浏览器和实机视觉确认仍留给用户。
