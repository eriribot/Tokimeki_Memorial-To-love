# GAL 分层动态立绘武器库

## 武器卡

```text
武器名：源坐标还原式分层动态立绘
编号：GAL-PORTRAIT-01
命中症状：假比例、额头/下巴接缝、眨眼跳位、口型错位、mask 黑块、手机端漂移、误称 Live2D
输入：body、mask、眼/嘴图集或独立帧、官方画面、运行时几何
输出：可追溯的资产描述、稳定动画、整体响应式舞台、逐帧验收证据
```

核心原则：先还原素材的原生逻辑坐标和真实帧规则，再做动画；动画不能用来遮掩素材错位。

## 什么时候使用

- 老 GAL、Unity 或其他游戏导出的角色贴图。
- 固定身体叠加眼睛、嘴巴、眉毛或脸部图集。
- 存在 Alpha mask、幂次方纹理、透明边或裁切窗口。
- 立绘出现横向接缝、比例错误、表情漂移或响应式错位。
- 需要判断素材属于 Live2D、绑定式 2D，还是普通分层帧动画。

不用于 3D 模型，也不替代已有 Live2D Cubism、Spine 或 Rive 的正式运行时。

## 技术分类门

| 证据                                                | 应使用的名称                       |
| --------------------------------------------------- | ---------------------------------- |
| 只有 PNG、mask、sprite sheet、逐帧切换              | 分层贴图动画 / facial sprite atlas |
| 存在骨骼、网格、权重和绑定数据                      | 绑定式 2D 或对应引擎名称           |
| 存在 Cubism `.moc3`、`.model3.json`、参数和物理文件 | Live2D Cubism                      |
| 只有视觉上会眨眼或呼吸                              | 不能据此判断为 Live2D              |

引擎导出目录里存在 `Animator` 或 `Mesh`，只证明包内有这些资源类型，不能自动证明当前角色使用骨骼或网格。

## 证据记录契约

每个关键结论必须标为以下一种：

- `已证实`：由像素、元数据、运行时几何、原画面或引擎配置直接证明。
- `推测`：有迹象但没有完整证据，不能写成最终坐标或帧规则。
- `待验证`：必须通过逐帧渲染、截图、日志或人工对照确认。

最低记录表：

| 字段      | 需要记录的内容                                       |
| --------- | ---------------------------------------------------- |
| 逻辑舞台  | 宽、高、原点和轴方向                                 |
| body      | 文件尺寸、Alpha 状态、内容包围盒                     |
| mask      | 文件尺寸、有效通道、包围盒、如何映射到舞台           |
| region    | `x/y/width/height`、层级、是否重叠                   |
| sheet     | 尺寸、方向、帧数、帧顺序、padding、采样方式          |
| anchor    | 人物中心、脚底、脸部和局部窗口锚点                   |
| animation | 动画顺序、周期、重复次数、禁用条件和减弱动画静态帧   |
| fallback  | 中性表情、缺层降级方式和可见错误策略                 |
| evidence  | 官方截图、组件名、像素测量、浏览器 computed geometry |

## 禁止从纹理尺寸猜帧数

幂次方纹理经常包含 padding、非整数分格或运行时重采样。图集总高不能被三整除，不代表它就是四帧。

帧数和顺序只能来自：

- 连续画面内容。
- 引擎配置、组件或脚本。
- 原游戏实际动画。
- 逐帧渲染与官方画面的吻合结果。

当证据只够证明“像三帧”时，先制作逐帧诊断页，不要把四帧、透明预留槽或临时坐标写成实现事实。

## 资产描述契约

坐标、帧数和采样规则应进入角色配置，不应散落在组件和响应式 CSS 中。

```ts
type Point = { x: number; y: number };
type Size = { width: number; height: number };
type Rect = Point & Size;

interface AssetDescriptor {
  src: string;
  sourceSize: Size;
  alpha: "present" | "absent" | "unverified";
  contentBounds?: Rect;
}

interface SheetDescriptor extends AssetDescriptor {
  direction: "horizontal" | "vertical" | "grid";
  frameCount: number;
  rows: number;
  columns: number;
  slotOrder: readonly number[];
  padding: { top: number; right: number; bottom: number; left: number };
  sampling: "uniform-resample" | "integer-grid" | "explicit-rects";
  rects?: readonly Rect[];
}

interface LayeredPortraitProjectSidecar {
  schemaVersion: string;
  classification: {
    type: "layered-sprite-atlas" | "rigged-2d" | "live2d-cubism";
    evidenceIds: readonly string[];
  };
  rig: {
    id: string;
    canvas: {
      width: number;
      height: number;
      origin: "top-left";
      axes: "x-right-y-down";
    };
    anchors: {
      center: Point;
      ground: Point;
      face: Point;
    };
    body: AssetDescriptor;
    mask?: AssetDescriptor & {
      channel: "alpha";
      scope: "full-stage" | "region";
      fit: "stretch-to-canvas" | "native";
      compositeRegions: readonly string[];
    };
    regions: Record<
      string,
      {
        rect: Rect;
        localAnchor: Point;
        zIndex: number;
        overlap: "none" | "intentional" | "unverified";
        sheet: SheetDescriptor;
      }
    >;
    expressions: Record<
      string,
      {
        sheets: Record<string, string>;
        canBlink: boolean;
        canSpeak: boolean;
      }
    >;
    fallback: {
      expression: string;
      missingExpression: "use-fallback" | "visible-error";
      missingRegion: "use-fallback" | "visible-error";
      missingMask: "visible-error" | "allow-unmasked";
    };
    animations: {
      blink: {
        region: string;
        order: readonly number[];
        cycleMs: number;
        disabledExpressions: readonly string[];
      };
      speaking: {
        region: string;
        order: readonly number[];
        frameMs: number;
        repeats: number;
        activeWhen: "current-character-is-speaking";
      };
      reducedMotion: Record<string, number>;
      clearTimersAndListenersOnUnmount: true;
    };
  };
  responsive: {
    basis: "game-container" | "scene-container";
    profiles: Record<
      string,
      {
        query: string;
        stagePlacement: {
          width: string;
          horizontal: string;
          vertical: string;
        };
      }
    >;
    invariantFields: readonly ["rig.regions", "rig.anchors", "rig.mask"];
  };
  evidence: readonly {
    id: string;
    assertion: string;
    grade: "已证实" | "推测" | "待验证";
    sourceKind:
      | "pixel"
      | "metadata"
      | "runtime"
      | "official-frame"
      | "human-review";
    sourceRef: string;
    artifactPath?: string;
    observed: string;
    expected?: string;
    result: "pass" | "fail" | "open";
  }[];
}
```

`regions.*.sheet` 保存默认图集；`expressions.*.sheets` 按 region 名覆盖具体表情文件。同一角色的舞台、region 和 anchor 默认保持不变。

当 `sampling` 为 `explicit-rects` 时，`rects` 必须存在且长度等于 `frameCount`。`slotOrder` 描述物理槽位语义，动画中的 `order` 描述实际播放顺序，两者不能混为一项。

锚点与动画字段必须使用逻辑舞台坐标和明确的毫秒值。不要把 `bottom:-12px`、`setTimeout(300)` 之类的项目参数散落到组件里以后再反推。项目未知值必须保留显式 `TODO`，不能为了满足类型而编造。

## 原生坐标还原

1. 确定 body 所属的逻辑舞台。
2. 让 body、mask 和所有局部层先在这个舞台中完全对齐。
3. 用像素或官方画面测量局部窗口，不凭肉眼“差不多”。
4. 在逻辑坐标正确后，再换算百分比或归一化 UV。
5. 外部只移动、缩放或裁剪完整舞台。

百分比换算：

```text
left%   = x / canvasWidth * 100
top%    = y / canvasHeight * 100
width%  = regionWidth / canvasWidth * 100
height% = regionHeight / canvasHeight * 100
```

mask 与 body 分辨率可以不同。只要它们表达同一完整舞台，mask 可以拉伸到舞台尺寸；不能因为 mask 较小就把它当成局部贴片。

## 图集渲染模式

### 均匀重采样

适用于已证实为规则行列，但源纹理尺寸包含旧引擎 padding 或不能被帧数整除的情况。

```css
.region {
  position: absolute;
  overflow: hidden;
}

.region > img {
  position: absolute;
  top: calc(var(--row) * -100%);
  left: calc(var(--column) * -100%);
  width: calc(var(--columns) * 100%);
  height: calc(var(--rows) * 100%);
  max-width: none;
  max-height: none;
}
```

这里 `top` 和 `left` 每次移动一个裁切窗口。不要给图集使用 `height:auto`、`object-fit:contain` 或 `object-fit:cover`。

如果改用 transform，它的百分比相对于图集自身尺寸，必须除以总行列数：

```text
translateY = -row / rows * 100%
translateX = -column / columns * 100%
```

### 整数网格

新制作的素材优先使用：

```text
atlasWidth  = frameWidth  * columns
atlasHeight = frameHeight * rows
```

每帧使用完全相同的透明边界和锚点，禁止逐帧自动裁边。

### 显式矩形

如果每帧边界、padding 或尺寸不一致，不能继续使用均匀 CSS 网格。应在 manifest 中记录每帧 source rect，并使用 Canvas、WebGL 或预裁独立帧。

## Alpha mask 防线

- 先检查 body 是否真的含透明通道；完全不透明的 body 通常依赖 mask。
- mask 的有效信息可能只在 Alpha，白色 RGB 不代表它是一张空图。
- mask 应作用于 body 与所有脸部层合成后的整体。
- 不能用黑色、绿色或其他颜色键替代已经存在的 Alpha mask。
- 在白、黑、角色主色和高对比背景上检查抗锯齿边缘。
- mask、body 和局部层必须共享同一个 transform 和裁切父级。

## 动画状态分离

把可见运动拆成独立状态：

| 状态 | 驱动来源         | 最低要求             |
| ---- | ---------------- | -------------------- |
| 表情 | 剧情或角色状态   | 有中性 fallback      |
| 眨眼 | 时间与表情能力   | 闭眼表情可禁用       |
| 口型 | 当前实际说话角色 | 非说话角色停在静态帧 |
| 呼吸 | 低幅整体动画     | 不改变内部坐标       |
| 入场 | 场景切换         | 结束后不改变布局尺寸 |

短循环口型不是音素同步。没有音频分析时，应称“说话状态动画”，不能宣称 lip sync。

实现必须支持 `prefers-reduced-motion`，停在合法静态帧；组件卸载后不得残留 timer 或事件监听。

## 自己制作素材的导出规范

1. 建立固定尺寸的角色主画布。
2. 标记人物中心、落地点、眼窗和嘴窗。
3. 所有表情复用同一组 guides 与 anchor。
4. 每帧保留相同的周围皮肤、头发和抗锯齿边缘。
5. 所有帧使用相同导出尺寸，关闭“裁切到内容”。
6. 新图集使用整数网格，并把顺序写入 manifest。
7. 先导出中性 fallback，再制作特殊闭眼、流泪或夸张表情。
8. 为缺失的眼睛、嘴巴或 mask 定义可见失败或明确降级，不能显示破图后继续剧情。
9. 在 manifest 中记录人物中心、脚底和脸部锚点，以及眨眼、说话和减弱动画的确定帧。

## 响应式舞台

嵌入式游戏优先使用游戏框或场景容器尺寸，而不是浏览器 viewport。

断点可以改变：

- 完整立绘舞台的 `width`、`right/left`、`bottom/top`。
- 对话框与立绘之间的占位关系。
- 控件密度和可见性。

断点不能改变：

- 同一角色的眼睛和嘴巴内部坐标。
- mask、body 与脸部层之间的 transform。
- 单独一帧的裁切边界或锚点。

如果手机端只有眼睛或嘴巴需要额外微调，优先判定为源坐标或父级缩放错误，不要立刻增加设备专用补丁。

## 验证矩阵

### 素材与逐帧

- body Alpha、mask Alpha 和有效包围盒已测量。
- 每个 expression 的每个 frame 都能单独显示。
- 额头、眉毛、鼻梁、脸颊、下巴和层重叠区无接缝。
- 表情切换时 anchor 不跳动。
- 缺失素材回退到中性帧或显示明确错误。

### 动画

- 眨眼顺序正确，特殊闭眼表情不会假眨眼。
- 只有当前说话角色播放口型。
- 翻页或切换表情只重启动画一次。
- 减少动态模式停在稳定合法帧。
- 动画开始、停止和 hover 不改变布局尺寸。

### 布局与运行时

- PC、平板横屏、手机横屏逐档截图。
- 80%、100%、125%、200% 缩放和高 DPR 至少抽查一组。
- 剧情层不越出游戏框，人物不遮住必要控件和正文。
- 所有资源成功解码，控制台和 Network 无错误。
- 用 computed geometry 或 canvas 像素检查证明内部 region 比例没有随断点变化。

自动检查是证据，不是人工验收。最后必须让人看逐帧接缝、表情语义和真实设备触控体验。

## 常见失败与修复方向

| 失败                           | 修复方向                                   |
| ------------------------------ | ------------------------------------------ |
| 图集不能整除帧数，就猜成更多帧 | 回到动画、配置和逐帧证据；允许运行时重采样 |
| 额头或下巴横线                 | 检查完整图集渲染尺寸、窗口高度和层级重叠   |
| 眨眼时整张脸跳动               | 检查逐帧自动裁边和 anchor 差异             |
| body 周围黑块                  | 检查是否漏用 Alpha mask                    |
| 黑色角色部件消失               | 停止颜色键抠图，恢复 Alpha mask            |
| 手机端内部错位                 | 只调整完整舞台，撤销眼嘴设备补丁           |
| 表情文件缺失后继续剧情         | 增加 manifest 校验和中性 fallback          |
| PNG 会动就称 Live2D            | 回到技术分类门，要求模型与绑定证据         |

## 项目适配边界

全局武器库只保存方法，不保存某个角色的专有弹道数据。以下内容必须留在项目文档：

- 角色名和文件路径。
- 具体逻辑画布、region 坐标和重叠像素。
- 表情键、帧数、帧顺序和动画时长。
- 项目断点、对话框尺寸和控件布局。
- 已实际验证的浏览器、视口和截图路径。

执行顺序固定为：

```text
技术分类
-> 资产清单
-> 证据分级
-> 原生坐标还原
-> 数据化描述
-> 动画状态
-> 整体响应式
-> 逐帧与多尺寸实测
-> 人工审查
```

武器库的 RED、GREEN 与 REFACTOR 记录见 [gal-layered-portrait-animation-validation.md](gal-layered-portrait-animation-validation.md)。
