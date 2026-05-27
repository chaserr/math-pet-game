/**
 * 除法启蒙的场景数据。
 *
 * 设计要点：
 *   - 4 套主题：rabbit / cat / chick / dog，对应已有宠物。
 *   - 每套主题里的"接收者"是同物种的多只宠物，靠不同颜色的篮子 + 名字区分，
 *     这样无需修改 PetSprite 也能让孩子分辨"分给谁"。
 *   - 题目池按难度分级，5 步式课件用固定的"主线场景"（12÷3，兔子），
 *     启蒙馆里的"试一试"则随机抽。
 *   - 启蒙阶段全部整除，不引入余数。
 */

export const THEMES = {
  rabbit: {
    id: 'rabbit',
    petId: 'rabbit',
    actor: '小兔',
    actorNames: ['豆豆', '团团', '灰灰', '雪雪'],
    item: '胡萝卜',
    itemEmoji: '🥕',
    opening: (n, m) => `兔妈妈摘了 ${n} 个胡萝卜，要分给 ${m} 只小兔，怎样分才公平？`,
    cheer:   (q) => `每只小兔都拿到了 ${q} 个胡萝卜，真公平！`,
  },
  cat: {
    id: 'cat',
    petId: 'cat',
    actor: '小猫',
    actorNames: ['咪咪', '橘橘', '雪雪', '糖糖'],
    item: '小鱼干',
    itemEmoji: '🐟',
    opening: (n, m) => `主人买了 ${n} 条小鱼干，要分给 ${m} 只小猫，怎样分才公平？`,
    cheer:   (q) => `每只小猫都拿到了 ${q} 条小鱼干，真公平！`,
  },
  chick: {
    id: 'chick',
    petId: 'chick',
    actor: '小鸡',
    actorNames: ['吉吉', '黄黄', '叽叽', '小小'],
    item: '玉米粒',
    itemEmoji: '🌽',
    opening: (n, m) => `农场里有 ${n} 颗玉米粒，要分给 ${m} 只小鸡，怎样分才公平？`,
    cheer:   (q) => `每只小鸡都吃到了 ${q} 颗玉米粒，真公平！`,
  },
  dog: {
    id: 'dog',
    petId: 'dog',
    actor: '小狗',
    actorNames: ['汪汪', '球球', '旺旺', '欢欢'],
    item: '肉骨头',
    itemEmoji: '🦴',
    opening: (n, m) => `骨头筐里有 ${n} 根肉骨头，要分给 ${m} 只小狗，怎样分才公平？`,
    cheer:   (q) => `每只小狗都拿到了 ${q} 根肉骨头，真公平！`,
  },
};

// 篮子颜色统一为一套，顺序对应同一主题里第 0..N-1 只角色
export const BASKET_COLORS = ['#ff9eb1', '#a0d8b0', '#f0c878', '#9ec5e8'];

// 难度分级题目池：(被除数, 除数) 必须整除
const SCENARIOS = {
  easy:   [{ d: 6,  r: 2 }, { d: 6,  r: 3 }, { d: 8,  r: 2 }, { d: 8,  r: 4 }, { d: 9,  r: 3 }],
  medium: [{ d: 10, r: 2 }, { d: 12, r: 3 }, { d: 12, r: 4 }, { d: 15, r: 3 }, { d: 15, r: 5 }, { d: 16, r: 4 }],
  hard:   [{ d: 18, r: 3 }, { d: 20, r: 4 }, { d: 20, r: 5 }, { d: 24, r: 3 }, { d: 24, r: 4 }, { d: 24, r: 6 }],
};

const THEME_IDS = Object.keys(THEMES);

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/**
 * 随机抽一个场景。
 * @param {{ difficulty?: 'easy'|'medium'|'hard', themeId?: string }} opts
 * @returns {{ dividend: number, divisor: number, theme: object }}
 */
export function pickScenario({ difficulty = 'easy', themeId = null } = {}) {
  const pool = SCENARIOS[difficulty] || SCENARIOS.easy;
  const { d: dividend, r: divisor } = pick(pool);
  const theme = THEMES[themeId || pick(THEME_IDS)];
  return { dividend, divisor, theme };
}

/**
 * 5 步式课件的主线场景：12 ÷ 3，用兔子主题（最经典、最易于讲解）。
 */
export const MAIN_SCENARIO = Object.freeze({
  dividend: 12,
  divisor: 3,
  theme: THEMES.rabbit,
});

/**
 * 翻翻乐 / 连一连用：随机生成 N 道乘除互逆题。
 * @param {number} count
 * @returns {Array<{ a: number, b: number, product: number }>}
 */
export function genFlipFacts(count = 6) {
  const out = [];
  const used = new Set();
  let safety = 0;
  while (out.length < count && safety++ < 200) {
    const a = 2 + Math.floor(Math.random() * 8);  // 2..9
    const b = 2 + Math.floor(Math.random() * 8);
    const key = `${Math.min(a, b)}x${Math.max(a, b)}`;
    if (used.has(key)) continue;
    used.add(key);
    out.push({ a, b, product: a * b });
  }
  return out;
}
