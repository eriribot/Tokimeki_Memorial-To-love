import { getRequiredStoryPortraitId, validateStoryPortraitRules } from '../GalMainStory/portraitRules';
import type { StorySceneId, StoryScenePortraitRule } from '../GalMainStory/storyTypes';

export interface StoryPromptPortraitOption {
  characterId: string;
  displayName: string;
  portraitId: string;
  expressionIds: readonly string[];
}

export type StoryPromptPortraitRule = StoryScenePortraitRule;

export interface StoryGenerationPromptContext {
  eventTitle: string;
  loreSection: string;
  sceneIds: readonly StorySceneId[];
  minimumLineCount: number;
  requiredSceneSequence: readonly StorySceneId[];
  portraitOptions: readonly StoryPromptPortraitOption[];
  portraitRules?: readonly StoryPromptPortraitRule[];
  continuityMode?: 'fresh' | 'continue';
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

function validatePromptContext(context: StoryGenerationPromptContext): void {
  if (context.sceneIds.length === 0) throw new Error('当前幕至少要登记一个场景。');
  if (!Number.isInteger(context.minimumLineCount) || context.minimumLineCount <= 0) {
    throw new Error('当前幕最少正文行数必须是正整数。');
  }

  const sceneIds = new Set<StorySceneId>();
  for (const sceneId of context.sceneIds) {
    if (sceneIds.has(sceneId)) throw new Error(`当前幕重复登记了场景“${sceneId}”。`);
    sceneIds.add(sceneId);
  }
  for (const sceneId of context.requiredSceneSequence) {
    if (!sceneIds.has(sceneId)) throw new Error(`完成合同引用了当前幕未登记的场景“${sceneId}”。`);
  }

  const optionPairs = new Set<string>();
  for (const option of context.portraitOptions) {
    const pair = `${option.characterId}\u0000${option.portraitId}`;
    if (optionPairs.has(pair)) {
      throw new Error(`角色“${option.characterId}”重复登记了立绘“${option.portraitId}”。`);
    }
    if (option.expressionIds.length === 0) {
      throw new Error(`立绘“${option.characterId}/${option.portraitId}”没有登记表情。`);
    }
    optionPairs.add(pair);
  }

  const rules = context.portraitRules ?? [];
  validateStoryPortraitRules(rules);
  for (const rule of rules) {
    if (!sceneIds.has(rule.sceneId)) throw new Error(`立绘规则引用了当前幕未登记的场景“${rule.sceneId}”。`);
    for (const portraitId of [rule.portraitId, rule.outsideScenePortraitId].filter(Boolean) as string[]) {
      if (!optionPairs.has(`${rule.characterId}\u0000${portraitId}`)) {
        throw new Error(`立绘规则引用了当前幕未登记的立绘“${rule.characterId}/${portraitId}”。`);
      }
    }
  }
}

function buildPortraitRuleSection(context: StoryGenerationPromptContext): string {
  const rules = context.portraitRules ?? [];
  if (rules.length === 0) return '';

  const ruleLines: string[] = [];
  for (const characterId of [...new Set(rules.map(rule => rule.characterId))]) {
    const scenesByPortrait = new Map<string, string[]>();
    for (const sceneId of context.sceneIds) {
      const portraitId = getRequiredStoryPortraitId(rules, sceneId, characterId);
      if (!portraitId) continue;
      const sceneIds = scenesByPortrait.get(portraitId) ?? [];
      sceneIds.push(sceneId);
      scenesByPortrait.set(portraitId, sceneIds);
    }
    for (const [portraitId, sceneIds] of scenesByPortrait) {
      ruleLines.push(`- IF scene=${sceneIds.join('|')} AND focus=${characterId}, THEN portrait=${portraitId}。`);
    }
  }

  return `- 下列场景分支决定唯一合法 portrait，优先级高于上面的登记值总表：\n${ruleLines.join('\n')}`;
}

function buildContinuityInstruction(mode: StoryGenerationPromptContext['continuityMode']): string {
  if (mode !== 'continue') return '';
  return '- 延续已提供的前序剧情中已经发生的事实、人物状态与关系；不要复述前幕，也不要重新演绎已经完成的情节点。';
}

function buildDirectedExample(context: StoryGenerationPromptContext): string {
  const sceneId = context.requiredSceneSequence[0] ?? context.sceneIds[0];
  const rules = context.portraitRules ?? [];
  const sceneRule = rules.find(rule => rule.sceneId === sceneId);
  const option = sceneRule
    ? context.portraitOptions.find(
        candidate =>
          candidate.characterId === sceneRule.characterId &&
          candidate.portraitId === getRequiredStoryPortraitId(rules, sceneId, sceneRule.characterId),
      )
    : context.portraitOptions.find(candidate => {
        const requiredPortraitId = getRequiredStoryPortraitId(rules, sceneId, candidate.characterId);
        return requiredPortraitId === null || requiredPortraitId === candidate.portraitId;
      });
  if (!option) {
    return `@旁白【scene=${sceneId};focus=none;portrait=none;expression=none;effect=none】：空镜展示当前环境。`;
  }
  const expressionId = option.expressionIds[0] ?? 'neutral';
  return [
    `@旁白【scene=${sceneId};focus=${option.characterId};portrait=${option.portraitId};expression=${expressionId};effect=none】：${option.displayName}出现在画面中。`,
    `@${option.displayName}【scene=${sceneId};focus=${option.characterId};portrait=${option.portraitId};expression=${expressionId};effect=none】：这里是角色本人说话时的完整演出格式。`,
  ].join('\n');
}

function buildAdditionalPortraitRuleExamples(context: StoryGenerationPromptContext): string {
  const rules = context.portraitRules ?? [];
  if (rules.length === 0) return '';

  const firstSceneId = context.requiredSceneSequence[0] ?? context.sceneIds[0];
  const ruleCoveredByPrimaryExample = rules.find(rule => rule.sceneId === firstSceneId);
  const exampleLines = rules
    .filter(rule => rule !== ruleCoveredByPrimaryExample)
    .map(rule => {
      const option = context.portraitOptions.find(
        candidate => candidate.characterId === rule.characterId && candidate.portraitId === rule.portraitId,
      );
      const expressionId = option?.expressionIds[0];
      if (!option || !expressionId) return null;
      return `@${option.displayName}【scene=${rule.sceneId};focus=${rule.characterId};portrait=${rule.portraitId};expression=${expressionId};effect=none】：这里是场景专用立绘的完整演出格式。`;
    })
    .filter((line): line is string => line !== null);

  if (exampleLines.length === 0) return '';
  return `- 场景专用立绘的额外完整行示例（只示范合法字段组合，不代表正文开场或场景顺序）：\n${exampleLines.join('\n')}`;
}

function buildRequiredSceneContract(requiredSceneSequence: readonly StorySceneId[]): string {
  if (requiredSceneSequence.length === 0) return '';
  return `- 场景首次推进必须完整覆盖：${requiredSceneSequence.join(' → ')}。`;
}

function buildAllowedSpeakerList(options: readonly StoryPromptPortraitOption[]): string {
  const characterNames = [...new Set(options.map(option => `@${option.displayName}`))];
  return ['@旁白', '@你', ...characterNames].join('、');
}

export function buildStoryOutputProtocol(context: StoryGenerationPromptContext): string {
  validatePromptContext(context);
  return `
只输出一个正文容器，不使用 Markdown 代码块。默认使用 <content>...</content>；如果上层提示已指定其他正文标签，例如 <正文>...</正文>、<story_scene>...</story_scene> 或 <story_scence>...</story_scence>，则沿用那一对同名开闭标签。不得并列或嵌套多个正文容器；容器外不输出任何文字，容器内不输出规划、分析、摘要、标题、其他标签、JSON 或阶段标记。

正文容器内每个非空行必须严格使用：
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
- focus 为角色 ID 时，portrait 与 expression 必须使用下列同一角色登记值；登记值总表不代表每个场景都能使用该角色的全部立绘：
${buildPortraitOptionList(context.portraitOptions)}
${buildPortraitRuleSection(context)}
${buildAdditionalPortraitRuleExamples(context)}
- 每行正文只承载一个镜头或一句短台词；不要在正文中解释演出字段。
- 涉及洗浴、更衣或其他私密场景时严格使用上述场景专用立绘绑定。

合法完整外层示例（使用当前幕首个必经场景的真实登记值）：
<content>
${buildDirectedExample(context)}
</content>

完成合同：
- 至少输出 ${context.minimumLineCount} 行上述 GAL 正文。
${buildRequiredSceneContract(context.requiredSceneSequence)}
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
${buildContinuityInstruction(context.continuityMode)}

${buildStoryOutputProtocol(context)}
`.trim();
}
