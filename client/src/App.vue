<template>
  <div v-if="!auth.ready" class="boot center">
    <div class="boot-logo">🧮</div>
    <div class="boot-tip">加载中…</div>
  </div>
  <RouterView v-else v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<script setup>
import { RouterView } from 'vue-router';
import { useAuthStore } from './stores/auth.js';

const auth = useAuthStore();
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
</style>
