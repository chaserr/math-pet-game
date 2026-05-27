<template>
  <div class="drag-scene" ref="sceneEl">
    <!-- 顶部：剩余物品池 -->
    <div class="pool" ref="poolEl">
      <div class="pool-label">剩余 {{ theme.item }}：{{ poolItems.length }} / {{ dividend }}</div>
      <div class="pool-area">
        <div
          v-for="it in poolItems" :key="it.id"
          class="dragger"
          :class="{ grabbed: dragId === it.id }"
          :style="{ left: it.x + 'px', top: it.y + 'px' }"
          @pointerdown="startDrag(it, $event)"
        >{{ theme.itemEmoji }}</div>
      </div>
    </div>

    <!-- 中部：提示条 -->
    <div class="hint-bar" :class="{ warn: hint.warn }">
      <span>{{ hint.text }}</span>
      <button v-if="showReset" class="reset-btn" @click="reset">🔄 重新分</button>
    </div>

    <!-- 底部：篮子区 -->
    <div class="baskets" :style="{ gridTemplateColumns: `repeat(${divisor}, 1fr)` }">
      <div
        v-for="(b, k) in baskets" :key="b.id"
        class="basket"
        :class="{ hot: hoverIdx === k }"
        :style="{ borderColor: b.color, background: b.color + '20' }"
        :ref="el => basketRefs[k] = el"
      >
        <!-- 篮子里已分到的物品（网格排列） -->
        <div class="basket-fill">
          <span v-for="it in b.items" :key="it.id" class="filled-item">{{ theme.itemEmoji }}</span>
        </div>
        <div class="basket-meta">
          <span class="b-count" :style="{ color: b.color }">{{ b.items.length }}</span>
          <span class="b-name">{{ b.name }}</span>
          <PetSprite :pet-id="theme.petId" mood="happy" :size="56" :level="1" />
        </div>
      </div>
    </div>

    <!-- 拖拽中的浮层物品（脱离原 DOM 位置，跟随指针） -->
    <div
      v-if="dragId !== null && dragGhost"
      class="drag-ghost"
      :style="{ left: dragGhost.x + 'px', top: dragGhost.y + 'px' }"
    >{{ theme.itemEmoji }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import PetSprite from '../PetSprite.vue';
import { BASKET_COLORS } from '../../lib/divisionScenarios.js';

const props = defineProps({
  dividend: { type: Number, required: true },     // 总物品数（如 12）
  divisor:  { type: Number, required: true },     // 篮子数（如 3）
  theme:    { type: Object, required: true },     // { petId, item, itemEmoji, actorNames, ... }
  /** 是否只读（用于"数一数"步骤） */
  readonly: { type: Boolean, default: false },
  /** 是否在分完后自动播报"公平"，false 时由父组件决定 */
  autoComplete: { type: Boolean, default: true },
});
const emit = defineEmits(['complete', 'reset', 'distribute']);

// ============ 数据 ============
const sceneEl = ref(null);
const poolEl  = ref(null);
const basketRefs = ref([]);

// 物品：在 pool 时有 x/y 坐标（相对 poolEl）；进 basket 后由 basket 容器布局，不再用 x/y
const items = reactive([]);
const baskets = reactive([]);

const dragId   = ref(null);
const dragGhost = ref(null);   // { x, y }，浮层物品的全局坐标
const hoverIdx = ref(-1);      // 当前 pointer 悬停的篮子 index
const showReset = ref(false);
const hint = reactive({ text: '', warn: false });

// 计算属性
const poolItems = computed(() => items.filter(it => it.basket === null));

// ============ 初始化 ============
function setupItems() {
  items.splice(0, items.length);
  for (let i = 0; i < props.dividend; i++) {
    items.push({ id: i, x: 0, y: 0, basket: null });
  }
}

function setupBaskets() {
  baskets.splice(0, baskets.length);
  for (let k = 0; k < props.divisor; k++) {
    baskets.push({
      id: k,
      name: props.theme.actorNames[k] || `${props.theme.actor}${k + 1}`,
      color: BASKET_COLORS[k % BASKET_COLORS.length],
      items: [],
    });
  }
}

function layoutPool() {
  if (!poolEl.value) return;
  const W = poolEl.value.clientWidth;
  const H = poolEl.value.clientHeight;
  const SIZE = 44; // 物品尺寸
  const cols = Math.max(4, Math.ceil(Math.sqrt(props.dividend * (W / Math.max(H, 1)))));
  const stepX = (W - SIZE) / Math.max(cols - 1, 1);
  const rows  = Math.ceil(props.dividend / cols);
  const stepY = (H - SIZE - 8) / Math.max(rows, 1);

  let i = 0;
  items.forEach(it => {
    if (it.basket !== null) return;
    const col = i % cols;
    const row = Math.floor(i / cols);
    // 加 -4~4 抖动避免太规整
    it.x = col * stepX + (Math.random() * 8 - 4);
    it.y = row * stepY + 4 + (Math.random() * 6 - 3);
    i++;
  });
}

function showHint(text, warn = false) {
  hint.text = text;
  hint.warn = warn;
}

function refreshDefaultHint() {
  showHint(`把 ${props.theme.item} 拖到下面的篮子里，分给 ${props.divisor} 只${props.theme.actor}`);
}

// ============ 拖拽 ============
function startDrag(item, e) {
  if (props.readonly) return;
  e.preventDefault();
  dragId.value = item.id;
  updateGhost(e);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onEnd);
  window.addEventListener('pointercancel', onEnd);
}

function updateGhost(e) {
  if (!sceneEl.value) return;
  const r = sceneEl.value.getBoundingClientRect();
  dragGhost.value = {
    x: e.clientX - r.left - 22,
    y: e.clientY - r.top  - 22,
  };
}

function onMove(e) {
  if (dragId.value === null) return;
  updateGhost(e);
  // 判定 hover 的篮子
  hoverIdx.value = findBasketAt(e.clientX, e.clientY);
}

function findBasketAt(cx, cy) {
  for (let k = 0; k < basketRefs.value.length; k++) {
    const el = basketRefs.value[k];
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) return k;
  }
  return -1;
}

function onEnd(e) {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onEnd);
  window.removeEventListener('pointercancel', onEnd);
  const id = dragId.value;
  dragId.value = null;
  dragGhost.value = null;
  if (id === null) return;
  const it = items.find(x => x.id === id);
  if (!it) return;

  const hit = findBasketAt(e.clientX, e.clientY);
  hoverIdx.value = -1;
  if (hit !== -1) {
    placeIntoBasket(it, hit);
  }
  // 没命中：物品回到 pool（因 basket 仍为 null 自动留在 pool）
}

function placeIntoBasket(it, idx) {
  // 从原 basket 移除（如果已在某个 basket 里）
  if (it.basket !== null) {
    baskets[it.basket].items = baskets[it.basket].items.filter(x => x.id !== it.id);
  }
  it.basket = idx;
  baskets[idx].items.push(it);

  emit('distribute', baskets.map(b => b.items.length));

  // 是否全部分完？
  if (poolItems.value.length === 0) {
    checkFairness();
  }
}

function checkFairness() {
  const counts = baskets.map(b => b.items.length);
  const fair = counts.every(c => c === counts[0]);
  if (fair) {
    showHint(`✨ ${props.theme.cheer(counts[0])}`);
    showReset.value = false;
    if (props.autoComplete) emit('complete', counts);
  } else {
    const max = Math.max(...counts), min = Math.min(...counts);
    const maxIdx = counts.indexOf(max), minIdx = counts.indexOf(min);
    showHint(
      `${baskets[maxIdx].name} 拿了 ${max} 个，${baskets[minIdx].name} 只有 ${min} 个，对${baskets[minIdx].name}公平吗？`,
      true,
    );
    showReset.value = true;
  }
}

function reset() {
  items.forEach(it => { it.basket = null; });
  baskets.forEach(b => { b.items = []; });
  showReset.value = false;
  refreshDefaultHint();
  nextTick(layoutPool);
  emit('reset');
}

// 对外暴露：让父组件可以"自动平分"（演示用）
function autoFairFill() {
  reset();
  const each = props.dividend / props.divisor;
  if (!Number.isInteger(each)) return;
  let i = 0;
  items.forEach(it => {
    const k = Math.floor(i / each);
    placeIntoBasket(it, k);
    i++;
  });
}
defineExpose({ autoFairFill, reset });

// ============ 生命周期 ============
let ro = null;
onMounted(() => {
  setupItems();
  setupBaskets();
  refreshDefaultHint();
  nextTick(layoutPool);
  // 监听 pool 尺寸变化，重新布局
  ro = new ResizeObserver(() => layoutPool());
  if (poolEl.value) ro.observe(poolEl.value);
});
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onEnd);
  window.removeEventListener('pointercancel', onEnd);
  if (ro && poolEl.value) ro.unobserve(poolEl.value);
});

// 题目变化时重新初始化
watch(() => [props.dividend, props.divisor, props.theme.id], () => {
  setupItems();
  setupBaskets();
  showReset.value = false;
  refreshDefaultHint();
  nextTick(layoutPool);
});
</script>

<style scoped>
.drag-scene {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column; gap: 10px;
  position: relative;
  user-select: none; touch-action: none;
}

/* 物品池 */
.pool {
  flex: 1; min-height: 140px;
  background: linear-gradient(180deg, #fff9ec 0%, #fffaf3 100%);
  border: 3px solid #f0d999;
  border-radius: 16px;
  padding: 6px 10px 10px;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.pool-label {
  font-size: 12px; font-weight: 800; color: #b67517;
  align-self: center; margin-bottom: 4px;
}
.pool-area {
  flex: 1; position: relative;
}
.dragger {
  position: absolute;
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  font-size: 30px; line-height: 1;
  cursor: grab;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));
  transition: transform 0.12s;
  will-change: left, top;
}
.dragger:hover { transform: scale(1.12); }
.dragger:active { cursor: grabbing; }
.dragger.grabbed { opacity: 0.25; }

/* 拖拽时的浮层 */
.drag-ghost {
  position: absolute;
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  font-size: 36px;
  pointer-events: none;
  z-index: 100;
  filter: drop-shadow(0 6px 8px rgba(0,0,0,0.3));
  transform: scale(1.15);
}

/* 提示条 */
.hint-bar {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: #f0fff4; border: 2px solid #a0d8b0;
  border-radius: 12px; padding: 8px 14px;
  font-size: 14px; font-weight: 800; color: #2e7a3c;
  text-align: center;
}
.hint-bar.warn {
  background: #fff5e6; border-color: #f0a93a; color: #b67517;
}
.reset-btn {
  background: #fff; color: #b67517;
  border: 2px solid #f0a93a; border-radius: 999px;
  padding: 4px 12px; font-family: inherit; font-weight: 800; font-size: 12px;
  cursor: pointer; white-space: nowrap;
}
.reset-btn:hover { background: #fff3d6; }

/* 篮子区（grid 列数由 :style="gridTemplateColumns" 控制，跟 props.divisor 走） */
.baskets {
  flex: 1.2; min-height: 200px;
  display: grid;
  gap: 10px;
}
.basket {
  position: relative;
  border: 3px dashed;
  border-radius: 16px;
  padding: 8px;
  display: flex; flex-direction: column;
  transition: transform 0.12s, box-shadow 0.12s;
}
.basket.hot {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.18);
  border-style: solid;
}
.basket-fill {
  flex: 1;
  display: flex; flex-wrap: wrap; align-content: flex-start;
  gap: 2px;
  overflow: hidden;
  padding: 4px 2px;
}
.filled-item {
  font-size: 22px; line-height: 1;
  animation: pop-in 0.25s ease;
}
@keyframes pop-in {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
.basket-meta {
  display: flex; align-items: center; gap: 8px;
  padding-top: 6px;
  border-top: 2px dashed rgba(0,0,0,0.08);
}
.b-count {
  font-size: 28px; font-weight: 900;
  min-width: 32px; text-align: center;
}
.b-name {
  flex: 1;
  font-size: 13px; font-weight: 800; color: #3a2e2e;
}
</style>
