import {
  LALA_ARRIVAL_ACTS,
  LALA_ARRIVAL_ALLOWED_SPEAKERS,
  LALA_ARRIVAL_EVENT_ID,
  LALA_ARRIVAL_STORY,
  getLalaArrivalLoreReferences,
} from '../GalMainStory/lalaArrival';
import {
  assignLalaPortraitExpressions,
  parseStoryParagraphs,
  STORY_MOOD_EXAMPLES,
  type ParsedStoryLine,
} from '../GalMainStory/storyPresentation';
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
import { armStoryLoresForNextWorldInfoScan, readDisabledWorldbookStoryLores } from '../data/storyLore';
import { createSaveUuid } from '../save/uuid';
import { buildStoryGenerationPrompt } from './storyGenerationPrompt';

export interface GenerateLalaArrivalActRequest {
  floorId: string;
  actIndex: number;
  entryReason: MainStoryEntryReason;
  playerName: string;
  day: number;
  period: string;
  location: string;
  contextFloorIds: string[];
  chatHistory: readonly GalStoryMessageSave[];
}

const STORY_CHAT_HISTORY_LIMIT = 6;

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

function getTavernGenerateApi(): Pick<Window['TavernHelper'], 'generate'> {
  const api = window.TavernHelper;
  if (!api || typeof api.generate !== 'function') {
    throw new Error('没有检测到 TavernHelper.generate，请在 SillyTavern 酒馆助手环境中重试。');
  }
  return api;
}

function buildGenerationPrompt(request: GenerateLalaArrivalActRequest): string {
  const act = LALA_ARRIVAL_ACTS[request.actIndex];
  if (!act) throw new Error('第一集幕编号无效。');

  return buildStoryGenerationPrompt({
    eventTitle: LALA_ARRIVAL_STORY.title,
    stageTitle: act.title,
    stageOpening: act.opening,
    stageEnding: act.ending,
    allowedSpeakers: LALA_ARRIVAL_ALLOWED_SPEAKERS,
    moodExamples: STORY_MOOD_EXAMPLES,
  });
}

function buildGenerationChatHistory(messages: readonly GalStoryMessageSave[], currentActIndex: number): RolePrompt[] {
  return messages
    .filter(
      message =>
        message.extra.type === 'tolove-main-story' &&
        message.extra.eventId === LALA_ARRIVAL_EVENT_ID &&
        message.extra.actIndex <= currentActIndex &&
        !message.is_system &&
        message.mes.trim().length > 0,
    )
    .slice(-STORY_CHAT_HISTORY_LIMIT)
    .map(message => ({
      role: message.extra.role,
      content: message.mes,
    }));
}

function stripLegacyCompletionSentinels(raw: string): string {
  return raw.replace(/\[\[STAGE_COMPLETE:[^\r\n]*?\]\]/gu, '').trim();
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

function splitParsedStoryLine(line: ParsedStoryLine): ParsedStoryLine[] {
  return splitLongParagraph(line.text).map(text => ({ ...line, text }));
}

function looksLikeJsonStory(text: string): boolean {
  const trimmed = text.trimStart();
  return (
    (trimmed.startsWith('[') || trimmed.startsWith('{')) &&
    /"(?:speaker|text|beats|dialogue|narration|story)"\s*:/iu.test(trimmed)
  );
}

function getBackground(actIndex: number, pageIndex: number, pageCount: number): StoryBackgroundId {
  const presentation = LALA_ARRIVAL_ACTS[actIndex]?.presentation;
  if (!presentation) return 'school';
  const progress = pageCount <= 1 ? 0 : pageIndex / (pageCount - 1);
  return presentation.transitions.reduce<StoryBackgroundId>(
    (background, transition) => (progress >= transition.atProgress ? transition.background : background),
    presentation.initialBackground,
  );
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

  const playableText = extractPlayableText(trimmed);
  if (looksLikeJsonStory(playableText)) throw new Error('酒馆返回了JSON，当前剧情生成只接受逐行正文。');

  const paragraphs = playableText
    .split(/\r?\n+/u)
    .map(line => line.trim())
    .filter(line => line && !/^#{1,6}\s/u.test(line) && !/^第[一二1-2]幕(?:[：:]|\s|$)/u.test(line));

  if (paragraphs.length === 0) {
    throw new Error('酒馆返回的本幕正文没有可播放段落。');
  }

  const untaggedLineIndex = paragraphs.findIndex(line => !line.startsWith('@'));
  if (untaggedLineIndex >= 0) {
    throw new Error(`酒馆返回正文的第 ${untaggedLineIndex + 1} 行缺少 @旁白 或 @说话人 标签。`);
  }

  const logicalLines = parseStoryParagraphs(paragraphs, playerName);
  if (!logicalLines.some(line => line.speaker !== null)) throw new Error('酒馆返回的正文没有可识别的角色对白。');

  const parsedLines = logicalLines.flatMap(splitParsedStoryLine);
  const lalaExpressions = assignLalaPortraitExpressions(parsedLines, actIndex);
  const beats = parsedLines.map((line, pageIndex) => {
    return {
      speaker: line.speaker,
      text: line.text,
      lalaExpression: lalaExpressions[pageIndex],
      background: getBackground(actIndex, pageIndex, parsedLines.length),
      effect: getEffect(line.text),
    };
  });

  return normalizeGalStoryActs([{ id: act.id, beats }], {
    expectedActIds: [act.id],
  })[0];
}

export function actToPlainText(act: GalStoryAct): string {
  return act.beats.map(beat => (beat.speaker ? `@${beat.speaker}：${beat.text}` : `@旁白：${beat.text}`)).join('\n');
}

export async function generateLalaArrivalAct(request: GenerateLalaArrivalActRequest): Promise<GeneratedLalaArrivalAct> {
  const act = LALA_ARRIVAL_ACTS[request.actIndex];
  if (!act) throw new Error('第一集幕编号无效。');
  const api = getTavernGenerateApi();
  const userInput = buildGenerationPrompt(request);
  const selectedLores = await readDisabledWorldbookStoryLores(getLalaArrivalLoreReferences(request.actIndex));
  const stopWorldInfoScanHook = armStoryLoresForNextWorldInfoScan(selectedLores);
  let result: Awaited<ReturnType<typeof api.generate>>;
  try {
    result = await api.generate({
      preset_name: 'in_use',
      generation_id: request.floorId,
      user_input: userInput,
      max_chat_history: STORY_CHAT_HISTORY_LIMIT,
      should_stream: false,
      should_silence: false,
      overrides: {
        chat_history: {
          with_depth_entries: true,
          prompts: buildGenerationChatHistory(request.chatHistory, request.actIndex),
        },
      },
    });
  } finally {
    stopWorldInfoScanHook();
  }

  if (typeof result !== 'string') throw new Error('酒馆返回了工具调用，当前剧情生成只接受正文文本。');
  try {
    const playableText = extractPlayableText(stripLegacyCompletionSentinels(result));
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
