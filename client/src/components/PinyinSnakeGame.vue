<template>
  <div class="snake-wrap col">
    <div class="snake-header">
      <div class="score-box">🏆 {{ score }}</div>
      <div class="snake-title">拼音贪吃蛇</div>
      <div class="lives-box">{{ '❤️'.repeat(lives) }}{{ '🖤'.repeat(Math.max(0, 3 - lives)) }}</div>
    </div>

    <!-- 目标提示 -->
    <div class="target-hint" v-if="started && !gameOver">
      <span class="th-char">{{ targetChar?.char }}</span>
      <span class="th-arrow">→</span>
      <span class="th-letters">
        <span
          v-for="(l, i) in targetChar?.letters"
          :key="i"
          class="th-letter"
          :class="{ done: i < nextLetterIdx, current: i === nextLetterIdx }"
        >{{ l }}</span>
      </span>
      <button class="audio-btn-sm" @click="audio.speakChar(targetChar?.char)">🔊</button>
    </div>

    <!-- 游戏画布 -->
    <div class="game-area" ref="gameAreaEl">
      <canvas ref="canvasEl" class="game-canvas"></canvas>

      <!-- 开始/结束覆盖 -->
      <div v-if="!started || gameOver" class="overlay-screen">
        <div v-if="!started">
          <div class="ov-emoji">🐍</div>
          <h3>拼音贪吃蛇</h3>
          <p>蛇身显示汉字，吃对应字母拼出拼音</p>
          <p class="ov-tip">用方向键或下方按钮控制方向</p>
          <button class="btn-go" @click="startGame">开始游戏</button>
        </div>
        <div v-else>
          <div class="ov-emoji">{{ score >= 50 ? '🏆' : '😢' }}</div>
          <h3>游戏结束</h3>
          <p>得分：<b>{{ score }}</b></p>
          <button class="btn-go" @click="startGame">重新开始</button>
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
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { usePinyinAudio } from '../composables/usePinyinAudio.js';
import { PRACTICE_CHARS, LETTER_COLORS } from '../lib/pinyin-data.js';

const audio = usePinyinAudio();

// Grid dimensions
const COLS = 16;
const ROWS = 18;
let CELL = 24; // px, recalculated on mount

const canvasEl   = ref(null);
const gameAreaEl = ref(null);
const score      = ref(0);
const lives      = ref(3);
const started    = ref(false);
const gameOver   = ref(false);
const paused     = ref(false);

// Snake state
let snake      = [];
let dir        = { dx: 1, dy: 0 };
let nextDir    = { dx: 1, dy: 0 };
let bodyChars  = []; // Array of {char, pinyin, letters, filled} for each snake body segment
let foods      = []; // Array of {x, y, letter, letterIdx, charIdx}
const targetChar = ref(null);
const nextLetterIdx = ref(0);
let charQueue  = [];
let tickHandle = null;
let ctx        = null;

// Colour palette
const COLORS = {
  bg:       '#d4edda',
  grid:     '#c4e0cc',
  head:     '#2e8b57',
  bodyFill: '#54b85a',
  bodyHollow: 'rgba(0,0,0,0)',
  snake:    '#3a7a44',
  food:     '#f0a93a',
  foodBorder:'#c87e1a',
  text:     '#fff',
  charText: '#2e4a30',
  outline:  '#2e8b57',
};

function buildCharQueue() {
  return [...PRACTICE_CHARS].sort(() => Math.random() - 0.5);
}

function spawnChar() {
  if (charQueue.length === 0) charQueue = buildCharQueue();
  const item = charQueue.shift();
  return { ...item, filled: false };
}

function spawnFoods(charItem, letterIdx) {
  // Place foods for remaining letters of current char, plus some decoys
  const remaining = charItem.letters.slice(letterIdx);
  const decoys = 'abcdefghijklmnopqrstuvwxyz'
    .split('')
    .filter(l => !remaining.includes(l))
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  const allLetters = [...remaining, ...decoys].sort(() => Math.random() - 0.5);
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`));

  return allLetters.map((letter, i) => {
    let x, y;
    let tries = 0;
    do {
      x = Math.floor(Math.random() * COLS);
      y = Math.floor(Math.random() * ROWS);
      tries++;
    } while ((occupied.has(`${x},${y}`) || foods.some(f => f.x === x && f.y === y)) && tries < 50);
    const letterIdx2 = charItem.letters.indexOf(letter);
    return { x, y, letter, isTarget: letter === remaining[0], isDecoy: decoys.includes(letter) };
  });
}

function startGame() {
  clearInterval(tickHandle);
  score.value = 0;
  lives.value = 3;
  gameOver.value = false;
  paused.value = false;
  started.value = true;
  charQueue = buildCharQueue();

  // Initial snake: 3 segments in center
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  snake = [
    { x: cx,     y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  dir    = { dx: 1, dy: 0 };
  nextDir = { dx: 1, dy: 0 };

  // First 3 body chars (hollow = not yet filled)
  bodyChars = [spawnChar(), spawnChar(), spawnChar()];
  targetChar.value = bodyChars[0];
  nextLetterIdx.value = 0;
  foods = spawnFoods(bodyChars[0], 0);

  tickHandle = setInterval(tick, 280);
  draw();
}

function tick() {
  if (paused.value) return;

  dir = { ...nextDir };

  const head = snake[0];
  const newHead = {
    x: (head.x + dir.dx + COLS) % COLS,
    y: (head.y + dir.dy + ROWS) % ROWS,
  };

  // Collision with self
  if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
    loseLife();
    return;
  }

  snake.unshift(newHead);

  // Check if ate a food
  const foodIdx = foods.findIndex(f => f.x === newHead.x && f.y === newHead.y);
  if (foodIdx !== -1) {
    const food = foods[foodIdx];
    const current = bodyChars[0];
    const expectedLetter = current.letters[nextLetterIdx.value];

    if (food.letter === expectedLetter) {
      // Correct letter!
      nextLetterIdx.value++;
      foods.splice(foodIdx, 1);
      score.value += 5;

      if (nextLetterIdx.value >= current.letters.length) {
        // Completed a char!
        bodyChars[0].filled = true;
        score.value += 15;
        audio.speakChar(current.char);

        // Add new char to the queue
        bodyChars.push(spawnChar());
        // Set new target
        targetChar.value = bodyChars.find(b => !b.filled) || null;
        nextLetterIdx.value = 0;
        if (targetChar.value) {
          foods = spawnFoods(targetChar.value, 0);
        }
      } else {
        // Refresh foods for next letter
        foods = spawnFoods(current, nextLetterIdx.value);
      }
    } else {
      // Wrong letter — mark it eaten, lose a point
      foods.splice(foodIdx, 1);
      score.value = Math.max(0, score.value - 2);
    }

    // Grow (don't remove tail)
  } else {
    snake.pop();
    // Ensure body chars count matches snake length
    while (bodyChars.length < snake.length) bodyChars.push(spawnChar());
  }

  // Ensure some foods always present
  if (foods.length === 0 && targetChar.value) {
    foods = spawnFoods(targetChar.value, nextLetterIdx.value);
  }

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
  // Reset snake, keep score
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  snake = [{ x: cx, y: cy }, { x: cx-1, y: cy }, { x: cx-2, y: cy }];
  dir = { dx: 1, dy: 0 };
  nextDir = { dx: 1, dy: 0 };
  nextLetterIdx.value = 0;
  if (targetChar.value) {
    foods = spawnFoods(targetChar.value, 0);
  }
}

function setDir(dx, dy) {
  // Prevent reversing
  if (dx !== 0 && dir.dx !== 0) return;
  if (dy !== 0 && dir.dy !== 0) return;
  nextDir = { dx, dy };
}

function togglePause() {
  if (!started.value || gameOver.value) return;
  paused.value = !paused.value;
}

function onKey(e) {
  const map = {
    ArrowUp: [0, -1], ArrowDown: [0, 1],
    ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  };
  if (map[e.key]) {
    e.preventDefault();
    setDir(...map[e.key]);
  }
}

// ===== Drawing =====
function draw() {
  if (!ctx) return;
  const c = ctx;
  const W = COLS * CELL;
  const H = ROWS * CELL;

  // Background
  c.fillStyle = COLORS.bg;
  c.fillRect(0, 0, W, H);

  // Grid lines
  c.strokeStyle = COLORS.grid;
  c.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    c.beginPath(); c.moveTo(x * CELL, 0); c.lineTo(x * CELL, H); c.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    c.beginPath(); c.moveTo(0, y * CELL); c.lineTo(W, y * CELL); c.stroke();
  }

  // Food tiles
  for (const food of foods) {
    const px = food.x * CELL;
    const py = food.y * CELL;
    const bg = LETTER_COLORS[food.letter] || '#f0a93a';
    c.fillStyle = bg;
    roundRect(c, px + 2, py + 2, CELL - 4, CELL - 4, 6);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.font = `bold ${Math.floor(CELL * 0.5)}px Arial`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(food.letter, px + CELL / 2, py + CELL / 2);
  }

  // Snake body
  for (let i = snake.length - 1; i >= 0; i--) {
    const seg = snake[i];
    const px = seg.x * CELL;
    const py = seg.y * CELL;
    const bodyChar = bodyChars[i];

    if (i === 0) {
      // Head
      c.fillStyle = COLORS.head;
      roundRect(c, px + 1, py + 1, CELL - 2, CELL - 2, 7);
      c.fill();
      // Eyes
      c.fillStyle = '#fff';
      const ex = dir.dx !== 0 ? (dir.dx > 0 ? 0.65 : 0.2) : 0.3;
      const ey = dir.dy !== 0 ? (dir.dy > 0 ? 0.65 : 0.2) : 0.3;
      c.beginPath(); c.arc(px + CELL * ex, py + CELL * ey, 3, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(px + CELL * (1 - ex), py + CELL * ey, 3, 0, Math.PI * 2); c.fill();
    } else if (bodyChar) {
      // Body segment with char
      if (bodyChar.filled) {
        c.fillStyle = COLORS.bodyFill;
        roundRect(c, px + 1, py + 1, CELL - 2, CELL - 2, 6);
        c.fill();
        c.fillStyle = '#fff';
        c.font = `bold ${Math.floor(CELL * 0.48)}px serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(bodyChar.char, px + CELL / 2, py + CELL / 2);
        // Pinyin label above
        c.fillStyle = '#2e8b57';
        c.font = `bold ${Math.floor(CELL * 0.3)}px Arial`;
        c.fillText(bodyChar.pinyin, px + CELL / 2, py - 4);
      } else {
        // Hollow — outline only
        c.strokeStyle = COLORS.outline;
        c.lineWidth = 2;
        roundRect(c, px + 2, py + 2, CELL - 4, CELL - 4, 6);
        c.stroke();
        c.fillStyle = COLORS.charText;
        c.font = `bold ${Math.floor(CELL * 0.48)}px serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(bodyChar.char, px + CELL / 2, py + CELL / 2);
      }
    } else {
      // Plain body
      c.fillStyle = COLORS.bodyFill;
      roundRect(c, px + 2, py + 2, CELL - 4, CELL - 4, 5);
      c.fill();
    }
  }
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

function resizeCanvas() {
  const el = canvasEl.value;
  const area = gameAreaEl.value;
  if (!el || !area) return;
  const W = area.clientWidth;
  const H = area.clientHeight;
  CELL = Math.max(18, Math.min(Math.floor(W / COLS), Math.floor(H / ROWS)));
  el.width  = COLS * CELL;
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
  background: #fffdf6; border-radius: 14px; padding: 8px 14px;
  border: 2px solid #f0e6d8;
}
.snake-title { font-weight: 900; font-size: 16px; color: var(--ink); }
.score-box  { font-weight: 900; font-size: 14px; color: #9b5cd6; background: #f5f0ff; padding: 4px 12px; border-radius: 999px; }
.lives-box  { font-size: 16px; letter-spacing: 2px; }

.target-hint {
  display: flex; align-items: center; gap: 10px; justify-content: center;
  background: #f0fff4; border: 2px solid #a0d8b0; border-radius: 12px; padding: 8px 14px;
}
.th-char   { font-size: 28px; font-weight: 900; color: #2e7a3c; }
.th-arrow  { color: #9b8b7a; font-size: 16px; }
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
  position: absolute; inset: 0;
  background: rgba(240, 255, 244, 0.92);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
}
.ov-emoji { font-size: 52px; }
.overlay-screen h3 { margin: 0; font-size: 22px; color: var(--ink); }
.overlay-screen p  { margin: 0; color: #9b8b7a; font-size: 14px; }
.ov-tip { font-size: 12px; }
.btn-go {
  background: #54b85a; color: #fff; padding: 12px 30px;
  font-family: inherit; font-weight: 900; font-size: 16px;
  border-radius: 14px; cursor: pointer; box-shadow: 0 4px 0 #3a8a42;
  margin-top: 8px;
}

/* D-Pad */
.dpad { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dpad-row { display: flex; gap: 4px; }
.dpad-btn {
  width: 48px; height: 48px;
  background: #fffdf6; color: var(--ink); font-size: 18px; font-weight: 900;
  border: 2px solid #e0d8cc; border-radius: 12px; cursor: pointer;
  box-shadow: 0 3px 0 var(--shadow); transition: transform 0.1s;
}
.dpad-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--shadow); }
.dpad-btn.center { background: #f0f8ff; color: #3a92e0; border-color: #a0c8e8; }

.audio-btn-sm {
  background: #f0f8f2; color: #54b85a; border: 2px solid #c0e8cc;
  border-radius: 8px; padding: 3px 8px; font-size: 12px; cursor: pointer;
}
</style>
