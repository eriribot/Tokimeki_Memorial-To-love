import { getDaysInMonth, getNextCalendarDate } from '../CalendarModule/date';
import { calendarDateKey } from '../CalendarModule/specialDates';
import { isCharacterAvailable } from '../data/characterAvailability';
import { normalizeCharacterRelationshipStats } from '../services/characterRelationship';
import type { CalendarDateValue, CharacterStats } from '../types';
import type {
  DatingAppointment,
  DatingInvitationContext,
  DatingInvitationResult,
  DatingLocationDefinition,
  DatingLocationId,
  WalkHomeEvaluation,
} from './types';

export const DATING_WINDOW_DAYS = 28;
export const DATING_FRIENDSHIP_GATE = 10;

export const DATING_LOCATIONS: readonly DatingLocationDefinition[] = [
  {
    id: 'park',
    label: '公园',
    cardAsset: '/artsource/datechoice/stage008_a.png',
    backgroundAsset: '/artsource/backgrounds/park_background.png',
    sceneId: 'park',
    cost: 0,
  },
  {
    id: 'riverbank',
    label: '河堤',
    cardAsset: '/artsource/datechoice/stage009_a.png',
    backgroundAsset: '/artsource/backgrounds/bg009_a.png',
    sceneId: 'riverbank',
    cost: 0,
  },
  {
    id: 'townStreet',
    label: '商店街',
    cardAsset: '/artsource/datechoice/stage026_a.png',
    backgroundAsset: '/artsource/backgrounds/bg026_a.png',
    sceneId: 'townStreet',
    cost: 100,
  },
] as const;

/** 登记节日只作为可预约日期，不会把日期标记成阻塞。 */
export const REGISTERED_HOLIDAYS: readonly { month: number; day: number; label: string }[] = [
  { month: 4, day: 29, label: '昭和日' },
  { month: 5, day: 3, label: '宪法纪念日' },
  { month: 5, day: 4, label: '绿之日' },
  { month: 5, day: 5, label: '儿童节' },
];

export const INVITABLE_CHARACTER_IDS = new Set(['riko', 'haruna', 'lala']);

export function getDatingLocation(locationId: DatingLocationId): DatingLocationDefinition {
  const location = DATING_LOCATIONS.find(candidate => candidate.id === locationId);
  if (!location) throw new Error(`未知约会地点：${locationId}`);
  return location;
}

export function isInvitableCharacter(characterId: string, completedMainStoryEventIds: readonly string[]): boolean {
  return INVITABLE_CHARACTER_IDS.has(characterId) && isCharacterAvailable(characterId, completedMainStoryEventIds);
}

export function getCharacterInvitationGate(
  characterId: string,
  relationship: Pick<CharacterStats, 'friendship' | 'romance' | 'affection'>,
  completedMainStoryEventIds: readonly string[],
): { available: boolean; reason: string | null } {
  if (!isInvitableCharacter(characterId, completedMainStoryEventIds)) {
    return { available: false, reason: '这名角色目前还不能接受非主线邀约。' };
  }
  const normalized = normalizeCharacterRelationshipStats(relationship);
  if (normalized.friendship < DATING_FRIENDSHIP_GATE) {
    return { available: false, reason: `友情达到 ${DATING_FRIENDSHIP_GATE} 后开放邀约。` };
  }
  return { available: true, reason: null };
}

export function compareDates(left: CalendarDateValue, right: CalendarDateValue): number {
  if (left.year !== right.year) return left.year - right.year;
  if (left.month !== right.month) return left.month - right.month;
  return left.day - right.day;
}

export function addCalendarDays(date: CalendarDateValue, amount: number): CalendarDateValue {
  let result = { ...date };
  const steps = Math.max(0, Math.trunc(amount));
  for (let index = 0; index < steps; index += 1) result = getNextCalendarDate(result);
  return result;
}

export function daysBetween(start: CalendarDateValue, end: CalendarDateValue): number {
  let cursor = { ...start };
  let distance = 0;
  while (compareDates(cursor, end) < 0 && distance <= 3700) {
    cursor = getNextCalendarDate(cursor);
    distance += 1;
  }
  return compareDates(cursor, end) === 0 ? distance : compareDates(start, end);
}

export function getWeekdayIndex(date: CalendarDateValue): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

export function isWeekend(date: CalendarDateValue): boolean {
  const weekday = getWeekdayIndex(date);
  return weekday === 0 || weekday === 6;
}

export function isRegisteredHoliday(date: CalendarDateValue): boolean {
  return REGISTERED_HOLIDAYS.some(holiday => holiday.month === date.month && holiday.day === date.day);
}

export function isDatingDateInWindow(currentDate: CalendarDateValue, candidateDate: CalendarDateValue): boolean {
  const distance = daysBetween(currentDate, candidateDate);
  return distance >= 1 && distance <= DATING_WINDOW_DAYS;
}

export function isDatingDateEligible(
  currentDate: CalendarDateValue,
  candidateDate: CalendarDateValue,
  blockedDateKeys: ReadonlySet<string> = new Set(),
  bookedDateKeys: ReadonlySet<string> = new Set(),
): { eligible: boolean; reason: string | null } {
  if (!isDatingDateInWindow(currentDate, candidateDate))
    return { eligible: false, reason: '只能预约未来 28 天内的日期。' };
  if (!isWeekend(candidateDate) && !isRegisteredHoliday(candidateDate)) {
    return { eligible: false, reason: '约会只安排在周末或登记节日。' };
  }
  const key = calendarDateKey(candidateDate);
  if (blockedDateKeys.has(key)) return { eligible: false, reason: '这一天已有主线安排。' };
  if (bookedDateKeys.has(key)) return { eligible: false, reason: '这一天已经有预约。' };
  return { eligible: true, reason: null };
}

export function clampAcceptanceRate(value: number): number {
  return Math.min(0.9, Math.max(0.1, Number.isFinite(value) ? value : 0.1));
}

export function stableHash(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function stableUnit(value: string): number {
  return stableHash(value) / 0x100000000;
}

export function getInvitationAcceptanceRate(
  context: Pick<
    DatingInvitationContext,
    'friendship' | 'romance' | 'favoriteLocation' | 'faceToFace' | 'equippedSkillIds'
  >,
): number {
  const skills = new Set(context.equippedSkillIds);
  const rate =
    0.25 +
    context.friendship * 0.003 +
    context.romance * 0.002 +
    (context.faceToFace ? 0.08 : 0) +
    (context.favoriteLocation ? 0.06 : 0) +
    (skills.has('three_visits') ? 0.08 : 0);
  return clampAcceptanceRate(rate);
}

export function resolveInvitation(context: DatingInvitationContext): DatingInvitationResult {
  const acceptanceRate = getInvitationAcceptanceRate(context);
  const roll = stableUnit(
    `${calendarDateKey(context.date)}|${context.characterId}|${context.locationId}|${context.attemptNumber}`,
  );
  const accepted = roll < acceptanceRate;
  const fee = getDatingLocation(context.locationId).cost;
  return {
    accepted,
    acceptanceRate,
    roll,
    fee,
    reason: accepted ? '对方答应了这次邀约。' : '对方这次没能答应邀约。',
  };
}

export function getDatingQualityWeights(
  equippedSkillIds: readonly string[],
): Readonly<Record<'awkward' | 'good' | 'great', number>> {
  const skills = new Set(equippedSkillIds);
  const moodMaker = skills.has('mood_maker') ? 1 : 0;
  const sommelier = skills.has('conversation_sommelier') ? 1 : 0;
  return {
    awkward: Math.max(1, 4 - moodMaker - sommelier),
    good: 5 + moodMaker * 2 + sommelier * 2,
    great: 2 + moodMaker + sommelier * 2,
  };
}

export function getWalkHomeProbability(affection: number, equippedSkillIds: readonly string[] = []): number {
  const nightOwl = equippedSkillIds.includes('night_owl') ? 0.01 : 0;
  return Math.min(0.1, Math.max(0, 0.02 + Math.max(0, Math.min(100, affection)) * 0.0008 + nightOwl));
}

export function evaluateWalkHome(
  date: CalendarDateValue,
  characterId: string | null,
  affection: number,
  equippedSkillIds: readonly string[] = [],
): WalkHomeEvaluation {
  const dateKey = calendarDateKey(date);
  if (!characterId) {
    return { dateKey, characterId: null, probability: 0, roll: null, status: 'skipped' };
  }
  const probability = getWalkHomeProbability(affection, equippedSkillIds);
  const roll = stableUnit(`${dateKey}|walk-home|${characterId}`);
  return {
    dateKey,
    characterId,
    probability,
    roll,
    status: roll < probability ? 'offered' : 'skipped',
  };
}

export function isValidCalendarDate(date: CalendarDateValue): boolean {
  return (
    Number.isInteger(date.year) &&
    Number.isInteger(date.month) &&
    Number.isInteger(date.day) &&
    date.month >= 1 &&
    date.month <= 12 &&
    date.day >= 1 &&
    date.day <= getDaysInMonth(date.year, date.month)
  );
}

export function projectDatingAppointmentSpecialDates(
  appointments: readonly DatingAppointment[],
): { id: string; date: CalendarDateValue; category: 'appointment'; label: string; marker: 'appointment' }[] {
  return appointments
    .filter(appointment => appointment.status === 'booked' || appointment.status === 'active')
    .map(appointment => ({
      id: `dating-appointment-${appointment.id}`,
      date: { ...appointment.date },
      category: 'appointment' as const,
      label: '约会预约',
      marker: 'appointment' as const,
    }));
}
