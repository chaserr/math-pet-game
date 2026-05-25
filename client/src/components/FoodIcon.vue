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
    <!-- 灵魂果冻 -->
    <g v-else-if="foodId === 'soul_jelly'">
      <path d="M16 28 q14 -16 28 0 v10 q-14 12 -28 0 z" fill="#a5f3e0" stroke="#4fbfa8" stroke-width="2"/>
      <circle cx="24" cy="30" r="2.5" fill="#2a2a2a"/>
      <circle cx="36" cy="30" r="2.5" fill="#2a2a2a"/>
      <ellipse cx="30" cy="22" rx="6" ry="3" fill="#fff" opacity="0.55"/>
    </g>
    <!-- 棉花糖 -->
    <g v-else-if="foodId === 'shy_marshmallow'">
      <rect x="22" y="16" width="16" height="28" rx="7" fill="#fff0f5" stroke="#f0b8cc" stroke-width="2"/>
      <path d="M22 26 h16 M22 34 h16" stroke="#f0b8cc" stroke-width="1.5"/>
      <rect x="28" y="10" width="4" height="36" rx="2" fill="#c79a6a"/>
    </g>
    <!-- 南瓜派 -->
    <g v-else-if="foodId === 'pumpkin_pie'">
      <path d="M12 40 L48 40 L40 24 Q30 18 20 24 Z" fill="#e8922e" stroke="#b86a14" stroke-width="2" stroke-linejoin="round"/>
      <path d="M12 40 L48 40 L46 44 L14 44 Z" fill="#d8a05a" stroke="#b86a14" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="30" cy="30" r="3" fill="#fff" opacity="0.7"/>
    </g>
    <!-- 暗夜糖 -->
    <g v-else-if="foodId === 'night_candy'">
      <circle cx="30" cy="30" r="11" fill="#5b4b8a" stroke="#3a2e5c" stroke-width="2"/>
      <path d="M19 30 l-8 -5 v10 z" fill="#7c6bd6" stroke="#3a2e5c" stroke-width="2"/>
      <path d="M41 30 l8 -5 v10 z" fill="#7c6bd6" stroke="#3a2e5c" stroke-width="2"/>
      <path d="M27 27 l3 3 4 -4" stroke="#ffd83b" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>
    <!-- 紫水晶 -->
    <g v-else-if="foodId === 'purple_gem'">
      <path d="M30 10 L44 24 L30 50 L16 24 Z" fill="#c084fc" stroke="#8b3fd6" stroke-width="2" stroke-linejoin="round"/>
      <path d="M16 24 H44 M30 10 L30 50 M22 24 L30 50 M38 24 L30 50" stroke="#e9d5ff" stroke-width="1.5" fill="none" opacity="0.8"/>
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
