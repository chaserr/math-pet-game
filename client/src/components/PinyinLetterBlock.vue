<template>
  <div
    class="plb"
    :class="{ dragging, used }"
    :style="{ width: size + 'px', height: size + 'px', '--bg': color, '--size': size + 'px' }"
    draggable="false"
  >
    <span class="letter">{{ letter }}</span>
    <div class="face">
      <div class="eye"></div>
      <div class="eye"></div>
    </div>
    <div class="feet">
      <div class="foot"></div>
      <div class="foot"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { LETTER_COLORS } from '../lib/pinyin-data.js';

const props = defineProps({
  letter: { type: String, required: true },
  size: { type: Number, default: 64 },
  dragging: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
});

const color = computed(() => LETTER_COLORS[props.letter.toLowerCase()] || '#ccc');
</script>

<style scoped>
.plb {
  position: relative;
  background: var(--bg);
  border-radius: 20%;
  border-bottom: 4px solid color-mix(in srgb, var(--bg) 70%, black);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  user-select: none;
  pointer-events: none;
  transition: filter 0.15s, opacity 0.15s;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.22));
  box-sizing: border-box;
  overflow: hidden;
}
.plb.dragging {
  filter: drop-shadow(0 10px 14px rgba(0,0,0,0.38));
}
.plb.used {
  opacity: 0.25;
}

.letter {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: calc(var(--size) * 0.45);
  font-weight: 900;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  line-height: 1;
  z-index: 1;
}

.face {
  position: absolute;
  bottom: 28%;
  display: flex;
  gap: calc(var(--size) * 0.12);
}
.eye {
  width: calc(var(--size) * 0.1);
  height: calc(var(--size) * 0.1);
  background: rgba(255,255,255,0.9);
  border-radius: 50%;
}

.feet {
  position: absolute;
  bottom: -2px;
  display: flex;
  gap: calc(var(--size) * 0.2);
}
.foot {
  width: calc(var(--size) * 0.15);
  height: calc(var(--size) * 0.12);
  background: color-mix(in srgb, var(--bg) 60%, black);
  border-radius: 0 0 4px 4px;
}
</style>
