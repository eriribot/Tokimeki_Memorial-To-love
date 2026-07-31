import type { CalendarDateValue } from '../../types';

export type SpecialDateCategory = 'mainStoryBlocked' | 'holiday' | 'birthday' | 'appointment' | 'important';

export type SpecialDateMarker = 'blocked' | 'holiday' | 'birthday' | 'appointment' | 'important';

export interface SpecialDateDefinition {
  id: string;
  date: CalendarDateValue;
  category: SpecialDateCategory;
  label: string;
  marker: SpecialDateMarker;
}
