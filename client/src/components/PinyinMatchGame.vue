<template>
  <div class="match-game col">
    <div class="match-header">
      <div class="score-box">🏆 {{ score }}</div>
      <div class="match-title">拼音消消乐</div>
      <div class="timer-box">⏱ {{ timeLeft }}s</div>
    </div>
    <p class="match-tip">点击汉字，再点击对应的拼音，成对消除！</p>

    <div v-if="!started && !finished" class="start-screen">
      <div class="start-emoji">🎯</div>
      <h3>拼音消消乐</h3>
      <p>找到每个汉字对应的拼音，点击成对消除</p>
      <button class="btn-start" @click="startGame">开始游戏</button>
    </div>

    <div v-else-if="finished" class="result-screen">
      <div class="res-emoji">{{ score >= 80 ? '🏆' : score >= 50 ? '🎉' : '😊' }}</div>
      <h3>游戏结束！</h3>
      <p>得分：<b>{{ score }}</b> 分</p>
      <p>消除：<b>{{ matchedCount }}</b> 对</p>
      <button class="btn-start" @click="startGame">再来一次</button>
    </div>

    <div v-else class="tiles-area">
      <TransitionGroup name="tile-pop" tag="div" class="tiles-grid">
        <div
          v-for="tile in activeTiles"
          :key="tile.key"
          class="match-tile"
          :class="{
            selected: tile.key === selected?.key,
            matched: tile.matched,
            wrong:   tile.wrong,
            char:    tile.type === 'char',
            pinyin:  tile.type === 'pinyin',
          }"
          @click="selectTile(tile)"
        >
          {{ tile.value }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { usePinyinAudio } from '../composables/usePinyinAudio.js';
import { PRACTICE_CHARS } from '../lib/pinyin-data.js';

const audio = usePinyinAudio();

const GAME_TIME  = 60; // 秒
const PAIR_COUNT = 8;  // 每轮配对数

const score       = ref(0);
const matchedCount = ref(0);
const timeLeft    = ref(GAME_TIME);
const started     = ref(false);
const finished    = ref(false);
const tiles       = ref([]);
const selected    = ref(null);
let timerHandle   = null;
let round         = 0;

const activeTiles = computed(() => tiles.value.filter(t => !t.matched));

function buildTiles() {
  round++;
  const pool = [...PRACTICE_CHARS].sort(() => Math.random() - 0.5).slice(0, PAIR_COUNT);
  const arr = [];
  pool.forEach((item, i) => {
    const pid = `${round}-${i}`;
    arr.push({ key: `c${pid}`, type: 'char',   value: item.char,   pairId: pid, matched: false, wrong: false });
    arr.push({ key: `p${pid}`, type: 'pinyin', value: item.pinyin, pairId: pid, matched: false, wrong: false });
  });
  // 洗牌
  return arr.sort(() => Math.random() - 0.5);
}

function startGame() {
  clearInterval(timerHandle);
  score.value      = 0;
  matchedCount.value = 0;
  timeLeft.value   = GAME_TIME;
  started.value    = true;
  finished.value   = false;
  selected.value   = null;
  tiles.value      = buildTiles();

  timerHandle = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      clearInterval(timerHandle);
      finished.value = true;
    }
  }, 1000);
}

function selectTile(tile) {
  if (tile.matched || tile.wrong) return;

  if (!selected.value) {
    selected.value = tile;
    return;
  }

  if (selected.value.key === tile.key) {
    selected.value = null;
    return;
  }

  // 判断是否配对
  if (selected.value.pairId === tile.pairId && selected.value.type !== tile.type) {
    // 正确！
    selected.value.matched = true;
    tile.matched = true;
    matchedCount.value++;
    score.value += 10;
    // 说出汉字
    const charTile = [selected.value, tile].find(t => t.type === 'char');
    if (charTile) audio.speakChar(charTile.value);
    selected.value = null;
    // 全消完
    if (activeTiles.value.length === 0) {
      score.value += 20; // 全部消除奖励
      tiles.value = buildTiles(); // 下一轮
    }
  } else {
    // 错误
    const prev = selected.value;
    prev.wrong = true;
    tile.wrong = true;
    selected.value = null;
    setTimeout(() => {
      prev.wrong = false;
      tile.wrong = false;
    }, 600);
    score.value = Math.max(0, score.value - 2);
  }
}

onBeforeUnmount(() => clearInterval(timerHandle));
</script>

<style scoped>
/* 默认 flex: 1 让组件填充 flex column 父容器（如沉浸式全屏）；
   嵌入到普通块级容器中不受影响（flex: 1 在非 flex 父级下无效）。 */
.match-game { gap: 12px; flex: 1; min-height: 0; }

.match-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #fffdf6; border-radius: 14px; padding: 10px 16px;
  border: 2px solid #f0e6d8;
}
.match-title { font-weight: 900; font-size: 16px; color: var(--ink); }
.score-box, .timer-box {
  font-weight: 900; font-size: 15px; color: #9b5cd6;
  background: #f5f0ff; padding: 4px 12px; border-radius: 999px;
}
.timer-box { color: #e85b5b; background: #fff0f0; }

.match-tip { text-align: center; color: #9b8b7a; font-size: 13px; font-weight: 700; margin: 0; }

.start-screen, .result-screen {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  background: #fffdf6; border-radius: 20px; padding: 32px; border: 2px solid #f0e6d8;
}
.start-emoji, .res-emoji { font-size: 56px; }
.start-screen h3, .result-screen h3 { margin: 0; font-size: 20px; color: var(--ink); }
.start-screen p, .result-screen p { margin: 0; color: #9b8b7a; font-size: 14px; }

.btn-start {
  background: #54b85a; color: #fff; padding: 12px 32px;
  font-family: inherit; font-weight: 900; font-size: 16px;
  border-radius: 14px; cursor: pointer; box-shadow: 0 4px 0 #3a8a42;
}
.btn-start:hover { transform: translateY(-2px); }

.tiles-area { flex: 1; }
.tiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
}

.match-tile {
  display: flex; align-items: center; justify-content: center;
  height: 60px; border-radius: 14px;
  font-weight: 900; font-size: 18px; cursor: pointer;
  border: 3px solid transparent;
  box-shadow: 0 3px 0 var(--shadow);
  transition: transform 0.12s, border-color 0.12s, background 0.12s;
  user-select: none;
}
.match-tile.char   { background: #fff5e6; border-color: #f0d8a0; color: var(--ink); }
.match-tile.pinyin { background: #e8f5ff; border-color: #a0c8e8; color: #3a92e0; font-size: 15px; }
.match-tile.selected { border-color: #54b85a; background: #d0f5de; transform: scale(1.06); }
.match-tile.wrong    { border-color: #e85b5b; background: #ffe8e8; animation: shake 0.5s; }
.match-tile.matched  { display: none; }

@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-5px); }
  75%      { transform: translateX(5px); }
}

.tile-pop-enter-active { transition: all 0.25s; }
.tile-pop-leave-active { transition: all 0.2s; }
.tile-pop-enter-from   { opacity: 0; transform: scale(0.6); }
.tile-pop-leave-to     { opacity: 0; transform: scale(0) rotate(15deg); }
</style>
