// 英文 Phonics 词库（自然拼读法）
//
// 数据模式（与语言无关，未来 phonics-zh-bank.js 可镜像此结构）：
//   { id, tier, word, parts:[{ letter, phoneme, silent? }], emoji, sentence }
//
// phoneme：传给 TTS 的近似音字符串。Web Speech 不发 IPA，
//   用 "kuh / aaa / tuh" 这种伪写法读起来比字母名更接近真实音素。
//
// 关卡分层（stage 1..1000 → tier）：
//   cvc-a   1–150    短 a 的 CVC（cat/hat...）
//   cvc-mix 151–350  其余短元音 CVC（dog/sun/pen...）
//   cvce    351–550  魔法 e（cake/bike...）
//   digraph 551–750  辅音组合（sh/ch/th/wh）
//   blend   751–1000 辅音连缀（st/cl/fr/bl...）
//
// 关卡 → 词的映射是**确定性**的（同关同题号永远同词）。

export const TIERS = [
  { id: 'cvc-a',   name: 'CVC · 短 a',    stageStart: 1,   stageEnd: 150  },
  { id: 'cvc-mix', name: 'CVC · 混合',     stageStart: 151, stageEnd: 350  },
  { id: 'cvce',    name: '魔法 e (CVCe)',  stageStart: 351, stageEnd: 550  },
  { id: 'digraph', name: '辅音组合',        stageStart: 551, stageEnd: 750  },
  { id: 'blend',   name: '辅音连缀',        stageStart: 751, stageEnd: 1000 },
];

// 标准辅音 / 元音的 phoneme 近似（给 TTS 用）
const PH = {
  // 短元音
  a_: 'aah', e_: 'ehh', i_: 'ihh', o_: 'ahh', u_: 'uhh',
  // 长元音 / 魔法 e
  a$: 'ay',  i$: 'eye', o$: 'oh',  u$: 'you', e$: 'ee',
  // 辅音（加极短 schwa，听感接近真实音素）
  b: 'buh', c: 'kuh', d: 'duh', f: 'fff', g: 'guh', h: 'huh',
  j: 'juh', k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', p: 'puh',
  q: 'kw',  r: 'rrr', s: 'sss', t: 'tuh', v: 'vvv', w: 'wuh',
  x: 'kss', y: 'yuh', z: 'zzz',
  // 辅音组合
  sh: 'shh', ch: 'ch', th: 'thh', wh: 'wuh', ph: 'fff', ck: 'kuh',
};

// 构造单字母 part 的小工具
function L(letter, phoneme, silent = false) {
  return { letter, phoneme: silent ? '' : phoneme, silent };
}

// =============== Tier 1: CVC · 短 a ===============
const TIER_CVC_A = [
  { word: 'cat', emoji: '🐱', sentence: 'A cat naps on the mat.',
    parts: [L('c', PH.c), L('a', PH.a_), L('t', PH.t)] },
  { word: 'hat', emoji: '🎩', sentence: 'My new hat is red.',
    parts: [L('h', PH.h), L('a', PH.a_), L('t', PH.t)] },
  { word: 'bat', emoji: '🦇', sentence: 'A bat flies at night.',
    parts: [L('b', PH.b), L('a', PH.a_), L('t', PH.t)] },
  { word: 'rat', emoji: '🐀', sentence: 'The rat ran fast.',
    parts: [L('r', PH.r), L('a', PH.a_), L('t', PH.t)] },
  { word: 'mat', emoji: '🟫', sentence: 'Sit on the mat.',
    parts: [L('m', PH.m), L('a', PH.a_), L('t', PH.t)] },
  { word: 'can', emoji: '🥫', sentence: 'Open the can.',
    parts: [L('c', PH.c), L('a', PH.a_), L('n', PH.n)] },
  { word: 'fan', emoji: '🪭', sentence: 'Turn on the fan.',
    parts: [L('f', PH.f), L('a', PH.a_), L('n', PH.n)] },
  { word: 'man', emoji: '🧑', sentence: 'The man waves hi.',
    parts: [L('m', PH.m), L('a', PH.a_), L('n', PH.n)] },
  { word: 'pan', emoji: '🍳', sentence: 'Eggs in the pan.',
    parts: [L('p', PH.p), L('a', PH.a_), L('n', PH.n)] },
  { word: 'jam', emoji: '🍓', sentence: 'I like jam on toast.',
    parts: [L('j', PH.j), L('a', PH.a_), L('m', PH.m)] },
  { word: 'bag', emoji: '🛍️', sentence: 'Put it in the bag.',
    parts: [L('b', PH.b), L('a', PH.a_), L('g', PH.g)] },
  { word: 'tap', emoji: '🚰', sentence: 'Tap the door.',
    parts: [L('t', PH.t), L('a', PH.a_), L('p', PH.p)] },
];

// =============== Tier 2: CVC · 其余短元音 ===============
const TIER_CVC_MIX = [
  { word: 'dog', emoji: '🐶', sentence: 'The dog wags its tail.',
    parts: [L('d', PH.d), L('o', PH.o_), L('g', PH.g)] },
  { word: 'log', emoji: '🪵', sentence: 'A log floats on the pond.',
    parts: [L('l', PH.l), L('o', PH.o_), L('g', PH.g)] },
  { word: 'box', emoji: '📦', sentence: 'Open the gift box.',
    parts: [L('b', PH.b), L('o', PH.o_), L('x', PH.x)] },
  { word: 'hop', emoji: '🐰', sentence: 'Bunnies hop fast.',
    parts: [L('h', PH.h), L('o', PH.o_), L('p', PH.p)] },
  { word: 'top', emoji: '🔝', sentence: 'Up to the top!',
    parts: [L('t', PH.t), L('o', PH.o_), L('p', PH.p)] },
  { word: 'mop', emoji: '🧹', sentence: 'Mop the floor.',
    parts: [L('m', PH.m), L('o', PH.o_), L('p', PH.p)] },
  { word: 'sun', emoji: '☀️', sentence: 'The sun is bright.',
    parts: [L('s', PH.s), L('u', PH.u_), L('n', PH.n)] },
  { word: 'run', emoji: '🏃', sentence: 'Let us run together.',
    parts: [L('r', PH.r), L('u', PH.u_), L('n', PH.n)] },
  { word: 'bug', emoji: '🐛', sentence: 'A green bug crawls.',
    parts: [L('b', PH.b), L('u', PH.u_), L('g', PH.g)] },
  { word: 'hug', emoji: '🤗', sentence: 'Give me a big hug.',
    parts: [L('h', PH.h), L('u', PH.u_), L('g', PH.g)] },
  { word: 'cup', emoji: '🥤', sentence: 'Fill the cup with milk.',
    parts: [L('c', PH.c), L('u', PH.u_), L('p', PH.p)] },
  { word: 'pen', emoji: '🖊️', sentence: 'Write with the pen.',
    parts: [L('p', PH.p), L('e', PH.e_), L('n', PH.n)] },
  { word: 'hen', emoji: '🐔', sentence: 'The hen lays an egg.',
    parts: [L('h', PH.h), L('e', PH.e_), L('n', PH.n)] },
  { word: 'bed', emoji: '🛏️', sentence: 'Go to bed now.',
    parts: [L('b', PH.b), L('e', PH.e_), L('d', PH.d)] },
  { word: 'red', emoji: '🟥', sentence: 'A red apple is sweet.',
    parts: [L('r', PH.r), L('e', PH.e_), L('d', PH.d)] },
  { word: 'pig', emoji: '🐷', sentence: 'The pink pig oinks.',
    parts: [L('p', PH.p), L('i', PH.i_), L('g', PH.g)] },
  { word: 'dig', emoji: '⛏️', sentence: 'Dig in the sand.',
    parts: [L('d', PH.d), L('i', PH.i_), L('g', PH.g)] },
  { word: 'six', emoji: '6️⃣', sentence: 'I am six years old.',
    parts: [L('s', PH.s), L('i', PH.i_), L('x', PH.x)] },
];

// =============== Tier 3: 魔法 e (CVCe) ===============
// 末尾 e 不发音（silent: true），让前一个元音变长
const TIER_CVCE = [
  { word: 'cake', emoji: '🎂', sentence: 'Happy birthday cake!',
    parts: [L('c', PH.c), L('a', PH.a$), L('k', PH.k), L('e', '', true)] },
  { word: 'lake', emoji: '🏞️', sentence: 'Swim in the lake.',
    parts: [L('l', PH.l), L('a', PH.a$), L('k', PH.k), L('e', '', true)] },
  { word: 'gate', emoji: '🚪', sentence: 'Open the gate.',
    parts: [L('g', PH.g), L('a', PH.a$), L('t', PH.t), L('e', '', true)] },
  { word: 'name', emoji: '🪪', sentence: 'Tell me your name.',
    parts: [L('n', PH.n), L('a', PH.a$), L('m', PH.m), L('e', '', true)] },
  { word: 'bike', emoji: '🚲', sentence: 'I ride my bike.',
    parts: [L('b', PH.b), L('i', PH.i$), L('k', PH.k), L('e', '', true)] },
  { word: 'kite', emoji: '🪁', sentence: 'Fly the kite high.',
    parts: [L('k', PH.k), L('i', PH.i$), L('t', PH.t), L('e', '', true)] },
  { word: 'time', emoji: '⏰', sentence: 'It is time to go.',
    parts: [L('t', PH.t), L('i', PH.i$), L('m', PH.m), L('e', '', true)] },
  { word: 'home', emoji: '🏠', sentence: 'Welcome home.',
    parts: [L('h', PH.h), L('o', PH.o$), L('m', PH.m), L('e', '', true)] },
  { word: 'bone', emoji: '🦴', sentence: 'The dog hides the bone.',
    parts: [L('b', PH.b), L('o', PH.o$), L('n', PH.n), L('e', '', true)] },
  { word: 'rose', emoji: '🌹', sentence: 'A pink rose blooms.',
    parts: [L('r', PH.r), L('o', PH.o$), L('s', PH.s), L('e', '', true)] },
  { word: 'cube', emoji: '🧊', sentence: 'An ice cube is cold.',
    parts: [L('c', PH.c), L('u', PH.u$), L('b', PH.b), L('e', '', true)] },
  { word: 'tube', emoji: '🧪', sentence: 'Squeeze the tube.',
    parts: [L('t', PH.t), L('u', PH.u$), L('b', PH.b), L('e', '', true)] },
];

// =============== Tier 4: 辅音组合 ===============
const TIER_DIGRAPH = [
  { word: 'ship', emoji: '🚢', sentence: 'The big ship sails.',
    parts: [L('sh', PH.sh), L('i', PH.i_), L('p', PH.p)] },
  { word: 'shop', emoji: '🏬', sentence: 'I shop for fruit.',
    parts: [L('sh', PH.sh), L('o', PH.o_), L('p', PH.p)] },
  { word: 'fish', emoji: '🐟', sentence: 'A gold fish swims.',
    parts: [L('f', PH.f), L('i', PH.i_), L('sh', PH.sh)] },
  { word: 'shoe', emoji: '👟', sentence: 'Tie your shoe.',
    parts: [L('sh', PH.sh), L('o', PH.o$), L('e', '', true)] },
  { word: 'chip', emoji: '🍟', sentence: 'One more chip, please.',
    parts: [L('ch', PH.ch), L('i', PH.i_), L('p', PH.p)] },
  { word: 'chin', emoji: '👶', sentence: 'Lift up your chin.',
    parts: [L('ch', PH.ch), L('i', PH.i_), L('n', PH.n)] },
  { word: 'chop', emoji: '🪓', sentence: 'Chop the wood.',
    parts: [L('ch', PH.ch), L('o', PH.o_), L('p', PH.p)] },
  { word: 'much', emoji: '🤲', sentence: 'How much is it?',
    parts: [L('m', PH.m), L('u', PH.u_), L('ch', PH.ch)] },
  { word: 'this', emoji: '👉', sentence: 'Look at this.',
    parts: [L('th', PH.th), L('i', PH.i_), L('s', PH.s)] },
  { word: 'that', emoji: '👈', sentence: 'I want that one.',
    parts: [L('th', PH.th), L('a', PH.a_), L('t', PH.t)] },
  { word: 'with', emoji: '🤝', sentence: 'Come with me.',
    parts: [L('w', PH.w), L('i', PH.i_), L('th', PH.th)] },
  { word: 'when', emoji: '⏳', sentence: 'When do we go?',
    parts: [L('wh', PH.wh), L('e', PH.e_), L('n', PH.n)] },
];

// =============== Tier 5: 辅音连缀 ===============
const TIER_BLEND = [
  { word: 'stop', emoji: '🛑', sentence: 'Please stop here.',
    parts: [L('s', PH.s), L('t', PH.t), L('o', PH.o_), L('p', PH.p)] },
  { word: 'star', emoji: '⭐', sentence: 'A bright star shines.',
    parts: [L('s', PH.s), L('t', PH.t), L('a', PH.a_), L('r', PH.r)] },
  { word: 'snap', emoji: '📸', sentence: 'Snap a picture.',
    parts: [L('s', PH.s), L('n', PH.n), L('a', PH.a_), L('p', PH.p)] },
  { word: 'swim', emoji: '🏊', sentence: 'I swim in summer.',
    parts: [L('s', PH.s), L('w', PH.w), L('i', PH.i_), L('m', PH.m)] },
  { word: 'frog', emoji: '🐸', sentence: 'A green frog hops.',
    parts: [L('f', PH.f), L('r', PH.r), L('o', PH.o_), L('g', PH.g)] },
  { word: 'flag', emoji: '🚩', sentence: 'Raise the flag.',
    parts: [L('f', PH.f), L('l', PH.l), L('a', PH.a_), L('g', PH.g)] },
  { word: 'drum', emoji: '🥁', sentence: 'Beat the drum.',
    parts: [L('d', PH.d), L('r', PH.r), L('u', PH.u_), L('m', PH.m)] },
  { word: 'drop', emoji: '💧', sentence: 'One rain drop fell.',
    parts: [L('d', PH.d), L('r', PH.r), L('o', PH.o_), L('p', PH.p)] },
  { word: 'plum', emoji: '🍑', sentence: 'Eat a sweet plum.',
    parts: [L('p', PH.p), L('l', PH.l), L('u', PH.u_), L('m', PH.m)] },
  { word: 'plan', emoji: '🗺️', sentence: 'We have a plan.',
    parts: [L('p', PH.p), L('l', PH.l), L('a', PH.a_), L('n', PH.n)] },
  { word: 'crab', emoji: '🦀', sentence: 'A red crab walks.',
    parts: [L('c', PH.c), L('r', PH.r), L('a', PH.a_), L('b', PH.b)] },
  { word: 'club', emoji: '🎴', sentence: 'Join the kids club.',
    parts: [L('c', PH.c), L('l', PH.l), L('u', PH.u_), L('b', PH.b)] },
];

// 按 tier 归组 + 全部词表
const TIER_MAP = {
  'cvc-a':   TIER_CVC_A,
  'cvc-mix': TIER_CVC_MIX,
  'cvce':    TIER_CVCE,
  'digraph': TIER_DIGRAPH,
  'blend':   TIER_BLEND,
};

// 给每个词补 id 和 tier 字段
export const PHONICS_WORDS = Object.entries(TIER_MAP).flatMap(([tierId, list]) =>
  list.map(w => ({ ...w, id: w.word, tier: tierId, lang: 'en-US' }))
);

/** 根据 stage 找到对应 tier */
export function tierOfStage(stage) {
  const s = Math.max(1, Math.min(1000, Math.floor(stage)));
  return TIERS.find(t => s >= t.stageStart && s <= t.stageEnd) || TIERS[0];
}

/** 关卡 + 题号 → 确定性选词（同关同题永远同词） */
export function pickWordForStage(stage, qIdx = 0) {
  const tier = tierOfStage(stage);
  const pool = TIER_MAP[tier.id];
  if (!pool || !pool.length) return PHONICS_WORDS[0];
  // 用大素数 hash 一下，让 5 题之间分散
  const seed = (stage * 31 + qIdx * 7) >>> 0;
  const idx = seed % pool.length;
  const w = pool[idx];
  return { ...w, id: w.word, tier: tier.id, lang: 'en-US' };
}

/** 用于检验用户拼对的辅助：把 word 的 parts 还原成"应有的字母序列" */
export function correctOrder(word) {
  return word.parts.map(p => p.letter);
}
