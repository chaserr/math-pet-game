<template>
  <span
    class="alphabet-character"
    :class="`state-${state}`"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    :aria-label="`${displayLetter} letter character`"
  >
    <img
      class="letter-sprite"
      :src="assetPath"
      alt=""
      aria-hidden="true"
      draggable="false"
    >
    <span class="sound-lines" aria-hidden="true">
      <span></span>
      <span></span>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { letterAssetPath, normalizeAlphabetLetter } from '../lib/alphabetCharacters.js';

const props = defineProps({
  letter: { type: String, required: true },
  size: { type: Number, default: 84 },
  state: { type: String, default: 'normal' },
  uppercase: { type: Boolean, default: false },
});

const normalizedLetter = computed(() => normalizeAlphabetLetter(props.letter));
const displayLetter = computed(() =>
  props.uppercase ? normalizedLetter.value.toUpperCase() : normalizedLetter.value
);
const assetPath = computed(() => letterAssetPath(normalizedLetter.value));
</script>

<style scoped>
.alphabet-character {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  transition: transform 0.18s ease, filter 0.18s ease, opacity 0.18s ease;
}

.letter-sprite {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  filter: drop-shadow(0 6px 0 rgba(89, 65, 38, 0.18));
  transform-origin: 50% 58%;
}

.sound-lines {
  position: absolute;
  top: 16%;
  right: -10%;
  width: 26px;
  height: 34px;
  opacity: 0;
  pointer-events: none;
}

.sound-lines span {
  position: absolute;
  inset: 0;
  border: 3px solid #39a3f4;
  border-left: 0;
  border-radius: 0 999px 999px 0;
}

.sound-lines span:last-child {
  transform: translateX(8px) scale(1.32);
  opacity: 0.6;
}

.state-active,
.state-done {
  transform: translateY(-8px) scale(1.08);
  filter: brightness(1.05) saturate(1.06);
}

.state-active .sound-lines {
  animation: alpha-sound 0.7s ease-out;
}

.state-grabbed {
  transform: translateY(-12px) rotate(6deg) scale(1.12);
  filter: brightness(1.08);
}

.state-wrong {
  animation: alpha-shake 0.42s ease;
}

.state-placed {
  opacity: 0.5;
  filter: grayscale(0.35);
}

.state-done .letter-sprite {
  animation: alpha-bounce 0.72s ease;
}

@keyframes alpha-sound {
  0% { opacity: 0; transform: translateX(-4px) scale(0.9); }
  30% { opacity: 0.8; }
  100% { opacity: 0; transform: translateX(4px) scale(1.18); }
}

@keyframes alpha-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

@keyframes alpha-bounce {
  0%, 100% { transform: translateY(0); }
  42% { transform: translateY(-10px); }
  68% { transform: translateY(2px); }
}
</style>
