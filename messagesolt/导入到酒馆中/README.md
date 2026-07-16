# ToLove对话槽

将同目录的 `ToLove对话槽.json` 导入 Tavern Helper，绑定当前角色卡并启用。它需要与 `ToLove存档槽` 同时启用。

每个槽位对应一个 `user/files/tokimeki-to-love-messages-*.json` 文件，只保存游戏内部的 User
prompt 与 Assistant 正文。本轮不会创建真实酒馆楼层，也不会触发 shujuku、ACU 或数据库钩子。

修改桥源码后，在仓库根目录运行：

```powershell
node src/webgame-ui/messagesolt/build-import.mjs
```
