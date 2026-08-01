# 经验：模块边界

## Use when

入口文件膨胀，或 UI、状态、变量、prompt、动作和渲染互相串层。

## Default boundaries

- `index`：装配、初始化、生命周期和渲染调度。
- `state` / `store`：本地状态。
- `variables` / `adapter`：权威数据读取与写回。
- `prompt` / `message-format`：正文抽取、清洗和 prompt 拼装。
- `actions`：发送、生成、通知、回溯和重生成。
- `render`：状态到界面。

## Success

修改一层不必理解全仓，测试能针对单一职责，入口不继续成为业务黑洞。
