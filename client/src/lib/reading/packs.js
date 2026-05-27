// 阅读引擎 · 词包注册表（单一事实源）
// ─────────────────────────────────────────────────────────────
// 引擎语言无关：一个"词包(pack)"= 一组规范化的 ReadingWord + 一条阶段管线。
// 加内容 = 加数据；加语言 = 加一个 pack（必要时给它换一条管线 / 拼词变体）。
//
// ReadingWord 规范形（所有语言统一）：
//   {
//     id, lang, text,                       // text = 展示词 / 字
//     image: { kind:'emoji'|'asset', value },
//     units: [{ glyph, sound, silent }],    // 拼词单元（英文=字母, 中文=拼音音节…）
//     sentence: { text, focus },            // focus = 句中要高亮/挖空的目标词
//     audio?: { word, sentence, units }     // 预留：真人录音 key（见 resources.js）
//   }
//
// Pack：
//   {
//     id, lang, name, emoji, color,
//     pipeline: [stepType...],              // 覆盖默认管线（见 pipeline.js）
//     spell: 'phonics'|'syllable'|...,      // 拼词阶段用哪个变体（pipeline.js 注册表）
//     challenge: { subject, module } | null,// 挑战关深链目标；null = 暂无挑战关
//     words: [ReadingWord...],
//   }

import { TIERS, PHONICS_WORDS } from '../phonics-en-bank.js';

// 每个英语词包从对应 tier 取前 N 个词（探索友好的体量；想全量改大即可）。
const WORDS_PER_PACK = 12;

// 英文 phonics 词 → 规范 ReadingWord
function fromPhonics(w) {
  return {
    id: w.id,
    lang: w.lang || 'en-US',
    text: w.word,
    image: { kind: 'emoji', value: w.emoji },
    units: w.parts.map(p => ({ glyph: p.letter, sound: p.phoneme, silent: !!p.silent })),
    sentence: { text: w.sentence, focus: w.word },
  };
}

// 按 tier 自动生成英语词包：未来往 phonics-en-bank 加词，这里自动多出来。
const ENGLISH_PACKS = TIERS.map((tier, i) => {
  const words = PHONICS_WORDS
    .filter(w => w.tier === tier.id)
    .slice(0, WORDS_PER_PACK)
    .map(fromPhonics);
  return {
    id: `en-${tier.id}`,
    lang: 'en-US',
    name: tier.name,
    emoji: ['🐱', '🧩', '✨', '🔤', '🚀'][i] || '📖',
    color: ['#3a92e0', '#54b85a', '#9b5cd6', '#e8862e', '#d83f7a'][i] || '#3a92e0',
    pipeline: ['reveal', 'spell', 'say', 'sentence'],
    spell: 'phonics',
    // 挑战关深链：英语「自然拼读」模块的对应 tier 起始关
    challenge: { subject: 'english', module: 'spell', stage: tier.stageStart },
    // 整包探索完成的温和奖励（数据驱动，可按包覆盖）
    reward: { coins: 20, foodId: 'berry', qty: 1 },
    words,
  };
});

// 手写英语主题包：units = [[glyph, sound, silent?], ...]（音素沿用 phonics-en-bank 口径）
function mkEn(text, emoji, sentence, units) {
  return {
    id: `en-x-${text}`,
    lang: 'en-US',
    text,
    image: { kind: 'emoji', value: emoji },
    units: units.map(([glyph, sound, silent = false]) => ({ glyph, sound, silent })),
    sentence: { text: sentence, focus: text },
  };
}

const EXTRA_ENGLISH_PACKS = [
  {
    id: 'en-farm',
    lang: 'en-US',
    name: '农场动物',
    emoji: '🐾',
    color: '#54b85a',
    pipeline: ['reveal', 'spell', 'say', 'sentence'],
    spell: 'phonics',
    challenge: { subject: 'english', module: 'spell', stage: 151 },
    reward: { coins: 20, foodId: 'berry', qty: 1 },
    words: [
      mkEn('dog', '🐶', 'The dog can run.', [['d', 'duh'], ['o', 'ahh'], ['g', 'guh']]),
      mkEn('pig', '🐷', 'A pig is pink.', [['p', 'puh'], ['i', 'ihh'], ['g', 'guh']]),
      mkEn('hen', '🐔', 'The hen sits down.', [['h', 'huh'], ['e', 'ehh'], ['n', 'nnn']]),
      mkEn('duck', '🦆', 'A duck can swim.', [['d', 'duh'], ['u', 'uhh'], ['ck', 'kuh']]),
      mkEn('fox', '🦊', 'The fox is red.', [['f', 'fff'], ['o', 'ahh'], ['x', 'kss']]),
      mkEn('bug', '🐛', 'A bug is small.', [['b', 'buh'], ['u', 'uhh'], ['g', 'guh']]),
    ],
  },
  {
    id: 'en-action',
    lang: 'en-US',
    name: '做动作',
    emoji: '🏃',
    color: '#e8529a',
    pipeline: ['reveal', 'spell', 'say', 'sentence'],
    spell: 'phonics',
    challenge: { subject: 'english', module: 'spell', stage: 151 },
    reward: { coins: 20, foodId: 'berry', qty: 1 },
    words: [
      mkEn('run', '🏃', 'I can run fast.', [['r', 'rrr'], ['u', 'uhh'], ['n', 'nnn']]),
      mkEn('sit', '🪑', 'Please sit down.', [['s', 'sss'], ['i', 'ihh'], ['t', 'tuh']]),
      mkEn('hop', '🐰', 'Rabbits hop high.', [['h', 'huh'], ['o', 'ahh'], ['p', 'puh']]),
      mkEn('nap', '😴', 'The cat takes a nap.', [['n', 'nnn'], ['a', 'aah'], ['p', 'puh']]),
      mkEn('dig', '🕳️', 'Dogs dig in the yard.', [['d', 'duh'], ['i', 'ihh'], ['g', 'guh']]),
      mkEn('cut', '✂️', 'Cut the paper.', [['c', 'kuh'], ['u', 'uhh'], ['t', 'tuh']]),
    ],
  },
];

// 中文体验包：证明引擎语言无关。
// 中文"拼字"用 'syllable' 变体——把拼音 piece（声母/韵母）按序拼成整字读音
// （见 SyllableSpellStep.vue），故走完整四段式，与英文并列验证引擎可插拔。
const CHINESE_PACKS = [
  {
    id: 'zh-life',
    lang: 'zh-CN',
    name: '生活小词',
    emoji: '🀄',
    color: '#e85b5b',
    pipeline: ['reveal', 'spell', 'say', 'sentence'],
    spell: 'syllable', // 中文拼字变体
    // 挑战关深链：语文「拼音匹配」模块（汉字↔拼音双向选，复用计分+口粮）
    challenge: { subject: 'chinese', module: 'pinyin', stage: 1 },
    reward: { coins: 20, foodId: 'corn', qty: 1 },
    words: [
      mkZh('māo', '猫', '🐱', '小猫在窗台上晒太阳。', ['m', 'āo']),
      mkZh('gǒu', '狗', '🐶', '小狗摇着尾巴跑过来。', ['g', 'ǒu']),
      mkZh('yú', '鱼', '🐟', '鱼儿在水里游来游去。', ['y', 'ú']),
      mkZh('huā', '花', '🌸', '花园里开满了花。', ['h', 'uā']),
      mkZh('shù', '树', '🌳', '大树下面真凉快。', ['sh', 'ù']),
      mkZh('yuè', '月', '🌙', '月亮挂在天上。', ['y', 'uè']),
    ],
  },
  {
    id: 'zh-color',
    lang: 'zh-CN',
    name: '认识颜色',
    emoji: '🎨',
    color: '#e8862e',
    pipeline: ['reveal', 'spell', 'say', 'sentence'],
    spell: 'syllable',
    challenge: { subject: 'chinese', module: 'pinyin', stage: 1 },
    reward: { coins: 20, foodId: 'carrot', qty: 1 },
    words: [
      mkZh('hóng', '红', '🔴', '红色的太阳真好看。', ['h', 'óng']),
      mkZh('huáng', '黄', '🟡', '黄色的小鸭子。', ['h', 'uáng']),
      mkZh('lán', '蓝', '🔵', '蓝色的天空很美。', ['l', 'án']),
      mkZh('lǜ', '绿', '🟢', '绿色的小草。', ['l', 'ǜ']),
      mkZh('bái', '白', '⚪', '白色的云朵。', ['b', 'ái']),
      mkZh('hēi', '黑', '⚫', '黑色的夜晚。', ['h', 'ēi']),
    ],
  },
  {
    id: 'zh-number',
    lang: 'zh-CN',
    name: '数一数',
    emoji: '🔢',
    color: '#3a92e0',
    pipeline: ['reveal', 'spell', 'say', 'sentence'],
    spell: 'syllable',
    challenge: { subject: 'chinese', module: 'pinyin', stage: 1 },
    reward: { coins: 20, foodId: 'millet', qty: 1 },
    words: [
      mkZh('yī', '一', '1️⃣', '一只小猫。', ['y', 'ī']),
      mkZh('èr', '二', '2️⃣', '二只小鸟。', ['èr']),
      mkZh('sān', '三', '3️⃣', '三个苹果。', ['s', 'ān']),
      mkZh('sì', '四', '4️⃣', '四条小鱼。', ['s', 'ì']),
      mkZh('wǔ', '五', '5️⃣', '五朵花。', ['w', 'ǔ']),
    ],
  },
  {
    id: 'zh-common',
    lang: 'zh-CN',
    name: '常见字',
    emoji: '📖',
    color: '#9b5cd6',
    pipeline: ['reveal', 'spell', 'say', 'sentence'],
    spell: 'syllable',
    challenge: { subject: 'chinese', module: 'pinyin', stage: 1 },
    reward: { coins: 20, foodId: 'bamboo', qty: 1 },
    words: [
      mkZh('rén', '人', '🧍', '马路上有很多人。', ['r', 'én']),
      mkZh('kǒu', '口', '👄', '张开口大声读。', ['k', 'ǒu']),
      mkZh('shǒu', '手', '✋', '我用手拿苹果。', ['sh', 'ǒu']),
      mkZh('mù', '目', '👁️', '目是眼睛的意思。', ['m', 'ù']),
      mkZh('shān', '山', '⛰️', '山上有一棵树。', ['sh', 'ān']),
      mkZh('shuǐ', '水', '💧', '小鱼在水里游。', ['sh', 'uǐ']),
    ],
  },
  {
    id: 'zh-nature',
    lang: 'zh-CN',
    name: '大自然',
    emoji: '🌿',
    color: '#2bb3a3',
    pipeline: ['reveal', 'spell', 'say', 'sentence'],
    spell: 'syllable',
    challenge: { subject: 'chinese', module: 'pinyin', stage: 1 },
    reward: { coins: 20, foodId: 'grass', qty: 1 },
    words: [
      mkZh('rì', '日', '☀️', '太阳又叫日。', ['r', 'ì']),
      mkZh('huǒ', '火', '🔥', '火很烫，别碰。', ['h', 'uǒ']),
      mkZh('tǔ', '土', '🟫', '种子种在土里。', ['t', 'ǔ']),
      mkZh('shí', '石', '🪨', '河边有大石头。', ['sh', 'í']),
      mkZh('tián', '田', '🌾', '田里种着稻子。', ['t', 'ián']),
      mkZh('yǔ', '雨', '🌧️', '下雨要打伞。', ['y', 'ǔ']),
    ],
  },
];

function mkZh(pinyin, char, emoji, sentence, syllableUnits) {
  return {
    id: `zh-${char}`,
    lang: 'zh-CN',
    text: char,
    pinyin,
    image: { kind: 'emoji', value: emoji },
    units: syllableUnits.map(u => ({ glyph: u, sound: char, silent: false })),
    sentence: { text: sentence, focus: char },
  };
}

export const READING_PACKS = [...ENGLISH_PACKS, ...EXTRA_ENGLISH_PACKS, ...CHINESE_PACKS];

export function findPack(packId) {
  return READING_PACKS.find(p => p.id === packId) || null;
}

/** 按语言分组（Hub 里按学科/语言展示）。 */
export function packsByLang(lang) {
  return READING_PACKS.filter(p => p.lang === lang);
}

/** 整包探索完成的奖励（缺省兜底，保证永远有值）。 */
export function packReward(pack) {
  return pack?.reward || { coins: 15, foodId: 'berry', qty: 1 };
}

/** 把规范 ReadingWord 还原成 PhonicsGame 需要的词对象（拼词阶段复用现成组件）。 */
export function toPhonicsWord(word) {
  return {
    id: word.id,
    word: word.text,
    emoji: word.image?.value || '✨',
    sentence: word.sentence?.text || '',
    lang: word.lang || 'en-US',
    parts: word.units.map(u => ({ letter: u.glyph, phoneme: u.sound, silent: !!u.silent })),
    // 不传 tier：探索模式不显示关卡分层标签
  };
}
