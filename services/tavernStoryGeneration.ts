import episodeLore from '../data/lore-books/tolove-tv-episode-01.txt?raw';
import lalaLore from '../data/lore-books/lala-satalin-deviluke.txt?raw';
import rikoLore from '../data/lore-books/riko-yuzaki.txt?raw';
import { buildWorldbookScanTokens } from '../data/worldbook';
import { LALA_ARRIVAL_ACTS, LALA_ARRIVAL_ALLOWED_SPEAKERS, LALA_ARRIVAL_EVENT_ID } from '../GalMainStory/lalaArrival';
import { assignLalaPortraitExpressions, parseStoryLine, STORY_MOOD_LABELS } from '../GalMainStory/storyPresentation';
import { extractPlayableText } from '../GalMainStory/storyTextExtraction';
import {
  normalizeGalStoryActs,
  type GalStoryAct,
  type GalStoryFloor,
  type GalStoryFloorOutcome,
  type GalStoryMessageSave,
  type GalStoryMessageSource,
  type MainStoryEntryReason,
  type StoryBackgroundId,
  type StoryEffect,
} from '../GalMainStory/storyTypes';
import { createSaveUuid } from '../save/uuid';

export interface GenerateLalaArrivalActRequest {
  floorId: string;
  actIndex: number;
  entryReason: MainStoryEntryReason;
  playerName: string;
  day: number;
  period: string;
  location: string;
  storyHistory: GalStoryAct[];
  contextFloorIds: string[];
}

interface BuildMessagePairRequest extends GenerateLalaArrivalActRequest {
  userInput: string;
  assistantText: string;
  source: GalStoryMessageSource;
  outcome?: 'accepted' | 'parse_error';
  error?: string;
}

interface AcceptedLalaArrivalAct {
  ok: true;
  act: GalStoryAct;
  floor: GalStoryFloor;
  messages: GalStoryMessageSave[];
}

interface RejectedLalaArrivalAct {
  ok: false;
  error: string;
  floor: GalStoryFloor;
  messages: GalStoryMessageSave[];
}

export type GeneratedLalaArrivalAct = AcceptedLalaArrivalAct | RejectedLalaArrivalAct;

const ACT_REQUIREMENTS = [
  'User在第一次自由行动后进入放学后；旧校舍天台上，春菜正要说出关键话语，User也差点告白，但坠落白光打断两人。结尾推进到User回家打开浴室门，白光先一步填满视线。',
  'User在第二次自由行动后进入晚上；从浴室白光承接菈菈随机传送登场，随后亲卫队与萨斯丁追来，User维护菈菈自己选择人生的权利，最后推进到次日春菜询问、User告白被菈菈误接并宣布婚约。',
] as const;

const ACT_CHARACTER_IDS = [
  ['haruna', 'riko'],
  ['haruna', 'lala', 'riko', 'peke', 'sastin'],
] as const;

function getTavernGenerateApi(): Pick<Window['TavernHelper'], 'generate'> {
  const api = window.TavernHelper;
  if (!api || typeof api.generate !== 'function') {
    throw new Error('没有检测到 TavernHelper.generate，请在 SillyTavern 酒馆助手环境中重试。');
  }
  return api;
}

function normalizePlayerName(name: string): string {
  return (
    name
      .normalize('NFKC')
      .replace(/[\r\n]/gu, ' ')
      .trim()
      .slice(0, 40) || '主角'
  );
}

function getEntryInstruction(entryReason: MainStoryEntryReason): string {
  return entryReason === 'after_first_action'
    ? '这是第一次自由行动后的自动主线插入；不要让User主动点击告白按钮，剧情自然转入放学后的天台。'
    : '这是第二次自由行动后的自动主线插入；承接上一幕浴室白光，不要重新讲天台坠落。';
}

function buildGenerationPrompt(request: GenerateLalaArrivalActRequest): string {
  const act = LALA_ARRIVAL_ACTS[request.actIndex];
  if (!act) throw new Error('第一集幕编号无效。');

  return `
为校园恋爱游戏写《To LOVE-Ru》第一集第${request.actIndex + 1}幕“${act.title}”的可直接播放正文。

本幕事实：
- ${ACT_REQUIREMENTS[request.actIndex]}
- 玩家是User，界面称“你”，当前游戏名“${normalizePlayerName(request.playerName)}”。不要创造女性User，不补外貌、家庭或过去。
- 夕崎梨子是独立同学和可发展关系角色，不是User，不替User经历浴室初遇、保护菈菈、误告白或婚约。
- ${getEntryInstruction(request.entryReason)}
- 游戏代码负责行动、好感、日期和事件完成，正文不要提这些系统。

写法：
- 只写本幕正文，不要JSON，不要标题、幕名、说明、总结、Markdown或代码围栏。
- 每个自然段单独一行，共8到14行；一行就是GAL的一页，控制在180字内。
- 叙述行直接写画面，不加“旁白”标签。对白严格写成“角色名【情绪】：台词”。
- 角色名只可用：${LALA_ARRIVAL_ALLOWED_SPEAKERS.join('、')}。玩家对白永远标“你”，不要写User、主角或玩家名；菈菈永远写“菈菈”，不要写拉拉、Lala或ララ。
- 情绪只可用：${STORY_MOOD_LABELS.join('、')}。情绪只是前端选择现有立绘的提示，不要写素材字母、文件名或路径。
- 格式示例：“菈菈【开心】：传送成功！”、“你【紧张】：等一下！”；不要把示例内容复制进本幕。
- 用快速切镜、具体动作、拟声、空间错位和逐级升级的事故喜剧表现《To LOVE-Ru》的动画感；不要复刻原台词。
- 不写露骨身体细节，不用“命运的齿轮”等泛同人套话，不输出规划过程。
`.trim();
}

function buildStoryContext(storyHistory: GalStoryAct[], actIndex: number): string | null {
  const acceptedActs = storyHistory.slice(0, actIndex).filter((act): act is GalStoryAct => Boolean(act));
  if (acceptedActs.length === 0) return null;

  const transcript = acceptedActs
    .map(
      (act, index) =>
        `<accepted_story act_index="${index}" act_id="${act.id}">\n${actToPlainText(act)}\n</accepted_story>`,
    )
    .join('\n\n');

  return `
以下是当前存档已经采用并播放过的 GAL 正文，只用于保持人物、事件和叙事连续性。不要复述标签或整段旧正文。

<accepted_story_history>
${transcript}
</accepted_story_history>
  `.trim();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createLalaArrivalFloorId(actIndex: number): string {
  return `tolove-ep01-act-${actIndex + 1}-${createSaveUuid()}`;
}

function createMessageId(floorId: string, role: 'user' | 'assistant'): string {
  return `${floorId}-${role}`;
}

export function createLalaArrivalMessagePair(request: BuildMessagePairRequest): GalStoryMessageSave[] {
  const act = LALA_ARRIVAL_ACTS[request.actIndex];
  if (!act) throw new Error('第一集幕编号无效。');
  const sendDate = new Date().toISOString();
  const outcome = request.outcome ?? 'accepted';
  const baseExtra = {
    type: 'tolove-main-story' as const,
    eventId: LALA_ARRIVAL_EVENT_ID,
    actIndex: request.actIndex,
    actId: act.id,
    entryReason: request.entryReason,
    source: request.source,
    generationId: request.floorId,
    floorId: request.floorId,
    period: request.period,
    location: request.location,
    day: request.day,
    playerName: request.playerName,
    contextFloorIds: [...request.contextFloorIds],
    outcome,
    ...(request.error ? { error: request.error } : {}),
  };

  return [
    {
      id: createMessageId(request.floorId, 'user'),
      name: 'User',
      is_user: true,
      is_system: false,
      mes: request.userInput,
      send_date: sendDate,
      extra: { ...baseExtra, role: 'user', renderable: false },
    },
    {
      id: createMessageId(request.floorId, 'assistant'),
      name: 'Assistant',
      is_user: false,
      is_system: false,
      mes: request.assistantText,
      send_date: sendDate,
      extra: { ...baseExtra, role: 'assistant', renderable: outcome === 'accepted' },
    },
  ];
}

export function createFallbackLalaArrivalMessages(
  request: GenerateLalaArrivalActRequest,
  assistantText: string,
): GalStoryMessageSave[] {
  return createLalaArrivalMessagePair({
    ...request,
    userInput: buildGenerationPrompt(request),
    assistantText,
    source: 'fallback',
  });
}

export function createLalaArrivalFloor(
  request: GenerateLalaArrivalActRequest,
  act: GalStoryAct | null,
  source: GalStoryMessageSource,
  messages: readonly GalStoryMessageSave[],
  outcome: GalStoryFloorOutcome,
  error?: string,
): GalStoryFloor {
  const actMeta = LALA_ARRIVAL_ACTS[request.actIndex];
  if (!actMeta) throw new Error('第一集幕编号无效。');
  if (
    request.floorId.trim().length === 0 ||
    request.contextFloorIds.length !== request.actIndex ||
    (outcome === 'accepted' ? act === null || error !== undefined : act !== null || !error?.trim()) ||
    (outcome === 'parse_error' && messages.length !== 2) ||
    (outcome === 'request_error' && messages.length !== 0)
  ) {
    throw new Error('剧情楼层结果与请求上下文不一致。');
  }
  const createdAt = messages.find(message => message.extra.role === 'assistant')?.send_date ?? new Date().toISOString();
  return {
    floorId: request.floorId,
    eventId: LALA_ARRIVAL_EVENT_ID,
    actIndex: request.actIndex,
    actId: actMeta.id,
    source,
    createdAt,
    outcome,
    act,
    context: {
      entryReason: request.entryReason,
      playerName: request.playerName,
      day: request.day,
      period: request.period,
      location: request.location,
    },
    contextFloorIds: [...request.contextFloorIds],
    messageIds: messages.map(message => message.id),
    ...(error ? { error } : {}),
  };
}

function splitLongParagraph(text: string): string[] {
  if (text.length <= 180) return [text];
  const sentences = text.match(/[^。！？!?]+[。！？!?]?/gu)?.filter(Boolean) ?? [text];
  const pages: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (current && current.length + sentence.length > 180) {
      pages.push(current);
      current = '';
    }
    if (sentence.length > 180) {
      if (current) pages.push(current);
      for (let index = 0; index < sentence.length; index += 180) pages.push(sentence.slice(index, index + 180));
      current = '';
    } else {
      current += sentence;
    }
  }
  if (current) pages.push(current);
  return pages;
}

function getBackground(actIndex: number, pageIndex: number): StoryBackgroundId {
  if (actIndex === 0) return pageIndex >= 9 ? 'night' : 'school';
  if (actIndex === 1) return pageIndex >= 10 ? 'school' : 'night';
  return 'school';
}

function getEffect(text: string): StoryEffect {
  if (/白光|闪|爆|轰|砰|炸/gu.test(text)) return 'flash';
  if (/撞|震|摇|追|冲|卷|吸|坠|跌/gu.test(text)) return 'shake';
  return 'none';
}

function parsePlainTextAct(raw: string, actIndex: number, playerName: string): GalStoryAct {
  const act = LALA_ARRIVAL_ACTS[actIndex];
  if (!act) throw new Error('第一集幕编号无效。');
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('酒馆没有返回本幕正文。');

  const paragraphs = extractPlayableText(trimmed)
    .split(/\r?\n+/u)
    .map(line => line.trim())
    .filter(line => line && !/^#{1,6}\s/u.test(line) && !/^第[一二1-2]幕(?:[：:]|\s|$)/u.test(line))
    .flatMap(splitLongParagraph);

  if (paragraphs.length === 0) {
    throw new Error('酒馆返回的本幕正文没有可播放段落。');
  }

  const parsedLines = paragraphs.map(paragraph => parseStoryLine(paragraph, playerName));
  const lalaExpressions = assignLalaPortraitExpressions(parsedLines, actIndex);
  const beats = parsedLines.map((line, pageIndex) => {
    return {
      speaker: line.speaker,
      text: line.text,
      lalaExpression: lalaExpressions[pageIndex],
      background: getBackground(actIndex, pageIndex),
      effect: getEffect(line.text),
    };
  });

  return normalizeGalStoryActs([{ id: act.id, beats }], {
    expectedActIds: [act.id],
    allowedSpeakers: LALA_ARRIVAL_ALLOWED_SPEAKERS,
  })[0];
}

export function actToPlainText(act: GalStoryAct): string {
  return act.beats.map(beat => (beat.speaker ? `${beat.speaker}：${beat.text}` : beat.text)).join('\n');
}

export async function generateLalaArrivalAct(request: GenerateLalaArrivalActRequest): Promise<GeneratedLalaArrivalAct> {
  const act = LALA_ARRIVAL_ACTS[request.actIndex];
  if (!act) throw new Error('第一集幕编号无效。');
  const api = getTavernGenerateApi();
  const scanTokens = buildWorldbookScanTokens({
    day: request.day,
    period: request.period,
    location: request.location,
    characterIds: ACT_CHARACTER_IDS[request.actIndex],
  });
  const userInput = buildGenerationPrompt(request);
  const messageContext = buildStoryContext(request.storyHistory, request.actIndex);
  const result = await api.generate({
    preset_name: 'in_use',
    generation_id: request.floorId,
    user_input: userInput,
    max_chat_history: 0,
    should_stream: false,
    should_silence: false,
    injects: [
      {
        position: 'none',
        depth: 0,
        role: 'system',
        content: scanTokens.join('\n'),
        should_scan: true,
      },
      {
        position: 'in_chat',
        depth: 0,
        role: 'system',
        content: [episodeLore, lalaLore, rikoLore].join('\n\n'),
        should_scan: false,
      },
      ...(messageContext
        ? [
            {
              position: 'in_chat' as const,
              depth: 1,
              role: 'system' as const,
              content: messageContext,
              should_scan: false,
            },
          ]
        : []),
    ],
  });

  if (typeof result !== 'string') throw new Error('酒馆返回了工具调用，当前剧情生成只接受正文文本。');
  const playableText = extractPlayableText(result);
  try {
    const parsedAct = parsePlainTextAct(playableText, request.actIndex, request.playerName);
    const messages = createLalaArrivalMessagePair({
      ...request,
      userInput,
      assistantText: result,
      source: 'tavern',
      outcome: 'accepted',
    });
    return {
      ok: true,
      act: parsedAct,
      floor: createLalaArrivalFloor(request, parsedAct, 'tavern', messages, 'accepted'),
      messages,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    const messages = createLalaArrivalMessagePair({
      ...request,
      userInput,
      assistantText: result,
      source: 'tavern',
      outcome: 'parse_error',
      error: message,
    });
    return {
      ok: false,
      error: message,
      floor: createLalaArrivalFloor(request, null, 'tavern', messages, 'parse_error', message),
      messages,
    };
  }
}
