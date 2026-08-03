import type { StoryEpisodeActDefinition } from '../../../episodeTemplate';

export const EPISODE_04_ACT_03 = {
  id: 'ep04.act3-cosmic-kitchen-war',
  title: '宇宙料理校园战争',
  trigger: { date: { year: 2008, month: 4, day: 16 }, actionNumber: 2 },
  timeCost: 'single-action',
  plotLore: {
    worldbookName: '出包王女',
    entryOrder: 161,
    entryName: '剧情第四集·第三幕',
    rootTag: 'To LOVE-Ru TV Episode 04 Act 03',
    kind: 'plot',
  },
  loreSection: '第三幕·宇宙料理校园战争',
  characterLoreIds: ['lala', 'haruna'],
  presentation: {
    sceneIds: ['school', 'rooftop'],
    cast: [
      { characterId: 'lala', portraitIds: ['arrival-default'] },
      { characterId: 'haruna', portraitIds: ['school-uniform'] },
    ],
  },
  generation: { minimumLineCount: 22, requiredSceneSequence: ['school', 'rooftop'] },
  fallbackBeats: [
    {
      speaker: null,
      text: '仙女座大章鱼的触手卷住春菜，也把你和菈菈拖进桌椅之间。春菜被巨物吓得失去意识。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'panic',
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '触手碰到菈菈尾巴时，她立刻失去力气。你先把她拉离触手，再让春菜靠到安全的墙边。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'panic',
        effect: 'shake',
      },
    },
    {
      speaker: '你',
      text: '菈菈，先关掉容器！萨斯丁去拦食材，我来带教室里的人撤出去。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'serious',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '萨斯丁刚拔剑，半人马座大鱿鱼便喷出墨汁封住他的视线。章鱼和鱿鱼随即互相缠斗。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'worried',
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '大星云大伊势虾从背后夹住萨斯丁，三只巨型海产撞开门窗，一路冲向屋顶。',
      presentation: {
        sceneId: 'rooftop',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'panic',
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '最后，一只没有正式名称的巨型蠕虫状生物也钻出容器。它翻过围栏，把屋顶变成真正的战场。',
      presentation: {
        sceneId: 'rooftop',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'panic',
        effect: 'shake',
      },
    },
    {
      speaker: '西连寺春菜',
      text: '我没事。下面的同学已经撤开了，你也小心！',
      presentation: {
        sceneId: 'rooftop',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '对不起，我只想做一顿你会喜欢的饭……',
      presentation: {
        sceneId: 'rooftop',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: '你',
      text: '这哪里还是做饭啊——简直比星际战争还惨！',
      presentation: {
        sceneId: 'rooftop',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'shake',
      },
    },
  ],
} as const satisfies StoryEpisodeActDefinition;
