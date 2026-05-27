<template>
  <div class="hub col">
    <!-- 顶栏 -->
    <div class="topbar">
      <button class="back" @click="router.push({ name: 'home' })">‹ 首页</button>
      <div class="hub-title">➗ 除法启蒙馆</div>
      <span class="coin-pill">🪙 {{ auth.points }}</span>
    </div>

    <!-- 主体：4 个入口 -->
    <div class="body">
      <p class="lead">用<b>分一分</b>的方式，把除法学得明明白白</p>

      <div class="entries">
        <button class="entry" @click="goLearn">
          <div class="e-emoji">📖</div>
          <div class="e-name">学一学</div>
          <div class="e-desc">5 步看懂"除法到底是怎么回事"</div>
        </button>

        <button class="entry" @click="active = 'practice'">
          <div class="e-emoji">✋</div>
          <div class="e-name">试一试</div>
          <div class="e-desc">自由练分配，多种场景轮流来</div>
        </button>

        <button class="entry" @click="active = 'match'">
          <div class="e-emoji">🔗</div>
          <div class="e-name">连一连</div>
          <div class="e-desc">把场景图配到对应的算式</div>
        </button>

        <button class="entry" @click="active = 'flip'">
          <div class="e-emoji">🎴</div>
          <div class="e-name">翻翻乐</div>
          <div class="e-desc">乘法翻一翻就是除法</div>
        </button>
      </div>

      <div class="hint">
        <span>💡 第一次来的话，建议先从 <b>学一学</b> 开始</span>
      </div>
    </div>

    <!-- 沉浸式子模块全屏层 -->
    <Teleport to="body">
      <div v-if="active" class="practice-fullscreen">
        <button class="practice-close" @click="active = null" aria-label="关闭练习">✕</button>

        <!-- 试一试：拖拽分配，分对 → 下一题 -->
        <div v-if="active === 'practice'" class="practice-wrap col">
          <div class="practice-head">
            <span class="ph-score">🏆 完成 {{ practiceDone }}</span>
            <span class="ph-title">✋ 试一试 · {{ practiceScenario.theme.opening(practiceScenario.dividend, practiceScenario.divisor) }}</span>
            <button class="ph-next" @click="nextPractice">换一题 ↻</button>
          </div>
          <DivideDragScene
            :key="practiceKey"
            :dividend="practiceScenario.dividend"
            :divisor="practiceScenario.divisor"
            :theme="practiceScenario.theme"
            @complete="onPracticeDone"
          />
        </div>

        <!-- 连一连 -->
        <div v-else-if="active === 'match'" class="match-wrap col">
          <DivisionMatchScene />
        </div>

        <!-- 翻翻乐：循环 6 道 -->
        <div v-else-if="active === 'flip'" class="flip-wrap col">
          <div class="flip-head">
            <span class="fh-score">🏆 答对 {{ flipDone }} / {{ flipFacts.length }}</span>
            <span class="fh-title">🎴 翻翻乐 · 乘除互逆</span>
            <button class="fh-restart" @click="restartFlip" :disabled="flipDone === 0">🔄 重来</button>
          </div>
          <MulDivFlipScene
            :key="flipIdx"
            :fact="currentFact"
            :cta-label="flipIdx + 1 === flipFacts.length ? '完成 🎉' : '下一题 →'"
            @next="nextFlip"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import DivideDragScene from '../components/division/DivideDragScene.vue';
import DivisionMatchScene from '../components/division/DivisionMatchScene.vue';
import MulDivFlipScene from '../components/division/MulDivFlipScene.vue';
import { pickScenario, genFlipFacts } from '../lib/divisionScenarios.js';

const router = useRouter();
const auth = useAuthStore();

const active = ref(null);   // null | 'practice' | 'match' | 'flip'

// ============ 试一试 ============
const practiceScenario = ref(pickScenario({ difficulty: 'easy' }));
const practiceKey = ref(0);
const practiceDone = ref(0);

function nextPractice() {
  // 通关数 < 3 用 easy，3-7 用 medium，>=8 用 hard
  const difficulty = practiceDone.value < 3 ? 'easy'
                   : practiceDone.value < 8 ? 'medium' : 'hard';
  practiceScenario.value = pickScenario({ difficulty });
  practiceKey.value += 1;
}
function onPracticeDone() {
  practiceDone.value += 1;
  setTimeout(nextPractice, 1400);
}

// ============ 翻翻乐 ============
const flipFacts = ref(genFlipFacts(6));
const flipIdx = ref(0);
const flipDone = ref(0);
const currentFact = computed(() => flipFacts.value[flipIdx.value]);

function nextFlip() {
  flipDone.value += 1;
  if (flipIdx.value + 1 < flipFacts.value.length) {
    flipIdx.value += 1;
  } else {
    // 完成一组 → 重新生成
    flipFacts.value = genFlipFacts(6);
    flipIdx.value = 0;
    flipDone.value = 0;
  }
}
function restartFlip() {
  flipFacts.value = genFlipFacts(6);
  flipIdx.value = 0;
  flipDone.value = 0;
}

// ============ 学一学 ============
function goLearn() {
  router.push({ name: 'division-intro' });
}
</script>

<style scoped>
.hub {
  flex: 1; min-height: 0;
  background: linear-gradient(180deg, #fffaf0 0%, #fff5e0 100%);
}

.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; background: #fffdf6;
  border-bottom: 2px solid #f0e6d8;
}
.back {
  background: #fff; color: #3a2e2e;
  padding: 6px 14px; font-family: inherit; font-weight: 800;
  border: 2px solid #e0d8cc; border-radius: 12px;
  box-shadow: 0 3px 0 var(--shadow, rgba(120, 80, 40, 0.18));
  cursor: pointer; font-size: 13px;
}
.hub-title { font-size: 18px; font-weight: 900; color: #ff8e3c; }
.coin-pill {
  font-weight: 900; font-size: 13px;
  background: #fff3d6; color: #b67517;
  padding: 4px 12px; border-radius: 999px;
}

.body {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 24px 24px 36px;
  display: flex; flex-direction: column;
  align-items: center;
  gap: 24px;
}
.lead {
  margin: 0; font-size: 16px; color: #9b8b7a; font-weight: 700;
  text-align: center;
}
.lead b { color: #ff8e3c; font-size: 18px; }

.entries {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  width: 100%; max-width: 900px;
}
.entry {
  background: #fffdf6;
  border: 3px solid #f0d999;
  border-radius: 20px;
  padding: 28px 18px;
  font-family: inherit; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  box-shadow: 0 5px 0 var(--shadow, rgba(120, 80, 40, 0.18));
  transition: transform 0.12s, border-color 0.12s;
  text-align: center;
}
.entry:hover {
  transform: translateY(-4px);
  border-color: #ff8e3c;
}
.e-emoji { font-size: 48px; }
.e-name { font-size: 18px; font-weight: 900; color: #3a2e2e; margin-top: 4px; }
.e-desc { font-size: 13px; color: #9b8b7a; font-weight: 700; }

.hint {
  background: #fff3d6;
  border: 2px solid #f0c878;
  border-radius: 14px;
  padding: 10px 18px;
  font-size: 13px; font-weight: 700; color: #b67517;
  max-width: 520px; text-align: center;
}
.hint b { color: #ff8e3c; }

/* 沉浸式全屏子模块 */
.practice-fullscreen {
  position: fixed; inset: 0; z-index: 1000;
  background: #fffdf6;
  display: flex; flex-direction: column;
  padding:
    max(14px, env(safe-area-inset-top))
    max(14px, env(safe-area-inset-right))
    max(14px, env(safe-area-inset-bottom))
    max(14px, env(safe-area-inset-left));
}
.practice-close {
  position: absolute;
  top: max(14px, env(safe-area-inset-top));
  right: max(14px, env(safe-area-inset-right));
  z-index: 10;
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(0, 0, 0, 0.5); color: #fff;
  border: none; font-size: 20px; font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, transform 0.15s;
}
.practice-close:hover { background: rgba(0, 0, 0, 0.72); transform: scale(1.05); }

.practice-wrap, .match-wrap, .flip-wrap {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  gap: 10px;
}

/* 试一试头部 */
.practice-head, .flip-head {
  display: flex; align-items: center; justify-content: space-between;
  background: #fffdf6;
  border: 2px solid #f0e6d8; border-radius: 14px;
  padding: 8px 14px;
  padding-right: 60px; /* 给悬浮 ✕ 让位 */
  gap: 12px;
}
.ph-title, .fh-title {
  flex: 1; font-weight: 800; color: #3a2e2e;
  font-size: 13px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ph-score, .fh-score {
  font-weight: 900; font-size: 13px;
  background: #f5f0ff; color: #9b5cd6;
  padding: 4px 12px; border-radius: 999px;
  white-space: nowrap;
}
.ph-next, .fh-restart {
  background: #fff; color: #54b85a;
  border: 2px solid #c0e8cc; border-radius: 999px;
  padding: 4px 12px; font-family: inherit; font-weight: 800; font-size: 12px;
  cursor: pointer; white-space: nowrap;
}
.ph-next:hover, .fh-restart:hover:not(:disabled) { background: #f0fff4; }
.fh-restart:disabled { opacity: 0.4; cursor: default; }
</style>
