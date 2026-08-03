import type { StoryEpisodeActDefinition } from '../../../episodeTemplate';

export const EPISODE_04_ACT_01 = {
  id: 'ep04.act1-warm-meal-and-hurtful-words',
  title: '热饭与说重的话',
  trigger: { date: { year: 2008, month: 4, day: 15 }, actionNumber: 1 },
  timeCost: 'whole-day',
  plotLore: {
    worldbookName: '出包王女',
    entryOrder: 159,
    entryName: '剧情第四集·第一幕',
    rootTag: 'To LOVE-Ru TV Episode 04 Act 01',
    kind: 'plot',
  },
  loreSection: '第一幕·热饭与说重的话',
  characterLoreIds: ['lala', 'haruna', 'mikan', 'riko'],
  presentation: {
    sceneIds: ['bedroom', 'home', 'school', 'rooftop'],
    cast: [
      { characterId: 'lala', portraitIds: ['arrival-default'] },
      { characterId: 'haruna', portraitIds: ['school-uniform'] },
      { characterId: 'mikan', portraitIds: ['arrival-default'] },
      { characterId: 'riko', portraitIds: ['school-uniform'] },
    ],
  },
  generation: {
    minimumLineCount: 26,
    requiredSceneSequence: ['bedroom', 'home', 'school', 'rooftop', 'home'],
  },
  choice: {
    id: 'ep04.after-lala-leaves',
    prompt: '菈菈冲出家门后，你决定——',
    options: [
      {
        id: 'chase-and-apologize',
        label: '立刻追出去，先承认自己说重了',
        continuityHint: '次日开场，美柑知道你昨夜已经追出去道歉；她仍责备用词太重，但认可你没有逃避。',
      },
      {
        id: 'write-and-face-her',
        label: '写下要说的话，明天当面讲清楚',
        continuityHint: '次日开场，美柑看见你没能送出的道歉便签；她要求你今天当面说清，语气比另一选项更严厉。',
      },
      {
        id: 'ask-mikan-then-act',
        label: '先问美柑该怎么补救，再亲自去找菈菈',
        continuityHint: '次日开场，美柑回想你昨夜认真询问该如何补救；她给出提醒，但强调道歉仍必须由你亲口说。',
      },
    ],
  },
  fallbackBeats: [
    {
      speaker: null,
      text: '雾气里的湖边，春菜刚问起你和菈菈的关系。你正要回答，梦境便被身旁的重量挤碎。',
      presentation: {
        sceneId: 'bedroom',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '早上好！我只是想待在你身边，所以又过来了。',
      presentation: {
        sceneId: 'bedroom',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'flash',
      },
    },
    {
      speaker: null,
      text: '早餐只是培根煎蛋、米饭与味噌汤，菈菈却吃得眼睛发亮。王族的饭菜通过试毒后，总是已经冷透。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'none',
      },
    },
    {
      speaker: '结城美柑',
      text: '喜欢热的就多吃一点。晚饭我也做刚出锅的。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'mikan',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '到了教室，菈菈仍在兴奋地谈早餐。里纱与未央先笑她容易满足，又把话题绕到婚约和尾巴上。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '因为我以后会和你结婚呀！',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '屋顶上，萨斯丁把戴比路克国王的职责说成扩张与防卫战争。你没有含糊，直接指出自己不会接受被推上战场。',
      presentation: {
        sceneId: 'rooftop',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'shake',
      },
    },
    {
      speaker: '你',
      text: '我怕的是有人替我决定一生，还把战争说成结婚附带的义务。这个问题我会亲自和菈菈谈。',
      presentation: {
        sceneId: 'rooftop',
        focusCharacterId: 'riko',
        portraitId: 'school-uniform',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '晚饭的寿喜烧让菈菈和萨斯丁埋头猛吃。被问到故乡料理时，菈菈兴冲冲地第一次走进厨房。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '爆炸声后端出来的是一团黑亮胶状物。你勉强咽下一口，视野里的客厅几乎变成三途川。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'worried',
        effect: 'shake',
      },
    },
    {
      speaker: '你',
      text: '我怕的不是你的料理。我是不愿在什么都没说清的时候，就把结婚和战争一起答应下来。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'serious',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '原来……你这么不想和我结婚。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '你想补充“不是因为讨厌你”，菈菈却已经转身冲出家门。门在眼前合上，留下必须由你决定的下一步。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'mikan',
        portraitId: 'arrival-default',
        expressionId: 'serious',
        effect: 'none',
      },
    },
  ],
} as const satisfies StoryEpisodeActDefinition;
