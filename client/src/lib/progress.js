// 关卡进度（localStorage 持久化）
// clearedStage = 已通关的最高关卡 id（0 表示尚未通关任何关卡）
import { MAX_STAGE } from '../catalog.js';

const KEY = 'mpg_cleared_stage';

export function getClearedStage() {
  const v = Number(localStorage.getItem(KEY) || 0);
  return Number.isFinite(v) ? Math.max(0, Math.min(MAX_STAGE, v)) : 0;
}

export function setClearedStage(n) {
  const v = Math.max(0, Math.min(MAX_STAGE, Math.floor(n)));
  localStorage.setItem(KEY, String(v));
  return v;
}

/** 可挑战的关卡 id：已通关数 + 1（封顶 MAX_STAGE）；最小为 1 */
export function nextChallengeStage() {
  return Math.min(MAX_STAGE, getClearedStage() + 1);
}

/** 关卡是否解锁（id ≤ clearedStage+1） */
export function isStageUnlocked(stageId) {
  return Number(stageId) <= nextChallengeStage();
}

/** 关卡是否已通关 */
export function isStageCleared(stageId) {
  return Number(stageId) <= getClearedStage();
}
