import { getStoryCharacter, getStoryPortraitRig, isStoryCharacterId } from '../GalMainStory/characters';
import { extractPlayableText } from '../GalMainStory/storyTextExtraction';
import { runExclusiveStoryGeneration } from '../services/storyGenerationMutex';
import type {
  DatingDirectorPlan,
  DatingGirlRelation,
  DatingGeneratedOption,
  DatingStageContent,
  DatingStageId,
  DatingStoryLine,
} from './types';

export interface DatingGenerationRelationshipContext {
  sub: number;
  hurt: number;
  girlRelations: Readonly<Record<string, DatingGirlRelation>>;
}

export const DATING_GENERATION_ID = 'tolove-dating';

const DATING_STORY_PAGE_TARGET = 12;
const DATING_STORY_CHARACTER_TARGET = 1200;

// Presets may still use the source material's protagonist name in prose or as
// an address. Only a speaker label needs identity normalization: it must not
// create a second male protagonist in the playable scene.
const ORIGINAL_PROTAGONIST_SPEAKER_PATTERN = /^(?:结城梨斗|結城梨斗|梨斗|结城リト|結城リト|リト|rito|yuuki[\s._-]*rito|结城君|結城君)$/iu;

function normalizeSpeaker(value: string, plan: DatingDirectorPlan): string | null {
  const key = value.normalize('NFKC').trim();
  if (!key || /^(?:旁白|叙述|narrator)$/iu.test(key)) return null;
  if (/^(?:你|玩家|User|主角)$/iu.test(key) || key === plan.playerName || ORIGINAL_PROTAGONIST_SPEAKER_PATTERN.test(key)) {
    return plan.playerName;
  }
  if (key === plan.characterId || key === plan.characterName) return plan.characterName;
  throw new Error(`约会正文包含未知说话人：${key}`);
}

function normalizeScene(value: string, plan: DatingDirectorPlan, stageId: DatingStageId): DatingStoryLine['sceneId'] {
  const scene = value.trim() as DatingStoryLine['sceneId'];
  const expected = plan.stages.find(stage => stage.id === stageId)?.sceneId;
  if (!expected || scene !== expected) throw new Error(`约会正文场景必须为 ${expected}。`);
  return scene;
}

function parseCue(value: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const part of value.split(/[;,；，]/u)) {
    const separator = part.indexOf('=');
    if (separator < 1) throw new Error('约会演出指令格式无效。');
    const key = part.slice(0, separator).trim();
    const fieldValue = part.slice(separator + 1).trim();
    if (!['scene', 'focus', 'portrait', 'expression', 'effect'].includes(key) || !fieldValue) {
      throw new Error('约会演出指令字段无效。');
    }
    fields[key] = fieldValue;
  }
  if (Object.keys(fields).length !== 5) throw new Error('约会演出指令必须包含五个字段。');
  return fields;
}

function validatePortrait(
  fields: Record<string, string>,
  plan: DatingDirectorPlan,
): { focus: string | null; portrait: string | null; expression: string | null } {
  const focus = fields.focus === 'none' ? null : fields.focus;
  if (focus !== null && focus !== plan.characterId) throw new Error('约会正文 focus 不是当前邀约角色。');
  const portrait = fields.portrait === 'none' ? null : fields.portrait;
  const expression = fields.expression === 'none' ? null : fields.expression;
  if (focus === null) {
    if (portrait !== null || expression !== null) throw new Error('没有 focus 时不能指定立绘或表情。');
    return { focus, portrait, expression };
  }
  if (portrait === null || expression === null) {
    throw new Error('约会正文指定 focus 时必须同时指定 portrait 和 expression。');
  }
  const rig = getStoryPortraitRig(focus as Parameters<typeof getStoryPortraitRig>[0], portrait);
  if (!Object.hasOwn(rig.expressions, expression)) {
    throw new Error('约会正文 expression 未登记。');
  }
  return { focus, portrait, expression };
}

export function parseDatingContent(raw: string, plan: DatingDirectorPlan, stageId: DatingStageId): DatingStageContent {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('酒馆没有返回约会正文。');
  const normalized = extractPlayableText(trimmed, { requirePlayableWrapper: true }).normalize('NFKC').trim();
  const lines = normalized
    .split(/\r?\n+/u)
    .map(line => line.trim())
    .filter(line => line && !/^\{[\s\S]*\}$/u.test(line));
  const optionLines: DatingGeneratedOption[] = [];
  const storyLines: string[] = [];
  let optionsStarted = false;
  lines.forEach(line => {
    const optionMatch = line.match(/^@?选项(?:【|\[)([^】\]]+)(?:】|\])\s*[：:]\s*(.+)$/u);
    if (optionMatch) {
      optionsStarted = true;
      const optionFields = optionMatch[1].split(/[;；]/u).map(field => field.trim());
      if (optionFields.length !== 1 || !optionFields[0].startsWith('id=')) {
        throw new Error('约会选项只允许 id 字段。');
      }
      const id = optionFields[0].slice(3).trim();
      optionLines.push({ id, label: optionMatch[2].trim() });
      return;
    }
    if (/^@?选项/u.test(line)) throw new Error('约会选项行格式无效。');
    if (optionsStarted) throw new Error('约会选项必须放在正文最后。');
    storyLines.push(line);
  });
  if (storyLines.length === 0) throw new Error('约会正文没有可播放的正文页。');
  const parsed: DatingStoryLine[] = storyLines.map(line => {
    const match = line.match(/^@?([^【[】\]：:\r\n]{1,48}?)\s*(?:【|\[)([^】\]]+)(?:】|\])\s*[：:]\s*(.+)$/u);
    if (!match) throw new Error('约会正文行格式无效。');
    const fields = parseCue(match[2]);
    const speaker = normalizeSpeaker(match[1], plan);
    const text = match[3].trim();
    if (!text || text.length > 500) throw new Error('约会正文页内容无效。');
    const effect = fields.effect as DatingStoryLine['effect'];
    if (!['none', 'flash', 'shake'].includes(effect)) throw new Error('约会正文 effect 无效。');
    const presentation = validatePortrait(fields, plan);
    return {
      speaker,
      text,
      sceneId: normalizeScene(fields.scene, plan, stageId),
      focus: presentation.focus,
      portrait: presentation.portrait,
      expression: presentation.expression,
      effect,
    };
  });
  if (optionLines.length !== 3) throw new Error('约会正文必须在最后提供恰好三个选项。');
  const allowedIds = new Set(plan.stages.find(stage => stage.id === stageId)?.options.map(option => option.id));
  const seenIds = new Set<string>();
  optionLines.forEach(option => {
    if (!allowedIds.has(option.id)) throw new Error(`约会选项 ID 未登记：${option.id}`);
    if (seenIds.has(option.id)) throw new Error(`约会选项 ID 重复：${option.id}`);
    if (option.label.length < 2 || option.label.length > 80) throw new Error('约会选项文案长度无效。');
    seenIds.add(option.id);
  });
  return { stageId, source: 'tavern', lines: parsed, options: optionLines, createdAt: new Date().toISOString() };
}

export function createDatingFallbackContent(
  plan: DatingDirectorPlan,
  stageId: DatingStageId,
  selectedOptionLabel: string | null = null,
): DatingStageContent {
  const stage = plan.stages.find(candidate => candidate.id === stageId);
  if (!stage) throw new Error(`未知约会阶段：${stageId}`);
  const place = stageId === 'main' ? stage.label.replace(/的时光$/u, '') : '回程的街道';
  const returnResponse = selectedOptionLabel?.includes('影子')
    ? '你刚才故意踩我影子的时候，真的很像个小孩子。下次可别让我抓住了。'
    : selectedOptionLabel?.includes('默契')
      ? '说起她和朋友之间的默契时，你的语气让她稍微放松了下来。'
      : selectedOptionLabel?.includes('晚霞')
        ? '刚才一起看晚霞的时候，我觉得这样安静地待着也很好。'
        : selectedOptionLabel?.includes('哪边走')
          ? '谢谢你先问我的想法。和你一起走，往哪边都不会迷路。'
          : '今天的时间过得好快。下次也一起走一段吧。';
  const lines: DatingStoryLine[] = [
    {
      speaker: null,
      text: `今天的${place}比想象中更安静。${plan.characterName}放慢脚步，等你跟上。`,
      sceneId: stage.sceneId,
      focus: null,
      portrait: null,
      expression: null,
      effect: 'none',
    },
    {
      speaker: plan.characterName,
      text: stageId === 'main' ? `能和你这样出来走走，我其实很开心。` : returnResponse,
      sceneId: stage.sceneId,
      focus: plan.characterId,
      portrait: null,
      expression: null,
      effect: 'none',
    },
    {
      speaker: plan.playerName,
      text: stageId === 'main' ? '我也觉得，慢慢来就很好。' : '嗯，路上小心。',
      sceneId: stage.sceneId,
      focus: null,
      portrait: null,
      expression: null,
      effect: 'none',
    },
    {
      speaker: null,
      text:
        stageId === 'main'
          ? '两个人的影子在地面上并排延伸，刚好没有谁落在后面。'
          : '约会的余韵留在晚风里，像一件还没说完的小事。',
      sceneId: stage.sceneId,
      focus: null,
      portrait: null,
      expression: null,
      effect: 'none',
    },
  ];
  return {
    stageId,
    source: 'fallback',
    lines,
    options: stage.options.map(option => ({ id: option.id, label: option.label })),
    createdAt: new Date().toISOString(),
  };
}

function getTavernGenerateApi(): Pick<Window['TavernHelper'], 'generate'> {
  const api = window.TavernHelper;
  if (!api || typeof api.generate !== 'function') throw new Error('没有检测到 TavernHelper.generate。');
  return api;
}

function buildDatingPortraitContract(plan: DatingDirectorPlan): string {
  if (!isStoryCharacterId(plan.characterId)) {
    return '- 当前邀约角色没有登记立绘：focus、portrait、expression 必须全部写 none。';
  }
  const character = getStoryCharacter(plan.characterId);
  const options = Object.values(character.portraits).map(
    rig => `${rig.id}（expression=${Object.keys(rig.expressions).join('|')}）`,
  );
  return `- 当前邀约角色唯一可用演出：focus=${plan.characterId}；portrait=${options.join('；')}。每页 expression 由你根据当页情绪自行选择，但必须使用对应 portrait 登记的 expression ID。`;
}

export function createDatingGenerationPrompt(
  plan: DatingDirectorPlan,
  stageId: DatingStageId,
  recentArchives: readonly string[],
  recentBody: string | null,
  selectedOptionLabel: string | null,
  relationshipContext: DatingGenerationRelationshipContext | null = null,
): string {
  const stage = plan.stages.find(candidate => candidate.id === stageId);
  if (!stage) throw new Error('约会阶段不存在。');
  const pacingGuide =
    stageId === 'main'
      ? '先在心中按四段安排节奏，但不要输出分段标题：相遇与最初的紧张；由地点触发的无伤小意外或误会；有来有回的交谈与情绪转折；带着余韵自然走到三个玩家行动。四段都要充分演出，每段至少贡献三页，不要刚交代事件就急着收尾。'
      : '回程不是一句话带过的结算，而是约会的第二个完整章节。先在心中按四段安排节奏，但不要输出分段标题：承接玩家刚才的行动；并肩回程中的余波与观察；一轮新的交谈、小插曲或欲言又止；告别前的情绪落点与下次见面的可能。四段都要充分演出，每段至少贡献三页。';
  return [
    '这是“校园心动回忆”游戏的一次约会正文生成请求。请使用当前酒馆预设、角色卡和世界书的既有文风与角色知识来写作。',
    `游戏主角统一写成第二人称“你”，存档玩家姓名为“${plan.playerName}”；被邀约角色是“${plan.characterName}”。`,
    '游戏身份规则优先于预设中的原作默认关系：“你”是本作唯一男主。预设可以自然保留原作称呼；如果原作男主名字出现在说话人名牌位置，解析器会把它当作玩家名牌，不能把他写成约会中的独立第三名角色。',
    `本次主要说话人是：@旁白、@你、@${plan.characterName}。玩家台词写作 @你，渲染器会将名牌显示为存档玩家姓名。`,
    `保存的约会计划：角色=${plan.characterName}，日期=${plan.date.year}-${plan.date.month}-${plan.date.day}，地点=${stage.label}，质量=${plan.quality}。`,
    `当前阶段=${stageId}，场景=${stage.sceneId}。场景字段必须严格写 ${stage.sceneId}。`,
    `选项 ID 与关系结算由前端锁定，当前已选行动=${selectedOptionLabel ?? '尚未选择'}。你只按文末协议为当前三个已登记 ID 生成行动文案，不得改动 ID 或结算。`,
    relationshipContext
      ? `当前关系语境（只用于角色反应，不复述数值）：sub=${relationshipContext.sub}，hurt=${relationshipContext.hurt}；有向女生关系=${JSON.stringify(relationshipContext.girlRelations)}。`
      : '当前关系语境不可用，只按已保存约会计划和选项写作。',
    recentArchives.length > 0 ? `最近三次已采纳约会摘要：${recentArchives.join(' | ')}` : '没有已采纳约会摘要。',
    recentBody ? `最近一次已采纳正文：${recentBody}` : '没有上一段正文。',
    buildDatingPortraitContract(plan),
    '你现在是负责一整场可游玩约会章节的资深校园恋爱 GAL 编剧，不是梗概整理器。你有足够的角色理解力和场面调度能力，请把它真正用在完整演出上：理解事件不算完成，只有把人物如何靠近、犹豫、误会、回应和收束逐页写出来才算交稿。',
    '写作气质融合《出包王女》式明快校园恋爱喜剧与《心跳回忆》式细腻约会推进：用快速而自然的反应、无伤的小意外、距离突然拉近后的慌乱与轻松回收制造活力；同时保留地点观察、对话试探、停顿、情绪累积、关系微妙变化和可被记住的收尾意象。只借鉴这两类作品的类型节奏与体验，不完全复刻现成剧情或台词。',
    pacingGuide,
    '扩写时不要用一句旁白概括本可演出的过程，也不要让任何一方用长篇独白替代互动。每个关键转折至少展开为“环境或动作变化 -> 一方说话 -> 另一方即时反应 -> 两人关系或场面进入新状态”，让每一页都有新的动作、信息、情绪或笑点。达到目标后仍应把当前情绪完整收束，宁可自然超过目标，也不要贴着最低长度仓促结束。',
    '只写当前阶段的连续正文。只输出一个完整的 <content>...</content> 正文容器：响应第一行只能是 <content>，最后一行只能是 </content>；正文和三条选项都必须位于容器内，容器外不能有任何文字，也不能改用其他正文标签。不要输出 Markdown 代码围栏、标题、规划、JSON、关系数值、AP、费用、日期结算或协议外文字。',
    `正文内除最后三条选项外，每个非空行严格使用：@说话人【scene=场景ID;focus=角色ID或none;portrait=立绘ID或none;expression=表情ID或none;effect=none|flash|shake】：正文。${plan.characterName}本人发言或仍在画面中时必须使用 focus=${plan.characterId}，并在每一页重复填写对应 portrait；expression 由你根据当页情绪从该 portrait 的登记值中自行选择。只有真正没有邀约角色出镜的环境空镜才能写 focus=none，此时 portrait 和 expression 必须同时为 none。`,
    `正文必须充足：至少 ${DATING_STORY_PAGE_TARGET} 页、${DATING_STORY_CHARACTER_TARGET} 字实际正文。每页都要有新的叙事推进、动作、环境变化或角色反应，不能用重复句子凑字数。这个长度由你在本次回复中完成，不要输出字数统计。`,
    `输出前只在心中做一次编辑复核：正文是否至少 ${DATING_STORY_PAGE_TARGET} 页、${DATING_STORY_CHARACTER_TARGET} 字，四段是否都有实际推进，关键情绪是否都有前因、即时反应与回收，最后三项是否完整且协议正确。若内容偏短或某段只有概述，先在内部补写成可播放页面再提交；不要输出复核过程、规划或字数统计。`,
    `正文结束后必须在 <content> 容器内追加恰好三行 AI 文案选项，格式严格为：@选项【id=已登记选项ID】：玩家行动文案。当前阶段允许的 ID 只有：${stage.options.map(option => option.id).join('、')}。只能改写选项文案，不能新增、删除或改动 ID；不要添加 emoji、颜文字或其他字段；选项必须是具体行动，不得写关系数值、AP、费用或结算。三条选项必须是容器内最后三条内容，第三条后立即输出 </content>。`,
  ].join('\n');
}

export async function generateDatingStage(
  plan: DatingDirectorPlan,
  stageId: DatingStageId,
  options: {
    recentArchives?: readonly string[];
    recentBody?: string | null;
    selectedOptionLabel?: string | null;
    relationshipContext?: DatingGenerationRelationshipContext | null;
  } = {},
): Promise<DatingStageContent> {
  return runExclusiveStoryGeneration(DATING_GENERATION_ID, async () => {
    const api = getTavernGenerateApi();
    const prompt = createDatingGenerationPrompt(
      plan,
      stageId,
      options.recentArchives ?? [],
      options.recentBody ?? null,
      options.selectedOptionLabel ?? null,
      options.relationshipContext ?? null,
    );
    const generated = await api.generate({ user_input: prompt });
    if (typeof generated !== 'string') throw new Error('酒馆返回了工具调用，约会正文只接受文本回复。');
    const raw = generated;
    return parseDatingContent(raw, plan, stageId);
  });
}

export function validateDatingStoryCharacter(characterId: string): boolean {
  try {
    getStoryCharacter(characterId as Parameters<typeof getStoryCharacter>[0]);
    return true;
  } catch {
    return false;
  }
}
