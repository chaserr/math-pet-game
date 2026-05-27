<template>
  <div class="intro col">
    <!-- 顶栏 -->
    <div class="topbar">
      <button class="back" @click="goBack">‹ 返回</button>
      <div class="title">🥕 除法启蒙：分一分</div>
      <div class="progress">
        <span v-for="(s, i) in STEPS" :key="i"
          class="dot"
          :class="{ on: i === step, done: i < step }"
        ></span>
        <span class="step-text">{{ step + 1 }} / {{ STEPS.length }}</span>
      </div>
    </div>

    <!-- 当前步骤标题（导航提示） -->
    <div class="step-head">
      <span class="step-emoji">{{ STEPS[step].emoji }}</span>
      <span class="step-name">{{ STEPS[step].name }}</span>
    </div>

    <!-- 内容区：按 step 切换 -->
    <div class="stage">
      <DivisionStoryScene v-if="step === 0"
        :dividend="scenario.dividend" :divisor="scenario.divisor" :theme="scenario.theme"
        @next="next"
      />

      <div v-else-if="step === 1" class="drag-step col">
        <DivideDragScene
          :dividend="scenario.dividend" :divisor="scenario.divisor" :theme="scenario.theme"
          @complete="onDragComplete"
        />
      </div>

      <DivideCountScene v-else-if="step === 2"
        :dividend="scenario.dividend" :divisor="scenario.divisor" :theme="scenario.theme"
        @next="next"
      />

      <DivisionFormulaScene v-else-if="step === 3"
        :dividend="scenario.dividend" :divisor="scenario.divisor" :theme="scenario.theme"
        @next="next"
      />

      <MulDivFlipScene v-else-if="step === 4"
        :fact="flipFact"
        cta-label="去练几道 →"
        @next="finish"
      />
    </div>

    <!-- 底部：上一步按钮（拖一拖步骤的"完成"由组件自身控制；其他步骤可手动跳过） -->
    <div class="footer">
      <button class="back-step" :disabled="step === 0" @click="prev">‹ 上一步</button>
      <button v-if="canSkip" class="skip" @click="next">跳过 ⤜</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import DivisionStoryScene from '../components/division/DivisionStoryScene.vue';
import DivideDragScene from '../components/division/DivideDragScene.vue';
import DivideCountScene from '../components/division/DivideCountScene.vue';
import DivisionFormulaScene from '../components/division/DivisionFormulaScene.vue';
import MulDivFlipScene from '../components/division/MulDivFlipScene.vue';
import { MAIN_SCENARIO } from '../lib/divisionScenarios.js';

const router = useRouter();

const STEPS = [
  { id: 'story',   emoji: '📖', name: '故事：兔妈妈来分胡萝卜' },
  { id: 'drag',    emoji: '✋', name: '拖一拖：你来分分看' },
  { id: 'count',   emoji: '🔢', name: '数一数：每份几个？' },
  { id: 'formula', emoji: '✏️', name: '列算式：写成除法' },
  { id: 'flip',    emoji: '🎴', name: '翻翻乐：乘法变除法' },
];

const step = ref(0);
const scenario = ref({ ...MAIN_SCENARIO });

// 步骤 5：翻翻乐用主线对应的乘法事实（3×4=12）
const flipFact = computed(() => ({
  a: scenario.value.divisor,
  b: scenario.value.dividend / scenario.value.divisor,
  product: scenario.value.dividend,
}));

// 拖一拖步骤完成后自动进入下一步；其他步骤靠组件内部 emit('next')
const canSkip = computed(() => STEPS[step.value].id === 'drag');

function next() {
  if (step.value < STEPS.length - 1) step.value += 1;
  else finish();
}
function prev() {
  if (step.value > 0) step.value -= 1;
}

function onDragComplete() {
  // 给孩子留 1.4 秒看一眼"分完啦"的篮子，再进入下一步
  setTimeout(() => next(), 1400);
}

function finish() {
  // 完成 → 跳到除法练习的入门关
  router.replace({
    name: 'quiz',
    query: { subject: 'math', module: 'div', stage: 1, from: 'intro' },
  });
}

function goBack() {
  router.back();
}
</script>

<style scoped>
.intro {
  flex: 1; min-height: 0;
  background: linear-gradient(180deg, #fffaf0 0%, #fff5e0 100%);
}

.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; background: #fffdf6;
  border-bottom: 2px solid #f0e6d8;
  flex-shrink: 0;
}
.back {
  background: #fff; color: #3a2e2e;
  padding: 6px 14px; font-family: inherit; font-weight: 800;
  border: 2px solid #e0d8cc; border-radius: 12px;
  box-shadow: 0 3px 0 var(--shadow, rgba(120, 80, 40, 0.18));
  cursor: pointer; font-size: 13px;
}
.title { font-size: 17px; font-weight: 900; color: #ff8e3c; }
.progress {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 800; color: #9b8b7a;
}
.dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #e0d8cc;
  transition: background 0.2s, transform 0.2s;
}
.dot.on   { background: #ff8e3c; transform: scale(1.4); }
.dot.done { background: #54b85a; }
.step-text { margin-left: 4px; }

.step-head {
  display: flex; align-items: center; justify-content: center;
  gap: 10px;
  padding: 10px 18px;
  background: #fff5e6;
  border-bottom: 2px solid #f0d999;
  flex-shrink: 0;
}
.step-emoji { font-size: 22px; }
.step-name { font-size: 15px; font-weight: 800; color: #b67517; }

.stage {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  padding: 14px 18px;
  overflow-y: auto;
}
.drag-step {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
}

.footer {
  display: flex; justify-content: space-between;
  padding: 10px 18px;
  background: #fffdf6;
  border-top: 2px solid #f0e6d8;
  flex-shrink: 0;
}
.back-step, .skip {
  background: #fff; color: #9b8b7a;
  padding: 6px 14px; font-family: inherit; font-weight: 800;
  border: 2px solid #e0d8cc; border-radius: 12px;
  cursor: pointer; font-size: 13px;
}
.back-step:hover:not(:disabled), .skip:hover {
  background: #fff5e6; border-color: #ff8e3c; color: #ff8e3c;
}
.back-step:disabled { opacity: 0.4; cursor: default; }
</style>
