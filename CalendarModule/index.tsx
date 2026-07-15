import { type CSSProperties, useEffect, useRef } from 'react';
import type { CalendarDateValue } from '../types';
import { resolveAssetPath } from '../utils/assetPath';
import { getDaysInMonth, getNextCalendarDate } from './date';
import './CalendarModule.css';

export {
  GAME_START_DATE,
  getCalendarDateForGameDay,
  getDaysInMonth,
  getNextCalendarDate,
  isCalendarDateValue,
  isLeapYear,
} from './date';
export type { CalendarDateValue } from '../types';

const CALENDAR_ASSET_ROOT = '/artsource/calendar';
const CALENDAR_FACE = `${CALENDAR_ASSET_ROOT}/new_count.png`;
const DAY_TRANSITION_BACKGROUND = `${CALENDAR_ASSET_ROOT}/hime_bg.png`;
const ACTION_ON = `${CALENDAR_ASSET_ROOT}/action_on.png`;
const ACTION_OFF = `${CALENDAR_ASSET_ROOT}/action_off.png`;
const CORNER_FRAMES = [1, 2].map(frame => ({
  frame,
  src: `${CALENDAR_ASSET_ROOT}/count_ani_${frame}.png`,
}));

const MAX_ACTION_POINTS = 2;

export interface CalendarCardProps {
  date: CalendarDateValue;
  actionsRemaining: number;
  className?: string;
  animateCorner?: boolean;
  dayUnit?: string;
  showMonth?: boolean;
}

export interface DayTransitionProps {
  open: boolean;
  from: CalendarDateValue;
  to?: CalendarDateValue;
  currentActionsRemaining?: number;
  nextActionsRemaining?: number;
  title?: string;
  className?: string;
  onAdvance?: () => void;
  onComplete?: () => void;
}

interface ActionPointStripProps {
  actionsRemaining: number;
  className: string;
}

function clampActions(actionsRemaining: number): number {
  return Math.min(MAX_ACTION_POINTS, Math.max(0, Math.trunc(actionsRemaining)));
}

function getDisplayDate(date: CalendarDateValue): CalendarDateValue {
  const daysInMonth = getDaysInMonth(date.year, date.month);
  return {
    ...date,
    day: Math.min(daysInMonth, Math.max(1, Math.trunc(date.day))),
  };
}

function ActionPointStrip({ actionsRemaining, className }: ActionPointStripProps) {
  const remaining = clampActions(actionsRemaining);
  const spent = MAX_ACTION_POINTS - remaining;

  return (
    <span className={className} aria-hidden="true">
      {Array.from({ length: MAX_ACTION_POINTS }, (_, index) => {
        const isSpent = index < spent;
        return (
          <img
            key={index}
            className="tm-calendar-action-point"
            src={resolveAssetPath(isSpent ? ACTION_ON : ACTION_OFF)}
            alt=""
            draggable={false}
          />
        );
      })}
    </span>
  );
}

function CornerAnimation() {
  return (
    <span className="tm-calendar-corner" aria-hidden="true">
      {CORNER_FRAMES.map(({ frame, src }) => (
        <img
          key={src}
          className={`tm-calendar-corner__frame tm-calendar-corner__frame--${frame}`}
          src={resolveAssetPath(src)}
          alt=""
          draggable={false}
        />
      ))}
    </span>
  );
}

function CalendarNumbers({ date, dayUnit }: { date: CalendarDateValue; dayUnit: string }) {
  const displayDate = getDisplayDate(date);
  const daysInMonth = getDaysInMonth(displayDate.year, displayDate.month);
  const digitCount = String(displayDate.day).length;

  return (
    <>
      <span className="tm-calendar-card__day" data-digits={digitCount} aria-hidden="true">
        {displayDate.day}
      </span>
      <span className="tm-calendar-card__month-total" aria-hidden="true">
        /{daysInMonth}
      </span>
      <span className="tm-calendar-card__day-unit" aria-hidden="true">
        {dayUnit}
      </span>
    </>
  );
}

export function CalendarCard({
  date,
  actionsRemaining,
  className,
  animateCorner = false,
  dayUnit = '日',
  showMonth = false,
}: CalendarCardProps) {
  const displayDate = getDisplayDate(date);
  const remaining = clampActions(actionsRemaining);
  const classes = ['tm-calendar-card', className].filter(Boolean).join(' ');
  const label = `${displayDate.year}年${displayDate.month}月${displayDate.day}日，剩余${remaining}点行动点`;

  return (
    <div className={classes} role="img" aria-label={label}>
      <img className="tm-calendar-card__face" src={resolveAssetPath(CALENDAR_FACE)} alt="" draggable={false} />
      <span className="tm-calendar-card__content" aria-hidden="true">
        <ActionPointStrip className="tm-calendar-card__actions" actionsRemaining={remaining} />
        <CalendarNumbers date={displayDate} dayUnit={dayUnit} />
        {showMonth && <span className="tm-calendar-card__month">{displayDate.month}月</span>}
        {animateCorner && <CornerAnimation />}
      </span>
    </div>
  );
}

function TransitionPage({
  date,
  actionsRemaining,
  front = false,
}: {
  date: CalendarDateValue;
  actionsRemaining: number;
  front?: boolean;
}) {
  const displayDate = getDisplayDate(date);
  const daysInMonth = getDaysInMonth(displayDate.year, displayDate.month);
  const digitCount = String(displayDate.day).length;

  return (
    <div className={`tm-day-transition__page${front ? ' tm-day-transition__page--front' : ''}`} aria-hidden="true">
      {front && (
        <img
          className="tm-day-transition__page-skin"
          src={resolveAssetPath(DAY_TRANSITION_BACKGROUND)}
          alt=""
          draggable={false}
        />
      )}
      <ActionPointStrip className="tm-day-transition__actions" actionsRemaining={actionsRemaining} />
      <span className="tm-day-transition__day" data-digits={digitCount}>
        {displayDate.day}
      </span>
      <span className="tm-day-transition__month-total">/{daysInMonth}</span>
      <span className="tm-day-transition__day-unit">日</span>
      {front && <CornerAnimation />}
    </div>
  );
}

export function DayTransition({
  open,
  from,
  to,
  currentActionsRemaining = 0,
  nextActionsRemaining = MAX_ACTION_POINTS,
  title = '今日行程结束',
  className,
  onAdvance,
  onComplete,
}: DayTransitionProps) {
  const snapshotRef = useRef({
    from,
    to: to ?? getNextCalendarDate(from),
    currentActionsRemaining,
    nextActionsRemaining,
  });
  const previousOpenRef = useRef(false);
  const onAdvanceRef = useRef(onAdvance);
  const onCompleteRef = useRef(onComplete);

  onAdvanceRef.current = onAdvance;
  onCompleteRef.current = onComplete;

  if (open && !previousOpenRef.current) {
    snapshotRef.current = {
      from,
      to: to ?? getNextCalendarDate(from),
      currentActionsRemaining,
      nextActionsRemaining,
    };
  }
  previousOpenRef.current = open;

  useEffect(() => {
    if (!open) return undefined;

    const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const advanceDelay = reducedMotion ? 0 : 1050;
    const completeDelay = reducedMotion ? 80 : 2200;
    const advanceTimer = globalThis.setTimeout(() => onAdvanceRef.current?.(), advanceDelay);
    const completeTimer = globalThis.setTimeout(() => onCompleteRef.current?.(), completeDelay);

    return () => {
      globalThis.clearTimeout(advanceTimer);
      globalThis.clearTimeout(completeTimer);
    };
  }, [open]);

  if (!open) return null;

  const snapshot = snapshotRef.current;
  const classes = ['tm-day-transition', className].filter(Boolean).join(' ');
  const stageStyle = {
    '--tm-day-transition-background': `url("${resolveAssetPath(DAY_TRANSITION_BACKGROUND)}")`,
  } as CSSProperties;

  return (
    <div
      className={classes}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}，进入${snapshot.to.month}月${snapshot.to.day}日`}
    >
      <div className="tm-day-transition__stage" style={stageStyle}>
        <img
          className="tm-day-transition__background"
          src={resolveAssetPath(DAY_TRANSITION_BACKGROUND)}
          alt=""
          draggable={false}
        />
        <p className="tm-day-transition__title">{title}</p>
        <TransitionPage date={snapshot.to} actionsRemaining={snapshot.nextActionsRemaining} />
        <TransitionPage date={snapshot.from} actionsRemaining={snapshot.currentActionsRemaining} front />
        <p className="tm-day-transition__next-date" aria-live="polite">
          {snapshot.to.year}年{snapshot.to.month}月{snapshot.to.day}日
        </p>
      </div>
    </div>
  );
}
