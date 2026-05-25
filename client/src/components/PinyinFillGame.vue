<template>
  <!-- 填写拼音：拖拽字母积木填入拼音槽（TODO: 精细设计图待补充，见文档待办清单） -->
  <div class="fill-game col">
    <!-- 字符展示区 -->
    <div class="char-display">
      <div class="target-char">{{ current.char }}</div>
      <button class="audio-btn" @click="audio.speakChar(current.char)">🔊</button>
    </div>

    <!-- 进度 -->
    <div class="progress-row">
      <span class="prog-num">{{ questionIndex + 1 }} / {{ questions.length }}</span>
      <div class="prog-bar-outer"><div class="prog-bar-fill" :style="{ width: ((questionIndex) / questions.length * 100) + '%' }"></div></div>
    </div>

    <!-- 槽位区：每个字母一个槽 -->
    <div class="slots-row">
      <div
        v-for="(slot, si) in slots" :key="si"
        class="slot"
        :class="{ filled: slot !== null, shake: shakeSlots, correct: result === 'ok' }"
        :data-slot="si"
        @click="unplace(si)"
      >
        <span v-if="slot !== null" class="slot-letter" :style="{ color: letterColor(slot) }">
          {{ slot }}
        </span>
      </div>
    </div>

    <!-- 提示文字 -->
    <p class="hint" :class="hintClass">{{ hint }}</p>

    <!-- 答对后下一题按钮 -->
    <button v-if="result === 'ok'" class="btn-next" @click="nextQuestion">
      下一题 →
    </button>

    <!-- 完成提示 -->
    <div v-if="finished" class="finish-banner">
      <div class="fb-emoji">🎉</div>
      <h3>全部完成！</h3>
      <p>你已完成 {{ questions.length }} 道拼音练习</p>
      <button class="btn-restart" @click="restart">再来一次</button>
    </div>

    <!-- 字母积木池 -->
    <div class="pool-field" ref="fieldEl" v-if="!finished">
      <div class="pool-scene">
        <div class="ps-ground"></div>
      </div>
      <div
        v-for="tile in pool" :key="tile.id"
        class="tile"
        :class="{ used: tile.placed, grabbed: tile.id === grabbedId }"
        :style="{ left: tile.x + 'px', top: tile.y + 'px' }"
        @pointerdown="startDrag(tile, $event)"
      >
        <PinyinLetterBlock :letter="tile.letter" :size="tileSize" :used="tile.placed" />
      </div>
    </div>

    <!-- 拖拽幽灵 -->
    <Teleport to="body">
      <div v-if="grabbedTile" class="drag-ghost"
        :style="{ left: ghostPos.x + 'px', top: ghostPos.y + 'px', pointerEvents: 'none', position: 'fixed', zIndex: 9999 }"
      >
        <PinyinLetterBlock :letter="grabbedTile.letter" :size="tileSize" :dragging="true" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import PinyinLetterBlock from './PinyinLetterBlock.vue';
import { usePinyinAudio } from '../composables/usePinyinAudio.js';
import { PRACTICE_CHARS, LETTER_COLORS } from '../lib/pinyin-data.js';

const audio = usePinyinAudio();
const POOL_SIZE = 8;
const tileSize = 56;

// 随机抽题
function buildQuestions() {
  const shuffled = [...PRACTICE_CHARS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 10);
}

const questions = ref(buildQuestions());
const questionIndex = ref(0);
const current = computed(() => questions.value[questionIndex.value] || questions.value[0]);

const slots = ref([]);       // null | letter string
const pool = ref([]);
const fieldEl = ref(null);
const grabbedId = ref(null);
const grabbedTile = ref(null);
const ghostPos = ref({ x: 0, y: 0 });
const shakeSlots = ref(false);
const hint = ref('把字母积木拖到对应的槽里，拼出这个字的拼音');
const hintClass = ref('');
const result = ref('');      // '' | 'ok' | 'err'
const finished = ref(false);

function letterColor(l) {
  return LETTER_COLORS[l.toLowerCase()] || '#888';
}

function buildSlots() {
  slots.value = current.value.letters.map(() => null);
}

function buildPool() {
  const letters = current.value.letters;
  const needed = [...letters];
  // 补充干扰字母
  const all = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const distractors = all.filter(l => !letters.includes(l));
  while (needed.length < POOL_SIZE) {
    needed.push(distractors[Math.floor(Math.random() * distractors.length)]);
  }
  const shuffled = needed.sort(() => Math.random() - 0.5).slice(0, POOL_SIZE);

  const fieldW = fieldEl.value?.clientWidth || 360;
  const fieldH = fieldEl.value?.clientHeight || 120;
  const margin = 12;
  const cols = Math.floor(fieldW / (tileSize + margin));

  pool.value = shuffled.map((letter, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      id: i,
      letter,
      x: margin + col * (tileSize + margin),
      y: 10 + row * (tileSize + margin),
      placed: false,
      walking: false,
    };
  });
}

function unplace(si) {
  if (result.value === 'ok') return;
  if (slots.value[si] === null) return;
  const letter = slots.value[si];
  slots.value[si] = null;
  // 找回对应积木
  const tile = pool.value.find(t => t.placed && t.letter === letter);
  if (tile) tile.placed = false;
  checkResult();
}

function checkResult() {
  const correct = current.value.letters;
  const filled = slots.value.every(s => s !== null);
  if (!filled) { hint.value = '把字母积木拖到对应的槽里，拼出这个字的拼音'; hintClass.value = ''; result.value = ''; return; }

  const isCorrect = slots.value.every((l, i) => l === correct[i]);
  if (isCorrect) {
    hint.value = `🎉 正确！${current.value.char} 的拼音是 ${current.value.pinyin}`;
    hintClass.value = 'ok';
    result.value = 'ok';
    audio.speakChar(current.value.char);
  } else {
    hint.value = '再想想，顺序有点问题～';
    hintClass.value = 'err';
    result.value = '';
    shakeSlots.value = true;
    setTimeout(() => { shakeSlots.value = false; }, 500);
    // 退回所有积木
    setTimeout(() => {
      slots.value = current.value.letters.map(() => null);
      pool.value.forEach(t => { t.placed = false; });
      hint.value = '把字母积木拖到对应的槽里，拼出这个字的拼音';
      hintClass.value = '';
    }, 800);
  }
}

function nextQuestion() {
  if (questionIndex.value + 1 >= questions.value.length) {
    finished.value = true;
    return;
  }
  questionIndex.value++;
  result.value = '';
  hint.value = '把字母积木拖到对应的槽里，拼出这个字的拼音';
  hintClass.value = '';
  buildSlots();
  nextTick(buildPool);
}

function restart() {
  questions.value = buildQuestions();
  questionIndex.value = 0;
  finished.value = false;
  result.value = '';
  hint.value = '把字母积木拖到对应的槽里，拼出这个字的拼音';
  hintClass.value = '';
  buildSlots();
  nextTick(buildPool);
}

// ===== 拖拽逻辑 =====
let dragOffset = { x: 0, y: 0 };

function startDrag(tile, e) {
  if (tile.placed || result.value === 'ok') return;
  e.preventDefault();
  grabbedId.value = tile.id;
  grabbedTile.value = tile;
  const rect = e.currentTarget.getBoundingClientRect();
  dragOffset = {
    x: e.clientX - rect.left - tileSize / 2,
    y: e.clientY - rect.top  - tileSize / 2,
  };
  ghostPos.value = { x: e.clientX - tileSize / 2, y: e.clientY - tileSize / 2 };
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
}

function onDragMove(e) {
  ghostPos.value = { x: e.clientX - tileSize / 2, y: e.clientY - tileSize / 2 };
}

function onDragEnd(e) {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);

  const tile = grabbedTile.value;
  if (!tile) { grabbedId.value = null; grabbedTile.value = null; return; }

  // 检测释放在哪个槽上
  const slotEls = document.querySelectorAll('[data-slot]');
  let dropped = false;
  for (const el of slotEls) {
    const r = el.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      const si = Number(el.dataset.slot);
      if (slots.value[si] === null) {
        slots.value[si] = tile.letter;
        tile.placed = true;
        dropped = true;
        checkResult();
      }
      break;
    }
  }

  grabbedId.value = null;
  grabbedTile.value = null;
}

watch(current, () => {
  buildSlots();
  nextTick(buildPool);
}, { immediate: true });

onMounted(() => {
  nextTick(buildPool);
});

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
});
</script>

<style scoped>
.fill-game { gap: 12px; padding: 4px 0; }

.char-display {
  display: flex; align-items: center; gap: 12px; justify-content: center;
  background: #fffdf6; border-radius: 20px; padding: 18px 24px;
  border: 3px solid #f0e6d8; box-shadow: 0 5px 0 var(--shadow);
}
.target-char {
  font-size: 72px; font-weight: 900; color: var(--ink);
  text-shadow: 0 3px 6px rgba(0,0,0,0.12);
}

.progress-row { display: flex; align-items: center; gap: 10px; }
.prog-num { font-size: 13px; font-weight: 800; color: #9b8b7a; white-space: nowrap; }
.prog-bar-outer { flex: 1; height: 8px; background: #f0e6d8; border-radius: 999px; overflow: hidden; }
.prog-bar-fill { height: 100%; background: #54b85a; border-radius: 999px; transition: width 0.3s; }

.slots-row {
  display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
  padding: 14px; background: #f8fdf9; border-radius: 16px; border: 2px solid #c0e8cc;
  min-height: 70px;
}
.slot {
  width: 52px; height: 52px;
  border: 3px dashed #a0d8b0; border-radius: 14px; background: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: border-color 0.15s, transform 0.15s;
}
.slot.filled { border-style: solid; border-color: #54b85a; background: #f0fff4; }
.slot.correct { border-color: #3a9c5c; background: #d0f5de; }
.slot.shake { animation: shake 0.4s; }
.slot-letter { font-size: 24px; font-weight: 900; }

@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-6px); }
  75%      { transform: translateX(6px); }
}

.hint {
  text-align: center; font-weight: 800; font-size: 14px; color: #9b8b7a; min-height: 22px;
}
.hint.ok  { color: #3a9c5c; }
.hint.err { color: #e85b5b; }

.btn-next {
  align-self: center; background: #54b85a; color: #fff;
  padding: 12px 32px; font-family: inherit; font-weight: 900; font-size: 16px;
  border-radius: 14px; box-shadow: 0 4px 0 #3a8a42; cursor: pointer;
  transition: transform 0.1s;
}
.btn-next:hover { transform: translateY(-2px); }

.pool-field {
  flex: 1; min-height: 140px; position: relative; overflow: hidden;
  background: linear-gradient(to bottom, #e8f5ff, #d0e8ff);
  border-radius: 20px; border: 2px solid #b0d4f0;
}
.pool-scene { position: absolute; bottom: 0; left: 0; right: 0; height: 20px; }
.ps-ground  { height: 100%; background: #a8d898; border-radius: 0 0 18px 18px; }

.tile {
  position: absolute; cursor: grab; touch-action: none;
  transition: opacity 0.15s;
}
.tile.grabbed { opacity: 0; }

.finish-banner {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  background: #f0fff4; border: 3px solid #54b85a; border-radius: 20px; padding: 28px;
}
.fb-emoji { font-size: 56px; }
.finish-banner h3 { margin: 0; font-size: 22px; color: #3a9c5c; }
.finish-banner p  { margin: 0; color: #9b8b7a; }
.btn-restart {
  background: #54b85a; color: #fff; padding: 12px 28px;
  font-family: inherit; font-weight: 900; font-size: 15px;
  border-radius: 14px; cursor: pointer;
}

.audio-btn {
  background: #f0f8f2; color: #54b85a; border: 2px solid #c0e8cc;
  border-radius: 8px; padding: 6px 10px; font-size: 14px; cursor: pointer;
}
</style>
