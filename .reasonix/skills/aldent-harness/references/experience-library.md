# 艾尔登特经验索引

本文件只供人浏览。Agent 应从 `SKILL.md` 直接读取命中的单个经验文件，不要把整套经验同时载入上下文。

| 经验            | 文件                                | 触发信号                              |
| --------------- | ----------------------------------- | ------------------------------------- |
| 审查门          | `experience-review-gate.md`         | 边界不清、人工验收、下一轮范围        |
| 方案成熟度      | `experience-pattern-maturity.md`    | 终极、默认、生产可用、UI 外壳选型     |
| 语义验收        | `experience-semantic-acceptance.md` | fixture、自证测试、旧产物、真人反例   |
| 消息污染        | `experience-message-pollution.md`   | 摘要、回溯、重生成、历史拼装          |
| 世界书路由      | `experience-worldbook-routing.md`   | 大角色卡、按场景选择上下文            |
| 真实宿主楼层    | `experience-host-floor-bridge.md`   | hidden floors、shujuku、ACU、qrf_plot |
| 宿主钩子隔离    | `experience-host-hook-isolation.md` | 开场/预览隔离路线与普通原生路线       |
| 模块边界        | `experience-module-boundaries.md`   | 入口、状态、prompt、动作、渲染串层    |
| 审查记录        | `experience-review-record.md`       | 跨文件、复杂 bug、新协议              |
| 同层样式        | `experience-same-layer-style.md`    | 宿主头像、布局或插件 UI 被污染        |
| Webgame/Galgame | `experience-webgame-galgame.md`     | 选项、结算、正文、重生成              |
| 身份显示        | `experience-identity-display.md`    | API/state 正确但用户看到旧身份        |
| 分层立绘        | `experience-layered-portrait.md`    | 图集、Alpha、坐标、眨眼、口型         |

新经验至少满足两项：解决过真实故障、保护明确规则、可跨任务复用、有可执行检查、降低人工审查成本。
