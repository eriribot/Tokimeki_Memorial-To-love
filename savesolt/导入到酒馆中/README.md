# ToLove存档槽

将同目录的 `ToLove存档槽.json` 导入 Tavern Helper，绑定当前角色卡并启用。还需要同时导入并启用
`messagesolt/导入到酒馆中/ToLove对话槽.json`。

脚本通过 SillyTavern 的 `/api/files/upload` 写入、通过 `/user/files/tokimeki-to-love-save-*.json`
读取本机文件。游戏界面不会读取浏览器 `localStorage`，脚本未启用时会显示错误。

修改桥源码后，在仓库根目录运行：

```powershell
node src/Tokimeki_Memorial-To-love/savesolt/build-import.mjs
```

若 SillyTavern 控制台出现
`Input path does not start with the root directory`，说明当前文件接口混用了相对与绝对数据根路径。桥会对“文件已经落盘、但接口随后报错”的情况做完整 JSON 回读确认；仍建议把
`config.yaml` 的 `dataRoot` 改为实际数据目录的绝对路径并彻底重启 SillyTavern，以免其他文件功能继续输出同类错误。
