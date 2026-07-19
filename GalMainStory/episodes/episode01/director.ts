import type { StoryPortraitCharacterId } from '../../characters';
import type { ParsedStoryLine } from '../../storyPresentation';
import type { GalStoryBeat, LalaExpression, StoryBackgroundId, StoryEffect } from '../../storyTypes';
import { LALA_ARRIVAL_ACTS } from '.';

export interface LalaArrivalPortraitCue {
  characterId: StoryPortraitCharacterId;
  expression: LalaExpression;
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

export function getLalaArrivalBackground(actIndex: number, pageIndex: number, pageCount: number): StoryBackgroundId {
  const presentation = LALA_ARRIVAL_ACTS[actIndex]?.presentation;
  if (!presentation) return 'school';
  const progress = pageCount <= 1 ? 0 : pageIndex / (pageCount - 1);
  return presentation.transitions.reduce<StoryBackgroundId>(
    (background, transition) => (progress >= transition.atProgress ? transition.background : background),
    presentation.initialBackground,
  );
}

export function getLalaArrivalEffect(text: string): StoryEffect {
  if (/白光|闪|爆|轰|砰|炸/gu.test(text)) return 'flash';
  if (/撞|震|摇|追|冲|卷|吸|坠|跌/gu.test(text)) return 'shake';
  return 'none';
}

function getHarunaPortraitExpression(beat: GalStoryBeat | undefined, actIndex: number): LalaExpression | null {
  if (!beat || actIndex !== 0 || beat.background !== 'school' || beat.lalaExpression) return null;
  if (beat.effect === 'shake') return 'e';
  if (beat.effect === 'flash') return 'd';
  return beat.speaker === '西连寺春菜' ? 'f' : 'a';
}

function getRikoPortraitExpression(beat: GalStoryBeat | undefined, actIndex: number): LalaExpression | null {
  if (!beat || actIndex !== 0 || beat.background !== 'school' || beat.lalaExpression) return null;
  if (beat.speaker && /^(?:夕崎梨子|梨子)$/u.test(beat.speaker)) return 'a';
  return beat.speaker === null && /夕崎梨子|梨子/u.test(beat.text) ? 'a' : null;
}

export function getLalaArrivalPortraitCue(
  beat: GalStoryBeat | undefined,
  actIndex: number,
): LalaArrivalPortraitCue | null {
  if (beat?.lalaExpression) return { characterId: 'lala', expression: beat.lalaExpression };
  const rikoExpression = getRikoPortraitExpression(beat, actIndex);
  if (rikoExpression) return { characterId: 'riko', expression: rikoExpression };
  const harunaExpression = getHarunaPortraitExpression(beat, actIndex);
  return harunaExpression ? { characterId: 'haruna', expression: harunaExpression } : null;
}
