import { useEffect, useId, useRef, useState } from 'react';
import type { CalendarDateValue } from '../../types';
import { resolveAssetPath } from '../../utils/assetPath';
import { getDaysInMonth } from '../date';
import './DateModule.css';

const DATE_MODULE_ASSET_ROOT = '/artsource/calendar/date-module';
const CALENDAR_BOOK = `${DATE_MODULE_ASSET_ROOT}/calendar-open-pink.png`;
const PREVIOUS_PAGE_ARROW = '/artsource/ui/archive/L_data.png';
const NEXT_PAGE_ARROW = '/artsource/ui/archive/R_data.png';
const MONTH_HEADERS = Array.from(
  { length: 12 },
  (_, index) => `${DATE_MODULE_ASSET_ROOT}/month-${String(index + 1).padStart(2, '0')}.png`,
);
const CHINESE_MONTH_NAMES = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
] as const;
const CHINESE_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;

export interface DateModuleProps {
  date: CalendarDateValue;
  onClose: () => void;
}

interface CalendarMonth {
  year: number;
  month: number;
}

interface MonthPageProps extends CalendarMonth {
  side: 'left' | 'right';
  currentDate: CalendarDateValue;
}

function addMonths({ year, month }: CalendarMonth, offset: number): CalendarMonth {
  const monthIndex = year * 12 + month - 1 + offset;
  return {
    year: Math.floor(monthIndex / 12),
    month: (monthIndex % 12) + 1,
  };
}

function getFirstWeekday(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

function MonthPage({ year, month, side, currentDate }: MonthPageProps) {
  const firstWeekday = getFirstWeekday(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const label = `${year}年${month}月`;

  return (
    <section className={`tm-date-module__month tm-date-module__month--${side}`} aria-label={label}>
      <div className="tm-date-module__month-header">
        <img
          className="tm-date-module__month-header-image"
          src={resolveAssetPath(MONTH_HEADERS[month - 1])}
          alt=""
          draggable={false}
        />
        <span className="tm-date-module__month-year" aria-hidden="true">
          {year}年
        </span>
        <span className="tm-date-module__month-title" aria-hidden="true">
          {CHINESE_MONTH_NAMES[month - 1]}
        </span>
      </div>
      <div className="tm-date-module__weekdays" aria-hidden="true">
        {CHINESE_WEEKDAYS.map(weekday => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="tm-date-module__date-grid" aria-hidden="true">
        {Array.from({ length: 42 }, (_, index) => {
          const day = index - firstWeekday + 1;
          if (day < 1 || day > daysInMonth) {
            return <span key={`empty-${index}`} className="tm-date-module__date is-empty" />;
          }

          const weekday = index % 7;
          const isToday = currentDate.year === year && currentDate.month === month && currentDate.day === day;
          const classes = [
            'tm-date-module__date',
            weekday === 0 ? 'is-sunday' : '',
            weekday === 6 ? 'is-saturday' : '',
            isToday ? 'is-today' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <span key={day} className={classes}>
              {day}
            </span>
          );
        })}
      </div>
    </section>
  );
}

export function DateModule({ date, onClose }: DateModuleProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<CalendarMonth>(() => ({ year: date.year, month: date.month }));
  const nextMonth = addMonths(visibleMonth, 1);
  const dialogLabel = `${visibleMonth.year}年${visibleMonth.month}月与${nextMonth.year}年${nextMonth.month}月日历，今天是${date.year}年${date.month}月${date.day}日`;

  const turnPages = (offset: number) => {
    setVisibleMonth(month => addMonths(month, offset));
  };

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="tm-date-module" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="tm-date-module__backdrop" aria-label="关闭日历" onClick={onClose} />
      <div className="tm-date-module__book">
        <h2 id={titleId} className="tm-date-module__sr-only">
          {dialogLabel}
        </h2>
        <img className="tm-date-module__book-image" src={resolveAssetPath(CALENDAR_BOOK)} alt="" draggable={false} />
        <MonthPage {...visibleMonth} side="left" currentDate={date} />
        <MonthPage {...nextMonth} side="right" currentDate={date} />
        <button
          type="button"
          className="tm-date-module__page-button tm-date-module__page-button--previous"
          aria-label="查看前两个月"
          title="查看前两个月"
          onClick={() => turnPages(-2)}
        >
          <img src={resolveAssetPath(PREVIOUS_PAGE_ARROW)} alt="" draggable={false} />
        </button>
        <button
          type="button"
          className="tm-date-module__page-button tm-date-module__page-button--next"
          aria-label="查看后两个月"
          title="查看后两个月"
          onClick={() => turnPages(2)}
        >
          <img src={resolveAssetPath(NEXT_PAGE_ARROW)} alt="" draggable={false} />
        </button>
        <button
          ref={closeButtonRef}
          type="button"
          className="tm-date-module__close"
          aria-label="关闭日历"
          title="关闭日历"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
