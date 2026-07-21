# 艾尔登特人工审查表

## 审查对象

- 范围：第一集唯一 `<content>` 标签对直接抽取、条件化场景完成合同与场景立绘唯一绑定
- 构建产物：`dist/webgame-ui/index.html`
- SHA-256：`710BFA488B2849651657E82B5723A84D6C5F2E65718416629101BD50D44A15E6`
- 权威记录：`AI生文与GAL前端整合方案.md`、`MODULES.md`、`ALDENT_STATUS.md`、`references/aldent-review-invitation.md`

## Content 合同

- [ ] 通过
- [ ] 有条件通过
- [ ] 未通过
- [ ] 证据不足

真实第二幕 User prompt 与 Assistant 是否使用 `<content>...</content>`，并且完全不再出现 panc：

## Content 抽取

- [ ] 通过
- [ ] 有条件通过
- [ ] 未通过
- [ ] 证据不足

即使前面存在不匹配的
`</konatan_planning~>`，唯一且完整的 content 标签对是否仍能进入 GAL；容器外文字是否被丢弃，正文中其他尖括号标签标记是否被过滤；缺失、未闭合或重复 content 是否可见失败：

## 场景立绘

- [ ] 通过
- [ ] 有条件通过
- [ ] 未通过
- [ ] 证据不足

第二幕浴室中的菈菈是否始终使用 `washroom-swimsuit`；其他场景是否始终使用
`arrival-default`；错误字段是否被拒绝而不是静默替换：

## 剧情完整性

- [ ] 通过
- [ ] 有条件通过
- [ ] 未通过
- [ ] 证据不足

第二幕是否至少 30 行，依次首次进入
`washroom -> home -> bedroom -> rooftop -> nightStreet -> park -> schoolRoad`，并完整演完世界书最后情节点后结束：

## 接通

- [x] 不涉及新的接通
- [ ] 只是界面草图
- [ ] 只是本地状态演示
- [ ] 已接入真实状态读取
- [ ] 已接入真实状态写入
- [ ] 已可作为正式流程使用
- [ ] 证据不足

本轮只修既有 generate 路线的 prompt 与本地候选校验。hidden host
floors、`MESSAGE_SENT`、shujuku/ACU、插件和数据库仍未接通；真实 Tavern 复验结果：

## 最终决定

- [ ] 接受；不需要下一实现轮
- [ ] 接受；按下面范围开启下一实现轮
- [ ] 拒绝；按下面范围重做
- [ ] 证据不足；先补证据，不改实现

## 下一轮允许修的问题

1.
2.
3.

## 下一轮禁止碰的内容

-

## 下一轮完成标准

1.
2.
3.

## 必须提供的运行时证据

- 修正后真实第二幕 User prompt 与原始 Assistant content 输出，包括 content 前的原始规划标签片段。
- 浴室和离开浴室后的菈菈立绘截图，以及对应原始演出字段。
- 唯一完整 content 在畸形规划标签之后仍成功进入 GAL，以及缺失、未闭合或重复 content 的可见失败结果；不得用本地 mock 代替真实 preset 行为。
- 第二幕场景顺序与世界书最后情节点的人工阅读结论。

## 必须停下来问人的情况

- 需要改变世界书剧情、AP/日期/好感结算、fallback、自动重试、真实宿主楼层或插件/数据库副作用时。

未勾选的评论不构成下一轮授权。
