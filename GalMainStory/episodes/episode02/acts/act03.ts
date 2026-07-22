import type { StoryEpisodeActDefinition } from '../../../episodeTemplate';

export const EPISODE_02_ACT_03 = {
  id: 'ep02.act3-deadline',
  title: '二十时四十三分之后',
  trigger: { date: { year: 2008, month: 4, day: 10 }, actionNumber: 2 },
  plotLore: {
    worldbookName: '出包王女',
    entryOrder: 154,
    entryName: '剧情第二集·第三幕',
    rootTag: 'To LOVE-Ru TV Episode 02 Act 03',
    kind: 'plot',
  },
  loreSection: '第三幕·20时43分之后',
  characterLoreIds: ['lala', 'haruna'],
  presentation: {
    sceneIds: ['riverbank', 'home', 'schoolRoad', 'school'],
    cast: [
      { characterId: 'lala', portraitIds: ['arrival-default'] },
      { characterId: 'haruna', portraitIds: ['school-uniform'] },
      { characterId: 'riko', portraitIds: ['school-uniform'] },
    ],
  },
  generation: {
    minimumLineCount: 28,
    requiredSceneSequence: ['riverbank', 'home', 'schoolRoad', 'school'],
  },
  fallbackBeats: [
    {
      speaker: null,
      text: '河面映着夜色。离二十时四十三分只剩不到一小时，你终于提起那桩让所有人忙乱了两天的婚约。',
      presentation: {
        sceneId: 'riverbank',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '我很高兴呀。以前总有人来相亲，大家只会说王家和父王怎么安排，很少问我自己想要什么。',
      presentation: {
        sceneId: 'riverbank',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'serious',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '好像从来没有人肯听我把话说完。',
      presentation: {
        sceneId: 'riverbank',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: '沛凯',
      text: '菈菈大人，我一直都在听。',
      presentation: {
        sceneId: 'riverbank',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '对，除了沛凯。还有你。那天你愿意相信我，还拼命保护我，所以我真的很感谢你。',
      presentation: {
        sceneId: 'riverbank',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '你刚才想和我说什么？',
      presentation: {
        sceneId: 'riverbank',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'neutral',
        effect: 'none',
      },
    },
    {
      speaker: '你',
      text: '我其实……婚约的事……',
      presentation: {
        sceneId: 'riverbank',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '话到了嘴边又停住。你没有伸手，也没有说出完整的解除宣言。警报声就在这时划破河堤的安静。',
      presentation: {
        sceneId: 'riverbank',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'panic',
        effect: 'flash',
      },
    },
    {
      speaker: '你',
      text: '二十时四十三分……已经来不及了。',
      presentation: {
        sceneId: 'riverbank',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '第二天早晨，萨斯丁和亲卫挤满门前，高声庆祝婚约已经越过冷静期。',
      presentation: {
        sceneId: 'home',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'shake',
      },
    },
    {
      speaker: '菈菈',
      text: '那我先走啦，待会儿见！',
      presentation: {
        sceneId: 'schoolRoad',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '你一路走向学校，安慰自己至少菈菈不会出现在教室。春菜那边的误会，只能以后慢慢解释。',
      presentation: {
        sceneId: 'schoolRoad',
        focusCharacterId: null,
        portraitId: null,
        expressionId: null,
        effect: 'none',
      },
    },
    {
      speaker: '老师',
      text: '今天班上来了一位转学生。进来吧。',
      presentation: { sceneId: 'school', focusCharacterId: null, portraitId: null, expressionId: null, effect: 'none' },
    },
    {
      speaker: '菈菈',
      text: '找到你了！我也来这里上学啦！',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'flash',
      },
    },
    {
      speaker: '西连寺春菜',
      text: '她是……前两天的那个女孩？',
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
      text: '看来今天也不会安静了。',
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
      text: '全班的议论声一下涌了起来。你愣在座位上，菈菈却已经开始期待今后的校园生活。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'shake',
      },
    },
  ],
} as const satisfies StoryEpisodeActDefinition;
