# 夕崎梨子分层动态立绘

本目录提供夕崎梨子的轻量分层动态立绘。实现方式为：

```text
body + Alpha mask + 三帧眼睛图集 + 三帧嘴型图集
```

它复用项目现有的 `LayeredPortrait` 组件，不是 Live2D Cubism 模型，也不是原游戏 Unity 资源导出。

## 参考职责

- 角色身份：用户提供的夕崎梨子卡图。只提取暖栗棕短发、黄绿色眼睛、柔和脸型和彩南校服。
- 美术与格式：`../lala/` 和 `../haruna/`。只提取旧式赛璐璐线条、平涂光照、饱和度、1024 舞台占比和三帧纵向图集格式。
- 禁止迁移：菈菈或春菜的发色、瞳色、脸型、姿势、饰品、身体比例和人物性格。
- 卡图中的抬臂姿势、爱心格纹、蕾丝、`Riko` 字样和标识没有进入母图。

## 运行素材

| 文件 | 尺寸 | 内容 |
| --- | ---: | --- |
| `riko_body.png` | 1024×1024 | 黑底不透明 body，轮廓由 mask 裁出 |
| `riko_mask.png` | 512×512 | 与菈菈/春菜相同容器尺寸的 Alpha mask |
| `riko_a_eye.png` | 256×512 | 睁眼、半闭、闭眼三帧纵排 |
| `riko_a_mouth.png` | 256×256 | 闭口、中开、稍大开口三帧纵排 |
| `riko_body_alpha.png` | 1024×1024 | 透明预览，不是运行时必需文件 |

当前只提供第一幕需要的中性 `a` 表情。生产代码中的窗口为：

```text
eyes:  x=400, y=142, width=230, height=100
mouth: x=440, y=225, width=170, height=70
```

## 生产数据

```text
sources/
├─ riko_master_neutral_source.png
├─ riko_master_neutral_alpha.png
├─ riko_eye_half_source.png
├─ riko_eye_closed_source.png
├─ riko_mouth_mid_source.png
└─ riko_mouth_open_source.png

variants/
├─ eye_half.png
├─ eye_closed.png
├─ mouth_mid.png
└─ mouth_open.png
```

`sources/` 和 `variants/` 只用于追溯与继续制图，页面不会读取。母图先生成在偏品红校准底上，再使用 imagegen 技能的 chroma-key helper 去底；因发梢存在细边，最终使用 `--edge-contract 1`。局部表情帧只在眼睛或嘴部范围内与母图合成，窗口边缘保持母图像素。

## 第一幕接入边界

正式入口为：

```text
GalMainStory/galAssets.ts
→ GalMainStory/GalMainStory.tsx
→ GalMainStory/LayeredPortrait.tsx
→ GalMainStory/GalMainStory.css
```

第一集任一幕中，只要本幕演员表登记了梨子：

- AI 页输出 `focus=riko;portrait=school-uniform;expression=neutral` 时显示梨子立绘。
- 当前页说话人同时是夕崎梨子时启用短口型；旁白或其他角色发言时嘴型保持静止。
- 其他页面完全按照各自 AI 演出 cue 渲染，不由代码根据姓名或正文关键词切换。

第二幕只登记梨子为可调度演员，不添加固定梨子台词；是否出镜由世界书指导下的 AI 演出单决定。本目录没有独立 demo，也没有新增测试脚本。

## imagegen 提示词

母图使用内置 imagegen，提示词版本为 `riko-master-v1`：

```text
生成一张供分层 2D galgame 立绘使用的 1024×1024 夕崎梨子中性母图。
身份只来自夕崎梨子卡图：暖栗棕短分层翘发、黄绿色眼睛、柔和少女脸、
奶油黄西装外套、酒红滚边、白衬衫、薄荷绿蝴蝶结、两枚深色纽扣、
深绿色浅绿格纹百褶裙。

菈菈和春菜图片只负责 2000 年代日系电视动画/视觉小说的旧式赛璐璐线条、
平涂、单层硬边阴影、暖肤色、中等偏高但不过曝的饱和度，以及 1024 舞台占比。
不得复制她们的身份、脸型、发色、瞳色、姿势、服装、饰品或身体比例。

人物正面、中心线稳定、头顶完整，长三分之四身到裙摆和大腿上段，
双手自然交叠在身前，小幅闭口微笑，面部无遮挡，便于眼嘴局部替换。
背景使用可去除的校准色；无场景、道具、文字、边框、标识或水印。
禁止抬臂姿势、现代卡面高亮渐变、厚涂、3D、体积光、夸张或性感化体型。
```

四张表情源图均以通过的母图为唯一参考，使用同一不变量模板：

```text
保持画布、镜头、像素位置、脸型、头发、眉毛以外的脸部结构、身体、双手、
校服、格纹、颜色、光照、线条和校准背景不变。每次只修改一个局部：
半闭眼 / 闭眼 / 小幅中开口 / 克制的稍大开口。禁止裁切、缩放、位移、重绘或改风格。
```

## 已知限制

- 视觉和纹理容器兼容不等于原游戏引擎兼容。
- 目前只有一个中性表情组，不包含紧张、认真、惊吓等额外表情。
- 当前接入范围只保证第一幕的夕崎梨子短暂出现，不扩展第二幕演出。
