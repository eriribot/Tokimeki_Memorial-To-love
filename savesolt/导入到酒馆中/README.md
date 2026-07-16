# ToLove存档槽

将同目录的 `ToLove存档槽.json` 导入 Tavern Helper，绑定当前角色卡并启用。还需要同时导入并启用
`messagesolt/导入到酒馆中/ToLove对话槽.json`。

脚本通过 SillyTavern 的 `/api/files/upload` 写入、通过 `/user/files/tokimeki-to-love-save-*.json`
读取本机文件。游戏界面不会读取浏览器 `localStorage`，脚本未启用时会显示错误。

修改桥源码后，在仓库根目录运行：

```powershell
node src/webgame-ui/savesolt/build-import.mjs
```
