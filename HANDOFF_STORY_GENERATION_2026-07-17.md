# AI 主线生成改造交接

日期：2026-07-17  
工作区：`D:\webgame\tavern_helper_template-main\src\webgame-ui`

> 接手结果（2026-07-17）：仓库内源码、文档、迁移脚本清理、fresh build、exact
> inline 检查和浏览器回归已收尾；当前权威状态转到
> `ALDENT_STATUS.md`。本文件以下正文保留接手前记录，不再作为当前验证结论。

## 接手完成摘要

- 新增通用 event/stage 完成标记；缺少精确末行标记的截断候选进入可见 `parse_error`，不会进入 GAL。
- 背景切换改用阶段相对进度元数据，不再使用固定第 9/10 页。
- 四份活跃文档已同步，三个一次性迁移脚本已删除。
- `node --check`、范围 Prettier/ESLint、`pnpm build:dev`、exact inline 安全检查和三路径 Story MVP 浏览器回归通过。
- 整仓 `pnpm lint` 仍被既有生成文件阻塞：1185 errors、56 warnings；本轮范围 ESLint 无错误。
- 真实 Tavern 人工验收仍未完成。Chrome 只读检查发现当前 `出包王女`
  世界书的“剧情第一集”是空的绿灯条目，菈菈绿灯条目仍含旧梨子路线设定；这与下文“蓝灯常驻 lore 已就绪”的交接假设冲突。
- 未擅自修改用户 Tavern 世界书、触发真实生成、创建宿主楼层或接通插件/数据库。下一步先按 `ALDENT_STATUS.md`
  修复世界书前置，再提交 AI 原文与截图人工审查。

## 当前状态

本轮工作在“源码修改已落盘、文档和验证尚未收尾”的阶段中断。

不要把当前状态视为已交付或已通过 Aldent：新的事件完成契约已经接入生成提示，但尚未完成格式化、静态检查、重新构建、inline
bundle 校验和真实酒馆人工验收。当前 `dist/webgame-ui/index.html` 也不能作为这轮改动已经验证的证据。

项目根目录执行 `git status` 返回“not a git repository”，因此本交接按当前磁盘文件核对，不提供 Git diff 或提交记录。

## 用户要解决的问题

1. AI 正文不能因为固定行数、字数或 token 数达到上限就提前结束。
2. 当前 AP、日期、时段和事件阶段由游戏状态严格控制；模型必须完成当前阶段的必要情节和结束条件，然后停在下一次 AP、日期、时段或事件阶段之前。
3. 约束必须能适用于第二集、第二季和其他世界书事件，不能用“吸尘器”“GOGO”等第一集关键词写针对性检测代码。
4. Tavern 中已有蓝灯常驻 lore
   book；项目不应再把同一份人物和剧情 lore 直接注入一遍，也不应额外构造一轮扫描注入造成重复读取。
5. GAL 的 `@旁白` / `@角色【情绪】` 行协议只负责可解析性，不能吞掉当前 preset 的文风和自由创作空间。
6. 最终验收以用户在真实酒馆中的截图和 AI 原文为准，不用浏览器 mock 冒充真实集成验收。

## 已完成

### 1. 参考剧情 JSON 的结构审阅

已查看：

`E:\web\tavern_helper_template-main\src\islandmilfcode\剧情.json`

可复用结构包括：

- `触发控制`：日期、时段、地点、前置条件和变量。
- `关键情节[]`：按顺序列出本事件必须发生的锚点。
- `结束控制`：结束条件、结束后状态和后续事件。
- 人物初始状态、场景修饰、User 介入边界、叙事重点和后期分支控制。

得到的核心结论：长度不应是完成标准；生成器应识别“当前阶段未完成的必要情节、结束条件、禁止跨越的下一边界”，完成后再闭合正文。

没有把参考 JSON 的具体剧情内容硬编码到生产代码中。

### 2. 新增通用生成契约构建器

新增文件：

- `services/storyGenerationPrompt.ts`

其中提供：

- `StoryGenerationPromptContext`
- `buildStoryOutputProtocol(...)`
- `buildStoryGenerationPrompt(...)`

当前提示词明确要求模型：

- 以 Tavern 当前蓝灯世界书作为人物、剧情事实和当前事件资料来源。
- 先在内部识别当前阶段的必要情节、结束条件和下一禁止边界。
- 必须让必要情节及其直接后果在正文中实际发生，不能用总结、转述或“之后发生了很多事”代替。
- 篇幅、字数、token 数和行数都不是完成标准。
- 完成本阶段后立即停止，不擅自推进下一 AP、日期、时段或事件阶段。
- AP、日期、好感、完成标记等仍以代码和存档为准，模型不得重算。
- 在必要情节之间可以自由创作对白、动作、误会、笑点、发明事故、镜头和转场。

提示词中的例子是抽象的“异常出现 -> 人物反应 -> 关键装置/行动 -> 升级 -> 收束”，没有写第一集专用关键词。

### 3. 移除本地重复 lore 注入

已修改：

- `services/tavernStoryGeneration.ts`

已移除：

- 三份本地 lore 的文本 import。
- `buildWorldbookScanTokens` 在故事生成链中的调用。
- `position: none, should_scan: true` 的额外扫描注入。
- 三份本地 lore 的 depth 0 直接注入。
- 旧的 `ACT_BOUNDARIES`、`ACT_CHARACTER_IDS` 提示拼装常量。

当前生成请求只保留：

- 已验收的上一阶段正文历史，存在时以 depth 1 注入。
- 当前完整生成契约，以末端 depth 0 system 注入，同时作为 `user_input` 发送。

仍使用
`TavernHelper.generate({ preset_name: 'in_use', max_chat_history: 0 })`。这只证明生成调用路径；尚未证明隐藏宿主楼层、shujuku/ACU 或数据库钩子。

### 4. 删除三份项目内重复 lore

已删除：

- `data/lore-books/tolove-tv-episode-01.txt`
- `data/lore-books/lala-satalin-deviluke.txt`
- `data/lore-books/riko-yuzaki.txt`

当前 `data/lore-books/` 目录为空。

### 5. 调整本地 MVP 验证脚本的断言

已修改：

- `output/verify-story-mvp.mjs`

修改内容：

- 删除固定 12 页断言，改为只要求生成了至少一页。
- 删除三份本地 lore 和人物扫描 token 必须出现的断言。
- 增加通用事件完成契约、运行时阶段边界以及“不再直接注入本地 lore/position:none”的断言。

脚本里的第一集故事仍只是测试 fixture，包含具体剧情名词；生产代码没有用这些名词判断事件是否完成。

本轮尚未运行此脚本。`output/story-mvp-e2e/results.json` 和截图仍是旧结果，不能作为当前实现证据。

### 6. 之前已完成、仍在当前源码中的格式修正

`GalMainStory/storyPresentation.ts` 已不再使用固定 `8-14`
行作为接收条件，情绪标签也允许简短的自由中文词，不再只接受固定情绪枚举。

## 尚未完成

### 1. 活跃文档尚未更新

以下文档仍描述旧的“本地 lore + 原生扫描键 + 直接注入”链路：

- `AGENTS.md`
- `MODULES.md`
- `AI生文与GAL前端整合方案.md`
- `ALDENT_STATUS.md`

已经创建但尚未执行：

- `output/apply-story-generation-docs.mjs`

该脚本包含预定的文档替换。接手者应先审阅，再决定执行或用 `apply_patch`
手工落盘。不要在没跑验证的情况下沿用脚本中预写的“passed”结论。

### 2. 一次性迁移脚本尚未清理

以下脚本是本轮修改源码时的临时迁移工具，完成核对后应删除：

- `output/apply-story-generation-contract.mjs`
- `output/apply-story-generation-contract-2.mjs`
- `output/apply-story-generation-docs.mjs`

在删除前，全文搜索仍会在这些脚本中命中旧 lore 名称和旧注入文本；不要误判为生产链仍在使用。

### 3. 尚无机器级“剧情完成”语义验收

当前实现只是在 prompt 中要求模型完成本阶段。解析器仍只验证 GAL 行格式和说话人，不知道世界书中的必要情节是否真的全部发生。

尚未实现：

- 从世界书取得结构化阶段清单并逐项确认。
- 通用 completion sentinel 或结构化结果字段。
- 首次生成不完整时的自动补写/重试。
- 对结束条件的机器语义校验。

这是当前最大的残余风险：模型仍可能违约提前闭合
`<content>`。如果真实酒馆复测仍提前结束，下一步应设计通用的“阶段契约 + 续写修复”机制，而不是搜索某个装置、角色或具体台词关键词。

### 4. 当前故事适配器仍有第一集专用结构

`services/tavernStoryGeneration.ts` 仍有以下专用内容：

- Lala arrival 的类型、函数和 allowed speakers 命名。
- 第一集两幕的数据映射。
- `getBackground(actIndex, pageIndex)` 依赖固定页码阈值：第一幕第 9 页后切夜景，第二幕第 10 页后切学校。

可变篇幅下，页码阈值可能让背景切换错误。该问题尚未修复。

也尚未建立完整的通用 `StoryEventDefinition` / `StoryActContract`
注册体系，因此“提示词契约”已经通用，但“事件适配和 UI 映射”还没有完全泛化到后续集数。

### 5. 外部 Tavern 世界书尚未改动

本轮只删除了项目内重复 lore，并提出蓝灯世界书整理建议；没有修改用户在 Tavern 中实际启用的 lore book。

建议从常驻世界书删除或合并：

- 重复列出完整事件链的“卷事件索引”。
- 与 Zustand 存档冲突的静态 `事件状态: 未触发`。
- 仅为重复扫描准备的字符串触发变量。
- 由游戏代码结算的 `结束后事件状态`、`可接续事件`。
- 与 Tavern 当前 preset 重复的通用文风、字数和写作协议。
- 同一必要情节的多份摘要、背景复述和叙事重点复述。

建议保留并尽量结构化：

- 当前事件 ID 和当前阶段 ID。
- 本阶段日期/时段/地点和前置条件。
- 有顺序的必要情节。
- 可观察的结束条件。
- 下一禁止边界。
- 本阶段人物初始状态。
- 分支控制、User 介入限制和少量场景调性。

理想的后续世界书结构是
`事件 -> 阶段链[]`，每个阶段拥有独立的触发范围、必要情节、结束条件、自由创作空间和禁止跨越边界。长事件不要只在事件顶层放一组 9 个以上的情节点，否则模型仍容易在一次生成中失去边界。

### 6. 验证和 Aldent 尚未收尾

本轮没有完成以下操作：

| 项目                                       | 当前状态                   |
| ------------------------------------------ | -------------------------- |
| Prettier                                   | 未运行                     |
| ESLint                                     | 未运行                     |
| `node --check output/verify-story-mvp.mjs` | 未运行                     |
| `pnpm build:dev`                           | 未运行                     |
| exact inline bundle 校验                   | 未运行                     |
| 当前版本的浏览器 mock                      | 未运行，也不能替代真实验收 |
| 真实 Tavern 生成                           | 未运行                     |
| 用户截图/AI 原文验收                       | 未收到                     |
| `ALDENT_STATUS.md` 当前轮记录              | 未更新                     |

`dist/webgame-ui/index.html` 当前存在，但本轮没有形成“源码 -> fresh build -> exact inline
verify”的完整证据链，因此必须重新构建后再判断。

## 没有改动的范围

- 没有修改 AP、日期、好感、事件完成标记或存档结算逻辑。
- 没有修改隐藏宿主楼层、shujuku/ACU 或数据库钩子。
- 没有修改 autosave JSON 的读写频率。
- 没有删除 `data/worldbook.ts`；只是故事生成服务不再调用它来构造重复扫描注入。
- 没有为通过测试加入“吸尘器”“GOGO”或其他具体剧情关键词判断。
- 没有声称本地构建、截图或 mock 等于真实酒馆集成成功。

## 建议接手顺序

1. 审阅 `services/storyGenerationPrompt.ts` 和 `services/tavernStoryGeneration.ts` 的最终差异，确认 depth 0 system 与
   `user_input` 重复发送是有意的抗 preset 冲突设计。
2. 审阅并执行 `output/apply-story-generation-docs.mjs`，或手工更新四份活跃文档；所有验证状态必须按实际结果填写。
3. 删除三个一次性迁移脚本，再用 `rg` 确认生产代码中没有旧 lore 直注入和 `position:none` 扫描链。
4. 运行格式化和静态检查。
5. 从 `D:\webgame\tavern_helper_template-main` 运行 `pnpm build:dev`。
6. 运行 `node src/webgame-ui/verify-inline-bundle.mjs dist/webgame-ui/index.html`，确认 exact inline
   artifact 包含当前源码。
7. 将真实结果写入 `ALDENT_STATUS.md`，状态保持 `WAITING_FOR_REVIEW`，不要把自动化检查写成人工接受。
8. 让用户在真实 Tavern 中用新存档或重新生成当前事件，提供截图和“AI 原文”。重点检查浴室介绍之后是否继续完成同一阶段的升级与收束，并且没有跨入下一 AP/日期/阶段。
9. 若仍提前结束，优先实现通用的结构化阶段清单和续写修复流程；不要添加第一集专用关键词检测。

## 接手时的关键判断

- 蓝灯世界书必须真的提供当前阶段的必要情节和结束条件；通用 prompt 本身不会凭空知道缺失的剧情事实。
- 行协议已经不再限定固定长度，但世界书或 Tavern
  preset 中若仍保留“8-14 行”“700-1200 字”等冲突要求，模型仍可能按更短的约束提前结束，需要在实际常驻条目中清掉重复协议。
- 当前生成链使用 `max_chat_history: 0`，连续性依赖显式注入的上一阶段已验收正文和蓝灯世界书，而不是宿主聊天历史。
- 真实复测前不要继续扩大 AP、数据库或宿主桥接范围；本轮问题首先是生成契约和世界书事件边界。
