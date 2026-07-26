# 春菜 `005_03_05 -> 005_02_05` 表情迁移案例

这个目录是隔离的候选生成与人工审查案例，不是正式立绘资源，也不会被游戏运行时代码读取。页面支持 shy / anger、三个帧、eyes / mouth 独立放大、左右分割对比，以及 `2 表情 x 3 帧 x 2 区域 = 12` 项人工判定。

## 已冻结的失败反例

用户实机截图已经证明旧候选失败：嘴部同时保留了目标旧嘴和迁入的新嘴，出现双唇线、波纹与拼接痕迹。以下做法不能再作为当前候选：

- 在未按官方 02 窗口定位、未逐帧审查的前提下，把 03 atlas 当作最终正式资源；
- 只把矩形边缘换成 02 body；
- dense flow 后整块覆盖；
- 高频差值、线稿增强或全窗口 feather；
- 以“外圈像素相等”“脚本成功”或单张全身截图代替 eyes / mouth 逐帧验收。

`semantic_occlusion_v1` 也已由 2026-07-25 的原尺寸审查图明确拒绝。它虽然回盖了部分 `02` 刘海和下巴，但语义多边形仍搬入了大块 `03` 皮肤、脸宽与下颌像素；结果是 eyes 的额头比例不属于目标脸，mouth 仍截断目标下巴。该分支现在固定为 `rejected-human-review`，只保留失败证据。

`target_native_features_v1` 随后修正了额头和下巴，但 mouth 的 `redness >= 18` 会把正常 `03` 肤色连同嘴芯一起选中。用户在 2026-07-25 的新截图中圈出 shy 三帧嘴周的浅色矩形，该分支也已固定为 `rejected-human-review`；原 `outputs/target-native-features/` 保留且不再覆盖。

旧 `bodylock/high/ink/neutral` 文件保留为失败历史，当前 manifest 和页面不再引用它们。

## 当前基线与研究链

1. 从 `../../official-face-coordinate-map.csv` 读取并验证两个家族的 body、atlas、三帧合同和官方窗口；脚本不接受未解析或未启用的坐标。
2. 按既有运行时采样方式，把完整 power-of-two atlas 双线性缩放为三帧整数图集后再切帧。
3. `target_native_features_v2` 是当前待审候选。shy 的三个 eye 帧都以 `005_02_05_c` 原生闭眼帧为底板；anger 按 `02_c` 的 0/1/2 帧保留原生眼球开合。目标旧线稿只在小范围内清除，刘海不进入清除区。
4. `03_b/c` 先按目标五官锚点做局部缩放和垂直移动。mouth v2 以 ROI 外圈中值估计局部肤色，丢弃接触 ROI 边界的色块，只保留与嘴部中心种子相交的色差连通域；目标旧嘴同样只清除真实嘴形。`03` 皮肤、额头、脸颊、侧发、脸轮廓和下巴均禁止进入结果。
5. 窗口内部由 `005_02_05_c` 原生 atlas 承载；窗口最外侧再以内容完全相同的运行时 `005_02_05_a` body 作窄边界参考：eyes 为上 10px、左右 6px，mouth 为左右 6px、下 8px，最外 4px 精确锁回 body。这里只校正同一 `02` 家族的边缘采样差异，`03` 像素没有进入边带或下巴的权限。所有参数都在 `target-native-feature-config.json`，不会写进 `haruna.ts`。
6. 旧语义遮罩、v1、官方窗口、TV-L1、Poisson 和 body-edge-graft 均保留为失败对照。当前 clean integer atlas 只输出到 `outputs/target-native-features-v2/`：eye `230 x 393`，mouth `230 x 171`，manifest 始终固定 `promotionAllowed: false`。

## 采用依据

- [scikit-image: Registration using optical flow](https://scikit-image.org/docs/stable/auto_examples/registration/plot_opticalflow.html)：官方示例使用 `optical_flow_tvl1` 得到位移场，再通过 `warp` 完成图像注册。本案例已实际反证该稠密流会破坏现有 2D atlas，故只保留为失败对照。
- [OpenCV `SeamlessCloneFlags`](https://github.com/opencv/opencv/blob/4.x/modules/photo/include/opencv2/photo.hpp)：`NORMAL_CLONE` 用于把复杂轮廓对象自然插入新背景；`MIXED_CLONE` 会结合源结构和目标纹理。两者都需要正确的连续对象 mask。
- [scikit-image: Inpainting](https://scikit-image.org/docs/stable/auto_examples/filters/plot_inpaint.html)：`inpaint_biharmonic` 只用于当前候选中人工限定的旧眼嘴线稿像素，不再处理整片脸或包含刘海的动态区。它负责擦除底板旧线稿，不负责跨家族融合。
- [LearnOpenCV: Face Swap using OpenCV](https://learnopencv.com/face-swap-using-opencv-c-python/)：成熟案例采用“可信 landmark -> 凸包/Delaunay 几何对齐 -> mask -> `NORMAL_CLONE`”。当前素材没有可靠 landmark，不能伪造控制点。
- [scikit-image: Piecewise Affine Transformation](https://scikit-image.org/docs/stable/auto_examples/transform/plot_piecewise_affine.html)：只有未来取得可信的源/目标控制点时，才切换到分片仿射方案。

这些资料解释了算法的适用前提，也说明为什么本案例不能把“有一个 mask”误当成可以安全使用 face-swap。表情语义、重影和拼接线仍由人判断。

## 一劳永逸的审查 loop

```text
CSV 权威坐标
-> 02 原生 atlas 完整脸片 + 局部清除旧线稿 + 中心连通且不触边的 03 稀疏特征
-> eyes 与 mouth 原尺寸逐帧审查
-> 12 项全部人工通过 -> 导出审查 JSON -> 另一次明确授权后才可晋升运行时资源

任一项拒绝
-> 收集可信 landmark / 更干净源层
-> 处理型候选仅作为隔离新候选
-> 回到 eyes 与 mouth 原尺寸逐帧审查
```

页面把每个候选的 12 项判定与备注分别保存在浏览器 localStorage。点击一项名称会直接切到对应表情、帧和局部放大；“导出审查记录”产生可回读的 JSON。任一项拒绝就保持候选状态，改算法后生成新候选并重新审查，不继承旧通过结论。

### Eyes 必须逐帧满足

- 眼窗四边、额发、两侧头发、肤色和脸部轮廓连续；
- 02 body 原眼睛、眉毛和睫毛完全消失，无双线、残影、雾边或第二套眼位；
- 03 源表情的眉眼、闭合程度、脸红和汗滴语义保留；
- 三帧连续切换时眼位、眉线、鼻点和融合范围不跳动。

### Mouth 必须逐帧满足

- 嘴窗四边、肤色、下巴和左右发梢连续；
- 02 body 原嘴型完全消失，无双唇线、重复牙齿、波纹、幽灵线或白雾；
- 新嘴型的中心、宽度、开合和高度符合 02 脸型，并保留 03 源表情语义；
- 三帧只改变口型内容，嘴部锚点、下巴线和融合范围不跳动。

最后还必须在真实 GAL 合成中检查 body、mask、eye atlas 和 mouth atlas。案例页面、边界数字、PNG 尺寸或生成命令退出码都只是证据，不是人工接受。

## 文件与生成

- `case-config.json`：家族、表达式、算法和外部资料。
- `acceptance-contract.json`：自动边界记录与 eyes / mouth 人工合同。
- `build_case_assets.py`：旧官方窗口与处理型失败对照的生成器。
- `target-native-feature-config.json`：当前候选的目标帧、局部清除范围、源特征范围与五官位移参数。
- `build_target_native_feature_candidate.py`：当前 v2 候选生成器；只写入案例 `assets/target-native-features-v2/` 与 `outputs/target-native-features-v2/`。
- `semantic-occlusion-config.json`、`build_semantic_occlusion_candidate.py`：已被人工拒绝的 v1 失败分支。
- `case-manifest.json`、`case-data.js`：生成后的输入哈希、坐标、support、边界记录和页面数据。
- `assets/`：每帧各阶段的 1024 画布。
- `outputs/`：候选 clean atlas；不属于运行时。
- `outputs/target-native-features-v2/review/target-native-features-v2-eye-review.png`、`target-native-features-v2-mouth-review.png`：当前候选的 `shy/anger × 3 帧` 原尺寸审查表。

生成器依赖 `requirements.txt`。当前候选使用 Pillow、NumPy、SciPy 与 scikit-image，不需要 OpenCV；运行生成器是素材构建，不代表测试或验收通过。
