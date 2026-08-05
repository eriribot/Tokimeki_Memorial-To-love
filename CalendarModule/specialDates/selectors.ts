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

export function createSpecialDateLookup(
  specialDates: readonly SpecialDateDefinition[],
): Map<string, SpecialDateDefinition[]> {
  // 同一日期可能同时有生日和主线日程等多种标记，按日期分组全部保留，由渲染层组合展示。
  const lookup = new Map<string, SpecialDateDefinition[]>();
  for (const specialDate of specialDates) {
    const key = calendarDateKey(specialDate.date);
    const group = lookup.get(key);
    if (group) {
      group.push(specialDate);
    } else {
      lookup.set(key, [specialDate]);
    }
  }
  return lookup;
}

export function sortSpecialDates(specialDates: readonly SpecialDateDefinition[]): SpecialDateDefinition[] {
  return [...specialDates].sort((left, right) => {
    const dateOrder = compareCalendarDates(left.date, right.date);
    if (dateOrder !== 0) return dateOrder;
    return left.id.localeCompare(right.id);
  });
}
