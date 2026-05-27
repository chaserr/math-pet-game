<template>
  <div class="magnet-wrap col">
    <div class="mg-header">
      <div class="score-box">🏆 {{ score }}</div>
      <div class="mg-title">拼音磁力链</div>
      <button class="skip-btn" @click="nextChar">换一个 ↻</button>
    </div>

    <!-- 目标提示 -->
    <div class="mg-hint">
      <span class="mh-char">{{ current.char }}</span>
      <span class="mh-arrow">→</span>
      <span class="mh-letters">
        <span
          v-for="(l, i) in current.letters" :key="i"
          class="mh-letter"
          :class="{ done: i < chain.length, current: i === chain.length && !success }"
        >{{ l }}</span>
      </span>
      <button class="audio-btn-sm" @click="audio.speakChar(current.char)">🔊</button>
    </div>

    <p class="mg-tip">按住第一个字母在场地里拖，正确的下一个字母会自动吸过来 🧲</p>

    <!-- 游戏场地 -->
    <div class="field" ref="fieldEl">
      <!-- 连接线 -->
      <svg class="links" :width="fieldW" :height="fieldH">
        <polyline
          v-if="chain.length > 1"
          :points="chainPoints"
          fill="none" stroke="#54b85a" stroke-width="5"
          stroke-linecap="round" stroke-linejoin="round" opacity="0.55"
        />
      </svg>

      <!-- 场地上待吸附的字母（正确未收集 + 干扰） -->
      <div
        v-for="t in fieldTiles" :key="t.id"
        v-show="!t.collected"
        class="m-tile"
        :class="{ next: t.order === chain.length }"
        :style="{ left: t.x + 'px', top: t.y + 'px' }"
      >
        <PinyinLetterBlock :letter="t.letter" :size="TILE" />
      </div>

      <!-- 已串起来的链（含头），头跟随指针 -->
      <div
        v-for="(seg, i) in chain" :key="'c' + i"
        class="m-tile chain"
        :class="{ head: i === 0, grabbed: i === 0 && dragging }"
        :style="{ left: seg.x + 'px', top: seg.y + 'px', zIndex: 30 + (chain.length - i) }"
        @pointerdown="i === 0 ? startDrag($event) : null"
      >
        <PinyinLetterBlock :letter="seg.letter" :size="TILE" />
        <span v-if="i === 0 && !dragging && chain.length < current.letters.length" class="grab-hint">按住我</span>
      </div>

      <!-- 成功覆盖 -->
      <Transition name="pop">
        <div v-if="success" class="mg-success">
          <div class="ms-emoji">🎉</div>
          <div class="ms-pinyin">{{ current.pinyin }}</div>
          <div class="ms-char">{{ current.char }}</div>
          <button class="btn-go" @click="nextChar">下一个 →</button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import PinyinLetterBlock from './PinyinLetterBlock.vue';
import { usePinyinAudio } from '../composables/usePinyinAudio.js';
import { PRACTICE_CHARS } from '../lib/pinyin-data.js';

const audio = usePinyinAudio();
const TILE = 52;
const MAGNET_R = 46;   // 磁吸半径
const FOLLOW = 0.35;   // 尾巴跟随系数
const GAP = 30;        // 链节间距

const fieldEl = ref(null);
const fieldW = ref(360);
const fieldH = ref(360);

const score   = ref(0);
const success = ref(false);
const dragging = ref(false);

let queue = [];
function nextFromQueue() {
  if (!queue.length) queue = [...PRACTICE_CHARS].sort(() => Math.random() - 0.5);
  return queue.shift();
}

const current = ref(nextFromQueue());
const fieldTiles = ref([]);   // {id, letter, x, y, order(-1=干扰), collected}
const chain = ref([]);        // {letter, x, y}  头在 index 0
let pointer = { x: 0, y: 0 };
let raf = 0;

const chainPoints = computed(() =>
  chain.value.map(s => `${s.x + TILE / 2},${s.y + TILE / 2}`).join(' ')
);

function rand(min, max) { return min + Math.random() * (max - min); }

function farEnough(x, y, placed, minD) {
  return placed.every(p => Math.hypot(p.x - x, p.y - y) > minD);
}

function setup() {
  success.value = false;
  dragging.value = false;
  const letters = current.value.letters;

  const W = fieldEl.value?.clientWidth || 360;
  const H = fieldEl.value?.clientHeight || 360;
  fieldW.value = W; fieldH.value = H;

  const placed = [];
  const place = () => {
    let x, y, tries = 0;
    do {
      x = rand(10, W - TILE - 10);
      y = rand(10, H - TILE - 10);
      tries++;
    } while (!farEnough(x, y, placed, TILE + 18) && tries < 60);
    placed.push({ x, y });
    return { x, y };
  };

  // 干扰字母
  const distractPool = 'abcdefghijklmnopqrstuvwxyz'
    .split('').filter(l => !letters.includes(l))
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(4, Math.max(2, letters.length)));

  const tiles = [];
  // 正确字母（除头，order 1..n-1）
  letters.forEach((l, i) => {
    if (i === 0) return;
    const p = place();
    tiles.push({ id: `c${i}`, letter: l, x: p.x, y: p.y, order: i, collected: false });
  });
  // 干扰
  distractPool.forEach((l, i) => {
    const p = place();
    tiles.push({ id: `d${i}`, letter: l, x: p.x, y: p.y, order: -1, collected: false });
  });
  fieldTiles.value = tiles;

  // 头：放底部中间
  const hx = W / 2 - TILE / 2;
  const hy = H - TILE - 16;
  chain.value = [{ letter: letters[0], x: hx, y: hy }];
  pointer = { x: hx, y: hy };
}

function startDrag(e) {
  if (success.value) return;
  e.preventDefault();
  dragging.value = true;
  updatePointer(e);
  window.addEventListener('pointermove', updatePointer);
  window.addEventListener('pointerup', endDrag);
}
function updatePointer(e) {
  const r = fieldEl.value.getBoundingClientRect();
  const x = e.clientX - r.left - TILE / 2;
  const y = e.clientY - r.top - TILE / 2;
  pointer.x = Math.max(0, Math.min(x, fieldW.value - TILE));
  pointer.y = Math.max(0, Math.min(y, fieldH.value - TILE));
}
function endDrag() {
  dragging.value = false;
  window.removeEventListener('pointermove', updatePointer);
  window.removeEventListener('pointerup', endDrag);
}

function tickFrame() {
  const ch = chain.value;
  if (ch.length) {
    // 头跟随指针（拖拽时）
    if (dragging.value) {
      ch[0].x += (pointer.x - ch[0].x) * 0.5;
      ch[0].y += (pointer.y - ch[0].y) * 0.5;
    }
    // 尾巴依次跟随前一节，保持间距
    for (let i = 1; i < ch.length; i++) {
      const prev = ch[i - 1];
      const dx = prev.x - ch[i].x;
      const dy = prev.y - ch[i].y;
      const dist = Math.hypot(dx, dy) || 1;
      const targetX = prev.x - (dx / dist) * GAP;
      const targetY = prev.y - (dy / dist) * GAP;
      ch[i].x += (targetX - ch[i].x) * FOLLOW;
      ch[i].y += (targetY - ch[i].y) * FOLLOW;
    }

    // 磁吸：只吸「下一个该收集」的正确字母
    if (dragging.value && !success.value) {
      const need = chain.value.length; // 下一个 order
      const tile = fieldTiles.value.find(t => !t.collected && t.order === need);
      if (tile) {
        const hd = chain.value[0];
        const d = Math.hypot((tile.x) - hd.x, (tile.y) - hd.y);
        if (d < MAGNET_R) {
          tile.collected = true;
          chain.value.push({ letter: tile.letter, x: tile.x, y: tile.y });
          if (chain.value.length === current.value.letters.length) {
            onSuccess();
          }
        }
      }
    }
  }
  raf = requestAnimationFrame(tickFrame);
}

function onSuccess() {
  success.value = true;
  score.value += 10;
  endDrag();
  audio.speakChar(current.value.char);
}

function nextChar() {
  current.value = nextFromQueue();
  nextTick(setup);
}

function onResize() { nextTick(setup); }

onMounted(() => {
  nextTick(() => {
    setup();
    raf = requestAnimationFrame(tickFrame);
  });
  window.addEventListener('resize', onResize);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  endDrag();
  window.removeEventListener('resize', onResize);
});
</script>

<style scoped>
/* 默认 flex: 1 让组件填充 flex column 父容器（如沉浸式全屏）；
   嵌入到普通块级容器中不受影响。 */
.magnet-wrap { gap: 10px; user-select: none; flex: 1; min-height: 0; }

.mg-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #fffdf6; border-radius: 14px; padding: 8px 14px; border: 2px solid #f0e6d8;
}
.mg-title { font-weight: 900; font-size: 16px; color: var(--ink); }
.score-box { font-weight: 900; font-size: 14px; color: #9b5cd6; background: #f5f0ff; padding: 4px 12px; border-radius: 999px; }
.skip-btn {
  font-family: inherit; font-weight: 800; font-size: 13px; color: #9b8b7a;
  background: #fff; border: 2px solid #e0d8cc; border-radius: 999px; padding: 4px 12px; cursor: pointer;
}

.mg-hint {
  display: flex; align-items: center; gap: 10px; justify-content: center;
  background: #f0fff4; border: 2px solid #a0d8b0; border-radius: 12px; padding: 8px 14px;
}
.mh-char { font-size: 28px; font-weight: 900; color: #2e7a3c; }
.mh-arrow { color: #9b8b7a; }
.mh-letters { display: flex; gap: 6px; }
.mh-letter {
  font-size: 20px; font-weight: 900; color: #9b8b7a;
  padding: 2px 8px; border-radius: 8px; border: 2px solid #e0d8cc;
}
.mh-letter.done    { background: #54b85a; color: #fff; border-color: #54b85a; }
.mh-letter.current { background: #f0a93a; color: #fff; border-color: #f0a93a; animation: pulse 1s infinite; }
@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }

.mg-tip { text-align: center; color: #9b8b7a; font-size: 13px; font-weight: 700; margin: 0; }

.field {
  flex: 1; min-height: 320px; position: relative; overflow: hidden;
  background: linear-gradient(180deg, #eaf6ff 0%, #f3fbff 100%);
  border-radius: 20px; border: 3px solid #b8e0c8; touch-action: none;
}
.links { position: absolute; left: 0; top: 0; pointer-events: none; z-index: 5; }

.m-tile {
  position: absolute; width: 52px; height: 52px;
  display: flex; align-items: center; justify-content: center;
  z-index: 10;
}
.m-tile.next { animation: bob 0.9s ease-in-out infinite; }
.m-tile.next::after {
  content: ''; position: absolute; inset: -6px;
  border: 3px dashed #f0a93a; border-radius: 16px; opacity: 0.8;
}
@keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

.m-tile.chain { cursor: grab; will-change: left, top; }
.m-tile.head { cursor: grab; }
.m-tile.head.grabbed { cursor: grabbing; }
.grab-hint {
  position: absolute; top: -22px; left: 50%; transform: translateX(-50%);
  background: #54b85a; color: #fff; font-size: 11px; font-weight: 800;
  padding: 2px 8px; border-radius: 999px; white-space: nowrap;
  animation: bob 0.9s ease-in-out infinite;
}

.mg-success {
  position: absolute; inset: 0; z-index: 50;
  background: rgba(240, 255, 244, 0.94);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
}
.ms-emoji { font-size: 50px; }
.ms-pinyin { font-size: 30px; font-weight: 900; color: #2e7a3c; letter-spacing: 1px; }
.ms-char { font-size: 40px; font-weight: 900; color: var(--ink); }
.btn-go {
  margin-top: 8px; background: #54b85a; color: #fff; padding: 10px 28px;
  font-family: inherit; font-weight: 900; font-size: 15px; border-radius: 14px;
  cursor: pointer; box-shadow: 0 4px 0 #3a8a42;
}

.pop-enter-active { transition: all 0.3s cubic-bezier(.34,1.56,.64,1); }
.pop-enter-from { opacity: 0; transform: scale(0.8); }
</style>
