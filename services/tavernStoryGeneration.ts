import {
  EPISODE_01_ACTS,
  EPISODE_01_EVENT_ID,
  EPISODE_01_STORY,
  getEpisode01LoreReferences,
} from '../GalMainStory/episodes/episode01';
import { getStoryCharacter, getStoryPortraitRig, isStoryCharacterId } from '../GalMainStory/characters';
import { parseStoryParagraphs, type ParsedStoryLine } from '../GalMainStory/storyPresentation';
import { extractPlayableText } from '../GalMainStory/storyTextExtraction';
import {
  normalizeGalStoryActs,
  type GalStoryAct,
  type GalStoryFloor,
  type GalStoryFloorOutcome,
  type GalStoryMessageSave,
  type GalStoryMessageSource,
  type MainStoryEntryReason,
  type StoryActDefinition,
  type StoryPresentationCue,
} from '../GalMainStory/storyTypes';
import { armStoryLoresForNextWorldInfoScan, readDisabledWorldbookStoryLores } from '../data/storyLore';
import { createSaveUuid } from '../save/uuid';
import { buildStoryGenerationPrompt, type StoryPromptPortraitOption } from './storyGenerationPrompt';

export interface GenerateStoryActRequest {
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

interface BuildMessagePairRequest extends GenerateStoryActRequest {
  userInput: string;
  assistantText: string;
  source: GalStoryMessageSource;
  outcome?: 'accepted' | 'parse_error';
  error?: string;
}

interface AcceptedStoryAct {
  ok: true;
  act: GalStoryAct;
  floor: GalStoryFloor;
  messages: GalStoryMessageSave[];
}

interface RejectedStoryAct {
  ok: false;
  error: string;
  floor: GalStoryFloor;
  messages: GalStoryMessageSave[];
}

export type GeneratedStoryAct = AcceptedStoryAct | RejectedStoryAct;

function getTavernGenerateApi(): Pick<Window['TavernHelper'], 'generate'> {
  const api = window.TavernHelper;
  if (!api || typeof api.generate !== 'function') {
    throw new Error('没有检测到 TavernHelper.generate，请在 SillyTavern 酒馆助手环境中重试。');
  }
  return api;
}

function getActPortraitOptions(actIndex: number): StoryPromptPortraitOption[] {
  const act = EPISODE_01_ACTS[actIndex];
  if (!act) throw new Error('第一集幕编号无效。');

  return act.presentation.cast.flatMap(member => {
    const characterId = member.characterId;
    if (!isStoryCharacterId(characterId)) throw new Error(`当前幕引用了未登记角色“${characterId}”。`);
    const character = getStoryCharacter(characterId);
    return member.portraitIds.map(portraitId => {
      const rig = getStoryPortraitRig(characterId, portraitId);
      return {
        characterId,
        displayName: character.displayName,
        portraitId,
        expressionIds: Object.keys(rig.expressions),
      };
    });
  });
}

function buildGenerationPrompt(request: GenerateStoryActRequest): string {
  const act: StoryActDefinition | undefined = EPISODE_01_ACTS[request.actIndex];
  if (!act) throw new Error('第一集幕编号无效。');

  return buildStoryGenerationPrompt({
    eventTitle: EPISODE_01_STORY.title,
    loreSection: act.loreSection,
    sceneIds: act.presentation.sceneIds,
    minimumLineCount: act.generation.minimumLineCount,
    requiredSceneSequence: act.generation.requiredSceneSequence,
    portraitOptions: getActPortraitOptions(request.actIndex),
    portraitRules: act.presentation.portraitRules ?? [],
    continuityMode: request.contextFloorIds.length > 0 ? 'continue' : 'fresh',
  });
}

function buildGenerationChatHistory(
  messages: readonly GalStoryMessageSave[],
  contextFloorIds: readonly string[],
): RolePrompt[] {
  const floorOrder = new Map(contextFloorIds.map((floorId, index) => [floorId, index]));
  return messages
    .filter(
      message =>
        message.extra.type === 'tolove-main-story' &&
        message.extra.eventId === EPISODE_01_EVENT_ID &&
        floorOrder.has(message.extra.floorId ?? message.extra.generationId) &&
        !message.is_system &&
        message.mes.trim().length > 0,
    )
    .sort((left, right) => {
      const leftOrder = floorOrder.get(left.extra.floorId ?? left.extra.generationId) ?? 0;
      const rightOrder = floorOrder.get(right.extra.floorId ?? right.extra.generationId) ?? 0;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return left.extra.role === right.extra.role ? 0 : left.extra.role === 'user' ? -1 : 1;
    })
    .slice(-STORY_CHAT_HISTORY_LIMIT)
    .map(message => ({
      role: message.extra.role,
      content: message.mes,
    }));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createStoryFloorId(actIndex: number): string {
  return `tolove-ep01-act-${actIndex + 1}-${createSaveUuid()}`;
}

function createMessageId(floorId: string, role: 'user' | 'assistant'): string {
  return `${floorId}-${role}`;
}

export function createStoryMessagePair(request: BuildMessagePairRequest): GalStoryMessageSave[] {
  const act = EPISODE_01_ACTS[request.actIndex];
  if (!act) throw new Error('第一集幕编号无效。');
  const sendDate = new Date().toISOString();
  const outcome = request.outcome ?? 'accepted';
  const baseExtra = {
    type: 'tolove-main-story' as const,
    eventId: EPISODE_01_EVENT_ID,
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

export function createFallbackStoryMessages(
  request: GenerateStoryActRequest,
  assistantText: string,
): GalStoryMessageSave[] {
  return createStoryMessagePair({
    ...request,
    userInput: buildGenerationPrompt(request),
    assistantText,
    source: 'fallback',
  });
}

export function createStoryFloor(
  request: GenerateStoryActRequest,
  act: GalStoryAct | null,
  source: GalStoryMessageSource,
  messages: readonly GalStoryMessageSave[],
  outcome: GalStoryFloorOutcome,
  error?: string,
): GalStoryFloor {
  const actMeta = EPISODE_01_ACTS[request.actIndex];
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
    eventId: EPISODE_01_EVENT_ID,
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
  return splitLongParagraph(line.text).map(text => ({
    ...line,
    text,
    presentation: { ...line.presentation },
  }));
}

function looksLikeJsonStory(text: string): boolean {
  const trimmed = text.trimStart();
  return (
    (trimmed.startsWith('[') || trimmed.startsWith('{')) &&
    /"(?:speaker|text|beats|dialogue|narration|story)"\s*:/iu.test(trimmed)
  );
}

function parsePlainTextAct(raw: string, actIndex: number, playerName: string): GalStoryAct {
  const act = EPISODE_01_ACTS[actIndex];
  if (!act) throw new Error('第一集幕编号无效。');
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('酒馆没有返回本幕正文。');

  const playableText = extractPlayableText(trimmed);
  if (looksLikeJsonStory(playableText)) throw new Error('酒馆返回了JSON，当前剧情生成只接受逐行正文。');

  const paragraphs = playableText
    .split(/\r?\n+/u)
    .map(line => line.trim())
    .filter(line => line && !/^#{1,6}\s/u.test(line));

  if (paragraphs.length === 0) throw new Error('酒馆返回的本幕正文没有可播放段落。');

  const logicalLines = parseStoryParagraphs(paragraphs, {
    playerName,
    presentation: act.presentation,
  });
  if (!logicalLines.some(line => line.speaker !== null)) throw new Error('酒馆返回的正文没有角色对白。');
  if (logicalLines.length < act.generation.minimumLineCount) {
    throw new Error(`本幕只有 ${logicalLines.length} 行正文，至少需要 ${act.generation.minimumLineCount} 行。`);
  }

  let sceneCursor = -1;
  for (const requiredSceneId of act.generation.requiredSceneSequence) {
    const nextSceneIndex = logicalLines.findIndex(
      (line, lineIndex) => lineIndex > sceneCursor && line.presentation.sceneId === requiredSceneId,
    );
    if (nextSceneIndex < 0) {
      throw new Error(`本幕没有按顺序走完场景“${requiredSceneId}”，正文仍不完整。`);
    }
    sceneCursor = nextSceneIndex;
  }

  const beats = logicalLines.flatMap(splitParsedStoryLine).map(line => ({
    speaker: line.speaker,
    text: line.text,
    presentation: { ...line.presentation },
  }));

  return normalizeGalStoryActs([{ id: act.id, beats }], { expectedActIds: [act.id] })[0];
}

function presentationToDirective(presentation: StoryPresentationCue): string {
  return [
    `scene=${presentation.sceneId}`,
    `focus=${presentation.focusCharacterId ?? 'none'}`,
    `portrait=${presentation.portraitId ?? 'none'}`,
    `expression=${presentation.expressionId ?? 'none'}`,
    `effect=${presentation.effect}`,
  ].join(';');
}

export function actToPlainText(act: GalStoryAct): string {
  return act.beats
    .map(beat => `@${beat.speaker ?? '旁白'}【${presentationToDirective(beat.presentation)}】：${beat.text}`)
    .join('\n');
}

export async function generateStoryAct(request: GenerateStoryActRequest): Promise<GeneratedStoryAct> {
  const act = EPISODE_01_ACTS[request.actIndex];
  if (!act) throw new Error('第一集幕编号无效。');
  const api = getTavernGenerateApi();
  const userInput = buildGenerationPrompt(request);
  const selectedLores = await readDisabledWorldbookStoryLores(getEpisode01LoreReferences(request.actIndex));
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
          prompts: buildGenerationChatHistory(request.chatHistory, request.contextFloorIds),
        },
      },
    });
  } finally {
    stopWorldInfoScanHook();
  }

  if (typeof result !== 'string') throw new Error('酒馆返回了工具调用，当前剧情生成只接受正文文本。');
  try {
    const playableText = extractPlayableText(result);
    const parsedAct = parsePlainTextAct(playableText, request.actIndex, request.playerName);
    const messages = createStoryMessagePair({
      ...request,
      userInput,
      assistantText: result,
      source: 'tavern',
      outcome: 'accepted',
    });
    return {
      ok: true,
      act: parsedAct,
      floor: createStoryFloor(request, parsedAct, 'tavern', messages, 'accepted'),
      messages,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    const messages = createStoryMessagePair({
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
      floor: createStoryFloor(request, null, 'tavern', messages, 'parse_error', message),
      messages,
    };
  }
}
