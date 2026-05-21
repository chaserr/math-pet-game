<template>
  <svg :width="size" :height="size" viewBox="0 0 60 60" class="food">
    <!-- 小鱼干 -->
    <g v-if="foodId === 'fish_dry'">
      <ellipse cx="26" cy="30" rx="18" ry="10" fill="#9fd3e0" stroke="#5fa9bd" stroke-width="2"/>
      <path d="M42 30 l12 -8 v16 z" fill="#9fd3e0" stroke="#5fa9bd" stroke-width="2"/>
      <circle cx="18" cy="27" r="2.5" fill="#2a2a2a"/>
    </g>
    <!-- 肉骨头 -->
    <g v-else-if="foodId === 'bone'">
      <rect x="20" y="26" width="20" height="8" rx="4" fill="#fff5e1" stroke="#d8c4a0" stroke-width="2"/>
      <circle cx="20" cy="24" r="6" fill="#fff5e1" stroke="#d8c4a0" stroke-width="2"/>
      <circle cx="20" cy="36" r="6" fill="#fff5e1" stroke="#d8c4a0" stroke-width="2"/>
      <circle cx="40" cy="24" r="6" fill="#fff5e1" stroke="#d8c4a0" stroke-width="2"/>
      <circle cx="40" cy="36" r="6" fill="#fff5e1" stroke="#d8c4a0" stroke-width="2"/>
    </g>
    <!-- 胡萝卜 -->
    <g v-else-if="foodId === 'carrot'">
      <path d="M30 14 l10 30 -10 6 -10 -6 z" fill="#ff8e3c" stroke="#e0701d" stroke-width="2"/>
      <path d="M30 16 l-6 -8 M30 16 l6 -8 M30 16 v-10" stroke="#4ade80" stroke-width="3" stroke-linecap="round"/>
    </g>
    <!-- 小米粒 -->
    <g v-else-if="foodId === 'millet'">
      <circle cx="22" cy="28" r="5" fill="#ffd93b" stroke="#e0a500" stroke-width="1.5"/>
      <circle cx="34" cy="24" r="5" fill="#ffd93b" stroke="#e0a500" stroke-width="1.5"/>
      <circle cx="38" cy="34" r="5" fill="#ffd93b" stroke="#e0a500" stroke-width="1.5"/>
      <circle cx="26" cy="38" r="5" fill="#ffd93b" stroke="#e0a500" stroke-width="1.5"/>
    </g>
    <!-- 浆果 -->
    <g v-else-if="foodId === 'berry'">
      <circle cx="24" cy="34" r="9" fill="#a855f7" stroke="#7e22ce" stroke-width="2"/>
      <circle cx="38" cy="34" r="9" fill="#c026d3" stroke="#86198f" stroke-width="2"/>
      <path d="M24 25 q4 -8 8 0" stroke="#4ade80" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>
    <!-- 竹笋 -->
    <g v-else-if="foodId === 'bamboo'">
      <path d="M30 10 q12 24 0 42 q-12 -18 0 -42 z" fill="#d7e8a3" stroke="#9bbf5a" stroke-width="2"/>
      <path d="M22 28 q8 4 16 0 M24 38 q6 3 12 0" stroke="#9bbf5a" stroke-width="2" fill="none"/>
    </g>
    <!-- 冰鲜鱼 -->
    <g v-else-if="foodId === 'ice_fish'">
      <ellipse cx="26" cy="30" rx="18" ry="10" fill="#7dd3fc" stroke="#0284c7" stroke-width="2"/>
      <path d="M42 30 l12 -8 v16 z" fill="#7dd3fc" stroke="#0284c7" stroke-width="2"/>
      <circle cx="18" cy="27" r="2.5" fill="#2a2a2a"/>
      <path d="M30 22 l3 4 4 -3" stroke="#fff" stroke-width="2" fill="none"/>
    </g>
    <!-- 火龙果 -->
    <g v-else-if="foodId === 'dragonfruit'">
      <ellipse cx="30" cy="32" rx="15" ry="17" fill="#ff5d8f" stroke="#d1366a" stroke-width="2"/>
      <path d="M18 22 l-6 -4 M42 22 l6 -4 M30 16 v-6 M16 36 l-7 2 M44 36 l7 2"
            stroke="#6fcf6f" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g v-else>
      <circle cx="30" cy="32" r="14" fill="#ffd93b" stroke="#e0a500" stroke-width="2"/>
    </g>
  </svg>
</template>

<script setup>
defineProps({
  foodId: { type: String, required: true },
  size: { type: Number, default: 48 },
});
</script>

<style scoped>
.food { display: block; }
</style>
