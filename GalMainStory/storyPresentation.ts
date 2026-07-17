import { LALA_ARRIVAL_ALLOWED_SPEAKERS } from './lalaArrival';
import type { LalaExpression } from './storyTypes';

export const STORY_MOOD_EXAMPLES = ['微笑', '担心', '开心', '认真', '慌张', '紧张'] as const;

export interface ParsedStoryLine {
  speaker: string | null;
  text: string;
  mood: string | null;
}

const DIALOGUE_LINE_PATTERN =
  /^(.{1,48}?)(?:\s*[\u3010\u005b\uff08\u0028]\s*([^\u3011\u005d\uff09\u0029]{1,16})\s*[\u3011\u005d\uff09\u0029])?\s*[：:]\s*(.+)$/u;
const QUOTED_DIALOGUE_LINE_PATTERN =
  /^(.{1,48}?)(?:\s*[\u3010\u005b\uff08\u0028]\s*([^\u3011\u005d\uff09\u0029]{1,16})\s*[\u3011\u005d\uff09\u0029])?\s*[「『“"]\s*(.+?)\s*[」』”"]\s*$/u;
const BRACKETED_SPEAKER_LINE_PATTERN =
  /^[\u3010\u005b]\s*(.{1,48}?)\s*[\u3011\u005d](?:\s*[\u3010\u005b\uff08\u0028]\s*([^\u3011\u005d\uff09\u0029]{1,16})\s*[\u3011\u005d\uff09\u0029])?\s*(?:[：:]\s*)?(.+)$/u;
const DETACHED_COLON_LABEL_PATTERN =
  /^(.{1,48}?)(?:\s*[\u3010\u005b\uff08\u0028]\s*([^\u3011\u005d\uff09\u0029]{1,16})\s*[\u3011\u005d\uff09\u0029])?\s*[：:]\s*$/u;
const DETACHED_MOOD_LABEL_PATTERN =
  /^(.{1,48}?)\s*[\u3010\u005b\uff08\u0028]\s*([^\u3011\u005d\uff09\u0029]{1,16})\s*[\u3011\u005d\uff09\u0029]\s*$/u;
const DETACHED_BRACKETED_LABEL_PATTERN =
  /^[\u3010\u005b]\s*(.{1,48}?)\s*[\u3011\u005d](?:\s*[\u3010\u005b\uff08\u0028]\s*([^\u3011\u005d\uff09\u0029]{1,16})\s*[\u3011\u005d\uff09\u0029])?\s*[：:]?\s*$/u;
const LABEL_EDGE_PATTERN = /^[\s\-•@*_`"'“”‘’「」『』]+|[\s@*_`"'“”‘’「」『』]+$/gu;
const SPEAKER_KEY_SEPARATORS = /[\s·・.]/gu;
const LIST_PREFIX_PATTERN = /^(?:[-+*•]\s+|\d{1,2}[.)、]\s*)/u;
const MARKDOWN_LABEL_PATTERN = /^(?:\*\*|__)(.+?)(?:\*\*|__)(\s*[：:])/u;
const UNLABELED_DIALOGUE_PATTERN = /(?:[「『][^」』]+[」』]|^[“"][^”"]+[”"]$)/u;
interface DialogueCandidate {
  rawSpeaker: string;
  rawMood: string | undefined;
  text: string;
  explicitSpeakerSyntax: boolean;
}

interface DetachedSpeakerLabel {
  speaker: string;
  mood: string | null;
}

function normalizeStoryLineSource(value: string): string {
  return value
    .trim()
    .replace(/^>\s*/u, '')
    .replace(LIST_PREFIX_PATTERN, '')
    .replace(MARKDOWN_LABEL_PATTERN, '$1$2')
    .trim();
}

function unwrapDialogueText(value: string): string {
  const text = value.trim();
  const pairs = [
    ['「', '」'],
    ['『', '』'],
    ['“', '”'],
    ['"', '"'],
  ] as const;
  const pair = pairs.find(([open, close]) => text.startsWith(open) && text.endsWith(close));
  return pair && text.length > pair[0].length + pair[1].length
    ? text.slice(pair[0].length, -pair[1].length).trim()
    : text;
}

function normalizeStoryMood(value: string | undefined): string | null {
  return value?.normalize('NFKC').trim() || null;
}

function matchDialogueCandidate(line: string): DialogueCandidate | null {
  const canonical = line.match(DIALOGUE_LINE_PATTERN);
  if (canonical) {
    return {
      rawSpeaker: canonical[1],
      rawMood: canonical[2],
      text: canonical[3],
      explicitSpeakerSyntax: Boolean(canonical[2]) || canonical[1].trim().startsWith('@'),
    };
  }

  const bracketed = line.match(BRACKETED_SPEAKER_LINE_PATTERN);
  if (bracketed) {
    return {
      rawSpeaker: bracketed[1],
      rawMood: bracketed[2],
      text: bracketed[3],
      explicitSpeakerSyntax: true,
    };
  }

  const quoted = line.match(QUOTED_DIALOGUE_LINE_PATTERN);
  if (quoted) {
    return {
      rawSpeaker: quoted[1],
      rawMood: quoted[2],
      text: quoted[3],
      explicitSpeakerSyntax: true,
    };
  }

  return null;
}

function normalizeSpeakerKey(value: string): string {
  return value
    .normalize('NFKC')
    .replace(LABEL_EDGE_PATTERN, '')
    .replace(SPEAKER_KEY_SEPARATORS, '')
    .toLocaleLowerCase('en-US');
}

const SPEAKER_ALIAS_GROUPS: ReadonlyArray<{
  speaker: (typeof LALA_ARRIVAL_ALLOWED_SPEAKERS)[number];
  aliases: readonly string[];
}> = [
  { speaker: '你', aliases: ['你', 'User', '玩家', '主角', '主人公', '男主角', '男主'] },
  {
    speaker: '菈菈',
    aliases: ['菈菈', '拉拉', 'Lala', 'ララ', '菈菈·萨塔琳·戴比路克', '菈菈·薩塔琳·戴比路克', '拉拉·萨塔琳·戴比路克'],
  },
  { speaker: '西连寺春菜', aliases: ['西连寺春菜', '西連寺春菜', '春菜', '西连寺'] },
  { speaker: '夕崎梨子', aliases: ['夕崎梨子', '梨子'] },
  { speaker: '猿山', aliases: ['猿山'] },
  { speaker: '沛凯', aliases: ['沛凯', '佩凯', 'Peke', 'ペケ'] },
  { speaker: '萨斯丁', aliases: ['萨斯丁', '萨斯汀', '扎斯丁', 'Zastin', 'ザスティン'] },
  { speaker: '亲卫队', aliases: ['亲卫队', '親衛隊', '戴比路克亲卫队', '戴比路克親衛隊'] },
];

const SPEAKER_ALIASES = new Map<string, (typeof LALA_ARRIVAL_ALLOWED_SPEAKERS)[number]>();
for (const group of SPEAKER_ALIAS_GROUPS) {
  for (const alias of group.aliases) SPEAKER_ALIASES.set(normalizeSpeakerKey(alias), group.speaker);
}

const NARRATOR_KEYS = new Set(['旁白', '叙述', '敘述', 'narrator'].map(normalizeSpeakerKey));

export function normalizeStorySpeaker(value: string, playerName: string): string | null {
  const key = normalizeSpeakerKey(value);
  if (NARRATOR_KEYS.has(key)) return null;

  const knownSpeaker = SPEAKER_ALIASES.get(key);
  if (knownSpeaker) return knownSpeaker;

  const normalizedPlayerName = normalizeSpeakerKey(playerName);
  return normalizedPlayerName && key === normalizedPlayerName ? '你' : null;
}

export function parseStoryLine(value: string, playerName: string): ParsedStoryLine {
  const line = normalizeStoryLineSource(value);
  if (!line) throw new Error('剧情正文包含空白页。');
  const dialogue = matchDialogueCandidate(line);
  if (!dialogue) {
    if (UNLABELED_DIALOGUE_PATTERN.test(line)) {
      throw new Error('剧情包含没有 @说话人 标签的引号对白。');
    }
    return { speaker: null, text: line, mood: null };
  }

  const rawSpeaker = dialogue.rawSpeaker.trim();
  const speakerKey = normalizeSpeakerKey(rawSpeaker);
  const text = unwrapDialogueText(dialogue.text);
  if (NARRATOR_KEYS.has(speakerKey)) {
    if (UNLABELED_DIALOGUE_PATTERN.test(text)) throw new Error('旁白行混入了没有 @说话人 标签的对白。');
    return { speaker: null, text, mood: null };
  }

  const speaker = normalizeStorySpeaker(rawSpeaker, playerName);
  if (!speaker) {
    if (dialogue.explicitSpeakerSyntax) throw new Error(`剧情对白包含未登记的说话人：${rawSpeaker}`);
    return { speaker: null, text: line, mood: null };
  }

  return {
    speaker,
    text,
    mood: normalizeStoryMood(dialogue.rawMood),
  };
}

function parseDetachedSpeakerLabel(value: string, playerName: string): DetachedSpeakerLabel | null {
  const line = normalizeStoryLineSource(value);
  const colon = line.match(DETACHED_COLON_LABEL_PATTERN);
  const moodOnly = line.match(DETACHED_MOOD_LABEL_PATTERN);
  const bracketed = line.match(DETACHED_BRACKETED_LABEL_PATTERN);
  const match = colon ?? moodOnly ?? bracketed;
  if (!match) return null;

  const rawSpeaker = match[1].trim();
  const speaker = normalizeStorySpeaker(rawSpeaker, playerName);
  if (!speaker) {
    const explicitUnknownSpeaker = Boolean(bracketed || (colon && colon[2]));
    if (explicitUnknownSpeaker) throw new Error(`剧情对白包含未登记的说话人：${rawSpeaker}`);
    return null;
  }
  return { speaker, mood: normalizeStoryMood(match[2]) };
}

export function parseStoryParagraphs(values: readonly string[], playerName: string): ParsedStoryLine[] {
  const parsed: ParsedStoryLine[] = [];

  for (let index = 0; index < values.length; index += 1) {
    const label = parseDetachedSpeakerLabel(values[index], playerName);
    if (!label) {
      parsed.push(parseStoryLine(values[index], playerName));
      continue;
    }

    const next = values[index + 1];
    if (!next?.trim()) throw new Error(`角色“${label.speaker}”的对白标签后缺少台词。`);
    const nextLine = parseStoryLine(next, playerName);
    if (nextLine.speaker) throw new Error(`角色“${label.speaker}”的对白标签后又出现了新的说话人。`);
    parsed.push({ speaker: label.speaker, mood: label.mood, text: unwrapDialogueText(nextLine.text) });
    index += 1;
  }

  return parsed;
}

const MOOD_EXPRESSION_RULES: ReadonlyArray<{ pattern: RegExp; expression: LalaExpression }> = [
  { pattern: /紧张|害羞|尴尬|窘迫|冒汗闭眼/iu, expression: 'f' },
  { pattern: /慌张|惊慌|害怕|危险|糟糕|追兵|逃跑/iu, expression: 'e' },
  { pattern: /认真|坚定|严肃|生气|不服输/iu, expression: 'd' },
  { pattern: /开心|大笑|兴奋|高兴|太好了|成功|结婚|得意/iu, expression: 'c' },
  { pattern: /担心|不安|疑惑|困惑|难过|委屈|惊讶/iu, expression: 'b' },
  { pattern: /微笑|平静|普通|自然|温和/iu, expression: 'a' },
];

function inferLalaExpression(value: string | null): LalaExpression | null {
  if (!value) return null;
  return MOOD_EXPRESSION_RULES.find(rule => rule.pattern.test(value))?.expression ?? null;
}

const LALA_REFERENCE_PATTERN = /菈菈|拉拉|\bLala\b|ララ|第一公主/iu;

export function assignLalaPortraitExpressions(
  lines: readonly ParsedStoryLine[],
  actIndex: number,
): Array<LalaExpression | null> {
  const persistsThroughAct = actIndex >= 1;
  let expression: LalaExpression | null = persistsThroughAct ? 'a' : null;

  return lines.map(line => {
    const referencesLala = line.speaker === '菈菈' || LALA_REFERENCE_PATTERN.test(line.text);
    if (!persistsThroughAct && !referencesLala) {
      expression = null;
      return null;
    }

    if (referencesLala) {
      expression = inferLalaExpression(line.mood) ?? inferLalaExpression(line.text) ?? expression ?? 'a';
    }
    return expression;
  });
}
