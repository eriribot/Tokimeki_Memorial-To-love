export interface StoryPromptPortraitOption {
  characterId: string;
  displayName: string;
  portraitId: string;
  expressionIds: readonly string[];
}

export interface StoryGenerationPromptContext {
  eventTitle: string;
  loreSection: string;
  sceneIds: readonly string[];
  minimumLineCount: number;
  requiredSceneSequence: readonly string[];
  portraitOptions: readonly StoryPromptPortraitOption[];
}

function normalizeInline(value: string, fallback: string): string {
  const normalized = value
    .normalize('NFKC')
    .replace(/[\r\n]/gu, ' ')
    .trim();
  return normalized || fallback;
}

function buildPortraitOptionList(options: readonly StoryPromptPortraitOption[]): string {
  if (options.length === 0) return '- 本幕没有可用角色立绘；focus、portrait、expression 必须全部写 none。';
  return options
    .map(
      option =>
        `- ${option.displayName}: focus=${option.characterId}; portrait=${option.portraitId}; expression=${option.expressionIds.join('|')}`,
    )
    .join('\n');
}

function buildDirectedExample(context: StoryGenerationPromptContext): string {
  const option = context.portraitOptions[0];
  const sceneId = context.sceneIds[0] ?? 'scene';
  if (!option) {
    return `@旁白【scene=${sceneId};focus=none;portrait=none;expression=none;effect=none】：空镜展示当前环境。`;
  }
  const expressionId = option.expressionIds[0] ?? 'neutral';
  return [
    `@旁白【scene=${sceneId};focus=${option.characterId};portrait=${option.portraitId};expression=${expressionId};effect=none】：${option.displayName}出现在画面中。`,
    `@${option.displayName}【scene=${sceneId};focus=${option.characterId};portrait=${option.portraitId};expression=${expressionId};effect=none】：这里是角色本人说话时的完整演出格式。`,
  ].join('\n');
}

function buildAllowedSpeakerList(options: readonly StoryPromptPortraitOption[]): string {
  const characterNames = [...new Set(options.map(option => `@${option.displayName}`))];
  return ['@旁白', '@你', ...characterNames].join('、');
}

export function buildStoryOutputProtocol(context: StoryGenerationPromptContext): string {
  return `
只输出 GAL 正文，不输出规划、分析、摘要、标题、标签、JSON 或阶段标记。

每个非空行必须严格使用：
@说话人【scene=场景ID;focus=角色ID或none;portrait=立绘ID或none;expression=表情ID或none;effect=效果ID】：正文

- 固定说话人和本幕已登记角色是：${buildAllowedSpeakerList(context.portraitOptions)}。
- 世界书中出现但尚未登记立绘的人物可以用真实姓名或明确身份发言，例如“@萨斯丁”“@猿山”“@老师”；不要写“@临时角色”或给姓名附加临时标签。
- 未登记说话人使用通用文字名牌。其本人没有可用立绘，不能为其虚构 focus、portrait 或 expression；镜头没有已登记角色时三项都写 none，也可以让镜头聚焦现场已有的登记角色。
- 每行必须完整写出 scene、focus、portrait、expression、effect 五个字段，不继承上一行。
- scene 只能使用：${context.sceneIds.join('、')}。
- effect 只能使用：none、flash、shake；没有明确闪光或震动时使用 none。
- focus 表示当前画面实际出镜的角色，不等于说话人；镜头无人时写 none。
- 只要正文正在描写、展示或持续拍摄一名已登记角色，focus 就必须填写该角色 ID；不能因为是旁白、玩家发言、洗浴场景或没有切换镜头而写 none。
- 已登记角色本人说话时，focus 不能是 none；可以聚焦本人，也可以在剧情明确要求反应镜头时聚焦另一名当前可见的已登记角色。
- 同一角色连续在场时，每一行都重复填写该角色的 focus、portrait 和 expression，不得用 none 表示“沿用上一页”。
- focus=none 只用于真正没有任何已登记角色出现在画面中的环境空镜。
- focus=none 时 portrait 与 expression 必须同时为 none。
- focus 为角色 ID 时，portrait 与 expression 必须使用下列同一角色登记值：
${buildPortraitOptionList(context.portraitOptions)}
- 每行正文只承载一个镜头或一句短台词；不要在正文中解释演出字段。
- 涉及洗浴、更衣或其他私密场景时，不要再和之前的动画一样用圣光雾气遮挡，现在是成人向的新企划了。

合法示例（使用当前幕真实登记值）：
${buildDirectedExample(context)}

完成合同：
- 至少输出 ${context.minimumLineCount} 行上述 GAL 正文。
- 场景首次推进必须完整覆盖：${context.requiredSceneSequence.join(' → ')}。
- 写完世界书“${context.loreSection}”最后一个情节点后立即结束；禁止用缩短、总结或跳过情节点的方式凑齐行数和场景。
  `.trim();
}

export function buildStoryGenerationPrompt(context: StoryGenerationPromptContext): string {
  const eventTitle = normalizeInline(context.eventTitle, '当前剧情');
  const loreSection = normalizeInline(context.loreSection, '当前幕');

  return `
请演绎《${eventTitle}》中，已注入世界书剧情资料里的“${loreSection}”。

- 世界书是剧情唯一权威。严格按该小节列出的情节点顺序，从第一点写到最后一点；不得使用其他幕的情节。
- 把每个情节点实际演成连续画面，写出动作、对白、空间移动、环境变化与直接结果，不能压成总结。
- 写完该小节最后一个情节点立即结束，不续写下一幕。
- 人物世界书只补充性格、口吻和身份，不能改写剧情世界书规定的事件与关系。
- 玩家统一写成第二人称“你”。不解释行动点、存档、世界书、生成或资源路径。

${buildStoryOutputProtocol(context)}
`.trim();
}
