import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CalendarDateValue } from '../../types';
import { resolveAssetPath } from '../../utils/assetPath';
import { getDaysInMonth } from '../date';
import {
  calendarDateKey,
  createSpecialDateLookup,
  isSelectableCalendarDate,
  type SpecialDateDefinition,
} from '../specialDates';
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
  specialDates: readonly SpecialDateDefinition[];
  onClose: () => void;
  onSelectDate?: (date: CalendarDateValue) => void;
  isDateSelectable?: (date: CalendarDateValue) => boolean;
  getDateStatus?: (date: CalendarDateValue) => string | null;
  footer?: ReactNode;
}

interface CalendarMonth {
  year: number;
  month: number;
}

interface MonthPageProps extends CalendarMonth {
  side: 'left' | 'right';
  currentDate: CalendarDateValue;
  selectedDate: CalendarDateValue;
  specialDateLookup: ReadonlyMap<string, readonly SpecialDateDefinition[]>;
  onSelectDate: (date: CalendarDateValue) => void;
  isDateSelectable?: (date: CalendarDateValue) => boolean;
  getDateStatus?: (date: CalendarDateValue) => string | null;
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

const CHINESE_WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'] as const;

function getWeekdayIndex(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function formatDateLabel(date: CalendarDateValue): string {
  const weekdayIndex = getWeekdayIndex(date.year, date.month, date.day);
  return `${date.year}年${date.month}月${date.day}日（星期${CHINESE_WEEKDAY_NAMES[weekdayIndex]}）`;
}

function MonthPage({
  year,
  month,
  side,
  currentDate,
  selectedDate,
  specialDateLookup,
  onSelectDate,
  isDateSelectable: isDateSelectableOverride,
  getDateStatus,
}: MonthPageProps) {
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
      <div className="tm-date-module__date-grid" role="grid" aria-label={`${label}日历`}>
        {Array.from({ length: 42 }, (_, index) => {
          const day = index - firstWeekday + 1;
          if (day < 1 || day > daysInMonth) {
            return <span key={`empty-${index}`} className="tm-date-module__date is-empty" />;
          }

          const dateValue = { year, month, day };
          const weekday = index % 7;
          const isToday =
            currentDate.year === year && currentDate.month === month && currentDate.day === day;
          const isSelected =
            selectedDate.year === year && selectedDate.month === month && selectedDate.day === day;
          const specialDateGroup = specialDateLookup.get(calendarDateKey(dateValue)) ?? [];
          const isBlocked = specialDateGroup.some(entry => entry.marker === 'blocked');
          const isBirthday = specialDateGroup.some(entry => entry.marker === 'birthday');
          const isAppointment = specialDateGroup.some(entry => entry.marker === 'appointment');
          const specialSummary = [
            ...specialDateGroup.filter(entry => entry.marker !== 'blocked').map(entry => entry.label),
            ...(isBlocked ? ['已有重要日程，该日期暂不可安排'] : []),
          ].join(' / ');
          const isSelectable =
            isSelectableCalendarDate(dateValue, currentDate) &&
            (isDateSelectableOverride ? isDateSelectableOverride(dateValue) : true);
          const customStatus = getDateStatus?.(dateValue);
          const classes = [
            'tm-date-module__date-button',
            weekday === 0 ? 'is-sunday' : '',
            weekday === 6 ? 'is-saturday' : '',
            isToday ? 'is-today' : '',
            isSelected ? 'is-selected' : '',
            isBlocked ? 'is-blocked' : '',
            isBirthday ? 'is-birthday' : '',
            !isSelectable ? 'is-disabled' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={day}
              type="button"
              className={classes}
              disabled={!isSelectable}
              aria-label={`${formatDateLabel(dateValue)}，${customStatus ?? (specialSummary || '暂无特别日程')}${
                isSelectable ? '，点击查看' : '，已过去'
              }`}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSelected}
              onClick={() => onSelectDate(dateValue)}
            >
              <span className="tm-date-module__date-number" aria-hidden="true">
                {day}
              </span>
              {isBlocked && isBirthday ? (
                <span className="tm-date-module__date-marks" aria-hidden="true">
                  <span className="tm-date-module__date-mark tm-date-module__date-mark--compact" />
                  <span className="tm-date-module__date-marks-separator">/</span>
                  <span className="tm-date-module__date-birthday tm-date-module__date-birthday--compact">🎂</span>
                </span>
              ) : isBlocked ? (
                <span className="tm-date-module__date-mark" aria-hidden="true" />
              ) : isAppointment && isBirthday ? (
                <span className="tm-date-module__date-marks" aria-hidden="true">
                  <span className="tm-date-module__date-birthday tm-date-module__date-birthday--compact">🎂</span>
                  <span className="tm-date-module__date-marks-separator">/</span>
                  <span className="tm-date-module__date-appointment tm-date-module__date-appointment--compact">
                    💕
                  </span>
                </span>
              ) : isAppointment ? (
                <span className="tm-date-module__date-appointment" aria-hidden="true">
                  💕
                </span>
              ) : isBirthday ? (
                <span className="tm-date-module__date-birthday" aria-hidden="true">
                  🎂
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function DateModule({
  date,
  specialDates,
  onClose,
  onSelectDate: onSelectDateOverride,
  isDateSelectable: isDateSelectableOverride,
  getDateStatus,
  footer,
}: DateModuleProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<CalendarMonth>(() => ({ year: date.year, month: date.month }));
  const [selectedDate, setSelectedDate] = useState<CalendarDateValue>(() => ({ ...date }));
  const specialDateLookup = useMemo(() => createSpecialDateLookup(specialDates), [specialDates]);
  const nextMonth = addMonths(visibleMonth, 1);
  const selectedSpecialDateGroup = specialDateLookup.get(calendarDateKey(selectedDate)) ?? [];
  const selectedDateLabel = formatDateLabel(selectedDate);
  const selectedDateStatus =
    getDateStatus?.(selectedDate) ??
    ([
      ...selectedSpecialDateGroup.filter(entry => entry.marker !== 'blocked').map(entry => entry.label),
      ...(selectedSpecialDateGroup.some(entry => entry.marker === 'blocked') ? ['已有重要日程，该日期暂不可安排'] : []),
    ].join(' / ') || '暂无特别日程');
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
      <div className="tm-date-module__layout">
        <div className="tm-date-module__book">
          <h2 id={titleId} className="tm-date-module__sr-only">
            {dialogLabel}
          </h2>
          <img className="tm-date-module__book-image" src={resolveAssetPath(CALENDAR_BOOK)} alt="" draggable={false} />
          <MonthPage
            {...visibleMonth}
            side="left"
            currentDate={date}
            selectedDate={selectedDate}
            specialDateLookup={specialDateLookup}
            onSelectDate={selected => {
              setSelectedDate(selected);
              onSelectDateOverride?.(selected);
            }}
            isDateSelectable={isDateSelectableOverride}
            getDateStatus={getDateStatus}
          />
          <MonthPage
            {...nextMonth}
            side="right"
            currentDate={date}
            selectedDate={selectedDate}
            specialDateLookup={specialDateLookup}
            onSelectDate={selected => {
              setSelectedDate(selected);
              onSelectDateOverride?.(selected);
            }}
            isDateSelectable={isDateSelectableOverride}
            getDateStatus={getDateStatus}
          />
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
        <div className="tm-date-module__info" aria-live="polite">
          <div className="tm-date-module__info-date">{selectedDateLabel}</div>
          <div
            className={`tm-date-module__info-status ${
              selectedSpecialDateGroup.some(entry => entry.marker === 'blocked') ? 'is-blocked' : ''
            }`}
          >
            {selectedDateStatus}
          </div>
          {footer && <div className="tm-date-module__footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
