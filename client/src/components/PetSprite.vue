<template>
  <div class="pet-wrap" :class="mood" :style="{ width: size + 'px', height: size + 'px' }">
    <!-- 图片优先：/pets/<物种>/<阶段>.png；缺图自动回退到 SVG -->
    <img
      v-if="imgOk"
      class="pet-img"
      :src="src"
      :width="size"
      :height="size"
      :alt="petId"
      draggable="false"
      @error="imgOk = false"
    />

    <svg v-else :width="size" :height="size" viewBox="0 0 120 120" class="pet">
      <ellipse cx="60" cy="112" rx="34" ry="7" fill="rgba(80,50,20,0.15)" />

      <!-- ===== 各物种 ===== -->
      <!-- 猫 -->
      <g v-if="petId === 'cat'">
        <path d="M30 40 L26 18 L46 34 Z" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <path d="M90 40 L94 18 L74 34 Z" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <ellipse cx="60" cy="66" rx="38" ry="36" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <ellipse cx="60" cy="74" rx="22" ry="20" fill="#fff8f0"/>
        <g class="whisk" stroke="#bbab9b" stroke-width="2" stroke-linecap="round">
          <line x1="38" y1="68" x2="18" y2="64"/><line x1="38" y1="74" x2="18" y2="76"/>
          <line x1="82" y1="68" x2="102" y2="64"/><line x1="82" y1="74" x2="102" y2="76"/>
        </g>
      </g>

      <!-- 狗 -->
      <g v-else-if="petId === 'dog'">
        <ellipse cx="28" cy="58" rx="13" ry="22" :fill="C.dark" :stroke="C.dark" stroke-width="2.5"/>
        <ellipse cx="92" cy="58" rx="13" ry="22" :fill="C.dark" :stroke="C.dark" stroke-width="2.5"/>
        <ellipse cx="60" cy="64" rx="38" ry="36" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <ellipse cx="60" cy="78" rx="20" ry="16" fill="#fff3e0"/>
      </g>

      <!-- 兔 -->
      <g v-else-if="petId === 'rabbit'">
        <ellipse cx="44" cy="24" rx="9" ry="24" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <ellipse cx="76" cy="24" rx="9" ry="24" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <ellipse cx="44" cy="24" rx="4" ry="16" :fill="C.cheek"/>
        <ellipse cx="76" cy="24" rx="4" ry="16" :fill="C.cheek"/>
        <ellipse cx="60" cy="70" rx="36" ry="34" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
      </g>

      <!-- 鸡 -->
      <g v-else-if="petId === 'chick'">
        <path d="M52 26 Q60 14 68 26 Z" fill="#ff9800"/>
        <ellipse cx="60" cy="66" rx="36" ry="34" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <path d="M58 78 L72 84 L58 90 Z" fill="#ff9800"/>
      </g>

      <!-- 狐狸 -->
      <g v-else-if="petId === 'fox'">
        <path d="M28 42 L22 14 L48 34 Z" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <path d="M92 42 L98 14 L72 34 Z" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <ellipse cx="60" cy="66" rx="38" ry="36" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <path d="M60 50 Q40 76 60 100 Q80 76 60 50 Z" fill="#fff"/>
      </g>

      <!-- 熊猫 -->
      <g v-else-if="petId === 'panda'">
        <circle cx="32" cy="36" r="13" fill="#2a2a2a"/>
        <circle cx="88" cy="36" r="13" fill="#2a2a2a"/>
        <ellipse cx="60" cy="66" rx="38" ry="36" fill="#fff" stroke="#2a2a2a" stroke-width="2.5"/>
        <ellipse cx="42" cy="58" rx="9" ry="12" fill="#2a2a2a"/>
        <ellipse cx="78" cy="58" rx="9" ry="12" fill="#2a2a2a"/>
      </g>

      <!-- 企鹅 -->
      <g v-else-if="petId === 'penguin'">
        <ellipse cx="60" cy="66" rx="36" ry="38" fill="#2c3e50" stroke="#1a252f" stroke-width="2.5"/>
        <ellipse cx="60" cy="74" rx="24" ry="28" fill="#fff"/>
        <path d="M54 64 L72 70 L54 76 Z" fill="#ff9800"/>
      </g>

      <!-- 龙 -->
      <g v-else-if="petId === 'dragon'">
        <path d="M40 34 L34 16 L50 30 Z" :fill="C.cheek" :stroke="C.dark" stroke-width="2"/>
        <path d="M80 34 L86 16 L70 30 Z" :fill="C.cheek" :stroke="C.dark" stroke-width="2"/>
        <ellipse cx="60" cy="66" rx="38" ry="36" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <ellipse cx="60" cy="78" rx="20" ry="16" :fill="C.cheek"/>
        <path d="M52 36 q8 -10 16 0" fill="none" :stroke="C.dark" stroke-width="3" stroke-linecap="round"/>
      </g>

      <!-- 乌龟 -->
      <g v-else-if="petId === 'turtle'">
        <ellipse cx="22" cy="84" rx="11" ry="9" :fill="C.cheek" :stroke="C.dark" stroke-width="2.5"/>
        <ellipse cx="98" cy="84" rx="11" ry="9" :fill="C.cheek" :stroke="C.dark" stroke-width="2.5"/>
        <ellipse cx="60" cy="66" rx="40" ry="36" :fill="C.dark" stroke-width="0"/>
        <ellipse cx="60" cy="66" rx="35" ry="31" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <path d="M60 36 L60 96 M32 52 L88 52 M32 80 L88 80" :stroke="C.dark" stroke-width="2" fill="none" opacity="0.6"/>
      </g>

      <!-- 山羊 -->
      <g v-else-if="petId === 'goat'">
        <path d="M36 38 Q24 22 30 12 Q38 22 42 36 Z" :fill="C.dark" :stroke="C.dark" stroke-width="2"/>
        <path d="M84 38 Q96 22 90 12 Q82 22 78 36 Z" :fill="C.dark" :stroke="C.dark" stroke-width="2"/>
        <ellipse cx="60" cy="66" rx="37" ry="35" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <path d="M60 86 q-6 14 0 22 q6 -8 0 -22" :fill="C.cheek"/>
      </g>

      <!-- 绵羊 -->
      <g v-else-if="petId === 'sheep'">
        <ellipse cx="30" cy="58" rx="12" ry="8" :fill="C.cheek" :stroke="C.dark" stroke-width="2.2" transform="rotate(-20 30 58)"/>
        <ellipse cx="90" cy="58" rx="12" ry="8" :fill="C.cheek" :stroke="C.dark" stroke-width="2.2" transform="rotate(20 90 58)"/>
        <g v-if="stage >= 2">
          <path d="M39 38 q-12 -16 2 -24 q10 10 4 24" fill="#d8ad63" stroke="#a98242" stroke-width="2"/>
          <path d="M81 38 q12 -16 -2 -24 q-10 10 -4 24" fill="#d8ad63" stroke="#a98242" stroke-width="2"/>
        </g>
        <g :fill="C.body" :stroke="C.dark" stroke-width="2.3">
          <circle cx="43" cy="58" r="18"/><circle cx="60" cy="50" r="21"/><circle cx="77" cy="58" r="18"/>
          <circle cx="42" cy="77" r="20"/><circle cx="60" cy="76" r="24"/><circle cx="79" cy="77" r="20"/>
          <circle cx="60" cy="34" r="12"/>
        </g>
        <ellipse cx="60" cy="66" rx="24" ry="22" fill="#fff8ee" :stroke="C.dark" stroke-width="2"/>
      </g>

      <!-- 鸭子 -->
      <g v-else-if="petId === 'duck'">
        <!-- 头顶小翘羽 -->
        <path d="M54 24 Q60 12 66 24 Z" :fill="C.dark"/>
        <!-- 身体 -->
        <ellipse cx="60" cy="66" rx="38" ry="34" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
        <!-- 翅膀小波浪（左右） -->
        <path d="M28 70 q5 -4 10 0 q-3 6 -10 0" :fill="C.dark" opacity="0.4"/>
        <path d="M92 70 q-5 -4 -10 0 q3 6 10 0" :fill="C.dark" opacity="0.4"/>
        <!-- 扁嘴：朝下椭圆 -->
        <ellipse cx="60" cy="86" rx="17" ry="6" fill="#ff9c1f" stroke="#c87600" stroke-width="2"/>
        <line x1="60" y1="83" x2="60" y2="89" stroke="#c87600" stroke-width="1.2"/>
        <!-- 两只蹼脚 -->
        <ellipse cx="50" cy="104" rx="8" ry="3.5" fill="#ff9c1f" stroke="#c87600" stroke-width="1.5"/>
        <ellipse cx="70" cy="104" rx="8" ry="3.5" fill="#ff9c1f" stroke="#c87600" stroke-width="1.5"/>
      </g>

      <!-- 臭臭（趣味宠物：盘旋造型 + 头顶小尖尖 + 旁边小苍蝇） -->
      <g v-else-if="petId === 'poop'">
        <!-- 三层盘旋（自上而下、由小到大），用渐深的棕色 -->
        <ellipse cx="60" cy="40" rx="14" ry="9" :fill="C.cheek" :stroke="C.dark" stroke-width="2"/>
        <ellipse cx="60" cy="58" rx="22" ry="11" :fill="C.body" :stroke="C.dark" stroke-width="2"/>
        <ellipse cx="60" cy="78" rx="32" ry="14" :fill="C.dark" :stroke="C.dark" stroke-width="2"/>
        <!-- 顶尖 -->
        <path d="M54 32 Q60 22 66 32 Z" :fill="C.cheek" :stroke="C.dark" stroke-width="1.5"/>
        <!-- 高光（让看起来像 emoji 💩） -->
        <ellipse cx="52" cy="55" rx="4" ry="2" fill="#fff" opacity="0.35"/>
        <ellipse cx="48" cy="75" rx="6" ry="2.5" fill="#fff" opacity="0.25"/>
        <!-- 小苍蝇陪伴 -->
        <g class="fly">
          <ellipse cx="22" cy="22" rx="3.5" ry="2.2" fill="#2a2a2a"/>
          <ellipse cx="20" cy="20" rx="2.5" ry="1.4" fill="#9fd3e0" opacity="0.85"/>
          <ellipse cx="24" cy="20" rx="2.5" ry="1.4" fill="#9fd3e0" opacity="0.85"/>
        </g>
      </g>

      <!-- 兜底 -->
      <g v-else>
        <ellipse cx="60" cy="66" rx="38" ry="36" :fill="C.body" :stroke="C.dark" stroke-width="2.5"/>
      </g>

      <!-- ===== 通用脸（随心情变化） ===== -->
      <g class="face">
        <template v-if="mood === 'happy'">
          <path d="M44 60 q5 -7 10 0" fill="none" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/>
          <path d="M66 60 q5 -7 10 0" fill="none" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/>
        </template>
        <template v-else-if="mood === 'sad'">
          <circle cx="49" cy="62" r="4.5" fill="#2a2a2a"/>
          <circle cx="71" cy="62" r="4.5" fill="#2a2a2a"/>
          <path d="M40 54 l12 4 M80 54 l-12 4" stroke="#2a2a2a" stroke-width="2" stroke-linecap="round"/>
          <path class="tear" d="M49 67 q-3 8 0 12 q3 -4 0 -12" fill="#7dd3fc"/>
        </template>
        <template v-else>
          <circle cx="49" cy="61" r="5" fill="#2a2a2a"/>
          <circle cx="71" cy="61" r="5" fill="#2a2a2a"/>
          <circle cx="50.5" cy="59.5" r="1.6" fill="#fff"/>
          <circle cx="72.5" cy="59.5" r="1.6" fill="#fff"/>
        </template>

        <circle cx="38" cy="72" r="5" :fill="C.cheek" opacity="0.8"/>
        <circle cx="82" cy="72" r="5" :fill="C.cheek" opacity="0.8"/>

        <path v-if="mood === 'happy'" d="M50 76 Q60 88 70 76" fill="none" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/>
        <path v-else-if="mood === 'sad'" d="M52 82 Q60 74 68 82" fill="none" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/>
        <path v-else d="M54 78 Q60 84 66 78" fill="none" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { growthStageResource, petStage } from '../catalog.js';

const props = defineProps({
  petId: { type: String, required: true },
  mood: { type: String, default: 'normal' }, // normal | happy | sad
  size: { type: Number, default: 120 },
  level: { type: Number, default: 1 },        // 决定进化阶段
});

const stage = computed(() => petStage(props.level));
const src = computed(() => (
  growthStageResource(props.petId, props.level).assetPath || `/pets/${props.petId}/${stage.value}.png`
));

const imgOk = ref(true);
watch(src, () => { imgOk.value = true; });

const COLORS = {
  cat:     { body: '#f4a259', dark: '#c97b2e', cheek: '#ffd6a3' },
  dog:     { body: '#b8855b', dark: '#8a5e38', cheek: '#ffd9b8' },
  rabbit:  { body: '#f5e9e2', dark: '#cbb6a8', cheek: '#ffc2cf' },
  chick:   { body: '#ffd93b', dark: '#e0a500', cheek: '#ffb3b3' },
  fox:     { body: '#ff7a45', dark: '#d1502a', cheek: '#ffd0a3' },
  panda:   { body: '#ffffff', dark: '#2a2a2a', cheek: '#ffc2cf' },
  penguin: { body: '#2c3e50', dark: '#1a252f', cheek: '#ffb3b3' },
  dragon:  { body: '#6fcf6f', dark: '#3f9e3f', cheek: '#c4f5d3' },
  turtle:  { body: '#7fb98a', dark: '#4a7d54', cheek: '#cfe8c4' },
  goat:    { body: '#f3ede4', dark: '#b9a98f', cheek: '#ffd9c2' },
  sheep:   { body: '#fff7e8', dark: '#d8c7a7', cheek: '#ffd9c2' },
  duck:    { body: '#fff2a8', dark: '#d4a017', cheek: '#ffd6a3' },
  poop:    { body: '#9b6a3c', dark: '#6f4a26', cheek: '#c79166' },
};
const C = computed(() => COLORS[props.petId] || COLORS.cat);
</script>

<style scoped>
.pet-wrap {
  display: flex; align-items: center; justify-content: center;
  transform-origin: center bottom;
}
.pet-img { display: block; object-fit: contain; user-select: none; -webkit-user-drag: none; }
.pet { display: block; }

.pet-wrap.happy { animation: bounce 0.7s ease infinite; }
.pet-wrap.sad   { animation: droop 2.5s ease infinite; }
@keyframes bounce { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-6px) } }
@keyframes droop  { 0%,100%{ transform: rotate(0) } 50%{ transform: rotate(-2deg) translateY(2px) } }
.tear { animation: tear 2s ease infinite; }
@keyframes tear { 0%,60%{ opacity: 0 } 80%{ opacity: 1 } 100%{ opacity: 0 } }
</style>
