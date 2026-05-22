// 静态配置：宠物与口粮目录（前端单一事实来源）
// acquireType: 'buy' 明购 | 'unlock' 解锁 | 'gacha' 抽卡

export const FOODS = [
  { id: 'fish_dry',    name: '小鱼干', petId: 'cat',     price: 15, exp: 20, intimacy: 5 },
  { id: 'bone',        name: '肉骨头', petId: 'dog',     price: 15, exp: 20, intimacy: 5 },
  { id: 'carrot',      name: '胡萝卜', petId: 'rabbit',  price: 18, exp: 22, intimacy: 5 },
  { id: 'millet',      name: '小米粒', petId: 'chick',   price: 12, exp: 18, intimacy: 5 },
  { id: 'berry',       name: '浆果',   petId: 'fox',     price: 30, exp: 35, intimacy: 6 },
  { id: 'bamboo',      name: '竹笋',   petId: 'panda',   price: 35, exp: 40, intimacy: 6 },
  { id: 'ice_fish',    name: '冰鲜鱼', petId: 'penguin', price: 32, exp: 38, intimacy: 6 },
  { id: 'dragonfruit', name: '火龙果', petId: 'dragon',  price: 50, exp: 55, intimacy: 8 },
  { id: 'seaweed',     name: '海草',   petId: 'turtle',  price: 20, exp: 24, intimacy: 5 },
  { id: 'grass',       name: '青草',   petId: 'goat',    price: 16, exp: 20, intimacy: 5 },
];

export const PETS = [
  { id: 'cat',     name: 'Mimi',     cnName: '小猫',   acquireType: 'buy',    price: 80,  unlockKey: null,          foodId: 'fish_dry' },
  { id: 'dog',     name: 'Wangwang', cnName: '小狗',   acquireType: 'buy',    price: 100, unlockKey: null,          foodId: 'bone' },
  { id: 'rabbit',  name: 'Tutu',     cnName: '小兔',   acquireType: 'buy',    price: 130, unlockKey: null,          foodId: 'carrot' },
  { id: 'chick',   name: 'Jiji',     cnName: '小鸡',   acquireType: 'buy',    price: 60,  unlockKey: null,          foodId: 'millet' },
  { id: 'fox',     name: 'Huhu',     cnName: '小狐狸', acquireType: 'unlock', price: 350, unlockKey: 'pet:fox',     foodId: 'berry',   unlockDesc: '拥有 3 只宠物后解锁' },
  { id: 'panda',   name: 'Panpan',   cnName: '熊猫',   acquireType: 'unlock', price: 500, unlockKey: 'pet:panda',   foodId: 'bamboo',  unlockDesc: '通关主线第 5 关后解锁' },
  { id: 'penguin', name: 'Qiqi',     cnName: '企鹅',   acquireType: 'unlock', price: 400, unlockKey: 'pet:penguin', foodId: 'ice_fish',unlockDesc: '任一宠物升到 5 级后解锁' },
  { id: 'dragon',  name: 'Long',     cnName: '萌龙',   acquireType: 'gacha',  price: null, unlockKey: null,         foodId: 'dragonfruit' },
  { id: 'turtle',  name: 'Guigui',   cnName: '小乌龟', acquireType: 'buy',    price: 110, unlockKey: null,          foodId: 'seaweed' },
  { id: 'goat',    name: 'Yangyang', cnName: '小山羊', acquireType: 'buy',    price: 120, unlockKey: null,          foodId: 'grass' },
];

export const GACHA_COST = 50;
export const GACHA_DUP_FOOD_QTY = 3;
export const GACHA_POOL = ['dragon'];
export const MAX_LEVEL = 10;

// ===== 学科 / 模块 / 关卡 =====
// 三层：Subject → Module → Stage（每 Module 1000 关），每关 5 题。
// 关卡<b>不再锁住</b>，仅展示「已通关」标记。
export const SUBJECTS = [
  { id: 'math',    name: '数学', emoji: '🔢', color: '#f0a93a', desc: '加减乘除，引导拆分技巧' },
  { id: 'chinese', name: '语文', emoji: '🀄', color: '#e85b5b', desc: '识字、拼音、组词、成语' },
  { id: 'english', name: '英语', emoji: '🔤', color: '#3a92e0', desc: '字母、词汇、拼写、句子' },
];

// 每模块固定 1000 关，按 stage 推断难度参数（见 useQuizGen.js）。
// placeholder=true 的模块仅占位（敬请期待），点击进入会显示占位页。
export const MODULES = {
  math: [
    { id: 'add', name: '加法', emoji: '➕', color: '#e8529a', desc: '从凑十到进位加' },
    { id: 'sub', name: '减法', emoji: '➖', color: '#3a92e0', desc: '从破十到借位减' },
    { id: 'mul', name: '乘法', emoji: '✖️', color: '#9b5cd6', desc: '九九乘法到多位乘' },
    { id: 'div', name: '除法', emoji: '➗', color: '#e85b5b', desc: '基础除法到长除' },
    { id: 'place', name: '数位认知', emoji: '🔢', color: '#2bb3a3', desc: '个十百千万…拖数字认数位' },
  ],
  chinese: [
    { id: 'recognize', name: '看图识字', emoji: '👀', color: '#f0a93a', desc: '看图选汉字' },
    { id: 'pinyin',    name: '拼音匹配', emoji: '🔠', color: '#54b85a', desc: '汉字配拼音', placeholder: true },
    { id: 'compose',   name: '组词造句', emoji: '📝', color: '#3a92e0', desc: '给字找词',   placeholder: true },
    { id: 'idiom',     name: '成语接龙', emoji: '🏮', color: '#9b5cd6', desc: '首尾相接',   placeholder: true },
  ],
  english: [
    { id: 'alphabet', name: '字母认知', emoji: '🅰️', color: '#f0a93a', desc: '大小写匹配' },
    { id: 'vocab',    name: '看图选词', emoji: '📚', color: '#54b85a', desc: '图片对单词',     placeholder: true },
    { id: 'spell',    name: '拼写组词', emoji: '✍️', color: '#3a92e0', desc: '拖字母拼单词',   placeholder: true },
    { id: 'sentence', name: '看图选句', emoji: '💬', color: '#9b5cd6', desc: '看图选完整句子', placeholder: true },
  ],
};

export const STAGES_PER_MODULE = 1000;
export const ROUND_SIZE = 5;

export const findSubject = (id) => SUBJECTS.find(s => s.id === id) || SUBJECTS[0];
export const findModule = (subjectId, moduleId) => {
  const list = MODULES[subjectId] || [];
  return list.find(m => m.id === moduleId) || list[0];
};

export const findPet = (id) => PETS.find(p => p.id === id) || null;
export const findFood = (id) => FOODS.find(f => f.id === id) || null;
export const expForLevel = (level) => 50 * level;

// ===== 进化阶段（4 阶）=====
// 每阶段的最低等级（MAX_LEVEL = 10）
export const STAGE_MIN_LEVEL = [1, 3, 6, 9];
export const STAGE_LABELS = ['幼年', '成长', '强壮', '完全体'];

export const DEFAULT_GROWTH_STAGES = STAGE_LABELS.map((label, index) => ({
  stageId: index,
  stageName: label,
  displayName: label,
  assetPath: null,
  model: null,
  icon: null,
  animations: [],
  appearanceKeywords: [],
  statusRole: '',
  unlockCondition: index === 0 ? '领养后默认' : `等级达到 ${STAGE_MIN_LEVEL[index]}`,
  description: '',
}));

export const PET_GROWTH_RESOURCES = {
  cat: {
    pet_id: 'cat_001',
    pet_name: '猫咪',
    runtime_pet_id: 'cat',
    growth_stages: [
      {
        stage: 0,
        name: '幼年',
        display_name: '小奶猫',
        model: 'cat_baby',
        icon: 'icon_cat_baby',
        animation: ['idle_baby', 'sleep_baby', 'eat_baby'],
        unlock_condition: 'default',
        description: '刚被领养的小猫咪，胆小又粘人。',
        appearance_keywords: ['小体型', '圆眼睛', '短尾巴', '动作笨拙'],
        status_role: '可爱、弱小、依赖玩家',
        assets: {
          portrait: '/pets/cat/0.png',
          model: '/pets/cat/models/cat_baby.png',
          icon: '/pets/cat/icons/icon_cat_baby.png',
          badge: '/pets/cat/badges/stage_paw_0.png',
          label: '/pets/cat/labels/stage_label_0.png',
          effect: '/pets/cat/effects/evolve_stage_0.png',
        },
      },
      {
        stage: 1,
        name: '成长',
        display_name: '活泼猫',
        model: 'cat_growing',
        icon: 'icon_cat_growing',
        animation: ['idle_growing', 'run_growing', 'play_growing'],
        unlock_condition: 'intimacy >= 100',
        description: '开始熟悉主人，喜欢探索和玩耍。',
        appearance_keywords: ['体型变大', '耳朵挺立', '动作灵活', '尾巴上扬'],
        status_role: '活跃、好奇、开始互动',
        assets: {
          portrait: '/pets/cat/1.png',
          model: '/pets/cat/models/cat_growing.png',
          icon: '/pets/cat/icons/icon_cat_growing.png',
          badge: '/pets/cat/badges/stage_paw_1.png',
          label: '/pets/cat/labels/stage_label_1.png',
          effect: '/pets/cat/effects/evolve_stage_1.png',
        },
      },
      {
        stage: 2,
        name: '强壮',
        display_name: '战斗猫',
        model: 'cat_strong',
        icon: 'icon_cat_strong',
        animation: ['idle_strong', 'attack_strong', 'guard_strong'],
        unlock_condition: 'level >= 20',
        description: '身体变得强壮，可以陪伴主人完成冒险。',
        appearance_keywords: ['肌肉感', '毛发蓬松', '眼神坚定', '动作敏捷'],
        status_role: '强力、可靠、可协助任务',
        assets: {
          portrait: '/pets/cat/2.png',
          model: '/pets/cat/models/cat_strong.png',
          icon: '/pets/cat/icons/icon_cat_strong.png',
          badge: '/pets/cat/badges/stage_paw_2.png',
          label: '/pets/cat/labels/stage_label_2.png',
          effect: '/pets/cat/effects/evolve_stage_2.png',
        },
      },
      {
        stage: 3,
        name: '完全体',
        display_name: '灵猫',
        model: 'cat_final',
        icon: 'icon_cat_final',
        animation: ['idle_final', 'skill_final', 'special_final'],
        unlock_condition: 'level >= 40 && item: evolution_stone',
        description: '猫咪的最终形态，拥有独特气质和特殊能力。',
        appearance_keywords: ['华丽毛色', '特殊光效', '专属铃铛饰品', '尾巴灵光'],
        status_role: '成熟、稀有、最终形态',
        assets: {
          portrait: '/pets/cat/3.png',
          model: '/pets/cat/models/cat_final.png',
          icon: '/pets/cat/icons/icon_cat_final.png',
          badge: '/pets/cat/badges/stage_paw_3.png',
          label: '/pets/cat/labels/stage_label_3.png',
          effect: '/pets/cat/effects/evolve_stage_3.png',
        },
      },
    ],
  },
};

export const PET_GROWTH_STAGES = Object.fromEntries(
  Object.entries(PET_GROWTH_RESOURCES).map(([petId, resource]) => [
    petId,
    resource.growth_stages.map(stage => ({
      stageId: stage.stage,
      stageName: stage.name,
      displayName: stage.display_name,
      assetPath: stage.assets.portrait,
      modelAsset: stage.assets.model,
      iconAsset: stage.assets.icon,
      badgeAsset: stage.assets.badge,
      labelAsset: stage.assets.label,
      effectAsset: stage.assets.effect,
      model: stage.model,
      icon: stage.icon,
      animations: stage.animation,
      appearanceKeywords: stage.appearance_keywords,
      statusRole: stage.status_role,
      unlockCondition: stage.unlock_condition,
      description: stage.description,
    })),
  ]),
);

// 等级 → 进化阶段索引（0..3）
export function petStage(level) {
  const lv = level || 1;
  let s = 0;
  for (let i = 0; i < STAGE_MIN_LEVEL.length; i++) {
    if (lv >= STAGE_MIN_LEVEL[i]) s = i;
  }
  return s;
}

// 各物种每阶段的展示名（缺省回退到 STAGE_LABELS）
// 结构对应设计稿的 growth_stages[].display_name
export const STAGE_NAMES = Object.fromEntries(
  Object.entries(PET_GROWTH_STAGES).map(([petId, stages]) => [
    petId,
    stages.map(stage => stage.displayName),
  ]),
);

// 各阶段描述（缺省为空）
export const STAGE_DESC = Object.fromEntries(
  Object.entries(PET_GROWTH_STAGES).map(([petId, stages]) => [
    petId,
    stages.map(stage => stage.description),
  ]),
);

// 各阶段主题色（用于徽章 / 进化特效）：金 / 绿 / 蓝 / 紫
export const STAGE_COLORS = ['#f0a93a', '#54b85a', '#3a92e0', '#9b5cd6'];

export function stageName(petId, level) {
  const s = petStage(level);
  return STAGE_NAMES[petId]?.[s] ?? STAGE_LABELS[s];
}

export function stageDesc(petId, level) {
  return STAGE_DESC[petId]?.[petStage(level)] ?? '';
}

export function growthStageResource(petId, level) {
  const s = petStage(level);
  return PET_GROWTH_STAGES[petId]?.[s] ?? DEFAULT_GROWTH_STAGES[s];
}
