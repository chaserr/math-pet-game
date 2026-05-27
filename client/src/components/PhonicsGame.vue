<template>
  <div class="phonics-game col">
    <!-- 顶部：含义图 + 关卡分层标签 -->
    <div class="meaning-area">
      <span class="emoji" :class="{ celebrate: phase === 'done' }">{{ word?.emoji || '✨' }}</span>
      <span v-if="tierName" class="tier-tag">{{ tierName }}</span>
    </div>

    <!-- 中部：单词槽位（按顺序排列，每槽显示已放入的字母 or 占位 '_'） -->
    <div class="slots-area">
      <div
        v-for="(slot, i) in slots"
        :key="i"
        class="slot"
        :class="{ filled: !!slot, current: i === currentSlot && phase === 'play' }"
      >
        <LetterTile
          v-if="slot"
          :letter="slot.letter"
          :phoneme="slot.phoneme"
          :silent="slot.silent"
          state="placed"
          :kind="kindOfPart(slot)"
        />
        <span v-else class="slot-blank">_</span>
      </div>
    </div>

    <!-- 完成后展示例句 -->
    <Transition name="fade-up">
      <p v-if="phase === 'done' && word?.sentence" class="sentence">
        {{ word.sentence }}
      </p>
    </Transition>

    <!-- 字母池：乱序待选 -->
    <div class="pool-area">
      <TransitionGroup name="tile-fly" tag="div" class="pool">
        <LetterTile
          v-for="tile in visiblePool"
          :key="tile.key"
          :letter="tile.letter"
          :phoneme="tile.phoneme"
          :silent="tile.silent"
          :state="tile.state"
          :kind="kindOfPart(tile)"
          @tap="onTileTap(tile)"
        />
      </TransitionGroup>
    </div>

    <!-- 工具栏：听整词 / 跳过 -->
    <div class="toolbar">
      <button class="btn-listen" :disabled="audio.isPlaying.value" @click="playWhole">
        🔊 听整词
      </button>
      <button v-if="phase === 'play'" class="btn-skip" @click="onSkip">跳过 →</button>
    </div>

    <p class="hint" :class="hintType">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import LetterTile from './LetterTile.vue';
import { usePhonicsAudio } from '../composables/usePhonicsAudio.js';
import { TIERS } from '../lib/phonics-en-bank.js';

const props = defineProps({
  word: { type: Object, required: true },   // 来自 phonics-en-bank 的 word
});
const emit = defineEmits(['correct', 'skip']);

const audio = usePhonicsAudio();

const phase   = ref('play');                  // 'play' | 'done'
const slots   = ref([]);                      // 等长于 word.parts，元素 = 已放入的 part or null
const pool    = ref([]);                      // 字母池：[{ key, letter, phoneme, silent, partIndex, state }]
const currentSlot = ref(0);                   // 下一个待填的 slot 序号
const wrongCount  = ref(0);                   // 本题错误次数（不算失败，只是埋点）
const hint   = ref('');
const hintType = ref('');                     // '' | 'good' | 'bad'

const tierName = computed(() =>
  TIERS.find(t => t.id === props.word?.tier)?.name || ''
);

const visiblePool = computed(() => pool.value.filter(t => t.state !== 'placed'));

function kindOfPart(part) {
  if (!part) return 'auto';
  if (part.silent) return 'silent';
  if (part.letter.length >= 2) return 'digraph';
  return ['a','e','i','o','u'].includes(part.letter.toLowerCase()) ? 'vowel' : 'consonant';
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resetWithWord(w) {
  if (!w) return;
  phase.value = 'play';
  slots.value = Array(w.parts.length).fill(null);
  currentSlot.value = 0;
  wrongCount.value = 0;
  hint.value = '依次点对字母，拼出这个词';
  hintType.value = '';
  // 给每个 part 加一个稳定 key，方便 TransitionGroup
  const tiles = w.parts.map((p, idx) => ({
    key: `${w.id}-${idx}`,
    letter: p.letter,
    phoneme: p.phoneme,
    silent: p.silent,
    partIndex: idx,
    state: 'normal',
  }));
  pool.value = shuffle(tiles);
  // 题目载入后稍等再朗读整词（避免 voices 尚未就绪）
  setTimeout(() => playWhole(), 700);
}

function playWhole() {
  if (!props.word) return;
  audio.speakWord(props.word.word, props.word.lang || 'en-US');
}

function playPart(tile) {
  if (tile.silent) {
    // 静默字母：用更柔和的"嘘"音示意
    audio.speakPhoneme('shh', props.word?.lang || 'en-US');
  } else {
    audio.speakPhoneme(tile.phoneme, props.word?.lang || 'en-US');
  }
}

function onTileTap(tile) {
  if (phase.value === 'done') return;
  // 短暂高亮 + 播音
  setTileState(tile, 'active');
  playPart(tile);
  setTimeout(() => { if (tile.state === 'active') setTileState(tile, 'normal'); }, 700);

  // 判断是否是"下一个正确字母"
  if (tile.partIndex === currentSlot.value) {
    // 正确：放入槽
    const placed = { ...tile, state: 'placed' };
    slots.value = [
      ...slots.value.slice(0, currentSlot.value),
      placed,
      ...slots.value.slice(currentSlot.value + 1),
    ];
    setTileState(tile, 'placed');
    currentSlot.value += 1;
    hint.value = '✓ 答对！';
    hintType.value = 'good';
    if (currentSlot.value >= slots.value.length) {
      completeWord();
    }
  } else {
    // 错误：抖一下，留在池里
    wrongCount.value += 1;
    setTileState(tile, 'wrong');
    hint.value = '换一个试试～';
    hintType.value = 'bad';
    setTimeout(() => { if (tile.state === 'wrong') setTileState(tile, 'normal'); }, 600);
  }
}

function setTileState(tile, state) {
  // 不变换 pool 引用，但要触发 reactivity：原地改即可（pool 元素本身是响应式对象成员）
  const idx = pool.value.findIndex(t => t.key === tile.key);
  if (idx >= 0) pool.value[idx] = { ...pool.value[idx], state };
  // 同步本地引用
  tile.state = state;
}

function completeWord() {
  phase.value = 'done';
  hint.value = '🎉 拼对啦！';
  hintType.value = 'good';
  // 朗读整词，再过一会儿通知外层
  setTimeout(() => playWhole(), 200);
  setTimeout(() => {
    if (props.word?.sentence) {
      audio.speakSentence(props.word.sentence, props.word.lang || 'en-US');
    }
  }, 1100);
  setTimeout(() => emit('correct', { wrongCount: wrongCount.value }), 2400);
}

function onSkip() {
  audio.cancel();
  emit('skip');
}

watch(() => props.word, (w) => resetWithWord(w), { immediate: true });

onMounted(() => {
  // 已在 watch immediate 里 reset
});

onBeforeUnmount(() => audio.cancel());
</script>

<style scoped>
.phonics-game {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 14px 16px 22px;
}

.meaning-area {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.emoji {
  font-size: 84px; line-height: 1;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.12));
  transition: transform 0.4s cubic-bezier(.3,1.4,.5,1);
}
.emoji.celebrate { animation: emoji-pop 1.1s ease-out; }
@keyframes emoji-pop {
  0%   { transform: scale(1) rotate(0); }
  30%  { transform: scale(1.3) rotate(-8deg); }
  60%  { transform: scale(1.18) rotate(6deg); }
  100% { transform: scale(1.12) rotate(0); }
}
.tier-tag {
  font-size: 12px; font-weight: 800; color: #9b8b7a;
  background: #fff5e6; padding: 3px 10px; border-radius: 999px;
  border: 1px solid #f0e0c2;
}

.slots-area {
  display: flex; gap: 10px; justify-content: center; align-items: center;
  min-height: 84px; padding: 6px 10px;
  background: #fffdf6;
  border-radius: 18px;
  border: 2px dashed #e8d8b8;
}
.slot {
  position: relative;
  min-width: 72px; height: 72px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 18px;
  transition: background 0.2s;
}
.slot.current {
  background: #fff7e0;
  outline: 3px dashed #f0a93a;
  animation: slot-blink 1.4s ease-in-out infinite;
}
@keyframes slot-blink {
  0%, 100% { background: #fff7e0; }
  50%      { background: #ffe7b8; }
}
.slot-blank {
  font-size: 38px; font-weight: 900; color: #d8c9b3; line-height: 1;
}

.sentence {
  text-align: center;
  color: #6a5848;
  font-size: 16px; font-weight: 700;
  margin: 0 8px;
  font-style: italic;
}

.pool-area {
  width: 100%;
  display: flex; justify-content: center;
}
.pool {
  display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
  max-width: 600px;
}

.toolbar {
  display: flex; gap: 10px; align-items: center;
}
.btn-listen {
  background: #3a92e0; color: #fff;
  padding: 10px 18px; border: none;
  border-radius: 14px;
  font-family: inherit; font-weight: 900; font-size: 15px;
  cursor: pointer;
  box-shadow: 0 4px 0 #2a6db0;
  transition: transform 0.12s;
}
.btn-listen:hover:not(:disabled) { transform: translateY(-2px); }
.btn-listen:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-skip {
  background: #fff; color: #9b8b7a;
  padding: 10px 16px; border: 2px solid #e8d8b8;
  border-radius: 14px;
  font-family: inherit; font-weight: 800; font-size: 13px;
  cursor: pointer;
  box-shadow: 0 3px 0 #d8c9b3;
}
.btn-skip:hover { background: #fff5e6; }

.hint {
  min-height: 22px; margin: 0;
  font-weight: 800; font-size: 14px;
  text-align: center;
}
.hint.good { color: #54b85a; }
.hint.bad  { color: #e85b5b; }

/* 字母飞入/飞出动画 */
.tile-fly-move { transition: transform 0.35s cubic-bezier(.3,1.4,.5,1); }
.tile-fly-enter-active { transition: all 0.3s; }
.tile-fly-leave-active { transition: all 0.4s; position: absolute; }
.tile-fly-enter-from { opacity: 0; transform: translateY(20px) scale(0.6); }
.tile-fly-leave-to { opacity: 0; transform: translateY(-30px) scale(0.4); }

.fade-up-enter-active { transition: all 0.4s; }
.fade-up-enter-from   { opacity: 0; transform: translateY(8px); }
</style>
