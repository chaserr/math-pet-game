// 多学科出题器
// 入口：genQuestion(subjectId, moduleId, stage) → 题目对象
//
// 返回的 mode：
//   'tile-fill'    数字积木拖拽填空（数学直接模式 + 乘除全程）
//   'multi-step'   多步引导填空（数学加减拆分模式，含 split/calc/done 步骤）
//   'choice'       四选一选择题（语文识字 / 英语字母）
//   'placeholder'  占位（敬请期待）

import { decomposeAdd, decomposeSub } from '../lib/decompose.js';
import { OP_OF, PLACE_NAMES, enumWithin10Fact, findCategory } from '../lib/mathLevels.js';

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
    const answer = a + b;
    if (answer >= 10) return { mode: 'multi-step', a, b, op: '+', answer, steps: decomposeAdd(a, b) };
    return buildArithTile([a, b], '+', answer);
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
  const total = CHAR_BANK.length;
  const idx = ((stage - 1) * 7 + Math.floor(Math.random() * 3)) % total;
  const item = CHAR_BANK[idx];
  const distractors = shuffle(CHAR_BANK.filter(x => x.char !== item.char)).slice(0, 3).map(x => x.char);
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
    return genPlaceholder(subjectId, moduleId);
  }
  if (subjectId === 'english') {
    if (moduleId === 'alphabet') return genEnglishAlphabet(s);
    return genPlaceholder(subjectId, moduleId);
  }
  return genPlaceholder(subjectId, moduleId);
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
