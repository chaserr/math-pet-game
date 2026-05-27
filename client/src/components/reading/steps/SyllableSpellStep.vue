<template>
  <!-- 阶段②·拼字（中文 syllable 变体）：把拼音 piece 按序拼成这个字的读音，无失败 -->
  <div class="syl col">
    <div class="meaning">
      <span v-if="img.type === 'emoji'" class="emoji" :class="{ celebrate: done }">{{ img.value }}</span>
      <img v-else class="pic" :src="img.src" :alt="img.alt" />
    </div>

    <!-- 拼音卡槽：按序拼出整字读音 -->
    <div class="slots">
      <div
        v-for="(slot, i) in slots"
        :key="i"
        class="slot"
        :class="{ filled: !!slot, current: i === currentSlot && !done }"
      >{{ slot ? slot.glyph : '＿' }}</div>
    </div>

    <!-- 拼好后展示完整拼音 -->
    <Transition name="fade-up">
      <p v-if="done" class="full-pinyin">{{ word.pinyin || pinyinFromUnits }}</p>
    </Transition>

    <p class="hint" :class="hintType">{{ hint }}</p>

    <!-- piece 池：声母 / 韵母乱序（含少量干扰） -->
    <div class="pool">
      <button
        v-for="p in visiblePool"
        :key="p.key"
        class="piece"
        :class="{ wrong: p.state === 'wrong' }"
        @click="tap(p)"
      >{{ p.glyph }}</button>
    </div>

    <div class="toolbar">
      <button class="btn-listen" @click="speakWhole">🔊 听这个字</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useReadingAudio } from '../../../composables/useReadingAudio.js';
import { resolveImage } from '../../../lib/reading/resources.js';
import { INITIALS_TABLE, FINALS_TABLE } from '../../../lib/pinyin-data.js';

const props = defineProps({ word: { type: Object, required: true } });
const emit = defineEmits(['complete']);

const audio = useReadingAudio();
const img = computed(() => resolveImage(props.word));

// 干扰 piece 取自真实声母 / 韵母库（pinyin-data.js）
const INITIALS = Object.values(INITIALS_TABLE).flat().map(x => x.id); // b p m f … zh ch sh …
const FINALS = Object.values(FINALS_TABLE).flat().map(x => x.id);     // a o e i u ü …

// 去声调，便于与带调答案比较（āo→ao），避免把答案混进干扰
const TONE_MAP = { ā:'a',á:'a',ǎ:'a',à:'a', ō:'o',ó:'o',ǒ:'o',ò:'o', ē:'e',é:'e',ě:'e',è:'e', ī:'i',í:'i',ǐ:'i',ì:'i', ū:'u',ú:'u',ǔ:'u',ù:'u', ǖ:'ü',ǘ:'ü',ǚ:'ü',ǜ:'ü' };
function stripTone(s) { return String(s).split('').map(c => TONE_MAP[c] || c).join(''); }

const slots = ref([]);
const pool = ref([]);
const currentSlot = ref(0);
const done = ref(false);
const hint = ref('');
const hintType = ref('');

const visiblePool = computed(() => pool.value.filter(p => p.state !== 'placed'));
const pinyinFromUnits = computed(() => props.word.units.map(u => u.glyph).join(''));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function reset() {
  const units = props.word.units || [];
  slots.value = Array(units.length).fill(null);
  currentSlot.value = 0;
  done.value = false;
  hint.value = '按顺序点出这个字的拼音～';
  hintType.value = '';

  const answer = units.map((u, idx) => ({ key: `a${idx}`, glyph: u.glyph, partIndex: idx, state: 'normal' }));
  // 去调后的答案集合，避免把正确 piece 当干扰混进来
  const answerStripped = new Set(units.map(u => stripTone(u.glyph)));
  const pickFrom = (pool) => shuffle(pool.filter(g => !answerStripped.has(stripTone(g))))[0];
  const extra = [pickFrom(INITIALS), pickFrom(FINALS)]
    .filter(Boolean)
    .map((g, i) => ({ key: `d${i}`, glyph: g, partIndex: -1, state: 'normal' }));
  pool.value = shuffle([...answer, ...extra]);

  setTimeout(speakWhole, 600);
}

function tap(p) {
  if (done.value) return;
  // 触碰反馈：用整字读音作为锚点（孤立拼音 piece 不宜单独 TTS）
  audio.playWord(props.word);

  if (p.partIndex === currentSlot.value) {
    slots.value = [
      ...slots.value.slice(0, currentSlot.value),
      { glyph: p.glyph },
      ...slots.value.slice(currentSlot.value + 1),
    ];
    setState(p, 'placed');
    currentSlot.value += 1;
    hint.value = '✓ 对啦！';
    hintType.value = 'good';
    if (currentSlot.value >= slots.value.length) complete();
  } else {
    setState(p, 'wrong');
    hint.value = '换一个试试～';
    hintType.value = 'bad';
    setTimeout(() => { if (p.state === 'wrong') setState(p, 'normal'); }, 600);
  }
}

function setState(p, state) {
  const idx = pool.value.findIndex(x => x.key === p.key);
  if (idx >= 0) pool.value[idx] = { ...pool.value[idx], state };
  p.state = state;
}

function complete() {
  done.value = true;
  hint.value = '🎉 拼对啦！';
  hintType.value = 'good';
  setTimeout(speakWhole, 200);
  setTimeout(() => emit('complete'), 1600);
}

function speakWhole() {
  audio.playWord(props.word);
}

watch(() => props.word?.id, reset);
onMounted(reset);
onBeforeUnmount(() => { /* speechSynthesis 由 usePinyinAudio 内部 cancel */ });
</script>

<style scoped>
.syl { flex: 1; align-items: center; justify-content: center; gap: 14px; padding: 18px 16px; }
.meaning .emoji { font-size: 84px; line-height: 1; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.12)); transition: transform 0.4s; }
.meaning .emoji.celebrate { animation: pop 1s ease-out; }
@keyframes pop { 0%{transform:scale(1);} 35%{transform:scale(1.28) rotate(-6deg);} 70%{transform:scale(1.15) rotate(5deg);} 100%{transform:scale(1.12);} }
.meaning .pic { width: 130px; height: 130px; object-fit: contain; }

.slots { display: flex; gap: 12px; justify-content: center; align-items: center; min-height: 76px; padding: 6px 14px; background: #fffdf6; border: 2px dashed #e8d8b8; border-radius: 18px; }
.slot { min-width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 900; color: #d8c9b3; border-radius: 14px; transition: background 0.2s; }
.slot.filled { color: #e85b5b; background: #fff0f0; }
.slot.current { background: #fff7e0; outline: 3px dashed #f0a93a; animation: blink 1.4s ease-in-out infinite; }
@keyframes blink { 0%,100%{background:#fff7e0;} 50%{background:#ffe7b8;} }

.full-pinyin { font-size: 30px; font-weight: 900; color: #e85b5b; margin: 0; letter-spacing: 1px; }

.hint { min-height: 22px; margin: 0; font-weight: 800; font-size: 14px; }
.hint.good { color: #54b85a; }
.hint.bad { color: #e85b5b; }

.pool { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; max-width: 560px; }
.piece {
  min-width: 60px; height: 60px; padding: 0 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 900; font-family: inherit;
  color: #2e7a3c; background: #eafbe8; border: 3px solid #b6e3bc; border-radius: 16px;
  box-shadow: 0 4px 0 #b6e3bc; cursor: pointer; transition: transform 0.12s;
}
.piece:hover { transform: translateY(-2px); }
.piece.wrong { animation: shake 0.4s; background: #ffe1e1; border-color: #e89a9a; box-shadow: 0 4px 0 #e89a9a; }
@keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-6px);} 75%{transform:translateX(6px);} }

.toolbar { display: flex; gap: 10px; }
.btn-listen { background: #e85b5b; color: #fff; padding: 10px 18px; border: none; border-radius: 14px; font-family: inherit; font-weight: 900; font-size: 15px; cursor: pointer; box-shadow: 0 4px 0 #c44a4a; }

.fade-up-enter-active { transition: all 0.4s; }
.fade-up-enter-from { opacity: 0; transform: translateY(8px); }
</style>
