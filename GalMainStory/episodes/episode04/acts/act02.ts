import type { StoryEpisodeActDefinition } from '../../../episodeTemplate';

const CHASE_OPENING = [
  {
    speaker: null,
    text: '你昨夜追到街口，只来得及向远去的菈菈喊出道歉。第二天清晨，客厅仍安静得不习惯。',
    presentation: {
      sceneId: 'home',
      focusCharacterId: 'mikan',
      portraitId: 'arrival-default',
      expressionId: 'serious',
      effect: 'none',
    },
  },
  {
    speaker: '结城美柑',
    text: '至少你知道要追出去。可一句道歉不够，今天见到菈菈，要把真正害怕的事讲清楚。',
    presentation: {
      sceneId: 'home',
      focusCharacterId: 'mikan',
      portraitId: 'arrival-default',
      expressionId: 'serious',
      effect: 'none',
    },
  },
] as const;

const NOTE_OPENING = [
  {
    speaker: null,
    text: '第二天清晨，客厅安静得不习惯。桌上压着你反复改过、最后仍没能送出去的道歉便签。',
    presentation: {
      sceneId: 'home',
      focusCharacterId: 'mikan',
      portraitId: 'arrival-default',
      expressionId: 'serious',
      effect: 'none',
    },
  },
  {
    speaker: '结城美柑',
    text: '写得再认真，她也看不到。今天别再躲在纸后面，见到菈菈就当面讲清楚。',
    presentation: {
      sceneId: 'home',
      focusCharacterId: 'mikan',
      portraitId: 'arrival-default',
      expressionId: 'serious',
      effect: 'shake',
    },
  },
] as const;

const ASK_MIKAN_OPENING = [
  {
    speaker: null,
    text: '昨夜，你没有急着替自己辩解，而是先问美柑该怎样才能把伤人的话补救回来。第二天清晨，她已经等在客厅。',
    presentation: {
      sceneId: 'home',
      focusCharacterId: 'mikan',
      portraitId: 'arrival-default',
      expressionId: 'serious',
      effect: 'none',
    },
  },
  {
    speaker: '结城美柑',
    text: '我能提醒你别再说重话，但不能替你道歉。见到菈菈以后，把真正害怕的事情亲口告诉她。',
    presentation: {
      sceneId: 'home',
      focusCharacterId: 'mikan',
      portraitId: 'arrival-default',
      expressionId: 'serious',
      effect: 'none',
    },
  },
] as const;

export const EPISODE_04_ACT_02 = {
  id: 'ep04.act2-return-and-explanation',
  title: '回来把话说清楚',
  trigger: { date: { year: 2008, month: 4, day: 16 }, actionNumber: 1 },
  timeCost: 'whole-day',
  plotLore: {
    worldbookName: '出包王女',
    entryOrder: 160,
    entryName: '剧情第四集·第二幕',
    rootTag: 'To LOVE-Ru TV Episode 04 Act 02',
    kind: 'plot',
  },
  loreSection: '第二幕·回来把话说清楚',
  characterLoreIds: ['lala', 'haruna', 'mikan'],
  presentation: {
    sceneIds: ['home', 'school'],
    cast: [
      { characterId: 'lala', portraitIds: ['arrival-default'] },
      { characterId: 'haruna', portraitIds: ['school-uniform'] },
      { characterId: 'mikan', portraitIds: ['arrival-default'] },
    ],
  },
  generation: { minimumLineCount: 24, requiredSceneSequence: ['home', 'school'] },
  fallbackChoiceVariants: [
    {
      sourceActId: 'ep04.act1-warm-meal-and-hurtful-words',
      choiceId: 'ep04.after-lala-leaves',
      optionId: 'chase-and-apologize',
      openingBeats: CHASE_OPENING,
    },
    {
      sourceActId: 'ep04.act1-warm-meal-and-hurtful-words',
      choiceId: 'ep04.after-lala-leaves',
      optionId: 'write-and-face-her',
      openingBeats: NOTE_OPENING,
    },
    {
      sourceActId: 'ep04.act1-warm-meal-and-hurtful-words',
      choiceId: 'ep04.after-lala-leaves',
      optionId: 'ask-mikan-then-act',
      openingBeats: ASK_MIKAN_OPENING,
    },
  ],
  fallbackBeats: [
    {
      speaker: null,
      text: '学校里，春菜直接问起菈菈去了哪里。你没有编借口，只说昨晚的谈话出了问题。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: null,
      text: '上课途中，穿着宇宙服的菈菈突然闯进教室，把你一路拉到空教室。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'serious',
        effect: 'flash',
      },
    },
    {
      speaker: '你',
      text: '昨晚的话伤到你，是我的错。我真正害怕的是婚后被要求指挥战争，不是你的料理，也不是你。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'worried',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '原来是这个！戴比路克有很多将军和提督，爸爸最近也不亲自上前线。结婚后我本来就想留在地球呀。',
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
      text: '菈菈握住你的手。她仍把“喜欢的女朋友亲手做饭”理解成了一句笨拙的喜欢。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'shy',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '所以我去宇宙找了真正的食材！这次一定能做出你喜欢的料理。',
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
      text: '春菜循声找来，正听见“喜欢的女朋友”。你立刻说明那不是已经确定的关系，菈菈却拿出冰冰凉凉容器君。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'shy',
        effect: 'none',
      },
    },
    {
      speaker: '菈菈',
      text: '它里面什么都装得下，还能一直冷冻。仙女座大章鱼也很新鲜哦！',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'lala',
        portraitId: 'arrival-default',
        expressionId: 'happy',
        effect: 'shake',
      },
    },
    {
      speaker: null,
      text: '容器盖猛地弹开，一条巨大的触手撞上天花板。空教室里的解释被真正的宇宙食材打断。',
      presentation: {
        sceneId: 'school',
        focusCharacterId: 'haruna',
        portraitId: 'school-uniform',
        expressionId: 'panic',
        effect: 'shake',
      },
    },
  ],
} as const satisfies StoryEpisodeActDefinition;
