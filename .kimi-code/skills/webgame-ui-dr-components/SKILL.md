---
name: webgame-ui-dr-components
description: 用于处理 webgame-ui 的 components 模块——负责渲染校园地图、教室场景、角色立绘、玩家头像、状态面板、控制栏、事件日志与角色卡片导入等所有可视化 UI 组件。
---

# webgame-ui `components` 模块技能

> 适用范围：`src/webgame-ui/components/**` 以及与其直接交互的 `stores/`、`utils/`、`data/`。

---

## 1. Module Purpose & Capabilities

`components` 模块是 **webgame-ui 的视图层**，把一个《心跳回忆》式的校园养成模拟游戏的所有交互画面组装起来：

- **大地图** (`SchoolMap.tsx`)：网格化校园地图，显示地点标记、玩家 Q 版头像、NPC Q 版头像。
- **地点标记** (`LocationMarker.tsx`)：可点击移动、显示当前地点高亮、有人时显示 💕、可进入场景的地点（教室/图书馆）带「进入场景」按钮。
- **场景模式** (`ClassroomScene.tsx`)：进入教室/图书馆等场景后切换为全屏立绘场景，显示角色立绘（tachie）、对话、交谈按钮。
- **角色卡片** (`CharacterCard.tsx` / `CharacterPortrait.tsx`)：侧边栏展示当前地点角色头像、好感度心形、问候语。
- **玩家** (`Player.tsx`)：在地图上显示主角 Q 版头像。
- **状态面板** (`StatPanel.tsx`)：显示天数、时段、地点、金钱、六维属性条。
- **控制栏** (`Controls.tsx`)：推进时间、个人行动（学习/运动/艺术/社交/休息/买零食）、与附近角色交谈。
- **事件日志** (`EventLog.tsx`)：滚动显示游戏日志。
- **卡片导入器** (`CardImporter.tsx`)：从本地文件或 URL 导入 SillyTavern 角色卡片（支持 JSON / PNG）。
- **侧边栏** (`Sidebar.tsx`)：可折叠的信息面板，承载 `CharacterPortrait`。

所有组件都基于 **React + TypeScript + Zustand**，图片统一通过 `utils/placeholderGenerator.tsx` 的 `ImageWithPlaceholder` 做缺失回退。

---

## 2. Core Design Logic

### 2.1 布局总控在 `App.tsx`

`App.tsx` 负责整体布局与两种顶层视图的切换：

```tsx
// App.tsx
const currentSceneId = useGameStore((state) => state.currentSceneId)
// ...
<div className="map-stage">
  {currentSceneId ? <ClassroomScene /> : <SchoolMap />}
</div>
```

- 当 `gameStore.currentSceneId` 非空时进入**场景视图**；否则显示**地图视图**。
- `useMapScale(mapWidth, mapHeight)` 监听窗口大小，按 `min(1, availableWidth/mapWidth, availableHeight/mapHeight)` 缩放地图舞台，保证小屏也能完整显示。
- `App.css` 中的 `.map-section` 是地图外层容器，`.map-stage` 是实际被 `transform: scale(...)` 缩放的舞台。

### 2.2 地图视图：网格坐标 + 绝对定位

`mapStore.ts` 用 `width=10`、`height=6`、`cellSize=140` 定义网格，`LOCATIONS` 里每个地点有 `x`、`y`：

```ts
// stores/mapStore.ts
classroom: { id: 'classroom', name: '教室', x: 2, y: 2, color: '#f59e0b', ... }
```

- `LocationMarker` 用 `left: x * cellSize + 4`、`top: y * cellSize + 4` 定位。
- `Player` 用 `left: loc.x * cellSize + cellSize / 4`、`top: loc.y * cellSize + cellSize / 4` 显示在格子里。
- `SchoolMap` 把同一地点的 NPC 按 `locationIndex` 排成最多 3 列的矩阵，偏移 `col * 30` / `row * 30`，避免头像重叠。

### 2.3 场景视图：硬编码的教室/图书馆分支

`ClassroomScene.tsx` 目前只区分两个背景：

```tsx
const sceneBackground = sceneLocationId === 'library'
  ? '/artsource/backgrounds/library.png'
  : '/artsource/backgrounds/classroom.jpg'
```

- 舞台只显示有 `tachie` 的角色；没有 tachie 的角色在场景中不渲染。
- 当前激活角色由 `activeTargetId` 决定，若不在当前场景则默认取第一个场景角色。
- 点击角色切换 `activeTargetId`；点击「交谈」调用 `cardStore.addAffection(id, 5)` 并写日志。

### 2.4 双角色数据源： targets[]（主）+ characters（兼容）

- **真实来源**：`cardStore.ts` 中的 `targets: []`，所有导入的卡片都会通过 `cardToCharacter()` 转成目标角色。
- **兼容层**：`characterStore.ts` 初始化时把默认卡片（haruka、miyuki、rin、sakura）导入 `cardStore`，并通过 `useCardStore.subscribe` 把 `targets` 同步到自己的 `characters`。
- 因此：
  - `SchoolMap.tsx`、`LocationMarker.tsx` 读取 `useCharacterStore().characters`。
  - `ClassroomScene.tsx`、`CharacterPortrait.tsx`、`Controls.tsx` 读取 `useCardStore().targets`。

设计意图：`characterStore` 是老接口的兼容层，新功能应该直接消费 `cardStore.targets`。

### 2.5 时段驱动的 NPC 移动

```ts
// stores/cardStore.ts
const PERIOD_LOCATION_RULES = {
  morning: (favoriteLocations) => favoriteLocations[0] || 'classroom',
  class1: () => 'classroom',
  lunch: (favoriteLocations) => favoriteLocations[1] || favoriteLocations[0] || 'cafeteria',
  class2: () => 'classroom',
  afterSchool: (favoriteLocations) => { ... },
  evening: () => null,
}
```

- `Controls.handleNextPeriod()` 先调用 `gameStore.nextPeriod()`，再调用 `cardStore.spawnTargetsForPeriod(PERIODS[nextIndex].key)`，让角色按时间段换位置。
- `evening` 返回 `null`，表示该时段角色不显示在地图上。

### 2.6 图片缺失的兜底策略

所有图片都走 `ImageWithPlaceholder`：

```tsx
// utils/placeholderGenerator.tsx
export function ImageWithPlaceholder({ src, alt, character, type = 'portrait', ... }) {
  const [imageSrc, setImageSrc] = useState(() => resolveAssetPath(src))
  const handleError = () => {
    const placeholder = type === 'chibi'
      ? generateChibiPlaceholder(character)
      : type === 'tachie'
        ? generateTachiePlaceholder(character)
        : generatePortraitPlaceholder(character)
    setImageSrc(placeholder)
  }
  return <img src={imageSrc} ... onError={handleError} />
}
```

- 这样美术资源缺失时不会白屏，而是生成以角色首字母、颜色、类型为基础的 SVG 占位图。
- `Character.tsx` / `Player.tsx` 用 `type="chibi"`，`CharacterCard.tsx` 用 `type="portrait"`，`ClassroomScene.tsx` 用 `type="tachie"` 或 `type="portrait"`。

### 2.7 CSS 类名的语义与层级

主要类名：

| 类名 | 所在文件 | 作用 |
|------|---------|------|
| `.school-map` | `SchoolMap.tsx` / `map-enhancements.css` | 地图根容器，透明背景、黄色边框 |
| `.location-marker` / `.current` | `LocationMarker.tsx` / CSS | 地点标记；`.current` 高亮当前位置 |
| `.enter-scene-button` | `LocationMarker.tsx` / `App.css` | 「进入场景」按钮 |
| `.character-avatar` / `.player-avatar` | `Character.tsx` / `Player.tsx` | 绝对定位的 64×64 头像 |
| `.character-portrait` / `.empty` / `.single` / `.multiple` | `CharacterPortrait.tsx` / `App.css` | 侧边栏角色面板的不同状态 |
| `.character-card` / `.active` | `CharacterCard.tsx` / `App.css` | 角色卡片；`.active` 高亮并显示问候语 |
| `.affection-hearts` / `.heart-icon.filled` / `.partial` | `CharacterCard.tsx` / `App.css` | 5 心好感度显示 |
| `.stat-panel` / `.calendar` / `.stat-row` / `.stat-bar` / `.stat-fill` | `StatPanel.tsx` / CSS | 状态面板与属性条 |
| `.controls` / `.control-group` / `.buttons.grid` / `.character-action` | `Controls.tsx` / CSS | 控制栏按钮分组 |
| `.event-log` | `EventLog.tsx` / CSS | 事件日志 |
| `.classroom-scene` / `.scene-characters` / `.scene-character` / `.scene-dialogue` | `ClassroomScene.tsx` / `App.css` | 场景视图 |
| `.card-importer-toggle` / `.card-importer-panel` | `CardImporter.tsx` / `CardImporter.css` | 卡片导入器 |
| `.game-sidebar` / `.open` / `.closed` | `Sidebar.tsx` / `App.css` | 可折叠侧边栏 |

---

## 3. Core Data Structures

### 3.1 角色对象（由 `cardLoader.ts` 的 `cardToCharacter()` 生成）

```ts
{
  id: string,                 // 基于名字的小写 ID，会处理重名
  name: string,
  color: string,              // game_data.color 或 '#ff8fab'
  type: string,               // game_data.type 或 tags[0] 或 '未知系'
  favoriteLocations: string[],
  greeting: string,           // first_mes 或默认问候
  portrait: string | null,    // 头像图路径
  chibi: string | null,       // Q 版图路径
  tachie: string | null,      // 全身立绘路径
  affection: number,
  friendship: number,
  romance: number,
  currentLocationId: string,
  _cardData: object           // 原始卡片数据
}
```

### 3.2 地点对象

```ts
{
  id: string,
  name: string,
  x: number,
  y: number,
  color: string,
  description: string
}
```

### 3.3 时段

```ts
// stores/gameStore.ts
export const PERIODS = [
  { key: 'morning',    label: '早晨',     time: '07:00' },
  { key: 'class1',     label: '上午课程', time: '08:30' },
  { key: 'lunch',      label: '午休',     time: '12:00' },
  { key: 'class2',     label: '下午课程', time: '14:00' },
  { key: 'afterSchool', label: '放学后',   time: '16:30' },
  { key: 'evening',    label: '夜晚',     time: '19:00' },
]
```

### 3.4 组件 Props

| 组件文件 | Props |
|---------|-------|
| `Character.tsx` | `{ character, x, y }` |
| `CharacterCard.tsx` | `{ character, isActive, onClick }` |
| `LocationMarker.tsx` | `{ location, isCurrent }` |
| 其它组件 | 无 props，全部从 Zustand store 读取 |

---

## 4. State Flow

```
用户操作
   │
   ▼
┌─────────────────────────────────────┐
│ Controls / LocationMarker /         │
│ ClassroomScene / CardImporter       │
└─────────────────────────────────────┘
   │
   ▼ 调用 store actions
┌─────────────────────────────────────┐
│ gameStore  │  playerStore  │ cardStore│
│            │               │          │
│ currentLocationId          │ targets[]│
│ currentSceneId             │ activeTargetId│
│ day / periodIndex          │ spawnTargetsForPeriod()│
│ addLog()                   │ addAffection()│
└─────────────────────────────────────┘
   │
   ▼ Zustand 订阅触发重渲染
┌─────────────────────────────────────┐
│ App → SchoolMap / ClassroomScene    │
│ Sidebar → CharacterPortrait         │
│ StatPanel / Controls / EventLog     │
└─────────────────────────────────────┘
```

### 4.1 典型流程

1. **移动**：点击 `LocationMarker` → `gameStore.setLocation(id)` → `currentLocationId` 改变 → `Player`、`SchoolMap`、`Controls`、`CharacterPortrait` 重渲染。
2. **进入场景**：点击「进入场景」→ `gameStore.enterScene(id)` → `App` 渲染 `ClassroomScene`。
3. **推进时间**：`Controls.handleNextPeriod()` → `gameStore.nextPeriod()` + `cardStore.spawnTargetsForPeriod(nextKey)` → 天数/时段更新 + NPC 位置重排。
4. **交谈加好感**：`Controls.handleTalk(c)` / `ClassroomScene.talkToActiveCharacter()` → `cardStore.addAffection(id, 5)` + `gameStore.addLog(...)`。
5. **导入卡片**：`CardImporter` → `cardStore.addCardFromFile(file)` / `addCardFromURL(url)` → `cardLoader.loadCardFromFile/URL` → `cardToCharacter()` → `targets` 更新 → `characterStore` 通过 subscribe 同步 → 地图/侧边栏出现新角色。
6. **侧边栏折叠**：`Sidebar` 用本地 `useState(isOpen)` 切换 `.open` / `.closed`，不影响全局状态。

---

## 5. Common Modification Scenarios

### 5.1 添加一个新的地图地点

涉及文件：

1. `stores/mapStore.ts`：在 `LOCATIONS` 里新增地点，指定 `x`、`y`、`color`。若地点超出当前网格，调整 `width` / `height` / `cellSize`。
2. `components/LocationMarker.tsx`：在 `LOCATION_ICONS` 里添加图标映射，例如 `newSpot: '🌳'`。
3. `stores/cardStore.ts`：如需 NPC 在新地点出现，更新 `PERIOD_LOCATION_RULES` 中相关时段的返回逻辑。
4. CSS：`.school-map` 的边框/背景无需改动，新地点会自动被网格定位。

### 5.2 让一个新地点支持「进入场景」

当前只有 `classroom` 和 `library` 支持进入场景。以 `cafeteria` 为例：

1. `components/LocationMarker.tsx`：
   ```tsx
   const canEnterScene = ['classroom', 'library', 'cafeteria'].includes(location.id) && isCurrent
   ```
2. `components/ClassroomScene.tsx`：扩展背景分支：
   ```tsx
   const sceneBackground =
     sceneLocationId === 'library' ? '/artsource/backgrounds/library.png' :
     sceneLocationId === 'cafeteria' ? '/artsource/backgrounds/cafeteria.jpg' :
     '/artsource/backgrounds/classroom.jpg'
   ```
3. `components/Controls.tsx`：把 `currentLocationId === 'classroom'` 的判断改为支持新地点：
   ```tsx
   {['classroom', 'library', 'cafeteria'].includes(currentLocationId) && (
     <button onClick={handleEnterScene}>进入场景</button>
   )}
   ```
4. 准备对应背景图到 `artsource/backgrounds/`。

### 5.3 添加一个新的玩家行动按钮

以「打工」为例：

1. `stores/playerStore.ts` 添加 action：
   ```ts
   work: () => set((state) => ({
     money: Math.min(9999, state.money + 200),
     stamina: Math.max(0, state.stamina - 20),
     stress: Math.min(100, state.stress + 10),
   }))
   ```
2. `components/Controls.tsx`：
   ```tsx
   const work = usePlayerStore((state) => state.work)
   // ...
   <button onClick={() => handleAction(work, '打工')}>💼 打工</button>
   ```
3. `handleAction` 会自动检查 `isTired()`、执行 action、写日志。

### 5.4 修改角色卡片的好感度显示样式

`CharacterCard.tsx` 用 5 颗心表示 0-100 好感度：

- `heartValue = (i + 1) * 20`
- `isFilled = character.affection >= heartValue`
- `isPartial = character.affection >= heartValue - 10 && character.affection < heartValue`

要改为 10 心或条形，直接修改这里的 `[...Array(5)]` 和阈值计算即可。CSS 类 `.heart-icon.filled` / `.partial` 控制填充与动画。

### 5.5 调整图片占位符风格

编辑 `utils/placeholderGenerator.tsx` 中的 `generatePortraitPlaceholder`、`generateTachiePlaceholder`、`generateChibiPlaceholder`。

- 它们接收 `{ name, color, type }`，返回 SVG Data URL。
- 颜色亮度工具 `adjustColorBrightness(color, percent)` 在文件底部。
- 修改后所有使用 `ImageWithPlaceholder` 的组件会自动生效。

### 5.6 让 ClassroomScene 支持无 tachie 角色也显示

当前：

```tsx
const stageCharacters = sceneCharacters.filter((character) => character.tachie)
```

若希望没有全身立绘的角色也出现在场景，可改为：

```tsx
const stageCharacters = sceneCharacters
```

并在渲染时把 `character.tachie ? 'tachie' : 'portrait'` 的 className 区分开，CSS 中 `.scene-character-img.portrait` 默认是 `display: none`（见 `App.css` 末尾），需要同步调整 CSS。

---

## 6. 关键文件速查

| 文件 | 职责 |
|------|------|
| `components/SchoolMap.tsx` | 地图根组件，渲染背景、网格、地点、角色 |
| `components/LocationMarker.tsx` | 单个地点标记，点击移动，进入场景 |
| `components/Player.tsx` | 主角头像在地图上的绝对定位 |
| `components/Character.tsx` | NPC Q 版头像 |
| `components/ClassroomScene.tsx` | 场景视图（背景、立绘、对话） |
| `components/CharacterPortrait.tsx` | 侧边栏当前地点角色列表/轮播 |
| `components/CharacterCard.tsx` | 单张角色卡片（头像、名字、类型、好感度） |
| `components/StatPanel.tsx` | 天数、时段、地点、属性条 |
| `components/Controls.tsx` | 时间控制、个人行动、附近角色交谈 |
| `components/EventLog.tsx` | 日志显示 |
| `components/CardImporter.tsx` | 卡片导入 UI |
| `components/Sidebar.tsx` | 可折叠侧边栏 |
| `App.tsx` | 顶层布局与 Map/Scene 切换 |
| `stores/gameStore.ts` | 时间、地点、场景、日志、事件 |
| `stores/playerStore.ts` | 主角属性与行动 |
| `stores/cardStore.ts` | 导入的角色目标与好感度 |
| `stores/characterStore.ts` | 兼容层，代理到 cardStore |
| `stores/mapStore.ts` | 地图网格与地点定义 |
| `utils/cardLoader.ts` | 加载 / 解析 / 转换卡片 |
| `utils/placeholderGenerator.tsx` | SVG 占位图与 ImageWithPlaceholder |
| `utils/assetPath.ts` | 资源路径 base 处理 |
