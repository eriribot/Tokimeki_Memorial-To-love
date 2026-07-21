# 艾尔登特审查邀请

## 本轮结果

- 用户可见目标：第一集第一幕第 11/17 页通过共享分层立绘组件显示结城美柑、姓名牌和发言口型，眼嘴贴片与身体底图无错位。
- 授权来源：用户提供实际截图，明确否决旧坐标并要求修正第一幕实际渲染。
- 本轮范围：美柑角色模块的眼嘴舞台坐标修正、制作指南实测记录、相关本地构建和源级对齐验证。
- 明确未触碰：第二集登记、地图、AP/日期/好感/完成结算、存档协议、宿主消息、shujuku/ACU、插件和数据库。

## 改动文件

- `GalMainStory/characters/mikan.ts`
- `GalMainStory/characters/index.ts`
- `GalMainStory/episodes/episode01/acts/act01.ts`
- `菈菈分层动态立绘制作与接入指南.md`
- `MODULES.md`
- `data/lore-books/README.md`
- `ALDENT_STATUS.md`
- `progress.md`

## 验证证据

| Check                              | Status  | Evidence                                                                 |
| ---------------------------------- | ------- | ------------------------------------------------------------------------ |
| Runtime Prettier / ESLint          | passed  | 三个运行时代码文件通过                                                   |
| TypeScript                         | passed  | `pnpm exec tsc --noEmit -p src/webgame-ui/tsconfig.json --pretty false`  |
| Story contract                     | passed  | `node src/webgame-ui/verify-story-generation.cjs`                        |
| Character / episode lore contracts | passed  | 两个恢复源校验脚本执行通过                                               |
| Character validator ESLint         | failed  | 既有 CJS `require()` 触发项目 ESM lint 规则；没有迁移校验工具格式        |
| Development build                  | passed  | `pnpm build:dev`                                                         |
| Prior desktop render               | failed  | 用户截图显示旧坐标切过刘海、额头和脸部；上一轮截图已失效                 |
| Mikan source-pixel alignment       | passed  | 新眼窗 `y=270`、嘴窗 `y=398`；旧边缘 MAE 约 `39/60`，新边缘 MAE 约 `5-6` |
| Corrected browser render           | not run | 当前浏览器 URL 策略阻止重新抓取本地页面，等待用户刷新确认                |
| Fixed diagnostic composite         | passed  | `output/web-game-mikan/mikan-face-alignment-before-after.png`            |
| Real Tavern UID 7 scan             | not run | standalone 页面没有 Tavern Helper                                        |
| Human acceptance                   | not run | 等待本次审查                                                             |

## 人工复现

1. 打开 `http://localhost:5500/dist/webgame-ui/` 并点击“重新开始”。
2. 点击一次“学习”；在本地生成失败页选择“使用保底版”。
3. 点击十次“下一页”，停在第一幕第 11/17 页。
4. 检查美柑人物轮廓、眼嘴贴片、闭眼 neutral、口型、姓名牌和正文是否符合预期。
5. 在真实 Tavern 重生成第一幕，检查关闭的 UID 7 `结城美柑` 条目仅在下一次扫描副本中启用，保存状态不变。

预期看到：第一幕家中页出现结城美柑；眼睛位于刘海下方、嘴巴位于下巴上方，body、mask、`c_eye`、`c_mouth`
和姓名牌均加载，桌面与手机横屏无破图或横向溢出。

## 当前接通状态

- [x] 只是本地状态演示
- [ ] 已接入真实状态读取
- [ ] 已接入真实状态写入
- [ ] 已可作为正式流程使用

涉及宿主时分别填写：

- 生成链：源码会选择美柑 UID 7；本地未运行真实 `TavernHelper.generate()` 或 World Info 扫描。
- 宿主消息链：未创建 hidden user/assistant floors。
- 插件/数据库链：未接通 `MESSAGE_SENT`、shujuku/ACU 或数据库。
- UI 镜像链：本地 fallback 页面已验证，不冒充宿主正文。
- 本轮允许触发：standalone 本地 fallback 和只读资源请求。
- 本轮必须隔离：真实宿主消息、插件/数据库写入和世界书保存状态修改。

## 已知风险与缺失证据

- 美柑 UID 7 的真实 World Info 一次性扫描尚未运行。
- 修正后的眼嘴坐标与逐帧接缝仍需要人看实际画面决定是否接受；用户已否决旧坐标画面。
- standalone 控制台存在缺少 Tavern save/generate 接口的预期隔离错误。
- 人物恢复源校验脚本执行通过，但其既有 CommonJS 导入形式不通过项目 ESM lint 规则。

## 需要人的决定

请填写 `aldent-human-review-form.md`，选择接受、限定下一轮、拒绝或证据不足。

本邀请发出后冻结修改；没有完成人工审查，不开启下一实现轮。
