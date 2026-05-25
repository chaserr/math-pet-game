// 纯函数游戏逻辑（计分、经验、心情、解锁条件 + 本地口粮掉落）

// ===== 计分 =====
// 通关 = 100；未通关也给鼓励分：20 起步 + 10 × 答对数（封顶 90，保留 100 的稀缺感）
export const ROUND_SIZE = 5;
export const STAGE_REWARD = 100;
export const FAIL_BASE = 20;
export const FAIL_PER_CORRECT = 10;
export const FAIL_CAP = 90;

// results: [{ answer, isCorrect }]（按答题顺序）
// 通关阈值：correctCount ≥ ceil(count × 0.6)
export function scoreRound(results) {
  let correctCount = 0;
  for (const r of results) if (r.isCorrect) correctCount += 1;
  const count = results.length;
  const need = Math.max(1, Math.ceil(count * 0.6));
  const passed = count > 0 && correctCount >= need;
  const perfect = count > 0 && correctCount === count;
  const total = passed
    ? STAGE_REWARD
    : Math.min(FAIL_CAP, FAIL_BASE + FAIL_PER_CORRECT * correctCount);
  return { total, correctCount, count, passed, perfect, bonus: 0 };
}

// ===== 口粮掉落（本地决策，不依赖后端）=====
// 以「当前展示的宠物」对应的口粮为掉落源，份数：
//   全对 3 / 通关 2 / 至少 1 题对 1 / 全错 0
// 返回 [{ foodId, qty, name? }]（name 由调用方根据 catalog 补全也行）
export function rollFoodDropsLocal(score, featuredFoodId) {
  if (!featuredFoodId) return [];
  let qty = 0;
  if (score.perfect) qty = 3;
  else if (score.passed) qty = 2;
  else if (score.correctCount > 0) qty = 1;
  if (!qty) return [];
  return [{ foodId: featuredFoodId, qty }];
}

// ===== 饥饿心情 =====
const HUNGER_HOURS = 6;
export function petMood(lastFedAt) {
  if (!lastFedAt) return 'normal';
  const hours = (Date.now() - new Date(lastFedAt).getTime()) / 3.6e6;
  return hours >= HUNGER_HOURS ? 'sad' : 'happy';
}

// ===== 解锁条件 =====
// ctx: { ownedCount, mainLevel, maxPetLevel }
export function unlockConditions(ctx) {
  return {
    'pet:fox': ctx.ownedCount >= 3,
    'pet:panda': ctx.mainLevel >= 5,
    'pet:penguin': ctx.maxPetLevel >= 5,
    'pet:shadow_boo': (ctx.ghostCount || 0) >= 2,
  };
}
