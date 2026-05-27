<template>
  <!-- 阶段①·亮相：含义图 + 单元小卡片飞入，点哪个发哪个音，建立好奇与音义初印象 -->
  <div class="reveal col">
    <div class="meaning">
      <span v-if="img.type === 'emoji'" class="emoji">{{ img.value }}</span>
      <img v-else class="pic" :src="img.src" :alt="img.alt" />
    </div>

    <p class="lead">点点每个字，听听它们的声音～</p>

    <TransitionGroup name="pop-in" tag="div" class="units">
      <button
        v-for="(u, i) in word.units"
        :key="word.id + '-' + i"
        class="unit"
        :class="{ silent: u.silent, lit: litIndex === i }"
        :style="{ animationDelay: (i * 0.12) + 's' }"
        @click="tapUnit(u, i)"
      >{{ u.glyph }}</button>
    </TransitionGroup>

    <button class="btn-go" @click="emitDone">开始拼一拼 →</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useReadingAudio } from '../../../composables/useReadingAudio.js';
import { resolveImage } from '../../../lib/reading/resources.js';

const props = defineProps({ word: { type: Object, required: true } });
const emit = defineEmits(['complete']);

const audio = useReadingAudio();
const img = computed(() => resolveImage(props.word));
const litIndex = ref(-1);

function tapUnit(u, i) {
  litIndex.value = i;
  audio.playUnit(props.word, i);
  setTimeout(() => { if (litIndex.value === i) litIndex.value = -1; }, 600);
}

function emitDone() {
  audio.cancel();
  emit('complete');
}

onMounted(() => {
  // 单元飞入完成后朗读整词，给孩子一个"它念什么"的预期
  setTimeout(() => audio.playWord(props.word), 700);
});
onBeforeUnmount(() => audio.cancel());
</script>

<style scoped>
.reveal { align-items: center; gap: 16px; padding: 18px 16px; flex: 1; justify-content: center; }
.meaning { display: flex; align-items: center; justify-content: center; }
.emoji { font-size: 96px; line-height: 1; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.12)); }
.pic { width: 140px; height: 140px; object-fit: contain; }
.lead { color: #9b8b7a; font-weight: 800; font-size: 15px; margin: 0; }

.units { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; max-width: 560px; }
.unit {
  min-width: 64px; height: 64px; padding: 0 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 34px; font-weight: 900; font-family: inherit;
  color: #3a6ea5; background: #eaf4ff;
  border: 3px solid #b9dcff; border-radius: 16px;
  box-shadow: 0 4px 0 #b9dcff; cursor: pointer;
  transition: transform 0.12s, background 0.2s;
}
.unit:hover { transform: translateY(-2px); }
.unit.silent { color: #b9a892; background: #f4efe6; border-color: #e2d5bf; box-shadow: 0 4px 0 #e2d5bf; }
.unit.lit { background: #ffe7b8; border-color: #f0a93a; box-shadow: 0 4px 0 #f0a93a; transform: scale(1.12); }

.btn-go {
  margin-top: 6px; background: #54b85a; color: #fff;
  padding: 13px 30px; font-family: inherit; font-weight: 900; font-size: 17px;
  border: none; border-radius: 16px; box-shadow: 0 5px 0 #3d9a43; cursor: pointer;
  transition: transform 0.12s;
}
.btn-go:hover { transform: translateY(-2px); }

.pop-in-enter-active { transition: all 0.4s cubic-bezier(.34,1.56,.64,1); }
.pop-in-enter-from { opacity: 0; transform: translateY(24px) scale(0.4); }
</style>
