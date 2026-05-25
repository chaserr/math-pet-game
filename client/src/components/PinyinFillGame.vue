<template>
  <div class="fill-game col">

    <!-- 进度圆点 -->
    <div class="progress-dots">
      <span v-for="(q, i) in questions" :key="i"
        class="dot"
        :class="{ done: i < questionIndex, current: i === questionIndex }"
      ></span>
    </div>

    <!-- 题目卡 -->
    <div class="question-card" :class="{ pop: popAnim }">
      <!-- 拼音揭示条（答对后出现） -->
      <Transition name="reveal">
        <div v-if="result === 'ok'" class="pinyin-reveal">
          <span class="py-text">{{ current.pinyin }}</span>
          <span class="py-star">✨</span>
        </div>
      </Transition>

      <div class="char-row">
        <div class="target-char">{{ current.char }}</div>
        <button class="audio-pill" @click="audio.speakChar(current.char)" title="听发音">
          <span class="audio-icon">🔊</span>
        </button>
      </div>

      <p class="card-tip">拼一拼</p>

      <!-- 槽位：填入字母积木 -->
      <div class="slots-area">
        <div
          v-for="(slot, si) in slots" :key="si"
          class="slot"
          :class="{
            filled: slot !== null,
            shake: shakeSlots,
            correct: result === 'ok',
          }"
          :style="slot ? { '--lc': letterColor(slot) } : {}"
          :data-slot="si"
          @click="unplace(si)"
        >
          <template v-if="slot !== null">
            <PinyinLetterBlock :letter="slot" :size="slotBlockSize" />
          </template>
          <span v-else class="slot-index">{{ si + 1 }}</span>
          <div class="slot-line"></div>
        </div>
      </div>

      <!-- 提示 / 答对时的下一题 -->
      <div class="card-bottom">
        <p class="hint" :class="hintClass">{{ hint }}</p>
        <button v-if="result === 'ok'" class="btn-next" @click="nextQuestion">
          下一字 →
        </button>
        <div v-else class="card-actions">
          <button class="btn-hint" @click="useHint">💡 提示</button>
          <button class="btn-skip" @click="skipQuestion">跳过</button>
        </div>
      </div>
    </div>

    <!-- 全部完成 -->
    <Transition name="pop">
      <div v-if="finished" class="finish-overlay">
        <div class="finish-card">
          <div class="fc-emoji">{{ starEmoji }}</div>
          <h3>全部完成！</h3>
          <div class="fc-stats">
            <div class="fc-stat">
              <span class="fcs-val">{{ correctCount }}</span>
              <span class="fcs-label">正确</span>
            </div>
            <div class="fc-stat">
              <span class="fcs-val">{{ questions.length - correctCount }}</span>
              <span class="fcs-label">跳过</span>
            </div>
          </div>
          <button class="btn-restart" @click="restart">再来一次 ↺</button>
        </div>
      </div>
    </Transition>

    <!-- ===== 字母积木池 ===== -->
    <div class="pool-field" ref="fieldEl" v-if="!finished">
      <!-- 场景装饰 -->
      <div class="scene">
        <div class="sun"></div>
        <div class="cloud c1"></div>
        <div class="cloud c2"></div>
        <div class="cloud c3"></div>
        <div class="grass"></div>
      </div>
      <!-- 字母积木 -->
      <div
        v-for="tile in pool" :key="tile.id"
        class="tile"
        :class="{
          used: tile.placed,
          grabbed: tile.id === grabbedId,
          walking: tile.walking && tile.id !== grabbedId,
        }"
        :style="{ left: tile.x + 'px', top: tile.y + 'px' }"
        @pointerdown="startDrag(tile, $event)"
      >
        <PinyinLetterBlock :letter="tile.letter" :size="tileSize" :used="tile.placed" />
      </div>
    </div>

    <!-- 拖拽幽灵 -->
    <Teleport to="body">
      <div v-if="grabbedTile" class="drag-ghost"
        :style="{ left: ghostPos.x + 'px', top: ghostPos.y + 'px' }"
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

const audio    = usePinyinAudio();
const tileSize = 60;
const slotBlockSize = 50;
const POOL_SIZE = 8;

// ===== 题目 =====
function buildQuestions() {
  return [...PRACTICE_CHARS].sort(() => Math.random() - 0.5).slice(0, 10);
}

const questions     = ref(buildQuestions());
const questionIndex = ref(0);
const correctCount  = ref(0);
const current = computed(() => questions.value[questionIndex.value] || questions.value[0]);

const slots      = ref([]);
const pool       = ref([]);
const fieldEl    = ref(null);
const grabbedId  = ref(null);
const grabbedTile = ref(null);
const ghostPos   = ref({ x: 0, y: 0 });
const shakeSlots = ref(false);
const hint       = ref('把字母积木拖到对应的槽里，拼出这个字的拼音');
const hintClass  = ref('');
const result     = ref('');
const finished   = ref(false);
const popAnim    = ref(false);

const starEmoji = computed(() => {
  const pct = correctCount.value / questions.value.length;
  if (pct >= 0.9) return '🌟';
  if (pct >= 0.6) return '🎉';
  return '😊';
});

function letterColor(l) {
  return LETTER_COLORS[l.toLowerCase()] || '#888';
}

// ===== 构建槽和积木池 =====
function buildSlots() {
  slots.value = current.value.letters.map(() => null);
}

function buildPool() {
  const needed = [...current.value.letters];
  const distractors = 'abcdefghijklmnopqrstuvwxyz'
    .split('')
    .filter(l => !needed.includes(l))
    .sort(() => Math.random() - 0.5);
  while (needed.length < POOL_SIZE) needed.push(distractors.shift() || 'x');
  const letters = needed.sort(() => Math.random() - 0.5).slice(0, POOL_SIZE);

  const W = fieldEl.value?.clientWidth  || 360;
  const H = fieldEl.value?.clientHeight || 160;
  const grassH = H * 0.26;
  const usableH = H - grassH - tileSize - 10;
  const cols = Math.max(1, Math.floor((W - 16) / (tileSize + 10)));

  pool.value = letters.map((letter, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 12 + col * (tileSize + 10) + (Math.random() * 8 - 4);
    const y = 14 + row * (tileSize + 12) + (Math.random() * 6 - 3);
    return {
      id: i,
      letter,
      x: Math.min(x, W - tileSize - 8),
      y: Math.max(8, Math.min(y, usableH)),
      placed: false,
      walking: Math.random() > 0.4,
    };
  });
}

// ===== 答题逻辑 =====
function unplace(si) {
  if (result.value === 'ok') return;
  if (slots.value[si] === null) return;
  const letter = slots.value[si];
  slots.value[si] = null;
  const tile = pool.value.find(t => t.placed && t.letter === letter);
  if (tile) tile.placed = false;
  checkResult();
}

// 提示：把下一个待填空槽的正确字母自动放进去
function useHint() {
  if (result.value === 'ok') return;
  const si = slots.value.findIndex(s => s === null);
  if (si === -1) return;
  const need = current.value.letters[si];
  const tile = pool.value.find(t => !t.placed && t.letter === need);
  if (!tile) return;
  slots.value[si] = need;
  tile.placed = true;
  checkResult();
}

function checkResult() {
  const correct = current.value.letters;
  if (!slots.value.every(s => s !== null)) {
    hint.value = '把字母积木拖到槽里，拼出这个字的拼音';
    hintClass.value = '';
    result.value = '';
    return;
  }

  if (slots.value.every((l, i) => l === correct[i])) {
    hint.value = `拼得很棒！`;
    hintClass.value = 'ok';
    result.value = 'ok';
    correctCount.value++;
    audio.speakChar(current.value.char);
  } else {
    hint.value = '顺序有点问题，再试一次～';
    hintClass.value = 'err';
    result.value = '';
    shakeSlots.value = true;
    setTimeout(() => { shakeSlots.value = false; }, 500);
    setTimeout(() => {
      slots.value = correct.map(() => null);
      pool.value.forEach(t => { t.placed = false; });
      hint.value = '把字母积木拖到槽里，拼出这个字的拼音';
      hintClass.value = '';
    }, 750);
  }
}

function nextQuestion() {
  triggerCardPop();
  if (questionIndex.value + 1 >= questions.value.length) {
    finished.value = true;
    return;
  }
  questionIndex.value++;
  result.value = '';
  hint.value = '把字母积木拖到槽里，拼出这个字的拼音';
  hintClass.value = '';
  buildSlots();
  nextTick(buildPool);
}

function skipQuestion() {
  triggerCardPop();
  if (questionIndex.value + 1 >= questions.value.length) {
    finished.value = true;
    return;
  }
  questionIndex.value++;
  result.value = '';
  hint.value = '把字母积木拖到槽里，拼出这个字的拼音';
  hintClass.value = '';
  buildSlots();
  nextTick(buildPool);
}

function triggerCardPop() {
  popAnim.value = true;
  setTimeout(() => { popAnim.value = false; }, 300);
}

function restart() {
  questions.value = buildQuestions();
  questionIndex.value = 0;
  correctCount.value = 0;
  finished.value = false;
  result.value = '';
  hint.value = '把字母积木拖到槽里，拼出这个字的拼音';
  hintClass.value = '';
  buildSlots();
  nextTick(buildPool);
}

// ===== 拖拽逻辑 =====
function startDrag(tile, e) {
  if (tile.placed || result.value === 'ok') return;
  e.preventDefault();
  grabbedId.value  = tile.id;
  grabbedTile.value = tile;
  ghostPos.value = { x: e.clientX - tileSize / 2, y: e.clientY - tileSize / 2 };
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup',   onDragEnd);
}

function onDragMove(e) {
  ghostPos.value = { x: e.clientX - tileSize / 2, y: e.clientY - tileSize / 2 };
}

function onDragEnd(e) {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup',   onDragEnd);

  const tile = grabbedTile.value;
  if (!tile) { grabbedId.value = null; grabbedTile.value = null; return; }

  const slotEls = document.querySelectorAll('[data-slot]');
  for (const el of slotEls) {
    const r = el.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      const si = Number(el.dataset.slot);
      // 如果槽已有字母，先退回
      if (slots.value[si] !== null) {
        const oldLetter = slots.value[si];
        const oldTile = pool.value.find(t => t.placed && t.letter === oldLetter);
        if (oldTile) oldTile.placed = false;
      }
      slots.value[si] = tile.letter;
      tile.placed = true;
      checkResult();
      break;
    }
  }

  grabbedId.value   = null;
  grabbedTile.value = null;
}

watch(current, () => { buildSlots(); nextTick(buildPool); }, { immediate: true });
onMounted(() => { nextTick(buildPool); });
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup',   onDragEnd);
});
</script>

<style scoped>
.fill-game {
  gap: 10px;
  padding: 4px 0;
  user-select: none;
}

/* 进度圆点 */
.progress-dots {
  display: flex; gap: 7px; justify-content: center;
  padding: 2px 0;
}
.dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: #e0d8cc; transition: background 0.3s, transform 0.3s;
}
.dot.done    { background: #54b85a; }
.dot.current { background: #f0a93a; transform: scale(1.3); }

/* 题目卡 */
.question-card {
  background: linear-gradient(160deg, #fffef8 0%, #f8fff4 100%);
  border-radius: 24px;
  border: 3px solid #e8f0e0;
  box-shadow: 0 6px 0 #d0e0c8, 0 12px 28px rgba(0,0,0,0.06);
  padding: 16px 20px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: transform 0.15s;
}
.question-card.pop { animation: cardPop 0.28s ease; }
@keyframes cardPop {
  0%   { transform: scale(1); }
  40%  { transform: scale(0.96); }
  100% { transform: scale(1); }
}

/* 拼音揭示条 */
.pinyin-reveal {
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(90deg, #d0f5de, #e8f8f0);
  border: 2px solid #54b85a; border-radius: 999px;
  padding: 5px 18px;
}
.py-text {
  font-size: 22px; font-weight: 900; color: #2e7a3c;
  letter-spacing: 1px;
}
.py-star { font-size: 18px; }

.reveal-enter-active { transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); }
.reveal-enter-from   { opacity: 0; transform: translateY(-12px) scale(0.85); }

/* 字符行 */
.char-row {
  display: flex; align-items: center; gap: 14px;
}
.target-char {
  font-size: 80px; font-weight: 900; color: #2e3a28;
  line-height: 1; text-shadow: 0 4px 8px rgba(0,0,0,0.10);
}
.audio-pill {
  display: flex; flex-direction: column; align-items: center;
  background: #f0f8f2; border: 2px solid #b0e0c0; border-radius: 14px;
  padding: 8px 12px; cursor: pointer; gap: 2px;
  box-shadow: 0 3px 0 #a0d0b0; transition: transform 0.1s;
}
.audio-pill:hover { transform: translateY(-2px); }
.audio-icon { font-size: 22px; }

.card-tip {
  margin: 0; font-size: 13px; font-weight: 800; color: #9bb898;
  letter-spacing: 2px;
}

/* 槽位 */
.slots-area {
  display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
  padding: 10px 12px 6px;
  background: rgba(255,255,255,0.6);
  border-radius: 16px;
  min-height: 72px;
  align-items: flex-end;
}
.slot {
  position: relative;
  width: 54px; height: 62px;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  cursor: pointer; padding-bottom: 6px;
}
.slot-index {
  font-size: 16px; font-weight: 900;
  color: #c8bfb0;
}
.slot-line {
  position: absolute; bottom: 0; left: 4px; right: 4px;
  height: 3px;
  background: #d0c8c0;
  border-radius: 2px;
  transition: background 0.2s;
}
.slot.filled .slot-line  { background: var(--lc, #54b85a); }
.slot.correct .slot-line { background: #3a9c5c; }
.slot.shake { animation: shake 0.45s; }

@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%      { transform: translateX(-7px); }
  60%      { transform: translateX(7px); }
}

/* 提示 + 按钮行 */
.card-bottom {
  display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;
}
.hint {
  font-size: 13px; font-weight: 800; color: #9b8b7a;
  min-height: 20px; text-align: center;
}
.hint.ok  { color: #2e8b57; }
.hint.err { color: #e85b5b; }

.btn-next {
  background: linear-gradient(180deg, #66cc72, #44aa52);
  color: #fff; padding: 10px 28px;
  font-family: inherit; font-weight: 900; font-size: 16px;
  border-radius: 14px; box-shadow: 0 4px 0 #2e8040; cursor: pointer;
  transition: transform 0.1s;
}
.btn-next:hover { transform: translateY(-2px); }

.card-actions { display: flex; gap: 14px; align-items: center; }
.btn-hint {
  background: #fff8e8; color: #d6920f;
  font-family: inherit; font-weight: 800; font-size: 13px;
  border: 2px solid #f0d99a; border-radius: 999px; cursor: pointer; padding: 6px 16px;
  box-shadow: 0 2px 0 #e8c87a; transition: transform 0.1s;
}
.btn-hint:hover { transform: translateY(-2px); }
.btn-skip {
  background: transparent; color: #b0a89a;
  font-family: inherit; font-weight: 800; font-size: 13px;
  border: none; cursor: pointer; padding: 4px 12px;
  border-bottom: 2px dotted #d0c8c0;
}
.btn-skip:hover { color: #9b8b7a; }

/* ===== 字母积木池 ===== */
.pool-field {
  position: relative;
  flex: 1;
  min-height: 180px;
  background: linear-gradient(180deg, #8fd3ff 0%, #bfe9ff 46%, #e7f7ff 64%);
  border-radius: 24px;
  box-shadow: inset 0 4px 10px rgba(80,120,160,0.18);
  overflow: hidden;
}
.scene { position: absolute; inset: 0; z-index: 0; pointer-events: none; }

/* 太阳 */
.sun {
  position: absolute; top: 16px; right: 24px;
  width: 48px; height: 48px; border-radius: 50%;
  background: radial-gradient(circle at 40% 38%, #fff7c2, #ffd84d 70%);
  box-shadow: 0 0 24px 10px rgba(255,221,90,0.52);
}

/* 云 */
.cloud {
  position: absolute; width: 72px; height: 22px;
  background: #fff; border-radius: 20px;
  opacity: 0.9; filter: drop-shadow(0 3px 3px rgba(120,150,180,0.16));
}
.cloud::before, .cloud::after {
  content: ''; position: absolute; background: #fff; border-radius: 50%;
}
.cloud::before { width: 32px; height: 32px; top: -14px; left: 10px; }
.cloud::after  { width: 42px; height: 42px; top: -20px; left: 30px; }
.c1 { top: 14px; left: -80px; animation: drift 44s linear infinite; }
.c2 { top: 56px; left: -80px; transform: scale(0.7); animation: drift 60s linear infinite; animation-delay: -18s; }
.c3 { top: 32px; left: -80px; transform: scale(1.15); animation: drift 78s linear infinite; animation-delay: -48s; }
@keyframes drift { from { left: -100px; } to { left: 110%; } }

/* 草地 */
.grass {
  position: absolute; left: 0; right: 0; bottom: 0;
  height: 26%;
  background: linear-gradient(180deg, #7ec84e 0%, #56ad38 100%);
}
.grass::before {
  content: '';
  position: absolute; top: -10px; left: 0; right: 0; height: 14px;
  background: radial-gradient(circle at 11px 14px, #7ec84e 11px, transparent 12px) repeat-x;
  background-size: 22px 14px;
}

/* 积木 */
.tile {
  position: absolute; z-index: 1;
  touch-action: none; cursor: grab;
  display: flex; align-items: center; justify-content: center;
  will-change: left, top;
}
.tile.used    { opacity: 0; pointer-events: none; transform: scale(0.5); transition: all 0.25s; }
.tile.grabbed { visibility: hidden; pointer-events: none; }
.tile.walking { animation: waddle 0.64s ease-in-out infinite; }
@keyframes waddle {
  0%   { transform: rotate(-4deg) translateY(0); }
  25%  { transform: rotate(0deg)  translateY(-4px); }
  50%  { transform: rotate(4deg)  translateY(0); }
  75%  { transform: rotate(0deg)  translateY(-4px); }
  100% { transform: rotate(-4deg) translateY(0); }
}

/* 拖拽幽灵 */
.drag-ghost {
  position: fixed; z-index: 9999;
  pointer-events: none;
  filter: drop-shadow(0 12px 18px rgba(0,0,0,0.32));
}

/* ===== 完成弹窗 ===== */
.finish-overlay {
  position: absolute; inset: 0; z-index: 100;
  background: rgba(240, 255, 244, 0.92);
  display: flex; align-items: center; justify-content: center;
  border-radius: 24px;
}
.finish-card {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  background: #fff; border: 3px solid #54b85a; border-radius: 24px;
  padding: 32px 40px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}
.fc-emoji  { font-size: 60px; }
.finish-card h3 { margin: 0; font-size: 24px; color: #2e7a3c; }
.fc-stats  { display: flex; gap: 24px; }
.fc-stat   { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.fcs-val   { font-size: 32px; font-weight: 900; color: var(--ink); }
.fcs-label { font-size: 12px; font-weight: 800; color: #9b8b7a; }
.btn-restart {
  background: linear-gradient(180deg, #66cc72, #44aa52);
  color: #fff; padding: 12px 30px;
  font-family: inherit; font-weight: 900; font-size: 16px;
  border-radius: 14px; box-shadow: 0 4px 0 #2e8040; cursor: pointer;
}

.pop-enter-active { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.pop-enter-from   { opacity: 0; transform: scale(0.75); }
</style>
