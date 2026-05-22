// 数学关卡分类体系（单一事实来源）
// 结构：Subject(math) → Module(add/sub/mul/div/place) → Category → Level
//
// 每个分类 = 一组关卡：
//   kind 'enum'  穷举（如 10 以内，逐个列出 1+1..9+9），每关 1 题，固定算式
//   kind 'range' 指定范围内随机（含拆分引导），每关 5 题
//   kind 'multi' 多个数连算（2/3/4 个数），每关 5 题
//   kind 'place' 数位认知（拖数字到 个/十/百/千… 数位），每关 1 题

export const OP_OF = { add: '+', sub: '-', mul: '×', div: '÷' };
const OP_WORD = { '+': '相加', '-': '相减', '×': '相乘', '÷': '相除' };

// 数位名（下标 = 10 的幂次）：个=0，十=1 …… 十亿=9
export const PLACE_NAMES = ['个', '十', '百', '千', '万', '十万', '百万', '千万', '亿', '十亿'];

// ===== 10 以内穷举 =====
const _enumCache = {};
export function enumWithin10(op) {
  if (_enumCache[op]) return _enumCache[op];
  const out = [];
  if (op === '+') {
    for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) out.push({ operands: [a, b], op, answer: a + b, label: `${a}+${b}` });
  } else if (op === '-') {
    for (let a = 1; a <= 9; a++) for (let b = 1; b <= a; b++) out.push({ operands: [a, b], op, answer: a - b, label: `${a}-${b}` });
  } else if (op === '×') {
    for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) out.push({ operands: [a, b], op, answer: a * b, label: `${a}×${b}` });
  } else { // ÷：来自乘法表反推
    for (let d = 1; d <= 9; d++) for (let q = 1; q <= 9; q++) out.push({ operands: [d * q, d], op, answer: q, label: `${d * q}÷${d}` });
  }
  _enumCache[op] = out;
  return out;
}

// ===== 分类定义 =====
const GEN = 500; // 生成类分类的固定关卡数

function arithCategories(moduleId) {
  const op = OP_OF[moduleId];
  const word = OP_WORD[op]; // 相加/相减/相乘/相除
  return [
    { id: 'within10', name: '10以内', desc: `逐个列出 全部${word}口算`, kind: 'enum', op, perLevel: 1, count: enumWithin10(op).length },
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
    id: `d${digits}`, name, desc, kind: 'place', digits, perLevel: 1, count: GEN,
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
  if (cat && cat.kind === 'enum') {
    const list = enumWithin10(cat.op);
    const item = list[(stage - 1) % list.length];
    return item ? item.label : String(stage);
  }
  return String(stage);
}
