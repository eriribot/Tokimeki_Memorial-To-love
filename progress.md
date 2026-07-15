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
- 2026-07-15: 根据人工评审开启菈菈官方素材表现层小循环：仅使用 `artsource/lala` 与
  `artsource/galbox`，新增底图 + Alpha mask + 眼睛/嘴型图集的分层立绘，按十页固定剧情切换
  `a-f` 表情，并加入眨眼、短口型、官方消息窗、菈菈名牌和 `push_0..3` 点击提示动画。
- 2026-07-15: `GalMainStory` 已从浏览器视口级 fixed 遮罩改为黄色 `.map-section` 内的 absolute
  剧情层；保留上一页/下一页/跳过，新增画面非控件区域点击继续与方向键/Enter/Space 翻页。剧情期间
  地图附属浮层隐藏，底部玩法面板使用 `inert` 锁定。范围 ESLint 与 `pnpm build:dev` 已通过，等待
  浏览器截图、完整交互、生产包和最终内联安全检查。
- 2026-07-15: GAL 表现层已按黄色游戏框的容器宽度完成三档横屏自适应：PC `>=1024px`、平板
  `640-1023px`、手机 `<640px`。生产包在 1440x1100、1180x820、844x390 三种视口逐页验证，十页正文
  均无 overflow，剧情层均未越出游戏框；手机档保留左右翻页并隐藏页码/跳过以避免遮挡人物。
- 2026-07-15: 最终生产包交互与素材验证通过：菈菈页姓名为“菈菈”、玩家页为“你”、旁白无姓名牌；
  空白点击/上一页/方向键均只移动一页，最后一页只写一次完成标记，底部面板为 `inert`，四张
  `push_0..3` 均加载，控制台零错误。`pnpm build:dev`、`pnpm build`、范围 ESLint、Prettier check 和
  最终内联安全检查均通过，五项安全计数为 0。当前接通状态仍是“只是本地状态演示”，等待艾尔登特人工审查。
- 2026-07-15: 新增 `菈菈分层动态立绘制作与接入指南.md`，记录非 Live2D 的技术判定、官方素材尺寸、
  body/mask 关系、眼嘴窗口坐标、非等比三帧图集映射、a-f 表情、动画节奏、三档横屏参数，以及兼容
  旧格式和制作新角色的两条制图路线。本轮只做知识沉淀，没有修改游戏运行代码。
- 2026-07-15: 艾尔登特新增 `GAL-PORTRAIT-01` 分层动态立绘武器库、经验 010 和技能读取路由。
  writing-skills RED 基线实际复现了“因尺寸不能整除而猜四帧、编临时坐标”的错误；GREEN 与两次
  REFACTOR 后已能处理横纵图集、显式矩形、锚点、动画、fallback、容器响应式和证据 sidecar，最终
  新代理报告通用结构字段缺口为 0。当前接通状态仍是“只是本地状态演示”。
