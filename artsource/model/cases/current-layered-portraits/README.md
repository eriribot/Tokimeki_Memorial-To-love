# 当前分层立绘校准批次

这个案例把 `eve`、`lala/lala_school`、`risa`、`ryoko` 的现有官方 PNG 按 `official-face-coordinate-map.csv`
还原成可审查的分层合成。它只准备素材合同和证据，不修改源 PNG，也不注册到 `GalMainStory`。

## 运行

在本目录执行：

```text
python build_calibration.py
```

脚本会严格按完整 `family_id` 选择 CSV 记录，验证四类源图尺寸、body/mask Alpha、三帧合同和声明的缺件，然后重建 `outputs/`
中的 manifest 与审查图。

## 输出

- `outputs/calibration-manifest.json`：四套素材、源文件 SHA-256、坐标证据、缺件状态和审查入口。
- `outputs/manifests/*.portrait.json`：每个角色的默认完整表情与全量完整/缺件总览。
- `outputs/manifests/<角色>/*.portrait.json`：每个当前完整配对各一份，可直接导入上级 `model/index.html`
  逐对检查；缺件表达式不会生成可载入文件。
- `outputs/review/*-expression-frame-review.png`：每个字母两行六格。第一行只改变 eyes 0/1/2，第二行只改变 mouth 0/1/2。
- `outputs/review/*-default-motion-sequence.png`：默认完整表情的九格连续演示，按行阅读： `眼 0→1→2→1→0`，再接
  `嘴 0→1→2→1→0`；它只帮助观察连续变化，不代表原作定时或已确认的表情语义。
- `outputs/review/*-mask-background-review.png`：默认完整表情在白、黑、粉、蓝背景上的 mask 边缘。
- `outputs/review/four-portrait-neutral-contact.png`：四套默认完整表情与官方窗口坐标总览。

## 边界

- `complete` 只表示当前目录同时有对应 eye/mouth 且机器合同通过，不表示表情语义或美术观感已由人接受。
- `incomplete` 图只显示现有层，缺层保持空缺；它不能进入运行时，也不能借用其他字母或服装的图层冒充官方配对。
- 眼睛、嘴巴和 mask 都按整张旧式纹理重采样；不能先按原始纹理高度硬切，也不能改成保持原纵横比。
- `promotionAllowed` 固定为 `false`。后续接入正文需要单独的人审、角色注册、语义映射和多尺寸运行时验证。
