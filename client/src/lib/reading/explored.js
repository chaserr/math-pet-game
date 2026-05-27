// 阅读引擎 · 探索进度（localStorage）
// ─────────────────────────────────────────────────────────────
// 与闯关进度（progress.js / mpg_progress_v3）完全隔离：
// 探索是无压力的"集字册"，只记录"这个词我探索过了"，不计分、不影响闯关。
// 数据结构：{ "<packId>": ["wordId", ...] }

const KEY = 'mpg_reading_explored_v1';
const REWARD_KEY = 'mpg_reading_rewarded_v1';

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeAll(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch { /* ignore */ }
}

/** 某词包已探索的词 id 集合。 */
export function exploredSet(packId) {
  const arr = readAll()[packId];
  return new Set(Array.isArray(arr) ? arr : []);
}

/** 已探索数量。 */
export function exploredCount(packId) {
  return exploredSet(packId).size;
}

export function isExplored(packId, wordId) {
  return exploredSet(packId).has(wordId);
}

/** 标记一个词为已探索；返回是否首次（用于触发庆祝 / 整包完成判定）。 */
export function markExplored(packId, wordId) {
  const all = readAll();
  const set = new Set(Array.isArray(all[packId]) ? all[packId] : []);
  if (set.has(wordId)) return false;
  set.add(wordId);
  all[packId] = [...set];
  writeAll(all);
  return true;
}

// ===== 整包完成奖励（仅发一次）=====
function readRewarded() {
  try { return new Set(JSON.parse(localStorage.getItem(REWARD_KEY) || '[]')); }
  catch { return new Set(); }
}

export function isPackRewarded(packId) {
  return readRewarded().has(packId);
}

/** 标记某包奖励已发放；返回是否首次（false = 之前已发过）。 */
export function markPackRewarded(packId) {
  const set = readRewarded();
  if (set.has(packId)) return false;
  set.add(packId);
  try { localStorage.setItem(REWARD_KEY, JSON.stringify([...set])); } catch { /* ignore */ }
  return true;
}
