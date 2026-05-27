<template>
  <div class="count col">
    <h3 class="title">🎉 分完啦！点点篮子，数一数</h3>

    <div class="baskets" :style="{ gridTemplateColumns: `repeat(${divisor}, 1fr)` }">
      <button
        v-for="(b, k) in displayBaskets" :key="k"
        class="basket"
        :class="{ revealed: revealed[k] }"
        :style="{ borderColor: b.color, background: b.color + '22' }"
        @click="reveal(k)"
        :disabled="revealed[k]"
      >
        <div class="basket-items">
          <span v-for="i in b.count" :key="i" class="b-item">{{ theme.itemEmoji }}</span>
        </div>
        <div class="basket-meta">
          <span class="b-count" :style="{ color: b.color }">{{ revealed[k] ? b.count : '?' }}</span>
          <span class="b-name">{{ b.name }}</span>
        </div>
      </button>
    </div>

    <div class="summary" v-if="allRevealed">
      <p>每个篮子有 <b class="hi">{{ each }}</b> 个 {{ theme.item }}</p>
      <p>一共有 <b class="hi">{{ divisor }}</b> 个篮子</p>
      <button class="cta" @click="$emit('next')">看看怎么写算式 →</button>
    </div>
    <div class="summary" v-else>
      <p class="tip">点一点，看看每个篮子里几个 ({{ revealedCount }} / {{ divisor }})</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  dividend: { type: Number, required: true },
  divisor:  { type: Number, required: true },
  theme:    { type: Object, required: true },
});
defineEmits(['next']);

const each = computed(() => props.dividend / props.divisor);

const displayBaskets = computed(() =>
  Array.from({ length: props.divisor }, (_, k) => ({
    count: each.value,
    name: props.theme.actorNames[k] || `${props.theme.actor}${k + 1}`,
    color: ['#ff9eb1', '#a0d8b0', '#f0c878', '#9ec5e8'][k % 4],
  })),
);

const revealed = ref(Array(props.divisor).fill(false));
watch(() => props.divisor, (n) => { revealed.value = Array(n).fill(false); });

const revealedCount = computed(() => revealed.value.filter(Boolean).length);
const allRevealed = computed(() => revealedCount.value === props.divisor);

function reveal(k) {
  // 不可变更新：替换数组而不是直接 mutate
  revealed.value = revealed.value.map((v, i) => (i === k ? true : v));
}
</script>

<style scoped>
.count {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column; gap: 14px; padding: 8px;
  align-items: center;
}
.title { margin: 0; font-size: 18px; color: #3a2e2e; }

/* 篮子区（grid 列数由 :style 控制，跟 props.divisor 走） */
.baskets {
  display: grid;
  gap: 14px;
  width: 100%; max-width: 720px;
}
.basket {
  display: flex; flex-direction: column; gap: 6px;
  border: 3px dashed; border-radius: 18px;
  padding: 10px;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.basket:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
}
.basket.revealed { border-style: solid; }
.basket:disabled { cursor: default; }

.basket-items {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 4px;
  min-height: 60px; padding: 4px;
}
.b-item { font-size: 26px; line-height: 1; }

.basket-meta {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 6px;
  border-top: 2px dashed rgba(0,0,0,0.08);
}
.b-count {
  font-size: 36px; font-weight: 900; min-width: 36px; text-align: center;
}
.b-name {
  font-size: 14px; font-weight: 800; color: #3a2e2e;
}

.summary {
  text-align: center;
  font-size: 16px; color: #3a2e2e;
}
.summary p { margin: 4px 0; font-weight: 700; }
.hi {
  display: inline-block;
  background: #54b85a; color: #fff;
  padding: 2px 12px; border-radius: 999px;
  font-size: 20px; font-weight: 900;
}
.tip { color: #9b8b7a; font-weight: 700; }

.cta {
  background: #ff8e3c; color: #fff;
  border: none; border-radius: 14px;
  padding: 12px 28px; font-family: inherit; font-weight: 900; font-size: 16px;
  cursor: pointer; box-shadow: 0 5px 0 #f06b1d;
  margin-top: 10px;
}
.cta:hover { transform: translateY(-2px); }
</style>
