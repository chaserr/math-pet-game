<template>
  <div v-if="!auth.ready" class="boot center">
    <div class="boot-logo">🧮</div>
    <div class="boot-tip">加载中…</div>
  </div>
  <template v-else>
    <Transition name="slide-down">
      <div v-if="cloudHealth.offline" class="cloud-banner" role="status" @click="dismissed = true" v-show="!dismissed">
        <span class="dot"></span>
        <span class="msg">网络不稳，正在显示本地缓存数据</span>
        <span class="hint">点击隐藏</span>
      </div>
    </Transition>
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </template>
</template>

<script setup>
import { ref, watch } from 'vue';
import { RouterView } from 'vue-router';
import { useAuthStore } from './stores/auth.js';
import { cloudHealth } from './lib/cloudHealth.js';

const auth = useAuthStore();
const dismissed = ref(false);

// 云端从离线→在线时，重置 dismissed，下次再离线还会显示
watch(() => cloudHealth.offline, (v) => { if (!v) dismissed.value = false; });
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.boot {
  position: fixed; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px;
}
.boot-logo { font-size: 64px; animation: boot-pop 0.9s ease infinite alternate; }
.boot-tip { color: #9b8b7a; font-weight: 800; font-size: 14px; }
@keyframes boot-pop {
  from { transform: scale(0.92); }
  to   { transform: scale(1.05); }
}

.cloud-banner {
  position: fixed; top: 0; left: 0; right: 0;
  z-index: 9999;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 8px 14px;
  background: linear-gradient(180deg, #fff5db 0%, #ffe8b8 100%);
  color: #8a5b15;
  font-size: 13px; font-weight: 700;
  border-bottom: 1px solid #f0c46c;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
}
.cloud-banner .dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #e8a217;
  box-shadow: 0 0 0 0 rgba(232,162,23,0.6);
  animation: dot-pulse 1.6s ease-out infinite;
}
.cloud-banner .msg { flex: 0 1 auto; }
.cloud-banner .hint { font-size: 11px; opacity: 0.7; font-weight: 600; }
@keyframes dot-pulse {
  0% { box-shadow: 0 0 0 0 rgba(232,162,23,0.5); }
  100% { box-shadow: 0 0 0 8px rgba(232,162,23,0); }
}

.slide-down-enter-active, .slide-down-leave-active { transition: transform 0.25s ease, opacity 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-100%); opacity: 0; }
</style>
