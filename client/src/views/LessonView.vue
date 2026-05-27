<template>
  <div class="lesson col">
    <!-- 顶栏 -->
    <div class="topbar">
      <button class="back" @click="goBack">‹ 返回</button>
      <div class="ctx-tag">
        <span class="se">📖</span>
        <b>{{ info?.title || '教学卡' }}</b>
      </div>
      <span class="phase-pill">{{ phaseLabel }}</span>
    </div>

    <div v-if="!info" class="placeholder-stage center col">
      <div class="ph-emoji">🚧</div>
      <h2>该技巧敬请期待</h2>
      <button class="btn-primary" @click="goBack">返回</button>
    </div>

    <!-- 跳板型 trick：onMounted 已 router.replace；这里只作为过渡时的占位 -->
    <div v-else-if="info.redirectRoute" class="placeholder-stage center col">
      <div class="ph-emoji">⏳</div>
      <h2>正在进入…</h2>
    </div>

    <div v-else class="body">
      <!-- 讲解语 -->
      <p class="intro">{{ info.intro }}</p>

      <!-- 大算式 -->
      <div class="head-eq">
        <span class="num minuend">{{ cur.a }}</span>
        <span class="op">{{ cur.op }}</span>
        <span class="num">{{ cur.b }}</span>
        <span class="op">=</span>
        <span class="num ans" :class="{ revealed: answerShown }">{{ answerShown ? cur.answer : '?' }}</span>

        <!-- 蹦跳的「1」（仅减1法演示用） -->
        <Transition name="hop-pop">
          <div v-if="showHopOne" class="hop-one" :class="{ returned: hopReturned }">
            <NumberBlock :digit="1" :size="56" />
            <span class="hop-label">{{ hopReturned ? '我回来啦！' : '借走的 1' }}</span>
          </div>
        </Transition>
      </div>

      <!-- ===== 演示段 ===== -->
      <template v-if="phase === 'demo'">
        <div class="steps">
          <div v-for="(st, i) in cur.steps" :key="i"
            class="step" :class="{ shown: i <= revealed, active: i === revealed }"
          >
            <span class="s-idx">{{ i + 1 }}</span>
            <div class="s-body">
              <!-- 减1法专属 -->
              <template v-if="st.kind === 'borrow-out'">
                <p class="s-hint">{{ st.hint }}</p>
                <p class="s-eq"><b>{{ st.from }}</b> <span class="arrow">➡️</span> <b class="hl">{{ st.to }}</b></p>
              </template>
              <template v-else-if="st.kind === 'column-sub'">
                <p class="s-hint">{{ st.hint }}</p>
                <div class="vcalc">
                  <div class="vrow"><span class="vop"></span><span class="vnum">{{ st.a }}</span></div>
                  <div class="vrow"><span class="vop">−</span><span class="vnum">{{ st.b }}</span></div>
                  <div class="vline"></div>
                  <div class="vrow"><span class="vop"></span><span class="vnum res">{{ st.answer }}</span></div>
                </div>
              </template>
              <template v-else-if="st.kind === 'add-back'">
                <p class="s-hint">{{ st.hint }}</p>
                <p class="s-eq"><b>{{ st.a }}</b> + <b class="hl">{{ st.b }}</b> = <b class="final">{{ st.answer }}</b></p>
              </template>
              <!-- 凑十法等通用步骤 -->
              <template v-else-if="st.kind === 'split'">
                <p class="s-hint">{{ st.hint }}</p>
                <p class="s-eq"><b>{{ st.target }}</b> = {{ st.parts[0] }} + {{ st.parts[1] }}</p>
              </template>
              <template v-else-if="st.kind === 'calc' || st.kind === 'direct'">
                <p class="s-hint" v-if="st.hint">{{ st.hint }}</p>
                <p class="s-eq">{{ st.a }} {{ st.op }} {{ st.b }} = <b class="hl">{{ st.answer }}</b></p>
              </template>
              <template v-else-if="st.kind === 'done'">
                <p class="s-eq final">✨ {{ st.a }} {{ st.op }} {{ st.b }} = <b>{{ st.answer }}</b></p>
              </template>
            </div>
          </div>
        </div>

        <button v-if="revealed < cur.steps.length - 1" class="btn-primary wide" @click="nextStep">下一步 →</button>
        <button v-else class="btn-primary wide" @click="startSelf">我学会啦，换我试试 →</button>
      </template>

      <!-- ===== 练习段（自测一题） ===== -->
      <template v-else>
        <p class="self-tip">用刚学的方法，自己算出答案吧！</p>
        <div class="self-input">
          <span class="self-blank" :class="{ filled: draft !== '' }">{{ draft === '' ? '?' : draft }}</span>
        </div>
        <p class="hint" :class="hintType">{{ hint }}</p>

        <div class="numpad" v-if="!solved">
          <div class="np-row" v-for="(row, ri) in numpadRows" :key="ri">
            <button v-for="kk in row" :key="kk.key" class="np-key" :class="kk.class" @click="onPad(kk.key)">{{ kk.label }}</button>
          </div>
        </div>

        <div v-if="solved" class="done-box col center">
          <div class="done-emoji">🎉</div>
          <p class="done-text">太棒了，这个技巧你掌握啦！</p>
          <div class="done-btns">
            <button class="btn-accent" @click="goBack">返回课本</button>
            <button class="btn-primary" @click="againSelf">再来一道</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import NumberBlock from '../components/NumberBlock.vue';
import { lessonInfo, genTrickQuiz } from '../composables/useQuizGen.js';

const router = useRouter();
const route = useRoute();

const trickId = computed(() => String(route.query.trick || ''));
const info = computed(() => lessonInfo(trickId.value));

// 跳板型 trick：onMounted 时透明重定向到自定义视图，保留 query。
// 这让课本单元只需配 { trickId: 'division-intro' } 就能挂上完全自定义的页面。
onMounted(() => {
  const meta = info.value;
  if (meta?.redirectRoute) {
    const target = meta.redirectRoute;
    const { trick, ...rest } = route.query;
    router.replace({ ...target, query: { ...(target.query || {}), ...rest } });
  }
});

const phase = ref('demo'); // 'demo' | 'self'
const revealed = ref(0);
const selfQuiz = ref(null);
const draft = ref('');
const solved = ref(false);
const hint = ref('');
const hintType = ref('');

const cur = computed(() => (phase.value === 'demo' ? info.value.demo : selfQuiz.value));

const phaseLabel = computed(() => (phase.value === 'demo' ? '看演示' : '自己试'));

// 答案是否已展示（演示段：走到 done 步；练习段：解出后）
const answerShown = computed(() =>
  phase.value === 'demo' ? revealed.value >= cur.value.steps.length - 1 : solved.value
);

// 蹦跳的「1」：仅减1法，borrow-out 揭示后出现
const isBorrow = computed(() => trickId.value === 'borrow-trick');
const showHopOne = computed(() => isBorrow.value && phase.value === 'demo' && revealed.value >= 0);
const hopReturned = computed(() => {
  if (!isBorrow.value || phase.value !== 'demo') return false;
  const addBackIdx = cur.value.steps.findIndex(s => s.kind === 'add-back');
  return addBackIdx >= 0 && revealed.value >= addBackIdx;
});

function nextStep() {
  if (revealed.value < cur.value.steps.length - 1) revealed.value += 1;
}
function startSelf() {
  phase.value = 'self';
  selfQuiz.value = genTrickQuiz(trickId.value);
  draft.value = '';
  solved.value = false;
  hint.value = '';
  hintType.value = '';
}
function againSelf() { startSelf(); }

const numpadRows = computed(() => ([
  [{ key: '1', label: '1' }, { key: '2', label: '2' }, { key: '3', label: '3' }],
  [{ key: '4', label: '4' }, { key: '5', label: '5' }, { key: '6', label: '6' }],
  [{ key: '7', label: '7' }, { key: '8', label: '8' }, { key: '9', label: '9' }],
  [{ key: 'back', label: '⌫', class: 'np-fn' }, { key: '0', label: '0' }, { key: 'ok', label: '✓ 确定', class: 'np-ok' }],
]));

function onPad(key) {
  if (solved.value) return;
  if (key === 'back') { draft.value = draft.value.slice(0, -1); return; }
  if (key === 'ok') return submit();
  if (draft.value.length >= 7) return;
  draft.value += key;
}
function submit() {
  if (draft.value === '') { hint.value = '请输入答案～'; hintType.value = 'bad'; return; }
  if (Number(draft.value) === selfQuiz.value.answer) {
    solved.value = true;
    hint.value = '答对啦！🎉';
    hintType.value = 'good';
  } else {
    hint.value = '再想想，用借1的方法试试～';
    hintType.value = 'bad';
    draft.value = '';
  }
}

function goBack() {
  const { subject, grade, volume, unit } = route.query;
  if (subject && grade) {
    router.push({ name: 'textbook', query: { subject, grade, volume, unit } });
  } else {
    router.push({ name: 'textbook' });
  }
}
</script>

<style scoped>
.lesson { flex: 1; min-height: 0; }
.back { background: #fff; color: var(--ink); padding: 8px 16px; box-shadow: 0 3px 0 var(--shadow); }
.ctx-tag {
  display: inline-flex; align-items: center; gap: 6px;
  background: #fff; padding: 6px 14px; border-radius: 999px;
  border: 3px solid #9b5cd6; font-weight: 800; font-size: 14px;
}
.ctx-tag .se { font-size: 18px; }
.phase-pill {
  background: #f3e6ff; color: #9b5cd6; font-weight: 900; font-size: 13px;
  padding: 6px 14px; border-radius: 999px;
}

.placeholder-stage { flex: 1; gap: 14px; padding: 40px; }
.ph-emoji { font-size: 80px; }

.body { flex: 1; overflow-y: auto; padding: 12px 20px 28px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.intro {
  max-width: 600px; text-align: center; color: #6f5a45; font-size: 15px; font-weight: 700;
  background: #fffdf6; border-radius: 14px; padding: 12px 18px; box-shadow: inset 0 0 0 2px #f0e6d8;
}

/* 大算式 */
.head-eq {
  position: relative; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center;
  font-size: 40px; font-weight: 900; color: var(--ink); padding: 6px 0;
}
.num { background: #fff; padding: 6px 18px; border-radius: 14px; box-shadow: 0 4px 0 var(--shadow); }
.op { color: var(--primary-dark); }
.ans { color: #b9a892; }
.ans.revealed { color: var(--green, #54b85a); animation: pop 0.4s cubic-bezier(.34,1.56,.64,1); }
@keyframes pop { 0% { transform: scale(0.6); } 100% { transform: scale(1); } }

/* 蹦跳的 1 */
.hop-one {
  position: absolute; right: -30px; top: -42px;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  animation: hop 0.6s ease-in-out infinite;
}
.hop-one.returned { animation: hop-back 0.5s ease forwards; }
.hop-label { font-size: 11px; font-weight: 900; color: #9b5cd6; white-space: nowrap; }
@keyframes hop { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-12px) rotate(4deg); } }
@keyframes hop-back { 0% { transform: translateY(0); } 50% { transform: translateY(-20px) scale(1.1); } 100% { transform: translateY(0) scale(0.9); opacity: 0.7; } }
.hop-pop-enter-active { transition: all 0.3s cubic-bezier(.34,1.56,.64,1); }
.hop-pop-enter-from { opacity: 0; transform: scale(0.4) translateY(10px); }

/* 步骤 */
.steps {
  display: flex; flex-direction: column; gap: 10px;
  background: #fffdf6; border-radius: 18px; padding: 16px 20px;
  border: 2px solid #f0e6d8; max-width: 560px; width: 100%;
}
.step { display: flex; gap: 12px; align-items: flex-start; opacity: 0.28; transition: opacity 0.3s; }
.step.shown { opacity: 1; }
.step.active { background: #f9f0ff; padding: 8px 12px; border-radius: 12px; margin: -4px; }
.s-idx {
  width: 26px; height: 26px; border-radius: 50%; background: #d9c4f0; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; flex-shrink: 0; margin-top: 2px;
}
.step.shown .s-idx { background: #9b5cd6; }
.s-body { flex: 1; }
.s-hint { font-size: 13px; color: #9b8b7a; font-weight: 700; margin-bottom: 4px; }
.s-eq { font-size: 22px; font-weight: 900; color: var(--ink); }
.s-eq .hl { color: #9b5cd6; }
.s-eq .final { color: var(--green, #54b85a); }
.s-eq.final { color: var(--green, #54b85a); }
.arrow { margin: 0 4px; }

/* 竖式 */
.vcalc { display: inline-flex; flex-direction: column; align-items: flex-end; font-variant-numeric: tabular-nums; margin-top: 4px; }
.vrow { display: flex; align-items: center; gap: 10px; }
.vop { width: 20px; text-align: center; font-size: 24px; font-weight: 900; color: var(--primary-dark); }
.vnum { font-size: 30px; font-weight: 900; letter-spacing: 6px; color: var(--ink); }
.vnum.res { color: var(--green, #54b85a); }
.vline { height: 3px; background: var(--ink); width: 100%; margin: 4px 0; border-radius: 2px; }

.wide { padding: 14px 36px; font-size: 18px; color: #fff; background: linear-gradient(180deg, #b277e0, #9b5cd6); box-shadow: 0 6px 0 #7a3ec0; }

/* 练习段 */
.self-tip { color: #6f5a45; font-weight: 800; }
.self-input { }
.self-blank {
  display: inline-block; min-width: 120px; padding: 12px 24px; font-size: 36px; font-weight: 900; text-align: center;
  background: #fff; border: 4px dashed #d9c4f0; border-radius: 16px; color: #b9a892;
}
.self-blank.filled { border-style: solid; border-color: transparent; background: #f3e6ff; color: #9b5cd6; }
.hint { font-size: 17px; font-weight: 800; min-height: 24px; color: #9b8b7a; }
.hint.good { color: var(--green, #54b85a); }
.hint.bad { color: #e85b5b; }

.numpad { display: flex; flex-direction: column; gap: 6px; background: #fff; padding: 10px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.np-row { display: flex; gap: 6px; }
.np-key { width: 56px; height: 46px; font-size: 20px; font-weight: 900; background: #f9f0ff; color: var(--ink); border-radius: 10px; cursor: pointer; font-family: inherit; box-shadow: 0 3px 0 #e3d2f0; }
.np-key:active { transform: translateY(2px); box-shadow: 0 1px 0 #e3d2f0; }
.np-key.np-fn { background: #f0e6d8; color: #9b8b7a; }
.np-key.np-ok { width: 104px; background: #9b5cd6; color: #fff; box-shadow: 0 3px 0 #7a3ec0; }

.done-box { gap: 8px; }
.done-emoji { font-size: 60px; }
.done-text { font-weight: 900; color: #9b5cd6; }
.done-btns { display: flex; gap: 12px; margin-top: 6px; }
</style>
