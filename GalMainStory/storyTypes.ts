export const STORY_SCENE_IDS = [
  'space',
  'school',
  'schoolGate',
  'home',
  'washroomDoor',
  'washroom',
  'bedroom',
  'rooftop',
  'park',
  'nightStreet',
  'schoolRoad',
  'changingRoom',
  'riverbank',
  'townStreet',
  'aquarium',
  'night',
] as const;
export const STORY_EFFECTS = ['none', 'flash', 'shake'] as const;

export type StorySceneId = (typeof STORY_SCENE_IDS)[number];
export type StoryEffect = (typeof STORY_EFFECTS)[number];
export type StoryGenerationStatus = 'idle' | 'loading' | 'ready' | 'error';
export type StoryGenerationSource = 'tavern' | 'fallback';
export type GalStoryMessageOutcome = 'accepted' | 'parse_error';
export type GalStoryFloorOutcome = GalStoryMessageOutcome | 'request_error';

export interface StoryPresentationCue {
  sceneId: StorySceneId;
  focusCharacterId: string | null;
  portraitId: string | null;
  expressionId: string | null;
  effect: StoryEffect;
}

export interface StoryActCastMember {
  characterId: string;
  portraitIds: readonly string[];
}

export interface StoryScenePortraitRule {
  sceneId: StorySceneId;
  characterId: string;
  portraitId: string;
  outsideScenePortraitId?: string;
}

export type StoryCgFraming = 'cover-center' | 'safe-face-closeup';
export type StoryCgTransition = 'fade' | 'steam-zoom-out';

/** Camera composition for one frame. Percentages use the source image coordinate space. */
export interface StoryCgCameraDefinition {
  focusXPercent: number;
  focusYPercent: number;
  zoom: number;
}

/** One click-visible frame inside a CG group; it does not own story progress. */
export interface StoryCgFrameDefinition {
  id: string;
  asset: string;
  alt: string;
  framing: StoryCgFraming;
  camera?: StoryCgCameraDefinition;
}

/** One act-local trigger group. Its frames are consumed in declaration order. */
export interface StoryActCgDefinition {
  id: string;
  frames: readonly StoryCgFrameDefinition[];
  sceneId: StorySceneId;
  afterSceneBeat: number;
  transition: StoryCgTransition;
}

export interface StoryActPresentation {
  sceneIds: readonly StorySceneId[];
  cast: readonly StoryActCastMember[];
  portraitRules?: readonly StoryScenePortraitRule[];
  cgShots?: readonly StoryActCgDefinition[];
}

export interface StoryActGenerationContract {
  minimumLineCount: number;
  requiredSceneSequence: readonly StorySceneId[];
}

export interface StoryChoiceOptionDefinition {
  id: string;
  label: string;
  continuityHint: string;
}

export const STORY_AI_CHOICE_OPTION_COUNT = 3;
export const STORY_CUSTOM_CHOICE_OPTION_ID = 'player-custom';

export type StoryChoiceDecisionSource = 'ai' | 'fallback' | 'custom';

export interface StoryChoiceDefinition {
  id: string;
  prompt: string;
  options: readonly StoryChoiceOptionDefinition[];
}

export interface StoryChoiceDecision {
  choiceId: string;
  optionId: string;
  source: StoryChoiceDecisionSource;
  selectedLabel: string;
  continuityHint: string;
}

export interface StoryFallbackChoiceVariant {
  sourceActId: string;
  choiceId: string;
  optionId: string;
  openingBeats: readonly GalStoryBeat[];
}

export interface StoryActDefinition {
  id: string;
  title: string;
  loreSection: string;
  characterLoreIds: readonly string[];
  presentation: StoryActPresentation;
  generation: StoryActGenerationContract;
  choice?: StoryChoiceDefinition;
  fallbackChoiceVariants?: readonly StoryFallbackChoiceVariant[];
  fallbackBeats: readonly GalStoryBeat[];
}

export interface GalStoryBeat {
  speaker: string | null;
  text: string;
  presentation: StoryPresentationCue;
}

export interface GalStoryAct {
  id: string;
  beats: GalStoryBeat[];
  choiceOptions?: StoryChoiceOptionDefinition[];
}

export interface GalStoryGenerationContext {
  playerName: string;
  playerProfileSignature: string;
  playerPersonaInjectionVersion: 1;
  playerPersonaCarrier: 'preset-persona-description' | 'depth-zero-fallback' | 'not-generated';
  day: number;
  period: string;
  location: string;
}

export interface GalStoryFloor {
  floorId: string;
  eventId: string;
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
  actId: string;
  activeFloorId: string | null;
  choiceDecision: StoryChoiceDecision | null;
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

function normalizeChoiceInline(value: unknown, fieldName: string, maximumLength: number): string {
  if (typeof value !== 'string') throw new Error(`剧情选择的${fieldName}无效。`);
  const normalized = value
    .normalize('NFC')
    .replace(/[\r\n\t]+/gu, ' ')
    .replace(/\s{2,}/gu, ' ')
    .trim();
  if (!normalized || normalized.length > maximumLength) throw new Error(`剧情选择的${fieldName}无效。`);
  return normalized;
}

export function normalizeStoryChoiceOptions(value: unknown): StoryChoiceOptionDefinition[] {
  if (!Array.isArray(value) || value.length !== STORY_AI_CHOICE_OPTION_COUNT) {
    throw new Error(`剧情选择必须恰好包含 ${STORY_AI_CHOICE_OPTION_COUNT} 个候选行动。`);
  }
  const options = value.map((rawOption, index) => {
    if (!isRecord(rawOption)) throw new Error(`剧情选择 ${index + 1} 格式无效。`);
    return {
      id: normalizeChoiceInline(rawOption.id, '候选 ID', 64),
      label: normalizeChoiceInline(rawOption.label, '候选行动', 56),
      continuityHint: normalizeChoiceInline(rawOption.continuityHint, '微差分提示', 160),
    };
  });
  if (new Set(options.map(option => option.id)).size !== options.length) throw new Error('剧情选择候选 ID 重复。');
  if (new Set(options.map(option => option.label)).size !== options.length) throw new Error('剧情选择候选行动重复。');
  return options;
}

export function normalizePlayerChoiceText(value: unknown): string {
  return normalizeChoiceInline(value, '玩家输入', 80);
}

export function buildPlayerChoiceContinuityHint(playerText: string): string {
  const normalized = normalizePlayerChoiceText(playerText);
  return `玩家自行决定“${normalized}”。下一幕只在开场回指这一即时行动及人物的直接反应，不得另开路线或改写既定情节点。`;
}

function normalizeNullableId(value: unknown, fieldName: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') throw new Error(`剧情页的${fieldName}无效。`);
  const normalized = value.normalize('NFKC').trim();
  if (!normalized || normalized.length > 64 || /[\r\n]/u.test(normalized)) {
    throw new Error(`剧情页的${fieldName}无效。`);
  }
  return normalized;
}

function normalizePresentation(value: unknown): StoryPresentationCue {
  if (!isRecord(value)) throw new Error('剧情页缺少演出指令。');
  if (!isOneOf(value.sceneId, STORY_SCENE_IDS)) throw new Error('剧情页包含未登记的场景。');
  if (!isOneOf(value.effect, STORY_EFFECTS)) throw new Error('剧情页包含未登记的演出效果。');

  const focusCharacterId = normalizeNullableId(value.focusCharacterId, '出镜角色');
  const portraitId = normalizeNullableId(value.portraitId, '立绘版本');
  const expressionId = normalizeNullableId(value.expressionId, '表情');
  const hasPortrait = portraitId !== null || expressionId !== null;
  if (
    (focusCharacterId === null && hasPortrait) ||
    (focusCharacterId !== null && (portraitId === null || expressionId === null))
  ) {
    throw new Error('剧情页的出镜角色、立绘版本和表情必须同时填写或同时为 none。');
  }

  return {
    sceneId: value.sceneId,
    focusCharacterId,
    portraitId,
    expressionId,
    effect: value.effect,
  };
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

  return {
    speaker,
    text,
    presentation: normalizePresentation(value.presentation),
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
        ? `主线存档必须包含 1 到 ${options.expectedActIds.length} 个连续幕。`
        : `主线必须包含 ${options.expectedActIds.length} 幕。`,
    );
  }

  return value.map((rawAct, index) => {
    if (!isRecord(rawAct)) throw new Error(`第 ${index + 1} 幕格式无效。`);
    const expectedId = options.expectedActIds[index];
    if (rawAct.id !== expectedId) throw new Error(`第 ${index + 1} 幕 ID 应为 ${expectedId}。`);
    if (!Array.isArray(rawAct.beats) || rawAct.beats.length === 0) {
      throw new Error(`第 ${index + 1} 幕至少要有一页正文。`);
    }

    const choiceOptions =
      rawAct.choiceOptions === undefined ? undefined : normalizeStoryChoiceOptions(rawAct.choiceOptions);
    return {
      id: expectedId,
      beats: rawAct.beats.map(beat => normalizeBeat(beat)),
      ...(choiceOptions ? { choiceOptions } : {}),
    };
  });
}

export type GalStoryMessageRole = 'user' | 'assistant';
export type GalStoryMessageSource = 'tavern' | 'fallback';

export interface GalStoryMessageExtra {
  type: 'tolove-main-story';
  eventId: string;
  actId: string;
  source: GalStoryMessageSource;
  floorId: string;
  period: string;
  location: string;
  day: number;
  playerName: string;
  contextFloorIds: string[];
  role: GalStoryMessageRole;
  renderable: boolean;
  outcome: GalStoryMessageOutcome;
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

export interface MainStoryRun {
  eventId: string;
  actId: string;
  phase: 'waiting' | 'playing';
  pageIndex: number;
}

export interface MainStoryGenerationState {
  status: StoryGenerationStatus;
  requestId: string | null;
  source: StoryGenerationSource | null;
  error: string | null;
}

export interface MainStoryState {
  run: MainStoryRun | null;
  generation: MainStoryGenerationState;
  completedEventIds: string[];
  archives: GalStoryActArchive[];
  messages: GalStoryMessageSave[];
}
