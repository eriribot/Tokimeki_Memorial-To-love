# 经验：方案成熟度与 UI 外壳选择

## Use when

方案被称为“终极”“最佳”“默认”“生产可用”或要跨项目复用；尤其涉及 drawer、modal、floating panel、overlay、全屏舞台或移动端外壳。

## Claim contract

每个可复用方案结论都填写：

```text
pattern:
applies_when:
authority_and_target:
alternatives_compared:
counterevidence:
passed:
not_run:
human_review:
maturity:
```

成熟度只使用证据能支持的级别：

- `局部观察`：在一个明确项目或视口出现过，但缺陷、完整任务或人工接受仍未解决。
- `局部可用`：一个明确目标工作流通过，且人已接受该目标范围。
- `条件化模式`：适用条件和已知失败边界明确，并在目标条件中复现。
- `推荐默认`：对代表性目标矩阵比较过替代方案，关键工作流通过，人已接受。

“终极”或“通用最优”不是成熟度标签。单个生产项目、build、边界框无重叠或一张响应式截图，最多证明对应局部检查。

## UI checks

- 外壳几何、内容可用性和完整工作流分别验收；drawer 打得开不证明数据、生成或宿主链成功。
- 先按主要任务、内容密度、持续可见需求、可用高度、退出路径和宿主约束选 shell。
- 代表性矩阵覆盖实际容器，不用浏览器窗口尺寸替代 iframe/game-frame：桌面、平板横屏、手机横屏，以及产品要求的竖屏。
- 移动端检查动态 browser chrome、safe area、软键盘、旋转、滚动、触控热区、返回/关闭、焦点和 reduced motion。
- 记录失败方案和负面反馈。后到的同范围反证会降级成熟度，直到新证据解决它。

## Success

审查者能看出方案在哪里有效、哪里失败、哪些没跑，以及为什么当前标签没有超过证据。
