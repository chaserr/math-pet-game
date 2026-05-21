<template>
  <img
    class="nb"
    :class="{ dragging }"
    :src="src"
    :width="size"
    :height="size"
    :alt="`数字 ${digit}`"
    draggable="false"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  digit: { type: [Number, String], required: true },
  // 渲染成 size×size 的正方形（官方图都是 1:1）
  size: { type: Number, default: 72 },
  // 保留兼容旧调用，已不再影响渲染
  mode: { type: String, default: 'fit' },
  dragging: { type: Boolean, default: false },
});

const src = computed(() => `/numberblocks/${Number(props.digit)}.png`);
</script>

<style scoped>
.nb {
  display: block;
  object-fit: contain;
  border-radius: 18%;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none; /* 拖拽事件交给外层 .tile 处理 */
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
  transition: filter 0.15s ease;
}
.nb.dragging {
  filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.35));
}
</style>
