import type { StoryEpisodeActDefinition } from '../../../episodeTemplate';

export const EPISODE_02_ACT_02 = {
  id: 'ep02.act2-cooling-off',
  title: '明晚之前',
  trigger: { date: { year: 2008, month: 4, day: 9 }, actionNumber: 2 },
  plotLore: {
    worldbookName: '出包王女',
    entryOrder: 153,
    entryName: '剧情第二集·第二幕',
    rootTag: 'To LOVE-Ru TV Episode 02 Act 02',
    kind: 'plot',
  },
  loreSection: '第二幕·明晚的冷静期',
  characterLoreIds: ['lala', 'mikan'],
  presentation: {
    sceneIds: ['home', 'washroomDoor', 'bedroom', 'school', 'riverbank'],
    cast: [
      { characterId: 'lala', portraitIds: ['arrival-default'] },
      { characterId: 'mikan', portraitIds: ['arrival-default'] },
      { characterId: 'riko', portraitIds: ['school-uniform'] },
    ],
  },
  generation: {
    minimumLineCount: 30,
    requiredSceneSequence: ['home', 'washroomDoor', 'bedroom', 'school', 'riverbank'],
  },
  fallbackBeats: [
    {
      speaker: null,
      text: '放学回家，美柑、菈菈和萨斯丁已经围着桌子喝起了茶。你忽然觉得，这桩婚约只有自己还没来得及表态。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'mikan',
        portraitId: 'arrival-default',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: '你',
      text: '我只是做个假设。如果有人想解除戴比路克的婚约，该怎么办？',
      presentation: { sceneId: 'home', focusCharacterId: null, portraitId: null, expressionId: null, effect: 'none' },
    },
    {
      speaker: '萨斯丁',
      text: '婚约设有三日冷静期。期限内再次触碰同一对象的胸口，并明确宣告解除，婚约才会失效。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'serious',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '你算出最后期限是明晚二十时四十三分。时间不多，可你无论如何也不能把真正的打算告诉菈菈。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '当晚，菈菈正专心玩游戏。你悄悄从背后靠近，手刚伸出去，萨斯丁便从旁边开口。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'none',
      },
    },
    {
      speaker: '萨斯丁',
      text: '您果然很关心菈菈大人。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'neutral',
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '第一次尝试就这样失败了。你又摸到浴室门前，却被守在那里的沛凯盯个正着。',
      presentation: {
        sceneId: 'washroomDoor',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'none',
      },
    },
    {
      speaker: '沛凯',
      text: '你该不会想偷窥菈菈大人吧？',
      presentation: {
        sceneId: 'washroomDoor',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'shake',
      },
    },
    {
      speaker: '美柑',
      text: '你到底在打什么主意？做事之前想清楚，最后受伤的会是女孩子。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'mikan',
        portraitId: 'arrival-default',
        expressionId: 'serious',
        effect: 'none',
      },
    },
    {
      speaker: '美柑',
      text: '菈菈，今晚来我房间睡吧。',
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
      text: '第二天早晨，你以为菈菈又钻进了被窝。伸手一摸，却只碰到一个柔软的脑袋。',
      presentation: {
        sceneId: 'bedroom',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'none',
      },
    },
    {
      speaker: '沛凯',
      text: '你、你摸的是我的头！',
      presentation: {
        sceneId: 'bedroom',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '白天里，你又找了几次机会，不是有人突然出现，就是菈菈恰好转身。每一次都差得那么一点。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'riko',
        portraitId: 'school-uniform',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: '夕崎梨子',
      text: '你今天一直坐立不安，真的没事吗？',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'riko',
        portraitId: 'school-uniform',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '只剩最后一小时。菈菈仍相信你不会草率伤害别人，你终于把偷偷动手的念头压了下去。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'none',
      },
    },
    {
      speaker: '你',
      text: '菈菈，跟我去河边吧。我有些话必须当面告诉你。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'serious',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '夜色已经落下。你和菈菈来到河堤，沛凯也安静地陪在她身边。',
      presentation: {
        sceneId: 'riverbank',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
  ],
} as const satisfies StoryEpisodeActDefinition;
