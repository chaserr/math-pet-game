// 数学关卡分类体系（单一事实来源）
// 结构：Subject(math) → Module(add/sub/mul/div/place/review/shape/money/word/vertical) → Category → Level
//
// 每个分类 = 一组关卡：
//   kind 'enum'     穷举（如 10 以内，逐个列出 1+1..9+9），每关 9 题，固定算式
//   kind 'range'    指定范围内随机（含拆分引导），每关 5 题
//   kind 'multi'    多个数连算（2/3/4 个数），每关 5 题
//   kind 'place'    数位认知（拖数字到 个/十/百/千… 数位），每关 9 题（每题随机一个 d 位数）
//   kind 'mix'      综合复习：从 sources[] 中各分类轮询抽题（v1.7 新增，仅教材轴用）
//   kind 'shape'    图形识别（立体/平面），choice 模式（v1.7 新增）
//   kind 'money'    人民币认识 / 找零（choice + tile-fill）（v1.7 新增）
//   kind 'word'     应用题（中文模板 + tile-fill）（v1.7 新增）
//   kind 'vertical' 100 以内笔算（最小骨架：tile-fill + 提示语）（v1.7 新增）

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
    { id: 'within20', name: '20以内', desc: `20 以内${word}（教材一上五 / 一下二）`, kind: 'range', op, max: 20, perLevel: 5, count: GEN },
    { id: 'within100', name: '100以内', desc: `100 以内${word}`, kind: 'range', op, max: 100, perLevel: 5, count: GEN },
    { id: 'n2', name: `两个数${word}`, desc: `两个数${word}`, kind: 'multi', op, operands: 2, perLevel: 5, count: GEN },
    { id: 'n3', name: `三个数${word}`, desc: `三个数${word}`, kind: 'multi', op, operands: 3, perLevel: 5, count: GEN },
    { id: 'n4', name: `四个数${word}`, desc: `四个数${word}`, kind: 'multi', op, operands: 4, perLevel: 5, count: GEN },
  ];
}

function placeCategories() {
  const defs = [
    [2, '两位数', '个十（11–99）'],
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

// ===== 教材轴专属模块（不出现在「按能力练」首页 MODULES.math，仅 textbook.js 引用）=====

function reviewCategories() {
  return [
    {
      id: 'g1up', name: '一上综合', desc: '5以内/6-10/11-20/20以内进位加 混合',
      kind: 'mix', perLevel: 9, count: GEN,
      sources: [
        { module: 'add', category: 'within10' },
        { module: 'sub', category: 'within10' },
        { module: 'place', category: 'd2' },
        { module: 'add', category: 'within20' },
      ],
    },
    {
      id: 'g1down', name: '一下综合', desc: '20以内退位减/100以内口算/数位 混合',
      kind: 'mix', perLevel: 9, count: GEN,
      sources: [
        { module: 'sub', category: 'within20' },
        { module: 'place', category: 'd2' },
        { module: 'add', category: 'within100' },
        { module: 'sub', category: 'within100' },
      ],
    },
  ];
}

function shapeCategories() {
  return [
    { id: 'solid', name: '立体图形', desc: '长方体 / 正方体 / 圆柱 / 球', kind: 'shape', dim: '3d', perLevel: 9, count: GEN },
    { id: 'plane', name: '平面图形', desc: '长方形 / 正方形 / 三角形 / 圆 / 平行四边形', kind: 'shape', dim: '2d', perLevel: 9, count: GEN },
  ];
}

function moneyCategories() {
  return [
    { id: 'recognize', name: '认面额', desc: '看图选金额（角 / 元）', kind: 'money', sub: 'recognize', perLevel: 9, count: GEN },
    { id: 'change', name: '找零', desc: '付款 - 商品价 = 找零（100 以内）', kind: 'money', sub: 'change', perLevel: 5, count: GEN },
  ];
}

function wordCategories() {
  return [
    { id: 'mixed', name: '加减应用题', desc: '剩余 / 共有 / 比多少（中文模板）', kind: 'word', perLevel: 5, count: GEN },
  ];
}

function verticalCategories() {
  // 最小骨架：复用 tile-fill 出题 + 题面带"竖式提示"。真正的竖式 UI 留 v1.8 升级。
  return [
    { id: 'add', name: '两位数加法竖式', desc: '100 以内加法 · 个位 + 十位逐位算', kind: 'vertical', op: '+', perLevel: 5, count: GEN },
    { id: 'sub', name: '两位数减法竖式', desc: '100 以内减法 · 个位不够借十', kind: 'vertical', op: '-', perLevel: 5, count: GEN },
  ];
}

export const MATH_CATEGORIES = {
  add: arithCategories('add'),
  sub: arithCategories('sub'),
  mul: arithCategories('mul'),
  div: arithCategories('div'),
  place: placeCategories(),
  review: reviewCategories(),
  shape: shapeCategories(),
  money: moneyCategories(),
  word: wordCategories(),
  vertical: verticalCategories(),
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
