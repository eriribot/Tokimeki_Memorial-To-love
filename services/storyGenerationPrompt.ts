export interface StoryGenerationPromptContext {
  eventId: string;
  eventTitle: string;
  stageId: string;
  stageTitle: string;
  stageIndex: number;
  stageCount: number;
  entryReason: string;
  playerName: string;
  day: number;
  period: string;
  location: string;
  allowedSpeakers: readonly string[];
  moodExamples: readonly string[];
  stableFacts?: readonly string[];
}

function normalizeInline(value: string, fallback: string): string {
  const normalized = value
    .normalize('NFKC')
    .replace(/[\r\n]/gu, ' ')
    .trim();
  return normalized || fallback;
}

function formatFacts(facts: readonly string[]): string {
  return facts.map(fact => `- ${fact}`).join('\n');
}

export function buildStoryOutputProtocol(allowedSpeakers: readonly string[], moodExamples: readonly string[]): string {
  return `
这是供程序读取 GAL 正文的格式契约。它只约束正文如何标记，不接管当前预设的文风、叙事密度、创作方法、剧情细节或对白内容，也不规定固定行数或字数。

必须做到：
- 如果当前预设要求输出规划、<content>、吐槽或摘要，可以保留这些外围结构；游戏只读取 <content> 内的正文。没有 <content> 时，整段回答视为正文。
- 正文区域内每个非空行必须以半角 @ 开头；正文行数和字数根据事件闭环与当前预设自然决定，不要为了凑数量压缩或灌水。
- 叙述只可写成“@旁白：画面、动作或环境”。叙述统一用第二人称“你”指代玩家。
- 对白只可写成“@角色名【情绪】：台词”，角色名、情绪和台词必须在同一行。
- 角色名只可用：${allowedSpeakers.join('、')}。玩家必须标“@你”。
- 情绪可自由填写一个简短、明确的中文词，例如：${moodExamples.join('、')}；不限于这些示例。

绝对禁止：
- 正文区域内禁止JSON、标题、幕名、说明、总结、Markdown或代码围栏。
- 禁止使用 「台词」 或 “台词” 这类没有 @角色名 的裸引号对白。
- 禁止把对白塞进 @旁白 行，禁止在同一行混写叙述和对白，禁止把姓名牌与台词拆成两行。
- 禁止用第一人称“我、我的”指代玩家；角色在自己的对白中正常自称不受此限制。
- 涉及洗浴、更衣或其他私密场景时，只可用环境遮挡、动作反应和喜剧错位表现；禁止描写裸体细节、私密部位或刻意性化身体。

合法格式示例：
@旁白：走廊尽头传来急促脚步，你停下动作看向门口。
@角色名【惊讶】：等等，事情怎么会变成这样？
@你【认真】：先把眼前的问题解决，再谈别的。

输出前只检查正文区域：每个非空行都有 @ 标签，只有两种合法行型，对白都有已登记说话人和简短情绪。不要输出检查过程。
  `.trim();
}

export function buildStoryGenerationPrompt(context: StoryGenerationPromptContext): string {
  const eventId = normalizeInline(context.eventId, 'unknown-event');
  const eventTitle = normalizeInline(context.eventTitle, eventId);
  const stageId = normalizeInline(context.stageId, 'unknown-stage');
  const stageTitle = normalizeInline(context.stageTitle, stageId);
  const playerName = normalizeInline(context.playerName, '主角');
  const entryReason = normalizeInline(context.entryReason, 'runtime-selected');
  const period = normalizeInline(context.period, 'unknown-period');
  const location = normalizeInline(context.location, 'unknown-location');
  const stableFacts = context.stableFacts?.filter(Boolean) ?? [];

  return `
为校园恋爱游戏生成当前已经由游戏状态选中的 GAL 事件阶段正文。

当前运行时范围：
- 事件：${eventId}（${eventTitle}）
- 阶段：${stageId}（${stageTitle}），第 ${context.stageIndex + 1} / ${context.stageCount} 阶段
- 入口原因：${entryReason}
- 当前游戏日：${context.day}
- 当前时段：${period}
- 当前地点：${location}
- 玩家在界面中统一称“你”，当前游戏名是“${playerName}”。
${formatFacts(stableFacts)}

剧情资料来源：
- 本次请求中的 <selected_story_lore> 是代码从指定的关闭世界书条目中只读取得、并按当前事件选中的剧情事实来源；每次生成只会附带一份。
- 当前酒馆实际激活的其他世界书可以补充人物设定与长期事实，但不得覆盖 <selected_story_lore> 的当前事件边界，也不要重复讲述整集梗概。
- 只使用与当前事件、阶段、日期、时段、地点和前置状态相符的资料；不要把条目中的后续阶段、其他日期或其他路线混进本阶段。
- 世界书若使用“阶段链”“关键情节”“结束控制.结束条件”“分支控制参考”或语义相同的字段，按下面的事件完成契约处理。

事件完成契约：
1. 生成前在内部识别当前阶段尚未发生的必达节点、必须达到的收束条件，以及禁止跨越的下一事件、下一阶段、下一日期或下一时段。
2. 所有本阶段必达节点和收束条件都必须在正文中可观察地自然发生，才能关闭 <content> 或结束回答。摘要、旁白一句带过、声明“已经完成”或让事件在画面外发生，都不算完成。
3. 篇幅、字数、token 数和行数都不是完成标准。预设给出的篇幅只用于控制叙事密度；若与事件闭环冲突，必须继续写到本阶段完成，不能因为达到长度目标而删掉后半段。
4. 一旦本阶段收束条件全部发生，应在清楚的交接状态停笔。不要为了凑字数继续扩写，也不要提前进入需要下一次 AP、下一日期、下一时段或下一阶段才能触发的内容。
5. 世界书事件跨越多个日期或时段时，只完成当前运行时范围选中的阶段。若结束条件为空，使用当前阶段最后一个必达节点及其直接后果作为收束，不得擅自推进到后续事件。
6. 游戏代码已经结算的 AP、日期、时段、好感和事件状态保持权威；正文不得重算、撤销或提前结算这些值。

创作自由：
- 必达节点规定“必须发生什么”，不规定“具体怎样写”。节点之间的对白、动作、笑点、误会、镜头调度、环境互动、因果桥接和自然篇幅由你自由创作。
- 不要把世界书字段逐项改写成流水账。先建立动机与因果，再让关键节点通过角色行动发生，并写出节点造成的直接后果。
- 当前预设继续负责人物塑造、文风和叙事密度；GAL 协议只负责让正文能被界面解析。

抽象示例（只说明完成逻辑，不代表任何具体剧情）：
- 错误：世界书给出的因果锚点是“异常出现 → 角色尝试应对 → 关键装置介入 → 意外升级 → 危机解除并回到日常”，正文只写到相遇或初次应对便结束。
- 正确：让全部因果锚点及其直接后果在场景中实际发生，在危机解除并建立下一阶段的交接状态后停笔；具体对白、喜剧动作、地点利用和镜头表现均可原创。

${buildStoryOutputProtocol(context.allowedSpeakers, context.moodExamples)}
`.trim();
}
