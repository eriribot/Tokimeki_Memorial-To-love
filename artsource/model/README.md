# 分层动态立绘校准台

`artsource/model/` 是角色无关的本地校准页，用来在接入 `LayeredPortraitRig`
前检查四份运行素材并确定窗口坐标，也可把旧立绘家族的表情 atlas 转成目标 body 可用的 clean integer atlas。页面默认预载
`../sephie/` 的 body、mask、eye atlas 与 mouth atlas，换角色时直接选择本地图片即可。

## 使用

当前 `5500` 服务以仓库根目录为静态根时，直接打开：

```text
http://localhost:5500/artsource/model/index.html
```

仓库根的这个入口只跳转到真实源码页 `/src/webgame-ui/artsource/model/index.html`，不会复制校准台代码，也不会改变现有
`/dist/webgame-ui/` 链路。若静态服务本身从 `src/webgame-ui` 启动，仍可直接使用 `/artsource/model/index.html`。

页面不上传、裁切或改写图片。它只读取浏览器中的图片尺寸并生成配置；正式素材仍需人工放进项目目录。

建议顺序：

1. 填写角色 ID、立绘 ID、显示名、默认表情 ID、眨眼开关和运行时素材目录。
2. 依次选择 body、mask、eye atlas、mouth atlas。
3. 确认逻辑画布与 body 尺寸。旧式兼容素材允许 512×512 mask 拉伸到 1024×1024，但宽高比必须一致。
4. 拖动 eyes / mouth 框确定位置；拖右下角改变窗口尺寸。方向键每次移动 1px，`Shift + 方向键` 每次移动 10px。
5. 逐帧检查额头、鼻梁、脸颊和下巴接缝。`feather` 会在窗口上、右、下、左四边等距生效，与项目 `PortraitRegion.feather`
   的标量语义一致。
6. 逻辑画布优先占据工作区，桌面宽屏下会比参数区和 GAL 构图预览更大；窄屏才改为纵向排布。GAL 可直接调整预览宽高和人物舞台的
   `size / right / bottom`，默认仍是 tablet 档的 `844×390 + 48% / 4% / 0`。
7. 复制 `regions` 或完整 `LayeredPortraitRig`，也可下载 manifest 作为下次继续校准的输入。

## 当前四角色官方分层校准批次

[`cases/current-layered-portraits/`](cases/current-layered-portraits/) 保存 `eve`、`lala/lala_school`、`risa`、`ryoko`
现有素材的批量校准包。它严格按完整 `family_id` 读取本目录的
`official-face-coordinate-map.csv`，不调用跨姿势表情迁移，也不使用已否决的body-edge-graft。

```text
python cases/current-layered-portraits/build_calibration.py
```

生成物包括四角色总 manifest、19 份当前完整 eye/mouth 配对的可导入
`.portrait.json`、5 组缺件诊断、独立 eyes/mouth 逐帧合成图和四背景 mask 图。脚本会重建该案例自己的
`outputs/`，不会覆盖原始角色 PNG。

这些文件的状态是 `calibration-only-awaiting-human-review`，`promotionAllowed` 固定为
`false`。完整 eye/mouth 配对和机器尺寸检查只证明素材可被校准台加载；字母表情语义、眨眼规则、接缝观感、GAL 构图与正式角色注册仍需单独验收。缺件表达式不会生成可导入 manifest，不能借用其他字母或服装的图层冒充完整配对。

## 跨家族表情流水线

`index.html` 现在先显示隔离的春菜 `005_03_05 → 005_02_05` 流水线。内嵌案例可以切换 shy / anger、三个帧、像素归属图、eyes
/
mouth 独立放大、已拒绝的语义遮罩、官方窗口基线和两条 Poisson 对照，也能任意选择左右图、拖动分割线并记录 12 项人工判定。

试运行链路：

1. 对整张 power-of-two atlas 做双线性重采样，再切出三个整数帧。
2. 当前 v2 候选以 `005_02_05_c`
   原生 atlas 作为完整脸片：shy 使用原生闭眼底板，anger 保留原生三帧眼球；只在小范围清除原线稿，再迁入 `03_b/c`
   的眉眼线、汗滴和嘴芯。参数位于 `target-native-feature-config.json`。
3. mouth 不再用偏红阈值直接选像素。v2 先估计 ROI 外圈的局部肤色，只保留同时偏离该肤色、与嘴部中心种子相交且不接触 ROI 外边界的连通域；目标旧嘴也只按真实嘴形清除。v1 圈出的矩形
   `03` 肤色因此被排除。
4. 像素归属阶段以红色显示目标旧线稿清除区、绿色显示源特征、青色显示保留的目标刘海、蓝色显示目标原生腮红、黄色显示同一
   `02_a` body 的窄边界参考；`03` 皮肤、脸宽与下巴没有迁移权限。
5. TV-L1、动态区 support mask、Telea inpaint 与 `seamlessClone`
   仍保留为可复现研究对照，但本案例已由原尺寸画面反证会损坏刘海、眉眼或下巴；`poisson_normal` 与 `poisson_mixed` 均为
   `rejected-visual-artifact`。
6. 每个候选导出 `230×393` eye atlas 与 `230×171` mouth atlas；v2 输出位于
   `outputs/target-native-features-v2/`，manifest 固定 `promotionAllowed: false`。

具体算法、在线依据、输入哈希、位移统计、边界记录和验收合同都在 `cases/haruna-03-to-02/`。默认是尚未验收的
`target_native_features_v2`；`semantic_occlusion_v1` 与带矩形嘴周肤色的 `target_native_features_v1`
均已由原尺寸截图拒绝。必须逐帧完成人工 eyes / mouth 12 项审查并另行授权，页面和脚本才可能进入后续运行时晋升步骤。

原来的 body-edge-graft 区继续保留在下方，但已明确标为“旧边缘补图实验（已否决）”。完整 02/03 家族素材已经证明：只换矩形边缘仍会保留错误的 03 眼位、眉位、脸红和下巴几何。旧区只用于复现失败结果，不得晋升为正式素材，也不能与运行时
`PortraitRegion.feather` 混为一谈。

## 文件

- `index.html`：页面结构、流水线案例入口与控件。
- `model.css`：校准台、四边 feather、方形舞台与 GAL 构图样式。
- `model.js`：素材载入、拖动/缩放、逐帧、校验、JSON 与 TypeScript 导入导出；其中 body-edge-graft 只对应页面中已否决的旧实验。
- `cases/haruna-03-to-02/`：失败对照、`02` 原生脸片 + `03` 稀疏特征候选、可调像素所有权、逐帧观察器与 clean atlas 输出。
- `README.md`：使用和数据边界。

## Manifest 边界

导出的 JSON 记录：

- 角色与立绘身份；
- 运行时文件路径及当前浏览器读到的尺寸；
- 逻辑画布、eyes / mouth 区域与四边 feather；
- 眼睛和嘴型各自的纵排帧数；
- 单个默认表情的 eye / mouth 路径及眨眼开关；
- GAL 构图中的人物舞台 `size / right / bottom` 参数。
- 可变的 GAL 预览画布宽高；人物舞台仍保持正方形，高度由尺寸百分比自动换算。

当前正式 `LayeredPortrait`
的 CSS 固定按三帧纵排播放。校准页允许临时查看 1–12 帧素材，但非三帧会显示不兼容提示，不能仅靠导出的 rig 直接接入。GAL 舞台参数也只属于构图记录，并不是
`LayeredPortraitRig` 字段；若确需修改正式舞台，应另行调整项目 CSS，而不是把它塞进角色定义。

导入 manifest 会尝试按其中的路径重新载入图片。若目录移动或直接以 `file://`
打开导致路径不可用，重新选择四份本地图片即可；坐标和其他配置不会因此丢失。

该 manifest 和转换 JSON 都是本项目的美术校准记录，不是 Unity/Cubism 模型文件，也不会替代人工逐帧和最终 Tavern 画面验收。
