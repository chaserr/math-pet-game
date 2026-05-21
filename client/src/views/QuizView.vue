<template>
  <div class="quiz col" ref="rootEl">
    <!-- 顶栏 -->
    <div class="topbar">
      <button class="back" @click="quit">‹ 返回</button>
      <div class="stage-tag" :title="stage.desc">
        <span class="se">{{ stage.emoji }}</span>
        <b>第 {{ stage.id }} 关</b>
        <span class="sn">· {{ stage.name }}</span>
        <span class="sr">{{ stage.desc }}</span>
      </div>
      <div class="hearts">
        <span v-for="i in 3" :key="i" class="heart" :class="{ lost: i > hearts }">❤️</span>
      </div>
      <div class="progress">第 {{ Math.min(index + 1, ROUND_SIZE) }} / {{ ROUND_SIZE }} 题</div>
    </div>

    <!-- 题目区 -->
    <div class="stage col center" v-if="q">
      <div class="equation">
        <span class="num">{{ q.a }}</span>
        <span class="op">{{ q.op }}</span>
        <span class="num">{{ q.b }}</span>
        <span class="op">=</span>
        <span
          v-for="(slot, si) in slots" :key="si"
          class="slot" :data-slot="si"
          :class="{ filled: slot !== null, shake: shakeSlots }"
          @click="unplace(si)"
        >
          <NumberBlock v-if="slot !== null" :digit="poolDigit(slot)" :size="64" />
        </span>
      </div>

      <p class="hint" :class="hintType">{{ hint }}</p>

      <button class="btn-accent skip" @click="skip">跳过这题 →</button>
    </div>

    <!-- 散布的积木（物理漂浮层，覆盖整个下半屏） -->
    <div class="pool-field" ref="fieldEl">
      <!-- 天空场景背景 -->
      <div class="scene">
        <div class="sun"></div>
        <div class="cloud c1"></div>
        <div class="cloud c2"></div>
        <div class="cloud c3"></div>
        <div class="grass"></div>
      </div>
      <div
        v-for="tile in pool" :key="tile.id"
        class="tile"
        :class="{
          used: tile.placed,
          grabbed: tile.id === grabbedId,
          walking: tile.walking && tile.id !== grabbedId,
        }"
        :style="{
          left: tile.x + 'px',
          top: tile.y + 'px',
        }"
        @pointerdown="startDrag(tile, $event)"
      >
        <NumberBlock :digit="tile.digit" :size="tileSide(tile.digit)" />
      </div>
    </div>

    <!-- 拖拽中的积木：渲染到 body，避免被 pool-field 的 overflow 裁切 -->
    <Teleport to="body">
      <div
        v-if="grabbedTile"
        class="drag-ghost"
        :style="{ left: ghostPos.x + 'px', top: ghostPos.y + 'px' }"
      >
        <NumberBlock :digit="grabbedTile.digit" :size="tileSide(grabbedTile.digit)" dragging />
      </div>
    </Teleport>

    <!-- 结算弹层 -->
    <Transition name="pop">
      <div v-if="finished" class="overlay center">
        <div class="card result col center">
          <div class="result-emoji">{{ score.perfect ? '🏆' : (passed ? '🎉' : '💪') }}</div>
          <h2>{{ resultTitle }}</h2>
          <p class="big">+{{ score.total }} 积分</p>
          <p class="small">
            答对 {{ score.correctCount }} / {{ ROUND_SIZE }} 题
            <span v-if="score.bonus"> · 满轮奖励 +{{ score.bonus }}</span>
          </p>

          <!-- 口粮掉落 -->
          <div v-if="foodDrops.length" class="drops">
            <p class="drops-title">🎁 宠物口粮掉落</p>
            <div class="drops-row">
              <div v-for="d in foodDrops" :key="d.foodId" class="drop-item col center">
                <FoodIcon :food-id="d.foodId" :size="44" />
                <span class="drop-name">{{ d.name }}</span>
                <span class="drop-qty">×{{ d.qty }}</span>
              </div>
            </div>
          </div>

          <!-- 通关推进提示 -->
          <p v-if="stageAdvanced" class="adv">
            ✨ 解锁第 {{ stageAdvanced }} 关：{{ findStage(stageAdvanced).name }}
          </p>

          <div class="result-btns">
            <button class="btn-accent" @click="goHome">回首页</button>
            <button v-if="passed && hasNextStage" class="btn-primary" @click="goNextStage">
              下一关 →
            </button>
            <button v-else class="btn-primary" @click="restart">再来一轮</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import NumberBlock from '../components/NumberBlock.vue';
import FoodIcon from '../components/FoodIcon.vue';
import { genQuestion, checkAnswer } from '../composables/useQuizGen.js';
import { submitRound } from '../db.js';
import { useAuthStore } from '../stores/auth.js';
import { findStage, MAX_STAGE } from '../catalog.js';
import {
  getClearedStage, setClearedStage, nextChallengeStage,
} from '../lib/progress.js';

const ROUND_SIZE = 5;
const BASE = 180;           // 基准积木边长（像素）
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

// 当前关卡（route.query.stage 优先，否则取下一可挑战关）
const stage = computed(() => {
  const id = Number(route.query.stage) || nextChallengeStage();
  return findStage(id);
});
const hasNextStage = computed(() => stage.value.id < MAX_STAGE);

// 官方图都是正方形；用每位数字的"体量"缩放，越大的数字积木越大
const SIZE_SCALE = {
  0: 0.9, 1: 0.78, 2: 0.84, 3: 0.9, 4: 0.96,
  5: 1.02, 6: 1.08, 7: 1.14, 8: 1.2, 9: 1.28,
};
function tileSide(digit) {
  return Math.round(BASE * (SIZE_SCALE[Number(digit)] ?? 1));
}
function tileBox(digit) {
  const s = tileSide(digit);
  return { w: s, h: s };
}

const index = ref(0);
const hearts = ref(3);
const q = ref(null);
const slots = ref([]);
const pool = ref([]);       // { id, digit, placed, x, y, vx, vy, jx, jy }
const grabbedId = ref(null);
const ghostPos = ref({ x: 0, y: 0 });
const hint = ref('把数字积木拖到方框里吧！');
const hintType = ref('');
const shakeSlots = ref(false);
const finished = ref(false);
const score = ref({ total: 0, correctCount: 0, perfect: false, bonus: 0 });
const foodDrops = ref([]);
const stageAdvanced = ref(null);   // 本轮新解锁的下一关 id

const results = [];
let qStartTime = 0;
let errorCount = 0;
let locking = false;

const rootEl = ref(null);
const fieldEl = ref(null);

const grabbedTile = computed(() =>
  grabbedId.value ? pool.value.find(t => t.id === grabbedId.value) || null : null,
);

const passed = computed(() => score.value.correctCount >= 3);
const resultTitle = computed(() => {
  if (score.value.perfect) return '完美通关！';
  if (passed.value) return '关卡通过！';
  return '本轮结束';
});

function poolDigit(tileId) {
  return pool.value.find(t => t.id === tileId)?.digit;
}

// ===== 散布区计算 =====
function getFieldBounds() {
  const el = fieldEl.value;
  if (!el) return { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

/** 在整个场地内随机撒开，各自朝随机方向漫游 */
function scatterTiles(tiles) {
  const b = getFieldBounds();
  const margin = 12;
  const placed = [];
  for (const t of tiles) {
    const maxX = Math.max(margin + 1, b.w - t.w - margin);
    const maxY = Math.max(margin + 1, b.h - t.h - margin);
    let x = margin, y = margin;
    for (let i = 0; i < 40; i++) {
      x = margin + Math.random() * (maxX - margin);
      y = margin + Math.random() * (maxY - margin);
      if (placed.every(p => !overlap(p, { x, y, w: t.w, h: t.h }))) break;
    }
    t.x = x; t.y = y;
    placed.push({ x, y, w: t.w, h: t.h });
    pickWanderTarget(t, performance.now());
    t.vx = t.twx; t.vy = t.twy;
  }
}

function overlap(a, b) {
  const pad = 8;
  return !(a.x + a.w + pad < b.x || b.x + b.w + pad < a.x ||
           a.y + a.h + pad < b.y || b.y + b.h + pad < a.y);
}

/** 随机选一个漫游方向（或短暂停下） */
function pickWanderTarget(t, now) {
  if (Math.random() < 0.22) {
    t.twx = 0; t.twy = 0;
  } else {
    const ang = Math.random() * Math.PI * 2;
    const spd = 0.5 + Math.random() * 1.1;
    t.twx = Math.cos(ang) * spd;
    t.twy = Math.sin(ang) * spd;
  }
  t.nextWalk = now + 1100 + Math.random() * 2400;
}

function loadQuestion() {
  const data = genQuestion(stage.value.maxNum);
  q.value = data;
  slots.value = Array(data.slots).fill(null);
  pool.value = data.tiles.map((d, i) => {
    const { w, h } = tileBox(d);
    return {
      id: `${index.value}-${i}`,
      digit: d,
      placed: false,
      x: 0, y: 0, vx: 0, vy: 0,
      twx: 0, twy: 0, nextWalk: 0, walking: false,
      w, h,
    };
  });
  hint.value = '把数字积木拖到方框里吧！';
  hintType.value = '';
  errorCount = 0;
  qStartTime = Date.now();
  locking = false;
  nextTick(() => scatterTiles(pool.value));
}

// ===== 拖拽 + 物理 =====
let dragOffset = { x: 0, y: 0 };
let lastMove = { x: 0, y: 0, t: 0 };
let velocity = { x: 0, y: 0 };
let rafId = 0;

function startDrag(tile, e) {
  if (tile.placed || locking) return;
  e.preventDefault();
  grabbedId.value = tile.id;
  tile.vx = 0; tile.vy = 0; tile.walking = false;
  const b = getFieldBounds();
  dragOffset.x = e.clientX - b.x - tile.x;
  dragOffset.y = e.clientY - b.y - tile.y;
  // ghost 在视口坐标系，初始锚到指针下
  ghostPos.value = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
  lastMove = { x: e.clientX, y: e.clientY, t: performance.now() };
  velocity = { x: 0, y: 0 };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

function onMove(e) {
  if (!grabbedId.value) return;
  const t = pool.value.find(x => x.id === grabbedId.value);
  if (!t) return;
  const b = getFieldBounds();
  // 同步更新 field 内坐标（用于释放后位置 / 物理初值）和视口 ghost 坐标
  t.x = e.clientX - b.x - dragOffset.x;
  t.y = e.clientY - b.y - dragOffset.y;
  ghostPos.value = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };

  const now = performance.now();
  const dt = Math.max(1, now - lastMove.t);
  velocity.x = (e.clientX - lastMove.x) / dt * 16; // px / frame(60fps)
  velocity.y = (e.clientY - lastMove.y) / dt * 16;
  lastMove = { x: e.clientX, y: e.clientY, t: now };
}

function onUp(e) {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);

  const tile = pool.value.find(x => x.id === grabbedId.value);
  grabbedId.value = null;
  if (!tile) return;

  // 命中槽位？
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const slotEl = el?.closest?.('.slot');
  if (slotEl) {
    const si = Number(slotEl.dataset.slot);
    place(tile.id, si);
    return;
  }

  // 否则把甩动速度交给物理循环（重力会把它带回地面继续走动）
  tile.vx = velocity.x;
  tile.vy = velocity.y;
  tile.nextWalk = performance.now() + 600;
}

// ===== 物理循环：满屏随机漫游（持续运行）=====
const WALL_BOUNCE = 0.6;    // 高速撞墙的能量保留
const EASE = 0.08;          // 向漫游目标速度过渡的平滑系数

function ensurePhysicsLoop() {
  if (!rafId) rafId = requestAnimationFrame(stepPhysics);
}

function stepPhysics() {
  const b = getFieldBounds();
  const now = performance.now();

  for (const t of pool.value) {
    if (t.placed || t.id === grabbedId.value) continue;

    const maxX = Math.max(0, b.w - t.w);
    const maxY = Math.max(0, b.h - t.h);

    if (now >= t.nextWalk) pickWanderTarget(t, now);

    // 高速甩出时靠摩擦减速，慢下来后平滑过渡到漫游速度
    t.vx = t.vx * (1 - EASE) + t.twx * EASE;
    t.vy = t.vy * (1 - EASE) + t.twy * EASE;

    t.x += t.vx;
    t.y += t.vy;

    // 四壁反弹（高速撞墙才衰减能量，慢速直接转向）
    if (t.x <= 0) {
      t.x = 0;
      t.vx = (Math.abs(t.vx) * (Math.abs(t.vx) > 2 ? WALL_BOUNCE : 1)) || 0.5;
      t.twx = Math.abs(t.twx) || 0.4;
    } else if (t.x >= maxX) {
      t.x = maxX;
      t.vx = -((Math.abs(t.vx) * (Math.abs(t.vx) > 2 ? WALL_BOUNCE : 1)) || 0.5);
      t.twx = -(Math.abs(t.twx) || 0.4);
    }
    if (t.y <= 0) {
      t.y = 0;
      t.vy = (Math.abs(t.vy) * (Math.abs(t.vy) > 2 ? WALL_BOUNCE : 1)) || 0.5;
      t.twy = Math.abs(t.twy) || 0.4;
    } else if (t.y >= maxY) {
      t.y = maxY;
      t.vy = -((Math.abs(t.vy) * (Math.abs(t.vy) > 2 ? WALL_BOUNCE : 1)) || 0.5);
      t.twy = -(Math.abs(t.twy) || 0.4);
    }

    t.walking = Math.abs(t.vx) + Math.abs(t.vy) > 0.15;
  }

  rafId = requestAnimationFrame(stepPhysics);
}

// ===== 槽位逻辑 =====
function place(tileId, si) {
  if (slots.value[si] !== null) return;
  const tile = pool.value.find(t => t.id === tileId);
  if (!tile || tile.placed) return;
  tile.placed = true;
  tile.vx = 0; tile.vy = 0;
  slots.value[si] = tileId;
  if (slots.value.every(s => s !== null)) doCheck();
}

function unplace(si) {
  if (locking) return;
  const tileId = slots.value[si];
  if (tileId == null) return;
  const tile = pool.value.find(t => t.id === tileId);
  if (tile) {
    tile.placed = false;
    const b = getFieldBounds();
    tile.x = 20 + Math.random() * Math.max(1, b.w - tile.w - 40);
    tile.y = 20 + Math.random() * Math.max(1, b.h - tile.h - 40);
    pickWanderTarget(tile, performance.now());
    tile.vx = tile.twx; tile.vy = tile.twy;
  }
  slots.value[si] = null;
  ensurePhysicsLoop();
}

function doCheck() {
  locking = true;
  const filled = slots.value.map(id => poolDigit(id));
  const correct = checkAnswer(filled, q.value.answer);
  if (correct) onCorrect(filled);
  else onWrong();
}

function onCorrect(filled) {
  hint.value = '答对啦！🎉';
  hintType.value = 'good';
  results.push({
    question: q.value.question, answer: q.value.answer,
    userAnswer: Number(filled.join('')), isCorrect: true,
    errorCount, timeMs: Date.now() - qStartTime,
  });
  setTimeout(nextQuestion, 1300);
}

function onWrong() {
  errorCount += 1;
  hearts.value -= 1;
  hint.value = hearts.value > 0 ? '差一点点～再试一次！' : '别灰心，下次会更好！';
  hintType.value = 'bad';

  shakeSlots.value = true;
  setTimeout(() => (shakeSlots.value = false), 400);

  // 错误：所有积木跳回散布区
  const b = getFieldBounds();
  for (const id of slots.value) {
    const tile = pool.value.find(t => t.id === id);
    if (tile) {
      tile.placed = false;
      tile.x = 20 + Math.random() * Math.max(1, b.w - tile.w - 40);
      tile.y = 20 + Math.random() * Math.max(1, b.h - tile.h - 40);
      pickWanderTarget(tile, performance.now());
      tile.vx = tile.twx; tile.vy = tile.twy;
    }
  }
  slots.value = slots.value.map(() => null);
  ensurePhysicsLoop();

  if (hearts.value <= 0) {
    results.push({
      question: q.value.question, answer: q.value.answer,
      userAnswer: null, isCorrect: false, errorCount, timeMs: Date.now() - qStartTime,
    });
    setTimeout(endRound, 900);
    return;
  }
  setTimeout(() => { locking = false; }, 450);
}

function skip() {
  if (locking) return;
  results.push({
    question: q.value.question, answer: q.value.answer,
    userAnswer: null, isCorrect: false, errorCount, timeMs: Date.now() - qStartTime,
  });
  nextQuestion();
}

function nextQuestion() {
  index.value += 1;
  if (index.value >= ROUND_SIZE) return endRound();
  loadQuestion();
}

async function endRound() {
  try {
    const res = await submitRound(results);
    score.value = res.score;
    auth.setPoints(res.points);
    foodDrops.value = res.foodDrops || [];
    // 通关推进：当前关挑战成功且是下一未通关关 → 解锁下一关
    if (passed.value) {
      const newlyCleared = Math.max(getClearedStage(), stage.value.id);
      setClearedStage(newlyCleared);
      const next = stage.value.id + 1;
      if (next <= MAX_STAGE && newlyCleared === stage.value.id) {
        stageAdvanced.value = next;
      }
    }
  } catch (e) {
    hint.value = '提交失败：' + e.message;
  }
  finished.value = true;
}

function restart() {
  index.value = 0; hearts.value = 3; results.length = 0;
  finished.value = false;
  foodDrops.value = [];
  stageAdvanced.value = null;
  loadQuestion();
}

function goNextStage() {
  if (!hasNextStage.value) return;
  router.replace({ name: 'quiz', query: { stage: stage.value.id + 1 } });
  // restart 在 stage 变化的 watch 中触发
}

watch(() => stage.value.id, () => {
  // 切关卡时重新开始
  index.value = 0; hearts.value = 3; results.length = 0;
  finished.value = false;
  foodDrops.value = [];
  stageAdvanced.value = null;
  loadQuestion();
});

function goHome() { router.push({ name: 'home' }); }
function quit() { router.push({ name: 'home' }); }

// 窗口尺寸变化：把超出边界的积木拉回来
function clampAll() {
  const b = getFieldBounds();
  for (const t of pool.value) {
    if (t.placed) continue;
    t.x = Math.min(Math.max(0, t.x), Math.max(0, b.w - t.w));
    t.y = Math.min(Math.max(0, t.y), Math.max(0, b.h - t.h));
  }
}

onMounted(() => {
  loadQuestion();
  window.addEventListener('resize', clampAll);
  ensurePhysicsLoop();
});
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('resize', clampAll);
  if (rafId) cancelAnimationFrame(rafId);
});
</script>

<style scoped>
.quiz { flex: 1; min-height: 0; position: relative; overflow: hidden; }
.back { background: #fff; color: var(--ink); padding: 8px 16px; box-shadow: 0 3px 0 var(--shadow); }
.hearts { font-size: 26px; }
.heart { transition: all 0.3s; }
.heart.lost { filter: grayscale(1); opacity: 0.3; transform: scale(0.8); }
.progress { color: #9b8b7a; font-weight: 800; white-space: nowrap; }

/* 顶栏关卡牌 */
.stage-tag {
  display: inline-flex; align-items: center; gap: 6px;
  background: linear-gradient(180deg, #fff3d6, #ffe6b3);
  color: var(--primary-dark);
  padding: 6px 14px; border-radius: 999px;
  box-shadow: inset 0 0 0 2px #ffd58a, 0 3px 0 var(--shadow);
  font-weight: 800; font-size: 14px;
}
.stage-tag .se { font-size: 18px; }
.stage-tag .sn { color: #8a6a3a; }
.stage-tag .sr {
  font-size: 12px; color: #fff; background: var(--primary);
  padding: 2px 8px; border-radius: 999px; margin-left: 4px;
}

.stage { gap: 18px; padding: 10px 16px 14px; }
.equation {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center;
  font-size: 46px; font-weight: 900; color: var(--ink);
}
.op { color: var(--primary-dark); }
.num {
  background: #fff; padding: 6px 18px; border-radius: 16px;
  box-shadow: 0 5px 0 var(--shadow); min-width: 60px; text-align: center;
}
.slot {
  width: 72px; height: 72px; border-radius: 16px;
  border: 4px dashed #d8c4a0; background: #fffdf6;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.slot.filled { border-style: solid; border-color: transparent; background: transparent; }
.slot.shake { animation: shake 0.4s; }
@keyframes shake { 0%,100%{ transform: translateX(0) } 25%{ transform: translateX(-7px) } 75%{ transform: translateX(7px) } }

.hint { font-size: 20px; font-weight: 800; min-height: 28px; color: #9b8b7a; }
.hint.good { color: var(--green); }
.hint.bad { color: #e85b5b; }

.skip { background: linear-gradient(180deg, #c9b8a3, #a89479); box-shadow: 0 5px 0 #8c7a62; }

/* 散布区：占据题目下方的剩余空间，做成蓝天草地场景 */
.pool-field {
  position: relative;
  flex: 1;
  min-height: 400px;
  margin: 0 6px 10px;
  background: linear-gradient(180deg, #8fd3ff 0%, #bfe9ff 46%, #e7f7ff 64%);
  border-radius: 24px;
  box-shadow: inset 0 4px 10px rgba(80,120,160,0.18);
  overflow: hidden;
}

/* ===== 场景装饰（在积木下层）===== */
.scene { position: absolute; inset: 0; z-index: 0; pointer-events: none; }

.sun {
  position: absolute; top: 22px; right: 30px;
  width: 56px; height: 56px; border-radius: 50%;
  background: radial-gradient(circle at 40% 38%, #fff7c2, #ffd84d 70%);
  box-shadow: 0 0 28px 12px rgba(255,221,90,0.55);
}

.cloud {
  position: absolute;
  width: 84px; height: 26px;
  background: #fff; border-radius: 20px; opacity: 0.92;
  filter: drop-shadow(0 4px 4px rgba(120,150,180,0.18));
}
.cloud::before, .cloud::after {
  content: ''; position: absolute; background: #fff; border-radius: 50%;
}
.cloud::before { width: 38px; height: 38px; top: -16px; left: 12px; }
.cloud::after { width: 50px; height: 50px; top: -24px; left: 36px; }
.c1 { top: 18px; left: -90px; transform: scale(1); animation: drift 46s linear infinite; }
.c2 { top: 70px; left: -90px; transform: scale(0.7); animation: drift 64s linear infinite; animation-delay: -20s; }
.c3 { top: 40px; left: -90px; transform: scale(1.2); animation: drift 80s linear infinite; animation-delay: -50s; }
@keyframes drift {
  from { left: -110px; }
  to   { left: 110%; }
}

.grass {
  position: absolute; left: 0; right: 0; bottom: 0; height: 26%;
  background: linear-gradient(180deg, #7ec84e 0%, #56ad38 100%);
}
.grass::before {
  content: ''; position: absolute; top: -10px; left: 0; right: 0; height: 14px;
  background: radial-gradient(circle at 11px 14px, #7ec84e 11px, transparent 12px) repeat-x;
  background-size: 22px 14px;
}

.tile {
  position: absolute;
  z-index: 1;
  touch-action: none;
  cursor: grab;
  user-select: none;
  transition: opacity 0.2s, transform 0.2s;
  display: flex; align-items: center; justify-content: center;
  will-change: transform, left, top;
}
.tile.used { opacity: 0; pointer-events: none; transform: scale(0.6); }
.tile.walking {
  animation: waddle 0.62s ease-in-out infinite;
}
.tile.grabbed {
  /* 在 field 内隐藏，由 body 上的 drag-ghost 接管显示 */
  visibility: hidden;
  pointer-events: none;
}

/* 拖拽 ghost 在 body 上（见底部非 scoped 块） */
@keyframes waddle {
  0%   { transform: rotate(-4deg) translateY(0); }
  25%  { transform: rotate(0deg)  translateY(-3px); }
  50%  { transform: rotate(4deg)  translateY(0); }
  75%  { transform: rotate(0deg)  translateY(-3px); }
  100% { transform: rotate(-4deg) translateY(0); }
}
@keyframes wiggle {
  0%   { transform: translate(-3px, 0) rotate(-12deg) scale(1.18); }
  25%  { transform: translate(3px, -2px) rotate(10deg) scale(1.2); }
  50%  { transform: translate(-2px, 2px) rotate(-10deg) scale(1.18); }
  75%  { transform: translate(3px, 0) rotate(12deg) scale(1.2); }
  100% { transform: translate(-3px, 0) rotate(-12deg) scale(1.18); }
}

.overlay { position: fixed; inset: 0; background: rgba(60,40,20,0.45); z-index: 50; }
.result { padding: 36px 40px; gap: 10px; width: 340px; }
.result-emoji { font-size: 72px; }
.result h2 { color: var(--primary-dark); }
.big { font-size: 32px; font-weight: 900; color: var(--primary); }
.small { color: #9b8b7a; }
.result-btns { display: flex; gap: 14px; margin-top: 14px; }

.drops {
  width: 100%; margin-top: 6px;
  background: #fff7e8; border-radius: 16px; padding: 10px 12px 12px;
  box-shadow: inset 0 0 0 2px #f2dfbd;
}
.drops-title { font-weight: 900; color: var(--primary-dark); font-size: 14px; margin-bottom: 6px; }
.drops-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.drop-item { gap: 2px; min-width: 60px; }
.drop-name { font-size: 12px; color: #6f5a45; font-weight: 800; }
.drop-qty { font-size: 13px; color: var(--primary-dark); font-weight: 900; }

.adv {
  font-weight: 900; color: #9b5cd6; font-size: 15px;
  background: #f3e6ff; padding: 6px 12px; border-radius: 999px;
}

.pop-enter-active { transition: all 0.3s cubic-bezier(.34,1.56,.64,1); }
.pop-enter-from { opacity: 0; transform: scale(0.8); }
</style>

<!-- 拖拽 ghost 样式：teleport 到 body，必须不依赖 scoped 选择器 -->
<style>
.drag-ghost {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: drag-ghost-wiggle 0.18s infinite;
  filter: drop-shadow(0 8px 14px rgba(0,0,0,0.25));
}
@keyframes drag-ghost-wiggle {
  0%   { transform: translate(-3px, 0) rotate(-12deg) scale(1.18); }
  25%  { transform: translate(3px, -2px) rotate(10deg) scale(1.2); }
  50%  { transform: translate(-2px, 2px) rotate(-10deg) scale(1.18); }
  75%  { transform: translate(3px, 0) rotate(12deg) scale(1.2); }
  100% { transform: translate(-3px, 0) rotate(-12deg) scale(1.18); }
}
</style>
