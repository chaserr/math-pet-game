/**
 * 云端只读数据的 LocalStorage 缓存（fallback 用）
 *
 * 用法：db.js 里每个 read 函数 try → 命中则 cacheSet 写缓存；
 *      失败 catch → cacheGet 取缓存返回。
 *
 * key 命名：mpg_cache_v1_<uid|guest>_<topic>
 * - 按 userId 隔离，避免账号切换串数据
 * - 未登录用 'guest'（理论上 read 都需登录，但兜底防御）
 *
 * 容量：单 key < 100KB（user_pets 即使 13 只也才几 KB），LocalStorage 5MB 完全够。
 */

const PREFIX = 'mpg_cache_v1_';

function key(uid, topic) {
  return `${PREFIX}${uid || 'guest'}_${topic}`;
}

export function cacheGet(uid, topic) {
  try {
    const raw = localStorage.getItem(key(uid, topic));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

export function cacheSet(uid, topic, data) {
  try {
    localStorage.setItem(key(uid, topic), JSON.stringify({ data, savedAt: Date.now() }));
  } catch (e) {
    // QuotaExceeded 等忽略，缓存只是优化
    console.warn('[cache] write failed:', e?.message);
  }
}

export function cacheClear(uid) {
  if (!uid) return;
  const prefix = `${PREFIX}${uid}_`;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) localStorage.removeItem(k);
  }
}

export function cacheAge(uid, topic) {
  try {
    const raw = localStorage.getItem(key(uid, topic));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.savedAt ? Date.now() - parsed.savedAt : null;
  } catch {
    return null;
  }
}
