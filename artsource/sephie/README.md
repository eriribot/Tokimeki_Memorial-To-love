# Sephie 分层动态立绘

正式游戏在 `VelvetRoom/SephiePortrait.tsx` 中使用：

| 文件                          |      尺寸 | 内容                         |
| ----------------------------- | --------: | ---------------------------- |
| `sephie_body_runtime_v11.png` | 1024×1024 | 自带透明 Alpha 的正式 body   |
| `sephie_a_eye.png`            |   256×512 | 睁眼、半闭、闭眼三帧纵排图集 |
| `sephie_a_mouth.png`          |   256×256 | 闭口、中开、大开三帧纵排图集 |

眼睛窗口为 `x=400, y=90, w=225, h=145`；嘴部窗口为 `x=420, y=185, w=185, h=105`。

## 保留的制作与校准文件

- `build_runtime_assets.py`、`sephie_body_runtime_v3.png`、 `sephie_body_runtime_v7.png`、`sephie_body_alpha.png` 与
  `sources/sephie_master_face_veil_source.png` 用于重新生成 V11。
- `sephie_body.png`、`sephie_mask.png` 与 `demo.*` 供独立旧式校准页使用，不由正式游戏加载。
- `sources/`、`variants/` 和 `drafts/` 是美术生产与历史归档，不进入正式游戏引用链。

临时对比图、过时候选运行图和 Python 缓存不应保留在该目录。
