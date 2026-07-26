# 剧情上下文验证系统

## 问题背景

在艾尔登特（ALDENT）剧情生成系统中，每一幕（Act）生成时依赖前面所有幕的内容作为上下文。系统通过 `contextFloorIds` 字段记录依赖关系：

```typescript
// Act 03 生成时
{
  floorId: "floor_03_abc",
  contextFloorIds: ["floor_01_xyz", "floor_02_def"],  // 依赖 Act 01 和 Act 02
  act: { /* 基于前两幕生成的剧情 */ }
}
```

**核心问题：** 当用户重新生成 Act 02 时，会产生新的 `floor_02_new`，但 Act 03 的 `contextFloorIds` 仍然指向旧的 `floor_02_def`。这导致：

1. **上下文失效**：Act 03 基于过期的 Act 02 内容生成
2. **剧情不连贯**：Act 02 的改动未反映到 Act 03
3. **隐蔽的错误**：用户不知道需要重新生成 Act 03

## 解决方案

### 1. 上下文验证工具 (`storyContextValidation.ts`)

新增的工具模块提供以下功能：

#### 核心函数

**`validateFloorContext(archives, floor)`**
- 验证单个楼层的上下文是否有效
- 返回期望的 contextFloorIds 与实际记录的对比
- 标记所有不匹配的位置

**`getInvalidContextFloors(archives)`**
- 扫描所有活动楼层，找出上下文失效的楼层
- 返回所有验证失败的楼层列表

**`analyzeRegenerationImpact(archives, targetFloorId)`**
- 分析重新生成某个楼层会影响哪些后续楼层
- 计算影响范围和需要连带更新的幕

**`generateContextReport(archives)`**
- 生成人类可读的验证报告
- 可用于调试和手动检查

### 2. UI 集成 (`StoryHistoryArchive.tsx`)

#### 视觉指示

在每个幕的标题下方显示警告：

```tsx
{contextInvalid && (
  <p className="gal-story-archive__context-warning">
    ⚠️ 上下文已失效（前置楼层已更新）
  </p>
)}
```

#### 影响分析对话框

在用户点击"重新生成"时：

1. **检测影响范围**：如果重新生成会影响后续楼层，弹出警告对话框
2. **显示受影响的幕**：列出所有需要连带更新的幕
3. **要求明确确认**：用户必须确认后才能继续

```
⚠️ 重新生成影响范围

重新生成本幕会影响 2 个后续幕的上下文。
这些幕需要重新生成才能保持剧情连贯性：

• 第 1 集 · 第 3 幕
• 第 1 集 · 第 4 幕

继续操作后，这些幕将显示"上下文已失效"警告。
你需要手动重新生成它们。

[取消]  [确认重新生成]
```

### 3. 工作流程

#### 正常情况（无影响）

```
用户点击"重新生成" Act 01
  ↓
系统检测：Act 02、03 都依赖 Act 01
  ↓
弹出警告对话框，显示影响范围
  ↓
用户确认 → 生成新 floor_01_new
  ↓
Act 02、03 显示"上下文已失效"警告
  ↓
用户依次重新生成 Act 02、03
```

#### 特殊情况（最后一幕）

```
用户点击"重新生成" Act 05（最后一幕）
  ↓
系统检测：没有后续幕依赖它
  ↓
直接生成，不弹出警告
```

## 使用方法

### 对于开发者

#### 检查整体上下文状态

```typescript
import { getInvalidContextFloors, generateContextReport } from './storyContextValidation';

const invalidFloors = getInvalidContextFloors(archives);
console.log(`发现 ${invalidFloors.length} 个上下文失效的楼层`);

const report = generateContextReport(archives);
console.log(report);
```

#### 分析重新生成的影响

```typescript
import { analyzeRegenerationImpact, generateImpactReport } from './storyContextValidation';

const impact = analyzeRegenerationImpact(archives, targetFloorId);
if (impact && impact.totalAffected > 0) {
  console.log(generateImpactReport(impact));
}
```

### 对于用户

1. **查看警告**：在"已读剧情"界面，失效的幕会显示橙色警告
2. **重新生成前确认**：系统会显示影响范围，帮助你了解需要做什么
3. **按顺序修复**：从前往后重新生成所有显示警告的幕

## 技术细节

### 数据结构

```typescript
export interface ContextValidationResult {
  isValid: boolean;                    // 是否有效
  floorId: string;                     // 楼层 ID
  eventId: string;                     // 事件 ID
  actId: string;                       // 幕 ID
  actIndex: number;                    // 幕索引
  expectedContextFloorIds: string[];   // 期望的上下文
  actualContextFloorIds: string[];     // 实际记录的上下文
  mismatches: ContextMismatch[];       // 不匹配的位置
}

export interface ContextImpactAnalysis {
  targetFloor: {
    floorId: string;
    eventId: string;
    actId: string;
    actIndex: number;
  };
  affectedFloors: ContextValidationResult[];  // 受影响的楼层
  totalAffected: number;                      // 影响数量
  needsRegeneration: boolean;                 // 是否需要重新生成
}
```

### 验证逻辑

```typescript
// 获取当前应该依赖的楼层
const expectedFloors = getPreviousActiveStoryFloors(archives, eventId, actId);
const expectedContextFloorIds = expectedFloors.map(f => f.floorId);

// 与实际记录的对比
const actualContextFloorIds = floor.contextFloorIds;

// 逐位置比较
for (let i = 0; i < maxLength; i++) {
  if (expected[i] !== actual[i]) {
    mismatches.push({ position: i, expected: expected[i], actual: actual[i] });
  }
}
```

## 未来改进

### 自动修复选项

目前是手动重新生成，可以考虑：

1. **批量重新生成**：点击一个按钮，自动重新生成所有受影响的幕
2. **依赖链追踪**：自动计算最小重新生成集合
3. **预览模式**：在不保存的情况下预览重新生成的效果

### 更智能的上下文管理

1. **增量更新**：只更新改动的部分，不需要完全重新生成
2. **版本分支**：允许保留多个版本的剧情线
3. **上下文快照**：记录生成时的实际上下文内容，而不仅是 ID

### 与 ALDENT Harness 集成

可以创建专门的 skill：

```markdown
# story-context-repair

当检测到上下文失效时：
1. 分析影响范围
2. 生成修复计划
3. 批量重新生成
4. 验证修复结果
```

## 相关文件

- **工具模块**：`GalMainStory/storyContextValidation.ts`
- **UI 集成**：`GalMainStory/StoryHistoryArchive.tsx`
- **样式**：`GalMainStory/GalMainStory.css`
- **类型定义**：`GalMainStory/storyTypes.ts`
- **存档逻辑**：`GalMainStory/storyArchive.ts`

## 测试场景

### 场景 1：重新生成中间幕

1. 生成 Act 01, 02, 03
2. 重新生成 Act 02
3. 系统应显示：Act 03 上下文失效
4. 重新生成 Act 03
5. 系统应显示：所有上下文有效

### 场景 2：重新生成最后一幕

1. 生成 Act 01, 02, 03
2. 重新生成 Act 03（最后一幕）
3. 系统应**不显示**警告（无后续影响）
4. 直接完成重新生成

### 场景 3：连锁影响

1. 生成 Act 01, 02, 03, 04, 05
2. 重新生成 Act 02
3. 系统应显示：Act 03, 04, 05 都受影响
4. 依次重新生成 Act 03 → 04 → 05

## 常见问题

### Q: 为什么不自动更新 contextFloorIds？

A: 因为上下文内容已经改变，简单更新 ID 会导致楼层内容与上下文不匹配。必须重新生成才能保证剧情连贯。

### Q: 可以忽略警告吗？

A: 不建议。忽略警告意味着后续剧情基于过期的上下文，可能出现角色行为不一致、剧情逻辑错误等问题。

### Q: 如何批量修复？

A: 目前需要手动逐个重新生成。未来可以考虑添加批量修复功能。

### Q: 会影响性能吗？

A: 验证逻辑非常轻量，只比较 ID 数组，不涉及内容解析。对性能影响可忽略。
