/**
 * 云端健康状态（响应式单例）
 *
 * 用途：db.js 的读函数在云端调用失败、回退到 LocalStorage 缓存时，
 * 把 offline 置 true；UI（App.vue 顶部 banner）订阅显示"📡 当前显示缓存数据"。
 *
 * 不放在 auth store 里：避免 db.js ↔ stores/auth.js 互相 import 形成循环。
 */
import { reactive } from 'vue';

export const cloudHealth = reactive({
  offline: false,           // true = 最近一次云端读失败，UI 显示离线
  lastOfflineAt: null,      // 最近一次降级的时间戳（debug 用）
  lastTopic: null,          // 最近一次失败的 topic（debug 用）
});

export function markCloudOnline() {
  if (cloudHealth.offline) cloudHealth.offline = false;
}

export function markCloudOffline(topic) {
  cloudHealth.offline = true;
  cloudHealth.lastOfflineAt = Date.now();
  cloudHealth.lastTopic = topic || null;
}
