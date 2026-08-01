# QA 基线报告（tsc + eslint）

- 日期：2026-08-01
- 执行者：Reasonix（测试岗）
- 范围：`src/webgame-ui`（排除 artsource 素材目录）
- 验证命令：
  - `npx tsc --noEmit -p src/webgame-ui/tsconfig.json`
  - `npx eslint src/webgame-ui`
- 结论：**9 个 tsc 错误 + 4 个 eslint 错误 + 7 个警告**。构建使用 `ts-loader transpileOnly`，这些错误不会阻塞 `pnpm build`，但属于真实类型/质量问题，建议大哥们修复。
- 状态：**待开发大哥修复**（Reasonix 不修代码）。

---

## P1 — 疑似真 bug（建议优先）

### 1. `memory/summaryRuntime.ts:1299` — TS2367 无重叠比较

```ts
const reviewed = archive.reviewCandidate(summaryId, decision, edits);
if (reviewed && decision !== 'reject') refreshMemorySummarySchedule();  // ← decision 类型是 'accept' | 'edit'
```

`decision !== 'reject'` 恒为 `true`，是死比较。两种可能：
- `reviewCandidate` 的决策类型本应包含 `'reject'`，则此处类型收窄遗漏了 reject 分支（调用方永远传不进 reject）；
- 决策确实只有 accept/edit，则这行应删掉 `decision !== 'reject'` 条件。

需要大哥确认 `reviewCandidate` 的决策契约后修。

## P2 — 类型漂移（字段不存在）

### 2. `GalMainStory/storyContextValidation.ts:179` 和 `:207` — TS2339

```ts
const episodeName = episode?.displayName ?? result.eventId;  // displayName 不存在于 StoryEpisodeTemplate
```

`StoryEpisodeTemplate` 没有 `displayName` 字段（实际是 `title`，见 `createMainStoryEntryPatch` 用法）。运行时 `episode?.displayName` 恒为 `undefined`，会 fallback 到 `eventId`，表现为**报告里永远显示楼层 ID 而不是剧集名**。建议改成 `episode?.title` 或给 episodeTemplate 补 `displayName` 字段（二选一，需对齐 episode01-03 的数据）。

## P2 — readonly 类型错误

### 3. `memory/summaryRuntime.ts:924`、`:927`、`:940` — TS2322 / TS4104

`readonly GalStoryMessageSave[]`（来自快照/存档）不能赋给 `SavedMemoryContext.messages` 的 mutable 类型。3 处同源。建议把 `SavedMemoryContext.messages` 改为 `readonly GalStoryMessageSave[]`（或调用处显式展开），需确认 `SavedMemoryContext` 的消费方是否有写操作。

## P3 — 可能 undefined

### 4. `memory/storyTimeline.ts:69` 和 `:70` — TS18048

```ts
message.extra.xxx  // message 可能 undefined（数组元素访问）
```

需要看 69 行附近是 `messages[index]` 还是 filter/find 结果，建议加空值守卫。

## P3 — 未使用变量

### 5. `components/ContextPreviewModal.tsx:94` 和 `:98` — TS6133

`pendingSummaryCount`、`failedJobCount` 声明后从未使用。删除或接上 UI。

---

## eslint errors

| 位置 | 规则 | 说明 |
|---|---|---|
| `GalMainStory/storyPresentation.ts:22,23,24` | `no-useless-escape` | 正则里 `\[` 转义多余，删掉 `\` |
| `memory/summaryAnalyzer.ts:30` | `no-control-regex` | 正则含 `\x00 \x08 \x0b \x0c \x0e \x1f` 控制字符，建议改用显式字符类并加注释说明意图 |

## eslint warnings（低优先）

- `messagesolt/build-import.mjs`、`savesolt/build-import.mjs`：`node:fs`/`node:path` 导入警告（构建脚本合理使用，可加 eslint-disable 或忽略）
- `artsource/model/cases/haruna-03-to-02/case.js:89`：`prefer-const`（素材目录，可整体排除）

---

## 复跑方式

```powershell
npx tsc --noEmit -p src/webgame-ui/tsconfig.json
npx eslint src/webgame-ui
```

修复后请大哥在对话或本文件追加"已修复"记录，Reasonix 负责复跑确认。
