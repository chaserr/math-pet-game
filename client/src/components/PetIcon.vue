<template>
  <div class="pi" :class="{ locked }" :style="{ width: size + 'px', height: size + 'px' }">
    <img
      v-if="iconSrc && imgOk"
      class="pi-img"
      :src="iconSrc"
      :width="size"
      :height="size"
      :alt="petId"
      draggable="false"
      @error="imgOk = false"
    />
    <!-- 缺图回退：在圆框里塞 PetSprite -->
    <div v-else class="pi-fallback center">
      <PetSprite :pet-id="petId" :level="level" :size="Math.round(size * 0.86)" mood="normal" />
    </div>
    <span v-if="badge !== null" class="pi-badge" :style="{ background: badgeColor }">{{ badge }}</span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import PetSprite from './PetSprite.vue';
import { growthStageResource, petStage, STAGE_COLORS } from '../catalog.js';

const props = defineProps({
  petId: { type: String, required: true },
  level: { type: Number, default: 1 },
  size: { type: Number, default: 64 },
  locked: { type: Boolean, default: false },
  badge: { type: [String, Number, null], default: null },
});

const stage = computed(() => petStage(props.level));
const iconSrc = computed(() => growthStageResource(props.petId, props.level).iconAsset);
const badgeColor = computed(() => STAGE_COLORS[stage.value] || '#cfb993');

const imgOk = ref(true);
watch(iconSrc, () => { imgOk.value = true; });
</script>

<style scoped>
.pi {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  background: #fff7e8;
  box-shadow: 0 4px 10px rgba(80, 50, 20, 0.2), inset 0 0 0 2px #fff;
  flex-shrink: 0;
}
.pi.locked { filter: grayscale(0.9) brightness(0.85); opacity: 0.55; }
.pi-img { display: block; object-fit: cover; user-select: none; -webkit-user-drag: none; }
.pi-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }

.pi-badge {
  position: absolute; right: -2px; bottom: -2px;
  min-width: 22px; height: 22px; padding: 0 6px;
  border-radius: 999px; background: #f0a93a; color: #fff;
  font-size: 12px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.25), 0 0 0 2px #fffdf6;
}
</style>
