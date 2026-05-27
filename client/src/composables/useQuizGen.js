// 多学科出题器
// 入口：genQuestion(subjectId, moduleId, stage) → 题目对象
//
// 返回的 mode：
//   'tile-fill'    数字积木拖拽填空（数学直接模式 + 乘除全程）
//   'multi-step'   多步引导填空（数学加减拆分模式，含 split/calc/done 步骤）
//   'choice'       四选一选择题（语文识字 / 英语字母）
//   'phonics'      自然拼读：听音 → 拼字 → 整词朗读（英语拼写）
//   'placeholder'  占位（敬请期待）

import { decomposeAdd, decomposeSub, decomposeBorrowTrick } from '../lib/decompose.js';
import { OP_OF, PLACE_NAMES, enumWithin10Fact, findCategory } from '../lib/mathLevels.js';
import { PINYIN_CHAR_BANK, POEM_BANK } from '../lib/chineseBank.js';
import { pickWordForStage as pickPhonicsWord } from '../lib/phonics-en-bank.js';

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const sum = (arr) => arr.reduce((s, x) => s + x, 0);
const product = (arr) => arr.reduce((s, x) => s * x, 1);

// ============ 10 以内穷举：第 stage 关的第 qIdx 道固定算式 ============
function genEnum(op, stage, qIdx) {
  const item = enumWithin10Fact(op, stage, qIdx);
  return buildArithTile(item.operands, op, item.answer);
}

// ============ 范围内随机（2 个数，含拆分引导） ============
function genRange(op, cat) {
  const max = cat.max; // 例如 100
  if (op === '+') {
    const a = randInt(1, max - 1);
    const b = randInt(1, max - a);
    // 100 以内加法一律拖拽（凑十法走教学卡，不再自动 multi-step）
    return buildArithTile([a, b], '+', a + b);
  }
  if (op === '-') {
    const a = randInt(2, max);
    const b = randInt(1, a);
    const answer = a - b;
    if (b >= 10 || a % 10 < b % 10) return { mode: 'multi-step', a, b, op: '-', answer, steps: decomposeSub(a, b) };
    return buildArithTile([a, b], '-', answer);
  }
  if (op === '×') {
    const a = randInt(2, 10);
    const b = randInt(2, Math.max(2, Math.floor(max / a)));
    return buildArithTile([a, b], '×', a * b);
  }
  // ÷：范围内整除
  const divisor = randInt(2, 9);
  const quotient = randInt(1, Math.max(1, Math.floor(max / divisor)));
  return buildArithTile([divisor * quotient, divisor], '÷', quotient);
}

// ============ 多个数连算（2 / 3 / 4 个数） ============
function genMulti(op, cat) {
  const n = cat.operands;
  if (op === '+') {
    const cap = n === 2 ? 99 : n === 3 ? 50 : 30;
    const lo = n === 2 ? 10 : 1;
    const operands = Array.from({ length: n }, () => randInt(lo, cap));
    return buildArithTile(operands, '+', sum(operands));
  }
  if (op === '-') {
    const cap = n === 2 ? 99 : n === 3 ? 50 : 30;
    const subs = Array.from({ length: n - 1 }, () => randInt(1, cap));
    const result = randInt(0, cap);
    const minuend = result + sum(subs);
    return buildArithTile([minuend, ...subs], '-', result);
  }
  if (op === '×') {
    const fcap = n === 2 ? 12 : n === 3 ? 6 : 5;
    const operands = Array.from({ length: n }, () => randInt(2, fcap));
    return buildArithTile(operands, '×', product(operands));
  }
  // ÷：连除，从商反推被除数
  const quotient = randInt(1, 9);
  const divisors = Array.from({ length: n - 1 }, () => randInt(2, 5));
  const dividend = quotient * product(divisors);
  return buildArithTile([dividend, ...divisors], '÷', quotient);
}

// ============ 数位认知：把数字拖到 个/十/百/千… 数位 ============
function genPlace(cat) {
  const d = cat.digits;
  let s = String(randInt(1, 9));
  for (let i = 1; i < d; i++) s += String(randInt(0, 9));
  return buildPlaceTile(Number(s), d);
}

// ============ 综合复习（mix）：从 sources[] 各分类轮询 ============
function genMix(cat, qIdx) {
  const src = cat.sources[qIdx % cat.sources.length];
  // 给 enum 类用 random fakeStage + fakeQIdx 让题更多样
  const fakeStage = randInt(1, 9);
  const fakeQIdx = randInt(0, 8);
  return genQuestion('math', src.module, src.category, fakeStage, fakeQIdx);
}

// ============ 立体 / 平面图形识别（choice 复用） ============
// shapeId 与 ShapeIcon.vue 的 SVG 一一对应，prompt 传 shapeId 而不再是 emoji，QuizView 据 promptKind 渲染
const SHAPES_3D = [
  { id: 'cuboid',   name: '长方体' },
  { id: 'cube',     name: '正方体' },
  { id: 'cylinder', name: '圆柱' },
  { id: 'sphere',   name: '球' },
];
const SHAPES_2D = [
  { id: 'rectangle',     name: '长方形' },
  { id: 'square',        name: '正方形' },
  { id: 'triangle',      name: '三角形' },
  { id: 'circle',        name: '圆' },
  { id: 'parallelogram', name: '平行四边形' },
];

function genShape(cat) {
  const bank = cat.dim === '3d' ? SHAPES_3D : SHAPES_2D;
  const item = bank[randInt(0, bank.length - 1)];
  const distractors = shuffle(bank.filter(x => x.id !== item.id))
    .slice(0, Math.min(3, bank.length - 1)).map(x => x.name);
  const options = shuffle([item.name, ...distractors]);
  return {
    mode: 'choice',
    promptKind: cat.dim === '3d' ? 'shape3d' : 'shape2d',
    prompt: item.id,         // shapeId，由 ShapeIcon 渲染 SVG
    sub: cat.dim === '3d' ? '这是什么立体图形？' : '这是什么平面图形？',
    options,
    correctIndex: options.indexOf(item.name),
  };
}

// ============ 人民币（认面额 / 找零） ============
const MONEY_CONVERSIONS = [
  { from: '1 元', to: '10 角', distractors: ['5 角', '100 角', '1 角'] },
  { from: '1 角', to: '10 分', distractors: ['5 分', '100 分', '1 分'] },
  { from: '5 角', to: '50 分', distractors: ['10 分', '5 分', '500 分'] },
  { from: '2 元', to: '20 角', distractors: ['10 角', '200 角', '2 角'] },
  { from: '10 元', to: '100 角', distractors: ['50 角', '10 角', '1000 角'] },
  { from: '5 元', to: '50 角', distractors: ['10 角', '5 角', '500 角'] },
  { from: '3 元', to: '30 角', distractors: ['30 分', '300 角', '3 角'] },
  { from: '2 角', to: '20 分', distractors: ['10 分', '200 分', '2 分'] },
];

const SHOP_ITEMS = ['🧸 玩具熊', '📕 故事书', '🖍 彩笔', '🩹 创可贴', '🚗 小汽车', '🥤 果汁', '🎨 画本', '🍎 苹果', '🍬 糖果', '✏️ 铅笔', '🍌 香蕉', '🧃 牛奶'];

function genMoney(cat) {
  if (cat.sub === 'recognize') {
    const item = MONEY_CONVERSIONS[randInt(0, MONEY_CONVERSIONS.length - 1)];
    const options = shuffle([item.to, ...item.distractors]);
    return {
      mode: 'choice',
      promptKind: 'money',
      prompt: '💴 ' + item.from,
      sub: '等于多少？',
      options,
      correctIndex: options.indexOf(item.to),
    };
  }
  // change：找零（付款 - 商品 = 找零）
  const shopItem = SHOP_ITEMS[randInt(0, SHOP_ITEMS.length - 1)];
  const price = randInt(12, 85);
  // 用常见钞票（10/20/50/100）中比 price 大的随机一张
  const denominations = [10, 20, 50, 100].filter(d => d > price);
  const paid = denominations[randInt(0, denominations.length - 1)];
  const change = paid - price;
  return {
    ...buildArithTile([paid, price], '-', change),
    caption: `🛒 ${shopItem} 一个 ${price} 元，小聪付了 ${paid} 元，应找回多少元？`,
  };
}

// ============ 应用题（中文模板 + tile-fill 答案） ============
// v1.8.1 题库扩到 30+ 模板，按 op 分组；每个模板可设 range / requireAGtB / mode
//   mode 'plain'    a OP b = ?       直白题
//   mode 'unknown-a' ? OP b = result，求被减数/被加数（追加部分）
//   mode 'unknown-b' a OP ? = result，求加数/减数（追加部分）
const WORD_TEMPLATES = [
  // ===== 求和（加法 · 共有 / 一共） =====
  { op: '+', mode: 'plain', range: [5, 40],
    template: (a, b) => `🌸 花园里红花 ${a} 朵，黄花 ${b} 朵，一共多少朵？` },
  { op: '+', mode: 'plain', range: [5, 20],
    template: (a, b) => `🐦 树上原本有 ${a} 只小鸟，又飞来 ${b} 只，现在一共多少只？` },
  { op: '+', mode: 'plain', range: [10, 40],
    template: (a, b) => `🚗 停车场停了 ${a} 辆车，又开来 ${b} 辆，一共多少辆？` },
  { op: '+', mode: 'plain', range: [10, 30],
    template: (a, b) => `🥚 篮子里有 ${a} 个鸡蛋，妈妈又买回 ${b} 个，一共多少个？` },
  { op: '+', mode: 'plain', range: [5, 30],
    template: (a, b) => `🐔 鸡妈妈生了 ${a} 个蛋，鸭妈妈生了 ${b} 个蛋，一共有多少个蛋？` },
  { op: '+', mode: 'plain', range: [5, 20],
    template: (a, b) => `🌟 第一天得了 ${a} 颗星星，第二天又得了 ${b} 颗，两天一共多少颗？` },
  { op: '+', mode: 'plain', range: [8, 30],
    template: (a, b) => `🚌 公交车上原有 ${a} 人，到站上来 ${b} 人，现在车上多少人？` },
  { op: '+', mode: 'plain', range: [10, 25],
    template: (a, b) => `📚 书架上有故事书 ${a} 本，又新到 ${b} 本，一共多少本？` },
  { op: '+', mode: 'plain', range: [5, 25],
    template: (a, b) => `🍓 上午摘了 ${a} 颗草莓，下午又摘了 ${b} 颗，一天摘了多少颗？` },
  { op: '+', mode: 'plain', range: [10, 30],
    template: (a, b) => `🐠 鱼缸里红金鱼 ${a} 条，黑金鱼 ${b} 条，一共多少条？` },
  { op: '+', mode: 'plain', range: [5, 20],
    template: (a, b) => `🍪 哥哥分到 ${a} 块饼干，弟弟分到 ${b} 块，两人一共有多少块？` },
  { op: '+', mode: 'plain', range: [12, 40],
    template: (a, b) => `🎈 庆生会上挂了 ${a} 个红气球和 ${b} 个蓝气球，一共多少个？` },

  // ===== 求剩余（减法 · 还剩） =====
  { op: '-', mode: 'plain', range: [10, 50],
    template: (a, b) => `🍎 树上有 ${a} 个苹果，摘了 ${b} 个，还剩多少个？` },
  { op: '-', mode: 'plain', range: [10, 30],
    template: (a, b) => `🐟 鱼缸里有 ${a} 条小鱼，妈妈拿走 ${b} 条，还剩多少条？` },
  { op: '-', mode: 'plain', range: [10, 20],
    template: (a, b) => `📚 小聪有 ${a} 本书，借给同学 ${b} 本，还剩多少本？` },
  { op: '-', mode: 'plain', range: [10, 30],
    template: (a, b) => `🍭 篮子里有 ${a} 颗糖，吃掉 ${b} 颗，还剩多少颗？` },
  { op: '-', mode: 'plain', range: [12, 40],
    template: (a, b) => `🎨 一盒彩笔原有 ${a} 支，丢了 ${b} 支，还剩多少支？` },
  { op: '-', mode: 'plain', range: [15, 60],
    template: (a, b) => `🚲 停车场有自行车 ${a} 辆，骑走 ${b} 辆，还剩多少辆？` },
  { op: '-', mode: 'plain', range: [10, 40],
    template: (a, b) => `🥕 兔妈妈准备了 ${a} 根胡萝卜，给小兔吃了 ${b} 根，还剩多少根？` },
  { op: '-', mode: 'plain', range: [10, 30],
    template: (a, b) => `🥤 商店原有 ${a} 瓶果汁，卖出 ${b} 瓶，还剩多少瓶？` },

  // ===== 比多少 / 求差（减法 · 多 / 少） =====
  { op: '-', mode: 'plain', range: [10, 40], requireAGtB: true,
    template: (a, b) => `🐰 小白兔有 ${a} 根胡萝卜，小灰兔有 ${b} 根，小白兔比小灰兔多多少根？` },
  { op: '-', mode: 'plain', range: [15, 50], requireAGtB: true,
    template: (a, b) => `📏 哥哥跳绳跳了 ${a} 下，弟弟跳了 ${b} 下，哥哥比弟弟多跳多少下？` },
  { op: '-', mode: 'plain', range: [10, 30], requireAGtB: true,
    template: (a, b) => `🏃 红队得 ${a} 分，蓝队得 ${b} 分，红队比蓝队多多少分？` },
  { op: '-', mode: 'plain', range: [10, 40], requireAGtB: true,
    template: (a, b) => `🌳 大树有 ${a} 米高，小树有 ${b} 米高，大树比小树高多少米？` },
  { op: '-', mode: 'plain', range: [12, 40], requireAGtB: true,
    template: (a, b) => `🐦 一群鸽子 ${a} 只，麻雀 ${b} 只，鸽子比麻雀多多少只？` },

  // ===== 求被减数（前面 + 取走 = 已知，求原有）：实质是加法 =====
  { op: '+', mode: 'plain', range: [5, 30],
    template: (a, b) => `🐔 鸡笼里走掉 ${a} 只鸡后，还剩 ${b} 只，原来鸡笼里有多少只？` },
  { op: '+', mode: 'plain', range: [5, 25],
    template: (a, b) => `🍓 小明吃了 ${a} 颗草莓，盘里还剩 ${b} 颗，原来盘里有多少颗？` },
  { op: '+', mode: 'plain', range: [8, 30],
    template: (a, b) => `🚗 停车场开走 ${a} 辆车后，还剩 ${b} 辆，原来停车场有多少辆？` },

  // ===== 求加数（前后差 = 增加部分） =====
  { op: '-', mode: 'plain', range: [15, 50], requireAGtB: true,
    template: (a, b) => `🌸 花瓶里原有 ${b} 朵花，妈妈又插了一些后变成 ${a} 朵，妈妈插了多少朵？` },
  { op: '-', mode: 'plain', range: [12, 50], requireAGtB: true,
    template: (a, b) => `📦 仓库原有 ${b} 个箱子，今天又运来一些后变成 ${a} 个，今天运来多少个？` },

  // ===== 求减数（前后差 = 减少部分） =====
  { op: '-', mode: 'plain', range: [15, 60], requireAGtB: true,
    template: (a, b) => `🐟 鱼缸有 ${a} 条鱼，妈妈拿走一些后还剩 ${b} 条，拿走了多少条？` },
  { op: '-', mode: 'plain', range: [12, 40], requireAGtB: true,
    template: (a, b) => `🍬 罐子里有 ${a} 颗糖，吃掉一些后还剩 ${b} 颗，吃掉了多少颗？` },
];

function genWord(_cat) {
  const tpl = WORD_TEMPLATES[randInt(0, WORD_TEMPLATES.length - 1)];
  const [lo, hi] = tpl.range;
  let a, b;
  if (tpl.op === '-') {
    a = randInt(Math.max(lo, 3), hi);
    b = randInt(1, a - 1); // 保证 a > b 不出负数
    if (tpl.requireAGtB) {
      a = randInt(Math.max(lo, 5), hi);
      b = randInt(1, a - 1);
    }
  } else {
    a = randInt(lo, Math.floor(hi / 2));
    b = randInt(lo, Math.floor(hi / 2));
  }
  const answer = tpl.op === '+' ? a + b : a - b;
  return {
    ...buildArithTile([a, b], tpl.op, answer),
    caption: tpl.template(a, b),
  };
}

// ============ 100 以内笔算（真正竖式 UI） ============
// v1.8.3 升级：返回竖式专用结构 {aCols, bCols, ansCols, ansSlotMap, tensMark}，
// QuizView 用 mode='vertical' 分支渲染上下对齐 + 横线 + 答案槽 + 进/退位小标。
function genVertical(cat) {
  const op = cat.op;
  let a, b;
  if (op === '+') {
    a = randInt(11, 88);
    b = randInt(11, 99 - a);
  } else {
    a = randInt(20, 99);
    b = randInt(11, a - 1);
  }
  const answer = op === '+' ? a + b : a - b;
  const maxLen = Math.max(String(a).length, String(b).length, String(answer).length);

  const padCols = (n) => {
    const s = String(n).padStart(maxLen, ' ');
    return s.split('').map(c => c === ' ' ? null : Number(c));
  };
  const aCols = padCols(a);
  const bCols = padCols(b);
  const ansCols = padCols(answer);

  // ansSlotMap[col] = slotIdx（从左到右）或 null（该列没有答案位）
  const ansSlotMap = [];
  let slotIdx = 0;
  for (let i = 0; i < maxLen; i++) {
    if (ansCols[i] !== null) {
      ansSlotMap.push(slotIdx);
      slotIdx++;
    } else {
      ansSlotMap.push(null);
    }
  }
  const slots = slotIdx;

  // 进/退位小标（仅"个位 → 十位"的一次进退位，初阶足够）
  let tensMark = '';
  if (op === '+' && (a % 10 + b % 10) >= 10) tensMark = '+1';
  if (op === '-' && (a % 10) < (b % 10)) tensMark = '−1';

  // 数字积木池：含答案各位 + 干扰
  const tiles = [...String(answer).split('').map(Number)];
  while (tiles.length < Math.max(5, slots + 3)) tiles.push(randInt(0, 9));

  return {
    mode: 'vertical',
    op, a, b, answer,
    maxLen,
    aCols, bCols, ansCols, ansSlotMap,
    slots,
    tensMark,
    tiles: shuffle(tiles),
  };
}

// ============ 数字积木拖拽题（算式：可多操作数） ============
function buildArithTile(operands, op, answer) {
  const exprText = operands.join(` ${op} `);
  const answerDigits = String(answer).split('').map(Number);
  const slots = answerDigits.length;
  const POOL_SIZE = Math.max(4, slots + 2);
  const tiles = [...answerDigits];
  while (tiles.length < POOL_SIZE) tiles.push(randInt(0, 9));
  return {
    mode: 'tile-fill',
    layout: 'arith',
    exprText,
    op, answer, slots,
    tiles: shuffle(tiles),
  };
}

// ============ 数字积木拖拽题（数位：带数位标签的格子） ============
function buildPlaceTile(number, digits) {
  const arr = String(number).split('').map(Number);
  const labels = [];
  for (let i = digits - 1; i >= 0; i--) labels.push(PLACE_NAMES[i]);
  const tiles = [...arr];
  for (let i = 0; i < 2; i++) tiles.push(randInt(0, 9)); // 干扰积木
  return {
    mode: 'tile-fill',
    layout: 'place',
    numberText: String(number),
    slotLabels: labels,
    answer: number,
    slots: digits,
    tiles: shuffle(tiles),
  };
}

// ============ 语文：看图识字 ============
// emoji → 汉字（图意 + 字形对应；常见字优先）
const CHAR_BANK = [
  { emoji: '🐱', char: '猫' }, { emoji: '🐶', char: '狗' }, { emoji: '🐰', char: '兔' },
  { emoji: '🐤', char: '鸡' }, { emoji: '🦊', char: '狐' }, { emoji: '🐼', char: '熊' },
  { emoji: '🐧', char: '鹅' }, { emoji: '🐉', char: '龙' }, { emoji: '🐟', char: '鱼' },
  { emoji: '🌳', char: '树' }, { emoji: '🌸', char: '花' }, { emoji: '🍎', char: '果' },
  { emoji: '🌙', char: '月' }, { emoji: '☀️', char: '日' }, { emoji: '⭐', char: '星' },
  { emoji: '🏠', char: '家' }, { emoji: '🚗', char: '车' }, { emoji: '✈️', char: '飞' },
  { emoji: '🚢', char: '船' }, { emoji: '📖', char: '书' }, { emoji: '✏️', char: '笔' },
  { emoji: '💡', char: '灯' }, { emoji: '🎵', char: '音' }, { emoji: '🔥', char: '火' },
  { emoji: '💧', char: '水' }, { emoji: '⛅', char: '云' }, { emoji: '🌧', char: '雨' },
  { emoji: '🌈', char: '虹' }, { emoji: '🪨', char: '石' }, { emoji: '🍌', char: '蕉' },
  { emoji: '🍇', char: '葡' }, { emoji: '🍉', char: '瓜' }, { emoji: '🥕', char: '萝' },
  { emoji: '🌻', char: '葵' }, { emoji: '🌹', char: '玫' }, { emoji: '🍀', char: '草' },
  { emoji: '🥚', char: '蛋' }, { emoji: '🍞', char: '面' }, { emoji: '🍚', char: '饭' },
  { emoji: '🍵', char: '茶' }, { emoji: '🥛', char: '奶' }, { emoji: '🧊', char: '冰' },
  { emoji: '👁️', char: '目' }, { emoji: '👂', char: '耳' }, { emoji: '👃', char: '鼻' },
  { emoji: '👄', char: '口' }, { emoji: '🖐️', char: '手' }, { emoji: '🦶', char: '足' },
];

function genChineseRecognize(stage) {
  // v1.9：合并 CHAR_BANK + PINYIN_CHAR_BANK 中带 emoji 的字，扩大题库
  const merged = [
    ...CHAR_BANK,
    ...PINYIN_CHAR_BANK.filter(x => x.emoji).map(x => ({ emoji: x.emoji, char: x.char })),
  ];
  const total = merged.length;
  const idx = ((stage - 1) * 7 + Math.floor(Math.random() * 3)) % total;
  const item = merged[idx];
  const distractors = shuffle(merged.filter(x => x.char !== item.char)).slice(0, 3).map(x => x.char);
  const options = shuffle([item.char, ...distractors]);
  return {
    mode: 'choice',
    promptKind: 'emoji',
    prompt: item.emoji,
    sub: '下面哪个是它的汉字？',
    options,
    correctIndex: options.indexOf(item.char),
  };
}

// ============ 语文：拼音匹配（双向）============
// 一题随机正反：① 给汉字 选拼音 ② 给拼音 选汉字
function genChinesePinyin(stage) {
  const item = PINYIN_CHAR_BANK[randInt(0, PINYIN_CHAR_BANK.length - 1)];
  const askPinyin = stage % 2 === 0;   // 偶数关：给汉字选拼音；奇数关：给拼音选汉字
  if (askPinyin) {
    const distractors = shuffle(PINYIN_CHAR_BANK.filter(x => x.pinyin !== item.pinyin))
      .slice(0, 3).map(x => x.pinyin);
    const options = shuffle([item.pinyin, ...distractors]);
    return {
      mode: 'choice',
      promptKind: 'chinese-char',
      prompt: item.char,
      sub: '它的拼音是？',
      options,
      correctIndex: options.indexOf(item.pinyin),
    };
  }
  const distractors = shuffle(PINYIN_CHAR_BANK.filter(x => x.char !== item.char))
    .slice(0, 3).map(x => x.char);
  const options = shuffle([item.char, ...distractors]);
  return {
    mode: 'choice',
    promptKind: 'pinyin',
    prompt: item.pinyin,
    sub: '这个拼音对应哪个字？',
    options,
    correctIndex: options.indexOf(item.char),
  };
}

// ============ 语文：组词造句 ============
// 给一个字，4 选 1 选含该字的正确词组（其他选项是别的字的词组）
function genChineseCompose(_stage) {
  const item = PINYIN_CHAR_BANK[randInt(0, PINYIN_CHAR_BANK.length - 1)];
  // 正确选项：item.words 中随机一个
  const correctWord = item.words[randInt(0, item.words.length - 1)];
  // 干扰：从其他字的 words 中各取一个
  const others = shuffle(PINYIN_CHAR_BANK.filter(x => x.char !== item.char));
  const distractors = [];
  for (const o of others) {
    if (distractors.length >= 3) break;
    // 干扰词不能包含目标字（否则也"正确"了）
    const candidate = o.words.find(w => !w.includes(item.char));
    if (candidate && !distractors.includes(candidate)) distractors.push(candidate);
  }
  const options = shuffle([correctWord, ...distractors]);
  return {
    mode: 'choice',
    promptKind: 'chinese-char',
    prompt: item.char,
    sub: '下面哪个词里有这个字？',
    options,
    correctIndex: options.indexOf(correctWord),
  };
}

// ============ 语文：必背古诗填空 ============
// 显示完整诗 + 某句的某字挖空，4 选 1 填字
function genChinesePoem(stage) {
  const poem = POEM_BANK[(stage - 1) % POEM_BANK.length];
  const blank = poem.blanks[randInt(0, poem.blanks.length - 1)];
  const correctChar = poem.lines[blank.lineIdx][blank.charIdx];
  const options = shuffle([correctChar, ...blank.distractors]);
  // 把待填字替换为下划线，显示整首诗
  const displayLines = poem.lines.map((line, li) => {
    if (li !== blank.lineIdx) return line;
    return line.slice(0, blank.charIdx) + '＿' + line.slice(blank.charIdx + 1);
  });
  return {
    mode: 'choice',
    promptKind: 'poem',
    prompt: `《${poem.title}》${poem.author}`,
    poemLines: displayLines,           // QuizView 据 promptKind=poem 渲染多行
    sub: '空格里填哪个字？',
    options,
    correctIndex: options.indexOf(correctChar),
  };
}

// ============ 英语：字母大小写匹配 ============
const ALPHABETS = 'abcdefghijklmnopqrstuvwxyz';

function genEnglishAlphabet(stage) {
  const askLower = stage % 2 === 0;
  const idx = (stage - 1 + Math.floor(Math.random() * 5)) % 26;
  const ch = ALPHABETS[idx];
  const upper = ch.toUpperCase();
  const lower = ch;

  const distractorIdxs = new Set();
  while (distractorIdxs.size < 3) {
    const d = Math.floor(Math.random() * 26);
    if (d !== idx) distractorIdxs.add(d);
  }
  const distractors = [...distractorIdxs].map(d => askLower ? ALPHABETS[d] : ALPHABETS[d].toUpperCase());
  const correct = askLower ? lower : upper;
  const options = shuffle([correct, ...distractors]);
  return {
    mode: 'choice',
    promptKind: 'letter',
    prompt: askLower ? upper : lower,
    sub: askLower ? '它的小写是？' : '它的大写是？',
    options,
    correctIndex: options.indexOf(correct),
  };
}

// ============ 英语：自然拼读（phonics） ============
// 关卡 → tier 分层在 phonics-en-bank.js 内部完成。
// 出题对象：{ mode:'phonics', word:{whole, parts:[{letter,phoneme,silent}], emoji, sentence, lang} }
function genEnglishSpell(stage, qIdx) {
  const w = pickPhonicsWord(stage, qIdx);
  return { mode: 'phonics', word: w };
}

// ============ 占位 ============
function genPlaceholder(subjectId, moduleId) {
  return { mode: 'placeholder', subjectId, moduleId };
}

// ============ 入口 ============
export function genQuestion(subjectId, moduleId, categoryId, stage, qIdx = 0) {
  const s = Math.max(1, Math.floor(stage || 1));
  if (subjectId === 'math') {
    if (moduleId === 'place') {
      return genPlace(findCategory('math', 'place', categoryId));
    }
    if (moduleId === 'review') {
      return genMix(findCategory('math', 'review', categoryId), qIdx);
    }
    if (moduleId === 'shape') {
      return genShape(findCategory('math', 'shape', categoryId));
    }
    if (moduleId === 'money') {
      return genMoney(findCategory('math', 'money', categoryId));
    }
    if (moduleId === 'word') {
      return genWord(findCategory('math', 'word', categoryId));
    }
    if (moduleId === 'vertical') {
      return genVertical(findCategory('math', 'vertical', categoryId));
    }
    const op = OP_OF[moduleId];
    if (op) {
      const cat = findCategory('math', moduleId, categoryId);
      if (cat.kind === 'enum') return genEnum(op, s, qIdx);
      if (cat.kind === 'range') return genRange(op, cat);
      if (cat.kind === 'multi') return genMulti(op, cat);
      return genRange(op, cat);
    }
  }
  if (subjectId === 'chinese') {
    if (moduleId === 'recognize') return genChineseRecognize(s);
    if (moduleId === 'pinyin') return genChinesePinyin(s);
    if (moduleId === 'compose') return genChineseCompose(s);
    if (moduleId === 'poem') return genChinesePoem(s);
    return genPlaceholder(subjectId, moduleId);
  }
  if (subjectId === 'english') {
    if (moduleId === 'alphabet') return genEnglishAlphabet(s);
    if (moduleId === 'spell') return genEnglishSpell(s, qIdx);
    return genPlaceholder(subjectId, moduleId);
  }
  return genPlaceholder(subjectId, moduleId);
}

// ============ 教学卡（解题技巧）============
// lessonInfo：演示题（固定经典例子）+ 讲解；genTrickQuiz：随机同类自测题。
// 返回结构：{ a, b, op, answer, steps }，steps 来自 decompose.*

const LESSON_META = {
  'borrow-trick': {
    title: '整万数减法 · 减1法',
    intro: '被减数是 10000 这种「1 后面一串 0」时，退位很烦。先借走 1 变成 9999，竖式秒算，最后别忘把 1 加回来！',
    op: '-',
  },
  'make-ten': {
    title: '凑十法（加法技巧）',
    intro: '个位相加超过 10 时，把一个数拆开先凑成整十，再加剩下的，又快又准。',
    op: '+',
  },
  'break-ten': {
    title: '破十法（减法技巧）',
    intro: '20 以内退位减法：被减数个位不够减时，先把个位减完凑到 10，再用 10 减剩下的。',
    op: '-',
  },
  // 跳板式 trick：本身不在 LessonView 里渲染，而是把用户透明转送到自定义视图。
  // 这样课本单元（textbook.js）只需配 { trickId: 'division-intro' } 就能挂上整套 5 步式课件。
  'division-intro': {
    title: '除法启蒙：分一分',
    intro: '把东西公平地分一分，就是除法。这节课用拖拽的方式带孩子建立"等分"的直觉，再过渡到算式与乘除互逆。',
    op: '÷',
    redirectRoute: { name: 'division-intro' },
  },
};

function buildBorrowTrick(a, b) {
  return { a, b, op: '-', answer: a - b, steps: decomposeBorrowTrick(a, b) };
}
function buildMakeTen(a, b) {
  return { a, b, op: '+', answer: a + b, steps: decomposeAdd(a, b) };
}
function buildBreakTen(a, b) {
  return { a, b, op: '-', answer: a - b, steps: decomposeSub(a, b) };
}

export function lessonInfo(trickId) {
  const meta = LESSON_META[trickId];
  if (!meta) return null;
  // 跳板型 trick：不生成演示题，由 LessonView 透明重定向到 redirectRoute
  if (meta.redirectRoute) return { trickId, ...meta, demo: null };
  let demo;
  if (trickId === 'borrow-trick') demo = buildBorrowTrick(10000, 3847);
  else if (trickId === 'break-ten') demo = buildBreakTen(14, 9);
  else demo = buildMakeTen(8, 5);
  return { trickId, ...meta, demo };
}

export function genTrickQuiz(trickId) {
  if (trickId === 'borrow-trick') {
    const base = [1000, 10000, 100000][randInt(0, 2)];
    const b = randInt(1, base - 1);
    return buildBorrowTrick(base, b);
  }
  if (trickId === 'break-ten') {
    // 退位减：a∈[11,18]，b∈[a%10+1, 9] 保证 a%10 < b 触发破十拆分
    const a = randInt(11, 18);
    const lo = (a % 10) + 1;
    const b = randInt(lo, 9);
    return buildBreakTen(a, b);
  }
  // make-ten：随机进位加法（个位相加 > 10）
  const a = randInt(5, 9);
  const b = randInt(11 - a + 1, 9); // 保证 a%10 + b%10 > 10
  return buildMakeTen(a, b);
}

// ============ 校验工具 ============
export function checkTileFill(filledDigits, answer) {
  if (filledDigits.some(d => d == null)) return false;
  return Number(filledDigits.join('')) === answer;
}

export function checkChoice(selectedIndex, correctIndex) {
  return selectedIndex === correctIndex;
}

export function checkStepCalc(filled, expected) {
  if (filled == null || filled === '') return false;
  return Number(filled) === Number(expected);
}

export function checkStepSplit(filled, parts) {
  if (!Array.isArray(filled) || filled.length !== parts.length) return false;
  // 顺序不敏感（用户可能填反）
  const f = [...filled].map(Number).sort((a, b) => a - b);
  const p = [...parts].map(Number).sort((a, b) => a - b);
  return f.every((v, i) => v === p[i]);
}
