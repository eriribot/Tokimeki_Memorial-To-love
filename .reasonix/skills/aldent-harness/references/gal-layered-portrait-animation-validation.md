# GAL 分层动态立绘武器库验证记录

## 验证目标

确认 `gal-layered-portrait-animation.md` 能让新代理在没有项目专有答案时：

- 不从幂次方纹理尺寸猜帧数。
- 不编造眼嘴坐标、动画时长或响应式断点。
- 区分分层贴图动画与 Live2D。
- 正确处理横向、纵向和显式矩形图集。
- 形成可以继续取证和自动校验的 sidecar。

## RED：无武器库基线

场景：1024x1024 body、512x512 mask、256x512 眼图、256x256 嘴图，看起来像纵向三帧，画面出现额头和下巴接缝。

实际失败：

- 因为纹理高度不能被三整除，擅自猜成四个等高槽位。
- 把眼帧猜为 256x128、嘴帧猜为 256x64。
- 编造临时眼嘴坐标和 viewport 媒体断点。
- 将“旧游戏常用幂次方纹理”当成四槽推断依据。

结果：FAIL。证明需要明确的证据分级、帧数防猜和整体响应式规则。

## GREEN 1：同场景应用

代理只能读取新武器库，再处理相同场景。

实际行为：

- 将三帧标为推测，不再改猜四帧。
- 使用均匀重采样作为诊断假设，并保留显式矩形分流。
- 拒绝从文件尺寸反推 `x/y/width/height`。
- mask 是否表达完整舞台保持待验证。
- 响应式改用游戏容器，只调整完整 portrait stage。
- 给出逐帧、computed geometry、DPR 和人工审查方法。

结果：PASS。

## GREEN 2：横纵图集变体

场景：1600x1200 舞台、800x600 mask、眼睛横向四帧、嘴巴纵向三帧，从零制作新角色。

实际行为：

- 正确生成 `rows=1, columns=4` 与 `rows=3, columns=1`。
- 要求统一 guides、透明边界和 anchor，禁止 auto crop。
- 正确给出通用 CSS 行列公式。
- 判断普通 PNG 眨眼不是 Live2D。
- 发现初版 manifest 缺少 anchors 与 animation timing。

结果：PASS WITH GAP。进入第一次 REFACTOR。

## REFACTOR 1

补入：

- `center/ground/face` 锚点。
- 眨眼、说话和减弱动画的确定帧与毫秒字段。
- expression 的 `canBlink/canSpeak` 能力。
- 中性 fallback。

## GREEN 3：结构化 sidecar 审查

代理能形成项目 sidecar，但发现初版正式接口仍缺：

- 画布原点与坐标轴。
- 素材尺寸、Alpha 和内容包围盒。
- region 层级、重叠、局部锚点和 padding。
- `explicit-rects` 的实际矩形数组。
- 缺层策略、生命周期、响应式配置和证据记录。

结果：PASS WITH GAP。进入第二次 REFACTOR。

## REFACTOR 2

将示例升级为 `LayeredPortraitProjectSidecar`，补全：

- 技术分类与证据 ID。
- body、mask、sheet 元数据。
- region 几何与合成契约。
- 横向、纵向、网格和显式矩形采样。
- fallback、动画、卸载清理。
- 容器响应式 profiles 与内部不变量。
- `已证实/推测/待验证` 证据记录。

## 最终 GREEN

全新代理只读更新后的武器库，为“1600x1200、眼横向四帧、嘴纵向三帧、其他值未知”生成 sidecar 骨架。

结果：

- 所有题设值正确进入结构。
- 所有未知坐标、顺序、时长和断点均保留显式 `TODO`。
- 没有把项目专有 TODO 误判成通用文档缺口。
- 结构化落地所需的通用字段缺口为 0。

最终结果：PASS。
