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
const WORDS_PER_PACK = 8;

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

export const READING_PACKS = [...ENGLISH_PACKS, ...CHINESE_PACKS];

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
