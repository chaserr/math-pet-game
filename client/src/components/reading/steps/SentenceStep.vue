<template>
  <!-- 阶段④·入句：把目标词送回句子里。点错只弹回，无惩罚；填对后朗读整句 -->
  <div class="sentence col">
    <div class="meaning">
      <span v-if="img.type === 'emoji'" class="emoji" :class="{ pop: filled }">{{ img.value }}</span>
      <img v-else class="pic" :src="img.src" :alt="img.alt" />
      <!-- 填对后的彩纸庆祝 -->
      <div v-if="filled" class="confetti">
        <span v-for="i in 10" :key="i" class="c" :style="confettiStyle(i)"></span>
      </div>
    </div>

    <p class="lead">{{ filled ? '读一读这句话～' : '把小词送回句子里' }}</p>

    <!-- 句子：挖空处用插槽，其余原样 -->
    <p class="sent" @click="filled && speakSentence()">
      <span>{{ parts.before }}</span>
      <template v-if="parts.hasBlank">
        <span class="blank" :class="{ filled }">{{ filled ? word.text : '＿＿' }}</span>
        <span>{{ parts.after }}</span>
      </template>
    </p>

    <!-- 词卡候选（仅未填时显示） -->
    <div v-if="parts.hasBlank && !filled" class="chips">
      <button
        v-for="c in chips"
        :key="c.text"
        class="chip"
        :class="{ wrong: wrongChip === c.text }"
        @click="pick(c)"
      >{{ c.text }}</button>
    </div>

    <button v-if="canFinish" class="btn-go" @click="emitDone">完成这个词 🎉</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useReadingAudio } from '../../../composables/useReadingAudio.js';
import { resolveImage } from '../../../lib/reading/resources.js';

const props = defineProps({
  word: { type: Object, required: true },
  distractors: { type: Array, default: () => [] }, // 来自同词包其它词的 text
});
const emit = defineEmits(['complete']);

const audio = useReadingAudio();
const img = computed(() => resolveImage(props.word));
const filled = ref(false);
const wrongChip = ref('');

const focus = computed(() => props.word.sentence?.focus || props.word.text);
const sentenceText = computed(() => props.word.sentence?.text || props.word.text);

// 在句子里定位目标词，拆成 before / [blank] / after
const parts = computed(() => {
  const text = sentenceText.value;
  const f = focus.value;
  const idx = text.toLowerCase().indexOf(String(f).toLowerCase());
  if (idx < 0) return { hasBlank: false, before: text, after: '' };
  return { hasBlank: true, before: text.slice(0, idx), after: text.slice(idx + f.length) };
});

// 没有挖空（句中找不到目标词）时直接可完成
const canFinish = computed(() => !parts.value.hasBlank || filled.value);

const chips = computed(() => {
  const pool = [{ text: props.word.text, correct: true }];
  props.distractors.slice(0, 2).forEach(t => pool.push({ text: t, correct: false }));
  return shuffle(pool);
});

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(c) {
  if (filled.value) return;
  if (c.correct) {
    filled.value = true;
    setTimeout(speakSentence, 250);
  } else {
    wrongChip.value = c.text;
    audio.speakText(c.text, props.word.lang);
    setTimeout(() => { if (wrongChip.value === c.text) wrongChip.value = ''; }, 600);
  }
}

const CONFETTI_COLORS = ['#f0a93a', '#e85b5b', '#54b85a', '#3a92e0', '#9b5cd6', '#e8529a'];
function confettiStyle(i) {
  const angle = (i / 10) * 360;
  const dist = 70 + (i % 3) * 18;
  return {
    '--cx': Math.round(Math.cos(angle * Math.PI / 180) * dist) + 'px',
    '--cy': Math.round(Math.sin(angle * Math.PI / 180) * dist) + 'px',
    background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    animationDelay: (i % 5) * 0.03 + 's',
  };
}

function speakSentence() {
  audio.playSentence(props.word);
}
function emitDone() { audio.cancel(); emit('complete'); }

onMounted(() => {
  // 无挖空时直接读整句；有挖空则等孩子先填
  if (!parts.value.hasBlank) setTimeout(speakSentence, 300);
});
onBeforeUnmount(() => audio.cancel());
</script>

<style scoped>
.sentence { flex: 1; align-items: center; justify-content: center; gap: 16px; padding: 22px 18px; }
.meaning { position: relative; }
.meaning .emoji { font-size: 72px; line-height: 1; transition: transform 0.3s; }
.meaning .emoji.pop { animation: emoji-pop 0.6s ease-out; }
@keyframes emoji-pop { 0%{transform:scale(1);} 40%{transform:scale(1.3) rotate(-8deg);} 70%{transform:scale(1.15) rotate(6deg);} 100%{transform:scale(1.12);} }
.meaning .pic { width: 110px; height: 110px; object-fit: contain; }
.confetti { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.confetti .c { position: absolute; width: 10px; height: 10px; border-radius: 2px; opacity: 0; animation: burst 0.8s ease-out forwards; }
@keyframes burst {
  0% { opacity: 1; transform: translate(0,0) scale(1) rotate(0); }
  100% { opacity: 0; transform: translate(var(--cx), var(--cy)) scale(0.3) rotate(220deg); }
}
.lead { color: #9b8b7a; font-weight: 800; font-size: 15px; margin: 0; }

.sent {
  font-size: 24px; font-weight: 800; color: var(--ink, #5a4836);
  text-align: center; line-height: 1.7; margin: 0; max-width: 640px;
  cursor: pointer;
}
.blank {
  display: inline-block; min-width: 64px; padding: 0 10px;
  color: #d8c9b3; border-bottom: 4px solid #f0a93a;
}
.blank.filled { color: #54b85a; background: #eafbe8; border-radius: 8px; border-bottom-color: #54b85a; }

.chips { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
.chip {
  font-size: 22px; font-weight: 900; font-family: inherit;
  color: #3a6ea5; background: #eaf4ff; border: 3px solid #b9dcff;
  padding: 10px 22px; border-radius: 14px; box-shadow: 0 4px 0 #b9dcff;
  cursor: pointer; transition: transform 0.12s;
}
.chip:hover { transform: translateY(-2px); }
.chip.wrong { animation: shake 0.4s; background: #ffe1e1; border-color: #e89a9a; box-shadow: 0 4px 0 #e89a9a; }
@keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-6px);} 75%{transform:translateX(6px);} }

.btn-go {
  margin-top: 4px; background: #f0a93a; color: #fff;
  padding: 13px 30px; font-family: inherit; font-weight: 900; font-size: 17px;
  border: none; border-radius: 16px; box-shadow: 0 5px 0 #cf8c25; cursor: pointer;
  transition: transform 0.12s;
}
.btn-go:hover { transform: translateY(-2px); }
</style>
