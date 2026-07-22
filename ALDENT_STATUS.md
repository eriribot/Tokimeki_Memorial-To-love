# 艾尔登特当前状态

```yaml
status: implementation_complete_human_review_pending
current_loop: data_driven_episode_template_runtime
authorized_by: user_confirmed_order_locator_and_no_legacy_save_compatibility_2026-07-22
authorized_scope:
  - humanize the three episode02 recovery drafts without changing plot direction
  - register episode02 as three acts and connect triggering, generation, GAL playback, history and saves
  - locate real Tavern worldbook entries by stable order and exact name
  - use the user-confirmed riverbank ending and bg020_a.png as the provisional changing-room background
  - replace per-episode Store/snapshot growth with one generic episode template runtime
  - break old save compatibility and remove duplicated persisted act indexes
forbidden_scope:
  - create or connect new Lala portraits
  - edit source PNG, PSD or generated portrait atlases
  - import, enable or edit saved Tavern worldbook entries
  - create host messages or connect MESSAGE_SENT, shujuku, ACU, plugins or databases
connection_state: local_runtime_connected_real_tavern_scan_pending
overall_connection_label: 第二集本地运行链已完整接通；真实酒馆仍需验证 order 扫描证据
human_review: pending_episode02_story_voice_and_real_tavern_scan
counterevidence:
  - user screenshot showed the previous y=237/365 windows cutting through Mikan's bangs and face; prior visual passes
    are invalidated
superseded_evidence:
  - ep01-panc-contract invalidated by user runtime screenshot and existing content protocol documentation
  - content-tree-parser acceptance invalidated by a complete content container hidden below malformed planning-tag
    nesting
  - single-content-wrapper acceptance invalidated by the existing 正文/story_scene tags and the user-provided
    story_scence alias
prior_pending_reviews:
  - ep01-act01-mikan-runtime-rendering-alignment-fix
  - ep02-act03-mikan-haruna-worldbook-recovery-sources
  - ep01-supported-playable-wrapper-set
  - tokimemo4-special-skill-progression-and-map-drawer
  - worldbook-authoritative-ai-directed-presentation
  - dual-map-landscape-overlay-responsiveness
  - story-progression-character-availability-and-raw-reader
  - merge-local-scenes-with-remote-story-display
  - ep01-act1-background-sequence
  - haruna-cross-page-blink-continuity
completed_human_reviews: []
next_loop: human_review_episode02_and_real_tavern_order_scan
```

本轮台式机验收按 `references/aldent-review-invitation.md` 执行，结果填写在
`references/aldent-human-review-form.md`。手册已经单独标出真实 Tavern order 扫描、schema v2 存读档和第二集河边版本，历史段落中的旧 UID 与旧产物路径不再作为本轮证据。

## 本轮结构改造

- `episodeTemplate.ts` 统一登记日期/行动序号触发器、剧情世界书 order、人物 lore、演出素材、生成合同和 fallback；`episodes/index.ts` 是唯一生产注册清单。
- 共享触发、生成、GAL、历史和存档只认 `eventId + actId`。Store 不再并列保存 active/progress/actIndex/acts，快照也不再重建旧第一集结构。
- 通用主线动作移到 `stores/mainStoryStore.ts`；`gameStore.ts` 只装配行动结算和稳定 slice 接口，不再随着剧集增加而增长。
- 主线快照升级为 schema v2，对话档升级为 schema v2；旧开发存档明确不兼容。
- 新增未注册虚构剧集契约，证明通用触发器可以只读取模板工作；新增剧集复用现有素材时不改 `gameStore.ts`、`snapshot.ts` 或渲染器。
- 防止删除仍被后续版本引用的楼层，并拒绝历史页异步生成返回后的过期写入。

| Check                              | Status | Evidence                                                                 |
| ---------------------------------- | ------ | ------------------------------------------------------------------------ |
| TypeScript                         | passed | `npm run typecheck:tolove`                                               |
| Generic episode template contract  | passed | `node verify-story-template.cjs`                                         |
| Episode 02 lore/runtime contracts  | passed | `verify-episode02-lore.cjs`、`verify-episode02-runtime.cjs`               |
| Existing story contracts           | passed | `verify-story-generation.cjs`、`verify-character-lore.cjs`、21 项正文测试 |
| Development build                  | passed | `npm run build:dev`                                                      |
| Tavern message bridge artifact     | passed | 已重建；无 `entryReason/generationId/extra.actIndex`                     |
| Real Tavern order scan             | not run | 仍需在真实酒馆确认下一次 World Info 扫描命中 152/153/154                 |

## 保留的上一轮增量：Photoshop 通用分层立绘处理流程

- `菈菈分层动态立绘制作与接入指南.md`
  新增角色无关的 PS 流程，先按症状区分坐标错误、帧外圈差异、跨帧采样、小数像素与完整人物 mask 问题。
- PSD 母板固定逻辑舞台、角色自己的 region 和层级；用 Difference 模式只测中性参考帧，所有表情继续共享同一组坐标。
- 旧 `256x512 / 256x256` 三帧纹理先整图非等比重采样为 `230x393 / 230x171`，再按整数参考线切成
  `230x131 / 230x57`，避免从旧图上猜 `170/171` 或 `85/86` 分界。
- 每帧以同一份 body crop 作为
  `edge-reference`，通过收缩选区与小范围 Feather 建立共同外圈；文档区分了 1024 母板中的 region 选区和独立单帧文档中的
  `Select All`。
- clean atlas、2x
  atlas、legacy 容器、独立帧/显式 rect 的职责分开记录；加入 Timeline、缩放、多背景与分层定位的验收清单及禁止做法。
- 本轮没有修改 `mikan.ts`、共享组件、CSS、任何 PNG/PSD、构建产物或宿主链。

| Check                    | Status  | Evidence                                                            |
| ------------------------ | ------- | ------------------------------------------------------------------- |
| Guide structure          | passed  | PS 流程包含诊断、母板、Difference、整数帧、安全带、导出与时间轴验收 |
| Existing route coherence | passed  | “自己制作新表情”已改为角色自身 region，并区分 clean/legacy 路线     |
| Prettier                 | not run | 最终文档与审查邀请完成后运行                                        |
| Runtime build/tests      | not run | 纯文档增量，明确禁止把未改运行时写成重新验证                        |
| Human reproducibility    | not run | 等待用户按 PS 步骤实际制作一组帧                                    |

### 人工复现

1. 在 PS 建立 1024x1024 母板，放入 body，并登记当前角色的眼嘴 region。
2. 用 Difference 模式对齐第 0 帧；确认外圈接近黑色后锁定坐标，其他帧不得单独移动。
3. 把旧 eyes/mouth 完整图集分别缩放为 230x393 与 230x171，再按整数参考线切出三帧。
4. 给三帧复用同一个 `edge-reference`，mouth 从 3～4px Contract、2～3px Feather 起步；逐帧检查五官没有被蒙版侵蚀。
5. 拼回 clean atlas，在 Timeline 和 50%/100%/125%/200% 下检查，再进入游戏实测。

### 已知风险

- Bilinear 是当前网页采样的实用起点，不代表所有原引擎都使用同一滤镜；原引擎证据不同时应记录并改用对应采样方式。
- mouth 只有 57px 高，统一大羽化会侵蚀嘴型；应从小值开始，必要时只处理出现接缝的一条边。
- PS 中静态无缝不能代替最终浏览器的动画、缩放和 mask 验收。

## 保留的既有待审范围：第一集第一幕美柑实际渲染

- `characters/mikan.ts` 保留用户草稿的
  `arrival-default`、`neutral:c / worried:a / happy:b / serious:f / panic:e / shy:d`、禁眨眼 `worried/panic`
  和人物世界书 UID `7`。含空格与 `#` 的 body URL 使用等价编码 `%20%23`，避免浏览器把文件名后半段当 fragment。
- 美柑的实测眼窗为 `394,270,230,131`，嘴窗为 `394,398,230,57`；旧实现误用了菈菈的 `237/365`，已由用户截图证明错误。
- `characters/index.ts` 已登记美柑；第一幕 cast 与 `characterLoreIds` 都加入 `mikan`。生成路线现在会按 UID `7`、名称
  `结城美柑`、根标签 `Mikan Yuuki` 和姓名标记验证关闭条目，并将副本武装到下一次原生 World Info 扫描。
- 第一幕保底回家页由美柑说“回来了？怎么一副又失败了的表情。”，演出 cue 为
  `home / mikan / arrival-default / neutral / none`，因此本地环境也能完整检查姓名牌、body、mask、`c_eye`、`c_mouth`、眨眼和口型链。
- 之前桌面与 `844x390` 截图仍使用旧坐标，已被用户提供的桌面截图否决，不能继续作为视觉通过证据。

| Check                               | Status  | Evidence                                                                                         |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| Runtime source Prettier / ESLint    | passed  | 美柑模块、角色注册表和第一幕定义无格式或 lint 错误                                               |
| Webgame subtree TypeScript          | passed  | `pnpm exec tsc --noEmit -p src/webgame-ui/tsconfig.json --pretty false`                          |
| Story generation contract           | passed  | `node src/webgame-ui/verify-story-generation.cjs`                                                |
| Character / episode lore contracts  | passed  | `verify-character-lore.cjs` 与 `verify-episode02-lore.cjs` 均通过                                |
| Character validator ESLint          | failed  | 既有 CJS `require()` 触发 3 条 error 和 3 条 warning；脚本执行本身通过                           |
| Development build                   | passed  | `pnpm build:dev`; fresh inline artifact 包含美柑、UID 7 与全部素材 URL                           |
| Prior desktop player flow           | failed  | 用户截图显示旧眼嘴窗口切过刘海、额头和脸部；旧坐标证据已失效                                     |
| Prior mobile landscape player flow  | failed  | 使用同一错误坐标，不能证明修正版视觉                                                             |
| Mikan source-pixel alignment        | passed  | `a-f` 六组表情三帧边缘复核；新坐标边缘 MAE 约 `5-6`，旧坐标约 `39/60`                            |
| Corrected browser player flow       | not run | 当前浏览器 URL 策略阻止重新抓取本地页面；等待用户刷新实际页面                                    |
| Fixed diagnostic composite          | passed  | `output/web-game-mikan/mikan-face-alignment-before-after.png` 与三帧诊断图                       |
| Resource decode and animation state | passed  | body `1024x1024`、eye `256x512`、mouth `256x256`; mask/body/eye/mouth 请求成功，眼嘴动画名已命中 |
| Standalone console                  | passed  | 仅有缺少 Tavern save/generate 接口的预期隔离错误；没有新增 React、资源解码或路径错误             |
| Real Tavern UID 7 World Info scan   | not run | 本地页面没有 Tavern Helper；需要真实酒馆复验一次性扫描与关闭条目状态                             |
| Human visual acceptance             | not run | 用户已否决旧画面；修正版仍等待实际页面确认坐标、表情语义和接缝                                   |

### 人工复现

1. 打开 `http://localhost:5500/dist/webgame-ui/`，点击“重新开始”。
2. 点击一次“学习”；本地页面出现生成失败时点击“使用保底版”。
3. 从第一幕第 1 页点击十次“下一页”，停在第 11/17 页。
4. 确认页面显示结城美柑、美柑姓名牌和“回来了？怎么一副又失败了的表情。”，并人工检查眼嘴高度、接缝、闭眼 neutral 与口型是否符合你的素材配置。
5. 在真实 Tavern 中重新生成第一幕，确认 UID `7` 的 `结城美柑` 条目保持关闭、扫描副本被临时启用且生成后没有改写保存状态。

### 已知风险

- 本地 fallback 只能证明角色注册和 UI 渲染，不能证明真实 Tavern 世界书 UID `7` 已命中。
- 当前 neutral 按用户配置映射到 `c`，禁眨眼集合按用户配置仍为
  `worried/panic`；是否符合表情语义和逐帧接缝由本轮人工画面审查决定。
- standalone 页面缺少 Tavern save 与 generate 接口，因此控制台会记录对应隔离错误；这不是美柑资源失败。
- `verify-character-lore.cjs` 仍使用项目既有的 CommonJS 脚本格式；将校验工具迁为 ESM 不属于本轮运行时接线范围。

## 2026-07-22：第二集完整接线与河边版本

- 时间线采用当前企划的连续映射：4 月 7 日 20:43 首次触碰与公园对峙，4 月 8 日早晨误告白，4 月 9 日第二集开场与校内骚动，4 月 10 日 20:43 三日冷静期结束，4 月 11 日早晨菈菈作为转学生登场。
- TBS 第 2 话简介确认婚约成立与三日内解除；日文字幕进一步给出“一昨日の20時43分”、再次触碰并宣告解除、最后一小时谈话、警报和转学生台词。恢复源没有写成 24 小时、八字不合或让菈菈讨厌 User。
- 用户提供的动画截图确认最后一小时谈话发生在河边。第二幕以 User 请菈菈去河边收尾，第三幕从河堤开始，沛凯仍在场；20:43 警报也在河边响起。
- 菈菈说出长期相亲、王室身份让人替她作决定、除沛凯外没人倾听，并感谢 User 曾经听她说话、相信她和保护她。User 只表现为几次开口未果，没有被正文规定成因为春菜、愧疚或爱意而犹豫。
- 警报在 4 月 10 日 20:43 响起，User 未再次触碰也未完成解除宣言；次晨亲卫庆祝，User 到校后短暂以为菈菈不在，老师随即介绍她为转学生。第三幕停在春菜认出她和全班骚动，不续写第三集。
- `tolove-character-mikan.txt` 与 `tolove-character-haruna.txt`
  按菈菈人物书的分区方式保存基础资料、行为性格、经历、情感驱动、关系、前两集认知、称呼、口吻、台词和禁止偏移。两人都明确隔开原作男主、User 与夕崎梨子。
- 美柑保持小学生与未成年边界，重点是家务、观察和责任提醒；春菜保持文静但有边界的普通同学，第二集更衣室反应来自惊吓，不写成争宠。春菜不知道三日规则、沛凯变装原理、解除婚约的尝试或河边最后谈话。
- TBS 官方人物页只用于身份和核心性格。生日、血型、身高和体重来自已标明的二级资料；恢复源和 README 都明确说明 TBS 页面未列这些数值。
- 世界书条目不再依赖不可控 UID；人物使用 `order 100/101/102`，两集剧情使用 `order 150-154`。所有保存条目仍须保持关闭。
- 菈菈校园常驻已经改为 EP02 三幕完成后解锁，与 4 月 11 日转学生登场一致。
- `stores/mapStore.ts` 与 `components/MapMenu.tsx` 未修改；二者不拥有剧情日期或角色解锁。构建与 inline
  artifact 不受这些未导入 bundle 的恢复源影响。

| Check                        | Status  | Evidence                                                                                         |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| Episode 02 lore contract     | passed  | 三幕根标签、河边版本、order 定位、日期/AP 触发与场景登记通过                                     |
| Episode 02 runtime contract  | passed  | 4 月 9 日至 11 日的行动触发、跨日、完成记录与菈菈解锁通过                                        |
| Character lore contract      | passed  | `node src/Tokimeki_Memorial-To-love/verify-character-lore.cjs`；人物结构、身份边界与自然台词通过 |
| Story generation regression  | passed  | `node src/Tokimeki_Memorial-To-love/verify-story-generation.cjs`；两集生成与正文协议合同通过     |
| Story text regression        | passed  | `npm run test:story-text`；21 项正文抽取与提示合同测试通过                                       |
| Changed-file Prettier        | passed  | 运行时、校验脚本、测试与当前文档已按项目 Prettier 整理                                           |
| Build / inline verification  | passed  | `npm run build:dev`；TypeScript 与 webpack 开发构建通过                                          |
| Real Tavern worldbook scan   | not run | 代码按 order 武装扫描副本；仍须在真实酒馆核对 `WORLDINFO_ENTRIES_LOADED`                         |
| Human story and voice review | not run | 等待用户审阅第三幕节拍、美柑与春菜是否自然、是否符合当前企划                                     |

### 人工复现

1. 阅读三份第二集恢复源，确认时间依次为 4 月 9 日、4 月 10 日 20:43 前、4 月 10 日最后一小时至 4 月 11 日早晨；第三幕谈话发生在河边。
2. 检查第三幕：菈菈说起相亲、王室压力、沛凯例外并感谢 User；User 没有被写死内心理由，也没有再次触碰或完成解除宣言。
3. 检查片尾：警报越线后才有亲卫庆祝；到校后老师介绍转学生，菈菈说自己也来学校，春菜只认出她，剧情随即结束。
4. 阅读美柑人物书，确认她仍是未成年小学生，不承担恋爱或身体笑料；User 没有自动亲属关系，夕崎梨子没有默认亲属关系。
5. 阅读春菜人物书，确认原作感情不迁移给 User；4 月 9 日更衣室反应来自受惊，她不知道家中解除规则和最后谈话。
6. 在真实 Tavern 中检查 `order 100-102` 人物条目和 `order 150-154` 剧情条目保持关闭，并核对一次性扫描证据。

### 已知风险

- 4 月 7 日至 4 月 11 日是依据当前游戏锚点与字幕相对时间得到的内部映射，不是动画画面显示的官方日历。
- TBS 官方人物页不含生日、血型、身高和体重；这些数值已经降级标注，但仍需人工决定是否保留二级资料。
- 自动检查只能验证结构、关键词和禁用边界，不能证明人物说话自然或每个动画情绪点都写对。
- 第二集、角色解锁、保存恢复、历史投影和重新生成上下文已经按 `eventId` 接入；真实酒馆扫描仍需人工证据。

## 保留的既有待审范围：直接抽取唯一受支持正文容器与场景立绘唯一绑定

- 用户截图明确指出运行时出现了错误的 `<panc>`，并确认协议应为 `<content>`。既有 `AI生文与GAL前端整合方案.md`
  第 54-58 行也以 `<content>...</content>` 为标准示例；上一轮 panc 合同及其自动测试结论因此作废并已归档。
- `storyGenerationPrompt.ts` 默认使用 `<content>...</content>`，同时明确上层提示已指定
  `<正文>`、`<story_scene>`、`<story_scence>` 等正文标签时沿用一对同名开闭标签；运行时 prompt 中不包含 panc。
- 用户随后提供的真实输出同时包含完整 `<content>` 和 `</content>`，但其前面存在不匹配的
  `</konatan_planning~>`；旧实现按标签树遍历时把 content 视为 blocked
  planning 的子节点，因而错误提示“未包含”。此前抽取通过和 artifact 哈希已被该反例推翻并归档。
- 用户继续指出正文容器不只有 content：既有登记还包括 `<正文>` 与 `<story_scene>` 等，实际还需要兼容
  `<story_scence>`。单 content 门禁因此是错误合同；修复前这三个正例都会误报“未包含 `<content>`”。
- `storyTextExtraction.ts` 现在直接扫描既有 `PLAYABLE_TAG_GROUPS` 的开闭 token，并补登
  `story_scence`。整份返回只能有一对受支持且同名的正文标签；容器外内容全部丢弃，正文中的其他 `<...>`
  标签标记会被过滤；缺失、未闭合、错配、重复或并列多个受支持标签均进入 `parse_error`。
- `tavernStoryGeneration.ts` 的候选门禁改为 `requirePlayableWrapper: true`，不再指定某一个标签名。最终 inline
  artifact 中没有 panc 文本。
- 场景与立绘修复保持：完成合同读取当前幕 `requiredSceneSequence`；第二幕
  `washroom + lala -> washroom-swimsuit`，其余当前幕场景 `lala -> arrival-default`；错误 portrait 明确拒绝，不静默替换。
- 世界书条目、剧情情节点、AP/日期、fallback、立绘素材、宿主消息和插件/数据库链均未改动。

| Check                              | Status  | Evidence                                                                                                                                              |
| ---------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| User contract counterexample       | passed  | 用户指出正文容器是既有标签集合，不是 content 单标签，并明确补充 `<正文>` 与 `<story_scence>`                                                          |
| Frozen before-failure reproduction | passed  | `<正文>`、`<story_scene>`、`<story_scence>` 三个完整正例在修复前均稳定抛出“未包含 `<content>`”                                                        |
| Story generation contract          | passed  | `node src/webgame-ui/verify-story-generation.cjs`；全部 18 个登记标签、畸形外层标签、其他标签过滤、缺失/截断/错配/重复/并列反例及 portrait 正反例通过 |
| Full subtree TypeScript            | passed  | `pnpm exec tsc --noEmit -p src/webgame-ui/tsconfig.json`                                                                                              |
| Changed-file ESLint                | passed  | prompt、抽取、演出解析、生成 adapter、共享规则和合同检查脚本无 error                                                                                  |
| Production build                   | passed  | `pnpm build`；最终 `dist/webgame-ui/index.html` 为 531402 bytes；仅有既有 asset-size 建议                                                             |
| Exact inline artifact verification | passed  | fresh artifact 的 legacy entity/currency/replacement/syntax error 均为 0，单 inline script                                                            |
| Artifact protocol scan             | passed  | fresh artifact 包含 content、`<正文>`、story_scene、story_scence 与受支持容器错误提示，不包含 panc                                                    |
| Artifact identity                  | passed  | SHA-256 `B28E9967E2DE66FC873C1552B3626B6AC8D9EC959819DC84BA7ACE56C5502B47`                                                                            |
| Corrected real Tavern generation   | not run | 尚未用本次正文标签集合 artifact 重新生成第二幕                                                                                                        |
| Host/plugin/database routes        | not run | 本轮禁止触发；hidden floors、MESSAGE_SENT、shujuku/ACU 和数据库仍未接通                                                                               |
| Human acceptance                   | not run | 等待用户用本次 artifact 重新验收                                                                                                                      |

### 人工复现

1. 用最终 artifact 在真实 Tavern 中重新生成第二幕，检查 User prompt 与原始 Assistant：默认可使用
   `<content>...</content>`；上层指定其他登记标签时，应保留那一对同名标签；不得出现 panc。
2. 分别用唯一的 `<content>`、`<正文>`、`<story_scene>`、`<story_scence>` 包裹同一段合法 GAL 正文，四种都应进入 GAL。
3. 即使正文容器前存在不匹配的
   `</konatan_planning~>`，只要唯一受支持标签对完整，正文仍应进入 GAL；容器外规划文字不得进入正文。
4. 缺失、未闭合、开闭名错配、重复或并列多个受支持正文容器应显示 `parse_error`；正文内其他尖括号标签标记应被过滤。
5. 浴室中菈菈只能显示 `washroom-swimsuit`；从 `home` 起显示菈菈时只能使用 `arrival-default`，错误字段不能被静默替换。
6. 确认第二幕不少于 30 行，首次场景顺序为
   `washroom -> home -> bedroom -> rooftop -> nightStreet -> park -> schoolRoad`，并人工确认世界书最后情节点完整演完后结束。

### 已知风险

- 正文标签集合抽取后的真实 Tavern 生成尚未运行；本地合同和 artifact 扫描不能替代这次复验。
- 行数与场景顺序不能机器证明所有世界书语义情节点已覆盖，最终内容仍需人工阅读。
- 最终 inline checker 由当前 `HEAD:verify-inline-bundle.mjs` 通过管道执行；工作区中该脚本的既有删除保持未恢复。
- 生产构建仍报告现有 `index.html` 体积建议，本轮没有扩展到 bundle 拆分。

## 保留的既有待审范围：特技树、学期学习与 map 内手机抽屉

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
- 每幕新增最少正文行数和必经场景顺序；第一幕少于 25 行或没有走完
  `space → school → schoolGate → home → washroom`，第二幕少于 30 行或没有走完
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

- 第二集已经完成多集接线；store 正文投影、存档恢复、历史目录、重新生成上下文和文本导出均按 `eventId` 分集。
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

- 主线当前幕由 schema v2 的单一 `run(eventId, actId, phase, pageIndex)` 恢复；采用正文从相应楼层档案投影，不再保存并行的幕序号或正文数组。
- 恢复或继续游戏时会按模板的日期与行动序号幂等检查等待中的幕；例如第一幕结束后的 `AP=1 + waiting act2` 仍等待下一次行动触发第二幕。
- 角色卡继续保存在 Card
  store，出现位置由独立规则同步：梨子和春菜初始可见，菈菈完成第二集后可见，梦梦、唯和小暗当前锁定；未知导入角色默认可见。
- AI 原文通过既有楼层 `messageIds` 关联 Tavern
  Assistant 消息，按幕和楼层版本组织，并对原字符串做只读分页。已读目录中的每个楼层可直接打开其原文版本。
- 本轮修改了本地主线模板、消息镜像协议和存档结构；没有创建 Tavern 宿主消息，也没有接入 shujuku、插件或数据库链。

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
