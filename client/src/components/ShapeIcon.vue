<template>
  <svg :width="size" :height="size" viewBox="0 0 100 100" class="shape-icon">
    <!-- ===== 立体图形 ===== -->
    <!-- 长方体：前矩形 + 顶面 + 右侧面，3 面错位透视 -->
    <g v-if="shapeId === 'cuboid'">
      <polygon points="20,40 70,40 80,30 30,30" fill="#ffc888" stroke="#a55a14" stroke-width="2.2" stroke-linejoin="round" />
      <polygon points="70,40 70,80 80,70 80,30" fill="#e09452" stroke="#a55a14" stroke-width="2.2" stroke-linejoin="round" />
      <rect x="20" y="40" width="50" height="40" fill="#ffd9a8" stroke="#a55a14" stroke-width="2.2" />
    </g>

    <!-- 正方体：同长方体但边长相等 -->
    <g v-else-if="shapeId === 'cube'">
      <polygon points="22,38 68,38 78,28 32,28" fill="#bbe3ff" stroke="#1f5e98" stroke-width="2.2" stroke-linejoin="round" />
      <polygon points="68,38 68,84 78,74 78,28" fill="#7fb8ed" stroke="#1f5e98" stroke-width="2.2" stroke-linejoin="round" />
      <rect x="22" y="38" width="46" height="46" fill="#d9edff" stroke="#1f5e98" stroke-width="2.2" />
    </g>

    <!-- 圆柱：顶椭圆 + 矩形身 + 底椭圆（底部虚线表示隐藏边） -->
    <g v-else-if="shapeId === 'cylinder'">
      <rect x="22" y="30" width="56" height="48" fill="#c6f0c0" stroke="#2c7a36" stroke-width="2.2" />
      <!-- 底面（先画底以便顶面覆盖） -->
      <ellipse cx="50" cy="78" rx="28" ry="9" fill="#a5d99f" stroke="#2c7a36" stroke-width="2.2" />
      <!-- 顶面 -->
      <ellipse cx="50" cy="30" rx="28" ry="9" fill="#e2faE0" stroke="#2c7a36" stroke-width="2.2" />
    </g>

    <!-- 球：圆 + 高光 + 阴影 -->
    <g v-else-if="shapeId === 'sphere'">
      <defs>
        <radialGradient :id="sphereGrad" cx="40%" cy="35%">
          <stop offset="0%" stop-color="#fff8a8" />
          <stop offset="60%" stop-color="#f0c64a" />
          <stop offset="100%" stop-color="#9c7615" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="32" :fill="`url(#${sphereGrad})`" stroke="#7a5a10" stroke-width="2.2" />
      <ellipse cx="40" cy="40" rx="9" ry="5" fill="#fffae8" opacity="0.85" />
      <!-- 地面阴影 -->
      <ellipse cx="50" cy="88" rx="22" ry="3.5" fill="#000" opacity="0.12" />
    </g>

    <!-- ===== 平面图形 ===== -->
    <g v-else-if="shapeId === 'rectangle'">
      <rect x="14" y="32" width="72" height="36" fill="#ffd6e1" stroke="#c6457a" stroke-width="2.8" rx="4" />
    </g>

    <g v-else-if="shapeId === 'square'">
      <rect x="22" y="22" width="56" height="56" fill="#d6ecff" stroke="#2f73c2" stroke-width="2.8" rx="4" />
    </g>

    <g v-else-if="shapeId === 'triangle'">
      <polygon points="50,16 88,82 12,82" fill="#fff0bd" stroke="#b88a18" stroke-width="2.8" stroke-linejoin="round" />
    </g>

    <g v-else-if="shapeId === 'circle'">
      <circle cx="50" cy="50" r="34" fill="#dcf5d6" stroke="#3a8a40" stroke-width="2.8" />
    </g>

    <g v-else-if="shapeId === 'parallelogram'">
      <polygon points="20,68 38,32 86,32 68,68" fill="#e6d6ff" stroke="#7c4cc0" stroke-width="2.8" stroke-linejoin="round" />
    </g>

    <!-- fallback -->
    <text v-else x="50" y="55" text-anchor="middle" font-size="14" fill="#999">?</text>
  </svg>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  shapeId: { type: String, required: true },
  size:    { type: Number, default: 96 },
});
// 每次 mount 唯一 id，避免多个 sphere 共用同一个 radialGradient
const sphereGrad = computed(() => 'sphere-grad-' + Math.random().toString(36).slice(2, 8));
</script>

<style scoped>
.shape-icon { display: block; }
</style>
