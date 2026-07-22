import type { StoryEpisodeActDefinition } from '../../../episodeTemplate';

export const EPISODE_02_ACT_01 = {
  id: 'ep02.act1-engagement-rule',
  title: '前天二十时四十三分',
  trigger: { date: { year: 2008, month: 4, day: 9 }, actionNumber: 1 },
  plotLore: {
    worldbookName: '出包王女',
    entryOrder: 152,
    entryName: '剧情第二集·第一幕',
    rootTag: 'To LOVE-Ru TV Episode 02 Act 01',
    kind: 'plot',
  },
  loreSection: '第一幕·前天20时43分',
  characterLoreIds: ['lala', 'haruna', 'mikan'],
  presentation: {
    sceneIds: ['bedroom', 'home', 'school', 'changingRoom'],
    cast: [
      { characterId: 'lala', portraitIds: ['arrival-default'] },
      { characterId: 'haruna', portraitIds: ['school-uniform'] },
      { characterId: 'mikan', portraitIds: ['arrival-default'] },
      { characterId: 'riko', portraitIds: ['school-uniform'] },
    ],
  },
  generation: {
    minimumLineCount: 30,
    requiredSceneSequence: ['bedroom', 'home', 'school', 'changingRoom'],
  },
  fallbackBeats: [
    {
      speaker: null,
      text: '清晨，你睁开眼便看见菈菈睡在身边。她倒是一脸平常，仿佛婚约者同住根本不值得大惊小怪。',
      presentation: {
        sceneId: 'bedroom',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '我们都要结婚了，睡在一起不是很普通吗？',
      presentation: {
        sceneId: 'bedroom',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: '沛凯',
      text: '一直保持衣服的形态很累，我也需要休息。',
      presentation: {
        sceneId: 'bedroom',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '美柑推门看了一眼，没有追问，只把门重新关上。那份冷静反而让你更不知道该怎么解释。',
      presentation: {
        sceneId: 'bedroom',
        focusCharacterId: 'mikan',
        portraitId: 'arrival-default',
        expressionId: 'serious',
        effect: 'none',
      },
    },
    {
      speaker: '你',
      text: '等等，这个婚约到底是谁决定的？',
      presentation: {
        sceneId: 'bedroom',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'neutral',
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '萨斯丁突然从窗外探进来，认真得像是专程来宣读王室法令。',
      presentation: { sceneId: 'home', focusCharacterId: null, portraitId: null, expressionId: null, effect: 'shake' },
    },
    {
      speaker: '萨斯丁',
      text: '戴比路克的正式求婚，需要触碰公主殿下的胸口，再献上爱的告白。菈菈大人已经接受了。',
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
      text: '婚约从前天二十时四十三分，你第一次碰到菈菈大人的那一刻起生效。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'serious',
        effect: 'none',
      },
    },
    {
      speaker: '你',
      text: '可那全都是误会！',
      presentation: { sceneId: 'home', focusCharacterId: null, portraitId: null, expressionId: null, effect: 'shake' },
    },
    {
      speaker: '萨斯丁',
      text: '做出这些事后再否认，就是侮辱戴比路克。陛下若把它视为宣战，地球恐怕保不住。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'serious',
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '到了学校，你满脑子只剩一件事：必须先向春菜解释。可她总在你开口前避开视线。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: '夕崎梨子',
      text: '你要找春菜的话，她刚才往那边去了。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'riko',
        portraitId: 'school-uniform',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '找到你了！我只是想来看看学校是什么样子。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'flash',
      },
    },
    {
      speaker: '菈菈',
      text: '大家好，我是他未来的新娘！',
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
      text: '教室瞬间炸开了锅。猿山带着一群男生追上来，你只能拉着菈菈一路逃。',
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
      text: '菈菈，快用跳跳瓦普君！先离开这里再说！',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'panic',
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '白光一闪，衣物留在原地。你和菈菈跌进一排储物柜后，柜门勉强挡住了混乱的现场。',
      presentation: {
        sceneId: 'changingRoom',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'shy',
        effect: 'flash',
      },
    },
    {
      speaker: '西连寺春菜',
      text: '你、你怎么会在这里？！别过来！',
      presentation: {
        sceneId: 'changingRoom',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'panic',
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '你才迈出一步，清脆的一巴掌便让所有解释停在嘴边。更衣室里一片死寂，谁也没能把话说清。',
      presentation: {
        sceneId: 'changingRoom',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'worried',
        effect: 'shake',
      },
    },
  ],
} as const satisfies StoryEpisodeActDefinition;
