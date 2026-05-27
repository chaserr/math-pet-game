<template>
  <!-- 阶段②·拼词：phonics 变体复用成熟的 PhonicsGame（点字母→发音→入槽，无失败） -->
  <div class="spell col">
    <PhonicsGame
      v-if="variant === 'phonics'"
      :word="phonicsWord"
      @correct="onDone"
      @skip="onDone"
    />

    <!-- 中文拼字：拼拼音 piece 成字 -->
    <SyllableSpellStep
      v-else-if="variant === 'syllable'"
      :word="word"
      @complete="onDone"
    />

    <!-- 未知变体：优雅兜底，引擎不中断 -->
    <div v-else class="todo col">
      <span class="emoji">{{ word.image?.value || '🧩' }}</span>
      <p class="big">{{ word.text }}</p>
      <p class="tip">这个语言的「拼一拼」玩法马上就来啦～</p>
      <button class="btn-go" @click="onDone">继续 →</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import PhonicsGame from '../../PhonicsGame.vue';
import SyllableSpellStep from './SyllableSpellStep.vue';
import { toPhonicsWord } from '../../../lib/reading/packs.js';

const props = defineProps({
  word: { type: Object, required: true },
  // 拼词变体：来自 pack.spell（'phonics' | 'syllable' | ...）
  variant: { type: String, default: 'phonics' },
});
const emit = defineEmits(['complete']);

const phonicsWord = computed(() => toPhonicsWord(props.word));

function onDone() { emit('complete'); }
</script>

<style scoped>
.spell { flex: 1; }
.todo { flex: 1; align-items: center; justify-content: center; gap: 14px; padding: 24px; }
.todo .emoji { font-size: 88px; }
.todo .big { font-size: 40px; font-weight: 900; color: var(--ink, #5a4836); margin: 0; }
.todo .tip { color: #9b8b7a; font-weight: 800; }
.btn-go {
  background: #54b85a; color: #fff; padding: 12px 28px;
  font-family: inherit; font-weight: 900; font-size: 16px;
  border: none; border-radius: 16px; box-shadow: 0 5px 0 #3d9a43; cursor: pointer;
}
</style>
