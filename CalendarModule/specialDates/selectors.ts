import type { CalendarDateValue } from '../../types';
import type { SpecialDateDefinition } from './types';

export function calendarDateKey(date: CalendarDateValue): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

export function compareCalendarDates(left: CalendarDateValue, right: CalendarDateValue): number {
  if (left.year !== right.year) return left.year - right.year;
  if (left.month !== right.month) return left.month - right.month;
  return left.day - right.day;
}

export function isBeforeCalendarDate(left: CalendarDateValue, right: CalendarDateValue): boolean {
  return compareCalendarDates(left, right) < 0;
}

export function isSelectableCalendarDate(date: CalendarDateValue, referenceDate: CalendarDateValue): boolean {
  return !isBeforeCalendarDate(date, referenceDate);
}

export function getCalendarWeekdayIndex(date: CalendarDateValue): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

export function createSpecialDateLookup(specialDates: readonly SpecialDateDefinition[]): Map<string, SpecialDateDefinition> {
  return new Map(specialDates.map(specialDate => [calendarDateKey(specialDate.date), specialDate]));
}

export function sortSpecialDates(specialDates: readonly SpecialDateDefinition[]): SpecialDateDefinition[] {
  return [...specialDates].sort((left, right) => {
    const dateOrder = compareCalendarDates(left.date, right.date);
    if (dateOrder !== 0) return dateOrder;
    return left.id.localeCompare(right.id);
  });
}
