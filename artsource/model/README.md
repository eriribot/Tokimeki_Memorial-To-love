# 分层动态立绘校准台

`artsource/model/` 是角色无关的本地校准页，用来在接入 `LayeredPortraitRig` 前检查四份运行素材并确定窗口坐标。页面默认预载 `../sephie/` 的 body、mask、eye atlas 与 mouth atlas，换角色时直接选择本地图片即可。

## 使用

从 `src/webgame-ui` 启动任意静态文件服务，然后打开：

```text
/artsource/model/index.html
```

页面不上传、裁切或改写图片。它只读取浏览器中的图片尺寸并生成配置；正式素材仍需人工放进项目目录。

建议顺序：

1. 填写角色 ID、立绘 ID、显示名、默认表情 ID、眨眼开关和运行时素材目录。
2. 依次选择 body、mask、eye atlas、mouth atlas。
3. 确认逻辑画布与 body 尺寸。旧式兼容素材允许 512×512 mask 拉伸到 1024×1024，但宽高比必须一致。
4. 拖动 eyes / mouth 框确定位置；拖右下角改变窗口尺寸。方向键每次移动 1px，`Shift + 方向键` 每次移动 10px。
5. 逐帧检查额头、鼻梁、脸颊和下巴接缝。`feather` 会在窗口上、右、下、左四边等距生效，与项目 `PortraitRegion.feather` 的标量语义一致。
6. 逻辑画布与 GAL 构图现在并排显示；右侧参数区也把两组画布参数放成同级区块。GAL 可直接调整预览宽高和人物舞台的 `size / right / bottom`，默认仍是 tablet 档的 `844×390 + 48% / 4% / 0`。
7. 复制 `regions` 或完整 `LayeredPortraitRig`，也可下载 manifest 作为下次继续校准的输入。

## 文件

- `index.html`：页面结构与控件。
- `model.css`：校准台、四边 feather、方形舞台与 GAL 构图样式。
- `model.js`：素材载入、拖动/缩放、逐帧、校验、JSON 与 TypeScript 导入导出。
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

当前正式 `LayeredPortrait` 的 CSS 固定按三帧纵排播放。校准页允许临时查看 1–12 帧素材，但非三帧会显示不兼容提示，不能仅靠导出的 rig 直接接入。GAL 舞台参数也只属于构图记录，并不是 `LayeredPortraitRig` 字段；若确需修改正式舞台，应另行调整项目 CSS，而不是把它塞进角色定义。

导入 manifest 会尝试按其中的路径重新载入图片。若目录移动或直接以 `file://` 打开导致路径不可用，重新选择四份本地图片即可；坐标和其他配置不会因此丢失。

该 manifest 是本项目的美术校准记录，不是 Unity/Cubism 模型文件，也不会替代人工逐帧和最终 Tavern 画面验收。
