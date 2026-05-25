// 数学关卡分类体系（单一事实来源）
// 结构：Subject(math) → Module(add/sub/mul/div/place) → Category → Level
//
// 每个分类 = 一组关卡：
//   kind 'enum'  穷举（如 10 以内，逐个列出 1+1..9+9），每关 9 题，固定算式
//   kind 'range' 指定范围内随机（含拆分引导），每关 5 题
//   kind 'multi' 多个数连算（2/3/4 个数），每关 5 题
//   kind 'place' 数位认知（拖数字到 个/十/百/千… 数位），每关 9 题（每题随机一个 d 位数）

export const OP_OF = { add: '+', sub: '-', mul: '×', div: '÷' };
const OP_WORD = { '+': '相加', '-': '相减', '×': '相乘', '÷': '相除' };

// 数位名（下标 = 10 的幂次）：个=0，十=1 …… 十亿=9
export const PLACE_NAMES = ['个', '十', '百', '千', '万', '十万', '百万', '千万', '亿', '十亿'];

// ===== 10 以内枚举 =====
// 结构固定：9 关 × 9 题 = 81 道，按"被固定的那个操作数"分关。
//   + : 第 k 关 = k+1, k+2, ..., k+9
//   × : 第 k 关 = k×1, k×2, ..., k×9
//   ÷ : 第 k 关（除数 k） = (k·1)÷k, (k·2)÷k, ..., (k·9)÷k → 商 1..9
//   - : 第 k 关（减数 k） = k-k, (k+1)-k, ..., (k+8)-k → 差 0..8
export const ENUM_LEVELS = 9;
export const ENUM_PER_LEVEL = 9;

const _enumCache = {};
export function enumWithin10(op) {
  if (_enumCache[op]) return _enumCache[op];
  const out = [];
  if (op === '+') {
    for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) out.push({ operands: [a, b], op, answer: a + b, label: `${a}+${b}` });
  } else if (op === '×') {
    for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) out.push({ operands: [a, b], op, answer: a * b, label: `${a}×${b}` });
  } else if (op === '÷') {
    for (let d = 1; d <= 9; d++) for (let q = 1; q <= 9; q++) out.push({ operands: [d * q, d], op, answer: q, label: `${d * q}÷${d}` });
  } else { // -
    for (let s = 1; s <= 9; s++) for (let i = 0; i < 9; i++) {
      const m = s + i;
      out.push({ operands: [m, s], op, answer: m - s, label: `${m}-${s}` });
    }
  }
  _enumCache[op] = out;
  return out;
}

/** 第 stage(1..9) 关的第 qIdx(0..8) 道题 */
export function enumWithin10Fact(op, stage, qIdx) {
  const list = enumWithin10(op);
  const idx = (Math.max(1, stage) - 1) * ENUM_PER_LEVEL + (qIdx % ENUM_PER_LEVEL);
  return list[idx % list.length];
}

/** 关卡按钮的代表性标签（10 以内） */
export function enumLevelLabel(op, stage) {
  if (op === '+') return `${stage}+?`;
  if (op === '×') return `${stage}×?`;
  if (op === '÷') return `?÷${stage}`;
  return `?−${stage}`;
}

// ===== 分类定义 =====
const GEN = 500; // 生成类分类的固定关卡数

function arithCategories(moduleId) {
  const op = OP_OF[moduleId];
  const word = OP_WORD[op]; // 相加/相减/相乘/相除
  return [
    { id: 'within10', name: '10以内', desc: `${word} 9 关 × 9 题（穷举到 9）`, kind: 'enum', op, perLevel: ENUM_PER_LEVEL, count: ENUM_LEVELS },
    { id: 'within100', name: '100以内', desc: `100 以内${word}`, kind: 'range', op, max: 100, perLevel: 5, count: GEN },
    { id: 'n2', name: `两个数${word}`, desc: `两个数${word}`, kind: 'multi', op, operands: 2, perLevel: 5, count: GEN },
    { id: 'n3', name: `三个数${word}`, desc: `三个数${word}`, kind: 'multi', op, operands: 3, perLevel: 5, count: GEN },
    { id: 'n4', name: `四个数${word}`, desc: `四个数${word}`, kind: 'multi', op, operands: 4, perLevel: 5, count: GEN },
  ];
}

function placeCategories() {
  const defs = [
    [3, '三位数', '个十百'],
    [4, '四位数', '个十百千'],
    [5, '五位数', '到万位'],
    [6, '六位数', '到十万位'],
    [7, '七位数', '到百万位'],
    [8, '八位数', '到千万位'],
    [9, '九位数', '到亿位'],
    [10, '十位数', '到十亿位'],
  ];
  return defs.map(([digits, name, desc]) => ({
    id: `d${digits}`, name, desc, kind: 'place', digits, perLevel: 9, count: GEN,
  }));
}

export const MATH_CATEGORIES = {
  add: arithCategories('add'),
  sub: arithCategories('sub'),
  mul: arithCategories('mul'),
  div: arithCategories('div'),
  place: placeCategories(),
};

// ===== 助手 =====
export function moduleHasCategories(subjectId, moduleId) {
  return subjectId === 'math' && Array.isArray(MATH_CATEGORIES[moduleId]);
}

export function getCategories(subjectId, moduleId) {
  if (subjectId !== 'math') return [];
  return MATH_CATEGORIES[moduleId] || [];
}

export function findCategory(subjectId, moduleId, categoryId) {
  const list = getCategories(subjectId, moduleId);
  if (!list.length) return null;
  return list.find(c => c.id === categoryId) || list[0];
}

export function categoryCount(subjectId, moduleId, categoryId) {
  const cat = findCategory(subjectId, moduleId, categoryId);
  return cat ? cat.count : 0;
}

export function categoryPerLevel(subjectId, moduleId, categoryId) {
  const cat = findCategory(subjectId, moduleId, categoryId);
  return cat ? cat.perLevel : 5;
}

// 关卡按钮上的标签：穷举类显示算式，其余显示关号
export function levelLabel(subjectId, moduleId, categoryId, stage) {
  const cat = findCategory(subjectId, moduleId, categoryId);
  if (cat && cat.kind === 'enum') return enumLevelLabel(cat.op, stage);
  return String(stage);
}
