import { findStoryCharacterBySpeaker, getStoryCharacter, getStoryPortraitRig, isStoryCharacterId } from './characters';
import { getRequiredStoryPortraitId } from './portraitRules';
import {
  STORY_EFFECTS,
  STORY_SCENE_IDS,
  type StoryActPresentation,
  type StoryPresentationCue,
  type StorySceneId,
} from './storyTypes';

export interface ParsedStoryLine {
  speaker: string | null;
  text: string;
  presentation: StoryPresentationCue;
}

export interface StoryLineParseContext {
  playerName: string;
  presentation: StoryActPresentation;
}

const DIRECTED_LINE_PATTERN = /^@?(.{1,48}?)\s*[【\[]([^】\]]{0,512})[】\]]\s*[：:]?\s*(.+)$/u;
const CUE_ONLY_LINE_PATTERN = /^[【\[]([^】\]]{0,512})[】\]]\s*[：:]?\s*(.+)$/u;
const SPEAKER_LINE_PATTERN = /^@?([^【\[】\]：:\r\n]{1,48}?)\s*[：:]\s*(.+)$/u;
const DIRECTIVE_SEPARATOR_PATTERN = /[;；,，]/u;
const DIRECTIVE_FIELD_PATTERN = /^([a-z]+)\s*[=:]\s*(.+)$/iu;
const REQUIRED_DIRECTIVE_FIELDS = ['scene', 'focus', 'portrait', 'expression', 'effect'] as const;
const REQUIRED_DIRECTIVE_FIELD_SET = new Set<string>(REQUIRED_DIRECTIVE_FIELDS);
const PLAYER_ALIASES = new Set(['你', 'User', '玩家', '主角', '主人公', '男主角', '男主'].map(normalizeSpeakerKey));
const NARRATOR_ALIASES = new Set(['旁白', '叙述', '敘述', 'narrator'].map(normalizeSpeakerKey));

type DirectiveField = (typeof REQUIRED_DIRECTIVE_FIELDS)[number];
type DirectiveFields = Partial<Record<DirectiveField, string>>;

interface ParsedLineParts {
  speaker: string | null;
  text: string;
  fields: DirectiveFields;
}

function normalizeSpeakerKey(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\s·・.]/gu, '')
    .toLocaleLowerCase('en-US');
}

function normalizeSpeaker(value: string, playerName: string): string | null {
  const speaker = value.normalize('NFKC').trim();
  const key = normalizeSpeakerKey(speaker);
  if (NARRATOR_ALIASES.has(key)) return null;
  if (PLAYER_ALIASES.has(key) || key === normalizeSpeakerKey(playerName)) return '你';
  const character = findStoryCharacterBySpeaker(speaker);
  return character?.displayName ?? speaker;
}

function normalizeCueId(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\s_-]/gu, '')
    .toLocaleLowerCase('en-US');
}

function findAllowedId<T extends string>(value: string | undefined, allowedValues: readonly T[]): T | null {
  if (!value) return null;
  const key = normalizeCueId(value);
  return allowedValues.find(candidate => normalizeCueId(candidate) === key) ?? null;
}

function parseDirectiveFields(value: string): DirectiveFields {
  const fields: DirectiveFields = {};
  for (const part of value.normalize('NFKC').split(DIRECTIVE_SEPARATOR_PATTERN)) {
    const match = part.trim().match(DIRECTIVE_FIELD_PATTERN);
    if (!match) continue;
    const key = match[1].toLocaleLowerCase('en-US');
    if (!REQUIRED_DIRECTIVE_FIELD_SET.has(key)) continue;
    const fieldValue = match[2].trim().replace(/^["'`]+|["'`]+$/gu, '');
    if (fieldValue) fields[key as DirectiveField] = fieldValue;
  }
  return fields;
}

function isStorySceneId(value: string): value is StorySceneId {
  return STORY_SCENE_IDS.includes(value as StorySceneId);
}

function resolveSceneId(
  value: string | undefined,
  act: StoryActPresentation,
  previousPresentation: StoryPresentationCue | null,
): StorySceneId {
  const requestedSceneId = findAllowedId(value, act.sceneIds);
  if (requestedSceneId && isStorySceneId(requestedSceneId)) return requestedSceneId;
  if (previousPresentation && act.sceneIds.includes(previousPresentation.sceneId)) {
    return previousPresentation.sceneId;
  }
  const defaultSceneId = act.sceneIds[0];
  if (!defaultSceneId) throw new Error('当前幕没有可用的默认场景。');
  return defaultSceneId;
}

function findCastCharacterId(value: string | undefined, act: StoryActPresentation): string | null {
  if (!value || normalizeCueId(value) === 'none') return null;
  const characterIds = act.cast.map(member => member.characterId);
  const requestedCharacterId = findAllowedId(value, characterIds);
  if (requestedCharacterId && isStoryCharacterId(requestedCharacterId)) return requestedCharacterId;

  const character = findStoryCharacterBySpeaker(value.normalize('NFKC').trim());
  return character && act.cast.some(member => member.characterId === character.id) ? character.id : null;
}

function resolveFocusCharacterId(
  value: string | undefined,
  speaker: string | null,
  act: StoryActPresentation,
  previousPresentation: StoryPresentationCue | null,
): string | null {
  const requestedCharacterId = findCastCharacterId(value, act);
  if (requestedCharacterId) return requestedCharacterId;

  const speakingCharacter = findStoryCharacterBySpeaker(speaker);
  if (speakingCharacter && act.cast.some(member => member.characterId === speakingCharacter.id)) {
    return speakingCharacter.id;
  }
  if (value && normalizeCueId(value) === 'none') return null;

  const previousCharacterId = previousPresentation?.focusCharacterId;
  return previousCharacterId && act.cast.some(member => member.characterId === previousCharacterId)
    ? previousCharacterId
    : null;
}

function parsePresentationCue(
  fields: DirectiveFields,
  speaker: string | null,
  act: StoryActPresentation,
  previousPresentation: StoryPresentationCue | null,
): StoryPresentationCue {
  const sceneId = resolveSceneId(fields.scene, act, previousPresentation);
  const effect = findAllowedId(fields.effect, STORY_EFFECTS) ?? 'none';
  const focusCharacterId = resolveFocusCharacterId(fields.focus, speaker, act, previousPresentation);
  if (!focusCharacterId || !isStoryCharacterId(focusCharacterId)) {
    return {
      sceneId,
      focusCharacterId: null,
      portraitId: null,
      expressionId: null,
      effect,
    };
  }

  const castMember = act.cast.find(member => member.characterId === focusCharacterId);
  if (!castMember) throw new Error(`当前幕演员“${focusCharacterId}”缺少立绘配置。`);
  const portraitRules = act.portraitRules ?? [];
  const character = getStoryCharacter(focusCharacterId);
  const requiredPortraitId = getRequiredStoryPortraitId(portraitRules, sceneId, focusCharacterId);
  const requestedPortraitId = findAllowedId(fields.portrait, castMember.portraitIds);
  const defaultPortraitId = castMember.portraitIds.includes(character.defaultPortraitId)
    ? character.defaultPortraitId
    : castMember.portraitIds[0];
  const portraitId = requiredPortraitId ?? requestedPortraitId ?? defaultPortraitId;
  if (!portraitId) throw new Error(`当前幕演员“${focusCharacterId}”没有可用立绘。`);

  const rig = getStoryPortraitRig(focusCharacterId, portraitId);
  const expressionId = findAllowedId(fields.expression, Object.keys(rig.expressions)) ?? rig.defaultExpressionId;
  if (!rig.expressions[expressionId]) throw new Error(`立绘“${focusCharacterId}/${portraitId}”没有可用默认表情。`);

  return {
    sceneId,
    focusCharacterId,
    portraitId,
    expressionId,
    effect,
  };
}

function parseLineParts(value: string, playerName: string): ParsedLineParts {
  const line = value.trim();
  if (!line) throw new Error('剧情正文包含空白页。');

  const directedMatch = line.match(DIRECTED_LINE_PATTERN);
  if (directedMatch) {
    return {
      speaker: normalizeSpeaker(directedMatch[1], playerName),
      text: directedMatch[3].trim(),
      fields: parseDirectiveFields(directedMatch[2]),
    };
  }

  const cueOnlyMatch = line.match(CUE_ONLY_LINE_PATTERN);
  if (cueOnlyMatch) {
    return {
      speaker: null,
      text: cueOnlyMatch[2].trim(),
      fields: parseDirectiveFields(cueOnlyMatch[1]),
    };
  }

  const speakerMatch = line.match(SPEAKER_LINE_PATTERN);
  if (speakerMatch) {
    return {
      speaker: normalizeSpeaker(speakerMatch[1], playerName),
      text: speakerMatch[2].trim(),
      fields: {},
    };
  }

  return { speaker: null, text: line, fields: {} };
}

function parseStoryLineWithFallback(
  value: string,
  context: StoryLineParseContext,
  previousPresentation: StoryPresentationCue | null,
): ParsedStoryLine {
  const { speaker, text, fields } = parseLineParts(value, context.playerName);
  if (!text) throw new Error('剧情正文包含空白页。');
  const presentation = parsePresentationCue(fields, speaker, context.presentation, previousPresentation);
  return {
    speaker,
    text,
    presentation,
  };
}

export function parseStoryLine(value: string, context: StoryLineParseContext): ParsedStoryLine {
  return parseStoryLineWithFallback(value, context, null);
}

export function parseStoryParagraphs(values: readonly string[], context: StoryLineParseContext): ParsedStoryLine[] {
  const lines: ParsedStoryLine[] = [];
  let previousPresentation: StoryPresentationCue | null = null;
  for (const value of values) {
    const line = parseStoryLineWithFallback(value, context, previousPresentation);
    lines.push(line);
    previousPresentation = line.presentation;
  }
  return lines;
}
