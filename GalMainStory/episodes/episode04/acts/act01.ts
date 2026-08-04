import type { StoryEpisodeActDefinition } from '../../../episodeTemplate';

export const EPISODE_04_ACT_01 = {
  id: 'ep04.act1-warm-meal-and-hurtful-words',
  title: '热饭与说重的话',
  trigger: { date: { year: 2008, month: 4, day: 15 }, actionNumber: 1 },
  timeCost: 'whole-day',
  plotLore: {
    worldbookName: '出包王女',
    entryOrder: 158,
    entryName: '剧情第四集·第一幕',
    rootTag: 'To LOVE-Ru TV Episode 04 Act 01',
    kind: 'plot',
  },
  loreSection: '第一幕·热饭与说重的话',
  characterLoreIds: ['lala', 'haruna', 'mikan'],
  presentation: {
    sceneIds: ['bedroom', 'home', 'school', 'rooftop'],
    cast: [
      { characterId: 'lala', portraitIds: ['arrival-default'] },
      { characterId: 'haruna', portraitIds: ['school-uniform'] },
      { characterId: 'mikan', portraitIds: ['arrival-default'] },
    ],
  },
  generation: {
    minimumLineCount: 26,
    requiredSceneSequence: ['bedroom', 'home', 'school', 'rooftop', 'school', 'home'],
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
      text: '屋顶上，萨斯丁拔剑逼问你是否后悔婚约。你没有向他承认真实想法，只拿“自己还是学生”挡住追问；他随即说明戴比路克国王必须指挥领土扩张与防卫战争。',
      presentation: {
        sceneId: 'rooftop',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '进攻时被围歼、防守时全线崩溃，两场必败的星际大战在你脑内接连上演。你越想越觉得自己绝不能走进那种未来。',
      presentation: {
        sceneId: 'rooftop',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '镜头切回教室，骨川老师正好点到你的名字。你还陷在脑内灾难片里，脱口而出的回答让全班一起安静下来。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'none',
      },
    },
    {
      speaker: '你',
      text: '我不要！',
      presentation: {
        sceneId: 'school',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'shake',
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
      text: '我想吃喜欢的女朋友亲手做的饭。我不会和连饭都做不好的人结婚。你还是回戴比路克去吧。',
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
      text: '你想补充“不是因为讨厌你”，菈菈却已经冲出家门，转眼飞向夜空。萨斯丁追了出去，只留下必须由你决定的下一步。',
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
