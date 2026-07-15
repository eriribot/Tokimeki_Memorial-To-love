import type { CalendarDateValue } from '../types';

export const LALA_ARRIVAL_EVENT_ID = 'main.lala-arrival-2008-04-07';

export type LalaExpression = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';

export interface GalStoryBeat {
  speaker: string | null;
  text: string;
  lalaExpression: LalaExpression | null;
}

// 这一轮只保存可重复验证的固定正文；AI 生成与宿主楼层在人工审查后再接。
export const LALA_ARRIVAL_STORY = {
  id: LALA_ARRIVAL_EVENT_ID,
  title: '来自宇宙的少女',
  dateLabel: '4 月 7 日 · 夜晚公园',
  background: '/artsource/backgrounds/park_background.png',
  beats: [
    {
      speaker: null,
      text: '四月七日的夜色落在公园里。一道不属于流星的光忽然划过天空，直直坠向前方的空地。',
      lalaExpression: null,
    },
    {
      speaker: '你',
      text: '刚才那道光……落在这里了？',
      lalaExpression: null,
    },
    {
      speaker: '菈菈',
      text: '太好了，传送成功！这里就是地球吧？',
      lalaExpression: 'a',
    },
    {
      speaker: null,
      text: '粉发少女身后的装置冒出白烟。还没等你问清楚，远处便传来整齐而急促的脚步声。',
      lalaExpression: 'e',
    },
    {
      speaker: '菈菈',
      text: '我叫菈菈，是从戴比路克来的。父王一直安排我和不认识的人相亲，所以我偷偷逃出来了。',
      lalaExpression: 'a',
    },
    {
      speaker: null,
      text: '追来的卫兵要求第一公主立刻返航。菈菈没有答应，只是下意识地躲到了你的身后。',
      lalaExpression: 'b',
    },
    {
      speaker: '你',
      text: '她不愿意回去。至少在她自己做出选择之前，你们不能强行带走她。',
      lalaExpression: 'd',
    },
    {
      speaker: '菈菈',
      text: '你愿意保护我？那就决定了！我要告诉父王，我在地球找到了想结婚的人！',
      lalaExpression: 'c',
    },
    {
      speaker: '你',
      text: '等等，我说的保护不是这个意思！',
      lalaExpression: 'c',
    },
    {
      speaker: null,
      text: '卫兵暂时退去，将这场误会带回了宇宙。从这个夜晚开始，戴比路克的第一公主闯进了你的日常。',
      lalaExpression: 'f',
    },
  ] satisfies readonly GalStoryBeat[],
} as const;

interface LalaArrivalTriggerState {
  date: CalendarDateValue;
  actionPointsRemaining: number;
  activeMainStoryEventId: string | null;
  completedMainStoryEventIds: readonly string[];
}

export function shouldTriggerLalaArrival(state: LalaArrivalTriggerState): boolean {
  return (
    state.date.year === 2008 &&
    state.date.month === 4 &&
    state.date.day === 7 &&
    state.actionPointsRemaining === 1 &&
    state.activeMainStoryEventId === null &&
    !state.completedMainStoryEventIds.includes(LALA_ARRIVAL_EVENT_ID)
  );
}
