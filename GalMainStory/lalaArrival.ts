import type { CalendarDateValue } from '../types';
import type { GalStoryAct, MainStoryEntryReason, StoryStagePresentation } from './storyTypes';

export const LALA_ARRIVAL_EVENT_ID = 'main.lala-arrival-2008-04-07';

export const LALA_ARRIVAL_PLOT_LORE_REFERENCE = {
  worldbookName: '出包王女',
  entryUid: 2,
  entryName: '剧情第一集',
  rootTag: 'To LOVE-Ru TV Episode 01',
  requiredContentMarker: '标题:从天而降的少女',
  kind: 'plot',
} as const;

const LALA_CHARACTER_LORE_REFERENCE = {
  worldbookName: '出包王女',
  entryUid: 1,
  entryName: '菈菈.萨塔琳.戴比路克',
  rootTag: 'Lala Satalin Deviluke',
  requiredContentMarker: '姓名:菈菈·萨塔琳·戴比路克',
  kind: 'character',
} as const;

export const LALA_ARRIVAL_ACTS = [
  {
    id: 'ep01.act1-falling-star',
    title: '放学后的坠落光',
    actionPointsRemaining: 1,
    opening: '放学后的旧校舍天台上，你与春菜都差点说出告白。',
    ending: '你回到家打开浴室门，白光先一步填满视线。',
    charactersWithLore: [],
    presentation: {
      initialBackground: 'school',
      transitions: [
        { atProgress: 0.65, background: 'night' },
        { atProgress: 0.8, background: 'washroomDoor' },
        { atProgress: 1, background: 'washroom' },
      ],
    },
  },
  {
    id: 'ep01.act2-bathroom',
    title: '浴室里的王女',
    actionPointsRemaining: 0,
    opening: '承接浴室门后的白光、水花与蒸汽，菈菈随机传送出现。',
    ending: '次日菈菈完整误接你原本给春菜的告白，公开宣布婚约，众人错愕。',
    charactersWithLore: ['菈菈'],
    presentation: {
      initialBackground: 'washroom',
      transitions: [
        { atProgress: 0.4, background: 'night' },
        { atProgress: 0.8, background: 'school' },
      ],
    },
  },
] as const satisfies readonly {
  id: string;
  title: string;
  actionPointsRemaining: number;
  opening: string;
  ending: string;
  charactersWithLore: readonly string[];
  presentation: StoryStagePresentation;
}[];

const LALA_ARRIVAL_CHARACTER_LORE_REFERENCES = {
  菈菈: LALA_CHARACTER_LORE_REFERENCE,
} as const;

export function getLalaArrivalLoreReferences(actIndex: number) {
  const act = LALA_ARRIVAL_ACTS[actIndex];
  if (!act) throw new Error('第一集幕编号无效。');

  return [
    LALA_ARRIVAL_PLOT_LORE_REFERENCE,
    ...act.charactersWithLore.flatMap(characterName => {
      const reference =
        LALA_ARRIVAL_CHARACTER_LORE_REFERENCES[characterName as keyof typeof LALA_ARRIVAL_CHARACTER_LORE_REFERENCES];
      return reference ? [reference] : [];
    }),
  ];
}

export const LALA_ARRIVAL_ACT_IDS = LALA_ARRIVAL_ACTS.map(act => act.id);

export const LALA_ARRIVAL_ALLOWED_SPEAKERS = [
  '你',
  '菈菈',
  '西连寺春菜',
  '夕崎梨子',
  '猿山',
  '沛凯',
  '萨斯丁',
  '亲卫队',
] as const;

export const LALA_ARRIVAL_STORY = {
  id: LALA_ARRIVAL_EVENT_ID,
  title: '从天而降的少女',
  dateLabel: '2008 年 4 月 7 日',
  backgrounds: {
    school: '/artsource/backgrounds/classroom.jpg',
    night: '/artsource/backgrounds/park_background.png',
    washroomDoor: '/artsource/backgrounds/washroom_door.png',
    washroom: '/artsource/backgrounds/washroom.png',
  },
  acts: LALA_ARRIVAL_ACTS,
} as const;

interface LalaArrivalTriggerState {
  date: CalendarDateValue;
  actionPointsRemaining: number;
  activeMainStoryEventId: string | null;
  completedMainStoryEventIds: readonly string[];
  mainStoryActIndex: number;
}

function isLalaArrivalDate(date: CalendarDateValue): boolean {
  return date.year === 2008 && date.month === 4 && date.day === 7;
}

export function getPendingLalaArrivalActIndex(state: LalaArrivalTriggerState): number | null {
  if (
    !isLalaArrivalDate(state.date) ||
    state.activeMainStoryEventId !== null ||
    state.completedMainStoryEventIds.includes(LALA_ARRIVAL_EVENT_ID)
  ) {
    return null;
  }

  const actIndex = Math.min(LALA_ARRIVAL_ACTS.length - 1, Math.max(0, Math.trunc(state.mainStoryActIndex)));
  const act = LALA_ARRIVAL_ACTS[actIndex];
  return act.actionPointsRemaining === state.actionPointsRemaining ? actIndex : null;
}

export function shouldTriggerLalaArrival(state: LalaArrivalTriggerState): boolean {
  return getPendingLalaArrivalActIndex(state) !== null;
}

export function getLalaArrivalEntryReason(actIndex: number): MainStoryEntryReason {
  return actIndex <= 0 ? 'after_first_action' : 'after_second_action';
}

export function createLalaArrivalFallbackAct(entryReason: MainStoryEntryReason, actIndex: number): GalStoryAct {
  const acts = createLalaArrivalFallback(entryReason);
  return acts[Math.min(acts.length - 1, Math.max(0, Math.trunc(actIndex)))] ?? acts[0];
}

export function createLalaArrivalFallback(_entryReason: MainStoryEntryReason): GalStoryAct[] {
  return [
    {
      id: LALA_ARRIVAL_ACTS[0].id,
      beats: [
        {
          speaker: null,
          text: '放学后的旧校舍天台上，风卷着几片枯叶打转，夕阳把你和春菜的影子拉得很长。',
          lalaExpression: null,
          background: 'school',
          effect: 'none',
        },
        {
          speaker: '西连寺春菜',
          text: '那个……把你叫到这里来……其实我是想说……',
          lalaExpression: null,
          background: 'school',
          effect: 'none',
        },
        {
          speaker: null,
          text: '不久前，夕崎梨子还在鞋柜旁拍着你的背，催你别再临阵退缩。现在那点勇气全堵在喉咙里。',
          lalaExpression: null,
          background: 'school',
          effect: 'none',
        },
        {
          speaker: null,
          text: '头顶的云层忽然被白光剖开，破空声压下春菜的惊呼，一团拖着火花的光擦过教学楼。',
          lalaExpression: null,
          background: 'school',
          effect: 'flash',
        },
        {
          speaker: '你',
          text: '危险！',
          lalaExpression: null,
          background: 'school',
          effect: 'shake',
        },
        {
          speaker: null,
          text: '你把春菜拽向身侧，两人跌在粗糙的防滑地砖上。后山方向升起黑烟，警报声在彩南町此起彼伏。',
          lalaExpression: null,
          background: 'school',
          effect: 'shake',
        },
        {
          speaker: '猿山',
          text: '喂！天台上的！快下来！听说是陨石掉下来了，别在那发呆啦！',
          lalaExpression: null,
          background: 'school',
          effect: 'none',
        },
        {
          speaker: '西连寺春菜',
          text: '那个，你刚才……想说什么？',
          lalaExpression: null,
          background: 'school',
          effect: 'none',
        },
        {
          speaker: '你',
          text: '没什么，明天再说吧。快走。',
          lalaExpression: null,
          background: 'school',
          effect: 'none',
        },
        {
          speaker: null,
          text: '你满身汗和尘土地回到家，只想把这场尴尬又惊险的骚动全冲进下水道。',
          lalaExpression: null,
          background: 'night',
          effect: 'none',
        },
        {
          speaker: null,
          text: '你来到浴室门前，手刚搭上门把，门缝里便漏出一线不属于家中的白光。',
          lalaExpression: null,
          background: 'washroomDoor',
          effect: 'none',
        },
        {
          speaker: null,
          text: '门把手转开的瞬间，刺眼白光越过粉紫色水汽和浴缸，把整个视野彻底吞没。',
          lalaExpression: null,
          background: 'washroom',
          effect: 'flash',
        },
      ],
    },
    {
      id: LALA_ARRIVAL_ACTS[1].id,
      beats: [
        {
          speaker: null,
          text: '白光在浴室里炸开，水汽被卷成一圈涡流，一个粉色长发的少女咚地落进浴缸。',
          lalaExpression: 'f',
          background: 'washroom',
          effect: 'flash',
        },
        {
          speaker: '你',
          text: '等一下！你是从哪里掉进来的？！',
          lalaExpression: 'f',
          background: 'washroom',
          effect: 'shake',
        },
        {
          speaker: '菈菈',
          text: '传送成功！你好，我是菈菈！虽然落点好像稍微偏了一点点。',
          lalaExpression: 'a',
          background: 'washroom',
          effect: 'none',
        },
        {
          speaker: null,
          text: '她身后的尾巴轻轻一摆，圆滚滚的机械装置从窗口飞进来，认真得像在宣布实验报告。',
          lalaExpression: 'b',
          background: 'washroom',
          effect: 'none',
        },
        {
          speaker: '沛凯',
          text: '菈菈大人，随机传送的误差依旧十分稳定。请先让我解决服装问题。',
          lalaExpression: 'c',
          background: 'washroom',
          effect: 'none',
        },
        {
          speaker: null,
          text: '整齐的脚步声撞进院子。亲卫队破门而入，菈菈抓住你的手腕，转身就往屋顶跑。',
          lalaExpression: 'e',
          background: 'night',
          effect: 'shake',
        },
        {
          speaker: '萨斯丁',
          text: '第一公主，请结束这场离家出走。戴比路克王位和相亲安排都在等您。',
          lalaExpression: 'b',
          background: 'night',
          effect: 'none',
        },
        {
          speaker: '你',
          text: '她已经说了不想回去。至少让她自己决定要过什么生活！',
          lalaExpression: 'd',
          background: 'night',
          effect: 'none',
        },
        {
          speaker: '菈菈',
          text: '说得好！那就交给我的GOGO真空君吧！',
          lalaExpression: 'a',
          background: 'night',
          effect: 'flash',
        },
        {
          speaker: null,
          text: '机器越转越快，卫兵、晾衣杆和你一起离地半尺。下一秒，黑烟和惨叫同时盖过屋顶。',
          lalaExpression: 'f',
          background: 'night',
          effect: 'shake',
        },
        {
          speaker: null,
          text: '第二天，春菜在校门前问起昨夜的骚动。你看见机会重新站到眼前，索性闭紧双眼。',
          lalaExpression: null,
          background: 'school',
          effect: 'none',
        },
        {
          speaker: '你',
          text: '我喜欢你！请和我交往！',
          lalaExpression: null,
          background: 'school',
          effect: 'none',
        },
        {
          speaker: null,
          text: '你睁开眼。春菜站在两步之外，而菈菈正好从侧面探到你面前，绿眼睛亮得像信号灯。',
          lalaExpression: 'c',
          background: 'school',
          effect: 'flash',
        },
        {
          speaker: '菈菈',
          text: '原来你也喜欢我！太好了，那我们结婚吧！',
          lalaExpression: 'c',
          background: 'school',
          effect: 'none',
        },
      ],
    },
  ];
}
