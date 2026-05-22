<template>
  <div class="quiz col" ref="rootEl">
    <!-- 顶栏 -->
    <div class="topbar">
      <button class="back" @click="quit">‹ 返回</button>
      <div class="ctx-tag" :style="{ borderColor: subjectInfo.color }">
        <span class="se">{{ subjectInfo.emoji }}</span>
        <b>{{ moduleInfo.name }}<template v-if="catName"> · {{ catName }}</template></b>
        <span class="stage-id">第 {{ stage }} 关</span>
      </div>
      <div class="hearts">
        <span v-for="i in 3" :key="i" class="heart" :class="{ lost: i > hearts }">❤️</span>
      </div>
      <div class="progress">第 {{ Math.min(index + 1, roundSize) }} / {{ roundSize }} 题</div>
    </div>

    <!-- ========== 占位 ========== -->
    <div v-if="!q || q.mode === 'placeholder'" class="placeholder-stage center col">
      <div class="ph-emoji">🚧</div>
      <h2>该模块敬请期待</h2>
      <p>{{ moduleInfo.name }} 即将上线，敬请期待～</p>
      <button class="btn-primary" @click="goHome">回首页选别的</button>
    </div>

    <!-- ========== tile-fill 模式（数字积木拖拽） ========== -->
    <template v-else-if="q.mode === 'tile-fill'">
      <div class="stage-area col center">
        <!-- 算式：a op b op c … = 空格 -->
        <div v-if="q.layout !== 'place'" class="equation">
          <span class="expr">{{ q.exprText }}</span>
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

        <!-- 数位认知：大数字 + 个/十/百/千… 数位格子 -->
        <div v-else class="place-area">
          <div class="place-number">{{ q.numberText }}</div>
          <p class="place-tip">把数字积木拖到对应的数位格子里</p>
          <div class="place-slots">
            <div v-for="(slot, si) in slots" :key="si" class="place-cell">
              <span
                class="slot place-slot" :data-slot="si"
                :class="{ filled: slot !== null, shake: shakeSlots }"
                @click="unplace(si)"
              >
                <NumberBlock v-if="slot !== null" :digit="poolDigit(slot)" :size="52" />
              </span>
              <span class="place-label">{{ q.slotLabels[si] }}</span>
            </div>
          </div>
        </div>

        <p class="hint" :class="hintType">{{ hint }}</p>
        <button class="btn-accent skip" @click="skip">跳过这题 →</button>
      </div>

      <div class="pool-field" ref="fieldEl">
        <div class="scene">
          <div class="sun"></div>
          <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
          <div class="grass"></div>
        </div>
        <div
          v-for="tile in pool" :key="tile.id"
          class="tile"
          :class="{ used: tile.placed, grabbed: tile.id === grabbedId, walking: tile.walking && tile.id !== grabbedId }"
          :style="{ left: tile.x + 'px', top: tile.y + 'px' }"
          @pointerdown="startDrag(tile, $event)"
        >
          <NumberBlock :digit="tile.digit" :size="tileSide(tile.digit)" />
        </div>
      </div>

      <Teleport to="body">
        <div v-if="grabbedTile" class="drag-ghost" :style="{ left: ghostPos.x + 'px', top: ghostPos.y + 'px' }">
          <NumberBlock :digit="grabbedTile.digit" :size="tileSide(grabbedTile.digit)" dragging />
        </div>
      </Teleport>
    </template>

    <!-- ========== multi-step 模式（数学拆分引导） ========== -->
    <template v-else-if="q.mode === 'multi-step'">
      <div class="ms-area col">
        <div class="ms-title">
          <span class="ms-q">{{ q.a }} {{ q.op }} {{ q.b }} = <b class="ms-ans">?</b></span>
          <span class="ms-tip">{{ q.op === '-' ? '减法用「连减法」' : '加法用「凑十法」' }} · 跟着步骤来 →</span>
        </div>

        <div class="ms-steps">
          <div v-for="(step, i) in renderSteps" :key="i"
            class="ms-step" :class="step.state"
          >
            <span class="ms-idx">{{ i + 1 }}</span>

            <!-- split 步：让用户把 target 拆成 parts -->
            <template v-if="step.kind === 'split'">
              <div class="ms-row">
                <span class="ms-hint">{{ step.hint }}</span>
                <span class="ms-eq">
                  <b>{{ step.target }}</b> =
                  <span class="ms-blank" :class="{ active: step.state === 'current' && stepInput.idx === 0, filled: step.shown[0] != null }">{{ step.shown[0] != null ? step.shown[0] : '?' }}</span>
                  +
                  <span class="ms-blank" :class="{ active: step.state === 'current' && stepInput.idx === 1, filled: step.shown[1] != null }">{{ step.shown[1] != null ? step.shown[1] : '?' }}</span>
                </span>
              </div>
            </template>

            <!-- calc 步：等式末填空 -->
            <template v-else-if="step.kind === 'calc'">
              <div class="ms-row">
                <span class="ms-hint" v-if="step.hint">{{ step.hint }}</span>
                <span class="ms-eq">
                  {{ step.a }} {{ step.op }} {{ step.b }} =
                  <span class="ms-blank" :class="{ active: step.state === 'current', filled: step.shown != null }">{{ step.shown != null ? step.shown : '?' }}</span>
                </span>
              </div>
            </template>

            <!-- done 步：终态 -->
            <template v-else-if="step.kind === 'done'">
              <div class="ms-row">
                <span class="ms-eq ms-final">✨ {{ step.a }} {{ step.op }} {{ step.b }} = <b>{{ step.answer }}</b></span>
              </div>
            </template>

            <!-- direct（仅 1 步） -->
            <template v-else-if="step.kind === 'direct'">
              <div class="ms-row">
                <span class="ms-eq">
                  {{ step.a }} {{ step.op }} {{ step.b }} =
                  <span class="ms-blank" :class="{ active: step.state === 'current', filled: step.shown != null }">{{ step.shown != null ? step.shown : '?' }}</span>
                </span>
              </div>
            </template>
          </div>
        </div>

        <p class="hint" :class="hintType">{{ hint }}</p>

        <!-- 数字键盘 -->
        <div class="numpad" v-if="!finishedQuestion">
          <div class="np-row" v-for="(row, ri) in numpadRows" :key="ri">
            <button v-for="k in row" :key="k.key"
              class="np-key"
              :class="k.class"
              @click="onPad(k.key)"
              :disabled="k.disabled"
            >{{ k.label }}</button>
          </div>
        </div>

        <button class="btn-accent skip" @click="skip">跳过这题 →</button>
      </div>
    </template>

    <!-- ========== choice 模式（识字 / 字母） ========== -->
    <template v-else-if="q.mode === 'choice'">
      <div class="cz-area col center">
        <div class="cz-prompt" :class="'pk-' + q.promptKind">{{ q.prompt }}</div>
        <p class="cz-sub">{{ q.sub }}</p>
        <div class="cz-options">
          <button v-for="(opt, i) in q.options" :key="i"
            class="cz-opt" :class="{ chosen: choiceChosen === i, correct: choiceRevealed && i === q.correctIndex, wrong: choiceRevealed && choiceChosen === i && i !== q.correctIndex }"
            :disabled="choiceRevealed"
            @click="onChoose(i)"
          >{{ opt }}</button>
        </div>
        <p class="hint" :class="hintType">{{ hint }}</p>
        <button class="btn-accent skip" @click="skip">跳过这题 →</button>
      </div>
    </template>

    <!-- 结算弹层 -->
    <Transition name="pop">
      <div v-if="finished" class="overlay center">
        <div class="card result col center">
          <div class="result-emoji">{{ score.perfect ? '🏆' : (passed ? '🎉' : '💪') }}</div>
          <h2>{{ resultTitle }}</h2>
          <p class="big">+{{ score.total }} 积分</p>
          <p class="small">
            答对 {{ score.correctCount }} / {{ roundSize }} 题
            <span v-if="score.bonus"> · 满轮奖励 +{{ score.bonus }}</span>
          </p>

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

          <p v-if="stageAdvanced" class="adv">
            ✨ 第 {{ stageAdvanced }} 关已通关！这一关按钮会变灰，仍可重玩
          </p>

          <div class="result-btns">
            <button class="btn-accent" @click="goHome">回首页</button>
            <button v-if="hasNextStage" class="btn-primary" @click="goNextStage">下一关 →</button>
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
import {
  genQuestion, checkTileFill, checkChoice, checkStepCalc, checkStepSplit,
} from '../composables/useQuizGen.js';
import { submitRound } from '../db.js';
import { useAuthStore } from '../stores/auth.js';
import {
  SUBJECTS, MODULES, STAGES_PER_MODULE, ROUND_SIZE as DEFAULT_ROUND_SIZE,
  findSubject, findModule,
} from '../catalog.js';
import { findCategory, categoryCount, categoryPerLevel } from '../lib/mathLevels.js';
import { markCleared } from '../lib/progress.js';

const BASE = 180;
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const subjectId = computed(() => String(route.query.subject || 'math'));
const moduleId  = computed(() => String(route.query.module || 'add'));
const category  = computed(() => String(route.query.category || ''));
const subjectInfo = computed(() => findSubject(subjectId.value));
const moduleInfo  = computed(() => findModule(subjectId.value, moduleId.value));
const catInfo = computed(() =>
  subjectId.value === 'math' ? findCategory('math', moduleId.value, category.value) : null
);
const catName = computed(() => catInfo.value?.name || '');

const totalStages = computed(() =>
  subjectId.value === 'math'
    ? categoryCount('math', moduleId.value, category.value)
    : STAGES_PER_MODULE
);
const roundSize = computed(() =>
  subjectId.value === 'math'
    ? categoryPerLevel('math', moduleId.value, category.value)
    : DEFAULT_ROUND_SIZE
);
const stage = computed(() =>
  Math.max(1, Math.min(totalStages.value || 1, Number(route.query.stage) || 1))
);
const hasNextStage = computed(() => stage.value < totalStages.value);

// 公共状态
const index = ref(0);
const hearts = ref(3);
const q = ref(null);
const hint = ref('');
const hintType = ref('');
const finished = ref(false);
const score = ref({ total: 0, correctCount: 0, count: 0, passed: false, perfect: false, bonus: 0 });
const foodDrops = ref([]);
const stageAdvanced = ref(null);
const finishedQuestion = ref(false);

const results = [];
let qStartTime = 0;
let errorCount = 0;
let locking = false;

const rootEl = ref(null);

const passed = computed(() => !!score.value.passed);
const resultTitle = computed(() => {
  if (score.value.perfect) return '完美通关！';
  if (passed.value) return '关卡通过！';
  return '本轮结束';
});

// ========== tile-fill: 拖拽 + 物理 ==========
const SIZE_SCALE = { 0: 0.9, 1: 0.78, 2: 0.84, 3: 0.9, 4: 0.96, 5: 1.02, 6: 1.08, 7: 1.14, 8: 1.2, 9: 1.28 };
function tileSide(d) { return Math.round(BASE * (SIZE_SCALE[Number(d)] ?? 1)); }
function tileBox(d) { const s = tileSide(d); return { w: s, h: s }; }

const slots = ref([]);
const pool = ref([]);
const grabbedId = ref(null);
const ghostPos = ref({ x: 0, y: 0 });
const shakeSlots = ref(false);
const fieldEl = ref(null);

const grabbedTile = computed(() =>
  grabbedId.value ? pool.value.find(t => t.id === grabbedId.value) || null : null
);
function poolDigit(tileId) { return pool.value.find(t => t.id === tileId)?.digit; }

function getFieldBounds() {
  const el = fieldEl.value;
  if (!el) return { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}
function overlap(a, b) {
  const pad = 8;
  return !(a.x + a.w + pad < b.x || b.x + b.w + pad < a.x ||
           a.y + a.h + pad < b.y || b.y + b.h + pad < a.y);
}
function pickWanderTarget(t, now) {
  if (Math.random() < 0.22) { t.twx = 0; t.twy = 0; }
  else {
    const ang = Math.random() * Math.PI * 2;
    const spd = 0.5 + Math.random() * 1.1;
    t.twx = Math.cos(ang) * spd; t.twy = Math.sin(ang) * spd;
  }
  t.nextWalk = now + 1100 + Math.random() * 2400;
}
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
  t.x = e.clientX - b.x - dragOffset.x;
  t.y = e.clientY - b.y - dragOffset.y;
  ghostPos.value = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
  const now = performance.now();
  const dt = Math.max(1, now - lastMove.t);
  velocity.x = (e.clientX - lastMove.x) / dt * 16;
  velocity.y = (e.clientY - lastMove.y) / dt * 16;
  lastMove = { x: e.clientX, y: e.clientY, t: now };
}
function onUp(e) {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
  const tile = pool.value.find(x => x.id === grabbedId.value);
  grabbedId.value = null;
  if (!tile) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const slotEl = el?.closest?.('.slot');
  if (slotEl) {
    const si = Number(slotEl.dataset.slot);
    place(tile.id, si);
    return;
  }
  tile.vx = velocity.x; tile.vy = velocity.y;
  tile.nextWalk = performance.now() + 600;
}
const WALL_BOUNCE = 0.6, EASE = 0.08;
function ensurePhysicsLoop() { if (!rafId) rafId = requestAnimationFrame(stepPhysics); }
function stepPhysics() {
  const b = getFieldBounds();
  const now = performance.now();
  for (const t of pool.value) {
    if (t.placed || t.id === grabbedId.value) continue;
    const maxX = Math.max(0, b.w - t.w), maxY = Math.max(0, b.h - t.h);
    if (now >= t.nextWalk) pickWanderTarget(t, now);
    t.vx = t.vx * (1 - EASE) + t.twx * EASE;
    t.vy = t.vy * (1 - EASE) + t.twy * EASE;
    t.x += t.vx; t.y += t.vy;
    if (t.x <= 0) { t.x = 0; t.vx = (Math.abs(t.vx) * (Math.abs(t.vx) > 2 ? WALL_BOUNCE : 1)) || 0.5; t.twx = Math.abs(t.twx) || 0.4; }
    else if (t.x >= maxX) { t.x = maxX; t.vx = -((Math.abs(t.vx) * (Math.abs(t.vx) > 2 ? WALL_BOUNCE : 1)) || 0.5); t.twx = -(Math.abs(t.twx) || 0.4); }
    if (t.y <= 0) { t.y = 0; t.vy = (Math.abs(t.vy) * (Math.abs(t.vy) > 2 ? WALL_BOUNCE : 1)) || 0.5; t.twy = Math.abs(t.twy) || 0.4; }
    else if (t.y >= maxY) { t.y = maxY; t.vy = -((Math.abs(t.vy) * (Math.abs(t.vy) > 2 ? WALL_BOUNCE : 1)) || 0.5); t.twy = -(Math.abs(t.twy) || 0.4); }
    t.walking = Math.abs(t.vx) + Math.abs(t.vy) > 0.15;
  }
  rafId = requestAnimationFrame(stepPhysics);
}
function place(tileId, si) {
  if (slots.value[si] !== null) return;
  const tile = pool.value.find(t => t.id === tileId);
  if (!tile || tile.placed) return;
  tile.placed = true; tile.vx = 0; tile.vy = 0;
  slots.value[si] = tileId;
  if (slots.value.every(s => s !== null)) doCheckTileFill();
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
function doCheckTileFill() {
  locking = true;
  const filled = slots.value.map(id => poolDigit(id));
  const ok = checkTileFill(filled, q.value.answer);
  if (ok) onCorrect(Number(filled.join('')));
  else onWrong();
}

// ========== multi-step ==========
const currentStep = ref(0);
const stepInput = ref({ idx: 0, draftA: '', draftB: '', single: '' }); // split 用 idx + drafts；calc/direct 用 single

const renderSteps = computed(() => {
  if (!q.value || q.value.mode !== 'multi-step') return [];
  return q.value.steps.map((step, i) => {
    let state = 'pending';
    if (i < currentStep.value) state = 'done';
    else if (i === currentStep.value) state = 'current';
    let shown;
    if (step.kind === 'split') {
      if (state === 'done') shown = step.parts;
      else if (state === 'current') shown = [
        stepInput.value.draftA !== '' ? Number(stepInput.value.draftA) : null,
        stepInput.value.draftB !== '' ? Number(stepInput.value.draftB) : null,
      ];
      else shown = [null, null];
    } else if (step.kind === 'calc' || step.kind === 'direct') {
      if (state === 'done') shown = step.answer;
      else if (state === 'current') shown = (stepInput.value.single !== '' ? Number(stepInput.value.single) : null);
      else shown = null;
    } else {
      shown = step.answer;
    }
    return { ...step, state, shown };
  });
});

const numpadRows = computed(() => {
  const rows = [
    [{ key: '1', label: '1' }, { key: '2', label: '2' }, { key: '3', label: '3' }],
    [{ key: '4', label: '4' }, { key: '5', label: '5' }, { key: '6', label: '6' }],
    [{ key: '7', label: '7' }, { key: '8', label: '8' }, { key: '9', label: '9' }],
    [
      { key: 'back', label: '⌫', class: 'np-fn' },
      { key: '0', label: '0' },
      { key: 'ok', label: '✓ 确定', class: 'np-ok' },
    ],
  ];
  return rows;
});

function curStep() { return q.value?.steps?.[currentStep.value]; }
function activeDraftKey() {
  // split 时由 stepInput.idx 决定填左/右；calc/direct 只用 single
  const s = curStep();
  if (!s) return null;
  if (s.kind === 'split') return stepInput.value.idx === 0 ? 'draftA' : 'draftB';
  return 'single';
}
function onPad(key) {
  if (locking || finishedQuestion.value) return;
  const s = curStep();
  if (!s || s.kind === 'done') return;
  const fieldKey = activeDraftKey();
  if (key === 'back') {
    stepInput.value[fieldKey] = String(stepInput.value[fieldKey]).slice(0, -1);
    return;
  }
  if (key === 'ok') return submitStep();
  // 数字 0-9：附加（限制最多 4 位）
  if (stepInput.value[fieldKey].length >= 4) return;
  stepInput.value[fieldKey] += key;
}
function submitStep() {
  const s = curStep();
  if (!s) return;
  if (s.kind === 'split') {
    // 必须两个都填
    if (stepInput.value.draftA === '' || stepInput.value.draftB === '') {
      flashHint('两个空都要填哦～', 'bad');
      return;
    }
    const filled = [Number(stepInput.value.draftA), Number(stepInput.value.draftB)];
    if (checkStepSplit(filled, s.parts)) {
      advanceStep();
    } else {
      onMultiStepWrong();
    }
  } else if (s.kind === 'calc' || s.kind === 'direct') {
    if (stepInput.value.single === '') {
      flashHint('请输入答案～', 'bad');
      return;
    }
    if (checkStepCalc(stepInput.value.single, s.answer)) {
      advanceStep();
    } else {
      onMultiStepWrong();
    }
  }
}
function advanceStep() {
  // split 模式：若 idx=0 已填且对了，但还要填 idx=1？实际我们在 submit 一次性收两个，所以 advance 直接走下一步
  currentStep.value += 1;
  stepInput.value = { idx: 0, draftA: '', draftB: '', single: '' };

  // 跳过 done 步（自动完成本题）
  const next = curStep();
  if (!next || next.kind === 'done') {
    onCorrect(q.value.answer);
  }
}
function onMultiStepWrong() {
  errorCount += 1;
  hearts.value -= 1;
  flashHint(hearts.value > 0 ? '再想想这一步～' : '别灰心，下次会更好！', 'bad');
  // 清空当前输入让用户重试
  if (curStep()?.kind === 'split') stepInput.value = { idx: 0, draftA: '', draftB: '', single: '' };
  else stepInput.value.single = '';
  if (hearts.value <= 0) {
    results.push({ question: qLabel(), answer: q.value.answer, userAnswer: null, isCorrect: false, errorCount, timeMs: Date.now() - qStartTime });
    setTimeout(endRound, 900);
  }
}

// ========== choice ==========
const choiceChosen = ref(null);
const choiceRevealed = ref(false);

function onChoose(i) {
  if (locking || choiceRevealed.value) return;
  choiceChosen.value = i;
  choiceRevealed.value = true;
  if (checkChoice(i, q.value.correctIndex)) {
    setTimeout(() => onCorrect(q.value.options[q.value.correctIndex]), 600);
  } else {
    errorCount += 1;
    hearts.value -= 1;
    flashHint(hearts.value > 0 ? '不对哦～再来！' : '别灰心', 'bad');
    if (hearts.value <= 0) {
      results.push({ question: q.value.prompt, answer: q.value.correctIndex, userAnswer: i, isCorrect: false, errorCount, timeMs: Date.now() - qStartTime });
      setTimeout(endRound, 900);
    } else {
      // 1.2s 后允许重选
      setTimeout(() => { choiceChosen.value = null; choiceRevealed.value = false; locking = false; }, 1200);
      locking = true;
    }
  }
}

// ========== 题目通用流程 ==========
function qLabel() {
  const x = q.value;
  if (!x) return '';
  if (x.mode === 'choice') return x.prompt || '';
  if (x.mode === 'multi-step') return `${x.a}${x.op}${x.b}`;
  return x.exprText || x.numberText || '';
}
function loadQuestion() {
  const data = genQuestion(subjectId.value, moduleId.value, category.value, stage.value);
  q.value = data;
  hint.value = data.mode === 'tile-fill' ? '把数字积木拖到方框里吧！'
            : data.mode === 'multi-step' ? '按提示一步步填空'
            : data.mode === 'choice' ? '请选择正确答案'
            : '';
  hintType.value = '';
  errorCount = 0;
  qStartTime = Date.now();
  locking = false;
  finishedQuestion.value = false;

  // 模式专属初始化
  if (data.mode === 'tile-fill') {
    slots.value = Array(data.slots).fill(null);
    pool.value = data.tiles.map((d, i) => {
      const { w, h } = tileBox(d);
      return { id: `${index.value}-${i}`, digit: d, placed: false, x: 0, y: 0, vx: 0, vy: 0, twx: 0, twy: 0, nextWalk: 0, walking: false, w, h };
    });
    nextTick(() => scatterTiles(pool.value));
    ensurePhysicsLoop();
  } else if (data.mode === 'multi-step') {
    currentStep.value = 0;
    stepInput.value = { idx: 0, draftA: '', draftB: '', single: '' };
  } else if (data.mode === 'choice') {
    choiceChosen.value = null;
    choiceRevealed.value = false;
  }
}

function flashHint(text, type) {
  hint.value = text; hintType.value = type || '';
}
function onCorrect(answer) {
  hint.value = '答对啦！🎉';
  hintType.value = 'good';
  finishedQuestion.value = true;
  results.push({
    question: qLabel(),
    answer: typeof answer === 'number' ? answer : 0,
    userAnswer: typeof answer === 'number' ? answer : 0,
    isCorrect: true, errorCount, timeMs: Date.now() - qStartTime,
  });
  setTimeout(nextQuestion, 1100);
}
function onWrong() {
  errorCount += 1;
  hearts.value -= 1;
  hint.value = hearts.value > 0 ? '差一点点～再试一次！' : '别灰心，下次会更好！';
  hintType.value = 'bad';
  shakeSlots.value = true;
  setTimeout(() => (shakeSlots.value = false), 400);
  // tile-fill: 弹回散布
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
    results.push({ question: qLabel(), answer: q.value.answer, userAnswer: null, isCorrect: false, errorCount, timeMs: Date.now() - qStartTime });
    setTimeout(endRound, 900);
    return;
  }
  setTimeout(() => { locking = false; }, 450);
}
function skip() {
  if (locking) return;
  results.push({
    question: qLabel(),
    answer: q.value.answer ?? q.value.correctIndex ?? 0,
    userAnswer: null, isCorrect: false, errorCount, timeMs: Date.now() - qStartTime,
  });
  nextQuestion();
}
function nextQuestion() {
  index.value += 1;
  if (index.value >= roundSize.value) return endRound();
  loadQuestion();
}
async function endRound() {
  try {
    const res = await submitRound(results, { subjectId: subjectId.value, moduleId: moduleId.value, categoryId: category.value, stage: stage.value });
    score.value = res.score;
    auth.setPoints(res.points);
    foodDrops.value = res.foodDrops || [];
    if (passed.value && markCleared(subjectId.value, moduleId.value, category.value, stage.value)) {
      stageAdvanced.value = stage.value;
    }
  } catch (e) {
    hint.value = '提交失败：' + e.message;
  }
  finished.value = true;
}

function restart() {
  index.value = 0; hearts.value = 3; results.length = 0;
  finished.value = false; foodDrops.value = []; stageAdvanced.value = null;
  loadQuestion();
}
function goNextStage() {
  if (!hasNextStage.value) return;
  router.replace({ name: 'quiz', query: { subject: subjectId.value, module: moduleId.value, category: category.value, stage: stage.value + 1 } });
}
watch(() => `${subjectId.value}.${moduleId.value}.${category.value}.${stage.value}`, () => {
  index.value = 0; hearts.value = 3; results.length = 0;
  finished.value = false; foodDrops.value = []; stageAdvanced.value = null;
  loadQuestion();
});

function goHome() { router.push({ name: 'home' }); }
function quit() {
  if (subjectId.value === 'math') {
    router.push({
      name: 'stages',
      query: { subject: subjectId.value, module: moduleId.value, category: category.value },
    });
  } else {
    router.push({ name: 'home' });
  }
}

function clampAll() {
  if (q.value?.mode !== 'tile-fill') return;
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
.progress { color: #9b8b7a; font-weight: 800; white-space: nowrap; font-size: 13px; }

.ctx-tag {
  display: inline-flex; align-items: center; gap: 6px;
  background: #fff; padding: 6px 14px; border-radius: 999px;
  border: 3px solid var(--primary);
  font-weight: 800; font-size: 14px;
}
.ctx-tag .se { font-size: 18px; }
.ctx-tag .stage-id {
  font-size: 12px; color: #fff; background: var(--primary);
  padding: 2px 10px; border-radius: 999px;
}

/* ===== 占位 ===== */
.placeholder-stage { flex: 1; gap: 14px; padding: 40px; }
.ph-emoji { font-size: 80px; }

/* ===== tile-fill ===== */
.stage-area { gap: 18px; padding: 10px 16px 14px; }
.equation {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center;
  font-size: 46px; font-weight: 900; color: var(--ink);
}
.op { color: var(--primary-dark); }
.num {
  background: #fff; padding: 6px 18px; border-radius: 16px;
  box-shadow: 0 5px 0 var(--shadow); min-width: 60px; text-align: center;
}
.expr {
  background: #fff; padding: 6px 20px; border-radius: 16px;
  box-shadow: 0 5px 0 var(--shadow); text-align: center; white-space: nowrap;
}

/* ===== 数位认知布局 ===== */
.place-area { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.place-number {
  font-size: 56px; font-weight: 900; color: var(--primary-dark); letter-spacing: 4px;
  background: #fff; padding: 6px 26px; border-radius: 18px; box-shadow: 0 5px 0 var(--shadow);
}
.place-tip { color: #9b8b7a; font-size: 14px; font-weight: 700; margin: 0; }
.place-slots { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.place-cell { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.place-slot { width: 60px; height: 60px; }
.place-label {
  font-size: 15px; font-weight: 900; color: var(--ink);
  background: #fff3d6; padding: 2px 12px; border-radius: 999px;
}
.slot {
  width: 72px; height: 72px; border-radius: 16px;
  border: 4px dashed #d8c4a0; background: #fffdf6;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.slot.filled { border-style: solid; border-color: transparent; background: transparent; }
.slot.shake { animation: shake 0.4s; }
@keyframes shake { 0%,100%{ transform: translateX(0) } 25%{ transform: translateX(-7px) } 75%{ transform: translateX(7px) } }

.hint { font-size: 18px; font-weight: 800; min-height: 26px; color: #9b8b7a; text-align: center; }
.hint.good { color: var(--green, #54b85a); }
.hint.bad { color: #e85b5b; }
.skip { background: linear-gradient(180deg, #c9b8a3, #a89479); box-shadow: 0 5px 0 #8c7a62; align-self: center; }

.pool-field {
  position: relative; flex: 1; min-height: 380px; margin: 0 6px 10px;
  background: linear-gradient(180deg, #8fd3ff 0%, #bfe9ff 46%, #e7f7ff 64%);
  border-radius: 24px;
  box-shadow: inset 0 4px 10px rgba(80,120,160,0.18);
  overflow: hidden;
}
.scene { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.sun {
  position: absolute; top: 22px; right: 30px; width: 56px; height: 56px; border-radius: 50%;
  background: radial-gradient(circle at 40% 38%, #fff7c2, #ffd84d 70%);
  box-shadow: 0 0 28px 12px rgba(255,221,90,0.55);
}
.cloud { position: absolute; width: 84px; height: 26px; background: #fff; border-radius: 20px; opacity: 0.92; filter: drop-shadow(0 4px 4px rgba(120,150,180,0.18)); }
.cloud::before, .cloud::after { content: ''; position: absolute; background: #fff; border-radius: 50%; }
.cloud::before { width: 38px; height: 38px; top: -16px; left: 12px; }
.cloud::after { width: 50px; height: 50px; top: -24px; left: 36px; }
.c1 { top: 18px; left: -90px; transform: scale(1); animation: drift 46s linear infinite; }
.c2 { top: 70px; left: -90px; transform: scale(0.7); animation: drift 64s linear infinite; animation-delay: -20s; }
.c3 { top: 40px; left: -90px; transform: scale(1.2); animation: drift 80s linear infinite; animation-delay: -50s; }
@keyframes drift { from { left: -110px; } to { left: 110%; } }
.grass { position: absolute; left: 0; right: 0; bottom: 0; height: 26%; background: linear-gradient(180deg, #7ec84e 0%, #56ad38 100%); }
.grass::before { content: ''; position: absolute; top: -10px; left: 0; right: 0; height: 14px; background: radial-gradient(circle at 11px 14px, #7ec84e 11px, transparent 12px) repeat-x; background-size: 22px 14px; }

.tile {
  position: absolute; z-index: 1; touch-action: none; cursor: grab; user-select: none;
  display: flex; align-items: center; justify-content: center;
  will-change: transform, left, top;
}
.tile.used { opacity: 0; pointer-events: none; transform: scale(0.6); }
.tile.walking { animation: waddle 0.62s ease-in-out infinite; }
.tile.grabbed { visibility: hidden; pointer-events: none; }
@keyframes waddle {
  0%   { transform: rotate(-4deg) translateY(0); }
  25%  { transform: rotate(0deg)  translateY(-3px); }
  50%  { transform: rotate(4deg)  translateY(0); }
  75%  { transform: rotate(0deg)  translateY(-3px); }
  100% { transform: rotate(-4deg) translateY(0); }
}

/* ===== multi-step ===== */
.ms-area { flex: 1; padding: 14px 18px; gap: 12px; overflow-y: auto; }
.ms-title { text-align: center; }
.ms-q { font-size: 30px; font-weight: 900; color: var(--ink); }
.ms-ans { color: var(--primary); }
.ms-tip { display: block; color: #9b8b7a; font-size: 13px; margin-top: 4px; }

.ms-steps {
  display: flex; flex-direction: column; gap: 8px;
  background: #fffdf6; border-radius: 18px; padding: 14px 18px;
  border: 2px solid #f0e6d8; box-shadow: inset 0 0 0 1px #fff;
  max-width: 580px; width: 100%; align-self: center;
}
.ms-step { display: flex; gap: 10px; align-items: flex-start; transition: all 0.2s; }
.ms-step.pending { opacity: 0.35; }
.ms-step.done { opacity: 0.85; }
.ms-step.current { background: #fff8e8; padding: 8px 12px; border-radius: 12px; margin: -4px -4px; }
.ms-idx {
  width: 24px; height: 24px; border-radius: 50%; background: #ddd0b0; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900;
  flex-shrink: 0; margin-top: 4px;
}
.ms-step.current .ms-idx { background: var(--primary); }
.ms-step.done .ms-idx { background: var(--green, #54b85a); }
.ms-row { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.ms-hint { font-size: 12px; color: #9b8b7a; font-weight: 700; }
.ms-eq { font-size: 22px; font-weight: 900; color: var(--ink); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ms-eq b { color: var(--primary-dark); }
.ms-final { color: var(--green, #54b85a); }
.ms-final b { color: var(--green, #54b85a); }
.ms-blank {
  min-width: 50px; padding: 4px 10px; border-radius: 10px;
  background: #fff; border: 3px dashed #d8c4a0; text-align: center;
  color: #b9a892; font-size: 22px;
}
.ms-blank.filled { background: #fff3d6; color: var(--primary-dark); border-style: solid; border-color: transparent; }
.ms-blank.active { border-color: var(--primary); background: #fffdf6; color: var(--primary); animation: pulse 1s ease infinite; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(240, 169, 58, 0.5); } 50% { box-shadow: 0 0 0 6px rgba(240, 169, 58, 0); } }

.numpad {
  display: flex; flex-direction: column; gap: 6px; align-self: center;
  background: #fff; padding: 10px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.np-row { display: flex; gap: 6px; }
.np-key {
  width: 52px; height: 44px; font-size: 20px; font-weight: 900;
  background: #fff8e8; color: var(--ink); border-radius: 10px;
  cursor: pointer; font-family: inherit;
  box-shadow: 0 3px 0 #eadfc7; transition: all 0.05s;
}
.np-key:hover:not(:disabled) { background: #fff3d6; }
.np-key:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 1px 0 #eadfc7; }
.np-key:disabled { opacity: 0.4; cursor: not-allowed; }
.np-key.np-fn { background: #f0e6d8; color: #9b8b7a; }
.np-key.np-ok { width: 100px; background: var(--primary); color: #fff; box-shadow: 0 3px 0 var(--primary-dark); }

/* ===== choice ===== */
.cz-area { flex: 1; padding: 30px 20px; gap: 24px; }
.cz-prompt {
  background: #fff; border-radius: 24px; padding: 30px 50px;
  box-shadow: 0 6px 0 var(--shadow);
  font-weight: 900; color: var(--primary-dark);
}
.cz-prompt.pk-emoji { font-size: 120px; line-height: 1; }
.cz-prompt.pk-letter { font-size: 120px; line-height: 1; font-family: "Comic Sans MS", "Marker Felt", cursive; }
.cz-sub { color: #9b8b7a; font-size: 16px; font-weight: 800; }
.cz-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 480px; width: 100%; }
.cz-opt {
  background: #fff; color: var(--ink); padding: 22px;
  font-size: 36px; font-weight: 900; font-family: inherit;
  border-radius: 18px; box-shadow: 0 5px 0 var(--shadow);
  cursor: pointer; transition: all 0.15s;
}
.cz-opt:hover:not(:disabled) { transform: translateY(-2px); background: #fff8e8; }
.cz-opt.chosen { background: #fff3d6; }
.cz-opt.correct { background: linear-gradient(180deg, #a8e6b1, #54b85a); color: #fff; box-shadow: 0 5px 0 #2f8a3f; }
.cz-opt.wrong { background: linear-gradient(180deg, #ffb8b8, #e85b5b); color: #fff; box-shadow: 0 5px 0 #b03030; }
.cz-opt:disabled { cursor: default; }

/* ===== 结算（同前） ===== */
.overlay { position: fixed; inset: 0; background: rgba(60,40,20,0.45); z-index: 50; }
.result { padding: 36px 40px; gap: 10px; width: 340px; }
.result-emoji { font-size: 72px; }
.result h2 { color: var(--primary-dark); }
.big { font-size: 32px; font-weight: 900; color: var(--primary); }
.small { color: #9b8b7a; }
.result-btns { display: flex; gap: 14px; margin-top: 14px; }
.drops { width: 100%; margin-top: 6px; background: #fff7e8; border-radius: 16px; padding: 10px 12px 12px; box-shadow: inset 0 0 0 2px #f2dfbd; }
.drops-title { font-weight: 900; color: var(--primary-dark); font-size: 14px; margin-bottom: 6px; }
.drops-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.drop-item { gap: 2px; min-width: 60px; }
.drop-name { font-size: 12px; color: #6f5a45; font-weight: 800; }
.drop-qty { font-size: 13px; color: var(--primary-dark); font-weight: 900; }
.adv { font-weight: 900; color: #9b5cd6; font-size: 14px; background: #f3e6ff; padding: 6px 12px; border-radius: 999px; text-align: center; }
.pop-enter-active { transition: all 0.3s cubic-bezier(.34,1.56,.64,1); }
.pop-enter-from { opacity: 0; transform: scale(0.8); }
</style>

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
