export interface StoryGenerationPromptContext {
  eventTitle: string;
  stageTitle: string;
  stageOpening: string;
  stageEnding: string;
  allowedSpeakers: readonly string[];
  moodExamples: readonly string[];
}

function normalizeInline(value: string, fallback: string): string {
  const normalized = value
    .normalize('NFKC')
    .replace(/[\r\n]/gu, ' ')
    .trim();
  return normalized || fallback;
}

export function buildStoryOutputProtocol(allowedSpeakers: readonly string[], moodExamples: readonly string[]): string {
  return `
只输出 GAL 正文，不输出规划、分析、摘要、标题、标签、JSON或阶段标记。

- 每个非空行必须以半角 @ 开头。
- 叙述只可写成“@旁白：画面、动作或环境”。叙述统一用第二人称“你”指代玩家。
- 对白只可写成“@角色名【情绪】：台词”，角色名、情绪和台词必须在同一行。
- 主要角色使用：${allowedSpeakers.join('、')}。临时出现的老师、学生、路人等可以使用简短明确的姓名牌；玩家必须标“@你”。
- 情绪可自由填写一个简短、明确的中文词，例如：${moodExamples.join('、')}；不限于这些示例。
- 涉及洗浴、更衣或其他私密场景时，只可用环境遮挡、动作反应和喜剧错位表现；禁止描写裸体细节、私密部位或刻意性化身体。
  `.trim();
}

export function buildStoryGenerationPrompt(context: StoryGenerationPromptContext): string {
  const eventTitle = normalizeInline(context.eventTitle, '当前剧情');
  const stageTitle = normalizeInline(context.stageTitle, '当前幕');
  const stageOpening = normalizeInline(context.stageOpening, '从本幕开场开始');
  const stageEnding = normalizeInline(context.stageEnding, '写到本幕最后一个情节点');

  return `
请完整演绎《${eventTitle}》的“${stageTitle}”一幕。

开场：${stageOpening}
结尾：${stageEnding}

- 按本幕剧情中列出的顺序，让每个情节点都在画面内实际发生，写出动作、对白、环境变化与直接结果。
- 补足节点之间的因果和空间移动，形成连续的动画场景，不能把多个情节点压成一句总结。
- 没写到上面的结尾就不能停笔；写到结尾立即结束，不进入下一幕。
- 本集剧情资料决定事件与角色关系。人物资料和其他背景只补充不冲突的性格、口吻与世界观。
- 玩家统一写成第二人称“你”。不解释行动点、存档或生成过程。

${buildStoryOutputProtocol(context.allowedSpeakers, context.moodExamples)}
`.trim();
}
