import type { SpecialDateDefinition } from './types';

interface CharacterBirthday {
  id: string;
  label: string;
  month: number;
  day: number;
}

// 同一天生日的角色合并成一条（lookup 以日期为 key，一天只能存一条定义）。
const CHARACTER_BIRTHDAYS: readonly CharacterBirthday[] = [
  { id: 'birthday-lala', label: '菈菈的生日', month: 7, day: 7 },
  { id: 'birthday-haruna', label: '春菜的生日', month: 4, day: 15 },
  { id: 'birthday-mikan', label: '美柑的生日', month: 11, day: 3 },
  { id: 'birthday-yami', label: '伊芙（金色暗影）的生日', month: 12, day: 24 },
  { id: 'birthday-yui', label: '古手川唯的生日', month: 5, day: 3 },
  { id: 'birthday-nana-momo', label: '娜娜与梦梦的生日', month: 8, day: 8 },
  { id: 'birthday-risa', label: '里纱的生日', month: 7, day: 21 },
  { id: 'birthday-saki', label: '沙姬的生日', month: 2, day: 1 },
  { id: 'birthday-ryoko', label: '凉子的生日', month: 9, day: 9 },
];

export function projectBirthdaySpecialDates(years: readonly number[]): SpecialDateDefinition[] {
  return years.flatMap(year =>
    CHARACTER_BIRTHDAYS.map(birthday => ({
      id: `${birthday.id}-${year}`,
      date: { year, month: birthday.month, day: birthday.day },
      category: 'birthday' as const,
      label: birthday.label,
      marker: 'birthday' as const,
    })),
  );
}
