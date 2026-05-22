// 关卡进度（localStorage 持久化）
// 数据结构：{ "math.add.within10": [1,2,5,...] }  每个分类记录“已通关”的关号集合。
// 关卡不锁住：所有关卡都可挑战；已通关仅用于灰显标记，仍可重玩。
// 无分类的模块（语文/英语）用 category = 'default'。

const KEY = 'mpg_progress_v3';

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeAll(obj) {
  localStorage.setItem(KEY, JSON.stringify(obj));
}

function k(subjectId, moduleId, categoryId) {
  return `${subjectId}.${moduleId}.${categoryId || 'default'}`;
}

/** 该分类已通关的关号集合 */
export function getClearedSet(subjectId, moduleId, categoryId) {
  const arr = readAll()[k(subjectId, moduleId, categoryId)];
  return new Set(Array.isArray(arr) ? arr.map(Number) : []);
}

/** 已通关关卡数 */
export function clearedCount(subjectId, moduleId, categoryId) {
  return getClearedSet(subjectId, moduleId, categoryId).size;
}

/** 是否已通关该关 */
export function isStageCleared(subjectId, moduleId, categoryId, stage) {
  return getClearedSet(subjectId, moduleId, categoryId).has(Number(stage));
}

/** 标记某关为已通关；返回是否首次通关 */
export function markCleared(subjectId, moduleId, categoryId, stage) {
  const all = readAll();
  const key = k(subjectId, moduleId, categoryId);
  const set = new Set(Array.isArray(all[key]) ? all[key].map(Number) : []);
  const s = Math.floor(Number(stage));
  if (set.has(s)) return false;
  set.add(s);
  all[key] = [...set].sort((a, b) => a - b);
  writeAll(all);
  return true;
}

/** 推荐挑战的关卡：最大已通关 + 1（封顶 total） */
export function nextChallengeStage(subjectId, moduleId, categoryId, total) {
  const set = getClearedSet(subjectId, moduleId, categoryId);
  const max = set.size ? Math.max(...set) : 0;
  return Math.min(total || Infinity, max + 1);
}
