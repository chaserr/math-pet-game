<template>
  <!-- 阶段③·读词：含义图 + 整词放大，自动朗读，点击复读，音义绑定 -->
  <div class="say col">
    <div class="card" :class="{ pulse }" @click="play">
      <span v-if="img.type === 'emoji'" class="emoji">{{ img.value }}</span>
      <img v-else class="pic" :src="img.src" :alt="img.alt" />
      <p class="word">{{ word.text }}</p>
      <p v-if="word.pinyin" class="pinyin">{{ word.pinyin }}</p>
      <span class="speaker">🔊 点我再读一遍</span>
    </div>
    <button class="btn-go" @click="emitDone">认识啦 →</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { usePhonicsAudio } from '../../../composables/usePhonicsAudio.js';
import { resolveImage } from '../../../lib/reading/resources.js';

const props = defineProps({ word: { type: Object, required: true } });
const emit = defineEmits(['complete']);

const audio = usePhonicsAudio();
const img = computed(() => resolveImage(props.word));
const pulse = ref(false);

function play() {
  pulse.value = true;
  audio.speakWord(props.word.text, props.word.lang);
  setTimeout(() => { pulse.value = false; }, 500);
}
function emitDone() { audio.cancel(); emit('complete'); }

onMounted(() => setTimeout(play, 300));
onBeforeUnmount(() => audio.cancel());
</script>

<style scoped>
.say { flex: 1; align-items: center; justify-content: center; gap: 20px; padding: 24px; }
.card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: #fffdf6; border: 3px solid #ffe0a8; border-radius: 24px;
  padding: 26px 40px; box-shadow: 0 6px 0 #f0d99a; cursor: pointer;
  transition: transform 0.18s;
}
.card:hover { transform: translateY(-3px); }
.card.pulse { animation: pop 0.5s ease-out; }
@keyframes pop { 0%{transform:scale(1);} 40%{transform:scale(1.06);} 100%{transform:scale(1);} }
.emoji { font-size: 92px; line-height: 1; }
.pic { width: 130px; height: 130px; object-fit: contain; }
.word { font-size: 46px; font-weight: 900; color: var(--ink, #5a4836); margin: 4px 0 0; letter-spacing: 1px; }
.pinyin { font-size: 22px; font-weight: 800; color: #e85b5b; margin: 0; }
.speaker { font-size: 13px; font-weight: 800; color: #b9a892; }
.btn-go {
  background: #54b85a; color: #fff; padding: 13px 30px;
  font-family: inherit; font-weight: 900; font-size: 17px;
  border: none; border-radius: 16px; box-shadow: 0 5px 0 #3d9a43; cursor: pointer;
  transition: transform 0.12s;
}
.btn-go:hover { transform: translateY(-2px); }
</style>
