// 纯函数游戏逻辑（计分、经验、心情、解锁条件 + 闯关掉落）

import { MAX_LEVEL, FRAGMENT_PET } from '../catalog.js';

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

// ===== 闯关掉落（本地决策一次，再交后端落库，保证显示=入账）=====
// 份数：全对 3 / 通关 2 / 至少 1 题对 1 / 全错 0
function dropQty(score) {
  if (score.perfect) return 3;
  if (score.passed) return 2;
  if (score.correctCount > 0) return 1;
  return 0;
}

// 口粮掉落：从「已拥有且未满级」的宠物里随机挑一只，掉它的口粮。
// 满级的宠物不再掉它的粮；若全部满级 / 没有宠物，则不掉粮。
// ownedPets: [{ petId, level, foodId }]
export function rollFoodDrop(score, ownedPets = []) {
  const qty = dropQty(score);
  if (!qty) return [];
  const pool = ownedPets.filter(p => p?.foodId && (p.level || 1) < MAX_LEVEL);
  if (!pool.length) return [];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return [{ foodId: pick.foodId, qty }];
}

// 稀有碎片掉落：仅通关时按概率掉落（已拥有该稀有宠物则不再掉）。
//   全对：60% 掉 1 枚，其中再 25% 额外 +1（最多 2 枚）
//   普通通关：30% 掉 1 枚
// 返回 [{ fragKey: FRAGMENT_PET, qty }]（最多一条）
export function rollFragmentDrop(score, ownedPets = []) {
  if (!score.passed) return [];
  if (ownedPets.some(p => p?.petId === FRAGMENT_PET)) return [];
  let qty = 0;
  if (score.perfect) {
    if (Math.random() < 0.6) qty = 1 + (Math.random() < 0.25 ? 1 : 0);
  } else if (Math.random() < 0.3) {
    qty = 1;
  }
  return qty ? [{ fragKey: FRAGMENT_PET, qty }] : [];
}

// 一次性决定本轮全部掉落（口粮 + 碎片）
export function rollRoundDrops(score, ownedPets = []) {
  return {
    foods: rollFoodDrop(score, ownedPets),
    fragments: rollFragmentDrop(score, ownedPets),
  };
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
