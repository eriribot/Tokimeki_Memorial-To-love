import type { AcademicTerm, AcademicTermId, AcademicTermNumber, CalendarDateLike } from './types';

const FIRST_ACADEMIC_YEAR = 2008;

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1] ?? 0;
}

export function isValidSkillDate(date: CalendarDateLike): boolean {
  return (
    Number.isSafeInteger(date.year) &&
    Number.isSafeInteger(date.month) &&
    Number.isSafeInteger(date.day) &&
    date.month >= 1 &&
    date.month <= 12 &&
    date.day >= 1 &&
    date.day <= daysInMonth(date.year, date.month)
  );
}

export function compareSkillDates(left: CalendarDateLike, right: CalendarDateLike): number {
  if (left.year !== right.year) return left.year - right.year;
  if (left.month !== right.month) return left.month - right.month;
  return left.day - right.day;
}

function createTerm(startYear: number, term: AcademicTermNumber): AcademicTerm {
  const academicYear = startYear - FIRST_ACADEMIC_YEAR + 1;
  const id: AcademicTermId = `${startYear}-t${term}`;
  if (term === 1) {
    return {
      id,
      academicYear,
      term,
      opensOn:
        startYear === FIRST_ACADEMIC_YEAR ? { year: 2008, month: 5, day: 9 } : { year: startYear, month: 4, day: 7 },
    };
  }
  if (term === 2) return { id, academicYear, term, opensOn: { year: startYear, month: 9, day: 1 } };
  return { id, academicYear, term, opensOn: { year: startYear + 1, month: 1, day: 8 } };
}

export function getAcademicTerm(termId: AcademicTermId): AcademicTerm | null {
  const match = /^(\d+)-t([123])$/.exec(termId);
  if (!match) return null;
  const startYear = Number(match[1]);
  const term = Number(match[2]) as AcademicTermNumber;
  if (!Number.isSafeInteger(startYear) || startYear < FIRST_ACADEMIC_YEAR) return null;
  return createTerm(startYear, term);
}

export function getAcademicTermSequenceIndex(termId: AcademicTermId): number | null {
  const term = getAcademicTerm(termId);
  if (!term) return null;
  return (term.academicYear - 1) * 3 + term.term - 1;
}

export function getOpenedAcademicTerms(date: CalendarDateLike): readonly AcademicTerm[] {
  if (!isValidSkillDate(date) || date.year < FIRST_ACADEMIC_YEAR) return [];

  const terms: AcademicTerm[] = [];
  for (let startYear = FIRST_ACADEMIC_YEAR; startYear <= date.year; startYear += 1) {
    for (const termNumber of [1, 2, 3] as const) {
      const term = createTerm(startYear, termNumber);
      if (compareSkillDates(term.opensOn, date) <= 0) terms.push(term);
    }
  }
  return terms;
}

export function getCurrentAcademicTerm(date: CalendarDateLike): AcademicTerm | null {
  return getOpenedAcademicTerms(date).at(-1) ?? null;
}

/** The current term remains editable until the next term opens; older missed terms are not backfilled. */
export function getOpenManagementTerm(
  date: CalendarDateLike,
  committedTermIds: ReadonlySet<AcademicTermId> | readonly AcademicTermId[],
): AcademicTerm | null {
  const committed = committedTermIds instanceof Set ? committedTermIds : new Set(committedTermIds);
  const currentTerm = getCurrentAcademicTerm(date);
  return currentTerm && !committed.has(currentTerm.id) ? currentTerm : null;
}
