// 纯函数游戏逻辑（计分、经验、心情、解锁条件）—— 从原后端移植到前端

// ===== 计分（DESIGN.md §3.5） =====
export const ROUND_SIZE = 5;
export const PERFECT_ROUND_BONUS = 30;

export function baseScore(answer) {
  const digits = String(Math.abs(answer)).length;
  if (digits <= 1) return 5;
  if (digits === 2) return 10;
  return 15;
}

export function streakMultiplier(streak) {
  if (streak >= 3) return 1.5;
  if (streak === 2) return 1.2;
  return 1.0;
}

// results: [{ answer, isCorrect }]（按答题顺序）
export function scoreRound(results) {
  let total = 0, streak = 0, correctCount = 0;
  for (const r of results) {
    if (r.isCorrect) {
      streak += 1; correctCount += 1;
      total += Math.round(baseScore(r.answer) * streakMultiplier(streak));
    } else {
      streak = 0;
    }
  }
  const perfect = correctCount === ROUND_SIZE && results.length === ROUND_SIZE;
  if (perfect) total += PERFECT_ROUND_BONUS;
  return { total, correctCount, perfect, bonus: perfect ? PERFECT_ROUND_BONUS : 0 };
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
  };
}
