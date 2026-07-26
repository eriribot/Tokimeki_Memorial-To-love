# 总结失效处理系统 - 实施方案

## 问题总结

你遇到的核心问题：

1. **正文生成**：每个 floor 生成时创建 2 条消息（user + assistant）
2. **自动总结**：每 3 个 floor（6 条消息）自动触发一次小总结
3. **重新生成问题**：当重新生成某个 floor 时，已生成的总结仍然引用旧的 floor，导致总结内容过期

## 实施的解决方案

### 1. 总结失效检测 (`memory/summaryInvalidation.ts`)

新增工具模块，提供：

- `detectSummaryInvalidation()` - 检测哪些总结会因为 floor 重新生成而失效
- `invalidateSummaries()` - 批量标记总结为 rejected
- `hasInvalidSummaries()` - 检查是否存在失效的总结
- `getInvalidSummaries()` - 获取所有失效的总结列表

### 2. UI 集成 (`GalMainStory/StoryHistoryArchive.tsx`)

**重新生成前的检测：**
```typescript
// 点击"重新生成"按钮时
if (baseFloor.floorId === archive.activeFloorId) {
  // 1. 检测后续幕的上下文影响
  const impact = analyzeRegenerationImpact(sortedArchives, baseFloor.floorId);
  
  // 2. 检测总结失效影响
  const summaryImpact = detectSummaryInvalidation(
    sortedArchives, 
    baseFloor.floorId, 
    saveUuid
  );
  
  // 3. 弹出警告对话框
  if (impact && impact.totalAffected > 0) {
    setShowImpactWarning(true);  // 上下文失效警告
  }
  
  if (summaryImpact.needsRegeneration) {
    setShowSummaryWarning(true);  // 总结失效警告
  }
}
```

**确认后的处理：**
```typescript
const confirmRegeneration = async (archive: GalStoryActArchive) => {
  // 1. 使失效的总结无效化
  if (summaryInvalidation && summaryInvalidation.affectedCount > 0) {
    invalidateSummaries(
      summaryInvalidation.invalidatedSummaries.map(s => s.summary.summaryId)
    );
  }
  
  // 2. 继续重新生成
  const generated = await generateStoryAct(request);
  
  // 3. 保存新楼层
  addFloor(generated.floor, generated.messages);
  
  // 4. 系统会自动检测并生成新总结（通过 summaryRuntime）
};
```

### 3. 工作流程

#### 正常流程
```
floor_01 生成 → 2 条消息
floor_02 生成 → 4 条消息  
floor_03 生成 → 6 条消息 → 自动触发小总结
  ↓
小总结 summary_01 = {
  sourceFloorIds: [floor_01, floor_02, floor_03],
  text: "AI 生成的总结内容"
}
  ↓
floor_04 生成时使用 summary_01 作为上下文
（而不是加载 6 条原始消息）
```

#### 重新生成流程
```
用户点击"重新生成 floor_03"
  ↓
检测到 summary_01 引用了 floor_03
  ↓
弹出警告：
  "⚠️ 总结将失效
   重新生成本幕会使 1 条总结失效。
   
   - 剧情小结 · 3 个楼层
   
   继续操作后，失效的总结会自动标记为 rejected。
   系统会在新正文生成后自动创建新总结。"
  ↓
用户确认
  ↓
1. 标记 summary_01 为 rejected
2. 生成新的 floor_03_new
3. summaryRuntime 检测到需要总结
4. 自动生成新的 summary_02 = {
     sourceFloorIds: [floor_01, floor_02, floor_03_new]
   }
  ↓
floor_04 可以继续使用新的 summary_02
```

## 关键数据结构

### GalStoryFloor
```typescript
{
  floorId: "floor_03_xyz",
  messageIds: ["floor_03_xyz-user", "floor_03_xyz-assistant"],  // 2 条消息
  contextFloorIds: ["floor_01_abc", "floor_02_def"],  // 直接依赖的 floor
  act: GalStoryAct,  // 解析后的剧情
}
```

### MemorySummaryCandidate
```typescript
{
  summaryId: "summary_001",
  mode: "small",  // 小总结（3 个 floor）或 large（5 个小总结）
  sourceFloorIds: ["floor_01", "floor_02", "floor_03"],  // 总结的源 floor
  text: "AI 生成的总结内容",
  status: "accepted" | "rejected" | "pending",
}
```

## 与原上下文验证系统的关系

我之前实现的 `storyContextValidation.ts` 主要处理：
- **floor 之间的依赖关系**（contextFloorIds）
- 检测后续幕是否依赖被重新生成的幕

现在新增的 `summaryInvalidation.ts` 处理：
- **总结对 floor 的依赖关系**（sourceFloorIds）
- 检测总结是否基于被重新生成的 floor

**两者是互补的：**
- contextFloorIds：floor → floor 的依赖
- sourceFloorIds：summary → floor 的依赖

## 自动总结触发机制

根据 `summaryRuntime.ts` 和 `summaryPolicy.ts`：

```typescript
// 小总结触发条件
SMALL_SUMMARY_SOURCE_FLOOR_COUNT = 6  // 6 个 floor = 12 条消息
RECENT_CONTEXT_MESSAGE_LIMIT = 6      // 最近 6 条消息不总结

// 当时间线中的 floor 数量达到阈值时
if (timeline.length >= 6) {
  // 自动生成小总结，覆盖前 3 个 floor（6 条消息）
  createSmallSummary(floors.slice(0, 3));
}

// 大总结触发条件
LARGE_SUMMARY_SOURCE_COUNT = 5  // 5 个小总结

// 当小总结数量达到 5 时
if (smallSummaries.length >= 5) {
  // 自动生成大总结
  createLargeSummary(smallSummaries.slice(0, 5));
}
```

## 测试场景

### 场景 1：重新生成已被总结的 floor
1. 生成 floor_01, 02, 03 → 自动生成 summary_01
2. 重新生成 floor_02
3. 系统警告：summary_01 将失效
4. 确认后，summary_01 标记为 rejected
5. 继续生成 floor_04, 05, 06 → 自动生成新的 summary_02

### 场景 2：重新生成未被总结的 floor
1. 生成 floor_01, 02
2. 重新生成 floor_02
3. 系统不警告（尚未生成总结）
4. 直接完成重新生成

### 场景 3：连锁影响
1. 生成 floor_01~06 → summary_01（覆盖 01~03）
2. 生成 floor_07~09 → summary_02（覆盖 04~06）
3. 重新生成 floor_02
4. 系统警告：summary_01 将失效
5. 同时警告：floor_03 的上下文将失效（需要重新生成）

## 未来改进

### 增量总结更新
当前方案：重新生成 → 标记旧总结为 rejected → 生成新总结

未来可以考虑：
- **智能增量更新**：只更新总结中涉及该 floor 的部分
- **差异总结**：生成 "floor_02 从版本 A 改为版本 B，主要变化是..."

### 玩家主动触发总结
你提到：
> A2: 应该是自动为主但是玩家可以提前总结然后下次总结为玩家总结完后的楼层+规定的楼层

可以添加：
- "立即总结" 按钮：在未达到 6 个 floor 时手动触发
- "跳过总结" 按钮：临时禁用自动总结
- 自定义总结范围：选择哪些 floor 进行总结

### 回退机制
你提到：
> A3: 这个时候我点击重新总结那么状态应该回退到没总结的状态然后正文重新生成完后再总结

可以添加：
- "撤销总结" 功能：将已总结的 floor 恢复为独立状态
- "重新总结" 功能：保留 floor 不变，只重新生成总结内容

## 代码已完成

已实现的文件：
- ✅ `memory/summaryInvalidation.ts` - 总结失效检测工具
- ✅ `GalMainStory/StoryHistoryArchive.tsx` - UI 集成和警告对话框
- ✅ `GalMainStory/storyContextValidation.ts` - 上下文验证（之前实现）

现在系统会：
1. 重新生成前检测总结失效
2. 弹出警告对话框，明确告知影响
3. 确认后自动标记失效的总结
4. 依赖 summaryRuntime 自动生成新总结

**这个方案符合你的需求吗？需要我进一步调整或添加功能吗？**
