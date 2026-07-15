import type { CalendarDateValue } from '../types';

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/**
 * The project's internal timeline starts on 2008-04-07: Lala's day-one appearance,
 * using the anime-era date selected for this adaptation.
 * The player-facing calendar still emphasizes month/day, while the full date remains in game state.
 */
export const GAME_START_DATE: CalendarDateValue = Object.freeze({ year: 2008, month: 4, day: 7 });

function normalizeMonth(month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`month must be an integer from 1 to 12; received ${month}`);
  }
  return month;
}

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function getDaysInMonth(year: number, month: number): number {
  const normalizedMonth = normalizeMonth(month);
  if (normalizedMonth === 2 && isLeapYear(year)) return 29;
  return MONTH_LENGTHS[normalizedMonth - 1];
}

export function getNextCalendarDate(date: CalendarDateValue): CalendarDateValue {
  const daysInMonth = getDaysInMonth(date.year, date.month);
  if (date.day < daysInMonth) return { ...date, day: date.day + 1 };
  if (date.month === 12) return { year: date.year + 1, month: 1, day: 1 };
  return { year: date.year, month: date.month + 1, day: 1 };
}

export function getCalendarDateForGameDay(gameDay: number): CalendarDateValue {
  const elapsedDays = Math.max(0, Math.trunc(gameDay) - 1);
  let date = { ...GAME_START_DATE };
  for (let index = 0; index < elapsedDays; index += 1) {
    date = getNextCalendarDate(date);
  }
  return date;
}

export function isCalendarDateValue(value: unknown): value is CalendarDateValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (!Number.isInteger(candidate.year) || !Number.isInteger(candidate.month) || !Number.isInteger(candidate.day)) {
    return false;
  }

  const year = candidate.year as number;
  const month = candidate.month as number;
  const day = candidate.day as number;
  return month >= 1 && month <= 12 && day >= 1 && day <= getDaysInMonth(year, month);
}
