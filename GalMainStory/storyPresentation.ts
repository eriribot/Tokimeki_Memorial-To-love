import {
  findStoryCharacterBySpeaker,
  getStoryCharacter,
  getStoryPortraitRig,
  isStoryCharacterId,
} from './characters';
import {
  STORY_EFFECTS,
  STORY_SCENE_IDS,
  type StoryActPresentation,
  type StoryEffect,
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

const DIRECTED_LINE_PATTERN = /^@(.{1,48}?)【([^】]{1,512})】\s*[：:]\s*(.+)$/u;
const DIRECTIVE_SEPARATOR_PATTERN = /[;；]/u;
const DIRECTIVE_FIELD_PATTERN = /^([a-z]+)\s*=\s*([a-zA-Z0-9_-]+)$/u;
const REQUIRED_DIRECTIVE_FIELDS = ['scene', 'focus', 'portrait', 'expression', 'effect'] as const;
const REQUIRED_DIRECTIVE_FIELD_SET = new Set<string>(REQUIRED_DIRECTIVE_FIELDS);
const PLAYER_ALIASES = new Set(['你', 'User', '玩家', '主角', '主人公', '男主角', '男主'].map(normalizeSpeakerKey));
const NARRATOR_ALIASES = new Set(['旁白', '叙述', '敘述', 'narrator'].map(normalizeSpeakerKey));

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

function parseDirectiveFields(value: string): Record<(typeof REQUIRED_DIRECTIVE_FIELDS)[number], string> {
  const fields = new Map<string, string>();
  for (const part of value.split(DIRECTIVE_SEPARATOR_PATTERN)) {
    const match = part.trim().match(DIRECTIVE_FIELD_PATTERN);
    if (!match) throw new Error(`演出字段“${part.trim()}”格式无效。`);
    const [, key, fieldValue] = match;
    if (fields.has(key)) throw new Error(`演出字段“${key}”重复。`);
    fields.set(key, fieldValue);
  }

  const unknown = [...fields.keys()].find(key => !REQUIRED_DIRECTIVE_FIELD_SET.has(key));
  if (unknown) throw new Error(`剧情页包含未知演出字段“${unknown}”。`);
  const missing = REQUIRED_DIRECTIVE_FIELDS.find(key => !fields.has(key));
  if (missing) throw new Error(`剧情页缺少演出字段“${missing}”。`);

  return Object.fromEntries(REQUIRED_DIRECTIVE_FIELDS.map(key => [key, fields.get(key)!])) as Record<
    (typeof REQUIRED_DIRECTIVE_FIELDS)[number],
    string
  >;
}

function isStorySceneId(value: string): value is StorySceneId {
  return STORY_SCENE_IDS.includes(value as StorySceneId);
}

function isStoryEffect(value: string): value is StoryEffect {
  return STORY_EFFECTS.includes(value as StoryEffect);
}

function parsePresentationCue(fields: ReturnType<typeof parseDirectiveFields>, act: StoryActPresentation): StoryPresentationCue {
  if (!isStorySceneId(fields.scene) || !act.sceneIds.includes(fields.scene)) {
    throw new Error(`当前幕不能使用场景“${fields.scene}”。`);
  }
  if (!isStoryEffect(fields.effect)) throw new Error(`剧情页包含未登记的效果“${fields.effect}”。`);

  if (fields.focus === 'none') {
    if (fields.portrait !== 'none' || fields.expression !== 'none') {
      throw new Error('focus=none 时 portrait 与 expression 必须同时为 none。');
    }
    return {
      sceneId: fields.scene,
      focusCharacterId: null,
      portraitId: null,
      expressionId: null,
      effect: fields.effect,
    };
  }

  const focusCharacterId = fields.focus;
  if (!isStoryCharacterId(focusCharacterId)) throw new Error(`剧情页引用了未登记角色“${focusCharacterId}”。`);
  const castMember = act.cast.find(member => member.characterId === focusCharacterId);
  if (!castMember) throw new Error(`角色“${getStoryCharacter(focusCharacterId).displayName}”不在当前幕演员表中。`);
  const portraitRules = act.portraitRules ?? [];
  const matchingPortraitRule = portraitRules.find(
    rule => rule.sceneId === fields.scene && rule.characterId === focusCharacterId,
  );
  const outsideSceneRule = matchingPortraitRule
    ? null
    : portraitRules.find(
        rule =>
          rule.characterId === focusCharacterId &&
          rule.portraitId === fields.portrait &&
          rule.outsideScenePortraitId,
      );
  const resolvedPortraitId =
    matchingPortraitRule?.portraitId ?? outsideSceneRule?.outsideScenePortraitId ?? fields.portrait;
  if (!castMember.portraitIds.includes(resolvedPortraitId)) {
    throw new Error(`当前幕不允许角色“${focusCharacterId}”使用立绘“${resolvedPortraitId}”。`);
  }
  const rig = getStoryPortraitRig(focusCharacterId, resolvedPortraitId);
  if (!rig.expressions[fields.expression]) {
    throw new Error(`立绘“${focusCharacterId}/${resolvedPortraitId}”没有表情“${fields.expression}”。`);
  }

  return {
    sceneId: fields.scene,
    focusCharacterId,
    portraitId: resolvedPortraitId,
    expressionId: fields.expression,
    effect: fields.effect,
  };
}

export function parseStoryLine(value: string, context: StoryLineParseContext): ParsedStoryLine {
  const line = value.trim();
  const match = line.match(DIRECTED_LINE_PATTERN);
  if (!match) {
    throw new Error('剧情正文行必须使用“@说话人【scene=...;focus=...;portrait=...;expression=...;effect=...】：正文”格式。');
  }

  const text = match[3].trim();
  if (!text) throw new Error('剧情正文包含空白页。');
  const speaker = normalizeSpeaker(match[1], context.playerName);
  const presentation = parsePresentationCue(parseDirectiveFields(match[2]), context.presentation);
  const speakingCharacter = findStoryCharacterBySpeaker(speaker);
  const speakingCharacterIsInAct = Boolean(
    speakingCharacter && context.presentation.cast.some(member => member.characterId === speakingCharacter.id),
  );
  if (speakingCharacter && !speakingCharacterIsInAct) {
    throw new Error(`已登记角色“${speakingCharacter.displayName}”不在当前幕演员表中，不能作为说话人。`);
  }
  if (speakingCharacterIsInAct && presentation.focusCharacterId === null) {
    throw new Error(`已登记角色“${speakingCharacter?.displayName}”正在说话，本页 focus 不能是 none。`);
  }
  return {
    speaker,
    text,
    presentation,
  };
}

export function parseStoryParagraphs(values: readonly string[], context: StoryLineParseContext): ParsedStoryLine[] {
  return values.map(value => parseStoryLine(value, context));
}
