<template>
  <!-- 陪读宠物：把游戏已有的 PetSprite 当成 Endless Reader 式"有生命的陪读角色" -->
  <div class="companion" :class="{ pop: mood === 'happy' }">
    <Transition name="bubble">
      <div v-if="line" class="bubble">{{ line }}</div>
    </Transition>
    <PetSprite :pet-id="petId" :mood="mood" :level="level" :size="size" />
  </div>
</template>

<script setup>
import PetSprite from '../PetSprite.vue';

defineProps({
  petId: { type: String, default: 'cat' },
  mood: { type: String, default: 'normal' }, // normal | happy | sad
  level: { type: Number, default: 1 },
  line: { type: String, default: '' },       // 鼓励气泡文案
  size: { type: Number, default: 72 },
});
</script>

<style scoped>
.companion { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: transform 0.2s; }
.companion.pop { animation: cheer 0.6s ease-out; }
@keyframes cheer { 0%{transform:translateY(0) scale(1);} 40%{transform:translateY(-10px) scale(1.08);} 100%{transform:translateY(0) scale(1);} }
.bubble {
  background: #fff; color: #6a5848; font-weight: 800; font-size: 13px;
  padding: 6px 12px; border-radius: 14px; border: 2px solid #ffe0a8;
  box-shadow: 0 3px 0 #f0d99a; max-width: 160px; text-align: center; position: relative;
}
.bubble::after { content: ''; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
  border: 6px solid transparent; border-top-color: #ffe0a8; }
.bubble-enter-active { transition: all 0.3s cubic-bezier(.34,1.56,.64,1); }
.bubble-enter-from { opacity: 0; transform: translateY(6px) scale(0.7); }
</style>
