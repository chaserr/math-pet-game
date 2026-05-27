<template>
  <button
    class="letter-tile"
    :class="[colorClass, { active: state === 'active', placed: state === 'placed', wrong: state === 'wrong', silent: silent }]"
    :disabled="state === 'placed'"
    @click="onTap"
  >
    <span class="letter-text">{{ letter }}</span>
    <span v-if="silent" class="silent-mark" title="魔法 e：不发音">🤫</span>
    <span class="speech-ring"></span>
  </button>
</template>

<script setup>
// LetterTile：可点击的字母 / 字母组合"积木块"。
// 点击 → 父组件播放它的 phoneme + 弹跳动画。
// letter 字段语言中立：'c' / 'sh' 都行，将来塞拼音的 'zh' / 'ang' 也行。
// state：normal(空闲微抖) | active(发光) | placed(灰&不可点) | wrong(红抖)
import { computed } from 'vue';

const props = defineProps({
  letter:  { type: String, required: true },
  phoneme: { type: String, default: '' },
  state:   { type: String, default: 'normal' }, // normal | active | placed | wrong
  silent:  { type: Boolean, default: false },
  // 颜色按字母类型分（元音 / 辅音 / 辅音组合），让小朋友视觉上能区分
  kind:    { type: String, default: 'auto' },   // 'vowel' | 'consonant' | 'digraph' | 'auto'
});

const emit = defineEmits(['tap']);

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

const colorClass = computed(() => {
  if (props.silent) return 'tile-silent';
  let kind = props.kind;
  if (kind === 'auto') {
    if (props.letter.length >= 2) kind = 'digraph';
    else if (VOWELS.has(props.letter.toLowerCase())) kind = 'vowel';
    else kind = 'consonant';
  }
  return `tile-${kind}`;
});

function onTap() {
  if (props.state === 'placed') return;
  emit('tap', { letter: props.letter, phoneme: props.phoneme, silent: props.silent });
}
</script>

<style scoped>
.letter-tile {
  position: relative;
  display: inline-flex; align-items: center; justify-content: center;
  width: 72px; height: 72px;
  border: 4px solid;
  border-radius: 18px;
  background: #fff;
  font-family: inherit; font-weight: 900; font-size: 38px;
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(.3,.7,.4,1), box-shadow 0.15s, filter 0.15s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  animation: idle-wiggle 4s ease-in-out infinite;
}

/* 元音：橙黄 */
.tile-vowel    { color: #c66a00; border-color: #f0a93a; background: #fff7e3; box-shadow: 0 5px 0 #b88420, 0 8px 16px rgba(240,169,58,0.22); }
/* 辅音：蓝 */
.tile-consonant{ color: #2566a8; border-color: #3a92e0; background: #e8f3ff; box-shadow: 0 5px 0 #2a6db0, 0 8px 16px rgba(58,146,224,0.22); }
/* 辅音组合（sh/ch/th/wh）：紫 */
.tile-digraph  { color: #5e3a9e; border-color: #9b5cd6; background: #f3e9ff; box-shadow: 0 5px 0 #6a3fa0, 0 8px 16px rgba(155,92,214,0.25); font-size: 30px; }
/* 静默：灰 */
.tile-silent   { color: #b9aa97; border-color: #d8c9b3; background: #f5efe4; box-shadow: 0 4px 0 #c4b094; opacity: 0.78; animation: none; }

.letter-tile:hover:not(:disabled) { transform: translateY(-3px); filter: brightness(1.04); }
.letter-tile:active:not(:disabled){ transform: translateY(2px); filter: brightness(0.96); }

.letter-tile.active {
  transform: scale(1.18);
  animation: tile-pulse 0.6s ease-in-out;
}
.letter-tile.placed {
  opacity: 0.42;
  filter: grayscale(0.6);
  cursor: not-allowed;
  animation: none;
}
.letter-tile.wrong { animation: shake 0.5s; border-color: #e85b5b; }

.letter-text { line-height: 1; }
.silent-mark {
  position: absolute; top: -8px; right: -8px;
  font-size: 16px; background: #fff;
  border-radius: 50%; width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 朗读时的"声波"动画 */
.speech-ring {
  position: absolute; inset: -8px;
  border-radius: 22px;
  border: 3px solid currentColor;
  opacity: 0; pointer-events: none;
}
.letter-tile.active .speech-ring {
  animation: speech-ring 0.7s ease-out;
}

@keyframes idle-wiggle {
  0%, 92%, 100% { transform: rotate(0deg); }
  94% { transform: rotate(-3deg); }
  96% { transform: rotate(3deg); }
  98% { transform: rotate(-2deg); }
}
@keyframes tile-pulse {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.22); }
  100% { transform: scale(1.0); }
}
@keyframes speech-ring {
  0%   { opacity: 0.8; transform: scale(0.85); }
  100% { opacity: 0;   transform: scale(1.45); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
</style>
