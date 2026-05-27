<template>
  <div class="story col">
    <div class="actors">
      <div v-for="(name, k) in actorNames" :key="k" class="actor"
        :style="{ animationDelay: (0.2 + k * 0.15) + 's' }"
      >
        <PetSprite :pet-id="theme.petId" mood="happy" :size="92" :level="1" />
        <span class="actor-name">{{ name }}</span>
      </div>
    </div>

    <div class="items-pile">
      <span v-for="i in dividend" :key="i" class="pile-item"
        :style="{ animationDelay: (0.05 * i) + 's' }"
      >{{ theme.itemEmoji }}</span>
    </div>

    <div class="bubble">
      🗣 <span>{{ openingText }}</span>
      <button class="speak" @click="speak" :disabled="speaking">{{ speaking ? '🔊 说话中…' : '🔊 听一遍' }}</button>
    </div>

    <button class="cta" @click="$emit('next')">我来帮忙分 →</button>
  </div>
</template>

<script setup>
import { computed, ref, onBeforeUnmount } from 'vue';
import PetSprite from '../PetSprite.vue';

const props = defineProps({
  dividend: { type: Number, required: true },
  divisor:  { type: Number, required: true },
  theme:    { type: Object, required: true },
});
defineEmits(['next']);

const actorNames = computed(() =>
  props.theme.actorNames.slice(0, props.divisor),
);
const openingText = computed(() => props.theme.opening(props.dividend, props.divisor));

const speaking = ref(false);
let utterance = null;

function speak() {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  utterance = new SpeechSynthesisUtterance(openingText.value);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.95;
  speaking.value = true;
  utterance.onend = () => { speaking.value = false; };
  utterance.onerror = () => { speaking.value = false; };
  window.speechSynthesis.speak(utterance);
}

onBeforeUnmount(() => {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
});
</script>

<style scoped>
.story {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column; align-items: center;
  gap: 18px;
  padding: 8px;
}

.actors {
  display: flex; gap: 18px; flex-wrap: wrap; justify-content: center;
}
.actor {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  animation: pop-up 0.45s ease both;
}
.actor-name {
  font-size: 13px; font-weight: 900;
  color: #3a2e2e;
  background: #fffdf6; border: 2px solid #f0d999;
  padding: 2px 10px; border-radius: 999px;
}
@keyframes pop-up {
  from { opacity: 0; transform: translateY(20px) scale(0.85); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.items-pile {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 4px;
  max-width: 480px;
  padding: 14px; min-height: 80px;
  background: linear-gradient(180deg, #fff9ec, #fffaf3);
  border: 3px solid #f0d999; border-radius: 18px;
}
.pile-item {
  font-size: 30px; line-height: 1;
  animation: drop-in 0.4s ease both;
}
@keyframes drop-in {
  from { opacity: 0; transform: translateY(-30px) rotate(-20deg); }
  to   { opacity: 1; transform: translateY(0) rotate(0); }
}

.bubble {
  display: flex; align-items: center; gap: 10px;
  background: #fffdf6; border: 3px solid #f0d999;
  border-radius: 18px; padding: 12px 18px;
  max-width: 520px; text-align: left;
  font-size: 15px; font-weight: 700; color: #3a2e2e;
}
.speak {
  background: #54b85a; color: #fff;
  border: none; border-radius: 999px;
  padding: 6px 14px; font-family: inherit; font-weight: 800; font-size: 13px;
  cursor: pointer; white-space: nowrap;
  box-shadow: 0 3px 0 #3a8a42;
}
.speak:disabled { opacity: 0.55; cursor: default; }

.cta {
  background: #ff8e3c; color: #fff;
  border: none; border-radius: 14px;
  padding: 14px 32px; font-family: inherit; font-weight: 900; font-size: 17px;
  cursor: pointer; box-shadow: 0 5px 0 #f06b1d;
  margin-top: 6px;
}
.cta:hover { transform: translateY(-2px); }
</style>
