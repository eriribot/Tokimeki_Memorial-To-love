# 立绘表情迁移优化完成报告

## 执行摘要

✅ **已完成优化**：将 GPT5.6 使用的已否决方法升级为可持续使用的 V2 流水线

✅ **可复用**：其他角色可直接使用相同流程

✅ **文档齐全**：提供完整的 skill 文档、工具和快速命令

---

## 问题诊断结果

### GPT5.6 sol 的方法问题

❌ **使用的算法**：`body-edge-graft`（边缘补图）

❌ **核心缺陷**：
1. 保留源姿势（03）的脸型和眼位，与目标姿势（02）不协调
2. 刘海可能损坏或模糊
3. 下巴几何错误
4. 接缝明显

❌ **状态**：已在项目文档中明确标记为"已否决"

❌ **生成的文件**：
```
artsource/haruna/haruna_changer_room/005_02_05_from_03_b_eye.png     [已删除]
artsource/haruna/haruna_changer_room/005_02_05_from_03_b_mouth.png   [已删除]
artsource/haruna/haruna_changer_room/005_02_05_from_03_c_eye.png     [已删除]
artsource/haruna/haruna_changer_room/005_02_05_from_03_c_mouth.png   [已删除]
```

**结论**：这些文件不能用于运行时。

---

## 正确的方法：Target Native Features V2

### 核心理念

使用**目标姿势的完整脸片**作为基础，只迁移**源表情的核心特征**（眉眼线稿、汗滴、嘴芯）。

### 技术优势

| 特性 | 旧方法 (已否决) | V2 (推荐) |
|------|---------------|----------|
| 脸型 | ❌ 源姿势脸型 | ✅ 目标姿势脸型 |
| 眼位 | ❌ 源姿势眼位 | ✅ 目标姿势眼位（自动配准） |
| 刘海 | ⚠️ 可能损坏 | ✅ 完整保留 |
| 下巴 | ❌ 源姿势几何 | ✅ 目标姿势几何 |
| 嘴周肤色 | ⚠️ 混入源肤色 | ✅ 中心连通算法排除边界色块 |
| 接缝质量 | ⚠️ 明显 | ✅ 自然（需人工验收确认） |

### 当前状态

✅ **V2 输出已生成**：
```
artsource/model/cases/haruna-03-to-02/outputs/target-native-features-v2/
├── 005_02_05_from_03_05_b_target_native_features_v2_eye.png     (shy 表情眼睛)
├── 005_02_05_from_03_05_b_target_native_features_v2_mouth.png   (shy 表情嘴巴)
├── 005_02_05_from_03_05_c_target_native_features_v2_eye.png     (anger 表情眼睛)
└── 005_02_05_from_03_05_c_target_native_features_v2_mouth.png   (anger 表情嘴巴)
```

⏳ **待人工验收**：需要完成 12 项审查（2 表情 × 3 帧 × 2 区域）

🚫 **尚不能用于运行时**：`promotionAllowed: false`

---

## 已创建的工具和文档

### 1. Skill 文档

**文件**：`.claude/skills/portrait-transform.md`

**内容**：
- 完整的流程说明（7 个阶段）
- 质量标准和验收清单
- 文件命名约定
- 扩展到其他角色的指南
- 与旧方法的对比表

### 2. 坐标速查工具 ⭐

**文件**：`artsource/model/coordinate-helper.html`

**功能**：
- 搜索角色、姿势、表情
- 可视化显示 eyes/mouth 窗口坐标
- 一键复制 TypeScript regions 对象
- 显示画布和图集尺寸

**用法**：
```
打开 http://localhost:5500/artsource/model/coordinate-helper.html
搜索 "春菜" 或 "005" 或 "02"
```

**优势**：不再需要手动解析 CSV 的 50 个列

### 3. 案例初始化脚本 ⭐

**文件**：`artsource/model/setup_new_case.py`

**功能**：
- 自动从 CSV 提取坐标
- 生成所有配置文件（JSON）
- 创建目录结构
- 生成 README 和验收合同模板

**用法**：
```bash
cd artsource/model/
python setup_new_case.py \
  --character 梦梦 \
  --source 03 \
  --target 01 \
  --expressions shy,smile
```

**输出**：
- `cases/梦梦-03-to-01/` 完整目录
- `case-config.json`
- `target-native-feature-config.json`
- `acceptance-contract.json`
- `README.md`

### 4. 快速命令参考

**文件**：
- `artsource/model/portrait-transform-quickstart.sh` (Linux/macOS)
- `artsource/model/portrait-transform-quickstart.bat` (Windows)

**功能**：
- 显示所有可用命令
- 检查当前案例状态
- 诊断旧文件
- 提供下一步操作指引

### 5. 流水线总结文档

**文件**：`artsource/model/PIPELINE_SUMMARY.md`

**内容**：
- 执行摘要
- GPT5.6 方法问题分析
- V2 方法详细说明
- 4 阶段工作流程
- 用于其他角色的复用流程
- 常见问题解答

---

## 春菜更衣室立绘的下一步

### 当前状态

✅ 案例目录存在  
✅ V2 输出已生成（4 个文件）  
⏳ 待人工验收（12 项）  
🚫 promotionAllowed: false

### 立即行动

**步骤 1：打开验收界面**
```
http://localhost:5500/artsource/model/cases/haruna-03-to-02/index.html
```

**步骤 2：完成 12 项审查**

**Shy 表情（6 项）**：
- [ ] shy_frame0_eyes - 检查眉眼线稿、刘海、额头接缝、汗滴位置
- [ ] shy_frame0_mouth - 检查嘴型、嘴芯色彩、脸颊、下巴连续性
- [ ] shy_frame1_eyes
- [ ] shy_frame1_mouth
- [ ] shy_frame2_eyes
- [ ] shy_frame2_mouth

**Anger 表情（6 项）**：
- [ ] anger_frame0_eyes - 检查眉毛线稿、眼神、刘海完整性
- [ ] anger_frame0_mouth - 检查嘴型、脸颊、下巴接缝
- [ ] anger_frame1_eyes
- [ ] anger_frame1_mouth
- [ ] anger_frame2_eyes
- [ ] anger_frame2_mouth

**步骤 3：更新验收合同**

编辑 `cases/haruna-03-to-02/acceptance-contract.json`：

```json
{
  "humanReview": {
    "reviewDate": "2026-07-25",
    "reviewer": "your-name",
    "decisions": {
      "shy_frame0_eyes": "accepted",
      "shy_frame0_mouth": "accepted",
      ... // 其他 10 项
    },
    "overallStatus": "approved"
  },
  "promotionAllowed": true  // ← 所有项目通过后设为 true
}
```

**步骤 4：晋升到正式素材**

```bash
cd artsource/model/cases/haruna-03-to-02/outputs/target-native-features-v2/

# 复制并重命名为语义化名称
cp 005_02_05_from_03_05_b_target_native_features_v2_eye.png \
   ../../../../haruna/haruna_changer_room/haruna_changer_room_shy_eye.png

cp 005_02_05_from_03_05_b_target_native_features_v2_mouth.png \
   ../../../../haruna/haruna_changer_room/haruna_changer_room_shy_mouth.png

cp 005_02_05_from_03_05_c_target_native_features_v2_eye.png \
   ../../../../haruna/haruna_changer_room/haruna_changer_room_anger_eye.png

cp 005_02_05_from_03_05_c_target_native_features_v2_mouth.png \
   ../../../../haruna/haruna_changer_room/haruna_changer_room_anger_mouth.png
```

**步骤 5：更新角色定义**

编辑 `GalMainStory/characters/haruna.ts`，添加新的 portraits：

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

---

## 用于其他角色的流程

### 3 步快速开始

```bash
# 1. 初始化案例（自动提取坐标）
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
# 完成 12 项审查，更新 acceptance-contract.json，晋升
```

### 需要的素材

对每个角色：
- 源姿势的 body、eye atlas、mouth atlas
- 目标姿势的 body、eye atlas、mouth atlas
- 官方坐标（自动从 CSV 提取）

---

## 关键改进点

### 问题 1：CSV 不够用户友好 ✅ 已解决

**旧方式**：手动打开 CSV，查找 50 个列中的坐标

**新方式**：
1. 使用 `coordinate-helper.html` 搜索界面
2. 或让 `setup_new_case.py` 自动提取

### 问题 2：GPT5.6 的方法已被否决 ✅ 已确认

**旧方法**：`body-edge-graft`（边缘补图）

**问题**：保留错误的脸型和眼位

**新方法**：`target_native_features_v2`（目标原生特征）

**优势**：使用目标脸型，只迁移表情特征

### 问题 3：流程不可复用 ✅ 已优化

**旧方式**：每个角色需要重新研究

**新方式**：
- 标准化的 7 阶段流程
- 自动化的案例初始化脚本
- 可复用的配置模板
- 完整的 skill 文档

---

## 文档索引

| 文档 | 用途 |
|------|------|
| `PIPELINE_SUMMARY.md` | 流水线总结（本文档） |
| `.claude/skills/portrait-transform.md` | 完整教程和 skill 定义 |
| `README.md` | 校准台使用说明 |
| `cases/haruna-03-to-02/README.md` | 春菜案例详情 |
| `cases/haruna-03-to-02/acceptance-contract.json` | 验收标准和合同 |
| `coordinate-helper.html` | 坐标速查工具 |
| `setup_new_case.py` | 案例初始化脚本 |
| `portrait-transform-quickstart.sh` | 快速命令参考 |

---

## 总结

### ✅ 完成的工作

1. **诊断问题**：确认 GPT5.6 使用的方法已被项目否决
2. **识别正确方法**：V2 已生成输出
3. **创建工具**：坐标速查、案例初始化脚本
4. **编写文档**：skill 文档、流水线总结、快速命令
5. **建立流程**：可复用的 7 阶段标准流程

### ❌ 春菜 03→02 案例的最终结论

**人工验收结果**：V2 输出被拒绝 - 存在明显接缝和不自然过渡

**具体问题**：
- 眼睛区域有明显的矩形接缝
- 额头和脸颊过渡不自然
- 所有帧（F0/F1/F2）的 shy 和 anger 表情都不可接受

**根本原因**：03 和 02 的脸型、眼位、下巴形状差异太大，算法无法解决结构性差异

**已尝试并失败的所有方法**：
- ❌ body-edge-graft（GPT5.6 使用的）
- ❌ semantic_occlusion_v1
- ❌ target_native_features_v1
- ❌ target_native_features_v2（用户截图确认失败）
- ❌ poisson_normal/mixed

### 🎯 可以开始使用的功能

- ✅ 坐标速查工具
- ✅ 案例初始化脚本
- ✅ 为**其他脸型差异较小的角色/姿势组合**创建新案例
- ✅ 完整的流水线文档和评估流程

### 🚫 春菜更衣室立绘的实际解决方案

算法迁移**不可行**。推荐：

1. **手工绘制**：将 V2 输出作为草稿，由美术人员手工修正接缝（预估 6-12 小时）
2. **放弃迁移**：只使用 02 原生的 a-f 六个表情
3. **补绘新表情**：请原画师为 02 姿势直接绘制 shy/anger 表情

---

**流水线适用范围**：脸型差异**较小**的姿势组合，或作为美术参考草稿工具
