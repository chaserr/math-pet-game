<template>
  <div class="player col">
    <!-- 进度点：管线各阶段 -->
    <div class="steps">
      <span
        v-for="(t, i) in steps"
        :key="t + i"
        class="dot"
        :class="{ active: i === index, done: i < index }"
        :title="META[t]?.label"
      >{{ META[t]?.icon }}</span>
    </div>

    <!-- 当前阶段组件（统一契约：props.word + emit('complete')） -->
    <component
      :is="current.comp"
      v-bind="current.props"
      :key="word.id + '-' + index"
      @complete="next"
    />

    <!-- 陪读宠物：跟随阶段给鼓励 -->
    <div class="companion-slot">
      <ReadingCompanion :pet-id="companionPetId" :level="companionLevel" :mood="mood" :line="cheer" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { pipelineForPack, STEP, STEP_META } from '../../lib/reading/pipeline.js';
import RevealStep from './steps/RevealStep.vue';
import SpellStep from './steps/SpellStep.vue';
import SayStep from './steps/SayStep.vue';
import SentenceStep from './steps/SentenceStep.vue';
import ReadingCompanion from './ReadingCompanion.vue';

const props = defineProps({
  word: { type: Object, required: true },
  pack: { type: Object, required: true },
  companionPetId: { type: String, default: 'cat' },
  companionLevel: { type: Number, default: 1 },
});
const emit = defineEmits(['finished']);

// 陪读宠物的情绪 + 鼓励气泡
const mood = ref('normal');
const cheer = ref('');
const STEP_CHEER = {
  [STEP.REVEAL]: '我们一起看看这个词吧！',
  [STEP.SPELL]: '试试把它拼出来～',
  [STEP.SAY]: '大声读出来！',
  [STEP.SENTENCE]: '把它放进句子里吧！',
};

const META = STEP_META;

// 阶段类型 → 组件 注册表。加新玩法 = 在此注册一个组件。
const REGISTRY = {
  [STEP.REVEAL]: RevealStep,
  [STEP.SPELL]: SpellStep,
  [STEP.SAY]: SayStep,
  [STEP.SENTENCE]: SentenceStep,
};

const steps = computed(() => pipelineForPack(props.pack).filter(t => REGISTRY[t]));
const index = ref(0);

// 给 SentenceStep 提供同词包的干扰词
const distractors = computed(() =>
  (props.pack.words || [])
    .filter(w => w.id !== props.word.id)
    .map(w => w.text)
    .slice(0, 4)
);

const current = computed(() => {
  const t = steps.value[index.value];
  const comp = REGISTRY[t];
  const extra = {};
  if (t === STEP.SPELL) extra.variant = props.pack.spell || 'phonics';
  if (t === STEP.SENTENCE) extra.distractors = distractors.value;
  return { comp, props: { word: props.word, ...extra } };
});

function setCheerForStage() {
  cheer.value = STEP_CHEER[steps.value[index.value]] || '';
}

function react() {
  mood.value = 'happy';
  setTimeout(() => { mood.value = 'normal'; }, 1000);
}

function next() {
  if (index.value < steps.value.length - 1) {
    index.value += 1;
    react();
    setCheerForStage();
  } else {
    mood.value = 'happy';
    emit('finished', props.word);
  }
}

// 换词时重置到第一阶段
watch(() => props.word?.id, () => { index.value = 0; mood.value = 'normal'; setCheerForStage(); }, { immediate: true });
</script>

<style scoped>
.player { flex: 1; align-items: stretch; position: relative; }
.steps { display: flex; gap: 10px; justify-content: center; padding: 12px 0 4px; }
.dot {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; background: #f0e6d8; opacity: 0.5; transition: all 0.25s;
}
.dot.active { opacity: 1; background: #fff3d6; outline: 3px solid #f0a93a; transform: scale(1.12); }
.dot.done { opacity: 1; background: #eafbe8; }

.companion-slot { position: absolute; left: 18px; bottom: 18px; z-index: 3; pointer-events: none; }
@media (max-width: 560px) { .companion-slot { left: 8px; bottom: 8px; transform: scale(0.8); transform-origin: left bottom; } }
</style>
