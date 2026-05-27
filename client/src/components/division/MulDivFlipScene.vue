<template>
  <div class="flip col">
    <h3 class="title">你已经会乘法啦！让乘法帮你做除法 ✨</h3>

    <div class="card-wrap" :class="{ flipped }">
      <div class="card front">
        <span class="c-num">{{ a }}</span>
        <span class="c-op">×</span>
        <span class="c-num">{{ b }}</span>
        <span class="c-op">=</span>
        <span class="c-num">{{ product }}</span>
      </div>
      <div class="card back">
        <span class="c-num">{{ product }}</span>
        <span class="c-op">÷</span>
        <span class="c-num">{{ a }}</span>
        <span class="c-op">=</span>
        <span class="c-num q" :class="{ revealed: answered }">{{ answered ? b : '?' }}</span>
      </div>
    </div>

    <button v-if="!flipped" class="flip-btn" @click="flipCard">把它翻过来看看 ↻</button>

    <div v-else class="answer-area">
      <p v-if="!answered" class="ask">{{ product }} ÷ {{ a }} = ?</p>
      <p v-else class="cheer">{{ celebrationText }}</p>

      <div v-if="!answered" class="choices">
        <button v-for="opt in options" :key="opt"
          class="choice"
          :class="{
            right: feedback === 'right' && opt === b,
            wrong: feedback === 'wrong' && opt === lastPick,
          }"
          @click="pick(opt)"
          :disabled="feedback === 'right'"
        >{{ opt }}</button>
      </div>

      <button v-if="answered" class="cta" @click="$emit('next')">{{ ctaLabel }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  /** 一道乘法事实：{ a, b, product } */
  fact: { type: Object, required: true },
  ctaLabel: { type: String, default: '完成 →' },
});
defineEmits(['next']);

const a = computed(() => props.fact.a);
const b = computed(() => props.fact.b);
const product = computed(() => props.fact.product);

const flipped = ref(false);
const answered = ref(false);
const feedback = ref(null);   // null | 'right' | 'wrong'
const lastPick = ref(null);

const options = computed(() => {
  // 3 个选项，含正确答案
  const ans = b.value;
  const pool = new Set([ans]);
  while (pool.size < 3) {
    const fake = Math.max(1, ans + (Math.floor(Math.random() * 5) - 2));
    if (fake !== ans) pool.add(fake);
  }
  return [...pool].sort(() => Math.random() - 0.5);
});

const celebrationText = computed(() =>
  `太棒了！${product.value} 平均分成 ${a.value} 份，每份就是 ${b.value}`,
);

function flipCard() { flipped.value = true; }

function pick(opt) {
  if (answered.value) return;
  lastPick.value = opt;
  if (opt === b.value) {
    feedback.value = 'right';
    answered.value = true;
  } else {
    feedback.value = 'wrong';
    setTimeout(() => { feedback.value = null; }, 600);
  }
}

// 题目变了：重置状态
watch(() => props.fact, () => {
  flipped.value = false;
  answered.value = false;
  feedback.value = null;
  lastPick.value = null;
}, { deep: true });
</script>

<style scoped>
.flip {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column; align-items: center;
  gap: 18px; padding: 12px;
}
.title { margin: 0; font-size: 18px; color: #3a2e2e; text-align: center; }

.card-wrap {
  perspective: 1200px;
  width: 380px; max-width: 90vw; height: 120px;
  position: relative;
}
.card {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  gap: 12px;
  border-radius: 18px;
  border: 4px solid;
  font-weight: 900;
  backface-visibility: hidden;
  transition: transform 0.7s cubic-bezier(0.3, 0.8, 0.4, 1);
}
.card.front {
  background: linear-gradient(180deg, #fff5e6, #ffe7c2);
  border-color: #ff8e3c;
  transform: rotateY(0);
}
.card.back {
  background: linear-gradient(180deg, #f5f0ff, #e8defa);
  border-color: #9b5cd6;
  transform: rotateY(180deg);
}
.card-wrap.flipped .front { transform: rotateY(-180deg); }
.card-wrap.flipped .back  { transform: rotateY(0); }

.c-num {
  font-size: 48px; line-height: 1;
  min-width: 56px; text-align: center;
}
.card.front .c-num { color: #ff8e3c; }
.card.back  .c-num { color: #9b5cd6; }
.c-num.q { color: #9b8b7a; }
.c-num.q.revealed { color: #54b85a; animation: bingo 0.4s ease; }
@keyframes bingo {
  0%   { transform: scale(0.6); }
  50%  { transform: scale(1.35); }
  100% { transform: scale(1); }
}
.c-op {
  font-size: 36px; color: #9b8b7a;
}

.flip-btn {
  background: #9b5cd6; color: #fff;
  border: none; border-radius: 14px;
  padding: 12px 28px; font-family: inherit; font-weight: 900; font-size: 15px;
  cursor: pointer; box-shadow: 0 5px 0 #6b3aa0;
}
.flip-btn:hover { transform: translateY(-2px); }

.answer-area {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px;
}
.ask {
  margin: 0; font-size: 22px; font-weight: 900; color: #3a2e2e;
}
.cheer {
  margin: 0; font-size: 16px; font-weight: 800; color: #2e7a3c;
  text-align: center; max-width: 480px;
}
.choices {
  display: flex; gap: 12px;
}
.choice {
  width: 80px; height: 80px;
  font-family: inherit; font-size: 32px; font-weight: 900;
  background: #fff; color: #3a2e2e;
  border: 3px solid #e0d8cc; border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 4px 0 var(--shadow, rgba(120, 80, 40, 0.18));
  transition: transform 0.12s, background 0.12s, border-color 0.12s;
}
.choice:hover:not(:disabled) {
  transform: translateY(-3px); border-color: #9b5cd6;
}
.choice.right {
  background: #d0f5de; border-color: #54b85a; color: #2e7a3c;
}
.choice.wrong {
  background: #ffe8e8; border-color: #e85b5b; color: #e85b5b;
  animation: shake 0.4s ease;
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-4px); }
  75%      { transform: translateX(4px); }
}

.cta {
  background: #54b85a; color: #fff;
  border: none; border-radius: 14px;
  padding: 12px 28px; font-family: inherit; font-weight: 900; font-size: 16px;
  cursor: pointer; box-shadow: 0 5px 0 #3a8a42;
}
.cta:hover { transform: translateY(-2px); }
</style>
