# 经验：同层操作回到真实宿主楼层

## Use when

同层卡、shujuku、ACU、qrf_plot 或 iframe UI 必须触发宿主生成、世界书扫描或数据库更新。

## Invariants

- 宿主聊天楼层是权威。
- hidden real user/assistant 楼层承载需要的原生链路。
- UI 本地状态不能冒充宿主成功；成功后从宿主状态回读。
- 失败原因必须对人可见。

## Required evidence

- 宿主楼层真实变化。
- 预期世界书、插件或数据库链路真实触发。
- UI 镜像与宿主权威状态一致。

需要宿主 preset/context 但必须隔离插件的阶段，改用 `experience-host-hook-isolation.md` 的双路线合同。
