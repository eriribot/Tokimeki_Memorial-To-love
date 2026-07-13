# webgame-ui 模块清单

## 当前能力

- 已有：学校地图、教室/图书馆场景、时间推进、玩家属性、角色卡、好感度、技能树和事件日志。
- 本轮补齐：开始界面、完整新游戏重置、页内继续游戏、返回开始页和官方 Sprite 菜单。
- 占位：保存、读取、目录、数据、辞典和系统设置只展示入口，不执行动作；鉴赏尚无入口。
- 已知未接通：暂停只切换 `isPlaying`，尚未限制地图、时间与个人行动。
- 当前接通状态：只是本地状态演示。没有存档、宿主状态写入、数据库或生成链路。

## 模块登记

| 模块 | 负责 | 主要输入 | 主要输出 | 不负责 |
| --- | --- | --- | --- | --- |
| `App` | 按 `screen` 装配开始页或游戏页 | `gameStore.screen` | 当前可见页面 | 菜单动作、跨 store 重置 |
| `gameSession` | 新游戏、继续、返回开始页 | game/player/card stores | 一致的会话生命周期 | 存档、宿主同步 |
| `StartScreen` | 展示官方标题、重新开始和继续游戏 | `hasSession`、标题与 A/B 菜单图片 | 会话意图 | 保存槽、设置页 |
| `MapMenu` | 展示 8 个官方图标按钮 | 菜单资源表、会话动作 | 关闭菜单或返回开始页 | 坐标热区、占位功能实现 |
| `menuAssets` | 菜单 ID、标签、图片和占位状态 | 官方文件名 | 组件配置 | 业务逻辑 |
| `copy_webgame_assets` | 发布仓库内美术资源 | `src/webgame-ui/artsource` | `dist/artsource` | 手工修补 `dist` |

## 权威状态

- 页面与会话状态以 Zustand store 为准。
- `screen: 'start' | 'game'` 决定显示开始页还是游戏页。
- `hasSession` 只表示当前页面会话可继续；刷新页面后不保留。
- 返回开始页只暂停并切换页面，不清除当前局。
- 新游戏必须同时重置游戏、玩家和角色状态。

## 状态流伪代码

```text
load:
  screen = start
  hasSession = false

startNewSession:
  reset game
  reset player
  reset targets and spawn morning locations
  hasSession = true
  isPlaying = true
  screen = game

resumeSession:
  if hasSession:
    isPlaying = true
    screen = game

returnToStart:
  preserve game/player/target data
  isPlaying = false
  screen = start

map menu icon07:
  returnToStart

map menu icon08 or backdrop:
  close map menu

placeholder icon:
  no state change and no success log
```

## 后续边界

保存、读取、目录、数据、辞典、鉴赏和设置必须在人工审查后分别登记真实状态来源，再接入功能；本轮不以本地假数据冒充接通。
