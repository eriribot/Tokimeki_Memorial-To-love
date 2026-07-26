# 立绘表情迁移流水线总结

## 执行摘要

### ✅ 可用的工具和流程

项目已经有一套**完整、可复现**的立绘表情迁移流水线，但 GPT5.6 sol 使用的旧方法已被证明不合格。

### ❌ GPT5.6 的方法存在的问题

#### 使用的方法：`body-edge-graft`（边缘补图）
- **位置**：`artsource/model/model.js` 中的 `HARUNA_TRANSFORM_PRESET`
- **算法**：保留源表情中心内容，只把矩形边缘像素换成目标 body
- **状态**：**已明确否决** ✗

#### 为什么被否决

根据 `artsource/model/README.md` 第 42 行：

> 完整 02/03 家族素材已经证明：只换矩形边缘仍会保留错误的 03 眼位、眉位、脸红和下巴几何。旧区只用于复现失败结果，不得晋升为正式素材。

#### 具体问题

1. **保留了错误的源姿势几何**：
   - 03 的眼位和眉位与 02 不同
   - 03 的脸宽和下巴形状与 02 不同
   - 只换边缘无法修正这些结构差异

2. **接缝质量差**：
   - 矩形边缘过渡生硬
   - 刘海可能被损坏或模糊

3. **已生成的文件不能使用**：
   ```
   005_02_05_from_03_b_eye.png      ← 使用旧方法生成，不得用于运行时
   005_02_05_from_03_b_mouth.png    ← 使用旧方法生成，不得用于运行时
   005_02_05_from_03_c_eye.png      ← 使用旧方法生成，不得用于运行时
   005_02_05_from_03_c_mouth.png    ← 使用旧方法生成，不得用于运行时
   ```

### ✅ 正确的方法：Target Native Features V2

#### 核心理念

**使用目标姿势的完整脸片作为基础**，只迁移源表情的核心特征（眉眼线稿、汗滴、嘴芯）。

#### 优势

| 特性 | body-edge-graft (已否决) | Target Native Features V2 (正确方法) |
|------|------------------------|-------------------------------------|
| 脸型 | ❌ 保留源姿势脸型 | ✅ 使用目标姿势脸型 |
| 眼位 | ❌ 保留源姿势眼位 | ✅ 调整到目标姿势眼位 |
| 刘海 | ⚠️ 可能损坏 | ✅ 完整保留目标刘海 |
| 下巴 | ❌ 保留源姿势几何 | ✅ 使用目标姿势下巴 |
| 嘴周肤色 | ⚠️ 可能混入源肤色 | ✅ V2 排除边界接触的色块 |

#### 当前状态

春菜案例的 V2 输出**已经生成**，位于：
```
artsource/model/cases/haruna-03-to-02/outputs/target-native-features-v2/
├── 005_02_05_from_03_05_b_target_native_features_v2_eye.png
├── 005_02_05_from_03_05_b_target_native_features_v2_mouth.png
├── 005_02_05_from_03_05_c_target_native_features_v2_eye.png
└── 005_02_05_from_03_05_c_target_native_features_v2_mouth.png
```

但是：
- ⏳ **尚未完成 12 项人工验收**
- 🚫 **不得直接用于运行时**（`promotionAllowed: false`）
- 📋 必须先通过验收，才能晋升到正式素材

---

## 完整工作流程

### 阶段 1：准备（已完成 ✅）

```bash
# 案例目录已创建
artsource/model/cases/haruna-03-to-02/

# 配置文件已就位
├── case-config.json                        # 案例元数据
├── target-native-feature-config.json       # V2 算法参数
└── acceptance-contract.json                # 验收模板
```

### 阶段 2：生成候选（已完成 ✅）

```bash
cd artsource/model/cases/haruna-03-to-02/
python build_target_native_feature_candidate.py
```

输出已生成在 `outputs/target-native-features-v2/`。

### 阶段 3：人工验收（待完成 ⏳）

#### 验收界面
```
http://localhost:5500/artsource/model/cases/haruna-03-to-02/index.html
```

#### 需要审查的项目（共 12 项）

**shy 表情（6 项）**：
- [ ] shy_frame0_eyes - 眉眼线稿、刘海、额头接缝、汗滴
- [ ] shy_frame0_mouth - 嘴型、嘴芯、脸颊、下巴
- [ ] shy_frame1_eyes
- [ ] shy_frame1_mouth
- [ ] shy_frame2_eyes
- [ ] shy_frame2_mouth

**anger 表情（6 项）**：
- [ ] anger_frame0_eyes - 眉毛线稿、眼神、刘海完整性
- [ ] anger_frame0_mouth - 嘴型、脸颊、下巴连续性
- [ ] anger_frame1_eyes
- [ ] anger_frame1_mouth
- [ ] anger_frame2_eyes
- [ ] anger_frame2_mouth

#### 验收标准（来自 acceptance-contract.json）

**Eyes 检查点**：
1. ✓ 逐帧以原尺寸检查眼窗四边；两侧头发、额发、肤色和脸部轮廓必须连续
2. ✓ 目标 body 原有眼睛必须完全消失，不得出现双线或残影
3. ✓ 新眉眼、脸红和汗滴的整体语义必须与 03 官方源表情一致
4. ✓ 连续切换三帧时，眼睛中心、眉线不得跳动

**Mouth 检查点**：
1. ✓ 逐帧以原尺寸检查嘴窗四边；下巴、肤色必须连续
2. ✓ 目标 body 原有嘴型必须完全消失
3. ✓ 新嘴型必须与 02 目标脸型协调并保留 03 源表情语义
4. ✓ 连续切换三帧时，嘴部锚点、下巴线不得跳动

#### 如何记录验收结果

编辑 `acceptance-contract.json`（当前在 cases/haruna-03-to-02/ 目录中）：

```json
{
  "schemaVersion": 1,
  "humanReview": {
    "reviewDate": "2026-07-25",
    "reviewer": "your-name",
    "decisions": {
      "shy_frame0_eyes": "accepted",      // 或 "rejected"
      "shy_frame0_mouth": "accepted",
      "shy_frame1_eyes": "accepted",
      "shy_frame1_mouth": "accepted",
      "shy_frame2_eyes": "accepted",
      "shy_frame2_mouth": "accepted",
      "anger_frame0_eyes": "accepted",
      "anger_frame0_mouth": "accepted",
      "anger_frame1_eyes": "accepted",
      "anger_frame1_mouth": "accepted",
      "anger_frame2_eyes": "accepted",
      "anger_frame2_mouth": "accepted"
    },
    "notes": "检查发现所有项目符合质量标准",
    "overallStatus": "approved"
  },
  "promotionAllowed": true  // 只有全部通过后才能设为 true
}
```

### 阶段 4：晋升到正式素材（待验收通过后 🚫）

⚠️ **重要**：只有当 `promotionAllowed: true` 时才能执行此步骤。

#### 步骤 1：复制文件并重命名

```bash
# 从研究案例目录
cd artsource/model/cases/haruna-03-to-02/outputs/target-native-features-v2/

# 复制到正式素材目录，使用语义化命名
cp 005_02_05_from_03_05_b_target_native_features_v2_eye.png \
   ../../../../haruna/haruna_changer_room/haruna_changer_room_shy_eye.png

cp 005_02_05_from_03_05_b_target_native_features_v2_mouth.png \
   ../../../../haruna/haruna_changer_room/haruna_changer_room_shy_mouth.png

cp 005_02_05_from_03_05_c_target_native_features_v2_eye.png \
   ../../../../haruna/haruna_changer_room/haruna_changer_room_anger_eye.png

cp 005_02_05_from_03_05_c_target_native_features_v2_mouth.png \
   ../../../../haruna/haruna_changer_room/haruna_changer_room_anger_mouth.png
```

#### 步骤 2：更新角色定义

编辑 `GalMainStory/characters/haruna.ts`，在 portraits 数组中添加：

```typescript
{
  id: "005_02_05_shy",
  displayName: "更衣室 · 害羞",
  body: "haruna_changer_room.png",
  mask: "haruna_changer_room_mask.png",
  expressions: {
    shy: {
      id: "shy",
      eyes: "haruna_changer_room_shy_eye.png",
      mouth: "haruna_changer_room_shy_mouth.png",
      blinking: true
    }
  },
  regions: {
    eyes: { x: 394, y: 221, width: 230, height: 131, feather: 0 },
    mouth: { x: 394, y: 349, width: 230, height: 57, feather: 0 }
  },
  defaultExpressionId: "shy"
},
{
  id: "005_02_05_anger",
  displayName: "更衣室 · 生气",
  body: "haruna_changer_room.png",
  mask: "haruna_changer_room_mask.png",
  expressions: {
    anger: {
      id: "anger",
      eyes: "haruna_changer_room_anger_eye.png",
      mouth: "haruna_changer_room_anger_mouth.png",
      blinking: false
    }
  },
  regions: {
    eyes: { x: 394, y: 221, width: 230, height: 131, feather: 0 },
    mouth: { x: 394, y: 349, width: 230, height: 57, feather: 0 }
  },
  defaultExpressionId: "anger"
}
```

#### 步骤 3：删除或归档旧文件

```bash
# 删除用旧方法生成的文件（不要用于运行时）
cd artsource/haruna/haruna_changer_room/
rm 005_02_05_from_03_b_eye.png
rm 005_02_05_from_03_b_mouth.png
rm 005_02_05_from_03_c_eye.png
rm 005_02_05_from_03_c_mouth.png

# 或者移到归档目录
mkdir -p deprecated/
mv 005_02_05_from_03_*.png deprecated/
```

---

## 用于其他角色的复用流程

### 快速开始（3 步）

```bash
# 1. 初始化新案例
cd artsource/model/
python setup_new_case.py \
  --character 梦梦 \
  --source 03 \
  --target 01 \
  --expressions shy,smile

# 2. 生成候选
cd cases/梦梦-03-to-01/
python build_target_native_feature_candidate.py

# 3. 人工验收
# 打开 http://localhost:5500/artsource/model/cases/梦梦-03-to-01/index.html
# 逐帧审查 12 项（2 表情 × 3 帧 × 2 区域）
```

### 需要准备的素材

对每个角色，确保有：
- 源姿势的 body、eye atlas、mouth atlas
- 目标姿势的 body、eye atlas、mouth atlas
- 官方坐标（从 `official-face-coordinate-map.csv` 自动提取）

---

## 工具清单

### 1. 坐标速查工具 ✨ 新增

**文件**：`artsource/model/coordinate-helper.html`

**用途**：把 CSV 转换为人类可读的搜索界面

**打开**：
```
http://localhost:5500/artsource/model/coordinate-helper.html
```

**功能**：
- 搜索角色名、ID、姿势
- 一键复制 TypeScript regions 对象
- 显示画布尺寸、图集尺寸
- 过滤已解析/未解析记录

### 2. 案例初始化脚本 ✨ 新增

**文件**：`artsource/model/setup_new_case.py`

**用途**：自动创建新角色的迁移案例

**用法**：
```bash
python setup_new_case.py \
  --character haruna \
  --source 03 \
  --target 02 \
  --expressions shy,anger
```

**输出**：
- 案例目录结构
- 所有配置文件（JSON）
- README 文档
- 验收合同模板

### 3. 校准台（已有）

**文件**：`artsource/model/index.html`

**用途**：
- 可视化调整 face window 坐标
- 预览逐帧效果
- 导出 TypeScript rig 定义

### 4. 案例验收页面（已有）

**文件**：`artsource/model/cases/haruna-03-to-02/index.html`

**用途**：
- 对比不同算法的输出
- 逐帧检查接缝质量
- 记录人工审查决策

---

## 常见问题

### Q: 为什么不能直接使用 GPT5.6 生成的文件？

A: 那些文件使用了已被否决的 `body-edge-graft` 方法，会保留错误的源姿势脸型和眼位。在完整素材对比下，接缝明显且表情语义不正确。

### Q: V2 的输出文件在哪里？

A: 
```
artsource/model/cases/haruna-03-to-02/outputs/target-native-features-v2/
├── 005_02_05_from_03_05_b_target_native_features_v2_eye.png
├── 005_02_05_from_03_05_b_target_native_features_v2_mouth.png
├── 005_02_05_from_03_05_c_target_native_features_v2_eye.png
└── 005_02_05_from_03_05_c_target_native_features_v2_mouth.png
```

### Q: 可以跳过人工验收吗？

A: **不可以**。自动算法无法判断美术质量、表情语义正确性和接缝自然度。必须逐帧检查 12 项。

### Q: CSV 文件怎么用？

A: 有两个选择：
1. 使用新的 `coordinate-helper.html` 搜索界面（推荐）
2. 让 `setup_new_case.py` 自动提取坐标

### Q: 能用这个流程做哪些事？

A: 
- ✅ 跨姿势表情迁移（03 → 02）
- ✅ 保持目标脸型，只换表情特征
- ✅ 生成可复现、可审查的输出
- ❌ 不能跨角色迁移（脸型差异太大）
- ❌ 不能改变姿势的根本几何（如头部角度）

---

## 下一步行动

### 对于春菜更衣室立绘

1. **立即行动**：
   ```bash
   # 打开验收界面
   http://localhost:5500/artsource/model/cases/haruna-03-to-02/index.html
   ```

2. **完成 12 项审查**：
   - shy: 6 项（3 帧 × 2 区域）
   - anger: 6 项（3 帧 × 2 区域）

3. **更新验收合同**：
   编辑 `cases/haruna-03-to-02/acceptance-contract.json`

4. **晋升文件**（仅当全部通过）：
   - 复制 V2 输出到 `artsource/haruna/haruna_changer_room/`
   - 使用语义化命名（`*_shy_*.png`、`*_anger_*.png`）
   - 更新 `GalMainStory/characters/haruna.ts`
   - 删除或归档旧的 `from_03_b/c` 文件

### 对于其他角色

使用 `setup_new_case.py` 快速初始化新案例，然后重复相同流程。

---

## 文档索引

- **流程概览**：本文档
- **详细流程**：`.claude/skills/portrait-transform.md`
- **校准台说明**：`artsource/model/README.md`
- **春菜案例详情**：`artsource/model/cases/haruna-03-to-02/README.md`
- **验收标准**：`artsource/model/cases/haruna-03-to-02/acceptance-contract.json`

---

## 版本历史

- **2026-07-25**：创建流水线总结文档
  - 明确 GPT5.6 方法已被否决
  - 记录 V2 输出已生成但待验收
  - 添加坐标速查工具
  - 添加案例初始化脚本
  - 提供完整的复用流程
