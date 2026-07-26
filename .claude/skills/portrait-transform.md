---
name: portrait-transform
description: 跨家族立绘表情迁移流水线
globs: ["artsource/**/*.png", "GalMainStory/characters/*.ts"]
---

# 立绘表情迁移流水线

针对需要将一个姿势家族（如 03）的表情迁移到另一个姿势家族（如 02）的场景，使用原生脸片 + 稀疏特征的方法。

## 使用场景

- 源家族有独特表情（如 shy、anger），但目标家族缺少该表情
- 需要保持目标家族的脸型、皮肤、刘海等基础特征
- 只迁移眼神、眉毛、汗滴、嘴型等表情核心特征

## 当前状态

### 已完成的案例
- **春菜 005_03_05 → 005_02_05**：位于 `artsource/model/cases/haruna-03-to-02/`
- 包含 shy (03_b) 和 anger (03_c) 两个表情的完整研究
- 已生成 v2 候选输出，但尚未完成人工验收的 12 项审查

### 已否决的方法
- `body-edge-graft`（边缘补图）：只换矩形边缘会保留错误的眼位和脸型
- `semantic_occlusion` v1：嘴周会误带矩形 03 肤色
- `poisson_normal/mixed`：会损坏刘海、眉眼或下巴

## 标准流程

### 1. 准备阶段

```bash
# 确保有完整的源和目标素材
cd artsource/model/cases/
mkdir -p {character}-{source_pose}-to-{target_pose}
cd {character}-{source_pose}-to-{target_pose}
```

需要的文件：
- 源姿势的 body、eye atlas、mouth atlas
- 目标姿势的 body、eye atlas、mouth atlas
- 官方坐标数据（从 CSV 或 haruna.ts 提取）

### 2. 创建案例配置

创建 `case-config.json`：

```json
{
  "schemaVersion": 1,
  "character": {
    "id": "005",
    "name": "haruna",
    "displayName": "春菜"
  },
  "source": {
    "poseId": "03",
    "positionKey": "005_03_05"
  },
  "target": {
    "poseId": "02",
    "positionKey": "005_02_05"
  },
  "expressions": ["shy", "anger"],
  "expressionMapping": {
    "shy": "b",
    "anger": "c"
  }
}
```

### 3. 创建目标原生特征配置

创建 `target-native-feature-config.json`：

```json
{
  "schemaVersion": 2,
  "operation": "target-native-features",
  "description": "使用目标原生脸片，只迁移源表情的稀疏特征",
  "canvas": {
    "width": 1024,
    "height": 1024
  },
  "regions": {
    "eyes": { "x": 394, "y": 221, "width": 230, "height": 131 },
    "mouth": { "x": 394, "y": 349, "width": 230, "height": 57 }
  },
  "frameCount": 3,
  "targetNativeFeatures": {
    "useTargetEyeBase": true,
    "useTargetMouthBase": true,
    "clearTargetOldFeatures": true,
    "importSourceFeatures": {
      "eyebrowLines": true,
      "eyeDetails": true,
      "sweatDrops": true,
      "mouthCore": true,
      "mouthCoreMethod": "center-connected-v2"
    }
  },
  "mouthCoreV2": {
    "estimateLocalSkinTone": true,
    "requireCenterConnection": true,
    "rejectBoundaryTouching": true,
    "description": "排除 ROI 外圈肤色，只保留与中心种子相交且不接触边界的连通域"
  }
}
```

### 4. 构建案例素材

```python
# 运行 Python 脚本生成所有中间产物
python build_target_native_feature_candidate.py
```

这会生成：
- `assets/` 目录：所有中间帧和配准结果
- `outputs/target-native-features-v2/` 目录：最终的 clean atlas 输出
- `case-manifest.json`：完整的元数据清单

### 5. 人工验收

打开 `index.html` 进行逐帧审查：

```
http://localhost:5500/artsource/model/cases/{character}-{source}-to-{target}/index.html
```

每个表情 × 每个帧需要审查：
- **eyes 项目**（6项）：
  1. 眉眼线稿完整性
  2. 眼神正确性
  3. 刘海无损坏
  4. 额头接缝
  5. 汗滴位置
  6. 与 02 脸型协调
  
- **mouth 项目**（6项）：
  1. 嘴型正确性
  2. 嘴芯色彩
  3. 脸颊无03肤色
  4. 下巴无损坏
  5. 鼻唇沟接缝
  6. 与 02 脸型协调

### 6. 记录验收结果

更新 `acceptance-contract.json`：

```json
{
  "schemaVersion": 1,
  "reviewDate": "2026-07-25",
  "reviewer": "human",
  "formula": "target_native_features_v2",
  "items": {
    "shy_frame0_eyes": { "status": "pass", "notes": "" },
    "shy_frame0_mouth": { "status": "pass", "notes": "" },
    ...
  },
  "overallStatus": "approved",
  "promotionAllowed": true
}
```

### 7. 晋升到角色定义

只有当 `promotionAllowed: true` 时才能晋升：

```bash
# 复制输出文件到正式目录
cp outputs/target-native-features-v2/005_02_05_from_03_05_b_*.png \
   ../../haruna/haruna_changer_room/

# 更新角色定义
# 编辑 GalMainStory/characters/haruna.ts
```

在 `haruna.ts` 中添加：

```typescript
{
  id: "005_02_05_shy",
  displayName: "更衣室 shy",
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
  }
}
```

## 文件命名约定

### 研究案例内部
- `{position_key}_from_{source_position}_{expression_id}_{part}.png`
- 例如：`005_02_05_from_03_05_b_target_native_features_v2_eye.png`

### 晋升到正式素材后
- `{base_name}_{semantic_label}_{part}.png`
- 例如：`haruna_changer_room_shy_eye.png`

## 质量标准

### 必须通过的检查
1. ✅ 所有 12 项人工审查均为 pass
2. ✅ 与目标 body 接缝无明显色差
3. ✅ 表情语义与源图一致
4. ✅ 无源姿势的肤色或脸型泄漏
5. ✅ 刘海、下巴等目标原生特征完整保留
6. ✅ 帧间连续性良好

### 自动拒绝的情况
- 边缘有明显 03 肤色矩形
- 刘海被损坏或模糊
- 下巴几何发生改变
- 眼位或眉位偏移明显

## 扩展到其他角色

### 最小修改清单
1. 修改 `case-config.json` 中的角色 ID 和姓名
2. 从 CSV 或角色定义提取正确的坐标到 `target-native-feature-config.json`
3. 准备该角色的源和目标 body、atlas 文件
4. 运行 `build_target_native_feature_candidate.py`
5. 执行人工验收流程

### 可能需要调整的参数
- `mouthCoreV2.skinToneThreshold`：不同角色的肤色范围
- `regions`：每个角色的 face window 坐标
- `importSourceFeatures`：某些表情可能不需要汗滴

## 与旧方法的对比

| 方法 | 保留目标脸型 | 保留刘海 | 嘴周干净 | 状态 |
|------|------------|---------|---------|------|
| body-edge-graft | ❌ | ⚠️ | ⚠️ | 已否决 |
| semantic_occlusion v1 | ✅ | ✅ | ❌ | 已否决 |
| target_native_features v1 | ✅ | ✅ | ⚠️ | 已否决 |
| target_native_features v2 | ✅ | ✅ | ✅ | 待验收 |

## 常见问题

### Q: CSV 文件太难读怎么办？
A: 使用校准台的交互式界面，或者直接从 `{character}.ts` 提取坐标。校准台会生成可读的 regions 对象。

### Q: 可以跳过人工验收吗？
A: 不可以。自动算法无法判断美术质量，必须逐帧检查。

### Q: 如何判断某个表情适合迁移？
A: 检查源和目标的脸型差异。如果头部角度、脸宽或下巴形状差异过大，迁移风险很高。

### Q: 生成的图片可以直接用吗？
A: 不可以。必须先完成验收，确认 `promotionAllowed: true`，并通过正式命名放入角色素材目录。

## 相关文件

- 校准台：`artsource/model/index.html`
- 坐标参考：`artsource/model/official-face-coordinate-map.csv`
- 春菜案例：`artsource/model/cases/haruna-03-to-02/`
- Python 脚本：`build_target_native_feature_candidate.py`
