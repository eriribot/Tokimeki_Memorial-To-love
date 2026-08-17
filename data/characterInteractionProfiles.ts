export const CHARACTER_INTERACTION_PROFILE_VERSION = 'tolove-local-v1' as const;

export type CharacterInteractionActionId = 'talk' | 'observe' | 'together' | 'closer';
export type CharacterInteractionSpeaker = 'narrator' | 'user' | 'character';

export interface CharacterInteractionBeat {
  speaker: CharacterInteractionSpeaker;
  text: string;
}

export interface CharacterInteractionSequence {
  id: string;
  beats: readonly CharacterInteractionBeat[];
}

export interface CharacterTalkTopic extends CharacterInteractionSequence {
  label: string;
}

export interface CharacterInteractionProfile {
  characterId: string;
  version: string;
  talkTopics: readonly CharacterTalkTopic[];
  observeSequences: readonly CharacterInteractionSequence[];
  togetherSequences: readonly CharacterInteractionSequence[];
  closerSequences: readonly CharacterInteractionSequence[];
}

export interface CharacterInteractionSeedContext {
  date: {
    year: number;
    month: number;
    day: number;
  };
  phase: string;
  locationId: string;
  characterId: string;
  action: CharacterInteractionActionId;
  version: string;
}

export interface TalkTopicSelectionContext {
  date: CharacterInteractionSeedContext['date'];
  phase: string;
  locationId: string;
  characterId: string;
}

export interface CharacterInteractionInterpolationValues {
  user: string;
  char: string;
  location: string;
}

export interface CharacterInteractionFallbackSource {
  greeting?: string;
  alternateGreetings?: readonly string[];
}

export interface CharacterInteractionProfileValidationIssue {
  path: string;
  message: string;
}

export interface CharacterInteractionProfileValidationResult {
  valid: boolean;
  issues: readonly CharacterInteractionProfileValidationIssue[];
}

const narrator = (text: string): CharacterInteractionBeat => ({ speaker: 'narrator', text });
const user = (text: string): CharacterInteractionBeat => ({ speaker: 'user', text });
const character = (text: string): CharacterInteractionBeat => ({ speaker: 'character', text });

const topic = (id: string, label: string, beats: readonly CharacterInteractionBeat[]): CharacterTalkTopic => ({
  id,
  label,
  beats,
});

const sequence = (id: string, beats: readonly CharacterInteractionBeat[]): CharacterInteractionSequence => ({
  id,
  beats,
});

const rikoProfile: CharacterInteractionProfile = {
  characterId: 'riko',
  version: CHARACTER_INTERACTION_PROFILE_VERSION,
  talkTopics: [
    topic('riko-talk-books', '摇摇欲坠的书', [
      narrator('{{char}}抱着一摞几乎挡住视线的书走进{{location}}，最上面那本正危险地探出半截。'),
      user('我来拿一半吧，再这样走下去肯定会掉。'),
      character('你来得正好。先说清楚，我可不是特意等你的……小心左边！'),
      narrator('一块橡皮恰好滚到脚边，两个人同时向右躲开。书保住了，{{char}}却红着脸催{{user}}赶快看路。'),
    ]),
    topic('riko-talk-lunch', '多出来的午饭', [
      narrator('{{location}}里飘来淡淡的便当香气，{{char}}若无其事地把第二双筷子压在盒盖下面。'),
      user('这个分量不像是一个人能吃完的。'),
      character('只是早上不小心做多了。你要是浪费食物，我才不会原谅你。'),
      narrator('风把餐巾吹到{{user}}头上，{{char}}忍了两秒，最后还是笑出了声。'),
    ]),
    topic('riko-talk-sky', '头顶的可疑动静', [
      narrator('{{location}}上方传来一声闷响，{{char}}立刻抬头确认四周。'),
      user('放心吧，今天应该不会再有东西从天上掉下来。'),
      character('这种台词从你嘴里说出来，反而更让人不放心。'),
      narrator('话音刚落，一只软球准确落进{{user}}怀里。{{char}}扶着额头，像是早已料到结局。'),
    ]),
    topic('riko-talk-tidying', '收拾残局', [
      narrator('{{char}}正在把{{location}}里散乱的东西一件件归位，动作熟练得像已经处理过无数次事故。'),
      user('你真的很会照顾人。'),
      character('我只是看不下去而已。还有，那边不是夸人的地方，是扫把的位置。'),
      narrator('{{user}}刚把扫把递过去，粉笔盒又从架上滑下来；两人同时接住它，默契得让{{char}}一时说不出吐槽。'),
    ]),
  ],
  observeSequences: [
    sequence('riko-observe-practical', [
      narrator('{{char}}看似在休息，目光却一直留意{{location}}里摇晃的书堆和没有关好的窗。'),
      narrator('她对空泛的奉承反应不大，但似乎很欢迎能实际帮上忙的人。'),
      character('……你从刚才起在看什么？有空的话就来扶一下这边。'),
    ]),
  ],
  togetherSequences: [
    sequence('riko-together-carry', [
      narrator('{{user}}和{{char}}一起搬运{{location}}里的资料，最初一切都井井有条。'),
      character('照这个速度，很快就能结束。等等，后面那辆推车怎么自己动了？'),
      user('先扶住箱子，我去拦！'),
      narrator('两人一左一右挡住推车，纸张却像庆祝成功似的撒了一地。{{char}}叹着气蹲下，嘴角仍带着一点笑意。'),
    ]),
  ],
  closerSequences: [
    sequence('riko-closer-same-page', [
      narrator('一张记录纸从桌边滑落，{{user}}和{{char}}同时伸手，指尖停在同一页的两端。'),
      character('你、你拿那一边就好。别突然靠这么近。'),
      user('明白。那就一起把它放回去。'),
      narrator('{{char}}没有松手，只是把视线移向别处，和{{user}}并肩走完了短短几步。'),
    ]),
  ],
};

const harunaProfile: CharacterInteractionProfile = {
  characterId: 'haruna',
  version: CHARACTER_INTERACTION_PROFILE_VERSION,
  talkTopics: [
    topic('haruna-talk-homework', '今天的作业', [
      narrator('{{char}}在{{location}}翻开作业本，夹在里面的便签像小旗子一样冒出一排。'),
      user('需要一起核对答案吗？'),
      character('好呀，不过只能核对思路，直接抄答案可不行。'),
      narrator('{{user}}刚点头，一张便签就粘到了额头上。{{char}}小声提醒，却因为忍笑而把一句话说了三遍。'),
    ]),
    topic('haruna-talk-maron', '马隆的散步', [
      narrator('谈到周末时，{{char}}的神情明显放松下来。'),
      user('马隆最近还会在散步时突然往前冲吗？'),
      character('会哦。它一看到喜欢的人，就完全拉不住……咦，我不是在暗示什么！'),
      narrator('{{char}}慌忙摆手，书页被带起的风翻了好几张，她只好低头重新找刚才的位置。'),
    ]),
    topic('haruna-talk-tennis', '网球部的话题', [
      narrator('{{location}}附近传来球落地的轻响，{{char}}下意识做了一个接球动作。'),
      user('你的反应很快，最近也在练习吗？'),
      character('只是偶尔去帮忙。要是{{user}}想学，我可以先教最基础的握拍。'),
      narrator('一颗不知道从哪滚来的球停在两人中间，像是在替这个提议盖章。'),
    ]),
    topic('haruna-talk-noise', '绝对不是怪谈', [
      narrator('{{location}}深处忽然响起轻轻的“咚”声，{{char}}的肩膀明显抖了一下。'),
      user('要不要一起去看看？'),
      character('我、我没有害怕，只是觉得两个人确认会比较有效率。'),
      narrator('声音的来源只是一把倒下的扫帚。{{char}}松了口气，又认真拜托{{user}}别把刚才的反应说出去。'),
    ]),
  ],
  observeSequences: [
    sequence('haruna-observe-gentle', [
      narrator('{{char}}抱着几本作业册站在{{location}}，每当有人经过都会先让出一点位置。'),
      narrator('她似乎不擅长主动求助，但会记住别人不动声色的体贴。'),
      character('{{user}}？如果你也要往那边走，我们可以一起。'),
    ]),
  ],
  togetherSequences: [
    sequence('haruna-together-notebooks', [
      narrator('{{user}}接过一半作业本，与{{char}}并肩穿过{{location}}。'),
      character('谢谢，这样轻松多了。前面的门好像要开——'),
      narrator('两个人同时往同一边避让，又同时换到另一边，像排练了一段笨拙的舞步。'),
      character('噗……这次我们数一、二、三再走吧。'),
    ]),
  ],
  closerSequences: [
    sequence('haruna-closer-quiet-seat', [
      narrator('{{location}}只剩一个不太宽的位置，{{char}}轻轻往旁边挪了挪。'),
      character('坐这里也可以。只要……不要突然吓我就好。'),
      user('那我保证先打招呼。'),
      narrator('两人安静地坐了一会儿。偶尔碰到的衣袖让{{char}}微微脸红，却没有再次拉开距离。'),
    ]),
  ],
};

const lalaProfile: CharacterInteractionProfile = {
  characterId: 'lala',
  version: CHARACTER_INTERACTION_PROFILE_VERSION,
  talkTopics: [
    topic('lala-talk-invention', '新发明试运行', [
      narrator('{{char}}把一个闪着彩灯的小装置举到{{user}}面前，{{location}}顿时响起过分欢快的提示音。'),
      user('这次的功能是什么？'),
      character('它会把心里想说的话变成漂亮的图案！大概不会爆炸啦。'),
      narrator('装置喷出一串肥皂泡，每个泡泡里都写着“肚子饿了”。{{char}}认真点头，宣布测试非常成功。'),
    ]),
    topic('lala-talk-earth', '地球学校观察', [
      narrator('{{char}}兴致勃勃地记录{{location}}里每一件在地球人看来很普通的东西。'),
      user('连自动贩卖机也值得研究吗？'),
      character('当然！按一下就会掉出饮料，简直像小型传送装置。'),
      narrator('她按得太快，两罐饮料同时落下。{{user}}及时接住，{{char}}则把这称为“隐藏奖励”。'),
    ]),
    topic('lala-talk-lunch', '戴比路克式午餐', [
      narrator('{{char}}打开一个外形可疑的饭盒，里面的配菜整齐得反而令人不安。'),
      user('这些东西……不会动吧？'),
      character('放心，今天的午饭很普通！我特意关闭了自动逃跑功能。'),
      narrator('饭盒立刻长出小轮子滑走半米。{{char}}追上去按住它，还回头对{{user}}露出“只差一点”的灿烂笑容。'),
    ]),
    topic('lala-talk-stars', '故乡的星空', [
      narrator('说起夜空时，{{char}}用手指在{{location}}的窗面上画出陌生的星座。'),
      user('你会想念戴比路克吗？'),
      character('会呀。不过在地球也认识了{{user}}和大家，所以每天都很开心！'),
      narrator('她画下的最后一颗星突然从便携投影器里蹦出来，绕着两人转了一圈才消失。'),
    ]),
  ],
  observeSequences: [
    sequence('lala-observe-curious', [
      narrator('{{char}}正在研究{{location}}里最不起眼的设施，眼睛却像发现宝藏一样发亮。'),
      narrator('她似乎最喜欢新鲜事物，也完全不介意有人陪她一起试错。'),
      character('{{user}}，快来看！我发现了一个非常有地球特色的按钮！'),
    ]),
  ],
  togetherSequences: [
    sequence('lala-together-test', [
      narrator('{{user}}答应陪{{char}}测试新装置，两人按照说明同时按下开关。'),
      character('三、二、一——启动！'),
      narrator('装置没有爆炸，只是把{{location}}上空变成了一场彩带雨，还给{{user}}戴上了会鼓掌的纸帽。'),
      character('太好了，安全功能和庆祝功能都正常！'),
    ]),
  ],
  closerSequences: [
    sequence('lala-closer-heart-projector', [
      narrator('{{user}}和{{char}}同时伸手去关掉仍在鸣叫的装置，手背轻轻碰在一起。'),
      character('咦？它好像把这个也当成输入了。'),
      narrator('墙上立刻投出两个乱转的心形图案。{{user}}还没想好怎么解释，{{char}}已经开心地研究起投影角度。'),
      character('嘿嘿，这个效果很可爱，就先保留下来吧！'),
    ]),
  ],
};

const yamiProfile: CharacterInteractionProfile = {
  characterId: 'yami',
  version: CHARACTER_INTERACTION_PROFILE_VERSION,
  talkTopics: [
    topic('yami-talk-books', '正在读的书', [
      narrator('{{char}}在{{location}}翻过一页书，书签稳稳停在手边。'),
      user('这本好看吗？我也想找点东西读。'),
      character('还可以。至少比无意义的吵闹安静。你要借的话，先从第一卷开始。'),
      narrator('她把书名写给{{user}}，字迹小而整齐，随后若无其事地把同系列第二卷也推了过来。'),
    ]),
    topic('yami-talk-taiyaki', '鲷鱼烧的选择', [
      narrator('{{location}}附近飘来甜香，{{char}}的视线只停顿了短短一瞬。'),
      user('红豆馅和奶油馅，你会选哪种？'),
      character('红豆。这个问题没有犹豫的必要。'),
      narrator('{{user}}刚点头，纸袋底部便裂开一道小口。{{char}}迅速接住鲷鱼烧，神情比处理危机时还认真。'),
    ]),
    topic('yami-talk-quiet', '安静的地方', [
      narrator('{{location}}难得没有喧闹声，{{char}}似乎很满意这段平静。'),
      user('我坐远一点，不打扰你。'),
      character('……不必那么远。只要保持安静就可以。'),
      narrator('{{user}}刚坐下，椅子却发出夸张的吱呀声。{{char}}抬眼看了一秒，把一张折好的纸垫递了过来。'),
    ]),
    topic('yami-talk-cat', '路过的小猫', [
      narrator('一只小猫从{{location}}边缘探出脑袋，谨慎地观察两人。'),
      user('它好像不怕你。'),
      character('动物通常比人类更懂得保持适当距离。'),
      narrator('小猫下一秒便蹭上她的鞋尖。{{char}}沉默片刻，还是俯身轻轻摸了摸它的头。'),
    ]),
  ],
  observeSequences: [
    sequence('yami-observe-distance', [
      narrator('{{char}}看似只专注于书页，周围每一次脚步声却都没有逃过她的注意。'),
      narrator('贸然靠近会让她戒备；安静陪伴，或谈起书和鲷鱼烧，似乎更合适。'),
      character('{{user}}，如果没有事，就不要一直盯着我。'),
    ]),
  ],
  togetherSequences: [
    sequence('yami-together-shelf', [
      narrator('{{user}}和{{char}}一起整理{{location}}的书架，一本厚书忽然从高处滑落。'),
      user('小心！'),
      narrator('{{char}}的发梢瞬间伸长，稳稳托住书脊，又若无其事地恢复原状。'),
      character('只是一本书，不必那么紧张。……不过，谢谢提醒。'),
    ]),
  ],
  closerSequences: [
    sequence('yami-closer-bookmark', [
      narrator('{{user}}递出一枚简单的书签，停在不会侵入{{char}}距离的位置。'),
      user('看到这个时觉得很适合你。不要的话也没关系。'),
      character('我没有说不要。'),
      narrator('{{char}}接过书签夹进正在读的那一页，沉默了一会儿，又把身旁的位置让出了少许。'),
    ]),
  ],
};

const yuiProfile: CharacterInteractionProfile = {
  characterId: 'yui',
  version: CHARACTER_INTERACTION_PROFILE_VERSION,
  talkTopics: [
    topic('yui-talk-rules', '风纪检查', [
      narrator('{{char}}拿着检查表巡视{{location}}，每一个勾都画得端端正正。'),
      user('今天这里有什么需要注意的吗？'),
      character('先从不在走廊奔跑开始。还有，你领口那里——算了，站好。'),
      narrator('{{user}}立刻立正，反而把背后的告示碰歪了。{{char}}闭了闭眼，和{{user}}一起把它扶正。'),
    ]),
    topic('yui-talk-cat', '猫只是刚好路过', [
      narrator('一张猫咪用品的传单从{{char}}书里露出一角，她飞快地把它按了回去。'),
      user('原来你喜欢猫？'),
      character('只是为了确认商品宣传有没有夸大！和喜不喜欢没有关系。'),
      narrator('传单上的猫爪折页弹出来贴在她袖口，{{char}}一本正经的说明因此少了几分说服力。'),
    ]),
    topic('yui-talk-study', '认真复习', [
      narrator('{{char}}在{{location}}整理复习提纲，标题下面连标点都排列得很整齐。'),
      user('这份笔记能借我参考吗？'),
      character('可以，但你必须自己重新归纳。学习不是把别人的努力照搬一遍。'),
      narrator('{{user}}郑重点头，却发现她递来的第一页写着“首先改掉粗心”。{{char}}轻咳一声，假装那只是普通标题。'),
    ]),
    topic('yui-talk-gadget', '可疑装置报告', [
      narrator('{{location}}角落里传来不明装置的滴答声，{{char}}已经摆出了审问证物的架势。'),
      user('我保证这不是我放的。'),
      character('我还什么都没问，你为什么先心虚？'),
      narrator('装置忽然弹出一面写着“午休提醒”的小旗。{{char}}沉默两秒，把报告标题从“危险物”改成了“管理不当”。'),
    ]),
  ],
  observeSequences: [
    sequence('yui-observe-diligent', [
      narrator('{{char}}嘴上严格，巡查时却顺手扶正椅子，还把遗落的东西分门别类放好。'),
      narrator('比起敷衍讨好，她似乎更认可守规矩、愿意承担责任的人。'),
      character('{{user}}，别站在那里发呆。看见歪掉的牌子就一起整理。'),
    ]),
  ],
  togetherSequences: [
    sequence('yui-together-notices', [
      narrator('{{user}}帮{{char}}在{{location}}张贴风纪告示，最后一张刚贴好便被穿堂风卷走。'),
      character('等等，那是今天最重要的一张！'),
      user('我去左边，你守住右边！'),
      narrator('两人合作截住告示，它却正好贴到{{user}}背上。{{char}}想要训人，最后只无奈地笑了一下。'),
    ]),
  ],
  closerSequences: [
    sequence('yui-closer-steady', [
      narrator('{{user}}后退时踩到散落的纸张，{{char}}下意识抓住了{{user}}的袖口。'),
      character('走路看前面！我只是为了避免你撞坏公共物品。'),
      user('谢谢，我会注意。你可以先松手了。'),
      narrator('{{char}}这才发现自己仍抓着袖口，立刻放开并转身整理纸张，耳尖却悄悄红了。'),
    ]),
  ],
};

const momoProfile: CharacterInteractionProfile = {
  characterId: 'momo',
  version: CHARACTER_INTERACTION_PROFILE_VERSION,
  talkTopics: [
    topic('momo-talk-plants', '植物的悄悄话', [
      narrator('{{char}}俯身检查{{location}}旁的盆栽，叶片在没有风的地方轻轻晃了晃。'),
      user('它们真的会告诉你发生了什么？'),
      character('当然。比如这孩子说，{{user}}已经在旁边犹豫很久了。'),
      narrator('叶片像附和似的点了两下，{{user}}一时分不清这是植物的意思，还是{{char}}早就安排好的效果。'),
    ]),
    topic('momo-talk-sisters', '姐姐们的近况', [
      narrator('提到姐妹时，{{char}}露出既无奈又开心的微笑。'),
      user('今天大家也很热闹吗？'),
      character('姐姐们一直都很有精神。只要稍微引导一下，就会发生很有趣的事哦。'),
      narrator('远处恰好传来一声夸张的响动。{{char}}端起茶杯，神情平静得像已经提前看过剧本。'),
    ]),
    topic('momo-talk-plan', '写满箭头的计划纸', [
      narrator('{{char}}合上一本画满箭头和爱心的笔记，动作自然得让人更想知道内容。'),
      user('那是什么计划？'),
      character('只是让大家都能幸福的小安排。现在告诉{{user}}就没有惊喜了。'),
      narrator('一张便签从本子里飘出，上面只写着“偶遇成功”。{{char}}笑着把它收回，完全没有解释。'),
    ]),
    topic('momo-talk-flower', '适合今天的花', [
      narrator('{{char}}从花篮里挑出一朵颜色柔和的小花，在{{user}}面前轻轻转了转。'),
      user('它有什么特别的含义吗？'),
      character('含义要由收到的人自己发现。先放在你这里，好吗？'),
      narrator('花茎忽然弯出一个小小的心形。{{char}}惊讶得恰到好处，仿佛这真的只是巧合。'),
    ]),
  ],
  observeSequences: [
    sequence('momo-observe-planner', [
      narrator('{{char}}看似悠闲地照料植物，视线却把{{location}}里每个人的动向都收进眼底。'),
      narrator('她喜欢坦率的回应，也很擅长把普通偶遇变成早有准备的“巧合”。'),
      character('呵呵，{{user}}终于注意到我了吗？那么接下来就容易多了。'),
    ]),
  ],
  togetherSequences: [
    sequence('momo-together-watering', [
      narrator('{{user}}帮{{char}}给{{location}}的植物浇水，水管一开始十分听话。'),
      character('再往左一点。对，就是那里——小心。'),
      narrator('喷头突然转向，把两人的鞋尖淋得湿透，旁边的花却开心地一齐抬起叶子。'),
      character('看来这些孩子很喜欢我们一起工作呢。'),
    ]),
  ],
  closerSequences: [
    sequence('momo-closer-vine', [
      narrator('一根细藤从花架边悄悄伸来，把{{user}}与{{char}}的衣袖松松绕在一起。'),
      user('这是植物自己的主意？'),
      character('当然呀。我可什么都没做。'),
      narrator('{{char}}没有急着解开藤蔓，只带着若有所思的笑容与{{user}}并肩站了一会儿。'),
    ]),
  ],
};

export const CHARACTER_INTERACTION_PROFILES: Readonly<Record<string, CharacterInteractionProfile>> = Object.freeze({
  riko: rikoProfile,
  haruna: harunaProfile,
  lala: lalaProfile,
  yami: yamiProfile,
  yui: yuiProfile,
  momo: momoProfile,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateSequence(
  value: unknown,
  path: string,
  issues: CharacterInteractionProfileValidationIssue[],
  requireLabel: boolean,
): void {
  if (!isRecord(value)) {
    issues.push({ path, message: '必须是对象。' });
    return;
  }
  if (!isNonEmptyString(value.id)) issues.push({ path: `${path}.id`, message: '必须是非空字符串。' });
  if (requireLabel && !isNonEmptyString(value.label)) {
    issues.push({ path: `${path}.label`, message: '必须是非空字符串。' });
  }
  if (!Array.isArray(value.beats)) {
    issues.push({ path: `${path}.beats`, message: '必须是数组。' });
    return;
  }
  if (value.beats.length < 3 || value.beats.length > 5) {
    issues.push({ path: `${path}.beats`, message: '必须包含 3 至 5 个 beat。' });
  }
  value.beats.forEach((beat, index) => {
    const beatPath = `${path}.beats[${index}]`;
    if (!isRecord(beat)) {
      issues.push({ path: beatPath, message: '必须是对象。' });
      return;
    }
    if (beat.speaker !== 'narrator' && beat.speaker !== 'user' && beat.speaker !== 'character') {
      issues.push({ path: `${beatPath}.speaker`, message: '不是支持的说话者。' });
    }
    if (!isNonEmptyString(beat.text)) {
      issues.push({ path: `${beatPath}.text`, message: '必须是非空字符串。' });
    }
  });
}

export function validateCharacterInteractionProfile(value: unknown): CharacterInteractionProfileValidationResult {
  const issues: CharacterInteractionProfileValidationIssue[] = [];
  if (!isRecord(value)) return { valid: false, issues: [{ path: '$', message: '互动包必须是对象。' }] };

  if (!isNonEmptyString(value.characterId)) {
    issues.push({ path: '$.characterId', message: '必须是非空字符串。' });
  }
  if (!isNonEmptyString(value.version)) issues.push({ path: '$.version', message: '必须是非空字符串。' });

  const pools: Array<{
    key: 'talkTopics' | 'observeSequences' | 'togetherSequences' | 'closerSequences';
    minimum: number;
    requireLabel: boolean;
  }> = [
    { key: 'talkTopics', minimum: 4, requireLabel: true },
    { key: 'observeSequences', minimum: 1, requireLabel: false },
    { key: 'togetherSequences', minimum: 1, requireLabel: false },
    { key: 'closerSequences', minimum: 1, requireLabel: false },
  ];
  const seenIds = new Set<string>();

  for (const pool of pools) {
    const entries = value[pool.key];
    if (!Array.isArray(entries)) {
      issues.push({ path: `$.${pool.key}`, message: '必须是数组。' });
      continue;
    }
    if (entries.length < pool.minimum) {
      issues.push({ path: `$.${pool.key}`, message: `至少需要 ${pool.minimum} 个条目。` });
    }
    entries.forEach((entry, index) => {
      const path = `$.${pool.key}[${index}]`;
      validateSequence(entry, path, issues, pool.requireLabel);
      if (!isRecord(entry) || !isNonEmptyString(entry.id)) return;
      if (seenIds.has(entry.id)) issues.push({ path: `${path}.id`, message: '互动包内的 id 必须唯一。' });
      seenIds.add(entry.id);
    });
  }

  return { valid: issues.length === 0, issues };
}

export function isCharacterInteractionProfile(value: unknown): value is CharacterInteractionProfile {
  return validateCharacterInteractionProfile(value).valid;
}

export function assertCharacterInteractionProfile(value: unknown): asserts value is CharacterInteractionProfile {
  const validation = validateCharacterInteractionProfile(value);
  if (!validation.valid) {
    const details = validation.issues.map(issue => `${issue.path}: ${issue.message}`).join('\n');
    throw new Error(`角色互动包结构无效：\n${details}`);
  }
}

function formatSeedDate(date: CharacterInteractionSeedContext['date']): string {
  const values = [date.year, date.month, date.day];
  if (!values.every(Number.isInteger)) throw new Error('互动抽取日期必须由整数构成。');
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

export function createCharacterInteractionSeed(context: CharacterInteractionSeedContext): string {
  const tokens = [context.phase, context.locationId, context.characterId, context.action, context.version];
  if (!tokens.every(isNonEmptyString)) throw new Error('互动抽取上下文不能包含空标识。');
  return [formatSeedDate(context.date), ...tokens].join('|');
}

export function hashCharacterInteractionText(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function compareText(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function selectStableTalkTopics(
  profile: CharacterInteractionProfile,
  context: TalkTopicSelectionContext,
  count = 3,
): CharacterTalkTopic[] {
  assertCharacterInteractionProfile(profile);
  const requestedCount = Math.trunc(count);
  if (!Number.isFinite(count) || requestedCount < 0) throw new Error('话题抽取数量必须是非负有限数字。');

  const seed = createCharacterInteractionSeed({
    ...context,
    action: 'talk',
    version: profile.version,
  });
  return profile.talkTopics
    .map(entry => ({ entry, score: hashCharacterInteractionText(`${seed}|${entry.id}`) }))
    .sort((left, right) => left.score - right.score || compareText(left.entry.id, right.entry.id))
    .slice(0, Math.min(requestedCount, profile.talkTopics.length))
    .map(candidate => candidate.entry);
}

const INTERPOLATION_PATTERN = /\{\{(user|char|location)\}\}/gu;

export function interpolateCharacterInteractionText(
  template: string,
  values: CharacterInteractionInterpolationValues,
): string {
  return template.replace(INTERPOLATION_PATTERN, (_match, key: keyof CharacterInteractionInterpolationValues) => {
    return values[key];
  });
}

export function interpolateCharacterInteractionSequence<T extends CharacterInteractionSequence>(
  source: T,
  values: CharacterInteractionInterpolationValues,
): T {
  return {
    ...source,
    ...('label' in source && typeof source.label === 'string'
      ? { label: interpolateCharacterInteractionText(source.label, values) }
      : {}),
    beats: source.beats.map(beat => ({
      ...beat,
      text: interpolateCharacterInteractionText(beat.text, values),
    })),
  } as T;
}

function readFallbackLines(source: CharacterInteractionFallbackSource): string[] {
  return [source.greeting, ...(source.alternateGreetings ?? [])].flatMap(line => {
    if (typeof line !== 'string') return [];
    const normalized = line.trim();
    return normalized ? [normalized] : [];
  });
}

function fallbackLine(lines: readonly string[], index: number, defaultLine: string): string {
  return lines[index] ?? defaultLine;
}

export function createFallbackCharacterInteractionProfile(
  characterId: string,
  source: CharacterInteractionFallbackSource = {},
): CharacterInteractionProfile {
  if (!isNonEmptyString(characterId)) throw new Error('未知角色互动包需要非空 characterId。');
  const lines = readFallbackLines(source);
  const prefix = `fallback-${hashCharacterInteractionText(characterId).toString(16)}`;
  const profile: CharacterInteractionProfile = {
    characterId,
    version: CHARACTER_INTERACTION_PROFILE_VERSION,
    talkTopics: [
      topic(`${prefix}-talk-greeting`, '打个招呼', [
        narrator('{{user}}在{{location}}向{{char}}打了招呼。'),
        user('今天过得怎么样？'),
        character(fallbackLine(lines, 0, '还不错。没想到会在这里遇见{{user}}。')),
        narrator('简短的问候让原本有些拘谨的气氛放松下来。'),
      ]),
      topic(`${prefix}-talk-location`, '聊聊这里', [
        narrator('{{user}}和{{char}}一起看了看{{location}}四周。'),
        user('你经常来这里吗？'),
        character(fallbackLine(lines, 1, '偶尔会来。这里有种让人慢下来的感觉。')),
        narrator('两人顺着这个话题聊了几句，也发现了先前没有注意到的小细节。'),
      ]),
      topic(`${prefix}-talk-interest`, '最近的兴趣', [
        narrator('{{location}}暂时安静下来，正适合聊些轻松的话题。'),
        user('你最近有没有特别在意的事？'),
        character(fallbackLine(lines, 2, '有一些，不过现在还不能把答案全部告诉你。')),
        narrator('{{char}}留下了一点悬念，反而让这段普通谈话变得更有趣。'),
      ]),
      topic(`${prefix}-talk-plan`, '之后的安排', [
        narrator('{{user}}注意到{{char}}似乎正准备离开{{location}}。'),
        user('接下来还有安排吗？'),
        character(fallbackLine(lines, 3, '还有一点事情要做。下次有空时再慢慢聊吧。')),
        narrator('一个差点被碰倒的小物件打断了告别，两人手忙脚乱地扶稳它，相视笑了起来。'),
      ]),
    ],
    observeSequences: [
      sequence(`${prefix}-observe`, [
        narrator('{{char}}留意着{{location}}周围的动静，看起来并不排斥有人来搭话。'),
        narrator('从神情判断，选择轻松而具体的话题会比较自然。'),
        character('{{user}}，你是不是有什么话想说？'),
      ]),
    ],
    togetherSequences: [
      sequence(`${prefix}-together`, [
        narrator('{{user}}提出一起处理{{location}}里的一件小事，{{char}}点头答应了。'),
        character('那就分工吧。你负责那边，我从这里开始。'),
        narrator('过程里出了一个无伤大雅的小岔子，两人互相提醒，很快便把事情收拾妥当。'),
        character('配合得不错。下次也可以找我。'),
      ]),
    ],
    closerSequences: [
      sequence(`${prefix}-closer`, [
        narrator('{{user}}没有贸然靠近，只把一件需要递交的小东西放在{{char}}容易接到的位置。'),
        user('这个给你。不方便的话，放在这里也可以。'),
        character('谢谢。你还挺细心的。'),
        narrator('{{char}}收下东西后没有立刻离开，两人之间的距离自然缩短了一点。'),
      ]),
    ],
  };
  assertCharacterInteractionProfile(profile);
  return profile;
}

export function resolveCharacterInteractionProfile(
  characterId: string,
  fallbackSource: CharacterInteractionFallbackSource = {},
): CharacterInteractionProfile {
  return (
    CHARACTER_INTERACTION_PROFILES[characterId] ??
    createFallbackCharacterInteractionProfile(characterId, fallbackSource)
  );
}
