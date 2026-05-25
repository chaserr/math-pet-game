<template>
  <div class="snake-wrap col">
    <div class="snake-header">
      <div class="score-box">🏆 {{ score }}</div>
      <div class="snake-title">拼音贪吃蛇</div>
      <div class="lives-box">{{ '❤️'.repeat(lives) }}{{ '🖤'.repeat(Math.max(0, 3 - lives)) }}</div>
    </div>

    <!-- 目标提示：当前要拼的字 + 字母进度 -->
    <div class="target-hint" v-if="started && !gameOver && target">
      <span class="th-char">{{ target.char }}</span>
      <span class="th-arrow">→</span>
      <span class="th-letters">
        <span
          v-for="(l, i) in target.letters" :key="i"
          class="th-letter"
          :class="{ done: i < progress, current: i === progress }"
        >{{ l }}</span>
      </span>
      <button class="audio-btn-sm" @click="audio.speakChar(target.char)">🔊</button>
    </div>

    <!-- 游戏画布 -->
    <div class="game-area" ref="gameAreaEl">
      <canvas ref="canvasEl" class="game-canvas"></canvas>

      <div v-if="!started || gameOver" class="overlay-screen">
        <div v-if="!started" class="ov-inner">
          <div class="ov-emoji">🐍</div>
          <h3>拼音贪吃蛇</h3>
          <p>蛇身上的汉字是空心的，按提示的顺序吃掉字母，把它拼出来！</p>
          <p class="ov-tip">拼对一个字，它就会变绿并标上拼音 🟢</p>
          <p class="ov-tip">用方向键 或 下方按钮控制方向</p>
          <button class="btn-go" @click="startGame">开始游戏</button>
        </div>
        <div v-else class="ov-inner">
          <div class="ov-emoji">{{ score >= 60 ? '🏆' : score >= 30 ? '🎉' : '😺' }}</div>
          <h3>游戏结束</h3>
          <p>得分：<b>{{ score }}</b>　拼出 <b>{{ wordsDone }}</b> 个字</p>
          <button class="btn-go" @click="startGame">再玩一次</button>
        </div>
      </div>
    </div>

    <!-- 方向控制 -->
    <div class="dpad">
      <div class="dpad-row">
        <button class="dpad-btn" @click="setDir(0,-1)">▲</button>
      </div>
      <div class="dpad-row">
        <button class="dpad-btn" @click="setDir(-1,0)">◀</button>
        <button class="dpad-btn center" @click="togglePause">{{ paused ? '▶' : '⏸' }}</button>
        <button class="dpad-btn" @click="setDir(1,0)">▶</button>
      </div>
      <div class="dpad-row">
        <button class="dpad-btn" @click="setDir(0,1)">▼</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { usePinyinAudio } from '../composables/usePinyinAudio.js';
import { PRACTICE_CHARS, LETTER_COLORS } from '../lib/pinyin-data.js';

const audio = usePinyinAudio();

const COLS = 16;
const ROWS = 18;
const TICK_MS = 300;
let CELL = 24;

const canvasEl   = ref(null);
const gameAreaEl = ref(null);
const score    = ref(0);
const lives    = ref(3);
const wordsDone = ref(0);
const started  = ref(false);
const gameOver = ref(false);
const paused   = ref(false);

// 当前要拼的字 + 已拼到第几个字母（响应式，供提示条用）
const target   = ref(null);
const progress = ref(0);

// 非响应式游戏内部状态
let snake   = [];          // [{x,y}]，snake[0] = 头
let dir     = { dx: 1, dy: 0 };
let nextDir = { dx: 1, dy: 0 };
let grow    = 0;           // 待增长格数（吃完一个字奖励长度）
let chars   = [];          // chars[k] 属于身体段 snake[k+1]；恒为 [已完成…, 当前目标]
let foods   = [];          // [{x,y,letter}]
let charQueue = [];
let tickHandle = null;
let ctx = null;
let flashCell = null;      // 吃错时短暂闪红的格子

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function nextCharFromQueue() {
  if (charQueue.length === 0) charQueue = shuffle(PRACTICE_CHARS);
  return { ...charQueue.shift(), filled: false };
}

// 当前目标 = chars 中最后一个（未填充的那个）
function refreshTarget() {
  const t = chars[chars.length - 1];
  target.value = t && !t.filled ? t : null;
}

// 随机空格
function randEmptyCell() {
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
  foods.forEach(f => occupied.add(`${f.x},${f.y}`));
  let x, y, tries = 0;
  do {
    x = Math.floor(Math.random() * COLS);
    y = Math.floor(Math.random() * ROWS);
    tries++;
  } while (occupied.has(`${x},${y}`) && tries < 100);
  return { x, y };
}

// 放置食物：只放 1 个「当前需要的字母」+ 若干干扰字母
function placeFoods() {
  foods = [];
  if (!target.value) return;
  const needLetter = target.value.letters[progress.value];
  const decoyPool = shuffle(
    'abcdefghijklmnopqrstuvwxyz'.split('').filter(l => l !== needLetter)
  ).slice(0, 4);

  const letters = shuffle([needLetter, ...decoyPool]);
  for (const letter of letters) {
    const { x, y } = randEmptyCell();
    foods.push({ x, y, letter });
  }
}

function startGame() {
  clearInterval(tickHandle);
  score.value = 0;
  lives.value = 3;
  wordsDone.value = 0;
  gameOver.value = false;
  paused.value = false;
  started.value = true;
  flashCell = null;

  const cx = Math.floor(COLS / 2), cy = Math.floor(ROWS / 2);
  snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
  dir = { dx: 1, dy: 0 };
  nextDir = { dx: 1, dy: 0 };
  grow = 0;

  charQueue = shuffle(PRACTICE_CHARS);
  chars = [nextCharFromQueue()]; // 第一个空心目标，就在头后面
  progress.value = 0;
  refreshTarget();
  placeFoods();

  tickHandle = setInterval(tick, TICK_MS);
  draw();
}

function tick() {
  if (paused.value || gameOver.value) return;
  dir = { ...nextDir };

  const head = snake[0];
  const nh = {
    x: (head.x + dir.dx + COLS) % COLS,
    y: (head.y + dir.dy + ROWS) % ROWS,
  };

  // 撞到自己
  if (snake.some(s => s.x === nh.x && s.y === nh.y)) {
    loseLife();
    return;
  }

  snake.unshift(nh);

  const fi = foods.findIndex(f => f.x === nh.x && f.y === nh.y);
  if (fi !== -1) {
    const food = foods[fi];
    const need = target.value?.letters[progress.value];

    if (food.letter === need) {
      // 吃对了
      progress.value++;
      score.value += 5;

      if (progress.value >= target.value.letters.length) {
        // 一个字拼完！
        target.value.filled = true;
        score.value += 15;
        wordsDone.value++;
        audio.speakChar(target.value.char);
        grow += 2;                       // 拼对奖励增长
        chars.push(nextCharFromQueue()); // 新的空心目标
        progress.value = 0;
        refreshTarget();
      }
      placeFoods();
    } else {
      // 吃错：扣分 + 闪红，不掉命
      score.value = Math.max(0, score.value - 2);
      flashCell = { x: food.x, y: food.y, t: Date.now() };
      foods.splice(fi, 1);
      foods.push({ ...randEmptyCell(), letter: shuffle(
        'abcdefghijklmnopqrstuvwxyz'.split('')
          .filter(l => l !== (target.value?.letters[progress.value]))
      )[0] });
    }
  }

  // 增长控制
  if (grow > 0) grow--;
  else snake.pop();

  draw();
}

function loseLife() {
  lives.value--;
  if (lives.value <= 0) {
    clearInterval(tickHandle);
    gameOver.value = true;
    draw();
    return;
  }
  // 重置蛇身位置，但保留已拼进度
  const cx = Math.floor(COLS / 2), cy = Math.floor(ROWS / 2);
  snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
  dir = { dx: 1, dy: 0 };
  nextDir = { dx: 1, dy: 0 };
  grow = 0;
  placeFoods();
  draw();
}

function setDir(dx, dy) {
  if (dx !== 0 && dir.dx !== 0) return; // 不能反向
  if (dy !== 0 && dir.dy !== 0) return;
  nextDir = { dx, dy };
}

function togglePause() {
  if (!started.value || gameOver.value) return;
  paused.value = !paused.value;
}

function onKey(e) {
  const map = { ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0] };
  if (map[e.key]) { e.preventDefault(); setDir(...map[e.key]); }
}

// ===== 绘制 =====
function draw() {
  if (!ctx) return;
  const c = ctx, W = COLS * CELL, H = ROWS * CELL;

  c.fillStyle = '#d4edda';
  c.fillRect(0, 0, W, H);
  c.strokeStyle = '#c4e0cc';
  c.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) { c.beginPath(); c.moveTo(x*CELL, 0); c.lineTo(x*CELL, H); c.stroke(); }
  for (let y = 0; y <= ROWS; y++) { c.beginPath(); c.moveTo(0, y*CELL); c.lineTo(W, y*CELL); c.stroke(); }

  // 食物字母
  const need = target.value?.letters[progress.value];
  for (const food of foods) {
    const px = food.x*CELL, py = food.y*CELL;
    const isFlash = flashCell && flashCell.x === food.x && flashCell.y === food.y && (Date.now()-flashCell.t) < 300;
    c.fillStyle = isFlash ? '#e85b5b' : (LETTER_COLORS[food.letter] || '#f0a93a');
    roundRect(c, px+2, py+2, CELL-4, CELL-4, 6); c.fill();
    // 当前需要的字母描一圈白边，做轻微提示
    if (food.letter === need) {
      c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 2.5;
      roundRect(c, px+3, py+3, CELL-6, CELL-6, 5); c.stroke();
    }
    c.fillStyle = '#fff';
    c.font = `bold ${Math.floor(CELL*0.5)}px Arial`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(food.letter, px+CELL/2, py+CELL/2);
  }

  // 蛇身（从尾到头画，头在最上层）
  for (let i = snake.length - 1; i >= 0; i--) {
    const seg = snake[i];
    const px = seg.x*CELL, py = seg.y*CELL;

    if (i === 0) {
      // 头
      c.fillStyle = '#2e8b57';
      roundRect(c, px+1, py+1, CELL-2, CELL-2, 7); c.fill();
      c.fillStyle = '#fff';
      const ex = dir.dx !== 0 ? (dir.dx > 0 ? 0.66 : 0.34) : 0.32;
      const ey = dir.dy !== 0 ? (dir.dy > 0 ? 0.66 : 0.34) : 0.34;
      c.beginPath(); c.arc(px+CELL*ex, py+CELL*ey, 2.8, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(px+CELL*(1-ex), py+CELL*ey, 2.8, 0, Math.PI*2); c.fill();
      continue;
    }

    const bi = i - 1;
    const ch = chars[bi];
    if (ch && ch.filled) {
      // 已拼好：绿底 + 汉字 + 上方拼音
      c.fillStyle = '#54b85a';
      roundRect(c, px+1, py+1, CELL-2, CELL-2, 6); c.fill();
      c.fillStyle = '#fff';
      c.font = `bold ${Math.floor(CELL*0.5)}px serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(ch.char, px+CELL/2, py+CELL/2);
      c.fillStyle = '#1f6e3a';
      c.font = `bold ${Math.floor(CELL*0.3)}px Arial`;
      c.fillText(ch.pinyin, px+CELL/2, py-3);
    } else if (ch) {
      // 当前目标：空心描边 + 汉字
      c.fillStyle = '#eafaef';
      roundRect(c, px+1, py+1, CELL-2, CELL-2, 6); c.fill();
      c.strokeStyle = '#2e8b57'; c.lineWidth = 2;
      roundRect(c, px+2.5, py+2.5, CELL-5, CELL-5, 5); c.stroke();
      c.fillStyle = '#2e4a30';
      c.font = `bold ${Math.floor(CELL*0.5)}px serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(ch.char, px+CELL/2, py+CELL/2);
    } else {
      // 普通身体
      c.fillStyle = '#3a9c54';
      roundRect(c, px+2, py+2, CELL-4, CELL-4, 5); c.fill();
    }
  }
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x+r, y); c.lineTo(x+w-r, y);
  c.quadraticCurveTo(x+w, y, x+w, y+r); c.lineTo(x+w, y+h-r);
  c.quadraticCurveTo(x+w, y+h, x+w-r, y+h); c.lineTo(x+r, y+h);
  c.quadraticCurveTo(x, y+h, x, y+h-r); c.lineTo(x, y+r);
  c.quadraticCurveTo(x, y, x+r, y); c.closePath();
}

function resizeCanvas() {
  const el = canvasEl.value, area = gameAreaEl.value;
  if (!el || !area) return;
  CELL = Math.max(18, Math.min(Math.floor(area.clientWidth / COLS), Math.floor(area.clientHeight / ROWS)));
  el.width = COLS * CELL;
  el.height = ROWS * CELL;
  ctx = el.getContext('2d');
  draw();
}

onMounted(() => {
  resizeCanvas();
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resizeCanvas);
});
onBeforeUnmount(() => {
  clearInterval(tickHandle);
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('resize', resizeCanvas);
});
</script>

<style scoped>
.snake-wrap { gap: 10px; user-select: none; }

.snake-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #fffdf6; border-radius: 14px; padding: 8px 14px; border: 2px solid #f0e6d8;
}
.snake-title { font-weight: 900; font-size: 16px; color: var(--ink); }
.score-box { font-weight: 900; font-size: 14px; color: #9b5cd6; background: #f5f0ff; padding: 4px 12px; border-radius: 999px; }
.lives-box { font-size: 16px; letter-spacing: 2px; }

.target-hint {
  display: flex; align-items: center; gap: 10px; justify-content: center;
  background: #f0fff4; border: 2px solid #a0d8b0; border-radius: 12px; padding: 8px 14px;
}
.th-char { font-size: 28px; font-weight: 900; color: #2e7a3c; }
.th-arrow { color: #9b8b7a; font-size: 16px; }
.th-letters { display: flex; gap: 6px; }
.th-letter {
  font-size: 20px; font-weight: 900; color: #9b8b7a;
  padding: 2px 8px; border-radius: 8px; border: 2px solid #e0d8cc;
}
.th-letter.done    { background: #54b85a; color: #fff; border-color: #54b85a; }
.th-letter.current { background: #f0a93a; color: #fff; border-color: #f0a93a; animation: pulse 1s infinite; }
@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }

.game-area {
  flex: 1; min-height: 280px; position: relative; overflow: hidden;
  border-radius: 16px; border: 3px solid #a0d8b0;
  display: flex; align-items: center; justify-content: center;
}
.game-canvas { display: block; max-width: 100%; max-height: 100%; }

.overlay-screen {
  position: absolute; inset: 0; background: rgba(240,255,244,0.94);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.ov-inner { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; max-width: 320px; }
.ov-emoji { font-size: 52px; }
.overlay-screen h3 { margin: 0; font-size: 22px; color: var(--ink); }
.overlay-screen p { margin: 0; color: #9b8b7a; font-size: 14px; }
.ov-tip { font-size: 12px; }
.btn-go {
  background: #54b85a; color: #fff; padding: 12px 30px;
  font-family: inherit; font-weight: 900; font-size: 16px;
  border-radius: 14px; cursor: pointer; box-shadow: 0 4px 0 #3a8a42; margin-top: 8px;
}

.dpad { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dpad-row { display: flex; gap: 4px; }
.dpad-btn {
  width: 48px; height: 48px; background: #fffdf6; color: var(--ink);
  font-size: 18px; font-weight: 900; border: 2px solid #e0d8cc; border-radius: 12px;
  cursor: pointer; box-shadow: 0 3px 0 var(--shadow); transition: transform 0.1s;
}
.dpad-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--shadow); }
.dpad-btn.center { background: #f0f8ff; color: #3a92e0; border-color: #a0c8e8; }

.audio-btn-sm {
  background: #f0f8f2; color: #54b85a; border: 2px solid #c0e8cc;
  border-radius: 8px; padding: 3px 8px; font-size: 12px; cursor: pointer;
}
</style>
