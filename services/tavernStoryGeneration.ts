import {
  getMainStoryActIndex,
  getMainStoryActOrThrow,
  getMainStoryEpisodeOrThrow,
  getMainStoryLoreSelections,
  type MainStoryLoreSelection,
} from '../GalMainStory/storyRegistry';
import { getStoryCharacter, STORY_USER_ADDRESS_TAG } from '../GalMainStory/characters';
import { parseStoryParagraphs, type ParsedStoryLine } from '../GalMainStory/storyPresentation';
import { extractPlayableText } from '../GalMainStory/storyTextExtraction';
import {
  normalizeGalStoryActs,
  normalizeStoryChoiceOptions,
  STORY_AI_CHOICE_OPTION_COUNT,
  type GalStoryAct,
  type GalStoryFloor,
  type GalStoryFloorOutcome,
  type GalStoryMessageSave,
  type GalStoryMessageSource,
  type StoryChoiceDecision,
  type StoryPresentationCue,
  type StoryChoiceOptionDefinition,
} from '../GalMainStory/storyTypes';
import {
  assertStoryLoreTaggedBlock,
  readDisabledWorldbookStoryLores,
  replaceStoryLoreTaggedBlock,
  withStoryLoresForNextWorldInfoScan,
  type LoadedStoryLore,
} from '../data/storyLore';
import { useCardStore } from '../stores/cardStore';
import { createPlayerProfile } from '../stores/playerStore';
import { createSaveUuid } from '../save/uuid';
import type { PlayerProfile } from '../types';
import {
  createCurrentPlayerPersonaPromptPlan,
  createPlayerProfileSignature,
  PLAYER_PERSONA_INJECTION_VERSION,
  type StoredPlayerPersonaCarrier,
} from './playerPersona';
import { createStoryGenerationContextProjection } from './storyGenerationContext';
import { runExclusiveStoryGeneration } from './storyGenerationMutex';

export interface GenerateStoryActRequest {
  eventId: string;
  actId: string;
  floorId: string;
  playerProfile: Readonly<PlayerProfile>;
  day: number;
  period: string;
  location: string;
  contextFloorIds: string[];
  historyFloorIds?: string[];
  chatHistory: readonly GalStoryMessageSave[];
  previousChoiceDecisions?: readonly { actId: string; decision: StoryChoiceDecision }[];
}

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

export class StoryGenerationRequestError extends Error {
  readonly playerPersonaCarrier: StoredPlayerPersonaCarrier;

  constructor(message: string, playerPersonaCarrier: StoredPlayerPersonaCarrier, options?: ErrorOptions) {
    super(message, options);
    this.name = 'StoryGenerationRequestError';
    this.playerPersonaCarrier = playerPersonaCarrier;
  }
}

export function getStoryGenerationErrorPersonaCarrier(error: unknown): StoredPlayerPersonaCarrier {
  return error instanceof StoryGenerationRequestError ? error.playerPersonaCarrier : 'not-generated';
}

function getTavernGenerateApi(): Pick<Window['TavernHelper'], 'generate'> {
  const api = window.TavernHelper;
  if (!api || typeof api.generate !== 'function') {
    throw new Error('没有检测到 TavernHelper.generate，请在 SillyTavern 酒馆助手环境中重试。');
  }
  return api;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createStoryFloorId(eventId: string, actId: string): string {
  const episode = getMainStoryEpisodeOrThrow(eventId);
  const actIndex = getMainStoryActIndex(eventId, actId);
  if (actIndex < 0) throw new Error('主线幕 ID 无效。');
  return `tolove-ep${String(episode.episodeNumber).padStart(2, '0')}-act-${actIndex + 1}-${createSaveUuid()}`;
}

function createMessageId(floorId: string, role: 'user' | 'assistant'): string {
  return `${floorId}-${role}`;
}

export function createStoryMessagePair(request: BuildMessagePairRequest): GalStoryMessageSave[] {
  const act = getMainStoryActOrThrow(request.eventId, request.actId);
  const sendDate = new Date().toISOString();
  const outcome = request.outcome ?? 'accepted';
  const baseExtra = {
    type: 'tolove-main-story' as const,
    eventId: request.eventId,
    actId: act.id,
    source: request.source,
    floorId: request.floorId,
    period: request.period,
    location: request.location,
    day: request.day,
    playerName: request.playerProfile.displayName,
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
  const context = createStoryGenerationContextProjection(request);
  return createStoryMessagePair({
    ...request,
    userInput: context.userInput,
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
  playerPersonaCarrier: StoredPlayerPersonaCarrier = 'not-generated',
): GalStoryFloor {
  const actMeta = getMainStoryActOrThrow(request.eventId, request.actId);
  if (
    request.floorId.trim().length === 0 ||
    (outcome === 'accepted' ? act === null || error !== undefined : act !== null || !error?.trim()) ||
    (outcome === 'parse_error' && messages.length !== 2) ||
    (outcome === 'request_error' && messages.length !== 0)
  ) {
    throw new Error('剧情楼层结果与请求上下文不一致。');
  }
  const createdAt = messages.find(message => message.extra.role === 'assistant')?.send_date ?? new Date().toISOString();
  return {
    floorId: request.floorId,
    eventId: request.eventId,
    actId: actMeta.id,
    source,
    createdAt,
    outcome,
    act,
    context: {
      playerName: request.playerProfile.displayName,
      playerProfileSignature: createPlayerProfileSignature(request.playerProfile),
      playerPersonaInjectionVersion: PLAYER_PERSONA_INJECTION_VERSION,
      playerPersonaCarrier,
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

const GENERATED_CHOICE_PATTERN = /^@选项【index=([1-3])】：(.+)$/u;

function extractGeneratedChoices(
  lines: readonly string[],
  requiresChoices: boolean,
): { storyLines: string[]; choiceOptions?: StoryChoiceOptionDefinition[] } {
  const firstChoiceIndex = lines.findIndex(line => GENERATED_CHOICE_PATTERN.test(line));
  if (!requiresChoices) {
    if (firstChoiceIndex >= 0) throw new Error('当前幕没有登记玩家选择，AI 不应输出候选行动。');
    return { storyLines: [...lines] };
  }
  if (firstChoiceIndex < 0) throw new Error(`AI 没有在正文末尾输出 ${STORY_AI_CHOICE_OPTION_COUNT} 个候选行动。`);

  const storyLines = lines.slice(0, firstChoiceIndex);
  const choiceLines = lines.slice(firstChoiceIndex);
  if (choiceLines.length !== STORY_AI_CHOICE_OPTION_COUNT) {
    throw new Error(`AI 候选行动必须恰好为 ${STORY_AI_CHOICE_OPTION_COUNT} 条，并且位于正文最后。`);
  }
  const choiceOptions = choiceLines.map((line, optionIndex) => {
    const match = line.match(GENERATED_CHOICE_PATTERN);
    const expectedIndex = optionIndex + 1;
    if (!match || Number(match[1]) !== expectedIndex)
      throw new Error(`AI 候选行动 ${expectedIndex} 的编号或格式无效。`);
    const payload = match[2] ?? '';
    const separatorIndex = payload.indexOf('｜');
    if (separatorIndex <= 0 || payload.indexOf('｜', separatorIndex + 1) >= 0) {
      throw new Error(`AI 候选行动 ${expectedIndex} 必须用一个全角竖线分隔行动与微差分提示。`);
    }
    return {
      id: `ai-option-${expectedIndex}`,
      label: payload.slice(0, separatorIndex),
      continuityHint: payload.slice(separatorIndex + 1),
    };
  });
  return { storyLines, choiceOptions: normalizeStoryChoiceOptions(choiceOptions) };
}

export function parsePlainTextAct(raw: string, eventId: string, actId: string, playerName: string): GalStoryAct {
  const act = getMainStoryActOrThrow(eventId, actId);
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('酒馆没有返回本幕正文。');

  const playableText = extractPlayableText(trimmed);
  if (looksLikeJsonStory(playableText)) throw new Error('酒馆返回了JSON，当前剧情生成只接受逐行正文。');

  const lines = playableText
    .split(/\r?\n+/u)
    .map(line => line.trim())
    .filter(line => line && !/^#{1,6}\s/u.test(line));

  const { storyLines: paragraphs, choiceOptions } = extractGeneratedChoices(lines, Boolean(act.choice));

  if (paragraphs.length === 0) throw new Error('酒馆返回的本幕正文没有可播放段落。');

  const logicalLines = parseStoryParagraphs(paragraphs, {
    playerName,
    presentation: act.presentation,
  });
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

  return normalizeGalStoryActs([{ id: act.id, beats, ...(choiceOptions ? { choiceOptions } : {}) }], {
    expectedActIds: [act.id],
  })[0];
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
  const storyText = act.beats
    .map(beat => `@${beat.speaker ?? '旁白'}【${presentationToDirective(beat.presentation)}】：${beat.text}`)
    .join('\n');
  const choiceText = (act.choiceOptions ?? [])
    .map((option, index) => `@选项【index=${index + 1}】：${option.label}｜${option.continuityHint}`)
    .join('\n');
  return [storyText, choiceText].filter(Boolean).join('\n');
}

/**
 * Rewrites each character lore's `<称呼绑定>` block with the concrete addressing
 * line for the frozen player profile carried by this generation request.
 */
function applyUserAddressBindings(
  lores: readonly LoadedStoryLore[],
  selections: readonly MainStoryLoreSelection[],
  profile: Readonly<PlayerProfile>,
  affectionByCharacterId: ReadonlyMap<string, number>,
): void {
  lores.forEach((lore, index) => {
    const characterId = selections[index]?.characterId;
    if (!characterId) return;
    const buildBinding = getStoryCharacter(characterId).buildUserAddressBinding;
    if (!buildBinding) return;
    assertStoryLoreTaggedBlock(lore.content, STORY_USER_ADDRESS_TAG);
    const affection = affectionByCharacterId.get(characterId) ?? 0;
    lore.content = replaceStoryLoreTaggedBlock(
      lore.content,
      STORY_USER_ADDRESS_TAG,
      buildBinding({ familyName: profile.familyName, givenName: profile.givenName, affection }),
    );
  });
}

export async function generateStoryAct(request: GenerateStoryActRequest): Promise<GeneratedStoryAct> {
  return runExclusiveStoryGeneration(request.floorId, async () => {
    getMainStoryActOrThrow(request.eventId, request.actId);
    const normalizedProfile = createPlayerProfile({
      familyName: request.playerProfile.familyName,
      givenName: request.playerProfile.givenName,
      birthdayMonth: request.playerProfile.birthdayMonth,
      birthdayDay: request.playerProfile.birthdayDay,
      bloodType: request.playerProfile.bloodType,
      appearance: request.playerProfile.appearance,
      personality: request.playerProfile.personality,
    });
    if (createPlayerProfileSignature(normalizedProfile) !== createPlayerProfileSignature(request.playerProfile)) {
      throw new Error('剧情生成请求携带的玩家资料不是已登记的规范版本。');
    }
    const playerProfile = Object.freeze({ ...normalizedProfile });
    const frozenRequest: GenerateStoryActRequest = {
      ...request,
      playerProfile,
      contextFloorIds: [...request.contextFloorIds],
      ...(request.historyFloorIds ? { historyFloorIds: [...request.historyFloorIds] } : {}),
      chatHistory: [...request.chatHistory],
      ...(request.previousChoiceDecisions
        ? {
            previousChoiceDecisions: request.previousChoiceDecisions.map(saved => ({
              actId: saved.actId,
              decision: { ...saved.decision },
            })),
          }
        : {}),
    };
    const api = getTavernGenerateApi();
    const personaPlan = createCurrentPlayerPersonaPromptPlan(playerProfile);
    const affectionByCharacterId = new Map(
      useCardStore.getState().targets.map(target => [target.id, target.affection] as const),
    );
    const generationContext = createStoryGenerationContextProjection(frozenRequest);
    const userInput = generationContext.userInput;
    const loreSelections = getMainStoryLoreSelections(frozenRequest.eventId, frozenRequest.actId);
    const selectedLores = await readDisabledWorldbookStoryLores(loreSelections.map(selection => selection.reference));
    applyUserAddressBindings(selectedLores, loreSelections, playerProfile, affectionByCharacterId);
    let result: Awaited<ReturnType<typeof api.generate>>;
    try {
      // The save profile belongs to this generation request; the selected host Persona must remain untouched.
      result = await withStoryLoresForNextWorldInfoScan(selectedLores, { excludePersonaLore: true }, () =>
        api.generate({
          preset_name: 'in_use',
          generation_id: frozenRequest.floorId,
          user_input: userInput,
          max_chat_history: generationContext.maxChatHistory,
          should_stream: false,
          should_silence: false,
          overrides: {
            persona_description: personaPlan.personaDescriptionOverride,
            chat_history: {
              with_depth_entries: true,
              prompts: generationContext.chatHistory,
            },
          },
          injects: personaPlan.injections,
        }),
      );
    } catch (error) {
      throw new StoryGenerationRequestError(getErrorMessage(error), personaPlan.carrier, { cause: error });
    }

    if (typeof result !== 'string') {
      throw new StoryGenerationRequestError('酒馆返回了工具调用，当前剧情生成只接受正文文本。', personaPlan.carrier);
    }
    try {
      const playableText = extractPlayableText(result, { requirePlayableWrapper: true });
      const parsedAct = parsePlainTextAct(
        playableText,
        frozenRequest.eventId,
        frozenRequest.actId,
        playerProfile.displayName,
      );
      const messages = createStoryMessagePair({
        ...frozenRequest,
        userInput,
        assistantText: result,
        source: 'tavern',
        outcome: 'accepted',
      });
      return {
        ok: true,
        act: parsedAct,
        floor: createStoryFloor(
          frozenRequest,
          parsedAct,
          'tavern',
          messages,
          'accepted',
          undefined,
          personaPlan.carrier,
        ),
        messages,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      const messages = createStoryMessagePair({
        ...frozenRequest,
        userInput,
        assistantText: result,
        source: 'tavern',
        outcome: 'parse_error',
        error: message,
      });
      return {
        ok: false,
        error: message,
        floor: createStoryFloor(frozenRequest, null, 'tavern', messages, 'parse_error', message, personaPlan.carrier),
        messages,
      };
    }
  });
}
