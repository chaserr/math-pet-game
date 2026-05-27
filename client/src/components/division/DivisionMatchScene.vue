<template>
  <div class="match col">
    <div class="head">
      <h3 class="title">🔗 连一连：图配算式</h3>
      <div class="meta">
        <span class="score">配对 {{ doneCount }} / {{ pairs.length }}</span>
        <button v-if="doneCount === pairs.length" class="restart" @click="restart">🔄 再来一组</button>
      </div>
    </div>

    <div v-if="doneCount === pairs.length" class="celebrate">
      <div class="c-emoji">🎉</div>
      <p>全部连对了！</p>
    </div>

    <!-- 场景图卡片 -->
    <div class="row">
      <div v-for="card in sceneCards" :key="card.key"
        class="scene-card"
        :class="{ on: selectedScene === card.key, done: card.matched, wrong: card.wrong }"
        :style="{ borderColor: card.matched ? '#54b85a' : (selectedScene === card.key ? '#ff8e3c' : '#e0d8cc') }"
        @click="pickScene(card)"
      >
        <div class="items">
          <span v-for="i in card.dividend" :key="i" class="i">{{ card.itemEmoji }}</span>
        </div>
        <div class="arrow">分给 {{ card.divisor }} 份</div>
        <div class="baskets-mini">
          <span v-for="k in card.divisor" :key="k" class="b-mini"
            :style="{ background: BASKET_COLORS[(k - 1) % BASKET_COLORS.length] + '33',
                      borderColor: BASKET_COLORS[(k - 1) % BASKET_COLORS.length] }"
          >🧺</span>
        </div>
      </div>
    </div>

    <!-- 算式卡片 -->
    <div class="row">
      <div v-for="card in formulaCards" :key="card.key"
        class="formula-card"
        :class="{ on: selectedFormula === card.key, done: card.matched, wrong: card.wrong }"
        :style="{ borderColor: card.matched ? '#54b85a' : (selectedFormula === card.key ? '#ff8e3c' : '#e0d8cc') }"
        @click="pickFormula(card)"
      >
        <span class="f-num">{{ card.dividend }}</span>
        <span class="f-op">÷</span>
        <span class="f-num">{{ card.divisor }}</span>
        <span class="f-op">=</span>
        <span class="f-num q">{{ card.quotient }}</span>
      </div>
    </div>

    <p class="tip">点一下上面的场景，再点对应的算式</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { THEMES, BASKET_COLORS } from '../../lib/divisionScenarios.js';

const ROUND_SIZE = 4;

// 候选题目池
const POOL = [
  { dividend: 6,  divisor: 2 }, { dividend: 6,  divisor: 3 },
  { dividend: 8,  divisor: 2 }, { dividend: 8,  divisor: 4 },
  { dividend: 9,  divisor: 3 }, { dividend: 10, divisor: 2 },
  { dividend: 12, divisor: 3 }, { dividend: 12, divisor: 4 },
  { dividend: 15, divisor: 3 }, { dividend: 15, divisor: 5 },
  { dividend: 16, divisor: 4 }, { dividend: 18, divisor: 3 },
];
const THEME_LIST = Object.values(THEMES);

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function pick(arr, n) { return shuffle(arr).slice(0, n); }

const pairs = ref([]);
const sceneCards = ref([]);
const formulaCards = ref([]);
const selectedScene = ref(null);
const selectedFormula = ref(null);

const doneCount = computed(() => pairs.value.filter(p => p.matched).length);

function buildRound() {
  const items = pick(POOL, ROUND_SIZE);
  pairs.value = items.map((it, i) => ({
    pairId: `p${i}`,
    dividend: it.dividend,
    divisor: it.divisor,
    quotient: it.dividend / it.divisor,
    matched: false,
  }));
  // 随机给每个 pair 一个主题
  const themed = pairs.value.map((p) => {
    const theme = THEME_LIST[Math.floor(Math.random() * THEME_LIST.length)];
    return { ...p, itemEmoji: theme.itemEmoji };
  });
  sceneCards.value = shuffle(themed.map(p => ({
    key: `s-${p.pairId}`,
    pairId: p.pairId,
    dividend: p.dividend, divisor: p.divisor, itemEmoji: p.itemEmoji,
    matched: false, wrong: false,
  })));
  formulaCards.value = shuffle(pairs.value.map(p => ({
    key: `f-${p.pairId}`,
    pairId: p.pairId,
    dividend: p.dividend, divisor: p.divisor, quotient: p.quotient,
    matched: false, wrong: false,
  })));
  selectedScene.value = null;
  selectedFormula.value = null;
}

function pickScene(card) {
  if (card.matched) return;
  selectedScene.value = card.key;
  tryResolve();
}
function pickFormula(card) {
  if (card.matched) return;
  selectedFormula.value = card.key;
  tryResolve();
}

function tryResolve() {
  if (!selectedScene.value || !selectedFormula.value) return;
  const sc = sceneCards.value.find(c => c.key === selectedScene.value);
  const fc = formulaCards.value.find(c => c.key === selectedFormula.value);
  if (!sc || !fc) return;

  if (sc.pairId === fc.pairId) {
    // 配对成功
    sceneCards.value = sceneCards.value.map(c =>
      c.key === sc.key ? { ...c, matched: true } : c,
    );
    formulaCards.value = formulaCards.value.map(c =>
      c.key === fc.key ? { ...c, matched: true } : c,
    );
    pairs.value = pairs.value.map(p =>
      p.pairId === sc.pairId ? { ...p, matched: true } : p,
    );
    selectedScene.value = null;
    selectedFormula.value = null;
  } else {
    // 配错，闪红回弹
    sceneCards.value = sceneCards.value.map(c =>
      c.key === sc.key ? { ...c, wrong: true } : c,
    );
    formulaCards.value = formulaCards.value.map(c =>
      c.key === fc.key ? { ...c, wrong: true } : c,
    );
    const failedSc = sc.key, failedFc = fc.key;
    setTimeout(() => {
      sceneCards.value = sceneCards.value.map(c =>
        c.key === failedSc ? { ...c, wrong: false } : c,
      );
      formulaCards.value = formulaCards.value.map(c =>
        c.key === failedFc ? { ...c, wrong: false } : c,
      );
    }, 500);
    selectedScene.value = null;
    selectedFormula.value = null;
  }
}

function restart() { buildRound(); }

buildRound();
</script>

<style scoped>
.match {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  gap: 14px; padding: 12px;
}
.head {
  display: flex; align-items: center; justify-content: space-between;
  background: #fffdf6; border: 2px solid #f0e6d8;
  border-radius: 14px; padding: 8px 14px;
}
.title { margin: 0; font-size: 16px; color: #3a2e2e; }
.meta { display: flex; align-items: center; gap: 10px; }
.score {
  font-size: 13px; font-weight: 800; color: #9b5cd6;
  background: #f5f0ff; padding: 4px 12px; border-radius: 999px;
}
.restart {
  background: #f0f8f2; color: #54b85a;
  border: 2px solid #c0e8cc; border-radius: 999px;
  padding: 4px 12px; font-family: inherit; font-weight: 800; font-size: 12px;
  cursor: pointer;
}

.celebrate {
  background: #f0fff4; border: 3px solid #54b85a;
  border-radius: 16px; padding: 16px;
  display: flex; align-items: center; justify-content: center; gap: 14px;
  animation: pop 0.4s ease;
}
.c-emoji { font-size: 40px; }
.celebrate p { margin: 0; font-size: 17px; font-weight: 900; color: #2e7a3c; }
@keyframes pop { from { transform: scale(0.7); } to { transform: scale(1); } }

.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.scene-card {
  background: #fffdf6;
  border: 3px solid;
  border-radius: 14px;
  padding: 10px;
  cursor: pointer;
  display: flex; flex-direction: column; gap: 6px;
  transition: transform 0.12s, background 0.12s;
}
.scene-card:hover:not(.done) { transform: translateY(-3px); }
.scene-card.on { background: #fff5e6; }
.scene-card.done { background: #f0fff4; opacity: 0.85; }
.scene-card.wrong { animation: shake 0.5s ease; background: #ffe8e8; }
.items {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 2px;
  font-size: 20px; line-height: 1.1;
  min-height: 50px;
}
.i { font-size: 22px; }
.arrow {
  font-size: 12px; font-weight: 800; color: #9b8b7a;
  text-align: center;
}
.baskets-mini {
  display: flex; justify-content: center; gap: 4px;
}
.b-mini {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid; border-radius: 8px;
  font-size: 16px;
}

.formula-card {
  background: #fff;
  border: 3px solid;
  border-radius: 14px;
  padding: 14px 8px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-weight: 900;
  transition: transform 0.12s, background 0.12s;
}
.formula-card:hover:not(.done) { transform: translateY(-3px); }
.formula-card.on { background: #fff5e6; }
.formula-card.done { background: #f0fff4; opacity: 0.85; }
.formula-card.wrong { animation: shake 0.5s ease; background: #ffe8e8; }
.f-num {
  font-size: 22px; color: #3a2e2e;
  min-width: 26px; text-align: center;
}
.f-num.q { color: #9b5cd6; }
.f-op { font-size: 18px; color: #9b8b7a; }

.tip {
  text-align: center; margin: 0;
  font-size: 13px; font-weight: 700; color: #9b8b7a;
}

@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-4px); }
  75%      { transform: translateX(4px); }
}
</style>
