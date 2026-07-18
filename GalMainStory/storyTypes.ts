export const LALA_EXPRESSIONS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;
export const STORY_BACKGROUNDS = ['school', 'night'] as const;
export const STORY_EFFECTS = ['none', 'flash', 'shake'] as const;

export type LalaExpression = (typeof LALA_EXPRESSIONS)[number];
export type StoryBackgroundId = (typeof STORY_BACKGROUNDS)[number];
export type StoryEffect = (typeof STORY_EFFECTS)[number];
export type MainStoryEntryReason = 'after_first_action' | 'after_second_action';
export type StoryGenerationStatus = 'idle' | 'loading' | 'ready' | 'error';
export type StoryGenerationSource = 'tavern' | 'fallback';
export type GalStoryMessageOutcome = 'accepted' | 'parse_error';
export type GalStoryFloorOutcome = GalStoryMessageOutcome | 'request_error';

export interface StoryBackgroundTransition {
  atProgress: number;
  background: StoryBackgroundId;
}

export interface StoryStagePresentation {
  initialBackground: StoryBackgroundId;
  transitions: readonly StoryBackgroundTransition[];
}

export interface GalStoryBeat {
  speaker: string | null;
  text: string;
  lalaExpression: LalaExpression | null;
  background: StoryBackgroundId;
  effect: StoryEffect;
}

export interface GalStoryAct {
  id: string;
  beats: GalStoryBeat[];
}

export interface GalStoryGenerationContext {
  entryReason: MainStoryEntryReason;
  playerName: string;
  day: number;
  period: string;
  location: string;
}

export interface GalStoryFloor {
  floorId: string;
  eventId: string;
  actIndex: number;
  actId: string;
  source: StoryGenerationSource;
  createdAt: string;
  outcome: GalStoryFloorOutcome;
  act: GalStoryAct | null;
  context: GalStoryGenerationContext;
  contextFloorIds: string[];
  messageIds: string[];
  error?: string;
}

export interface GalStoryActArchive {
  eventId: string;
  actIndex: number;
  actId: string;
  activeFloorId: string | null;
  floors: GalStoryFloor[];
}

interface StoryValidationOptions {
  expectedActIds: readonly string[];
  allowPartial?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function normalizeBeat(value: unknown): GalStoryBeat {
  if (!isRecord(value)) throw new Error('剧情页必须是对象。');

  let speaker: string | null = null;
  if (value.speaker !== null) {
    if (typeof value.speaker !== 'string') throw new Error('剧情页的说话人名称无效。');
    speaker = value.speaker.normalize('NFKC').trim();
    if (!speaker || speaker.length > 48 || /[\r\n]/u.test(speaker)) {
      throw new Error('剧情页的说话人名称无效。');
    }
  }

  if (typeof value.text !== 'string') throw new Error('剧情页缺少正文。');
  const text = value.text.trim();
  if (!text || text.length > 180) throw new Error('每页正文必须为 1 到 180 个字符。');
  const lalaExpression = value.lalaExpression;
  if (lalaExpression !== null && !isOneOf(lalaExpression, LALA_EXPRESSIONS)) {
    throw new Error('剧情页包含未登记的菈菈表情。');
  }
  if (!isOneOf(value.background, STORY_BACKGROUNDS)) throw new Error('剧情页包含未登记的背景。');
  if (!isOneOf(value.effect, STORY_EFFECTS)) throw new Error('剧情页包含未登记的演出效果。');

  return {
    speaker,
    text,
    lalaExpression,
    background: value.background,
    effect: value.effect,
  };
}

export function normalizeGalStoryActs(value: unknown, options: StoryValidationOptions): GalStoryAct[] {
  const hasValidLength =
    Array.isArray(value) &&
    (options.allowPartial
      ? value.length > 0 && value.length <= options.expectedActIds.length
      : value.length === options.expectedActIds.length);
  if (!hasValidLength || !Array.isArray(value)) {
    throw new Error(
      options.allowPartial
        ? `第一集存档必须包含 1 到 ${options.expectedActIds.length} 个连续幕。`
        : `第一集必须包含 ${options.expectedActIds.length} 幕。`,
    );
  }

  return value.map((rawAct, index) => {
    if (!isRecord(rawAct)) throw new Error(`第 ${index + 1} 幕格式无效。`);
    const expectedId = options.expectedActIds[index];
    if (rawAct.id !== expectedId) throw new Error(`第 ${index + 1} 幕 ID 应为 ${expectedId}。`);
    if (!Array.isArray(rawAct.beats) || rawAct.beats.length === 0) {
      throw new Error(`第 ${index + 1} 幕至少要有一页正文。`);
    }

    return {
      id: expectedId,
      beats: rawAct.beats.map(beat => normalizeBeat(beat)),
    };
  });
}

export type GalStoryMessageRole = 'user' | 'assistant';
export type GalStoryMessageSource = 'tavern' | 'fallback';

export interface GalStoryMessageExtra {
  type: 'tolove-main-story';
  eventId: string;
  actIndex: number;
  actId: string;
  entryReason: MainStoryEntryReason;
  source: GalStoryMessageSource;
  generationId: string;
  floorId?: string;
  period: string;
  location: string;
  day?: number;
  playerName?: string;
  contextFloorIds?: string[];
  role: GalStoryMessageRole;
  renderable: boolean;
  outcome?: GalStoryMessageOutcome;
  error?: string;
}

export interface GalStoryMessageSave {
  id: string;
  name: string;
  is_user: boolean;
  is_system: boolean;
  mes: string;
  send_date: string;
  extra: GalStoryMessageExtra;
}
