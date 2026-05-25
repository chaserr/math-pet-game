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
  { id: 'alfalfa',     name: '苜蓿草', petId: 'sheep',   price: 18, exp: 22, intimacy: 5 },
  { id: 'corn',        name: '玉米粒', petId: 'duck',    price: 14, exp: 19, intimacy: 5 },
  { id: 'mint',        name: '薄荷叶', petId: 'poop',    price: 10, exp: 15, intimacy: 4 },
  // 鬼王家族口粮
  { id: 'soul_jelly',      name: '灵魂果冻', petId: 'boo',           price: 30, exp: 35, intimacy: 6 },
  { id: 'shy_marshmallow', name: '棉花糖',   petId: 'shy_ghost',     price: 28, exp: 32, intimacy: 6 },
  { id: 'pumpkin_pie',     name: '南瓜派',   petId: 'pumpkin_ghost', price: 32, exp: 38, intimacy: 6 },
  { id: 'night_candy',     name: '暗夜糖',   petId: 'shadow_boo',    price: 38, exp: 42, intimacy: 7 },
  { id: 'purple_gem',      name: '紫水晶',   petId: 'king_boo',      price: 55, exp: 60, intimacy: 8 },
];

// ===== 宠物分类（用于商店 / 宠物之家分组展示）=====
// 未来加新宠物时只在这里添加 category，自动出现在对应分组下。
export const PET_CATEGORIES = [
  { id: 'mammal',    name: '哺乳',  emoji: '🐾' },
  { id: 'bird',      name: '鸟类',  emoji: '🐦' },
  { id: 'reptile',   name: '爬行',  emoji: '🐢' },
  { id: 'mythical',  name: '神话',  emoji: '🐉' },
  { id: 'ghost',     name: '鬼王',  emoji: '👻' },
  { id: 'fun',       name: '趣味',  emoji: '🎈' },
];

export const PETS = [
  { id: 'cat',     name: 'Mimi',     cnName: '小猫',   category: 'mammal',   acquireType: 'buy',    price: 80,  unlockKey: null,          foodId: 'fish_dry' },
  { id: 'dog',     name: 'Wangwang', cnName: '小狗',   category: 'mammal',   acquireType: 'buy',    price: 100, unlockKey: null,          foodId: 'bone' },
  { id: 'rabbit',  name: 'Tutu',     cnName: '小兔',   category: 'mammal',   acquireType: 'buy',    price: 130, unlockKey: null,          foodId: 'carrot' },
  { id: 'chick',   name: 'Jiji',     cnName: '小鸡',   category: 'bird',     acquireType: 'buy',    price: 60,  unlockKey: null,          foodId: 'millet' },
  { id: 'fox',     name: 'Huhu',     cnName: '小狐狸', category: 'mammal',   acquireType: 'unlock', price: 350, unlockKey: 'pet:fox',     foodId: 'berry',   unlockDesc: '拥有 3 只宠物后解锁' },
  { id: 'panda',   name: 'Panpan',   cnName: '熊猫',   category: 'mammal',   acquireType: 'unlock', price: 500, unlockKey: 'pet:panda',   foodId: 'bamboo',  unlockDesc: '通关主线第 5 关后解锁' },
  { id: 'penguin', name: 'Qiqi',     cnName: '企鹅',   category: 'bird',     acquireType: 'unlock', price: 400, unlockKey: 'pet:penguin', foodId: 'ice_fish',unlockDesc: '任一宠物升到 5 级后解锁' },
  { id: 'dragon',  name: 'Long',     cnName: '萌龙',   category: 'mythical', acquireType: 'gacha',  price: null, unlockKey: null,         foodId: 'dragonfruit' },
  { id: 'turtle',  name: 'Guigui',   cnName: '小乌龟', category: 'reptile',  acquireType: 'buy',    price: 110, unlockKey: null,          foodId: 'seaweed' },
  { id: 'goat',    name: 'Yangyang', cnName: '小山羊', category: 'mammal',   acquireType: 'buy',    price: 120, unlockKey: null,          foodId: 'grass' },
  { id: 'sheep',   name: 'Mianmian', cnName: '小绵羊', category: 'mammal',   acquireType: 'buy',    price: 115, unlockKey: null,          foodId: 'alfalfa' },
  { id: 'duck',    name: 'Yaya',     cnName: '小鸭子', category: 'bird',     acquireType: 'buy',    price: 90,  unlockKey: null,          foodId: 'corn' },
  { id: 'poop',    name: 'Choucho',  cnName: '臭臭',   category: 'fun',      acquireType: 'buy',    price: 50,  unlockKey: null,          foodId: 'mint' },
  // ===== 嘘嘘鬼王家族 =====
  { id: 'boo',           name: 'Boo',      cnName: '嘘嘘鬼',  category: 'ghost', acquireType: 'buy',    price: 120, unlockKey: null,             foodId: 'soul_jelly' },
  { id: 'shy_ghost',     name: 'Shyly',    cnName: '害羞鬼',  category: 'ghost', acquireType: 'buy',    price: 110, unlockKey: null,             foodId: 'shy_marshmallow' },
  { id: 'pumpkin_ghost', name: 'Pumpky',   cnName: '南瓜鬼',  category: 'ghost', acquireType: 'buy',    price: 130, unlockKey: null,             foodId: 'pumpkin_pie' },
  { id: 'shadow_boo',    name: 'Shadow',   cnName: '暗影鬼',  category: 'ghost', acquireType: 'unlock', price: 380, unlockKey: 'pet:shadow_boo', foodId: 'night_candy', unlockDesc: '拥有任意 2 只鬼王后解锁' },
  { id: 'king_boo',      name: 'KingBoo',  cnName: '嘘嘘鬼王', category: 'ghost', acquireType: 'gacha',  price: null, unlockKey: null,            foodId: 'purple_gem' },
];

export const findPetCategory = (id) => PET_CATEGORIES.find(c => c.id === id) || null;

export const GACHA_COST = 50;
export const GACHA_DUP_FOOD_QTY = 3;
export const GACHA_POOL = ['dragon', 'king_boo'];
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
    { id: 'recognize', name: '看图识字', emoji: '👀', color: '#f0a93a', desc: '看图选汉字（v1.9 扩到 78 字）' },
    { id: 'pinyin',    name: '拼音匹配', emoji: '🔠', color: '#54b85a', desc: '汉字↔拼音双向选（v1.9 启用）' },
    { id: 'compose',   name: '组词造句', emoji: '📝', color: '#3a92e0', desc: '4 选 1 选含该字的词（v1.9 启用）' },
    { id: 'poem',      name: '必背古诗', emoji: '📜', color: '#9b5cd6', desc: '诗句填字（静夜思 / 江南 / 池上 等 8 首）' },
    { id: 'idiom',     name: '成语接龙', emoji: '🏮', color: '#d83f7a', desc: '首尾相接（待二年级及以上）', placeholder: true },
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
    resource_version: 'cat-evolution-v2-2026-05-22',
    growth_stages: [
      {
        stage: 0,
        name: '幼年',
        display_name: '小奶猫',
        model: 'cat_baby',
        icon: 'icon_cat_baby',
        animation: ['idle_baby', 'sleep_baby', 'eat_baby'],
        unlock_condition: 'default',
        min_level: 1,
        description: '刚被领养的小奶猫，圆眼睛、短尾巴，动作笨拙但很依赖主人。',
        appearance_keywords: ['小体型', '圆眼睛', '短尾巴', '蓝色铃铛', '害羞亲近'],
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
        unlock_condition: 'level >= 3',
        min_level: 3,
        description: '开始熟悉主人，耳朵挺立、尾巴上扬，喜欢探索和玩耍。',
        appearance_keywords: ['体型变大', '耳朵挺立', '尾巴上扬', '星星吊坠', '动作灵活'],
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
        unlock_condition: 'level >= 6',
        min_level: 6,
        description: '身体变得强壮可靠，佩戴蓝金护具，可以陪伴主人完成挑战。',
        appearance_keywords: ['蓬松胸毛', '蓝金护具', '坚定眼神', '灵光尾巴', '守护姿态'],
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
        unlock_condition: 'level >= 9',
        min_level: 9,
        description: '猫咪的完全体形态，长毛、蓝金饰品与灵光尾巴构成独特气质。',
        appearance_keywords: ['华丽长毛', '蓝金饰品', '宝石吊坠', '灵光尾巴', '成熟气质'],
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
  turtle: {
    pet_id: 'turtle_001',
    pet_name: '乌龟',
    runtime_pet_id: 'turtle',
    growth_stages: [
      {
        stage: 0,
        name: '幼年',
        display_name: '小龟苗',
        model: 'turtle_baby',
        icon: 'icon_turtle_baby',
        animation: ['idle_baby', 'hide_baby', 'eat_baby'],
        unlock_condition: 'default',
        description: '刚被领养的小乌龟，慢吞吞地探头观察世界。',
        appearance_keywords: ['小体型', '圆眼睛', '迷你龟壳', '探头动作'],
        status_role: '可爱、谨慎、需要陪伴',
        assets: {
          portrait: '/pets/turtle/0.png',
          model: '/pets/turtle/models/turtle_baby.png',
          icon: '/pets/turtle/icons/icon_turtle_baby.png',
          badge: '/pets/turtle/badges/stage_shell_0.png',
          label: '/pets/turtle/labels/stage_label_0.png',
          effect: '/pets/turtle/effects/evolve_stage_0.png',
        },
      },
      {
        stage: 1,
        name: '成长',
        display_name: '探险龟',
        model: 'turtle_growing',
        icon: 'icon_turtle_growing',
        animation: ['idle_growing', 'walk_growing', 'play_growing'],
        unlock_condition: 'intimacy >= 100',
        description: '开始熟悉主人，喜欢慢慢探索新的地方。',
        appearance_keywords: ['体型变大', '龟壳纹路清晰', '动作稳定', '眼神好奇'],
        status_role: '稳重、好奇、开始互动',
        assets: {
          portrait: '/pets/turtle/1.png',
          model: '/pets/turtle/models/turtle_growing.png',
          icon: '/pets/turtle/icons/icon_turtle_growing.png',
          badge: '/pets/turtle/badges/stage_shell_1.png',
          label: '/pets/turtle/labels/stage_label_1.png',
          effect: '/pets/turtle/effects/evolve_stage_1.png',
        },
      },
      {
        stage: 2,
        name: '强壮',
        display_name: '守护龟',
        model: 'turtle_strong',
        icon: 'icon_turtle_strong',
        animation: ['idle_strong', 'guard_strong', 'charge_strong'],
        unlock_condition: 'level >= 20',
        description: '龟壳变得坚硬可靠，可以守护主人完成挑战。',
        appearance_keywords: ['厚重龟壳', '坚定眼神', '护甲感', '站姿稳固'],
        status_role: '坚韧、可靠、可协助任务',
        assets: {
          portrait: '/pets/turtle/2.png',
          model: '/pets/turtle/models/turtle_strong.png',
          icon: '/pets/turtle/icons/icon_turtle_strong.png',
          badge: '/pets/turtle/badges/stage_shell_2.png',
          label: '/pets/turtle/labels/stage_label_2.png',
          effect: '/pets/turtle/effects/evolve_stage_2.png',
        },
      },
      {
        stage: 3,
        name: '完全体',
        display_name: '玄甲灵龟',
        model: 'turtle_final',
        icon: 'icon_turtle_final',
        animation: ['idle_final', 'shield_final', 'special_final'],
        unlock_condition: 'level >= 40 && item: evolution_stone',
        description: '乌龟的最终形态，龟甲蕴含灵光，沉稳而强大。',
        appearance_keywords: ['玉色龟甲', '金色纹路', '灵光特效', '成熟气质'],
        status_role: '成熟、稀有、最终形态',
        assets: {
          portrait: '/pets/turtle/3.png',
          model: '/pets/turtle/models/turtle_final.png',
          icon: '/pets/turtle/icons/icon_turtle_final.png',
          badge: '/pets/turtle/badges/stage_shell_3.png',
          label: '/pets/turtle/labels/stage_label_3.png',
          effect: '/pets/turtle/effects/evolve_stage_3.png',
        },
      },
    ],
  },
  sheep: {
    pet_id: 'sheep_001',
    pet_name: '绵羊',
    runtime_pet_id: 'sheep',
    growth_stages: [
      {
        stage: 0,
        name: '幼年',
        display_name: '卷卷羊羔',
        model: 'sheep_baby',
        icon: 'icon_sheep_baby',
        animation: ['idle_baby', 'sleep_baby', 'eat_baby'],
        unlock_condition: 'default',
        min_level: 1,
        description: '刚被领养的小绵羊，像一团会眨眼的云朵。',
        appearance_keywords: ['小体型', '云朵卷毛', '大圆眼睛', '短腿坐姿'],
        status_role: '可爱、柔软、依赖玩家',
        assets: {
          portrait: '/pets/sheep/0.png',
          model: '/pets/sheep/models/sheep_baby.png',
          icon: '/pets/sheep/icons/icon_sheep_baby.png',
          badge: '/pets/sheep/badges/stage_wool_0.png',
          label: '/pets/sheep/labels/stage_label_0.png',
          effect: '/pets/sheep/effects/evolve_stage_0.png',
        },
      },
      {
        stage: 1,
        name: '成长',
        display_name: '云朵绵羊',
        model: 'sheep_growing',
        icon: 'icon_sheep_growing',
        animation: ['idle_growing', 'run_growing', 'play_growing'],
        unlock_condition: 'level >= 3',
        min_level: 3,
        description: '开始主动跟着主人跑跳，脖子上的薄荷围巾随风摆动。',
        appearance_keywords: ['体型变大', '薄荷围巾', '动作轻快', '眼神好奇'],
        status_role: '活泼、亲近、开始互动',
        assets: {
          portrait: '/pets/sheep/1.png',
          model: '/pets/sheep/models/sheep_growing.png',
          icon: '/pets/sheep/icons/icon_sheep_growing.png',
          badge: '/pets/sheep/badges/stage_wool_1.png',
          label: '/pets/sheep/labels/stage_label_1.png',
          effect: '/pets/sheep/effects/evolve_stage_1.png',
        },
      },
      {
        stage: 2,
        name: '强壮',
        display_name: '守护绵羊',
        model: 'sheep_strong',
        icon: 'icon_sheep_strong',
        animation: ['idle_strong', 'guard_strong', 'charge_strong'],
        unlock_condition: 'level >= 6',
        min_level: 6,
        description: '卷角和星章显现，能稳稳陪主人完成更难的挑战。',
        appearance_keywords: ['金色卷角', '蓝色颈环', '星形徽章', '站姿稳固'],
        status_role: '可靠、勇敢、可协助任务',
        assets: {
          portrait: '/pets/sheep/2.png',
          model: '/pets/sheep/models/sheep_strong.png',
          icon: '/pets/sheep/icons/icon_sheep_strong.png',
          badge: '/pets/sheep/badges/stage_wool_2.png',
          label: '/pets/sheep/labels/stage_label_2.png',
          effect: '/pets/sheep/effects/evolve_stage_2.png',
        },
      },
      {
        stage: 3,
        name: '完全体',
        display_name: '星绒灵羊',
        model: 'sheep_final',
        icon: 'icon_sheep_final',
        animation: ['idle_final', 'skill_final', 'special_final'],
        unlock_condition: 'level >= 9',
        min_level: 9,
        description: '最终形态的绵羊，星光藏在绒毛里，温柔又稀有。',
        appearance_keywords: ['华丽金角', '星云披肩', '柔和光效', '成熟气质'],
        status_role: '成熟、稀有、最终形态',
        assets: {
          portrait: '/pets/sheep/3.png',
          model: '/pets/sheep/models/sheep_final.png',
          icon: '/pets/sheep/icons/icon_sheep_final.png',
          badge: '/pets/sheep/badges/stage_wool_3.png',
          label: '/pets/sheep/labels/stage_label_3.png',
          effect: '/pets/sheep/effects/evolve_stage_3.png',
        },
      },
    ],
  },
  duck: {
    pet_id: 'duck_001',
    pet_name: '鸭子',
    runtime_pet_id: 'duck',
    resource_version: 'duck-evolution-v1-2026-05-22',
    style_reference: 'cute polished 3D mobile game pet, children arithmetic companion',
    stage_min_level: [1, 3, 6, 9],
    asset_groups: ['portrait', 'model', 'icon', 'badge', 'label', 'effect'],
    growth_stages: [
      {
        stage: 0,
        name: '幼年',
        display_name: '小绒鸭',
        model: 'duck_baby',
        icon: 'icon_duck_baby',
        animation: ['idle_baby', 'sleep_baby', 'eat_baby'],
        unlock_condition: 'default',
        min_level: 1,
        description: '刚被领养的小鸭子，绒毛蓬松、眼睛很大，走路还有些摇摇晃晃。',
        appearance_keywords: ['小体型', '圆眼睛', '绒毛幼态', '短小翅膀', '动作笨拙'],
        status_role: '可爱、弱小、依赖玩家',
        assets: {
          portrait: '/pets/duck/0.png',
          model: '/pets/duck/models/duck_baby.png',
          icon: '/pets/duck/icons/icon_duck_baby.png',
          badge: '/pets/duck/badges/stage_feather_0.png',
          label: '/pets/duck/labels/stage_label_0.png',
          effect: '/pets/duck/effects/evolve_stage_0.png',
        },
      },
      {
        stage: 1,
        name: '成长',
        display_name: '探险鸭',
        model: 'duck_growing',
        icon: 'icon_duck_growing',
        animation: ['idle_growing', 'walk_growing', 'play_growing'],
        unlock_condition: 'level >= 3',
        min_level: 3,
        description: '开始熟悉主人，背上小挎包主动探索，会开心地陪玩家完成练习。',
        appearance_keywords: ['体型变大', '主动迈步', '探索挎包', '星星算术挂饰', '眼神好奇'],
        status_role: '活跃、好奇、可以互动',
        assets: {
          portrait: '/pets/duck/1.png',
          model: '/pets/duck/models/duck_growing.png',
          icon: '/pets/duck/icons/icon_duck_growing.png',
          badge: '/pets/duck/badges/stage_feather_1.png',
          label: '/pets/duck/labels/stage_label_1.png',
          effect: '/pets/duck/effects/evolve_stage_1.png',
        },
      },
      {
        stage: 2,
        name: '强壮',
        display_name: '守护鸭',
        model: 'duck_strong',
        icon: 'icon_duck_strong',
        animation: ['idle_strong', 'guard_strong', 'skill_strong'],
        unlock_condition: 'level >= 6',
        min_level: 6,
        description: '身体更厚实，戴上蓝金护甲和算术盾牌，能在挑战中可靠地守护玩家。',
        appearance_keywords: ['厚实体型', '稳固站姿', '蓝金护甲', '算术盾牌', '守护光效'],
        status_role: '可靠、强壮、能协助完成任务',
        assets: {
          portrait: '/pets/duck/2.png',
          model: '/pets/duck/models/duck_strong.png',
          icon: '/pets/duck/icons/icon_duck_strong.png',
          badge: '/pets/duck/badges/stage_feather_2.png',
          label: '/pets/duck/labels/stage_label_2.png',
          effect: '/pets/duck/effects/evolve_stage_2.png',
        },
      },
      {
        stage: 3,
        name: '完全体',
        display_name: '灵羽鸭王',
        model: 'duck_final',
        icon: 'icon_duck_final',
        animation: ['idle_final', 'aura_final', 'special_final'],
        unlock_condition: 'level >= 9',
        min_level: 9,
        description: '鸭子的最终进化形态，金蓝灵羽、宝石头冠和漂浮算术光球展现稀有力量。',
        appearance_keywords: ['高挑体型', '华丽灵羽', '宝石头冠', '漂浮算术光球', '最终灵气'],
        status_role: '成熟、稀有、有特殊能力的最终形态',
        assets: {
          portrait: '/pets/duck/3.png',
          model: '/pets/duck/models/duck_final.png',
          icon: '/pets/duck/icons/icon_duck_final.png',
          badge: '/pets/duck/badges/stage_feather_3.png',
          label: '/pets/duck/labels/stage_label_3.png',
          effect: '/pets/duck/effects/evolve_stage_3.png',
        },
      },
    ],
  },
};

const GENERATED_STAGE_SUFFIXES = ['baby', 'growing', 'strong', 'final'];
const GENERATED_STAGE_ANIMATIONS = [
  ['idle_baby', 'sleep_baby', 'eat_baby'],
  ['idle_growing', 'walk_growing', 'play_growing'],
  ['idle_strong', 'guard_strong', 'skill_strong'],
  ['idle_final', 'aura_final', 'special_final'],
];
const GENERATED_STAGE_KEYWORDS = [
  ['小体型', '圆眼睛', '幼态特征', '动作笨拙'],
  ['体型变大', '主动姿态', '探索装饰', '行动力提升'],
  ['厚实体型', '稳固站姿', '护甲感', '守护感'],
  ['成熟体型', '专属饰品', '光效符文', '最终进化特征'],
];
const GENERATED_STAGE_ROLES = [
  '可爱、弱小、依赖玩家',
  '活跃、好奇、可以互动',
  '可靠、强壮、能协助完成任务',
  '成熟、稀有、有特殊能力的最终形态',
];
const GENERATED_GROWTH_RESOURCE_DEFS = {
  dog: {
    pet_id: 'dog_001',
    pet_name: '小狗',
    food: '肉骨头',
    theme: 'bone',
    display_names: ['奶团小狗', '探险汪', '守护犬', '星盾灵犬'],
    feature: '软耳朵和骨形星盾',
  },
  rabbit: {
    pet_id: 'rabbit_001',
    pet_name: '小兔',
    food: '胡萝卜',
    theme: 'carrot',
    display_names: ['棉球兔', '跳跳兔', '月盾兔', '月华灵兔'],
    feature: '长耳朵和胡萝卜盾牌',
  },
  chick: {
    pet_id: 'chick_001',
    pet_name: '小鸡',
    food: '小米粒',
    theme: 'seed',
    display_names: ['绒绒鸡', '奔跑小鸡', '勇气咕咕', '金羽晨鸡'],
    feature: '绒羽、短翅膀和日出金羽',
  },
  fox: {
    pet_id: 'fox_001',
    pet_name: '狐狸',
    food: '浆果',
    theme: 'tail',
    display_names: ['小狐芽', '探算狐', '星盾狐', '九尾灵狐'],
    feature: '蓬松尾巴和灵狐光球',
  },
  panda: {
    pet_id: 'panda_001',
    pet_name: '熊猫',
    food: '竹笋',
    theme: 'bamboo',
    display_names: ['团团幼熊', '竹林伙伴', '竹甲熊猫', '墨竹灵熊'],
    feature: '黑白圆脸和竹纹护甲',
  },
  penguin: {
    pet_id: 'penguin_001',
    pet_name: '企鹅',
    food: '冰鲜鱼',
    theme: 'ice',
    display_names: ['冰绒企鹅', '滑冰企鹅', '冰盾企鹅', '极光皇企鹅'],
    feature: '冰蓝围巾和极光冰冠',
  },
  dragon: {
    pet_id: 'dragon_001',
    pet_name: '萌龙',
    food: '火龙果',
    theme: 'dragon',
    display_names: ['果芽小龙', '云游萌龙', '龙甲守卫', '数珠天龙'],
    feature: '短角、小翅膀和发光数珠',
  },
  goat: {
    pet_id: 'goat_001',
    pet_name: '山羊',
    food: '青草',
    theme: 'horn',
    display_names: ['咩咩羊崽', '攀岩山羊', '角甲山羊', '星角灵羊'],
    feature: '弯角、胡须和青草符文',
  },
  poop: {
    pet_id: 'poop_001',
    pet_name: '臭臭',
    food: '薄荷叶',
    theme: 'mint',
    display_names: ['小软团', '薄荷团', '净化团', '香草灵团'],
    feature: '旋涡身体和薄荷净化气泡',
  },
};

function generatedStageDescription(def, stage) {
  if (stage === 0) return `刚被领养的${def.pet_name}，${def.feature}还处在幼态阶段，体型小、眼睛圆，动作笨拙但非常依赖玩家。`;
  if (stage === 1) return '开始熟悉主人后变得活跃好奇，体型变大，加入轻量探索装饰，能主动陪玩家完成算术练习。';
  if (stage === 2) return `进入强壮阶段后站姿更稳，护甲、盾牌和${def.feature}强化了能力感，能可靠协助任务。`;
  return `最终进化后的${def.display_names[3]}拥有成熟体型、专属饰品、光效与符文灵气，呈现稀有最终形态。`;
}

function buildGeneratedGrowthResource(runtimePetId, def) {
  return {
    pet_id: def.pet_id,
    pet_name: def.pet_name,
    runtime_pet_id: runtimePetId,
    food: def.food,
    resource_version: `${runtimePetId}-growth-v1-2026-05-23`,
    style_reference: 'cute polished 3D mobile game pet, children arithmetic companion, clean centered full-body asset',
    stage_min_level: STAGE_MIN_LEVEL,
    asset_groups: ['portrait', 'model', 'icon', 'badge', 'label', 'effect'],
    growth_stages: STAGE_LABELS.map((stageNameValue, stage) => {
      const suffix = GENERATED_STAGE_SUFFIXES[stage];
      return {
        stage,
        name: stageNameValue,
        display_name: def.display_names[stage],
        model: `${runtimePetId}_${suffix}`,
        icon: `icon_${runtimePetId}_${suffix}`,
        animation: GENERATED_STAGE_ANIMATIONS[stage],
        unlock_condition: stage === 0 ? 'default' : `level >= ${STAGE_MIN_LEVEL[stage]}`,
        min_level: STAGE_MIN_LEVEL[stage],
        description: generatedStageDescription(def, stage),
        appearance_keywords: [...GENERATED_STAGE_KEYWORDS[stage], def.feature],
        status_role: GENERATED_STAGE_ROLES[stage],
        assets: {
          portrait: `/pets/${runtimePetId}/${stage}.png`,
          model: `/pets/${runtimePetId}/models/${runtimePetId}_${suffix}.png`,
          icon: `/pets/${runtimePetId}/icons/icon_${runtimePetId}_${suffix}.png`,
          badge: `/pets/${runtimePetId}/badges/stage_${def.theme}_${stage}.png`,
          label: `/pets/${runtimePetId}/labels/stage_label_${stage}.png`,
          effect: `/pets/${runtimePetId}/effects/evolve_stage_${stage}.png`,
        },
      };
    }),
  };
}

Object.assign(
  PET_GROWTH_RESOURCES,
  Object.fromEntries(
    Object.entries(GENERATED_GROWTH_RESOURCE_DEFS).map(([runtimePetId, def]) => [
      runtimePetId,
      buildGeneratedGrowthResource(runtimePetId, def),
    ]),
  ),
);

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
      minLevel: stage.min_level ?? STAGE_MIN_LEVEL[stage.stage],
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
