export type SkillCategory = '运动' | '沟通' | '学问' | '课外活动' | '其他' | '上位';

export type SkillAcquisition = 'experience' | 'license';

export interface Skill {
  id: string;
  name: string;
  originalName: string;
  category: SkillCategory;
  cost: number;
  description: string;
  rating?: string;
  /** Every listed prerequisite is required. */
  prerequisites: string[];
  acquisition: SkillAcquisition;
  triggerCondition?: string;
  triggerRate?: string;
  effects: SkillEffect[];
  isAdvanced?: boolean;
  isLicense?: boolean;
}

export interface SkillEffect {
  type:
    | 'stat_boost'
    | 'stat_reduce'
    | 'success_rate'
    | 'trigger_rate'
    | 'heal'
    | 'moral'
    | 'special'
    | 'command_seal'
    | 'damage_reduce'
    | 'exp_boost';
  target?: string;
  value?: string;
  description: string;
}

export interface SkillCombo {
  name: string;
  description: string;
  skills: string[];
  totalCost: number;
  rating: string;
  type: 'stable' | 'burst' | 'date' | 'study' | 'sports' | 'custom';
}

export const categories = [
  { id: '运动', color: '#E74C3C', icon: '⚡', bgColor: 'from-red-500/20 to-orange-500/20' },
  { id: '沟通', color: '#3498DB', icon: '💬', bgColor: 'from-blue-500/20 to-cyan-500/20' },
  { id: '学问', color: '#9B59B6', icon: '📚', bgColor: 'from-purple-500/20 to-pink-500/20' },
  { id: '课外活动', color: '#27AE60', icon: '🎯', bgColor: 'from-green-500/20 to-emerald-500/20' },
  { id: '其他', color: '#F39C12', icon: '⭐', bgColor: 'from-yellow-500/20 to-amber-500/20' },
  { id: '上位', color: '#E67E22', icon: '👑', bgColor: 'from-orange-500/20 to-red-500/20' },
] as const;

type SkillOptions = Partial<
  Pick<Skill, 'acquisition' | 'triggerCondition' | 'triggerRate' | 'isAdvanced' | 'isLicense'>
>;

function defineSkill(
  id: string,
  name: string,
  originalName: string,
  category: SkillCategory,
  cost: number,
  prerequisites: string[],
  description: string,
  options: SkillOptions = {},
): Skill {
  return {
    id,
    name,
    originalName,
    category,
    cost,
    description,
    prerequisites,
    acquisition: options.acquisition ?? 'experience',
    effects: [{ type: 'special', description }],
    ...options,
  };
}

// Data order and costs follow Gameline's six Tokimeki Memorial 4 skill tables.
// FC2's 2009 table is a cross-check; prerequisites are restored only when multiple sources support the relationship.
export const skills: Skill[] = [
  // 运动（25）
  defineSkill('basic_stamina', '基础体力', '基礎体力', '运动', 10, [], '执行指令时体调消耗减少。'),
  defineSkill('reflex', '反射神经', '反射神経', '运动', 10, [], '运动能力提高。'),
  defineSkill('perseverance', '根气力', '根気力', '运动', 10, [], '根性能力提高。'),
  defineSkill('frail', '病弱', '病弱', '运动', 10, [], '更容易生病，但女生更容易前来探病。'),
  defineSkill('anti_neurosis', '抗神经衰弱', '抗ノイローゼ', '运动', 10, [], '降低陷入神经衰弱的可能。'),
  defineSkill('tenacity', '顽强', '頑強', '运动', 20, ['basic_stamina'], '降低受伤的可能。'),
  defineSkill('anti_virus', '抗病毒', '抗ウィルス', '运动', 20, ['basic_stamina'], '降低生病的可能。'),
  defineSkill(
    'sports_sense',
    '运动天赋',
    '運動センス',
    '运动',
    20,
    ['basic_stamina', 'reflex'],
    '进一步提高运动能力。',
  ),
  defineSkill(
    'guts_system',
    '体力派',
    'ガテン系',
    '运动',
    20,
    ['reflex', 'perseverance'],
    '运动与根性的成长增加，其他能力成长减少。',
  ),
  defineSkill('unyielding', '不屈毅力', '不屈の根性', '运动', 20, ['perseverance'], '进一步提高根性能力。'),
  defineSkill('stretch', '拉伸术', 'ストレッチ術', '运动', 20, ['frail'], '休养时恢复更多体调。'),
  defineSkill('stalwart', '精悍', '精悍', '运动', 30, ['tenacity'], '减少体调消耗，并降低受伤的可能。'),
  defineSkill('perfect_virus', '绝对抗病毒', '絶ウィルス', '运动', 30, ['anti_virus'], '大幅降低生病的可能。'),
  defineSkill('sportsman', '运动健将', 'スポーツマン', '运动', 30, ['sports_sense'], '执行运动指令时运动更易成长。'),
  defineSkill(
    'club_demon',
    '社团之鬼',
    '部活の鬼',
    '运动',
    30,
    ['sports_sense'],
    '运动部经验更易增长，但体调消耗增加。',
  ),
  defineSkill('belief', '信念', '信念', '运动', 30, ['unyielding'], '执行运动指令时根性更易成长。'),
  defineSkill('comeback', '康复术', '復帰術', '运动', 30, ['stretch'], '疾病、受伤和神经衰弱更容易痊愈。'),
  defineSkill(
    'perfect_neurosis',
    '绝对抗神经衰弱',
    '絶ノイローゼ',
    '运动',
    30,
    ['anti_neurosis'],
    '大幅降低陷入神经衰弱的可能。',
  ),
  defineSkill(
    'tough_guy',
    '硬汉',
    'タフガイ',
    '运动',
    40,
    ['stalwart', 'perfect_virus'],
    '减少体调消耗，并大幅降低受伤的可能。',
  ),
  defineSkill('fighting_spirit', '格斗家之魂', '格闘家魂', '运动', 40, ['sportsman'], '战斗时强化运动与根性。'),
  defineSkill(
    'water_god',
    '水神',
    '水神',
    '运动',
    40,
    ['sportsman'],
    '游泳大会时强化运动与根性，也更容易邀请女生去泳池或海边。',
  ),
  defineSkill(
    'sports_ace',
    '运动部王牌',
    '運動部エース',
    '运动',
    40,
    ['sportsman', 'belief'],
    '运动部活动时运动与根性更易成长，并强化比赛和大会表现。',
  ),
  defineSkill(
    'independent',
    '独立独行',
    '独立独歩',
    '运动',
    40,
    ['belief'],
    '上一周没有约会时成长增加，有约会时成长减少。',
  ),
  defineSkill(
    'sports_star',
    '运动明星',
    '運動スター',
    '运动',
    50,
    ['sports_ace'],
    '进一步强化运动部活动、比赛和大会表现。',
  ),
  defineSkill(
    'refresh',
    '焕新术',
    'リフレッシュ術',
    '运动',
    50,
    ['comeback', 'perfect_neurosis'],
    '休养时大幅增加体调恢复量。',
  ),

  // 沟通（24）
  defineSkill('language_sense', '词汇感觉', '語彙センス', '沟通', 10, [], '约会时有时会少量提高女生的心动度。'),
  defineSkill('coordination', '协调性', '協調性', '沟通', 10, [], '在校内相遇时有时会少量提高心动度和友好度。'),
  defineSkill('performer', '表演者', 'パフォーマー', '沟通', 10, [], '提高主动搭话时遇见女生的概率。'),
  defineSkill('joking', '喜欢搞笑', 'お笑い好き', '沟通', 10, [], '约会选项效果不佳时避免伤害女生。'),
  defineSkill('fresh_greeting', '清爽问候', '爽やかな挨拶', '沟通', 10, [], '在校内相遇时有时会提高心动度和友好度。'),
  defineSkill('passion', '热情', '情熱', '沟通', 10, [], '更容易遇见并邀请女生约会，但能力成长减少。'),
  defineSkill('shy', '怕生', '人見知り', '沟通', 10, [], '主动搭话时不会遇见任何人。'),
  defineSkill(
    'mood_maker',
    '活跃气氛高手',
    '盛り上げ巧者',
    '沟通',
    20,
    ['language_sense'],
    '校内相遇和约会时有时会提高心动度与友好度。',
  ),
  defineSkill('sociability', '社交性', '社交性', '沟通', 20, ['performer'], '关系达到友好以上的女生更不容易受伤害。'),
  defineSkill('three_visits', '三顾之礼', '三顧の礼', '沟通', 20, ['passion'], '更容易成功邀请女生约会。'),
  defineSkill(
    'conversation_sommelier',
    '会话鉴赏家',
    '会話ソムリエ',
    '沟通',
    30,
    ['mood_maker'],
    '校内相遇和约会时更容易提高心动度与友好度。',
  ),
  defineSkill(
    'popularity',
    '八面玲珑',
    '八方美人',
    '沟通',
    30,
    ['coordination'],
    '心动度更容易提高，但也更容易伤害女生。',
  ),
  defineSkill(
    'leadership',
    '领导力',
    'リーダーシップ',
    '沟通',
    30,
    ['joking', 'sociability'],
    '学生会活动时能力更易成长。',
  ),
  defineSkill(
    'elegant_greeting',
    '华丽问候',
    '華麗な挨拶',
    '沟通',
    30,
    ['fresh_greeting'],
    '在校内相遇时有时会明显提高心动度和友好度。',
  ),
  defineSkill('escape', '逃避', 'エスケープ', '沟通', 30, ['shy'], '体调过低时会自行休养，但会降低道德。'),
  defineSkill(
    'counselor',
    '心理顾问',
    'カウンセラー',
    '沟通',
    40,
    ['conversation_sommelier'],
    '相遇或通话时有时会降低女生的伤心度。',
  ),
  defineSkill(
    'fire_extinguisher',
    '灭火名人',
    '火消し名人',
    '沟通',
    40,
    ['conversation_sommelier', 'popularity'],
    '炸弹爆炸时减轻对其他女生的影响，但当事女生受到的影响增加。',
  ),
  defineSkill(
    'pacifism',
    '和平主义',
    '平和主義',
    '沟通',
    40,
    ['sociability', 'popularity'],
    '减轻炸弹对所有女生的影响，但能力成长减少。',
  ),
  defineSkill(
    'thrilling_greeting',
    '心动问候',
    'ときめく挨拶',
    '沟通',
    40,
    ['elegant_greeting'],
    '在校内相遇时有时会大幅提高心动度和友好度。',
  ),
  defineSkill(
    'fleeting_resolve',
    '一念执着',
    '虚仮の一念',
    '沟通',
    40,
    ['three_visits'],
    '连续与同一女生约会时提高其心动度，但更容易伤害其他女生。',
  ),
  defineSkill('heart_unlock', '心灵开锁术', '心の開錠術', '沟通', 40, ['counselor'], '使女生的负面特技失效。'),
  defineSkill('bomber', '炸弹客', 'ボマー', '沟通', 50, ['pacifism'], '提高能力成长，但炸弹爆炸造成的评价损失增加。'),
  defineSkill(
    'friendship_oath',
    '友情誓言',
    '友情の誓い',
    '沟通',
    50,
    ['pacifism', 'leadership', 'thrilling_greeting'],
    '以友好度成长代替心动度成长，因此无法进入完全心动状态。',
  ),
  defineSkill(
    'stealth',
    '隐身',
    'ステルス',
    '沟通',
    50,
    ['escape'],
    '主动搭话时不会遇见关系较低的女生，但炸弹的评价损失增加。',
  ),

  // 学问（20）
  defineSkill('literacy', '读写', '読み書き', '学问', 10, [], '提高文科能力。'),
  defineSkill('logical_thinking', '逻辑思考', '論理的思考', '学问', 10, [], '提高理科能力。'),
  defineSkill('sensitivity', '感受性', '感受性', '学问', 10, [], '提高艺术能力。'),
  defineSkill('scribe', '文书', '祐筆', '学问', 20, ['literacy'], '进一步提高文科能力。'),
  defineSkill(
    'scholar',
    '学者气质',
    '学者肌',
    '学问',
    20,
    ['literacy', 'logical_thinking'],
    '文科与理科成长增加，其他能力成长减少。',
  ),
  defineSkill('math_sense', '数学天赋', '数学センス', '学问', 20, ['logical_thinking'], '进一步提高理科能力。'),
  defineSkill('art_sense', '艺术天赋', '芸術センス', '学问', 20, ['sensitivity'], '进一步提高艺术能力。'),
  defineSkill(
    'artistic_disposition',
    '艺术家气质',
    '芸術家肌',
    '学问',
    20,
    ['sensitivity'],
    '艺术成长增加，其他能力成长减少。',
  ),
  defineSkill('english_conversation', '英语会话', '英会話', '学问', 30, ['scribe'], '考试时强化文科。'),
  defineSkill('literary_talent', '文才', '文才', '学问', 30, ['scribe'], '执行文科指令时文科更易成长。'),
  defineSkill(
    'scientific_training',
    '科学训练',
    '科学的訓練',
    '学问',
    30,
    ['scholar'],
    '依据文科与理科能力，提高运动指令的运动成长。',
  ),
  defineSkill('science_dr', '理学博士', '理学博士', '学问', 30, ['math_sense'], '执行理科指令时理科更易成长。'),
  defineSkill('mechanical_work', '机械制作', '機械工作', '学问', 40, ['math_sense'], '每月中旬恢复手机电量。'),
  defineSkill('expressiveness', '表现力', '表現力', '学问', 30, ['art_sense'], '执行艺术指令时艺术更易成长。'),
  defineSkill(
    'artistic_inspiration',
    '艺术灵感',
    '芸術の閃き',
    '学问',
    30,
    ['artistic_disposition'],
    '执行非艺术指令时有时也会提高艺术。',
  ),
  defineSkill('bilingual', '双语', 'バイリンガル', '学问', 40, ['english_conversation'], '考试时进一步强化文科。'),
  defineSkill(
    'literary_giant',
    '文豪',
    '文豪',
    '学问',
    40,
    ['literary_talent'],
    '有时投稿小说获奖，提高女生评价并获得金钱。',
  ),
  defineSkill(
    'cultural_club_ace',
    '文化部王牌',
    '文化部エース',
    '学问',
    40,
    ['literary_talent', 'science_dr', 'expressiveness'],
    '文化部活动时文科、理科和艺术更易成长，并强化大会表现。',
  ),
  defineSkill(
    'artist',
    '艺术家',
    'アーティスト',
    '学问',
    40,
    ['expressiveness', 'artistic_inspiration'],
    '有时完成艺术作品，提高女生评价与道德。',
  ),
  defineSkill(
    'cultural_club_boss',
    '文化部泰斗',
    '文化部大御所',
    '学问',
    50,
    ['cultural_club_ace'],
    '进一步强化文化部活动与大会表现。',
  ),

  // 课外活动（26）
  defineSkill(
    'moped_license',
    '轻便摩托驾照',
    '原付免許',
    '课外活动',
    0,
    [],
    '通过驾照中心考试后取得；可购买轻便摩托，并免除郊外约会设施费用。',
    {
      acquisition: 'license',
      isLicense: true,
      triggerCondition: '通过驾照中心考试',
    },
  ),
  defineSkill(
    'motorcycle',
    '中型摩托驾照',
    '中型二輪免許',
    '课外活动',
    0,
    ['moped_license'],
    '取得轻便摩托驾照并再次通过驾照中心考试后取得；可购买中型摩托，并免除市外约会设施费用。',
    {
      acquisition: 'license',
      isLicense: true,
      triggerCondition: '取得轻便摩托驾照并通过驾照中心考试',
    },
  ),
  defineSkill('manners', '礼仪', 'マナー', '课外活动', 10, [], '提高容姿能力。'),
  defineSkill('sweet_tooth', '甜食党', '甘党', '课外活动', 10, [], '有时恢复体调，但也可能因吃多而降低容姿。'),
  defineSkill('holiday_demon', '假日之鬼', '休日の鬼', '课外活动', 20, [], '提高假日指令的能力成长。'),
  defineSkill(
    'information_expert',
    '消息灵通',
    '情報通',
    '课外活动',
    10,
    [],
    '赠送生日礼物时更容易提高心动度和友好度。',
  ),
  defineSkill('thrifty', '节约高手', '節約上手', '课外活动', 10, [], '商店购物价格降低。'),
  defineSkill('fashion_sense', '穿搭高手', 'おしゃれ上手', '课外活动', 20, ['manners'], '进一步提高容姿能力。'),
  defineSkill('cooking', '男子料理', '男の手料理', '课外活动', 20, ['sweet_tooth'], '假日有时会下厨并恢复体调。'),
  defineSkill(
    'holiday_god',
    '假日之神',
    '休日の神',
    '课外活动',
    40,
    ['holiday_demon'],
    '进一步提高假日指令的能力成长。',
  ),
  defineSkill(
    'parttime_expert',
    '打工达人',
    'バイト達人',
    '课外活动',
    20,
    ['thrifty'],
    '提高打工时的能力成长，但打工更容易失败。',
  ),
  defineSkill('stylish_man', '时尚达人', '伊達者', '课外活动', 30, ['fashion_sense'], '执行容姿指令时容姿更易成长。'),
  defineSkill('feminine_sensitivity', '女子力', '女子力', '课外活动', 30, ['cooking'], '约会时有时会提高友好度。'),
  defineSkill(
    'outdoor',
    '户外派',
    'アウトドア派',
    '课外活动',
    30,
    ['holiday_god'],
    '假日只能执行户外相关指令，但能力成长提高。',
  ),
  defineSkill(
    'indoor',
    '室内派',
    'インドア派',
    '课外活动',
    30,
    ['holiday_god'],
    '假日只能执行室内相关指令，但能力成长提高。',
  ),
  defineSkill(
    'trend_sense',
    '潮流感',
    '流行センス',
    '课外活动',
    30,
    ['information_expert'],
    '约会时有时会提高心动度和友好度。',
  ),
  defineSkill(
    'workaholic',
    '打工超人',
    'バイト超人',
    '课外活动',
    30,
    ['parttime_expert'],
    '进一步提高打工时的能力成长，但打工更容易失败。',
  ),
  defineSkill(
    'pheromone',
    '魅力荷尔蒙',
    'フェロモン',
    '课外活动',
    40,
    ['stylish_man', 'feminine_sensitivity'],
    '约会时有时会提高女生的心动度。',
  ),
  defineSkill(
    'feminist',
    '女士优先',
    'フェミニスト',
    '课外活动',
    40,
    ['feminine_sensitivity'],
    '部分女生的心动度更易提高，但对另一些女生会更难提高。',
  ),
  defineSkill(
    'self_search',
    '寻找自我',
    '自分探し',
    '课外活动',
    40,
    ['motorcycle', 'outdoor'],
    '假日有时提高运动、根性和艺术并改善心情，但会消耗体调。',
  ),
  defineSkill('survival', '生存专家', 'サバイバル', '课外活动', 40, ['outdoor'], '体调较低时也不会受伤。'),
  defineSkill('gamer', '玩家', 'ゲーマー', '课外活动', 40, ['indoor'], '强化游戏测试打工与射击小游戏。'),
  defineSkill(
    'mimic_growth',
    '模仿成长',
    '模倣成長',
    '课外活动',
    40,
    ['trend_sense'],
    '约会时依据对方擅长的能力获得对应成长。',
  ),
  defineSkill('work_skills', '工作术', '仕事術', '课外活动', 40, ['workaholic'], '打工时有时会获得更多金钱。'),
  defineSkill('blessing', '祝福', '祝福', '课外活动', 50, ['feminist'], '平日指令全部成功时，周六的能力成长大幅提高。'),
  defineSkill(
    'game_king',
    '玩乐之王',
    '遊びの王',
    '课外活动',
    50,
    ['survival', 'gamer', 'mimic_growth'],
    '约会时有时会提高全部能力。',
  ),

  // 其他（24）
  defineSkill('super_power', '超能力', '超・能力', '其他', 10, [], '改变战斗时的背景。'),
  defineSkill('morning_person', '早起型', '朝型', '其他', 10, [], '干劲变化加快，早晨至上课期间的事件更容易发生。'),
  defineSkill('night_owl', '夜猫型', '夜型', '其他', 10, [], '干劲变化变慢，放学回家事件更容易发生。'),
  defineSkill('multitalented', '多才多艺', '多芸', '其他', 30, [], '降低全部能力的下降量。'),
  defineSkill(
    'strength_appraisal',
    '实力洞察',
    '強さの見極め',
    '其他',
    20,
    ['super_power'],
    '战斗时可以查看敌人的体力。',
  ),
  defineSkill('guardian_spirit', '守护灵', '守護霊', '其他', 20, ['super_power'], '休养时有时会提高一项能力。'),
  defineSkill('intuition', '直觉', '直感', '其他', 20, ['super_power'], '约会选项中会标出会降低评价的回答。'),
  defineSkill('morality', '道德家', 'モラリスト', '其他', 20, ['morning_person'], '道德更容易提高。'),
  defineSkill('planning', '计划性', '計画性', '其他', 20, ['morning_person'], '略微提高指令成功率。'),
  defineSkill(
    'cramming',
    '临时抱佛脚',
    '一夜漬け',
    '其他',
    20,
    ['night_owl'],
    '考试前一天执行学习指令时学习效果大幅提高。',
  ),
  defineSkill(
    'wild_instinct',
    '野性直觉',
    '野性の勘',
    '其他',
    30,
    ['intuition'],
    '期末考试时有时会提高该科成绩，但对入学考试无效。',
  ),
  defineSkill(
    'service_spirit',
    '奉献精神',
    '奉仕精神',
    '其他',
    30,
    ['morality'],
    '平日指令执行时有时提高道德并捐出少量金钱。',
  ),
  defineSkill('versatile', '万能', '万能', '其他', 60, ['multitalented'], '进一步降低全部能力的下降量。'),
  defineSkill('y_eye', 'Y之魔眼', 'Yの魔眼', '其他', 40, ['strength_appraisal'], '可在人物资料中查看三围。'),
  defineSkill(
    'divine_protection',
    '女神加护',
    '女神の加護',
    '其他',
    40,
    ['guardian_spirit'],
    '执行指令时有时会大幅提高能力成长。',
  ),
  defineSkill('mental_unify', '精神统一', '精神統一', '其他', 40, ['wild_instinct'], '略微提高其他特技的发动率。'),
  defineSkill(
    'integrity',
    '清廉洁白',
    '清廉潔白',
    '其他',
    40,
    ['service_spirit'],
    '女生更不容易受伤，但心动度也更难提高。',
  ),
  defineSkill('solidity', '稳健', '堅実性', '其他', 40, ['planning'], '有时使平日指令必定成功。'),
  defineSkill(
    'crisis_power',
    '临危爆发',
    '火事場力',
    '其他',
    40,
    ['cramming'],
    '体调较低时强化运动成长，并强化战斗能力。',
  ),
  defineSkill('almighty', '全能', '全能', '其他', 60, ['versatile'], '提高全部能力的成长量。'),
  defineSkill('end_thought', '末世思想', '終末思想', '其他', 50, ['y_eye'], '女生不会再主动邀请一起放学。'),
  defineSkill(
    'enlightenment',
    '悟道境界',
    '悟りの境地',
    '其他',
    50,
    ['divine_protection', 'mental_unify'],
    '进一步提高其他特技的发动率。',
  ),
  defineSkill(
    'late_bloomer',
    '大器晚成',
    '大器晩成',
    '其他',
    50,
    ['solidity', 'mental_unify'],
    '经验获得增加，但指令更容易失败。',
  ),
  defineSkill('ironclad', '铁板', '鉄板', '其他', 50, ['solidity', 'crisis_power'], '提高平日指令的成功率。'),

  // 上位（8）
  defineSkill(
    'honor_student',
    '优等生',
    '優等生',
    '上位',
    80,
    ['integrity', 'almighty', 'both_arts_sports'],
    '提高指令成功率与能力成长，但体调消耗也会增加。',
    { isAdvanced: true },
  ),
  defineSkill('mastermind', '黑幕', '黒幕', '上位', 10, ['leadership', 'work_skills'], '可以得知奇怪传闻的源头。', {
    isAdvanced: true,
  }),
  defineSkill(
    'both_arts_sports',
    '文武两极道',
    '文武両極道',
    '上位',
    80,
    ['sports_ace', 'cultural_club_ace'],
    '执行文科或理科指令时运动不易下降，执行运动指令时文科与理科不易下降。',
    { isAdvanced: true },
  ),
  defineSkill(
    'unwavering_spirit',
    '不断的精神力',
    '不断の精神力',
    '上位',
    60,
    ['belief', 'three_visits'],
    '随着同一指令连续执行，成功率逐步提高。',
    { isAdvanced: true },
  ),
  defineSkill(
    'firefighting_master',
    '灭火大师',
    '火消しの匠',
    '上位',
    100,
    ['stalwart', 'fire_extinguisher'],
    '炸弹爆炸时以耗尽体调为代价把损失压到最低。',
    { isAdvanced: true },
  ),
  defineSkill(
    'delusion_realize',
    '妄想具现化',
    '妄想具現化',
    '上位',
    100,
    ['artist', 'end_thought'],
    '让放学场景中的女生立绘显示为泳装。',
    { isAdvanced: true },
  ),
  defineSkill(
    'truth_reveal',
    '真理解明术',
    '真理の解明術',
    '上位',
    40,
    ['honor_student'],
    '发现女生的潜在魅力并获得对应效果。',
    { isAdvanced: true },
  ),
  defineSkill(
    'confession_courage',
    '告白的勇气',
    '告白する勇気',
    '上位',
    1,
    ['unwavering_spirit'],
    '毕业时可以选择主动向已认识的女生告白。',
    { isAdvanced: true },
  ),
];

// The former recommendations referenced nonexistent skills and incorrect totals.
export const skillCombos: SkillCombo[] = [];

export function getSkillById(id: string): Skill | undefined {
  return skills.find(skill => skill.id === id);
}

export function getSkillsByCategory(category: string): Skill[] {
  return skills.filter(skill => skill.category === category);
}

export function getPrerequisiteSkills(skillId: string): Skill[] {
  const skill = getSkillById(skillId);
  if (!skill) return [];
  return skill.prerequisites.map(id => getSkillById(id)).filter((item): item is Skill => Boolean(item));
}

export function getUnlockableSkills(skillId: string): Skill[] {
  return skills.filter(skill => skill.prerequisites.includes(skillId));
}
