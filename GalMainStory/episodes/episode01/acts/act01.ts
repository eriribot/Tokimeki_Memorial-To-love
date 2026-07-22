import type { StoryEpisodeActDefinition } from '../../../episodeTemplate';

export const EPISODE_01_ACT_01 = {
  id: 'ep01.act1-falling-star',
  title: '说不出口的放学后',
  trigger: { date: { year: 2008, month: 4, day: 7 }, actionNumber: 1 },
  plotLore: {
    worldbookName: '出包王女',
    entryOrder: 150,
    entryName: '剧情第一集·第一幕',
    rootTag: 'To LOVE-Ru TV Episode 01 Act 01',
    kind: 'plot',
  },
  loreSection: '第一幕·说不出口的放学后',
  characterLoreIds: ['lala', 'haruna', 'mikan'],
  presentation: {
    sceneIds: ['space', 'school', 'schoolGate', 'home', 'washroom'],
    cast: [
      { characterId: 'lala', portraitIds: ['arrival-default'] },
      { characterId: 'haruna', portraitIds: ['school-uniform'] },
      { characterId: 'mikan', portraitIds: ['arrival-default'] },
      { characterId: 'riko', portraitIds: ['school-uniform'] },
    ],
  },
  generation: {
    minimumLineCount: 25,
    requiredSceneSequence: ['space', 'school', 'schoolGate', 'home', 'washroom'],
  },
  fallbackBeats: [
    {
      speaker: null,
      text: '远离地球的夜空里，两个黑衣追兵把粉发少女逼到飞船外沿。她回头看了看越来越近的脚步，突然笑了。',
      presentation: {
        sceneId: 'space',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'serious',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '这次一定能逃掉！',
      presentation: {
        sceneId: 'space',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'flash',
      },
    },
    {
      speaker: null,
      text: '彩南高校的教室里，你隔着几排课桌望向春菜。只要她一回头，你准备了一整天的话就会自动消失。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: '猿山',
      text: '又只敢看？你对女孩子也太没免疫力了吧。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: '你',
      text: '今天一定会说出口。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'shy',
        effect: 'none',
      },
    },
    {
      speaker: '夕崎梨子',
      text: '那就别等到校门关了才后悔。春菜要走了。',
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
      text: '放学后，春菜抱着书从校门走过。你吸足一口气追上去，却在她转身前躲到了门柱后。',
      presentation: {
        sceneId: 'schoolGate',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: '西连寺春菜',
      text: '刚才……有人叫我吗？',
      presentation: {
        sceneId: 'schoolGate',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '回答她的是骤然压低的轰鸣。火光从教学楼上空擦过，坠落物拖着烟撞向远处，你的第二次机会也被震响吞掉。',
      presentation: {
        sceneId: 'schoolGate',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'panic',
        effect: 'shake',
      },
    },
    {
      speaker: '你',
      text: '不、没什么！明天见！',
      presentation: {
        sceneId: 'schoolGate',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'shy',
        effect: 'none',
      },
    },
    {
      speaker: '美柑',
      text: '回来了？怎么一副又失败了的表情。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'mikan',
        portraitId: 'arrival-default',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: '猿山',
      text: '所以你又逃了？照这样下去，告白前先得练习跟女生正常说话。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'none',
      },
    },
    {
      speaker: '你',
      text: '少啰嗦！明天、明天我绝对会说！',
      presentation: {
        sceneId: 'home',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '你泡进浴缸，越想忘掉春菜的背影，那句没说出口的话就越清楚。',
      presentation: {
        sceneId: 'washroom',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '咕嘟。浴缸中央冒出一串不自然的气泡，蓝白电光贴着水面爬过来。',
      presentation: {
        sceneId: 'washroom',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'flash',
      },
    },
    {
      speaker: '你',
      text: '等等，这是什么——？！',
      presentation: {
        sceneId: 'washroom',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '砰！整缸热水迎面炸起，白光穿过蒸汽。你只能看见一个模糊的人影正从水花里升起。',
      presentation: {
        sceneId: 'washroom',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'flash',
      },
    },
  ],
} as const satisfies StoryEpisodeActDefinition;
